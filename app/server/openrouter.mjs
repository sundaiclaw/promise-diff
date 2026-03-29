const OPENROUTER_TIMEOUT_MS = 45000;

const systemPrompt = `You are Promise Diff, an expert product operations analyst. Compare promised launch copy against shipped reality.

Return valid JSON only. Do not wrap it in markdown fences. Do not include commentary before or after the JSON.

Use this exact shape:
{
  "summary": "1-2 sentence overview of the comparison.",
  "verdict": "Short headline verdict.",
  "matches": [
    {
      "claim": "What appears to have shipped as promised.",
      "whyItMatches": "Why this is a match.",
      "promiseEvidence": "Short quote or paraphrase from promised text.",
      "shippedEvidence": "Short quote or paraphrase from shipped text."
    }
  ],
  "misses": [
    {
      "claim": "What was promised but not fully shipped.",
      "gap": "What is missing or incomplete.",
      "promiseEvidence": "Short quote or paraphrase from promised text.",
      "shippedEvidence": "Short quote or paraphrase from shipped text.",
      "impact": "low | medium | high"
    }
  ],
  "overclaims": [
    {
      "claim": "Potentially overstated promise or implication.",
      "whyRisky": "Why it could be seen as an overclaim.",
      "promiseEvidence": "Short quote or paraphrase from promised text.",
      "shippedEvidence": "Short quote or paraphrase from shipped text.",
      "impact": "low | medium | high"
    }
  ],
  "risks": [
    {
      "text": "Risky wording or expectation-management issue.",
      "reason": "Why it may create trust or support risk.",
      "impact": "low | medium | high"
    }
  ],
  "recommendedNextStep": "One practical internal next step.",
  "honestUpdateMarkdown": "Markdown update draft written for customers. Be specific, calm, and honest. Include: what shipped, what did not, and what's next."
}

Rules:
- Ground every point in the supplied text only.
- If there are no items for a list, return an empty array.
- Keep each list item concise and specific.
- Prefer precise language over hype.
- The honestUpdateMarkdown should be ready to paste into email, Slack, Discord, or a changelog.`;

class OpenRouterError extends Error {
  constructor(code, message, status = 500) {
    super(message);
    this.name = 'OpenRouterError';
    this.code = code;
    this.status = status;
  }
}

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new OpenRouterError(
      'config_error',
      `Missing required environment variable: ${name}`,
      500,
    );
  }

  return value;
}

function getMessageText(messageContent) {
  if (typeof messageContent === 'string') {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.type === 'text' && typeof item.text === 'string') {
          return item.text;
        }

        return '';
      })
      .join('')
      .trim();
  }

  return '';
}

function extractJsonObject(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new OpenRouterError('parse_error', 'OpenRouter returned an empty response.', 502);
  }

  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new OpenRouterError('parse_error', 'Could not find a JSON object in the model response.', 502);
  }

  return withoutFences.slice(start, end + 1);
}

function asTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() || fallback : fallback;
}

function normalizeImpact(value) {
  const normalized = asTrimmedString(value).toLowerCase();
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high') {
    return normalized;
  }
  return 'medium';
}

function normalizeMatch(item) {
  return {
    claim: asTrimmedString(item?.claim),
    whyItMatches: asTrimmedString(item?.whyItMatches),
    promiseEvidence: asTrimmedString(item?.promiseEvidence),
    shippedEvidence: asTrimmedString(item?.shippedEvidence),
  };
}

function normalizeMiss(item) {
  return {
    claim: asTrimmedString(item?.claim),
    gap: asTrimmedString(item?.gap),
    promiseEvidence: asTrimmedString(item?.promiseEvidence),
    shippedEvidence: asTrimmedString(item?.shippedEvidence),
    impact: normalizeImpact(item?.impact),
  };
}

function normalizeOverclaim(item) {
  return {
    claim: asTrimmedString(item?.claim),
    whyRisky: asTrimmedString(item?.whyRisky),
    promiseEvidence: asTrimmedString(item?.promiseEvidence),
    shippedEvidence: asTrimmedString(item?.shippedEvidence),
    impact: normalizeImpact(item?.impact),
  };
}

function normalizeRisk(item) {
  return {
    text: asTrimmedString(item?.text || item?.claim),
    reason: asTrimmedString(item?.reason || item?.whyRisky),
    impact: normalizeImpact(item?.impact),
  };
}

function normalizeList(items, mapper) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .slice(0, 8)
    .map((item) => mapper(item ?? {}))
    .filter((item) => Object.values(item).some((value) => typeof value === 'string' && value.length > 0));
}

function buildFallbackMarkdown(summary, verdict) {
  return `## Honest update\n\n${summary}\n\n**Current read:** ${verdict}\n\n- Confirm the shipped scope in customer-facing language.\n- Call out the missing pieces clearly.\n- Share the next milestone and timing only if you can stand behind it.`;
}

function normalizeAnalysis(raw) {
  const summary = asTrimmedString(
    raw?.summary,
    'The promised scope and shipped scope diverge enough that the release copy should be tightened before sending.',
  );
  const verdict = asTrimmedString(raw?.verdict, 'Needs a more candid update');

  return {
    summary,
    verdict,
    matches: normalizeList(raw?.matches, normalizeMatch),
    misses: normalizeList(raw?.misses, normalizeMiss),
    overclaims: normalizeList(raw?.overclaims, normalizeOverclaim),
    risks: normalizeList(raw?.risks, normalizeRisk),
    recommendedNextStep: asTrimmedString(
      raw?.recommendedNextStep,
      'Have product and support review the draft before sharing it externally.',
    ),
    honestUpdateMarkdown: asTrimmedString(
      raw?.honestUpdateMarkdown || raw?.updateDraftMarkdown,
      buildFallbackMarkdown(summary, verdict),
    ),
  };
}

export async function comparePromiseDiff({ promisedText, shippedText }) {
  const baseUrl = getRequiredEnv('OPENROUTER_BASE_URL');
  const apiKey = getRequiredEnv('OPENROUTER_API_KEY');
  const model = getRequiredEnv('OPENROUTER_MODEL');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_BASE_URL || 'https://sundai-demo.local',
        'X-Title': 'Sundai Promise Diff',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: JSON.stringify(
              {
                promisedText,
                shippedText,
              },
              null,
              2,
            ),
          },
        ],
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `OpenRouter request failed with status ${response.status}.`;

      throw new OpenRouterError('upstream_error', message, response.status);
    }

    const content = getMessageText(payload?.choices?.[0]?.message?.content);
    const jsonText = extractJsonObject(content);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new OpenRouterError('parse_error', 'The model returned invalid JSON.', 502);
    }

    return normalizeAnalysis(parsed);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new OpenRouterError(
        'timeout_error',
        'The OpenRouter request timed out. Try again with shorter input or a different model.',
        504,
      );
    }

    if (error instanceof OpenRouterError) {
      throw error;
    }

    throw new OpenRouterError(
      'upstream_error',
      error.message || 'Unable to reach OpenRouter.',
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
