# Query AWS resources

data "aws_caller_identity" "current" {}

# for db creation - if no need for db please delete this section
data "aws_vpc" "db_vpc" {
  tags = {
    Region        = local.region
    Environment   = local.db_vpc_environment
  }
}