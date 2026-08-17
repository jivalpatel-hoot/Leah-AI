# notebooks/

## `brain_comparison.ipynb`

A self-contained Jupyter notebook that compares **Claude**, **OpenAI GPT-4o**,
and **Amazon Nova** as Leah's reasoning "brain" — over the same RAG pipeline,
the same scripted patient scenarios, and the same rubric as the TypeScript
harness in `packages/voice/src/eval`.

It scores each brain 1–5 on grounding, tone, scope, objection handling, close,
and safety (LLM-judged by Claude), plus objective guardrail flags, latency,
tokens, and estimated cost — then prints the full transcripts for human review.

### Run it

```bash
cd notebooks
pip install -r requirements.txt
jupyter notebook brain_comparison.ipynb   # or open in VS Code / Colab
```

Provide credentials via the environment (or paste them in the Config cell):

| Brain | Needs |
|---|---|
| Claude (+ the judge) | `ANTHROPIC_API_KEY` |
| GPT-4o | `OPENAI_API_KEY` |
| Amazon Nova | AWS credentials + `AWS_REGION` (Bedrock) |

Any brain whose credentials are missing is skipped; with no Anthropic key the
judge falls back to a heuristic so the table still renders.

### About "Nova Sonic"

Nova **Sonic** (`amazon.nova-sonic-v1:0`) is a **speech-to-speech** model — it
has no text chat interface, so its *reasoning* can't be scored in text. The
notebook uses the **Nova text family** via Bedrock Converse (default
`amazon.nova-pro-v1:0`) as a faithful proxy for grounding/tone/scope. The
definitive Sonic evaluation is a **live voice call** (latency + naturalness),
which belongs in the voice-adapter phase, not a notebook. Set `NOVA_MODEL_ID`
to point at a different Nova model.

> The notebook loads the knowledge base straight from
> `../packages/knowledge-base/content`, so keep it in the repo (or set
> `LEAH_KB_DIR`). It mirrors the engine's retrieval, prompt, and guardrails so
> the comparison reflects Leah *inside the pipeline*, not the raw models.
