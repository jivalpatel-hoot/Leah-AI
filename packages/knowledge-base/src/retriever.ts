import type {
  KnowledgeDoc,
  RetrievalQuery,
  RetrievedChunk,
  Retriever,
} from "@leah/shared";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "to",
  "of", "in", "on", "for", "with", "as", "at", "by", "it", "this", "that", "i",
  "you", "we", "my", "me", "do", "does", "can", "will", "would", "should",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * A dependency-free keyword retriever. Scores each doc by overlap between the
 * query terms and the doc's title, tags, topic, and body (title/tags weighted).
 *
 * This is deliberately simple — good enough to exercise the pipeline and run the
 * early side-by-side brain comparisons. Before real pilot volume, swap this for
 * an embedding-based retriever behind the same `Retriever` interface.
 * TODO(kb): replace with hybrid embedding + keyword retrieval.
 */
export class KeywordRetriever implements Retriever {
  private readonly docs: KnowledgeDoc[];

  constructor(docs: KnowledgeDoc[]) {
    this.docs = docs;
  }

  async retrieve(query: RetrievalQuery): Promise<RetrievedChunk[]> {
    const topK = query.topK ?? 3;
    const terms = tokenize(query.text);
    const termSet = new Set(terms);

    const candidates = this.docs.filter((doc) => {
      if (doc.set !== query.set) return false;
      // Set B ("conversion") docs filed under "general" apply to every condition.
      if (doc.condition === query.condition) return true;
      if (doc.set === "conversion" && doc.condition === "general") return true;
      return false;
    });

    const scored = candidates
      .map((doc) => ({ doc, score: this.score(doc, termSet) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ doc, score }) => ({
      docId: doc.id,
      set: doc.set,
      condition: doc.condition,
      title: doc.title,
      text: doc.body,
      score,
      version: doc.version,
    }));
  }

  private score(doc: KnowledgeDoc, terms: Set<string>): number {
    const title = new Set(tokenize(doc.title));
    const topic = new Set(tokenize(doc.topic.replace(/-/g, " ")));
    const tags = new Set((doc.tags ?? []).flatMap((t) => tokenize(t)));
    const body = tokenize(doc.body);

    let score = 0;
    for (const term of terms) {
      if (title.has(term)) score += 5;
      if (topic.has(term)) score += 4;
      if (tags.has(term)) score += 3;
    }
    // Body term-frequency, dampened.
    const bodyFreq = new Map<string, number>();
    for (const t of body) bodyFreq.set(t, (bodyFreq.get(t) ?? 0) + 1);
    for (const term of terms) {
      const freq = bodyFreq.get(term) ?? 0;
      if (freq > 0) score += 1 + Math.log(freq);
    }
    return score;
  }
}
