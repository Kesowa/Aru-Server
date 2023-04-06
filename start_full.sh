# DO USE!

tar -vxf public.tar -C . && docker compose -p dev up --build -d  && docker logs dev-server-1 --follow
