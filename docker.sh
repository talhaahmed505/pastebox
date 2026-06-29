#!/bin/bash
set -e

# Prerequisites
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Install Docker (includes docker-ce, cli, containerd, buildx, and compose plugin)
curl -fsSL https://get.docker.com | sh

# Create docker group and add current user
sudo groupadd -f docker
sudo usermod -aG docker $USER

# Enable + start Docker service
sudo systemctl enable --now docker

echo "Done. Log out and back in (or run 'newgrp docker') for group changes to take effect."