/**
 * The knowledge base is split into two document sets that are kept strictly
 * separate and independently auditable:
 *
 *  - SET A ("specialty"):   what Leah is allowed to state as clinical fact.
 *  - SET B ("conversion"):  how Leah is allowed to guide the conversation.
 *
 * Leah may only assert clinical facts sourced from set A, and may only use
 * persuasion approaches sourced from set B. Anything outside these sets is
 * redirected to a human. See packages/knowledge-base.
 */
export type KnowledgeSet = "specialty" | "conversion";

/**
 * A single modular, retrievable document — one topic per document so it can be
 * pulled individually rather than pasted whole into one giant prompt.
 */
export interface KnowledgeDoc {
  /** Stable id, e.g. "specialty/varicose-veins/procedure-overview". */
  id: string;
  set: KnowledgeSet;
  /** The condition this doc belongs to, e.g. "varicose-veins". */
  condition: string;
  /** Short topic slug, e.g. "procedure-overview" or "objection-cost". */
  topic: string;
  title: string;
  /** Markdown body. This is the only text Leah may draw facts/approach from. */
  body: string;
  /** Provenance — required for set A. Who approved this content. */
  approvedBy?: string;
  approvedAt?: string; // ISO date
  /** Bump when the content changes so transcripts can pin the version cited. */
  version: number;
  tags?: string[];
}

/** A chunk returned by the retriever, with its relevance score. */
export interface RetrievedChunk {
  docId: string;
  set: KnowledgeSet;
  condition: string;
  title: string;
  text: string;
  score: number;
  version: number;
}

export interface RetrievalQuery {
  text: string;
  set: KnowledgeSet;
  condition: string;
  topK?: number;
}

/**
 * The retrieval interface the voice engine depends on. Swap the implementation
 * (keyword, embedding, hybrid) without touching the engine.
 */
export interface Retriever {
  retrieve(query: RetrievalQuery): Promise<RetrievedChunk[]>;
}
