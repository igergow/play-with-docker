package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/play-with-docker/play-with-docker/pwd/types"
	uuid "github.com/satori/go.uuid"
)

type NicknameLoginRequest struct {
	Nickname string `json:"nickname"`
}

func NicknameLogin(rw http.ResponseWriter, req *http.Request) {
	var request NicknameLoginRequest

	if err := json.NewDecoder(req.Body).Decode(&request); err != nil {
		log.Printf("Could not decode nickname login request. Got: %v\n", err)
		rw.WriteHeader(http.StatusBadRequest)
		return
	}

	if request.Nickname == "" {
		rw.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(rw).Encode(map[string]string{"error": "nickname is required"})
		return
	}

	// Create user with nickname provider
	// First check if user already exists with this nickname
	providerUserId := uuid.NewV4().String()
	user := &types.User{
		Id:            uuid.NewV4().String(),
		Provider:      "nickname",
		ProviderUserId: providerUserId,
		Name:          request.Nickname,
		Email:         "",
		Avatar:        "",
	}

	// Use UserLogin pattern to create or get existing user
	loginRequest := &types.LoginRequest{
		Id:       uuid.NewV4().String(),
		Provider: "nickname",
	}

	user, err := core.UserLogin(loginRequest, user)
	if err != nil {
		log.Printf("Could not login nickname user. Got: %v\n", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Set cookie
	cookieData := CookieID{
		Id:         user.Id,
		UserName:   user.Name,
		UserAvatar: user.Avatar,
		ProviderId: user.ProviderUserId,
	}

	host := "localhost"
	if req.Host != "" {
		host = getParentDomain(req.Host)
	}

	if err := cookieData.SetCookie(rw, host); err != nil {
		log.Printf("Could not encode cookie. Got: %v\n", err)
		rw.WriteHeader(http.StatusInternalServerError)
		return
	}

	json.NewEncoder(rw).Encode(user)
}

