# ARU Server

The API and real-time backend for **ARU**, Kesowa's drone data management
platform. It handles authentication and multi-tenant authorization, mission
planning and lifecycle, live telemetry and video stream coordination, and the
processing pipeline that turns raw drone deliverables into map layers.

Node.js and TypeScript on Express, with MongoDB for data, Redis for caching,
RabbitMQ for dispatching work to processing workers, and MinIO or S3 for object
storage. Rasters are served as Cloud-Optimised GeoTIFFs through TiTiler.

The web client lives in [Aru-Client](https://github.com/Kesowa/Aru-Client).

> ARU was formerly called **Arya**, so you will find that name in older code
> and commits.

## ⚠️ Before you start

Two things will stop you building this from a fresh clone:

1. **`aru-common` is a private submodule.** `.gitmodules` points at
   `github.com/Kesowa/aru-common`, which is not public. Without access,
   `git submodule update --init` fails and the TypeScript build cannot resolve
   the shared types. There is currently no way around this from outside Kesowa.
2. **`server.env` in this repository is not a working configuration.** It is a
   historical artifact that should never have been committed, and its values are
   being rotated and removed. Do not rely on anything in it. Use
   `server.env.example` — once present — or the table below.

This repository is published for reference and review. It is not yet
straightforwardly runnable by someone outside the organisation, and we would
rather say so than let you discover it.

## Architecture

```
          Aru-Client (browser)
                 │  REST + WebSocket
                 ▼
          ┌─────────────┐
          │ Aru-Server  │◄──── drones: FTP upload, RTMP ingest
          └──┬───┬───┬──┘
             │   │   └──────────────► RabbitMQ ──► workers:
             │   │                                  zip-decompress
             │   │                                  vod-transcode
             │   │                                  report-gen
             │   │                                  ai-deploy
             │   └──► MongoDB  (missions, tenants, users, layers)
             │        Redis    (cache, sessions)
             └──────► MinIO/S3 ──► TiTiler ──► COG raster tiles
```

Long-running work is never done in a request. The server publishes a job to
RabbitMQ and a dedicated worker picks it up — see
[vod-transcode](https://github.com/Kesowa/vod-transcode) and
[ai-oxide](https://github.com/Kesowa/ai-oxide) for examples.

## Layout

| Path                                      | Contents                                                         |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `src/app.ts`                              | Express application, middleware, session and logging setup       |
| `src/server.ts`                           | process entry point                                              |
| `src/socket.ts`, `src/socketControllers/` | WebSocket handling for live telemetry and video state            |
| `src/controllers/v1/`                     | HTTP route handlers, one per domain — around 35 of them          |
| `src/models/`                             | Mongoose schemas                                                 |
| `src/schemas/`                            | request validation                                               |
| `src/pipelines/`                          | MongoDB aggregation pipelines                                    |
| `src/apis/`                               | clients for external and sibling services                        |
| `src/utils/`                              | object storage, FTP, mail, and other shared helpers              |
| `src/views/`                              | server-rendered templates, chiefly email                         |
| `aru-common/`                             | **private submodule** — types and schemas shared with the client |
| `mongo-init.js`                           | seed data for a development database                             |

## Running it

With the submodule available:

```bash
git clone --recurse-submodules https://github.com/Kesowa/Aru-Server.git
cd Aru-Server
npm install
cp server.env.example server.env     # then fill in your own values
docker compose up                    # mongo, redis, minio, titiler, rabbitmq, workers
npm run dev                          # or let compose run the server too
```

`start_full.sh` and `stop_full.sh` bring the whole stack up and down together.

Other scripts:

```bash
npm run dev          # ts-node-dev with reload
npm run build        # tsc — note it is `tsc || true`, see below
npm test             # jest in watch mode
npm run lint:check   # eslint + prettier, read-only
npm run lint:fix     # apply fixes
```

## Configuration

Every variable below is read through `EnvVar` in `src/constants.ts`, which
**throws at startup if a required variable is missing** — the server fails fast
rather than running half-configured.

| Variable                                                                    | Purpose                                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `PORT`                                                                      | HTTP listen port                                                       |
| `MODE`                                                                      | `development` or `production`; controls cookie `secure` and log format |
| `MONGODB_CONNECTION_STRING`                                                 | MongoDB connection URI                                                 |
| `SECRET_KEY`                                                                | **session cookie signing secret** — see the warning below              |
| `API_SERVER`, `PUBLIC_SERVER`                                               | this server's own URL, and the client's public origin                  |
| `ARU_INSTANCE`                                                              | tenant identifier for this deployment                                  |
| `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`           | object storage                                                         |
| `CDN_URL`                                                                   | public base URL for stored assets                                      |
| `TITILER_SERVER`, `TITILER_PUBLIC`, `TITILER_STATIC`                        | raster tile service, internal and public                               |
| `RTMP_PUBLIC`, `LIVE_URL`                                                   | live video ingest and playback                                         |
| `FTP_HOST_DEV`, `FTP_HOST_PROD`, `FTP_PORT`, `FTP_USERNAME`, `FTP_PASSWORD` | FTP endpoint drones upload to                                          |
| `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`                | outbound mail                                                          |
| `MAP_KEY`                                                                   | Google Maps API key for server-side geocoding and static maps          |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`                                    | payments                                                               |
| `SEQ_URL`, `SEQ_KEY`                                                        | structured log sink                                                    |
| `AIML_SERVER`                                                               | inference service endpoint                                             |
| `RESET_PASSWORD_TOKEN_EXPIRE`                                               | password-reset token lifetime, in seconds                              |

### `SECRET_KEY` is security-critical

`src/app.ts` passes `SECRET_KEY` to `express-session` as the cookie signing
secret. Anyone who knows it can forge a valid session cookie for any user,
which is a complete authentication bypass.

Treat it accordingly: generate it randomly per environment, never share it
between environments, never commit it, and keep it out of logs.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Rotating it invalidates every active session, which is the intended behaviour
if it is ever exposed.

## Seed data

`mongo-init.js` populates a development database with a tenant, a super-admin, a
pilot, staff and client users, sample missions, flights and map layers.

**It is for local development only.** The accounts it creates share a single
known password, which is written in a comment next to its hash. Running this
against anything reachable creates an administrator account with a published
password. It is also not a fixture library — it writes real personal details for
a supplier contact, which should be replaced with generated data.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports go through
[SECURITY.md](SECURITY.md) and private disclosure, never a public issue.

## License

Released under the [MIT License](LICENSE). © Kesowa Infinite Ventures.
