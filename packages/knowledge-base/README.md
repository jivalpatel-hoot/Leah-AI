# @leah/knowledge-base

> "The model itself will always be a general-purpose engine underneath. What
> makes Leah feel like a purpose-built conversion tool is **what she is allowed
> to pull answers from.**"

This package is that allowed material, plus the retrieval layer that feeds it to
the model. It is the highest-leverage part of the project.

## Two strictly separate document sets

```
content/
├─ specialty/      ← SET A: what Leah may state as CLINICAL FACT
│  └─ varicose-veins/
│     ├─ condition-overview.md
│     ├─ procedure-overview.md
│     ├─ side-effects.md
│     └─ cost-and-insurance.md
└─ conversion/     ← SET B: how Leah may GUIDE the conversation
   └─ general/
      ├─ conversation-structure.md   (rapport → education → objection → close)
      ├─ objection-cost.md
      ├─ objection-fear.md
      ├─ objection-let-me-think.md
      ├─ objection-skepticism.md
      ├─ closing-behavior.md
      └─ guardrails.md               (no manufactured urgency / overstated outcomes)
```

The separation is enforced by construction: every doc declares its `set`, and
the voice engine retrieves from A and B independently and tells the model that
clinical facts may come **only** from A and persuasion approach **only** from B.

## Document format

Each doc is one topic in a markdown file with a small frontmatter block:

```markdown
---
id: specialty/varicose-veins/procedure-overview
set: specialty            # "specialty" (A) or "conversion" (B)
condition: varicose-veins # or "general" for cross-condition playbook docs
topic: procedure-overview
title: How vein treatment works
approvedBy: Dr. ...       # REQUIRED for set A before pilot; TODO blocks approval
approvedAt: 2026-01-15
version: 1
tags: procedure, treatment
---

Body markdown...
```

One topic per file so docs are retrieved individually, never pasted whole into
one giant prompt.

## Usage

```ts
import { createKnowledgeBase } from "@leah/knowledge-base";

const { retriever } = createKnowledgeBase();

const facts = await retriever.retrieve({
  set: "specialty",
  condition: "varicose-veins",
  text: "will it hurt and what are the side effects",
  topK: 2,
});
```

`loadAllDocs()` validates every file and throws on the first malformed one.
`unapprovedSpecialtyDocs()` lists set A docs still missing physician approval —
wire it into CI so the pilot can't ship on unapproved clinical content.

## This is a living asset

- Add a **new objection** to `content/conversion/general/` every time a real
  call surfaces a hesitation the library doesn't cover.
- Add a **new condition** by creating `content/specialty/<condition>/` one module
  at a time as the pilot expands.
- Bump a doc's `version` whenever its text changes so transcripts pin exactly
  what was cited.

## TODO before pilot

- [ ] Replace the sample varicose-veins content with real, physician-approved docs.
- [ ] Fill every `approvedBy` / `approvedAt` in set A (CI gate on `unapprovedSpecialtyDocs`).
- [ ] Swap `KeywordRetriever` for an embedding/hybrid retriever behind the same interface.
