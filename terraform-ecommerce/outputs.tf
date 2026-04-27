output "frontend_cloudfront_url" {
  description = "CloudFront URL for the frontend"
  value       = "https://${module.cloudfront.frontend_distribution_domain}"
}

output "backend_cloudfront_url" {
  description = "CloudFront URL that proxies HTTPS to the backend ALB"
  value       = "https://${module.cloudfront.backend_distribution_domain}"
}

output "alb_dns_name" {
  description = "Internal ALB DNS (use backend CloudFront URL instead)"
  value       = module.ec2.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint for debugging / migrations"
  value       = module.rds.rds_endpoint
  sensitive   = true
}

output "frontend_bucket_name" {
  description = "S3 bucket name – upload your build artefacts here"
  value       = module.s3.frontend_bucket_name
}
