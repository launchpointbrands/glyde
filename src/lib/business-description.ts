"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a business research assistant. Given a company name and domain, write a concise 2-3 sentence description of what the business does. Write in plain, factual language. No marketing fluff. No first-person. Present tense.`;

export async function generateBusinessDescription({
  clientBusinessId,
  domain,
  businessName,
}: {
  clientBusinessId: string;
  domain: string;
  businessName: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local before generating business descriptions.",
    );
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Business name: ${businessName}\nDomain: ${domain}\n\nWrite a 2-3 sentence description of what this business does.`,
      },
    ],
  });

  const text =
    message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

  if (!text) return "";

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_businesses")
    .update({ business_description: text })
    .eq("id", clientBusinessId);

  if (error) {
    console.error("Failed to save business_description", error);
  }

  return text;
}
