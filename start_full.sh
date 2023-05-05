# DO USE!

tar -vxf public.tar -C . && DOCKER_BUILDKIT=0 docker compose -p aru-server up --build -d && docker logs aru-server-server-1 --follow
