import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type AnalyzeBody = {
  title: string;
  location: string;
  text?: string;
  fileBase64?: string;
  mimeType?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeBody;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
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
  "skillsNeeded": ["medical", "logistics", "food distribution", "counseling"]
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

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
