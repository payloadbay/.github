# Payload Bay

**A safe landing place for every event.**

Payload Bay is an open-source, self-hosted webhook gateway for receiving,
verifying, storing, routing, retrying, and replaying events.

It helps applications receive webhooks through stable ingress URLs, preserve
the original requests, deliver events reliably, inspect failures, and reach
local or private services through outbound runners.

## Project status

Payload Bay is currently in early development. The architecture and public
interfaces may change while the core delivery model is being validated.

## Principles

- Self-hosted by default
- At-least-once delivery with durable event storage
- Provider-aware signature verification
- Configurable retries and replay
- No event, workspace, source, or runner limits in the Community Edition
- No dependency on a central Payload Bay service

## Links

- [Website](https://payloadbay.dev)
- [Documentation](https://payloadbay.dev/docs)

> Receive instantly. Deliver reliably.
