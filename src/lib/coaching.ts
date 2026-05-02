"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export type CoachingNote = {
  opening: string;
  why: string;
  goodLooks: string;
  objection: string;
  clientName: string;
};

const SYSTEM_PROMPT = `You are an expert wealth advisor coach helping financial advisors have better conversations with their business owner clients. Your job is to give specific, practical, human coaching — not generic advice. Write like you're talking to a smart advisor who knows their client but needs help opening a sensitive conversation. Be direct and warm. Never use jargon. Never be preachy.`;

const PATH_TITLE: Record<string, string> = {
  family: "Transition to family",
  internal: "Internal transition",
  third_party: "Third-party sale",
  esop: "ESOP",
};

function formatUSD(n: number | null | undefined): string {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function formatUSDFull(n: number | null | undefined): string {
  return n == null ? "—" : `$${Math.round(n).toLocaleString()}`;
}

function humanize(s: string | null | undefined): string {
  if (!s) return "—";
  return s
    .split("_")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function formatPctRange(s: string | null | undefined): string {
  if (!s) return "—";
  const map: Record<string, string> = {
    "0_10": "0-10%",
    "11_25": "11-25%",
    "26_50": "26-50%",
    "51_75": "51-75%",
    "76_100": "76-100%",
  };
  return map[s] ?? humanize(s);
}

type Ctx = {
  contactName: string;
  businessName: string;
  domain: string;
  range: string;
  yearsToExit: string;
  exitAge: string;
  exitYear: string;
  successionPath: string;
  riskLevel: string;
  ownerDeparture: string;
  keyEmployee: string;
  customerConcentration: string;
  buySellStatus: string;
  buySellReviewed: string;
  recurringRevenue: string;
  financialRecords: string;
  ebitdaGap: string;
  goalEbitda: string;
  itemHeadline: string;
};

const RATIONALE_BUILDERS: Record<string, (c: Ctx) => string> = {
  owner_departure: (c) =>
    `Owner-departure impact is ${c.ownerDeparture.toLowerCase()}. Without ${c.contactName}, the business's stability and value are at significant risk.`,
  key_employee_retention: (c) =>
    `Key-employee departure impact is ${c.keyEmployee.toLowerCase()}. The business is too dependent on a few people who could leave.`,
  customer_concentration: (c) =>
    `Top 2 customers represent ${c.customerConcentration} of revenue — well above the comfort range buyers want to see.`,
  buy_sell_review: (c) =>
    `The buy-sell agreement is ${c.buySellStatus.toLowerCase()} and was last reviewed ${c.buySellReviewed.toLowerCase()}, creating exposure if anything goes sideways.`,
  ebitda_gap: (c) =>
    `EBITDA needs to grow to ${c.goalEbitda} by ${c.exitYear} to support the target valuation — the gap today is ${c.ebitdaGap}.`,
  succession_readiness: (c) =>
    `${c.contactName}'s succession readiness has meaningful gaps — both personal preparation and business handoff structure need work.`,
};

function stripMarkdown(text: string): string {
  return text
    // **bold** → bold (run before italic so the pair is consumed first)
    .replace(/\*\*([^*\n]+?)\*\*/g, "$1")
    // *italic* → italic
    .replace(/\*([^*\n]+?)\*/g, "$1")
    // Horizontal dividers (----, ---, *** etc.) on their own line
    .replace(/^[-*]{3,}\s*$/gm, "")
    // Collapse runs of blank lines that result from removed dividers
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseSections(rawText: string): {
  opening: string;
  why: string;
  goodLooks: string;
  objection: string;
} {
  const cleaned = stripMarkdown(rawText);

  // Anchor on the four header strings the prompt asks for. Each regex
  // matches the literal label followed by a colon — `WHY IT MATTERS`
  // tolerates an optional `FOR <name>` segment so the model's natural
  // phrasing ("WHY IT MATTERS FOR Peter:") works without a custom case.
  const matchers = [
    { key: "opening" as const, re: /OPENING LINE:/i },
    { key: "why" as const, re: /WHY IT MATTERS(?:\s+FOR\s+[^\n:]+)?:/i },
    { key: "goodLooks" as const, re: /WHAT GOOD LOOKS LIKE:/i },
    { key: "objection" as const, re: /LIKELY OBJECTION:/i },
  ];

  const found = matchers
    .map((m) => {
      const match = cleaned.match(m.re);
      return match && match.index !== undefined
        ? { key: m.key, index: match.index, len: match[0].length }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.index - b.index);

  const sections: Record<string, string> = {};
  for (let i = 0; i < found.length; i++) {
    const h = found[i];
    const next = found[i + 1];
    const start = h.index + h.len;
    const end = next ? next.index : cleaned.length;
    sections[h.key] = cleaned.slice(start, end).trim();
  }

  // Fallback: if the model didn't follow the format and nothing parsed,
  // dump the full cleaned text into `opening` so the panel still shows
  // something readable instead of four empty rows.
  const allEmpty =
    !sections.opening &&
    !sections.why &&
    !sections.goodLooks &&
    !sections.objection;
  if (allEmpty) {
    return {
      opening: cleaned.trim(),
      why: "",
      goodLooks: "",
      objection: "",
    };
  }

  return {
    opening: sections.opening ?? "",
    why: sections.why ?? "",
    goodLooks: sections.goodLooks ?? "",
    objection: sections.objection ?? "",
  };
}

export async function generateCoachingNote({
  caseId,
  itemKey,
  itemHeadline,
}: {
  caseId: string;
  itemKey: string;
  itemHeadline: string;
}): Promise<CoachingNote> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local before generating coaching notes.",
    );
  }

  const supabase = await createClient();

  const [
    { data: caseRow },
    { data: responses },
    { data: valuation },
    { data: wealth },
    { data: succession },
    { data: risk },
  ] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, client_business:client_businesses(business_name, domain, contact_name, primary_owner_name)",
      )
      .eq("id", caseId)
      .single(),
    supabase
      .from("discovery_responses")
      .select("field_key, value, source, status")
      .eq("case_id", caseId),
    supabase
      .from("valuation_snapshots")
      .select("valuation_low, valuation_high, normalized_ebitda")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("wealth_plans")
      .select("exit_year, target_age, goal_ebitda")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("succession_plans")
      .select("selected_path")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("risk_assessments")
      .select("overall_risk")
      .eq("case_id", caseId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!caseRow) {
    throw new Error("Case not found.");
  }

  const cb = Array.isArray(caseRow.client_business)
    ? caseRow.client_business[0]
    : caseRow.client_business;

  const responseByKey = new Map<string, unknown>(
    (responses ?? []).map((r) => [r.field_key as string, r.value]),
  );

  const contactName =
    (cb?.contact_name as string | null) ??
    (cb?.primary_owner_name as string | null) ??
    "your client";
  const businessName = (cb?.business_name as string | null) ?? "the business";
  const domain = (cb?.domain as string | null) ?? "—";

  const range =
    valuation?.valuation_low != null && valuation?.valuation_high != null
      ? `${formatUSD(valuation.valuation_low)} – ${formatUSD(valuation.valuation_high)}`
      : "—";

  const exitYear = wealth?.exit_year ?? null;
  const exitAge = wealth?.target_age ?? null;
  const yearsToExit =
    exitYear != null ? Math.max(exitYear - new Date().getFullYear(), 0) : null;
  const goalEbitda = wealth?.goal_ebitda ?? null;
  const normEbitda = valuation?.normalized_ebitda ?? null;
  const ebitdaGapNum =
    goalEbitda != null && normEbitda != null ? goalEbitda - normEbitda : null;

  const recurringRaw = responseByKey.get("revenue_recurring_pct");

  const ctx: Ctx = {
    contactName,
    businessName,
    domain,
    range,
    yearsToExit: yearsToExit != null ? String(yearsToExit) : "—",
    exitAge: exitAge != null ? String(exitAge) : "—",
    exitYear: exitYear != null ? String(exitYear) : "—",
    successionPath: succession?.selected_path
      ? PATH_TITLE[succession.selected_path] ?? humanize(succession.selected_path)
      : "—",
    riskLevel: risk?.overall_risk ? humanize(risk.overall_risk) : "—",
    ownerDeparture: humanize(
      responseByKey.get("owner_departure_impact") as string | null,
    ),
    keyEmployee: humanize(
      responseByKey.get("key_employee_departure_impact") as string | null,
    ),
    customerConcentration: formatPctRange(
      responseByKey.get("top_2_customer_revenue_pct") as string | null,
    ),
    buySellStatus: humanize(
      responseByKey.get("buy_sell_status") as string | null,
    ),
    buySellReviewed: humanize(
      responseByKey.get("buy_sell_last_reviewed") as string | null,
    ),
    recurringRevenue:
      typeof recurringRaw === "number"
        ? String(recurringRaw)
        : typeof recurringRaw === "string"
          ? recurringRaw
          : "—",
    financialRecords: humanize(
      responseByKey.get("financial_record_manager") as string | null,
    ),
    ebitdaGap: ebitdaGapNum != null ? formatUSDFull(ebitdaGapNum) : "—",
    goalEbitda: goalEbitda != null ? formatUSDFull(goalEbitda) : "—",
    itemHeadline,
  };

  const rationale =
    RATIONALE_BUILDERS[itemKey]?.(ctx) ??
    `This conversation matters for ${contactName}'s exit plan.`;

  const userMessage = `I'm a wealth advisor preparing to talk with my client ${ctx.contactName}, owner of ${ctx.businessName} (${ctx.domain}). Here's what I know about their situation:

- Business valuation range: ${ctx.range}
- Exit timeline: ${ctx.yearsToExit} years, targeting exit at age ${ctx.exitAge}
- Succession path: ${ctx.successionPath}
- Business risk level: ${ctx.riskLevel}
- Owner departure impact: ${ctx.ownerDeparture}
- Key employee departure impact: ${ctx.keyEmployee}
- Top 2 customer concentration: ${ctx.customerConcentration}
- Buy-sell status: ${ctx.buySellStatus}, last reviewed ${ctx.buySellReviewed}
- Recurring revenue: ${ctx.recurringRevenue}%
- Financial records: managed by ${ctx.financialRecords}
- EBITDA gap to goal: ${ctx.ebitdaGap} (needs ${ctx.goalEbitda} by ${ctx.exitYear})

The conversation I need to have with them is: ${ctx.itemHeadline}
The reason this matters: ${rationale}

Format your response using exactly these four section headers, each on its own line, followed immediately by the content on the next line. Use plain text only — no asterisks, no markdown, no bullet points, no dashes:

OPENING LINE:
[1-2 sentences — a natural, word-for-word opening I can use to bring this up]

WHY IT MATTERS FOR ${ctx.contactName}:
[2-3 sentences using their actual data, connecting their specific situation to why this conversation is urgent]

WHAT GOOD LOOKS LIKE:
[one sentence describing where I want to land after this conversation]

LIKELY OBJECTION:
[2-3 sentences — the most common pushback for this topic and a brief suggested response]

Be specific to their situation. Use their name. Reference their actual numbers where relevant.`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text =
    message.content[0]?.type === "text" ? message.content[0].text : "";

  if (process.env.NODE_ENV !== "production") {
    console.log("[coaching] raw response:\n", text);
  }

  return {
    ...parseSections(text),
    clientName: contactName,
  };
}
