# Security Policy

## Reporting a vulnerability

**Please report privately. Do not open a public issue.**

- GitHub [private vulnerability reporting](https://github.com/Kesowa/Aru-Server/security/advisories/new)
  on this repository, or
- email **security@kesowa.com**

Include what you did, what happened and what you expected, with enough detail
to reproduce. We will acknowledge your report and tell you whether we intend to
fix it, and when.

**Test only against your own local deployment.** Do not test against any
Kesowa-operated or customer environment, and do not use any credential you find
in this repository or its history to access a system. Doing either takes you
outside this policy.

## Credentials in this repository's history

This repository is a backend that was developed privately and later opened up.
Configuration containing credentials was committed during that period, and
**git history retains values that were live at the time**.

We know. Those credentials are being rotated, and configuration is moving out
of version control. You do not need to enumerate them for us.

What is genuinely useful to report:

- **A credential you have reason to believe is still valid.** Tell us where you
  found it and why you think it is live. Do not test it against our
  infrastructure to find out — tell us and we will check.
- **A credential in a place we are unlikely to have looked**, such as a test
  fixture, a lockfile, a build artifact, a Docker layer or a git object on an
  unmerged branch.

Please disclose these privately. A public issue naming a live credential makes
the problem worse.

## What this service is

A multi-tenant API handling drone mission data for several organisations. The
important property is **tenant isolation**: a user in one tenant must never read
or affect another tenant's data. Authorization is enforced here, in the server —
[Aru-Client](https://github.com/Kesowa/Aru-Client) is a rendering layer and
enforces nothing.

## In scope

Highest value first:

- **Cross-tenant data access.** Any route where a `tenantId` is taken from
  request input rather than the session, or where an aggregation pipeline omits
  a tenant filter. This is the most serious class of bug this codebase can have.
- **Authentication and session handling.** Session fixation, privilege
  escalation between the `super-admin`, `tenant-root`, `tenant-staff` and
  `tenant-client` roles, weaknesses in the password-reset or login-OTP flow.
- **Authorization gaps** in the permission system — a route that does not check
  the permission it should, or a permission that grants more than its name
  suggests.
- **Injection.** NoSQL injection through unvalidated query input is the main
  risk given MongoDB and Mongoose; also command injection anywhere the server
  shells out to a processing tool.
- **Insecure direct object references.** Mongo `ObjectId`s are guessable in
  sequence; any route that fetches by id without an ownership check is a finding.
- **File upload and path handling.** Arbitrary write through an FTP upload,
  archive entry or layer filename, or traversal in asset-serving routes.
- **Server-side request forgery**, especially where the server fetches a
  user-supplied URL for raster or layer import.
- **Payment flow integrity** — unverified Razorpay webhooks, or a client-supplied
  amount being trusted.
- **Vulnerable dependencies**, with a plausible exploit path through this code.

## Out of scope

- Credentials in `server.env` or in git history, as described above.
- `mongo-init.js` seed accounts and their shared password. That file is
  development-only, documented as such in the README, and is not deployed. If
  you can show it running against a reachable environment, that **is** in scope.
- Internal hostnames, container names and `localhost` URLs in configuration and
  compose files. These are not reachable infrastructure.
- The inability to build from a fresh clone, caused by the private `aru-common`
  submodule. Known, and documented in the README.
- Missing authorization in Aru-Client where the server enforces it correctly.
- Findings in Express, Mongoose, MongoDB, MinIO or other upstream dependencies
  with no exploit path through this application. Report those upstream.
- Reports consisting only of automated scanner output with no demonstrated
  impact.

## A note on `tsc || true`

`npm run build` is `tsc || true`, so **the build succeeds even when type
checking fails**. Type errors that would normally block a release do not. If a
vulnerability depends on a type error reaching production, say so — that chain
is realistic here, not theoretical.
