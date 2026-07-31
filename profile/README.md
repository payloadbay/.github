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
  <a href="https://github.com/payloadbay/payloadbay">Product repository</a>
  ·
  <a href="https://github.com/orgs/payloadbay/discussions">Discussions</a>
  ·
  <a href="https://github.com/payloadbay/brand/blob/master/BRAND.md">Brand guide</a>
</p>

Payload Bay is an open-source, self-hosted platform for receiving, verifying,
storing, routing, and reliably delivering webhooks and events.

External providers should be able to send an event to a stable ingress URL
without being coupled directly to an application's availability, network
location, or retry behavior. Payload Bay provides the layer in between: a place
where the original request can arrive, be verified and retained, then be
delivered through a controlled path.

## What Payload Bay is being built to do

- Receive events through canonical ingress URLs and custom aliases.
- Preserve the original request body and relevant request metadata.
- Verify provider signatures and identify duplicate or replayed events.
- Store events, receipts, deliveries, and delivery attempts durably.
- Route one event to HTTP targets or private applications reached through
  outbound runners.
- Retry failed deliveries, respect retry guidance where applicable, and make
  dead deliveries visible.
- Replay stored events when an application, target, or configuration needs to
  catch up.
- Inspect events, delivery attempts, responses, and operational incidents.
- Help local, preview, staging, and private production applications receive
  events without requiring an inbound public webhook endpoint.
- Provide provider-aware integrations alongside generic and custom webhook
  handling.

The product is intentionally focused. It is not a visual automation builder, a
general-purpose job platform, or a replacement for a message broker.

## Why Payload Bay

> A safe landing place for every event.

An incoming event should not disappear because an application is temporarily
unavailable, lives behind a firewall, or cannot safely expose a public endpoint.

Payload Bay is being built around a simple model: receive the event first,
verify it, keep a durable record, create the required deliveries, and make the
result observable. The delivery guarantee is deliberately honest:
at-least-once delivery. Receivers can use event and delivery identifiers to
deduplicate when needed.

## Community first

Payload Bay is an open-source project first. Community is intended to be a
capable self-hosted product that people choose because it is good software, not
because a restricted free tier happens to fit their current quota.

A self-hosted installation should not become less useful because it receives
more events, adds another source, connects another runner, or reaches an
arbitrary product limit. Practical capacity depends on the infrastructure an
operator chooses to run.

Donations and sponsorship are optional ways to support the project.

## Project status

Payload Bay is in early development. The architecture and public interfaces may
change while the first version is built and validated. The organization, public
identity, and development standards are already in place; implementation is now
beginning in the product repository.

## Get involved

- [Follow the product repository](https://github.com/payloadbay/payloadbay)
- [Join Discussions](https://github.com/orgs/payloadbay/discussions) for questions, ideas, and show-and-tell
- [Read the contribution guide](https://github.com/payloadbay/.github/blob/master/CONTRIBUTING.md)
- [Report a security issue privately](https://github.com/payloadbay/.github/blob/master/SECURITY.md)

## Project resources

- [Product repository](https://github.com/payloadbay/payloadbay)
- [Brand guide and assets](https://github.com/payloadbay/brand)
- [Organization standards](https://github.com/payloadbay/.github)

> Reliable webhook delivery without coupling providers to your application.
