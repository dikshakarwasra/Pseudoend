# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role-${random_string.suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# Attach basic execution role (CloudWatch logging)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Scoped DynamoDB Least-Privilege Policy
resource "aws_iam_policy" "dynamodb_access" {
  name        = "${var.project_name}-dynamodb-policy-${random_string.suffix.result}"
  description = "Scoped DynamoDB access strictly for ${var.project_name}-main table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.pseudoend_main.arn,
          "${aws_dynamodb_table.pseudoend_main.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# CloudWatch Log Groups (Strictly 7-day retention for Free Tier compliance)
resource "aws_cloudwatch_log_group" "mock_engine_logs" {
  name              = "/aws/lambda/${var.project_name}-mock-engine-fn-${random_string.suffix.result}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "management_logs" {
  name              = "/aws/lambda/${var.project_name}-management-fn-${random_string.suffix.result}"
  retention_in_days = 7
}

# Archive placeholder/bundle for Mock Engine
data "archive_file" "mock_engine_zip" {
  type        = "zip"
  output_path = "${path.module}/mockEngine.zip"

  source {
    content  = fileexists("${path.module}/../backend/dist/mockEngine.js") ? file("${path.module}/../backend/dist/mockEngine.js") : (fileexists("${path.module}/../backend/dist/handlers/mockEngine.js") ? file("${path.module}/../backend/dist/handlers/mockEngine.js") : "exports.handler = async () => ({ statusCode: 200, body: 'pseudoend mock engine initializing...' });")
    filename = "index.js"
  }
}

# Mock Engine Lambda
resource "aws_lambda_function" "mock_engine" {
  function_name = "${var.project_name}-mock-engine-fn-${random_string.suffix.result}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 256
  timeout       = 5

  filename         = data.archive_file.mock_engine_zip.output_path
  source_code_hash = data.archive_file.mock_engine_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.pseudoend_main.name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.mock_engine_logs,
    aws_iam_role_policy_attachment.lambda_dynamodb_attach
  ]
}

# Archive placeholder/bundle for Management API
data "archive_file" "management_zip" {
  type        = "zip"
  output_path = "${path.module}/management.zip"

  source {
    content  = fileexists("${path.module}/../backend/dist/management.js") ? file("${path.module}/../backend/dist/management.js") : (fileexists("${path.module}/../backend/dist/handlers/management.js") ? file("${path.module}/../backend/dist/handlers/management.js") : "exports.handler = async () => ({ statusCode: 200, body: 'pseudoend management API initializing...' });")
    filename = "index.js"
  }
}

# Management Lambda
resource "aws_lambda_function" "management" {
  function_name = "${var.project_name}-management-fn-${random_string.suffix.result}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 256
  timeout       = 5

  filename         = data.archive_file.management_zip.output_path
  source_code_hash = data.archive_file.management_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.pseudoend_main.name
      JWT_SECRET = "${var.project_name}-secure-jwt-secret-${random_string.suffix.result}"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.management_logs,
    aws_iam_role_policy_attachment.lambda_dynamodb_attach
  ]
}

