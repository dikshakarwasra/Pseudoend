variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for deployment"
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Environment name (dev, staging, prod)"
}

variable "project_name" {
  type        = string
  default     = "sudoend"
  description = "Base project name used for resource naming"
}

