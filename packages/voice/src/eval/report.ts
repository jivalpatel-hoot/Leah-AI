import { RUBRIC } from "./judge.js";
import type { BrainSummary, ComparisonReport } from "./compare.js";

/** Render the comparison as a Markdown report the team can read and commit. */
export function renderMarkdown(report: ComparisonReport, stampedAt?: string): string {
  const lines: string[] = [];
  lines.push("# Leah — Brain comparison");
  lines.push("");
  if (stampedAt) lines.push(`_Generated ${stampedAt}._`);
  lines.push(
    `Judge: **${report.judgeName}** · Scenarios: ${report.scenarios.length} · Brains: ${report.brains.length}`,
  );
  lines.push("");

  // Ranking (best overall first; errored brains last).
  const ranked = [...report.brains].sort((a, b) => {
    if (a.errored !== b.errored) return a.errored ? 1 : -1;
    return b.overall - a.overall;
  });
  const winner = ranked.find((b) => !b.errored);
  if (winner) {
    lines.push(`**Top scorer: ${winner.name}** at ${winner.overall.toFixed(2)}/5 overall.`);
    lines.push("");
  }

  // Headline table.
  lines.push("## Summary");
  lines.push("");
  lines.push("| Brain | Model | Overall | Open flags | Avg latency | Tokens (in/out) | Est. cost |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const b of ranked) {
    lines.push(
      `| ${b.name} | \`${b.model}\` | ${fmtScore(b)} | ${b.openFlags} | ${fmtMs(b.avgLatencyMs)} | ${b.totalInputTokens}/${b.totalOutputTokens} | ${fmtCost(b.estCost)} |`,
    );
  }
  lines.push("");

  // Per-dimension table.
  lines.push("## Scores by dimension (1–5)");
  lines.push("");
  lines.push(`| Brain | ${RUBRIC.map((r) => r.label).join(" | ")} |`);
  lines.push(`|---|${RUBRIC.map(() => "---").join("|")}|`);
  for (const b of ranked) {
    if (b.errored) {
      lines.push(`| ${b.name} | ${RUBRIC.map(() => "—").join(" | ")} |`);
      continue;
    }
    lines.push(`| ${b.name} | ${RUBRIC.map((r) => b.avgScores[r.key].toFixed(1)).join(" | ")} |`);
  }
  lines.push("");

  // Per-scenario detail.
  lines.push("## Per-scenario detail");
  for (const scenario of report.scenarios) {
    lines.push("");
    lines.push(`### ${scenario.title}`);
    lines.push(`_${scenario.probe}_`);
    lines.push("");
    lines.push("| Brain | Overall | Flags | Rationale |");
    lines.push("|---|---|---|---|");
    for (const b of ranked) {
      const r = b.results.find((x) => x.scenario.id === scenario.id);
      if (!r) continue;
      if (r.run.errored) {
        lines.push(`| ${b.name} | — | — | errored: ${escapePipes(r.run.error ?? "")} |`);
        continue;
      }
      const openFlags = r.run.turns.flatMap((t) => t.flags).filter((f) => f.open).length;
      lines.push(
        `| ${b.name} | ${r.judged.overall.toFixed(1)} | ${openFlags} | ${escapePipes(r.judged.rationale)} |`,
      );
    }
  }
  lines.push("");

  // Full transcripts, for human review (the pilot reviews 100%).
  lines.push("## Transcripts");
  for (const scenario of report.scenarios) {
    lines.push("");
    lines.push(`### ${scenario.title}`);
    for (const b of ranked) {
      const r = b.results.find((x) => x.scenario.id === scenario.id);
      if (!r || r.run.errored) continue;
      lines.push("");
      lines.push(`**${b.name}**`);
      lines.push("");
      for (const t of r.run.turns) {
        lines.push(`> **Patient:** ${t.patient}`);
        const cites = t.citedDocIds.length ? `  \n> _cites: ${t.citedDocIds.join(", ")}_` : "";
        const flags = t.flags.length ? `  \n> ⚑ _${t.flags.map((f) => f.type).join(", ")}_` : "";
        lines.push(`> **Leah:** ${t.leah}${cites}${flags}`);
        lines.push(">");
      }
    }
  }
  lines.push("");

  lines.push("---");
  lines.push(
    "_Cost is an estimate from list prices in `pricing.ts`; latency includes retrieval and is machine-dependent. Scores come from an LLM judge and should be read alongside the transcripts, not instead of them._",
  );
  lines.push("");
  return lines.join("\n");
}

function fmtScore(b: BrainSummary): string {
  return b.errored ? "— (errored)" : `**${b.overall.toFixed(2)}**`;
}
function fmtMs(ms: number): string {
  return ms ? `${Math.round(ms)} ms` : "—";
}
function fmtCost(c: number | null): string {
  return c === null ? "n/a" : `$${c.toFixed(4)}`;
}
function escapePipes(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
