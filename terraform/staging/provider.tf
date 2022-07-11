provider "aws" {
  region = local.region
}

terraform {
  backend "remote" {
    hostname = "tfe.cloudinary.com"
    organization = "cloudinary"
    workspaces {
      name = "${local.service_name}-${local.environment}"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }
}