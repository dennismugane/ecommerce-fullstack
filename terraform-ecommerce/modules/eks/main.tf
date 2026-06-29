variable "environment" {}
variable "vpc_id" {}
variable "private_subnet_ids" {}
variable "cluster_name" { default = "muigo-eks" }

# ── EKS Cluster ───────────────────────────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.cluster_name}-${var.environment}"
  cluster_version = "1.30"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  # Allow your machine to access the cluster API
  cluster_endpoint_public_access = true

  # Disable KMS encryption — not needed for learning
  create_kms_key            = false
  cluster_encryption_config = {}

  # Node group — t3.small keeps costs low
  eks_managed_node_groups = {
    default = {
      instance_types = ["t3.small"]
      min_size       = 1
      max_size       = 3
      desired_size   = 2

      # 20GB disk so Docker images fit
      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 20
            volume_type           = "gp3"
            delete_on_termination = true
          }
        }
      }
    }
  }

  tags = { Environment = var.environment }
}

resource "aws_eks_access_entry" "shemeji" {
  cluster_name  = module.eks.cluster_name
  principal_arn = "arn:aws:iam::577133972540:user/shemeji"
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "shemeji" {
  cluster_name  = module.eks.cluster_name
  principal_arn = "arn:aws:iam::577133972540:user/shemeji"
  access_scope { type = "cluster" }
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "cluster_name"     { value = module.eks.cluster_name }
output "cluster_endpoint" { value = module.eks.cluster_endpoint }

output "cluster_security_group_id" { value = module.eks.cluster_security_group_id }

output "node_security_group_id" { value = module.eks.node_security_group_id }

