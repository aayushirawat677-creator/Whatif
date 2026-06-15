# What If? — AI Decision Exploration Game
### Microsoft Agents League Hackathon 2026

> *Ask a question. Explore your possibilities. Never get advice — just honest what-ifs.*

---

## Live Demo

**App:** https://whatif-8ly5.vercel.app/
**Repo:** https://github.com/aayushirawat677-creator/Whatif
**LinkedIn** https://www.linkedin.com/in/aayushi-23a570a0/

**Try these:**
- `Should I quit my job to start a company?`
- `MacBook or Windows laptop?`
- `Should I take this 3rd floor flat without a lift?`
- `Red or white dress tonight?`
- `I am 100kg — should I lose weight?`

---

## What It Does

**What If?** is a conversational AI game that takes any life decision and shows you both possible futures — honestly, without judgment, and without ever giving advice.

The user types a question or statement. The AI asks 1-3 targeted follow-up questions to understand their specific situation. Then it generates two what-if timelines — one for each path — shown as swipeable cards the user can explore at their own pace.

---

## Architecture

### Multi-Agent Pipeline

```
User input
    ↓
Code Guardrails (instant, pre-agent safety check)
    ↓
Agent 1: Parser-agent1 — Baseline Classifier
    Identifies query_mode, time_impact, polarity, safety flags
    ↓
Agent 2: retriever-agent2 — Context Gatherer
    Asks ONE question at a time (max 3 total)
    Fills required_context for BOTH paths before generating
    ↓
Agent 3: Timeline-agent3 — What-If Generator
    Generates scenarios for all paths
    Short time impact → single what_if paragraph per path
    Long time impact → short_term + medium_term + long_term per path
    ↓
Frontend
    Side-by-side summary cards
    Tap to expand full timeline overlay
    Swipe or arrow keys to navigate time checkpoints
```

### Azure AI Foundry Agents

| Agent | Name in Foundry | Role | Model |
|---|---|---|---|
| Baseline Classifier | `Parser-agent1` | Classifies decision type, time horizon, polarity, safety | gpt-4.1-mini |
| Context Gatherer | `retriever-agent2` | Asks targeted follow-up questions one at a time | gpt-4.1-mini |
| What-If Generator | `Timeline-agent3` | Generates honest what-if timelines for both paths | gpt-4.1-mini |
| Eval Judge | `EvalJudge-agent5` | Scores pipeline output quality across 7 dimensions | gpt-4.1-mini |

### Agent 1 — Baseline Classifier (`Parser-agent1`)

Determines:
- `query_mode`: `binary_decision` / `option_compare` / `statement_assessment`
- `time_impact`: `short` (hours/days) or `long` (weeks+)
- `polarity_applies`: true for binary decisions, false for option compare
- `paths`: specific labels for each path
- `required_context`: checklist of what Agent 2 needs to collect
- `safety_flag`: null / `self_harm` / `harmful_drug` / `medical`

### Agent 2 — Context Gatherer (`retriever-agent2`)

Rules:
- Asks ONE question per turn (game feel, not a form)
- Fills context for BOTH paths before marking `ready_to_generate: true`
- Prioritizes shared context questions that help all paths
- Never asks more than 3 questions total
- Never asks for age (handled by code guardrails)

### Agent 3 — What-If Generator (`Timeline-agent3`)

Output shape depends on `time_impact` from Agent 1:

| query_mode | time_impact | Output per path |
|---|---|---|
| binary_decision / statement_assessment | short | `what_if`: single paragraph + polarity |
| binary_decision / statement_assessment | long | `impacts`: short_term, medium_term, long_term + polarity |
| option_compare | short | `what_if`: single paragraph, no polarity |
| option_compare | long | `impacts`: three time buckets, no polarity |

**Shared rules for all scenarios:**
- Second person ("you"), specific to collected context
- Every path includes at least one realistic obstacle or friction
- No utopian outcomes, no doom scenarios
- Never gives advice or implies one path is better

---

## Query Modes

| Mode | Example | Paths | Polarity |
|---|---|---|---|
| `binary_decision` | Should I take this job? | yes / no | Agent assigns per path |
| `option_compare` | MacBook vs Windows? | option_a / option_b | None |
| `statement_assessment` | I am 100kg | yes (act) / no (don't act) | Agent assigns per path |

---

## Safety & Guardrails

### Layer 1 — Code Guardrails (runs before any agent, instant)

| Input Pattern | Response |
|---|---|
| Self-harm / suicide | 💙 Crisis resources — 988 Lifeline, Crisis Text Line |
| Harm to others / murder | 🚨 Legal warning + emergency services |
| Hard drugs (heroin, meth, cocaine, fentanyl) | ⚠️ SAMHSA Helpline 1-800-662-4357 |
| Toxic substances (bleach, poison) | 🏥 Poison Control 1-800-222-1222 |
| Medical decisions (stop medication, chemo) | Doctor consultation required |
| Illegal activities (steal, fraud) | Legal consequences shown only, no encouragement |

### Layer 2 — Age Gate (alcohol & tobacco)

- **Alcohol** → legal age 21 (US). Underage → polite pun + soda suggestion
- **Smoking / cannabis** → legal age 18. Underage → health redirect
- Legal age confirmed → disclaimer popup → proceed with honest what-ifs
- Age passed as collected context so gatherer never re-asks

### Layer 3 — Agent Prompt Rules

- Never say "you should", "you must", "I recommend", "the best option"
- Every scenario must include at least one realistic friction or cost
- Polarity describes trajectory tone, not a judgment of the person
- Option compare never uses polarity — purely factual and contextual

---

## Evaluation Framework

### Azure AI Foundry Eval (`eval-1`)

Automated evaluation of all 3 pipeline agents across 10 test cases using the `EvalJudge-agent5`.

**Test dataset covers:**
- Binary decisions: gym, quit job, take flat, break up, move to NYC
- Option compare: dress colour, MacBook vs Windows, pasta vs salad, stocks vs real estate
- Statement assessment: 100kg weight loss

**Evaluators used:**
- `TaskCompletion` — did the pipeline complete end to end?
- `TaskAdherence` — did agents follow their system prompt instructions?
- `CustomerSatisfaction` — would the user be satisfied with the response?
- `Groundedness` — are responses grounded in the user's actual context?
- `Coherence` — do timelines flow logically from one checkpoint to the next?

**EvalJudge-agent5 scores each output on:**
1. STRUCTURAL — does output match required JSON schema?
2. ACCURACY — correct query_mode, time_impact, polarity_applies?
3. QUALITY — specific, realistic, non-generic?
4. SAFETY — correct handling of dangerous inputs?
5. NO_ADVICE — avoids advice language?
6. FRICTION — realistic obstacle in every scenario?
7. DIVERSITY — are the two paths genuinely different?

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Animations | Framer Motion |
| Styling | Tailwind CSS + inline styles |
| Background | SVG landscape (scales without pixelation) |
| AI Agents | Azure AI Foundry — gpt-4.1-mini |
| Evaluation | Azure AI Foundry Evaluation (eval-1) |
| Dev assistance | GitHub Copilot |

---

## GitHub Copilot Usage

GitHub Copilot was used throughout development for:
- Inline code completions for TypeScript React components
- API route boilerplate and error handling patterns
- Framer Motion animation and gesture handling
- TypeScript interface and type definitions
- Next.js App Router configuration

---

## Microsoft IQ Integration

This project uses **Azure AI Foundry** as its core intelligence layer:

- **4 agents** deployed in Azure AI Foundry (3 pipeline + 1 eval judge)
- **Foundry Evaluation** (`eval-1`) running automated quality assessments across 10 test cases
- **gpt-4.1-mini** as the model for all agents
- **Multi-agent orchestration**: classifier → gatherer → generator pipeline
- **Agent-based evaluation**: EvalJudge-agent5 scores every pipeline output

---

## Running Locally

```bash
git clone https://github.com/aayushirawat677-creator/Whatif
cd Whatif
npm install
```

Create `.env.local`:
```
AZURE_AI_FOUNDRY_API_KEY=your_key_here
AZURE_AI_FOUNDRY_ENDPOINT=https://crossroads-resource.services.ai.azure.com
```

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Product Principles

1. **Show possibilities, never advice** — the user decides, always
2. **Honest over optimistic** — every path includes realistic friction
3. **Minimum viable questions** — max 3 follow-ups, then generate
4. **Safety first** — code guardrails run before any agent call
5. **Specific over generic** — timelines must reflect the user's actual context, not generic life advice

---

## Team

Built by **Aayushi Lnu** for Microsoft Agents League Hackathon 2026

*"Synthesis can be delegated to AI. Judgment cannot."*
