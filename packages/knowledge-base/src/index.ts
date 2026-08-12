import type { KnowledgeDoc, Retriever } from "@leah/shared";
import { loadAllDocs } from "./loader.js";
import { KeywordRetriever } from "./retriever.js";

export * from "./frontmatter.js";
export * from "./loader.js";
export * from "./retriever.js";

/**
 * Convenience factory: load every doc from disk and return a ready-to-use
 * retriever plus the docs it was built from.
 */
export function createKnowledgeBase(): { docs: KnowledgeDoc[]; retriever: Retriever } {
  const docs = loadAllDocs();
  return { docs, retriever: new KeywordRetriever(docs) };
}
