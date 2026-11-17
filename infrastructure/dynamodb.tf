moved {
  from = aws_dynamodb_table.sudoend_main
  to   = aws_dynamodb_table.pseudoend_main
}

resource "aws_dynamodb_table" "pseudoend_main" {
  name         = "${var.project_name}-main"
  billing_mode = "PAY_PER_REQUEST" # Guaranteed zero idle cost
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  ttl {
    attribute_name = "TTL"
    enabled        = true
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = false # Keep disabled to stay strictly within 100% Free Tier limits
  }

  tags = {
    Name = "${var.project_name}-main-table"
  }
}

