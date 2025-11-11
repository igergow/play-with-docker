# 🎯 Play with Kubernetes Guide

Play with Docker поддържа създаване на Kubernetes cluster instances за експериментиране и обучение.

## 🛠️ Подготовка

### 1. Билдни Kubernetes Image (за ARM64)

```bash
cd dockerfiles/k8s
docker build -f Dockerfile.arm64 -t pwd-k8s:arm64 .
cd ../..
```

### 2. Конфигурирай приложението

За да активираш Kubernetes support, трябва да добавиш k8s provisioner във фабриката.

Редактирай `api.go`:

```go
// В initK8sFactory() функцията
ipf := provisioner.NewInstanceProvisionerFactory(
    provisioner.NewWindowsASG(df, s), 
    provisioner.NewDinD(id.XIDGenerator{}, df, s),
    // Добави k8s provisioner
)
```

### 3. Създай Kubernetes Instance

Има два начина да създадеш Kubernetes instance:

#### A. Чрез API (curl)

```bash
# Създай нова сесия
SESSION_ID=$(curl -XPOST http://localhost:3000/sessions | jq -r .session_id)

# Създай k8s master node
curl -XPOST http://localhost:3000/sessions/$SESSION_ID/instances \
  -H "Content-Type: application/json" \
  -d '{
    "type": "k8s",
    "hostname": "master1",
    "image": "pwd-k8s:arm64"
  }'

# Създай k8s worker nodes
curl -XPOST http://localhost:3000/sessions/$SESSION_ID/instances \
  -H "Content-Type: application/json" \
  -d '{
    "type": "k8s",
    "hostname": "worker1",
    "image": "pwd-k8s:arm64"
  }'
```

#### B. Чрез Web UI

1. Отвори браузър на `http://localhost:3000`
2. Създай нова сесия
3. В Settings (иконката със зъбно колело):
   - Избери Instance Image: `pwd-k8s:arm64`
4. Кликни "ADD NEW INSTANCE"

## 🚀 Инициализирай Kubernetes Cluster

### На Master Node:

```bash
# Инициализирай cluster
kubeadm init --pod-network-cidr=10.244.0.0/16

# Запази join command-а който се показва!
# Изглежда така:
# kubeadm join 192.168.x.x:6443 --token xxx --discovery-token-ca-cert-hash sha256:yyy

# Setup kubectl config (вече е configured)
export KUBECONFIG=/etc/kubernetes/admin.conf

# Инсталирай CNI (flannel)
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

# Провери статуса
kubectl get nodes
kubectl get pods --all-namespaces
```

### На Worker Nodes:

```bash
# Използвай join command-а от master
kubeadm join 192.168.x.x:6443 --token xxx --discovery-token-ca-cert-hash sha256:yyy
```

## 📚 Основни Kubernetes Команди

```bash
# Покажи всички nodes
kubectl get nodes

# Покажи всички pods
kubectl get pods --all-namespaces

# Създай deployment
kubectl create deployment nginx --image=nginx

# Expose deployment
kubectl expose deployment nginx --port=80 --type=NodePort

# Покажи services
kubectl get services

# Скалирай deployment
kubectl scale deployment nginx --replicas=3

# Покажи детайли за pod
kubectl describe pod <pod-name>

# Виж логовете
kubectl logs <pod-name>

# Exec в pod
kubectl exec -it <pod-name> -- /bin/bash
```

## 🎓 Примерни Сценарии

### 1. Създай Nginx Deployment

```bash
# Create deployment
kubectl create deployment nginx --image=nginx --replicas=3

# Expose service
kubectl expose deployment nginx --port=80 --type=NodePort

# Get service port
kubectl get svc nginx
```

### 2. Deploy с YAML

```bash
# Създай файл
cat <<EOF > my-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80
EOF

# Apply
kubectl apply -f my-app.yaml
```

### 3. ConfigMaps и Secrets

```bash
# Създай ConfigMap
kubectl create configmap my-config --from-literal=key1=value1

# Създай Secret
kubectl create secret generic my-secret --from-literal=password=supersecret

# View
kubectl get configmaps
kubectl get secrets
```

## 🔧 Troubleshooting

### Node не е Ready

```bash
# Провери kubelet logs
journalctl -u kubelet -f

# Рестартирай kubelet
systemctl restart kubelet
```

### Pods в Pending status

```bash
# Провери защо
kubectl describe pod <pod-name>

# Провери node resources
kubectl describe node <node-name>
```

### Network проблеми

```bash
# Провери CNI pods
kubectl get pods -n kube-system | grep flannel

# Restart CNI
kubectl delete pods -n kube-system -l app=flannel
```

## 📖 Полезни Ресурси

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes By Example](https://kubernetesbyexample.com/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/) (официален playground)

## ⚠️ Забележки

- **Временни Instances:** Kubernetes instances са временни и се изтриват след 2 часа
- **Resources:** Всеки node има ограничени ресурси (CPU/Memory)
- **Storage:** Няма persistent storage - всичко се губи при изтриване
- **Network:** Nodes са в изолирана мрежа

## 🎉 Приятна игра с Kubernetes!

