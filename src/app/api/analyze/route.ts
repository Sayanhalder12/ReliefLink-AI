import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type AnalyzeBody = {
  title: string;
  location: string;
  text?: string;
  fileBase64?: string;
  mimeType?: string;
};

function getVolunteerEstimate(urgency: string) {
  if (urgency === "critical") return 6;
  if (urgency === "high") return 4;
  if (urgency === "medium") return 2;
  return 1;
}

function looksInsufficient(body: AnalyzeBody) {
  const combined = `${body.title} ${body.location} ${body.text ?? ""}`.trim().toLowerCase();
  const cleaned = combined.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = cleaned.split(" ").filter(Boolean);
  const weakInputs = new Set(["hello", "hi", "test", "checking", "demo", "sample", "ok"]);
  return tokens.length < 5 || tokens.every((token) => weakInputs.has(token));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeBody;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    if (looksInsufficient(body)) {
      return NextResponse.json({
        summary: "Insufficient field information to extract a reliable crisis assessment.",
        urgency: "low",
        category: "other",
        recommendedAction: "Collect more details such as affected people, damage, location specifics, and immediate needs.",
        skillsNeeded: ["assessment"],
        estimatedVolunteersNeeded: 1,
        priorityScore: 15,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
You are an NGO crisis triage assistant.
Given this report title "${body.title}" from location "${body.location}", classify urgency.

Respond ONLY in strict JSON:
{
  "summary": "string, max 60 words",
  "urgency": "critical | high | medium | low",
  "category": "health | shelter | food | water | rescue | safety | logistics | other",
  "recommendedAction": "string, concrete immediate next action",
  "skillsNeeded": ["medical", "logistics", "food distribution", "counseling"],
  "priorityScore": "number from 0 to 100"
}
`;

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt },
    ];

    if (body.text) {
      parts.push({ text: `Report text: ${body.text}` });
    }
    if (body.fileBase64 && body.mimeType) {
      parts.push({
        inlineData: {
          data: body.fileBase64,
          mimeType: body.mimeType,
        },
      });
    }

    const result = await model.generateContent(parts);
    const output = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(output);

    const urgency = parsed.urgency ?? "low";
    const estimatedVolunteersNeeded = getVolunteerEstimate(urgency);
    const priorityScore =
      typeof parsed.priorityScore === "number"
        ? Math.max(0, Math.min(100, parsed.priorityScore))
        : estimatedVolunteersNeeded * 15 + (parsed.skillsNeeded?.length ?? 0) * 5;

    return NextResponse.json({
      ...parsed,
      urgency,
      estimatedVolunteersNeeded,
      priorityScore,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
