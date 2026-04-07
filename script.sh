#!/bin/bash

# Check if any ecommerce container is not running
NOT_RUNNING=$(docker ps -a --filter "name=ecommerce" --filter "status=exited" -q | wc -l)

if [ "$NOT_RUNNING" -gt 0 ]; then
  echo "Some containers are down — starting all services..."
  docker compose up -d
else
  echo "All containers are running — nothing to do"
fi

# Show final status
echo ""
docker ps --filter "name=ecommerce" --format "{{.Names}} - {{.Status}}"
