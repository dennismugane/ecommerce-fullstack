# GitOps deployment flow

This repository now uses a GitOps-style deployment flow:

1. GitHub Actions builds and pushes the backend/frontend images.
2. The workflow updates the Helm values file in this repository with the new image tag.
3. Argo CD detects the change in Git and syncs the cluster to the new desired state.

## One-time bootstrap

Run this once after the EKS cluster is created:

```bash
chmod +x scripts/bootstrap-cluster.sh
./scripts/bootstrap-cluster.sh
```

This installs:
- NGINX Ingress Controller
- Argo CD
- the Argo CD Application that points to this repository

## Access Argo CD UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open https://localhost:8080

Use:
- username: admin
- password: the value from the secret `argocd-initial-admin-secret`
