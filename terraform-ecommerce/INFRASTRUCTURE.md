# 🚀 Cloud-Native E-Commerce Platform
### Terraform · AWS · Spring Boot · Docker · GitHub Actions

![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazon-aws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=spring-boot&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)

---

## 🌐 Live Application

| Service | URL |
|---------|-----|
| **Frontend** | [https://d23yij5kgrtj4d.cloudfront.net](https://d23yij5kgrtj4d.cloudfront.net) |
| **Backend API** | [https://d2fxqzyyexmaqr.cloudfront.net](https://d2fxqzyyexmaqr.cloudfront.net) |
| **Health Check** | [https://d2fxqzyyexmaqr.cloudfront.net/actuator/health](https://d2fxqzyyexmaqr.cloudfront.net/actuator/health) |

> **Stack:** React frontend served from S3 via CloudFront · Spring Boot API on EC2 Auto Scaling Group · MySQL on RDS · All infrastructure provisioned with Terraform

---

## 🌍 Overview

This project demonstrates how to design, provision, and operate a production-ready cloud architecture for an e-commerce platform using Infrastructure as Code. Every resource — from networking to CDN — is defined in Terraform and reproducible from scratch with a single `terraform apply`.

**What this project showcases:**

- Production AWS infrastructure provisioned entirely with modular Terraform
- Zero-secrets architecture — no credentials in code, state files, or Git history
- Global content delivery with CORS-aware CloudFront distributions
- Automated CI/CD pipeline from code push to live deployment
- Real-world debugging and troubleshooting of production issues

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │                  AWS (us-east-1)                 │
                    │                                                   │
  User Browser      │   ┌──────────────┐     ┌───────────────────┐    │
      │             │   │  CloudFront  │     │    CloudFront     │    │
      │─── / ──────▶│   │  (Frontend)  │     │    (Backend)      │    │
      │─── /api ───▶│   │              │     │  CORS Policy      │    │
                    │   └──────┬───────┘     └────────┬──────────┘    │
                    │          │                       │               │
                    │          ▼                       ▼               │
                    │   ┌──────────────┐     ┌────────────────┐       │
                    │   │  S3 Bucket   │     │      ALB       │       │
                    │   │ React Build  │     │  (port 80)     │       │
                    │   │  (OAC only)  │     └────────┬───────┘       │
                    │   └──────────────┘              │               │
                    │                                 ▼               │
                    │                      ┌──────────────────┐       │
                    │                      │  EC2 Auto Scaling│       │
                    │                      │  Spring Boot     │       │
                    │                      │  Docker :8080    │       │
                    │                      │  (public subnet) │       │
                    │                      └────────┬─────────┘       │
                    │                               │                 │
                    │                      ┌────────▼─────────┐       │
                    │                      │   RDS MySQL 8.0  │       │
                    │                      │  (private subnet)│       │
                    │                      └──────────────────┘       │
                    │                                                   │
                    │   ┌─────────────────────────────────────────┐   │
                    │   │         AWS Secrets Manager              │   │
                    │   │   DB credentials · JWT signing key       │   │
                    │   └─────────────────────────────────────────┘   │
                    └─────────────────────────────────────────────────┘
```

### Request Flow

1. User accesses the application over HTTPS
2. **CloudFront (Frontend)** serves the React SPA from S3 via Origin Access Control
3. React app makes API calls to **CloudFront (Backend)**, which proxies to the ALB
4. ALB routes traffic to healthy EC2 instances running the Dockerised Spring Boot app
5. Spring Boot fetches DB credentials at boot time from **AWS Secrets Manager** via IAM role
6. Application reads/writes to **RDS MySQL** in a private subnet

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Infrastructure as Code | Terraform (modular) |
| Cloud Provider | AWS |
| Backend | Java 21 · Spring Boot 3.4 · Docker |
| Frontend | React · TypeScript · Nginx |
| Database | MySQL 8.0 on Amazon RDS |
| CI/CD | GitHub Actions |
| CDN | Amazon CloudFront |
| Secrets | AWS Secrets Manager |
| State Management | S3 + DynamoDB locking |

---

## 🔐 Security Architecture

Security is implemented as a first-class concern at every layer:

| Layer | Control |
|-------|---------|
| Secrets | AWS Secrets Manager — no credentials in code, Terraform state, or Git |
| EC2 → Secrets | IAM role with least-privilege policy scoped to specific secret ARNs |
| S3 → CloudFront | Origin Access Control (OAC) — bucket is fully private |
| RDS | Private subnet — only accessible from EC2 security group |
| Traffic | HTTPS enforced via CloudFront — HTTP redirected automatically |
| IAM | No wildcard permissions — all policies scoped to specific resource ARNs |
| State file | S3 with server-side encryption + DynamoDB state locking |

---

## ☁️ Infrastructure Modules (Terraform)

```
terraform-ecommerce/
├── main.tf                    # Root module — wires everything together
├── variables.tf
├── outputs.tf
├── terraform.tfvars
└── modules/
    ├── vpc/                   # VPC, subnets, IGW, NAT, route tables
    ├── ec2/                   # Launch template, ASG, ALB, security groups
    ├── rds/                   # MySQL RDS, subnet group, parameter group
    ├── s3/                    # Frontend bucket, OAC policy, encryption
    ├── cloudfront/            # Frontend + backend distributions, CORS policy
    ├── secrets/               # Secrets Manager secrets for DB + JWT
    └── iam/                   # EC2 role, instance profile, policies
```

### Networking
- Custom VPC with DNS enabled
- 2 public subnets + 2 private subnets across 2 availability zones
- Internet Gateway, NAT Gateway, separate route tables

### Compute
- Launch Template with 20GB gp3 EBS volume
- Auto Scaling Group (min: 1, max: 3) with CPU-based scaling at 70%
- ALB with health checks on `/actuator/health`
- Userdata: installs Docker, fetches secrets from Secrets Manager, clones repo, starts container

### Database
- MySQL 8.0 on `db.t3.micro` in private subnet
- Security group allows port 3306 from EC2 security group only
- Storage encryption, automated backups, deletion protection enabled

### CDN
- Frontend distribution: S3 origin with OAC, SPA fallback (index.html on 403/404)
- Backend distribution: ALB origin with `Managed-CachingDisabled` policy
- CORS Response Headers Policy on backend — required for browser preflight requests

---

## 🔁 CI/CD Pipeline

```
Code Push to main
       │
       ├── Backend ──► Build JAR ──► Docker build ──► Push Docker Hub ──► ASG refresh
       │
       └── Frontend ──► npm build ──► Upload to S3 ──► CloudFront cache invalidation
```

All sensitive values stored as GitHub Secrets — never in code or logs.

---

## 📦 Key Features

- ✅ **Fully reproducible** — destroy and rebuild everything from scratch with Terraform
- ✅ **Zero hardcoded secrets** — credentials injected at EC2 boot time from Secrets Manager
- ✅ **Auto-scaling backend** — scales 1→3 instances on CPU load automatically
- ✅ **Global CDN** — CloudFront distributes both frontend and backend globally
- ✅ **CORS-aware CDN** — response headers policy passes CORS headers through CloudFront
- ✅ **Remote Terraform state** — S3 + DynamoDB prevents state corruption
- ✅ **Production CI/CD** — every push to main deploys automatically

---

## 🛠️ How to Deploy

### Prerequisites

```bash
terraform >= 1.6.0
aws-cli >= 2.0
docker
```

### Steps

```bash
# 1. Clone repository
git clone https://github.com/dennismugane/ecommerce-fullstack.git
cd ecommerce-fullstack/terraform-ecommerce

# 2. Set credentials and variables
export AWS_PROFILE=terraform
export TF_VAR_db_password="your-secure-password"
export TF_VAR_jwt_secret="your-jwt-secret"
export TF_VAR_allowed_origins="https://your-cloudfront-domain.cloudfront.net"

# 3. Initialise and apply
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### Outputs After Apply

```
frontend_cloudfront_url = "https://d23yij5kgrtj4d.cloudfront.net"
backend_cloudfront_url  = "https://d2fxqzyyexmaqr.cloudfront.net"
alb_dns_name            = "ecommerce-prod-alb-xxx.us-east-1.elb.amazonaws.com"
frontend_bucket_name    = "my-ecommerce-frontend-prod-2026"
```

---

## 🧠 Key Design Decisions

**Why two CloudFront distributions?**
One for the React frontend (S3 origin) and one for the Spring Boot API (ALB origin). This separates caching strategies — the frontend uses `CachingOptimized` for static assets while the API uses `CachingDisabled` to ensure fresh responses on every request.

**Why a CORS Response Headers Policy on CloudFront?**
CloudFront strips response headers it does not recognise by default — including `Access-Control-Allow-Origin`. Without an explicit response headers policy, CORS preflight requests from the frontend fail even if Spring Boot returns the correct headers. The policy must list specific headers rather than `*` when `allowCredentials` is `true`.

**Why Secrets Manager instead of environment variables?**
Secrets Manager provides centralised storage, rotation support, and audit logging. Credentials are fetched at EC2 boot time via IAM role — they never appear in Terraform state, Git history, or EC2 userdata logs.

**Why Auto Scaling Group instead of a single EC2?**
ASG ensures the application self-heals if an instance fails and scales under load. Combined with ALB health checks on `/actuator/health`, unhealthy instances are replaced without manual intervention.

**Why clone the repo in userdata instead of generating docker-compose inline?**
Generating docker-compose inline via Terraform `templatefile()` created a second source of truth and introduced variable escaping bugs. Using `docker-compose.prod.yml` from the repo directly means compose changes deploy via git push without requiring a Terraform redeploy.

---

## 🚀 Future Improvements

- [ ] Kubernetes (EKS) — migrate from EC2 ASG to EKS with Helm and ArgoCD GitOps
- [ ] Observability — Prometheus + Grafana + Loki + AlertManager
- [ ] Blue/Green deployments — zero-downtime releases via ALB weighted target groups
- [ ] WAF — AWS Web Application Firewall for DDoS and OWASP Top 10 protection
- [ ] Multi-region — Route53 latency-based routing
- [ ] RDS Multi-AZ — production-grade database high availability
- [ ] Infracost — cost estimation on every Terraform PR

---

## 🔗 Related Repositories

- [k8s-manifests](https://github.com/dennismugane/k8s-manifests) — Kubernetes deployment manifests
- [devops-scripts](https://github.com/dennismugane/devops-scripts) — Bash automation scripts
- [Wallet-API](https://github.com/dennismugane/Wallet-API) — Fintech backend with full DevSecOps pipeline

---

## 👨‍💻 Author

**Dennis Muigo**
DevOps & Platform Engineer | AWS · Terraform · Kubernetes · Java
📍 Nairobi, Kenya
🔗 [LinkedIn](https://linkedin.com/in/dennismuganemuigo) ·
