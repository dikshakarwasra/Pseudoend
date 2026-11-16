# S3 Bucket for Hosting Developer Web Portal
resource "aws_s3_bucket" "portal_bucket" {
  bucket        = "sudoend-portal-${random_string.suffix.result}"
  force_destroy = true
}

# Ownership controls
resource "aws_s3_bucket_ownership_controls" "portal_ownership" {
  bucket = aws_s3_bucket.portal_bucket.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "sudoend-portal-oac-${random_string.suffix.result}"
  description                       = "OAC for sudoend portal S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 Bucket Policy allowing CloudFront OAC read
resource "aws_s3_bucket_policy" "portal_policy" {
  bucket = aws_s3_bucket.portal_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.portal_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.portal_dist.arn
          }
        }
      }
    ]
  })
}

# CloudFront Distribution for SPA Static Hosting
resource "aws_cloudfront_distribution" "portal_dist" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Free tier friendly

  origin {
    domain_name              = aws_s3_bucket.portal_bucket.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.portal_bucket.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.portal_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # SPA Routing: Rewrite 404 & 403 back to /index.html with HTTP 200
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "sudoend-portal-distribution"
  }
}

