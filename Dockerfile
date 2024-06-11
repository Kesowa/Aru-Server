FROM debian:bookworm-slim@sha256:cc7d594a37db054c2c8a5a871d496f64f0fff63b58d82e292192e46064f63865 AS lastools
WORKDIR /build
RUN apt-get update && apt-get install -y git libjpeg62 libpng-dev libtiff-dev libjpeg-dev libz-dev libproj-dev liblzma-dev libjbig-dev libzstd-dev libgeotiff-dev libwebp-dev liblzma-dev libsqlite3-dev build-essential cmake
RUN git clone https://github.com/LAStools/LAStools.git . && git checkout b2b750ddce246e5441a6f8c1306c0cf23a10e477
RUN cmake . && make 

FROM debian:bookworm-slim@sha256:cc7d594a37db054c2c8a5a871d496f64f0fff63b58d82e292192e46064f63865 AS gocesiumtiler
WORKDIR /build
RUN apt-get update && apt-get install -y git build-essential gcc-multilib
ADD https://go.dev/dl/go1.22.1.linux-amd64.tar.gz /tmp
RUN mkdir -p /usr/local/bin && tar -C /usr/local -xzf /tmp/go1.22.1.linux-amd64.tar.gz
ENV PATH=/usr/local/go/bin:$PATH
RUN go env CGO_ENABLED
RUN git clone https://github.com/mfbonfigli/gocesiumtiler.git . && git checkout 8dbc93687abd8e34c8f7f6ccfef8b4ebd94d157f
ENV CGO_LDFLAGS="-g -O2 -lm"
RUN go build

FROM node:18-bookworm-slim@sha256:e01db0ed571851e2a67b11624abb90992af585db0afaff451972e64c604dffa1
WORKDIR /app
RUN apt-get update && apt-get install -y git gcc-multilib curl gnupg \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
COPY --from=lastools /build/LASlib/ /app/lib
COPY --from=lastools /build/bin64/ /app/bin
COPY --from=gocesiumtiler /build/gocesiumtiler /app/bin/gocesiumtiler
COPY --from=gocesiumtiler /build/assets /app/bin/assets
ENV LD_LIBRARY_PATH=/app/lib:$LD_LIBRARY_PATH 
ENV PATH=/app/bin:$PATH

ADD ./ffmpeg.tar.gz /bin
ADD  ./potree.tar.gz /bin
ADD ./dji_bin.tar.gz /bin
ADD ./dji_lib.tar.gz /lib
RUN cp /bin/liblaszip.so /usr/lib/liblaszip.so
COPY package*.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
RUN npm ci
COPY ./tsconfig.json ./

RUN npm run build
WORKDIR /app/src
ENV NODE_ENV=production
CMD ["node", "server.js"]
