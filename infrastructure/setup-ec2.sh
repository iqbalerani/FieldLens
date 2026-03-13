#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin python3-venv
sudo usermod -aG docker "$USER"
echo "EC2 base dependencies installed. Log out and back in if docker permissions have not refreshed."

