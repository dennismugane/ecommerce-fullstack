# Frontend Manifests

This folder contains Kubernetes manifests for the frontend service deployed in the `ecommerce` namespace.

Quick deploy steps (EKS)

1. Build and push a frontend image (CI does this if configured):

   ```bash
   docker build -t <hub-user>/ecommerce-frontend:TAG ./frontend
   docker push <hub-user>/ecommerce-frontend:TAG
   ```

2. Apply manifests:

   ```bash
   kubectl apply -f frontend/frontend-manifests/ -n ecommerce
   ```

3. Ensure the Ingress routes `/` to `ecommerce-frontend-service` and `/api` to the backend (already present in `backend-manifests/ingress.yaml`).

Notes
- The frontend `nginx.conf` has been adjusted to not proxy `/api` internally — the client should call relative paths like `/api/...` so the Ingress routes requests to the backend and avoids CORS issues.
- If you prefer nginx to proxy to the backend in-cluster, set `proxy_pass` to the backend service DNS (`ecommerce-backend-service:8080`) and ensure both are in the same namespace.
- The GitHub Actions workflow `fullstack-with-k8s.yaml` now builds and pushes a frontend image and attempts to update the frontend Deployment image during the EKS deploy job.

Troubleshooting
- To see pods:

  ```bash
  kubectl get pods -n ecommerce
  ```

- To stream logs for the frontend pod:

  ```bash
  kubectl logs -l app=ecommerce-frontend -n ecommerce -f
  ```

If you want me to also remove the empty `/api` location from `nginx.conf` completely, or to wire the frontend to use CloudFront instead, tell me which option you prefer.
