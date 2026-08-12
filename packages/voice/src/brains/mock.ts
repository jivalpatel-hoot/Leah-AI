import type { BrainAdapter, BrainContext, BrainReply } from "@leah/shared";

/**
 * A deterministic, offline BrainAdapter. It does NOT reason — it stitches
 * together the retrieved context in a stage-appropriate way. Its job is to let
 * the whole pipeline (retrieval → prompt → engine → guardrails → transcript)
 * run in tests and demos without any API key, and to serve as a reference for
 * the shape a real brain must return.
 *
 * It is intentionally conservative so it stays inside the guardrails.
 */
export class MockBrain implements BrainAdapter {
  readonly id = "claude" as const; // label demo data as if produced by Claude
  readonly name: string;
  readonly model = "mock";

  constructor(name = "Mock brain") {
    this.name = name;
  }

  async generateReply(context: BrainContext): Promise<BrainReply> {
    const topFact = context.specialtyContext[0];
    const citedDocIds = topFact ? [topFact.docId] : [];

    let text: string;
    switch (context.stage) {
      case "rapport":
        text =
          "Hi, this is Leah, an AI assistant with the practice — is now an okay time to talk for a couple of minutes about your visit?";
        break;
      case "targeted_education":
        text = topFact
          ? `Happy to help with that. In short: ${firstSentence(topFact.text)} Would it be useful if I walked through what the next step usually looks like?`
          : "That's a great question — I want to make sure you get an accurate answer, so let me connect you with our clinical team on that one.";
        break;
      case "objection_handling":
        text =
          "That's a really common and fair thing to want to understand before deciding. There's no pressure at all — the consultation is a no-obligation way to get your specific questions answered by the physician. Would it help to get one on the calendar?";
        break;
      case "close":
        text =
          "I have Tuesday at 2:15 or Thursday morning at 9:30 for a consultation — would either of those work for you?";
        break;
      default:
        text =
          "Let me connect you with someone on our team who can help with that.";
    }

    return {
      text,
      citedDocIds,
      suggestedStage: context.stage,
      wantsHumanHandoff: context.stage === "targeted_education" && !topFact,
      // Rough stand-in so cost aggregation has something to sum in dry runs.
      usage: {
        inputTokens: context.systemPrompt.length / 4,
        outputTokens: text.length / 4,
      },
    };
  }
}

function firstSentence(text: string): string {
  // Skip the sample-content blockquote lines and grab the first real sentence.
  const body = text
    .split("\n")
    .filter((l) => !l.trim().startsWith(">") && l.trim().length > 0)
    .join(" ");
  const match = /(.+?[.!?])\s/.exec(body);
  return (match?.[1] ?? body).trim();
}
