package handlers

import (
	"bytes"
	"context"
	"crypto/tls"
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/acme/autocert"
	"golang.org/x/oauth2"

	gh "github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	lru "github.com/hashicorp/golang-lru"
	"github.com/play-with-docker/play-with-docker/config"
	"github.com/play-with-docker/play-with-docker/event"
	"github.com/play-with-docker/play-with-docker/pwd"
	"github.com/play-with-docker/play-with-docker/pwd/types"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/urfave/negroni"
	oauth2Github "golang.org/x/oauth2/github"
	oauth2Google "golang.org/x/oauth2/google"
	"google.golang.org/api/people/v1"
)

var (
	core     pwd.PWDApi
	e        event.EventApi
	landings = map[string][]byte{}
)

//go:embed www/*
var embeddedFiles embed.FS

var staticFiles fs.FS

var latencyHistogramVec = prometheus.NewHistogramVec(prometheus.HistogramOpts{
	Name:    "pwd_handlers_duration_ms",
	Help:    "How long it took to process a specific handler, in a specific host",
	Buckets: []float64{300, 1200, 5000},
}, []string{"action"})

type HandlerExtender func(h *mux.Router)

func init() {
	prometheus.MustRegister(latencyHistogramVec)
	staticFiles, _ = fs.Sub(embeddedFiles, "www")
}

func Bootstrap(c pwd.PWDApi, ev event.EventApi) {
	core = c
	e = ev
}

func Register(extend HandlerExtender) {
	initPlaygrounds()

	r := mux.NewRouter()
	corsRouter := mux.NewRouter()

	corsHandler := gh.CORS(gh.AllowCredentials(), gh.AllowedHeaders([]string{"x-requested-with", "content-type"}), gh.AllowedMethods([]string{"GET", "POST", "HEAD", "DELETE"}), gh.AllowedOriginValidator(func(origin string) bool {
		if strings.HasSuffix(origin, ".play-with-docker.com") ||
			strings.HasSuffix(origin, ".play-with-kubernetes.com") ||
			strings.HasSuffix(origin, ".docker.com") ||
			strings.HasSuffix(origin, ".play-with-go.dev") {
			return true
		}
		return false
	}), gh.AllowedOrigins([]string{}))

	// Serve favicon from React build
	r.HandleFunc("/favicon.ico", func(rw http.ResponseWriter, req *http.Request) {
		serveAsset(rw, req, "react/favicon.ico")
	})

	// Specific routes
	r.HandleFunc("/ping", Ping).Methods("GET")
	corsRouter.HandleFunc("/instances/images", GetInstanceImages).Methods("GET")
	corsRouter.HandleFunc("/sessions/{sessionId}", GetSession).Methods("GET")
	corsRouter.HandleFunc("/sessions/{sessionId}/close", CloseSession).Methods("POST")
	corsRouter.HandleFunc("/sessions/{sessionId}", CloseSession).Methods("DELETE")
	corsRouter.HandleFunc("/sessions/{sessionId}/setup", SessionSetup).Methods("POST")
	corsRouter.HandleFunc("/sessions/{sessionId}/instances", NewInstance).Methods("POST")
	corsRouter.HandleFunc("/sessions/{sessionId}/instances/{instanceName}/uploads", FileUpload).Methods("POST")
	corsRouter.HandleFunc("/sessions/{sessionId}/instances/{instanceName}", DeleteInstance).Methods("DELETE")
	corsRouter.HandleFunc("/sessions/{sessionId}/instances/{instanceName}/exec", Exec).Methods("POST")
	corsRouter.HandleFunc("/sessions/{sessionId}/instances/{instanceName}/fstree", fsTree).Methods("GET")
	corsRouter.HandleFunc("/sessions/{sessionId}/instances/{instanceName}/file", file).Methods("GET")

	// Editor route - serve React static file (catch-all route)
	r.HandleFunc("/sessions/{sessionId}/instances/{instanceName}/editor", func(rw http.ResponseWriter, req *http.Request) {
		// Try React editor page first (catch-all generates placeholder path)
		reactEditor, err := fs.ReadFile(staticFiles, filepath.Join("react", "sessions", "placeholder", "instances", "placeholder", "editor", "index.html"))
		if err != nil {
			// Fallback to old editor.html
			serveAsset(rw, req, "editor.html")
			return
		}
		rw.Write(reactEditor)
	})

	r.HandleFunc("/ooc", func(rw http.ResponseWriter, r *http.Request) {
		serveAsset(rw, r, "ooc.html")
	}).Methods("GET")
	r.HandleFunc("/503", func(rw http.ResponseWriter, r *http.Request) {
		serveAsset(rw, r, "503.html")
	}).Methods("GET")
	r.HandleFunc("/p/{sessionId}", Home).Methods("GET")
	
	r.PathPrefix("/assets").HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		serveAsset(rw, r, r.URL.Path[1:])
	})
	r.HandleFunc("/robots.txt", func(rw http.ResponseWriter, r *http.Request) {
		serveAsset(rw, r, "robots.txt")
	})

	corsRouter.HandleFunc("/sessions/{sessionId}/ws/", WSH)
	r.Handle("/metrics", promhttp.Handler())

	// Landing page - try React first, then fallback
	r.HandleFunc("/", func(rw http.ResponseWriter, req *http.Request) {
		// Try React index.html
		reactIndex, err := fs.ReadFile(staticFiles, "react/index.html")
		if err != nil {
			// Fallback to old landing page
			Landing(rw, req)
			return
		}
		rw.Write(reactIndex)
	}).Methods("GET")

	corsRouter.HandleFunc("/users/me", LoggedInUser).Methods("GET")
	corsRouter.HandleFunc("/users/nickname", NicknameLogin).Methods("POST")
	r.HandleFunc("/users/{userId:.{3,}}", GetUser).Methods("GET")
	r.HandleFunc("/oauth/providers", ListProviders).Methods("GET")
	r.HandleFunc("/oauth/providers/{provider}/login", Login).Methods("GET")
	r.HandleFunc("/oauth/providers/{provider}/callback", LoginCallback).Methods("GET")
	r.HandleFunc("/playgrounds", NewPlayground).Methods("PUT")
	r.HandleFunc("/playgrounds", ListPlaygrounds).Methods("GET")
	r.HandleFunc("/my/playground", GetCurrentPlayground).Methods("GET")

	corsRouter.HandleFunc("/", NewSession).Methods("POST")

	if extend != nil {
		extend(corsRouter)
	}

	n := negroni.Classic()

	// Serve React static files (_next directory) - MUST be before catch-all route
	// This handles /_next/static/chunks/..., /_next/static/media/..., etc.
	r.PathPrefix("/_next").HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
		// Path like /_next/static/chunks/... -> react/_next/static/chunks/...
		path := strings.TrimPrefix(req.URL.Path, "/")
		serveAsset(rw, req, filepath.Join("react", path))
	})

	r.PathPrefix("/").Handler(negroni.New(negroni.Wrap(corsHandler(corsRouter))))
	n.UseHandler(r)

	httpServer := http.Server{
		Addr:              "0.0.0.0:" + config.PortNumber,
		Handler:           n,
		IdleTimeout:       30 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
	}

	if config.UseLetsEncrypt {
		domainCache, err := lru.New(5000)
		if err != nil {
			log.Fatalf("Could not start domain cache. Got: %v", err)
		}
		certManager := autocert.Manager{
			Prompt: autocert.AcceptTOS,
			HostPolicy: func(ctx context.Context, host string) error {
				if _, found := domainCache.Get(host); !found {
					if playground := core.PlaygroundFindByDomain(host); playground == nil {
						return fmt.Errorf("Playground for domain %s was not found", host)
					}
					domainCache.Add(host, true)
				}
				return nil
			},
			Cache: autocert.DirCache(config.LetsEncryptCertsDir),
		}

		httpServer.TLSConfig = &tls.Config{
			GetCertificate: certManager.GetCertificate,
		}

		go func() {
			rr := mux.NewRouter()
			rr.HandleFunc("/ping", Ping).Methods("GET")
			rr.Handle("/metrics", promhttp.Handler())
			rr.HandleFunc("/", func(rw http.ResponseWriter, r *http.Request) {
				target := fmt.Sprintf("https://%s%s", r.Host, r.URL.Path)
				if len(r.URL.RawQuery) > 0 {
					target += "?" + r.URL.RawQuery
				}
				http.Redirect(rw, r, target, http.StatusMovedPermanently)
			})
			nr := negroni.Classic()
			nr.UseHandler(rr)
			log.Println("Starting redirect server")
			redirectServer := http.Server{
				Addr:              "0.0.0.0:3001",
				Handler:           certManager.HTTPHandler(nr),
				IdleTimeout:       30 * time.Second,
				ReadHeaderTimeout: 5 * time.Second,
			}
			log.Fatal(redirectServer.ListenAndServe())
		}()

		log.Println("Listening on port " + config.PortNumber)
		log.Fatal(httpServer.ListenAndServeTLS("", ""))
	} else {
		log.Println("Listening on port " + config.PortNumber)
		log.Fatal(httpServer.ListenAndServe())
	}
}

func serveAsset(w http.ResponseWriter, r *http.Request, name string) {
	a, err := fs.ReadFile(staticFiles, name)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	http.ServeContent(w, r, name, time.Time{}, bytes.NewReader(a))
}

func initPlaygrounds() {
	pgs, err := core.PlaygroundList()
	if err != nil {
		log.Fatal("Error getting playgrounds for initialization")
	}

	for _, p := range pgs {
		initAssets(p)
		initOauthProviders(p)
	}
}

func initAssets(p *types.Playground) {
	if p.AssetsDir == "" {
		p.AssetsDir = "default"
	}

	lpath := path.Join(p.AssetsDir, "landing.html")
	landing, err := fs.ReadFile(staticFiles, lpath)
	if err != nil {
		log.Printf("Could not load %v: %v", lpath, err)
		return
	}

	var b bytes.Buffer
	t := template.New("landing.html").Delims("[[", "]]")
	t, err = t.Parse(string(landing))
	if err != nil {
		log.Fatalf("Error parsing template %v", err)
	}
	if err := t.Execute(&b, struct{ SegmentId string }{config.SegmentId}); err != nil {
		log.Fatalf("Error executing template %v", err)
	}
	landingBytes, err := ioutil.ReadAll(&b)
	if err != nil {
		log.Fatalf("Error reading template bytes %v", err)
	}
	landings[p.Id] = landingBytes
}

func initOauthProviders(p *types.Playground) {
	config.Providers[p.Id] = map[string]*oauth2.Config{}

	if p.GithubClientID != "" && p.GithubClientSecret != "" {
		conf := &oauth2.Config{
			ClientID:     p.GithubClientID,
			ClientSecret: p.GithubClientSecret,
			Scopes:       []string{"user:email"},
			Endpoint:     oauth2Github.Endpoint,
		}

		config.Providers[p.Id]["github"] = conf
	}
	if p.GoogleClientID != "" && p.GoogleClientSecret != "" {
		conf := &oauth2.Config{
			ClientID:     p.GoogleClientID,
			ClientSecret: p.GoogleClientSecret,
			Scopes:       []string{people.UserinfoEmailScope, people.UserinfoProfileScope},
			Endpoint:     oauth2Google.Endpoint,
		}

		config.Providers[p.Id]["google"] = conf
	}
	if p.DockerClientID != "" && p.DockerClientSecret != "" {

		endpoint := getDockerEndpoint(p)
		conf := &oauth2.Config{
			ClientID:     p.DockerClientID,
			ClientSecret: p.DockerClientSecret,
			Scopes:       []string{"openid", "full_access:account"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  fmt.Sprintf("https://%s/authorize/", endpoint),
				TokenURL: fmt.Sprintf("https://%s/oauth/token", endpoint),
			},
		}

		config.Providers[p.Id]["docker"] = conf
	}
	if p.AuthentikClientID != "" && p.AuthentikClientSecret != "" && p.AuthentikHost != "" {
		endpoint := p.AuthentikHost
		// Remove trailing slash if present
		if strings.HasSuffix(endpoint, "/") {
			endpoint = endpoint[:len(endpoint)-1]
		}

		conf := &oauth2.Config{
			ClientID:     p.AuthentikClientID,
			ClientSecret: p.AuthentikClientSecret,
			Scopes:       []string{"openid", "profile", "email"},
			Endpoint: oauth2.Endpoint{
				AuthURL:  fmt.Sprintf("%s/application/o/authorize/", endpoint),
				TokenURL: fmt.Sprintf("%s/application/o/token/", endpoint),
			},
		}

		config.Providers[p.Id]["authentik"] = conf
	}
}
