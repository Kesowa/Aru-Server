# Contributing

## Getting set up

```bash
git clone --recurse-submodules https://github.com/Kesowa/Aru-Server.git
npm install
cp server.env.example server.env    # fill in your own values
docker compose up -d                # mongo, redis, minio, titiler, rabbitmq
npm run dev
```

`aru-common` is a **private submodule**, so a clone from outside Kesowa cannot
complete this. See the README.

## Branches

The intended flow, from the original README, is:

1. Create a feature branch from `dev`
2. Merge the feature branch into `dev`
3. Merge `dev` into `dev-aws`
4. Merge `dev` into `master`
5. Merge `dev-aws` into `master-aws`

In practice `master` is the branch that ships. Branch from `master` unless you
know you need the AWS line, and name the branch after its Jira issue
(`ARU-431-...`). Leave the Dependabot branches alone unless you are doing
dependency work.

## Before you push

```bash
npm run lint:fix
npm run lint:check
npx tsc --noEmit     # NOT npm run build — see below
npm test
```

**Run `npx tsc --noEmit`, not `npm run build`.** The build script is
`tsc || true`, which swallows every type error and exits zero, so it will
happily "succeed" on code that does not type check. That masking is a known
problem; please do not rely on it, and do not add to the error count.

CI runs Prettier and pushes formatting fixes back onto your branch, so running
`lint:fix` first saves a round trip.

## Style

- TypeScript throughout. Prefer a real type over `any`; shared types belong in
  `aru-common` so the client and server cannot drift.
- Prettier owns formatting. Do not reformat files you are not otherwise
  changing.
- Route handlers stay thin. Query construction goes in `src/pipelines/`,
  validation in `src/schemas/`, external calls in `src/apis/`.
- Read configuration through `EnvVar` in `src/constants.ts` so a missing
  variable fails at startup rather than at first use.
- Never do long-running work in a request. Publish a job to RabbitMQ and let a
  worker handle it, as the transcode and report paths do.

## Two rules that matter more than style

### 1. Always scope queries by tenant

This is a multi-tenant system, and cross-tenant data leakage is the worst bug
this codebase can produce.

- Take `tenantId` from the authenticated session. **Never** from a request body,
  query string or path parameter.
- Every find, update, delete and aggregation touching tenant-owned data needs a
  tenant filter. There is no default scope that applies one for you.
- A lookup by `ObjectId` alone is not safe. Ids are guessable in sequence, so
  fetching by id without an ownership check is an access-control bug.
- Say explicitly in your pull request how your change is tenant-scoped. A
  reviewer should not have to work it out.

### 2. Never commit a credential

This repository has a real history of committed secrets, including a session
signing secret and a production credential set, some live for years. It is the
most expensive mistake in this codebase's history.

- Configuration goes in `server.env`, which must stay git-ignored. Document new
  variables in `server.env.example` with placeholder values only.
- Check `git diff --cached` before every commit.
- `SECRET_KEY` signs session cookies. Exposing it is a full authentication
  bypass — generate it per environment and never reuse one.
- If you commit a secret, **say so immediately** rather than quietly removing it
  in a follow-up commit. It needs rotating, and a later deletion does not remove
  it from history. Nobody will be annoyed at you for reporting it; the damage
  comes from the delay.

## Pull requests

1. Open or reference an issue for anything beyond a small fix.
2. Keep the change focused. This is a large codebase and broad changes are hard
   to review properly.
3. Describe what you tested. Say which roles you exercised a permission change
   against — `super-admin`, `tenant-root`, `tenant-staff` and `tenant-client`
   behave differently and a change that works for one often breaks another.
4. Note any migration a schema change needs. There is no migration framework,
   so this has to be handled deliberately.
5. Check your diff for credentials, `server.env`, and leftover `console.log`.

## Testing

Jest, with `npm test` running in watch mode. Coverage is thin for a codebase
this size, so new tests are welcome — particularly around authorization, where
a regression is both likely and costly.

When you need fixture data, generate it with `@faker-js/faker`, which is already
a dependency. Do not add real personal details; `mongo-init.js` contains a
supplier contact's real phone number and email, and that is a mistake we do not
want repeated.

## License

Contributions are accepted under the [MIT License](LICENSE) covering this
repository. Note that `package.json` still declares `ISC`; LICENSE is the
authority, and the mismatch should be fixed.
