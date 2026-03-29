# Promise Diff

Promise Diff compares what you promised with what you actually shipped, then drafts the honest customer update before your launch copy turns into trust debt.

## What it does

- compares promise text against shipped reality with a real OpenRouter model
- highlights true matches, missing promises, overclaims, and trust risks
- drafts a calm, honest markdown update you can paste into release notes, Slack, Discord, or email
- gives teams a quick pre-launch reality check when announcements outrun scope

## How to Run (from zero)

### Prerequisites

- Node.js 22+
- an OpenRouter API key
- a free OpenRouter model name

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/sundaiclaw/promise-diff.git
   ```
2. Enter the app directory:
   ```bash
   cd promise-diff/app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create an env file:
   ```bash
   cp .env.example .env
   ```
5. Set the env vars in `.env`:
   ```bash
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
   OPENROUTER_API_KEY=your_key_here
   PORT=8787
   ```
6. Start the app:
   ```bash
   npm run dev
   ```
7. Open the local URL:
   ```
   http://localhost:5173
   ```

## Limitations / known gaps

- The app only knows what you paste; it does not verify the underlying product truth.
- It does not yet ingest screenshots, docs, or external release-note files.
- Some free models can be inconsistent, so env-based model swaps are important.
- It currently analyzes one promise/reality pair at a time.

## Stack

- React + Vite
- Express
- OpenRouter chat completions
- Cloud Run
- OpenSpec + Fabro workflow

Build on Sundai Club on March 29, 2026  
Sundai Project: https://www.sundai.club/projects/ddde606d-e643-48a1-bdad-78353a4edc3b
