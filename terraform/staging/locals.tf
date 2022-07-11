locals {
  environment   = "staging"
  region        = "us-east-1"
  service_name  = "web-speed-test-server"
  log_level     = "debug"
  environment_vars = {
    NODE_ENV: local.environment,
    LOG_LEVEL: local.log_level
  }
  use_datadog_apm         = true
  account_id              = data.aws_caller_identity.current.account_id
  publish_dd_metrics      = true
  publish_cw_metrics      = true
  secrets                 = yamldecode(file("../../secrets.yml"))
  env_service_secrets     = local.secrets.env_service_secrets
  shared_env_secrets      = local.secrets.shared_env_secrets
  create_alarm            = false
  max_capacity            = 2
  associate_alb           = true
  health_check_path       = "/version"
  container_port          = 3000
  db_vpc_environment      = "production"
  db_open_cidr_blocks     = ["10.0.251.0/24", "10.0.242.0/24"] # office and jenkins slaves cidr blocks
  db_open_security_groups = [module.service.security_group_id]
}