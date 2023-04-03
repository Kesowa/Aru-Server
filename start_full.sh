tar -vxf public.tar -C ./ && DOCKER_BUILDKIT=0 docker compose -f docker-compose.yaml up --build -d
