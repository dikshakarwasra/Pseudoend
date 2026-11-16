# API Gateway v2 (HTTP API)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "sudoend-http-api-${random_string.suffix.result}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    allow_headers = ["Authorization", "Content-Type", "x-sudoend-key", "x-requested-with", "x-api-key"]
    max_age       = 86400
  }
}

# Auto-deploy default stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}

# Integration: Mock Engine Lambda
resource "aws_apigatewayv2_integration" "mock_engine" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.mock_engine.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: /mock/{proxy+} -> Mock Engine Lambda
resource "aws_apigatewayv2_route" "mock_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /mock/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.mock_engine.id}"
}

# Integration: Management Lambda
resource "aws_apigatewayv2_integration" "management" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.management.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

# Route: /api/{proxy+} -> Management Lambda
resource "aws_apigatewayv2_route" "management_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.management.id}"
}

# Permissions for API Gateway to invoke Mock Engine Lambda
resource "aws_lambda_permission" "apigw_mock" {
  statement_id  = "AllowAPIGatewayInvokeMock"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.mock_engine.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# Permissions for API Gateway to invoke Management Lambda
resource "aws_lambda_permission" "apigw_management" {
  statement_id  = "AllowAPIGatewayInvokeManagement"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.management.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

