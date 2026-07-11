# Agent pipelines

Agent infrastructure is deferred to Phase 9. These invariants apply now:

- Agents never modify `appointments`, `queue_sessions`, `queue_entries`, or
  `queue_events`.
- Outputs are tagged as `suggestion`, `draft`, `prediction`, or
  `approved_action`.
- High-risk actions require human review.
- Inputs, outputs, provider metadata, duration, and feedback are retained.

The first rollout includes reminder, queue-intelligence, and support agents.
