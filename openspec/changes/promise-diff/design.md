## Context
Launch communication is often written by one person and implemented by another. When deadlines slip or scope changes, teams need a fast way to compare external promises with internal shipment reality.

## Goals
- Make the core comparison flow usable in under a minute
- Surface mismatches and risky claims in plain language
- Generate a concise honest-update draft that can be pasted into email, Slack, Discord, or changelog copy

## Non-Goals
- Integrating with Jira, Linear, GitHub issues, or docs APIs
- Multi-document project memory
- Full legal review or compliance guarantees

## Decisions
- Use a two-pane input: promised text and shipped text
- Require a real OpenRouter model call in the main flow
- Return structured JSON so the UI can render cards instead of a raw blob
- Keep deployment simple with React + Vite + Express on Cloud Run

## Risks / Trade-offs
- If users paste vague or low-detail text, the model may produce weaker comparisons
- Free models can vary in consistency; the app should support model swaps via env without code changes
- The tool should help users communicate honestly, but it cannot verify actual implementation truth beyond the pasted text
