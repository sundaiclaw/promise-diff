## ADDED Requirements

### Requirement: Compare promises to shipped reality
The system MUST let a user provide a promised/announced text and a shipped/reality text, then compare them with AI.

#### Scenario: Analyze two texts
- **WHEN** the user submits both texts
- **THEN** the system returns a structured comparison
- **AND** includes aligned items, missing promises, overclaims, and risky wording

### Requirement: Draft an honest update
The system MUST generate a concise customer-facing update that reflects the comparison.

#### Scenario: Generate an update draft
- **WHEN** the analysis completes
- **THEN** the system returns a markdown draft the user can copy
- **AND** the draft avoids pretending missing work already shipped

### Requirement: Render a human-friendly result
The system MUST present the AI result in readable sections rather than a raw JSON dump.

#### Scenario: View result
- **WHEN** the system returns an analysis
- **THEN** the UI shows cards/lists for matches, gaps, overclaims, and risks
- **AND** the honest update is rendered as formatted markdown
