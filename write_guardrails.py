guardrails = """
const lower = (s: string) => s.toLowerCase();

const CRISIS_PATTERNS = ['kill myself','kill my self','end my life','suicide','suicidal','want to die','better off dead','end it all','take my life','not worth living','hurt myself','harm myself','self harm','cut myself'];
const HARM_OTHERS = ['kill her','kill him','kill them','kill someone','murder','stab','shoot someone','hurt her','hurt him','hurt them','attack someone','assault','poison someone','harm her','harm him'];
const HARD_DRUGS = ['heroin','meth','methamphetamine','cocaine','crack','fentanyl','crystal meth','inject drugs','shoot up','ketamine','pcp'];
const TOXIC = ['drink bleach','eat bleach','drink poison','swallow pills to','take poison','ingest chemicals'];
const ALCOHOL = ['drink whiskey','drink alcohol','drink beer','drink wine','drink vodka','drink rum','drink tequila','drink gin','drink bourbon','drink champagne','drinking alcohol','should i drink','get drunk','binge drink','have a drink'];
const SMOKING = ['smoke cigarette','start smoking','should i smoke','try cigarettes','take up smoking','vape','nicotine','tobacco','smoke weed','marijuana','cannabis','try weed','should i try weed'];
const ILLEGAL = ['steal','rob a','shoplift','break into','hack into someone','fraud','scam people','forge','counterfeit','smuggle','traffic drugs','bribe','extort'];
const MEDICAL = ['stop taking my medication','stop my medication','stop my meds','stop chemo','refuse treatment','self medicate'];

export type GuardrailAction = 'pass' | 'hard_stop' | 'age_gate' | 'warning_pass';

export interface GuardrailResult {
  action: GuardrailAction;
  category?: string;
  message?: string;
  popup?: { title: string; body: string; acknowledge: string; };
}

export function checkGuardrails(input: string): GuardrailResult {
  const t = lower(input);
  if (CRISIS_PATTERNS.some(p => t.includes(p))) return { action: 'hard_stop', category: 'crisis', message: "💙 What you're feeling matters deeply. Please reach out right now:\\n\\n📞 988 Suicide & Crisis Lifeline — call or text 988\\n💬 Crisis Text Line — text HOME to 741741\\n\\nYou don't have to face this alone." };
  if (HARM_OTHERS.some(p => t.includes(p))) return { action: 'hard_stop', category: 'harm_others', message: "🚨 Harming another person is illegal and causes irreversible damage to everyone involved — including you.\\n\\nIf you're in crisis, please call 988 or your local emergency services." };
  if (HARD_DRUGS.some(p => t.includes(p))) return { action: 'hard_stop', category: 'hard_drug', message: "⚠️ This substance causes serious physical harm.\\n\\nIf you're struggling with substance use:\\n📞 SAMHSA Helpline — 1-800-662-4357 (free, confidential, 24/7)\\n\\nPlease reach out to a medical professional." };
  if (TOXIC.some(p => t.includes(p))) return { action: 'hard_stop', category: 'toxic', message: "🏥 Medical emergency.\\n\\nPoison Control — 1-800-222-1222\\nEmergency — 911\\n\\nPlease seek immediate help." };
  if (ILLEGAL.some(p => t.includes(p))) return { action: 'warning_pass', category: 'illegal' };
  if (MEDICAL.some(p => t.includes(p))) return { action: 'hard_stop', category: 'medical', message: "🏥 This needs professional medical guidance. Please speak with your doctor before making changes to your treatment." };
  if (ALCOHOL.some(p => t.includes(p))) return { action: 'age_gate', category: 'alcohol', popup: { title: 'Age confirmation needed', body: 'Alcohol is only legal for adults. What is your age?', acknowledge: 'By providing your age you confirm this is accurate. What If cannot verify ages and accepts no responsibility for decisions based on incorrect information.' } };
  if (SMOKING.some(p => t.includes(p))) return { action: 'age_gate', category: 'smoking', popup: { title: 'Age confirmation needed', body: 'Smoking and cannabis are age-restricted and carry health risks. What is your age?', acknowledge: 'By providing your age you confirm this is accurate. What If cannot verify ages and accepts no responsibility for decisions based on incorrect information.' } };
  return { action: 'pass' };
}

export function getUnderage(category: string): string {
  if (category === 'alcohol') return "🧃 Looks like you're not quite of legal drinking age yet! The good news? Sparkling water with lime hits different — and your liver will thank you later. Come back when you're legal, and until then, let's raise a glass of OJ! 🍊";
  if (category === 'smoking') return "🌿 You're too young to be lighting up! Your lungs are still developing and deserve better. Find something that actually feels good — sports, music, art. Your future self will be grateful. 💪";
  return "You're not old enough for this one yet. Hang tight!";
}

export function getLegalWarning(category: string): string {
  if (category === 'alcohol') return "⚠️ What If will explore both paths honestly — including the not-so-glamorous parts. This is not encouragement to drink.";
  if (category === 'smoking') return "⚠️ Smoking carries significant health risks. What If will show possibilities honestly, including long-term health impacts. This is not encouragement.";
  return "";
}
"""

with open('/Users/aayushi/crossroads/lib/guardrails.ts', 'w') as f:
    f.write(guardrails)
print('guardrails done')
