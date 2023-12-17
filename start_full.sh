# DO USE!

tar -vxf public.tar -C . && cp assets/*.geojson public/vector && cp assets/*.tif public/raster && docker compose -p dev up --build -d && docker logs dev-server-1 --follow
