<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/payloadbay/brand/master/dist/logo/payloadbay-logo-dark-rounded.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/payloadbay/brand/master/dist/logo/payloadbay-logo-light-rounded.svg">
    <img src="https://raw.githubusercontent.com/payloadbay/brand/master/dist/logo/payloadbay-logo-light-rounded.svg" alt="Payload Bay" width="640">
  </picture>
</p>

<p align="center">
  <strong>A safe landing place for every event.</strong>
  <br>
  Receive instantly. Deliver reliably.
</p>

<p align="center">
  <a href="https://payloadbay.dev">Website</a>
  ·
  <a href="https://payloadbay.dev/docs">Documentation</a>
  ·
  <a href="https://github.com/orgs/payloadbay/discussions">Discussions</a>
  ·
  <a href="https://github.com/payloadbay/brand/blob/master/BRAND.md">Brand guide</a>
</p>

Payload Bay is an open-source, self-hosted webhook gateway for receiving,
verifying, storing, routing, retrying, and replaying events.

It gives external providers a stable ingress endpoint while keeping webhook
handling, delivery reliability, and private application access outside the
application itself.

## Brand

The [Payload Bay Brand Guide](https://github.com/payloadbay/brand/blob/master/BRAND.md)
is the official reference for approved claims, logo and icon usage, colors, and
public-facing language. Use the [generated assets](https://github.com/payloadbay/brand/tree/master/dist)
rather than copying or redrawing them.

## What Payload Bay does

- **Receive** webhooks through stable canonical URLs and custom aliases.
- **Verify** provider signatures against the unchanged request body.
- **Persist** events and receipts before acknowledging the provider.
- **Route** one event to HTTP targets or outbound application runners.
- **Deliver** asynchronously with honest at-least-once semantics.
- **Retry and replay** failed or previously received events.
- **Inspect** payloads, deliveries, attempts, responses, and incidents.
- **Reach private applications** without exposing inbound webhook endpoints.

## Self-hosted by default

Payload Bay Community is designed to run entirely in infrastructure controlled
by its operator. A Community installation does not require a Payload Bay
account, activation server, central cloud service, or external license
validation.

Core webhook functionality is not restricted by artificial event, workspace,
source, target, or runner limits. Practical capacity is determined by the
installation's own infrastructure.

## Principles

- Reliability before feature count
- At-least-once delivery instead of exactly-once claims
- Durable event storage and configurable retries
- Provider-aware signature verification
- Clear technical terminology without forced nautical metaphors
- No mandatory central telemetry or Payload Bay service dependency
- Community core features without artificial usage limits

## Project status

Payload Bay is in early development. The architecture and public interfaces may
change while the ingestion, queue, delivery, and runner models are validated.

The first implementation work focuses on proving the complete delivery path
before stabilizing the dashboard, public API, or SDK.

## Project links

- [payloadbay.dev](https://payloadbay.dev) - project website and documentation hub
- [Documentation](https://payloadbay.dev/docs) - public product and operations documentation
- [Community discussions](https://github.com/orgs/payloadbay/discussions) - Q&A, early ideas, and real-world use cases
- [Brand guide](https://github.com/payloadbay/brand/blob/master/BRAND.md) - approved identity and usage guidance
- [Brand assets](https://github.com/payloadbay/brand/tree/master/dist) - generated logo, icon, favicon, and palette assets
- [Organization standards](https://github.com/payloadbay/.github) - contribution, security, and repository baseline

> Reliable webhook delivery without coupling providers to your application.
