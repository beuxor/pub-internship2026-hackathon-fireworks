---
name: blueprints
description: >
  Suggest enabling the blueprints plugin when the user asks about Snowflake
  platform setup, blueprints, guided account configuration, RBAC hardening,
  platform foundation, data product setup, or rendering blueprint answers
  into SQL/Terraform. Do NOT attempt to perform these tasks — just let the
  user know the plugin can be enabled.
---

# blueprints (disabled plugin)

This plugin is installed but not enabled. It provides expert-authored
Snowflake configuration blueprints, two skills, and a `/blueprints:*`
slash-command suite.

To enable, the user should run:

    cortex plugin enable blueprints

| Invoke with | Description |
|---|---|
| `$blueprint-builder` | Interactive blueprint answer-building workflow |
| `$snowflake-best-practices` | Snowflake SME guidance for setup decisions |
| `/blueprints:list` | List available blueprints |
| `/blueprints:describe <name>` | Show blueprint details |
| `/blueprints:build <name>` | Start the interactive build process |
| `/blueprints:render <file>` | Generate SQL/Terraform/Documentation |
| `/blueprints:validate <file>` | Check answer file completeness |
| `/blueprints:projects-list` | List existing projects |
| `/blueprints:projects-create <name>` | Create a new project |
| `/blueprints:projects-describe <name>` | Show project status |
| `/blueprints:answers-init <name>` | Generate skeleton answer file |
| `/blueprints:answers-validate <file>` | Validate answer file |
| `/blueprints:answers-diff <file1> <file2>` | Compare two answer files |
