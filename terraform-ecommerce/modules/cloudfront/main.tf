variable "environment" {}
variable "frontend_bucket_name" {}
variable "frontend_bucket_domain" {}
variable "backend_alb_dns" {}
variable "acm_certificate_arn" {}

# ── Origin Access Control (OAC) for S3 ───────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "ecommerce-${var.environment}-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── Cache Policies ────────────────────────────────────────────────────────────

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# ── Frontend Distribution (S3) ────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "ecommerce-${var.environment}-frontend"

  origin {
    domain_name              = var.frontend_bucket_domain
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # SPA fallback – return index.html on 403/404 so React Router works
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null
  }

  tags = { Name = "ecommerce-${var.environment}-frontend-cf" }
}

# ── Backend Distribution (ALB proxy) ─────────────────────────────────────────

resource "aws_cloudfront_distribution" "backend" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "ecommerce-${var.environment}-backend-proxy"

  origin {
    domain_name = var.backend_alb_dns
    origin_id   = "alb-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"     # ALB listens on HTTP; CF provides TLS to clients
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id          = "alb-backend"
    viewer_protocol_policy    = "redirect-to-https"
    allowed_methods           = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods            = ["GET", "HEAD"]
    compress                  = true
    cache_policy_id           = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id  = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors.id
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == "" ? true : false
    acm_certificate_arn            = var.acm_certificate_arn != "" ? var.acm_certificate_arn : null
    ssl_support_method             = var.acm_certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != "" ? "TLSv1.2_2021" : null
  }

  tags = { Name = "ecommerce-${var.environment}-backend-cf" }
}

resource "aws_cloudfront_response_headers_policy" "cors" {
  name = "ecommerce-${var.environment}-cors-policy"

  cors_config {
    access_control_allow_credentials = true

    access_control_allow_headers {
      items = [
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
      ]
    }

    access_control_allow_methods {
      items = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"]
    }

    access_control_allow_origins {
      items = ["https://d23yij5kgrtj4d.cloudfront.net"]
    }

    access_control_max_age_sec = 3600
    origin_override = false
  }
}
# ── Outputs ───────────────────────────────────────────────────────────────────

output "frontend_distribution_domain" { value = aws_cloudfront_distribution.frontend.domain_name }
output "backend_distribution_domain"  { value = aws_cloudfront_distribution.backend.domain_name }
output "oac_id"                       { value = aws_cloudfront_origin_access_control.frontend.arn }
output "frontend_distribution_arn"    { value = aws_cloudfront_distribution.frontend.arn }
output "cors_policy_id" { value = aws_cloudfront_response_headers_policy.cors.id }