# Promise Diff

## OpenSpec change
promise-diff

## What it does
Promise Diff compares what you promised with what you actually shipped. It highlights matches, gaps, overclaims, and risky wording, then drafts an honest customer-facing update.

## Tech stack
- React + Vite frontend
- Node.js + Express backend
- OpenRouter chat completions using a free model from env
- Markdown rendering for the update draft

## AI integration requirements
- Use OpenRouter env vars only
- Make a real model call in the main user flow
- Return structured JSON plus markdown update draft
- Render the response as readable cards and formatted text

## Demo flow
1. Paste launch promises / announcement copy.
2. Paste shipped reality / release notes.
3. Click Compare.
4. View matches, misses, overclaims, risks, and a ready-to-send honest update.
