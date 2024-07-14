# DO USE!

tar -vxf public.tar -C . \
    && cp assets/*.geojson public/vector \
    && cp assets/*.json public/vector \
    && cp assets/*.tif public/raster \
    && cp assets/layerFileImages/*.png public/images/geojson \
    && docker compose -p dev up --build -d && docker logs dev-server-1 --follow
