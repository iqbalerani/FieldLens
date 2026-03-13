#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: ./setup-s3.sh <bucket-name>"
  exit 1
fi

aws s3api create-bucket --bucket "$1" --region us-east-1
aws s3api put-bucket-versioning --bucket "$1" --versioning-configuration Status=Enabled
echo "Bucket $1 created with versioning enabled."

