# DO USE!

tar -vxf public.tar -C . && cp assets/solar.geojson public/vector/solar.geojson && docker compose -p dev up --build -d && docker logs dev-server-1 --follow
