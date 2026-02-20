# Agent Metrics Compliance Gap Checklist

## Current Status
- Agent event tracking exists (`toggle-agent`, `update-agent-config`, analytics event writes).
- No external standard mapping file is currently wired to enforce metric schema compliance.
- No strict validation layer ensuring every agent metric includes required compliance fields.

## Gaps
1. Missing canonical compliance schema for agent telemetry.
2. Missing per-event consent/retention classification tags.
3. Missing automated checks that reject non-compliant agent events.
4. Missing PII redaction guarantees for free-text agent payloads.

## Required Inputs
- External standards source/website URL to map required controls exactly.
- Required data retention policy by metric type.
- Approved list of fields allowed for export/reporting.

## Proposed Implementation (post-redesign)
1. Add `agent_metric_schema` JSON contract and validator middleware.
2. Enforce required fields: `event_type`, `actor_type`, `consent_scope`, `retention_class`, `pii_level`, `timestamp`.
3. Add redaction pass before persistence.
4. Add compliance test suite for all agent event producers.
5. Add dashboard for failed-compliance events and remediation.
