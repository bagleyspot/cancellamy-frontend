# Security policy

Cancellamy handles personal data, so security reports are taken seriously.

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private reporting:
[Report a vulnerability](https://github.com/bagleyspot/cancellamy-frontend/security/advisories/new)
(Security tab → Report a vulnerability). Issues in the API belong to the
[backend repository](https://github.com/bagleyspot/cancellamy-backend/security/advisories/new); if unsure, report here.

What to expect: an acknowledgement within 5 working days, a first assessment within 10 working days, and a fix or a
mitigation plan for confirmed issues, coordinated with you before public disclosure. Credit is given in the advisory
unless you prefer to stay anonymous.

## Supported versions

The project is pre-1.0: only the latest release and `main` receive security fixes.

## Scope

In scope: the web app, its Docker image and nginx configuration. Out of scope: social engineering, denial of service
by volume, and third-party services.

## Design notes

- The access token lives in memory only; the refresh token is an httpOnly cookie managed by the API.
- Production is nginx with a strict Content-Security-Policy (`deploy/`): no external scripts, fonts or images.
- No secrets belong in `VITE_*` variables: they are public in the built bundle.

## Repository safeguards

`main` is protected (pull request and passing checks required, no force-push), GitHub secret scanning with push
protection and Dependabot alerts are on, CI runs CodeQL, dependency review, gitleaks and a container scan, and
release images are published with provenance and SBOM attestations.
