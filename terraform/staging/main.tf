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
  is_external           = local.is_external
}