# Ecommerce Fullstack — AWS EKS

A production-grade ecommerce application running on AWS EKS, provisioned entirely with Terraform and deployed via GitHub Actions CI/CD.

## Live Application

| | |
|---|---|
| **Frontend** | https://tinyurl.com/muigo-commerce |
| **API health** | https://tinyurl.com/api-health-check |
| **API products** | https://tinyurl.com/muigo-api-products |

> Note: Running on AWS EKS. The cluster is spun down when not in use to manage costs — see [Destroy section](#destroy-save-costs) for details.

---

---

## Architecture

```
User (browser)
      │
      ▼
Route 53 (DNS)
      │  resolves domain → ELB hostname
      ▼
AWS Load Balancer (ELB)
      │  entry point into VPC
      ▼
NGINX Ingress Controller
      ├── /          →  React frontend pods  (ClusterIP :80)
      └── /api       →  Spring Boot pods     (ClusterIP :8080)
                               │
                    ┌──────────┴───────────┐
                    ▼                      ▼
              RDS MySQL             Secrets Manager
           (private subnet)       DB password + JWT
```

### VPC layout

| Subnet | CIDR | Purpose |
|---|---|---|
| public-1 | 10.0.1.0/24 | ALB, NAT Gateway |
| public-2 | 10.0.2.0/24 | ALB (multi-AZ) |
| private-1 | 10.0.11.0/24 | EKS nodes, RDS |
| private-2 | 10.0.12.0/24 | EKS nodes, RDS |

### EKS cluster

| Resource | Value |
|---|---|
| Cluster name | `muigo-eks-prod` |
| Kubernetes version | 1.30 |
| Node group | 2× t3.small, gp3 20GB |
| Namespace | `ecommerce` |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, served by nginx |
| Backend | Spring Boot 3.4, Java 17 |
| Database | MySQL 8.0 on RDS (db.t3.micro) |
| Container registry | Docker Hub (`dmuigo/ecommerce-backend`) |
| Orchestration | Kubernetes on AWS EKS |
| Ingress | NGINX Ingress Controller (Helm) |
| Infrastructure | Terraform (modular) |
| CI/CD | GitHub Actions |
| Secrets | AWS Secrets Manager |
| CDN | AWS CloudFront + S3 |

---

## Repository structure

```
ecommerce-fullstack/
├── backend/                    # Spring Boot application
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                   # React + Vite application
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── backend-manifests/          # Kubernetes manifests
│   ├── secrets.yaml
│   ├── config.yaml
│   ├── springboot-app.yaml
│   └── ingress.yaml
├── frontend-manifests/         # Kubernetes frontend manifests
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
└── terraform-ecommerce/        # Infrastructure as Code
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    ├── terraform.tfvars
    ├── bootstrap.sh
    └── modules/
        ├── vpc/
        ├── eks/
        ├── ec2/
        ├── rds/
        ├── s3/
        ├── cloudfront/
        ├── secrets/
        └── iam/
```

---

## How the application runs

### 1. Infrastructure provisioning

Everything is provisioned from a single command:

```bash
export TF_VAR_db_password='your-db-password'
export TF_VAR_jwt_secret='your-jwt-secret'
terraform apply -auto-approve
```

Terraform creates in dependency order:
- VPC with public/private subnets across 2 AZs
- RDS MySQL in private subnets
- Secrets Manager with DB password and JWT secret
- EKS cluster with managed node group
- S3 bucket and CloudFront distributions
- IAM roles with least-privilege policies

### 2. Kubernetes deployment

```bash
# Connect kubectl to the cluster
aws eks update-kubeconfig --region us-east-1 --name muigo-eks-prod

# Create namespace
kubectl create namespace ecommerce

# Apply manifests in order
kubectl apply -f backend-manifests/secrets.yaml
kubectl apply -f backend-manifests/config.yaml
kubectl apply -f backend-manifests/springboot-app.yaml
kubectl apply -f frontend-manifests/
kubectl apply -f backend-manifests/ingress.yaml
```

### 3. Traffic routing

The NGINX Ingress Controller is the single entry point. All traffic arrives at the AWS ELB DNS name and is routed by path:

```yaml
rules:
  - http:
      paths:
        - path: /api(/|$)(.*)    # → Spring Boot :8080
        - path: /                # → React nginx :80
```

Frontend API calls use relative paths (`/api/products`) so they share the same origin — no CORS configuration needed.

### 4. Database connectivity

Spring Boot connects to RDS through the private subnet. Credentials are injected from Kubernetes Secrets which reference AWS Secrets Manager values:

```yaml
env:
  - name: SPRING_DATASOURCE_URL
    value: "jdbc:mysql://ecommerce-prod-mysql.xxx.us-east-1.rds.amazonaws.com:3306/ecommerce"
  - name: SPRING_DATASOURCE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: ecommerce-secret
        key: MYSQL_PASSWORD
```

### 5. Auto-scaling

A HorizontalPodAutoscaler scales the backend between 2 and 5 replicas based on CPU:

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

---

## CI/CD pipeline

Every push to `main` triggers:

```
backend build (Maven)
      │
      ▼
security scan (Trivy + Semgrep)
      │  fails on HIGH/CRITICAL CVEs
      ▼
Docker build + push to Docker Hub
      │  tagged with git SHA
      ▼
frontend build (Vite)
      │  VITE_API_BASE_URL from GitHub secret
      ▼
deploy frontend → S3 sync + CloudFront invalidation
deploy backend  → kubectl set image → rollout status
```

Image tagging uses git SHA so every deployment is traceable:

```
dmuigo/ecommerce-backend:abc1234f
dmuigo/ecommerce-backend:latest
```

---

## Local development

### Prerequisites

- AWS CLI configured (`aws configure`)
- Terraform >= 1.6.0
- kubectl
- Helm 3
- Docker

### First-time setup

```bash
# Bootstrap remote state backend
chmod +x bootstrap.sh
./bootstrap.sh

# Initialise Terraform
terraform init

# Plan and apply
terraform plan -out=tfplan
terraform apply tfplan
```

### Connect to the cluster

```bash
aws eks update-kubeconfig --region us-east-1 --name muigo-eks-prod

# Verify nodes
kubectl get nodes

# Verify pods
kubectl get pods -n ecommerce
```

### Access the application

```bash
export INGRESS=$(kubectl get svc ingress-nginx-controller \
  -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Frontend
open http://$INGRESS

# Backend health
curl http://$INGRESS/actuator/health

# API
curl http://$INGRESS/api/products
```

---

## Debugging runbook

### Pod not starting

```bash
kubectl get pods -n ecommerce
kubectl describe pod <pod-name> -n ecommerce   # check Events section
kubectl logs <pod-name> -n ecommerce --previous
```

### Database connection issues

```bash
# Verify RDS endpoint
terraform output rds_endpoint

# Check Spring Boot logs for HikariPool errors
kubectl logs -n ecommerce deployment/ecommerce-backend | grep -i hikari
```

### Ingress not routing

```bash
kubectl describe ingress ecommerce-ingress -n ecommerce
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=50
```

### EKS auth failure

```bash
aws sts get-caller-identity

aws eks create-access-entry \
  --cluster-name muigo-eks-prod \
  --principal-arn arn:aws:iam::ACCOUNT_ID:user/USERNAME \
  --region us-east-1

aws eks associate-access-policy \
  --cluster-name muigo-eks-prod \
  --principal-arn arn:aws:iam::ACCOUNT_ID:user/USERNAME \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster \
  --region us-east-1
```

---

## Destroy (save costs)

```bash
# Remove Kubernetes resources first — prevents orphaned ELBs blocking VPC deletion
kubectl delete namespace ecommerce
kubectl delete namespace ingress-nginx

# Wait for ELBs to terminate, then destroy infrastructure
terraform destroy -auto-approve
```

> Always delete Kubernetes namespaces before `terraform destroy`. LoadBalancer services create AWS ELBs that Terraform does not manage — if left running they block VPC subnet deletion.

---

## Cost estimate (approximate)

| Resource | Cost/day |
|---|---|
| EKS cluster | ~$2.40 |
| 2× t3.small nodes | ~$0.94 |
| RDS db.t3.micro | ~$0.48 |
| NAT Gateway | ~$1.08 |
| **Total** | **~$5.40/day** |

S3 and DynamoDB (Terraform state) cost cents per month and can be left running permanently.

---

## Key lessons learned

- Always delete Kubernetes namespaces before `terraform destroy` to avoid orphaned ELBs blocking VPC teardown
- Use TCP socket probes instead of HTTP probes when Spring Security protects actuator endpoints
- `kubectl describe pod` Events section is the first place to look — not Google
- Managed services (RDS, Secrets Manager) eliminate entire categories of operational work compared to running databases inside Kubernetes
- Tag Docker images with git SHA, not just `latest` — every deployment should be traceable to a commit
- Add your IAM user to EKS access entries explicitly — never rely on implicit creator privileges across sessions
