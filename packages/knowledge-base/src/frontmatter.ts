import type { KnowledgeDoc, KnowledgeSet } from "@leah/shared";

/**
 * A tiny, dependency-free frontmatter parser. Docs are markdown files that open
 * with a `--- ... ---` block of `key: value` lines. We deliberately avoid a YAML
 * dependency: the frontmatter here is intentionally simple so non-engineers can
 * edit it safely.
 */
export interface ParsedDoc {
  meta: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): ParsedDoc {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) {
    throw new Error("Document is missing a frontmatter block");
  }
  const [, frontmatter = "", body = ""] = match;
  const meta: Record<string, string> = {};
  for (const line of frontmatter.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip optional surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { meta, body: body.trim() };
}

/** Turn a parsed markdown file into a validated KnowledgeDoc. */
export function toKnowledgeDoc(parsed: ParsedDoc): KnowledgeDoc {
  const { meta, body } = parsed;
  const required = ["id", "set", "condition", "topic", "title", "version"];
  for (const key of required) {
    if (!meta[key]) {
      throw new Error(`Knowledge doc "${meta.id ?? "<unknown>"}" is missing "${key}"`);
    }
  }
  const set = meta.set as KnowledgeSet;
  if (set !== "specialty" && set !== "conversion") {
    throw new Error(`Knowledge doc "${meta.id}" has invalid set "${meta.set}"`);
  }
  return {
    id: meta.id!,
    set,
    condition: meta.condition!,
    topic: meta.topic!,
    title: meta.title!,
    body,
    approvedBy: meta.approvedBy,
    approvedAt: meta.approvedAt,
    version: Number(meta.version),
    tags: meta.tags
      ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined,
  };
}
