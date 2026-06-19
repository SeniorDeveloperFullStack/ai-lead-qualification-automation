import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { LeadFormData, LeadQualificationResult } from "@/types/lead";

export const runtime = "nodejs";

const qualificationSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    leadScore: {
      type: "number",
      description: "A lead quality score from 0 to 100.",
    },
    priority: {
      type: "string",
      enum: ["Hot", "Warm", "Cold"],
      description: "Lead urgency and sales readiness.",
    },
    summary: {
      type: "string",
      description: "Short plain-English summary of the lead.",
    },
    recommendedAction: {
      type: "string",
      description: "The next best sales action.",
    },
    draftReply: {
      type: "string",
      description: "A concise personalized email or SMS reply.",
    },
    salesNotes: {
      type: "array",
      description: "Useful notes for the salesperson before follow-up.",
      items: {
        type: "string",
      },
    },
    missingInfo: {
      type: "array",
      description: "Important unanswered questions to collect next.",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "leadScore",
    "priority",
    "summary",
    "recommendedAction",
    "draftReply",
    "salesNotes",
    "missingInfo",
  ],
};

function getStringField(
  payload: Record<string, unknown>,
  field: keyof LeadFormData,
) {
  const value = payload[field];
  return typeof value === "string" ? value.trim() : "";
}

function parseLeadPayload(payload: unknown): LeadFormData | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  return {
    name: getStringField(record, "name"),
    email: getStringField(record, "email"),
    phone: getStringField(record, "phone"),
    serviceNeeded: getStringField(record, "serviceNeeded"),
    budget: getStringField(record, "budget"),
    timeline: getStringField(record, "timeline"),
    message: getStringField(record, "message"),
  };
}

function normalizeResult(
  result: LeadQualificationResult,
): LeadQualificationResult {
  return {
    ...result,
    leadScore: Math.min(100, Math.max(0, Math.round(result.leadScore))),
    priority: result.priority,
    salesNotes: Array.isArray(result.salesNotes) ? result.salesNotes : [],
    missingInfo: Array.isArray(result.missingInfo) ? result.missingInfo : [],
  };
}

function getMockResult(lead: LeadFormData): LeadQualificationResult {
  const timeline = lead.timeline.toLowerCase();
  const budget = lead.budget.toLowerCase();

  const isUrgent =
    timeline.includes("asap") ||
    timeline.includes("this week") ||
    timeline.includes("today");

  const hasStrongBudget =
    budget.includes("$3,000") ||
    budget.includes("$7,500") ||
    budget.includes("$15,000");

  const leadScore = isUrgent && hasStrongBudget ? 92 : isUrgent ? 84 : 68;

  const priority: LeadQualificationResult["priority"] =
    leadScore >= 80 ? "Hot" : leadScore >= 50 ? "Warm" : "Cold";

  return {
    leadScore,
    priority,
    summary: `${lead.name} is interested in ${lead.serviceNeeded}. Their timeline is "${lead.timeline}" and their budget is "${lead.budget}". This looks like a ${priority.toLowerCase()} lead based on urgency and project clarity.`,
    recommendedAction:
      priority === "Hot"
        ? "Reply immediately and offer a 15-minute discovery call today or tomorrow."
        : "Reply with 2–3 clarifying questions and offer a short discovery call.",
    draftReply: `Hi ${lead.name}, thanks for reaching out. I can help with ${lead.serviceNeeded}. Based on your message, I’d first review your current workflow, confirm the tools you use, and then build a simple automation MVP that qualifies leads and prepares the next action for your team. Are you available for a quick 15-minute call this week?`,
    salesNotes: [
      `Requested service: ${lead.serviceNeeded}`,
      `Budget range: ${lead.budget}`,
      `Timeline: ${lead.timeline}`,
      "Ask which CRM, calendar, and form tools they currently use.",
      "Confirm the monthly lead volume before estimating the full automation scope.",
    ],
    missingInfo: [
      "Current CRM or spreadsheet system",
      "Current lead source: website form, ads, email, phone, or chat",
      "Monthly lead volume",
      "Calendar booking tool",
      "Preferred automation platform: n8n, Zapier, Make, or custom backend",
    ],
  };
}

async function sendLeadToN8n(
  lead: LeadFormData,
  result: LeadQualificationResult,
): Promise<{ sentToN8n: boolean; message: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("ℹ️ N8N_WEBHOOK_URL not set. Skipping n8n.");

    return {
      sentToN8n: false,
      message: "Lead qualified, but n8n webhook URL is not configured.",
    };
  }

  try {
    const payload = {
      submittedAt: new Date().toISOString(),

      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      serviceNeeded: lead.serviceNeeded,
      budget: lead.budget,
      timeline: lead.timeline,
      message: lead.message,

      leadScore: result.leadScore,
      priority: result.priority,
      summary: result.summary,
      recommendedAction: result.recommendedAction,
      draftReply: result.draftReply,
      salesNotes: result.salesNotes.join(" | "),
      missingInfo: result.missingInfo.join(" | "),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ n8n webhook failed:", response.status, text);

      return {
        sentToN8n: false,
        message: "Lead qualified, but saving to Google Sheets failed.",
      };
    }

    console.log("✅ Lead sent to n8n");

    return {
      sentToN8n: true,
      message: "Lead qualified and saved to Google Sheets.",
    };
  } catch (error) {
    console.error("❌ Failed to send lead to n8n:", error);

    return {
      sentToN8n: false,
      message: "Lead qualified, but n8n connection failed.",
    };
  }
}

export async function POST(request: Request) {
  console.log("✅ API route started");

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  const lead = parseLeadPayload(payload);

  if (!lead) {
    return NextResponse.json(
      { error: "Lead details are required." },
      { status: 400 },
    );
  }

  const missingRequiredFields = [
    !lead.name ? "name" : "",
    !lead.email ? "email" : "",
    !lead.phone ? "phone" : "",
    !lead.serviceNeeded ? "service needed" : "",
    !lead.budget ? "budget" : "",
    !lead.timeline ? "timeline" : "",
    !lead.message ? "message" : "",
  ].filter(Boolean);

  if (missingRequiredFields.length > 0) {
    return NextResponse.json(
      {
        error: `Please provide: ${missingRequiredFields.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (process.env.USE_MOCK_AI === "true") {
    console.log("🧪 Using mock AI result");

    const result = getMockResult(lead);
    const automation = await sendLeadToN8n(lead, result);

    return NextResponse.json({
      result,
      automation,
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("❌ Missing OPENAI_API_KEY");

    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY. Add it to .env.local." },
      { status: 500 },
    );
  }

  console.log("✅ API key exists");
  console.log("Using model:", process.env.OPENAI_MODEL || "gpt-4.1-mini");

  try {
    console.log("⏳ Calling OpenAI...");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: `
You are an expert sales operations assistant for a B2B automation agency.

Qualify the submitted lead for AI lead qualification, appointment booking, CRM follow-up, and workflow automation services.

Score from 0 to 100:
- 80 to 100 = Hot
- 50 to 79 = Warm
- 0 to 49 = Cold

Be practical, concise, and sales-ready.
Return only data matching the schema.
      `,
      input: `Lead submission:\n${JSON.stringify(lead, null, 2)}`,
      max_output_tokens: 900,
      text: {
        format: {
          type: "json_schema",
          name: "lead_qualification_result",
          strict: true,
          schema: qualificationSchema,
        },
      },
    });

    console.log("✅ OpenAI response received");

    if (!response.output_text) {
      throw new Error("OpenAI returned an empty response.");
    }

    const result = JSON.parse(response.output_text) as LeadQualificationResult;
    const normalizedResult = normalizeResult(result);
    const automation = await sendLeadToN8n(lead, normalizedResult);

    return NextResponse.json({
      result: normalizedResult,
      automation,
    });
  } catch (error) {
    console.error("Lead qualification failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to qualify this lead right now.",
      },
      { status: 500 },
    );
  }
}