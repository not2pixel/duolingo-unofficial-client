# Security Policy

## Reporting Vulnerabilities

Please report suspected vulnerabilities privately to the project maintainers. Do
not include real Duolingo credentials, JWTs, cookies, or private account data in
reports, screenshots, logs, or reproduction fixtures.

## Token Safety

Users are responsible for protecting their own session tokens. Treat Duolingo
JWTs and cookies like passwords:

- Do not commit tokens to repositories.
- Do not paste real credentials into issue trackers, examples, or tests.
- Prefer short-lived local environment variables when experimenting.
- Rotate or log out sessions that may have been exposed.

This package never intentionally stores tokens persistently. Tokens are held in
memory only when supplied through `token` or returned by `tokenProvider`.

## Internal API Stability

Duolingo web endpoints are internal and may change without notice. A response
shape change can cause parsing errors or unexpected behavior. Report those
issues with sanitized examples only.

## Review Notes

The implementation is designed to avoid token leakage, arbitrary-host
credential forwarding, unsafe logging, persistent token storage, and unvalidated
response assumptions. Upstream JSON is validated with schemas before public
models are returned.
