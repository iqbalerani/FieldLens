#!/usr/bin/env bash
set -euo pipefail

echo "Provision an RDS PostgreSQL 16 instance, then run:"
echo "CREATE EXTENSION IF NOT EXISTS vector;"
echo "Create an application user and set DATABASE_URL in the root .env file."

