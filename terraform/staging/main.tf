# Microservice - ecs, ecr, target groups, sg, alarms, dns records, etc
module "service" {
  source                = "git@github.com:CloudinaryLtd/devops.git//infra/modules/cld_microservices"
  service_name          = local.service_name
  environment           = local.environment
  region                = local.region
  environment_variables = local.environment_vars
  use_datadog_apm       = local.use_datadog_apm
  max_capacity          = local.max_capacity
  create_alarm          = local.create_alarm
  associate_alb         = local.associate_alb
  health_check_path     = local.health_check_path
  container_port        = local.container_port
  publish_dd_metrics    = local.publish_dd_metrics
  publish_cw_metrics    = local.publish_cw_metrics
  secrets               = local.env_service_secrets
  shared_secrets        = local.shared_env_secrets
}

module "service_database" {
  providers = {
    aws         = aws
    aws.replica = aws # no replica is being created. its just a mandatory field.
  }
  source               = "git@github.com:CloudinaryLtd/devops.git//infra/modules/cld_rds_aurora"
  region               = local.region
  environment          = local.environment
  service_name         = local.service_name
  vpc_id               = data.aws_vpc.db_vpc.id
  open_security_groups = local.db_open_security_groups
  open_cidr_blocks     = local.db_open_cidr_blocks
  port                 = local.db_port
  engine_version       = "8.0.mysql_aurora.3.01.0"
  family               = local.aurora_engine
  engine_name          = local.aurora_engine
}