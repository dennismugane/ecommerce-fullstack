#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-muigo-eks-prod}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "[1/4] Connecting kubectl to EKS cluster $CLUSTER_NAME"
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"

echo "[2/4] Ensuring NGINX Ingress Controller"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx >/dev/null 2>&1 || true
helm repo update >/dev/null 2>&1
if helm status ingress-nginx -n ingress-nginx >/dev/null 2>&1; then
  echo "  - ingress-nginx already installed; skipping"
else
  helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
    --namespace ingress-nginx \
    --create-namespace \
    --set controller.replicaCount=2 \
    --set controller.nodeSelector."kubernetes\.io/os"=linux \
    --wait --timeout 10m
fi

echo "[3/4] Ensuring Argo CD"
helm repo add argo https://argoproj.github.io/argo-helm >/dev/null 2>&1 || true
helm repo update >/dev/null 2>&1
if helm status argocd -n argocd >/dev/null 2>&1; then
  echo "  - argocd already installed; skipping"
else
  helm upgrade --install argocd argo/argo-cd \
    --namespace argocd \
    --create-namespace \
    --wait --timeout 15m
fi
kubectl wait --namespace argocd --for=condition=available deployment/argocd-server --timeout=600s || true

echo "[4/4] Creating Argo CD Application"
kubectl apply -f argocd-app.yaml >/tmp/argocd-app.log 2>&1 || true
if [ -s /tmp/argocd-app.log ]; then
  tail -n 20 /tmp/argocd-app.log || true
fi

echo ""
echo "Bootstrap complete."
echo "Argo CD UI access:"
echo "  - Port-forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  - Username: admin"
echo "  - Password:"
if kubectl get secret argocd-initial-admin-secret -n argocd >/dev/null 2>&1; then
  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
else
  echo "(secret not found yet; wait a few moments and try again)"
fi
