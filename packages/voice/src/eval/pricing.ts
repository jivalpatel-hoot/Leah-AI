/**
 * List prices in USD per 1M tokens, for estimating comparison cost. Keep these
 * in sync with the providers' pricing pages — they are the cost half of the
 * accuracy/tone/cost tradeoff the brief asks us to weigh.
 * TODO(eval): refresh periodically; OpenAI figures are approximate.
 */
export interface ModelPrice {
  inputPerM: number;
  outputPerM: number;
}

export const PRICES: Record<string, ModelPrice> = {
  // Anthropic (claude-api skill, cached 2026-06-24)
  "claude-opus-5": { inputPerM: 5, outputPerM: 25 },
  "claude-opus-4-8": { inputPerM: 5, outputPerM: 25 },
  "claude-sonnet-5": { inputPerM: 3, outputPerM: 15 }, // $2/$10 intro through 2026-08-31
  "claude-haiku-4-5": { inputPerM: 1, outputPerM: 5 },
  // OpenAI (approximate list prices)
  "gpt-4o": { inputPerM: 2.5, outputPerM: 10 },
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
};

/** Dollar cost of a token count for a model, or null if the price is unknown. */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const p = PRICES[model];
  if (!p) return null;
  return (inputTokens / 1_000_000) * p.inputPerM + (outputTokens / 1_000_000) * p.outputPerM;
}
