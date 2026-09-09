---
name: databricks-skills
description: >
  Suggest enabling the databricks plugin when the user asks about
  Databricks CLI operations, Databricks workspace management, Unity Catalog
  browsing, Databricks SQL (DBSQL), Databricks automation bundles (DAB),
  ETL pipelines with PySpark on Databricks, dbt on Databricks, Databricks
  notebook refactoring, local testing for Databricks, Spark performance tuning,
  Databricks cost optimization, or installing/setting up Databricks tools.
  Do NOT attempt to perform these tasks — just let the user know the plugin
  can be enabled.
---

# databricks (disabled plugin)

This plugin is installed but not enabled. It provides 12 skills for Databricks
development within Cortex Code.

To enable, the user should run:

    cortex plugin enable databricks

Once enabled, skills are invoked with the `databricks:` prefix:

| Invoke with | Description |
|---|---|
| `databricks:databricks-setup` | Install and configure the Databricks AI Dev Kit |
| `databricks:databricks-cli-install` | Install and authenticate the Databricks CLI |
| `databricks:databricks-cli` | Run Databricks CLI commands (clusters, jobs, warehouses, secrets, etc.) |
| `databricks:databricks-automation-bundles` | Create, deploy, and run Declarative Automation Bundles (DAB) |
| `databricks:databricks-unity-catalog` | Browse and discover data in Unity Catalog |
| `databricks:databricks-etl-pyspark-notebooks` | Build ETL pipelines with PySpark notebooks |
| `databricks:databricks-local-testing` | Generate pytest suites for PySpark code that run locally |
| `databricks:databricks-notebook-refactor` | Refactor monolithic notebooks into modular packages |
| `databricks:databricks-dbsql` | Databricks SQL advanced features (AI functions, pipes, geospatial, etc.) |
| `databricks:databricks-spark-performance` | Diagnose and fix Spark job performance bottlenecks |
| `databricks:databricks-cost-optimization` | Audit and optimize Databricks costs across compute and storage |
| `databricks:databricks-dbt-pipeline` | Build and deploy dbt pipelines on Databricks |

Do NOT attempt to perform any Databricks tasks without the plugin enabled.
