output "api_endpoint_url" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "Public API Gateway base URL for sudoend"
}

output "portal_cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.portal_dist.domain_name}"
  description = "Global CDN URL for the sudoend Developer Web Portal"
}

output "portal_s3_bucket_name" {
  value       = aws_s3_bucket.portal_bucket.id
  description = "Target S3 bucket name for web portal deployments"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.sudoend_main.name
  description = "Single-table DynamoDB name"
}

