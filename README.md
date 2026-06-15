# What If? — AI Decision Exploration Game
### Microsoft Agents League Hackathon 2026

> *Ask a question. Explore your possibilities. Never get advice — just honest what-ifs.*

---

## What It Does

**What If?** is a conversational AI game that takes any life decision — *"Should I quit my job?"*, *"MacBook or Windows?"*, *"Should I go to the gym today?"* — and shows you both possible futures, honestly and without judgment.

Unlike advice tools, What If never tells you what to do. It shows you **what could happen** if you do, don't, or find a middle way — then lets you explore each timeline card by card.

---

## Demo

**Try it:** [localhost:3000] https://whatif-pearl.vercel.app/

**Example queries:**
- `Should I take this 3rd floor flat without a lift?`
- `Red or white dress tonight?`
- `I am 100kg — should I lose weight?`
- `MacBook or Windows laptop?`

---

## Architecture

### Multi-Agent Pipeline

```
User input
    ↓
Code Guardrails (instant safety check)
    ↓
Agent 1: Parser-agent1 (Baseline Classifier)
    Classifies query_mode, time_impact, polarity, safety flags
    ↓
Agent 2: retriever-agent2 (Context Gatherer)
    Asks 1-3 targeted follow-up questions
    Gathers context for BOTH paths before generating
    ↓
Agent 3: Timeline-agent3 (What-If Generator)
    Generates scenarios for all paths
    Short time → single what_if paragraph
    Long time → short_term / medium_term / long_term impacts
    ↓
Frontend: Swipeable result cards
    Side-by-side scenario cards
    Tap to expand full timeline
    ← → navigation through time checkpoints
```

### Azure AI Foundry Agents

| Agent | Role | Model |
|---|---|---|
| `Parser-agent1` | Classifies decision type, time horizon, safety | gpt-4.1-mini |
| `retriever-agent2` | Gathers context via targeted questions | gpt-4.1-mini |
| `Timeline-agent3` | Generates what-if scenarios for both paths | gpt-4.1-mini |
| `Crtici-agent4` | Reviews tone and safety of outputs | gpt-4.1-mini |
| `EvalJudge-agent5` | Evaluates pipeline quality | gpt-4.1-mini |

### Query Modes

| Mode | Example | Paths | Polarity |
|---|---|---|---|
| `binary_decision` | Should I take this job? | yes / no | positive / negative |
| `option_compare` | MacBook vs Windows? | option_a / option_b | none |
| `statement_assessment` | I am 100kg | yes / no | positive / negative |

### Time Horizons

| Time Impact | Output Format | Example |
|---|---|---|
| `short` (hours/days) | Single `what_if` paragraph | Should I wear red tonight? |
| `long` (weeks+) | `short_term` + `medium_term` + `long_term` | Should I quit my job? |

---

## Safety & Guardrails

What If has a layered safety system:

### Layer 1 — Code Guardrails (instant, pre-agent)
| Category | Response |
|---|---|
| Self-harm / suicide | Crisis resources — 988, Crisis Text Line |
| Harm to others | Legal warning + emergency services |
| Hard drugs (heroin, meth, cocaine) | SAMHSA helpline redirect |
| Toxic substances | Poison Control redirect |
| Medical decisions | Doctor consultation required |
| Illegal activities | Legal consequences only, no encouragement |

### Layer 2 — Age Gate (alcohol & tobacco)
- Alcohol → legal age 21 (US)
- Smoking/cannabis → legal age 18
- Underage: polite redirect with humor
- Legal age: disclaimer popup + proceed with honest what-ifs

### Layer 3 — Agent Prompts
- Never say "you should", "I recommend", "the best option"
- Every scenario must include at least one realistic friction or cost
- No utopian outcomes, no doom scenarios
- Polarity describes trajectory tone, not judgment of the person

---

## Evaluation Framework

### Azure AI Foundry Eval (eval-1)
Automated evaluation of all 3 pipeline agents across 10 test cases:

**Test cases cover:**
- Binary decisions (gym, job, flat, relationship)
- Option compare (dress, MacBook/Windows, food)
- Statement assessment (weight loss)
- Long and short time horizons
- Safe and unsafe inputs

**Evaluators:**
- TaskCompletion — did the pipeline complete end to end?
- TaskAdherence — did agents follow their system prompts?
- CustomerSatisfaction — would users be satisfied?
- Groundedness — are responses grounded in user context?
- Coherence — do timelines flow logically?

### Structural Evals (deterministic)
- Output contains correct number of scenarios (2)
- `what_if` present for short time_impact queries
- `impacts` object present for long time_impact queries
- `polarity` absent for option_compare queries
- No advice language in output

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Animations | Framer Motion |
| Styling | Tailwind CSS + inline styles |
| AI Agents | Azure AI Foundry (gpt-4.1-mini) |
| Eval | Azure AI Foundry Evaluation |
| Dev assistance | GitHub Copilot |

---

## GitHub Copilot Usage

GitHub Copilot was used throughout development for:
- Inline code completions for TypeScript components
- API route boilerplate generation
- Framer Motion animation patterns
- TypeScript type definitions

---

## Microsoft IQ Integration

This project uses **Azure AI Foundry** as its core intelligence layer:

- **5 agents** deployed and orchestrated via Foundry
- **Foundry Evaluation** (eval-1) running automated quality assessments
- **gpt-4.1-mini** as the model for all agents
- **Multi-agent pipeline** with classifier → gatherer → generator architecture

---

## Running Locally

```bash
git clone https://github.com/YOUR_USERNAME/crossroads
cd crossroads
npm install
```

Create `.env.local`:
```
AZURE_AI_FOUNDRY_API_KEY=your_key
AZURE_AI_FOUNDRY_ENDPOINT=https://crossroads-resource.services.ai.azure.com
```

```bash
npm run dev
```

Open `localhost:3000`

---

## Product Principles

1. **Show possibilities, never advice** — the user decides, always
2. **Honest over optimistic** — every path has friction
3. **Minimum viable questions** — max 3 follow-ups before generating
4. **Safety first** — guardrails run before any agent call
5. **Specific over generic** — timelines must reflect the user's actual context

---

## Team

Built by **Aayushi Rawat** for Microsoft Agents League Hackathon 2026

*"Synthesis can be delegated to AI. Judgment cannot."*
