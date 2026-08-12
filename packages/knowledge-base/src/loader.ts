import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { KnowledgeDoc } from "@leah/shared";
import { parseFrontmatter, toKnowledgeDoc } from "./frontmatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the content/ directory (../content relative to src/). */
export const CONTENT_ROOT = join(__dirname, "..", "content");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Load and validate every knowledge document from disk. Throws on the first
 * malformed doc so a bad edit fails loudly rather than silently dropping
 * content Leah relies on.
 */
export function loadAllDocs(root: string = CONTENT_ROOT): KnowledgeDoc[] {
  const files = walk(root);
  const docs = files.map((file) => {
    try {
      return toKnowledgeDoc(parseFrontmatter(readFileSync(file, "utf8")));
    } catch (err) {
      throw new Error(
        `Failed to load knowledge doc ${file}: ${(err as Error).message}`,
      );
    }
  });

  const ids = new Set<string>();
  for (const doc of docs) {
    if (ids.has(doc.id)) throw new Error(`Duplicate knowledge doc id: ${doc.id}`);
    ids.add(doc.id);
  }
  return docs;
}

/** Docs in set A ("specialty") that still lack physician approval. */
export function unapprovedSpecialtyDocs(docs: KnowledgeDoc[]): KnowledgeDoc[] {
  return docs.filter(
    (d) =>
      d.set === "specialty" &&
      (!d.approvedBy || d.approvedBy.startsWith("TODO") || !d.approvedAt || d.approvedAt.startsWith("TODO")),
  );
}
