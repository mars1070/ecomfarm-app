import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key manquante" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: "You are an expert in e-commerce SEO. Always respond in French.",
      messages: [
        {
          role: "user",
          content: `Shorten this product title into a single sentence of approximately 50 characters. You must imperatively make it a 100% grammatically correct sentence, not just illogical words strung together. The structure should be: main keyword + target + distinctive product specificity. The title must be grammatically correct and read like a natural sentence, while remaining clear and attractive to a buyer. Capitalize the first letter of all important words (not linking words like 'for', 'with', 'and', 'of'). Correct incorrect terms or formulations and simplify to keep only the essential and visible information that interests the buyer. Avoid unnecessary words, get straight to the point.

Original title: ${originalTitle}

Respond only with the new title in French, without quotes or explanations.`,
        },
      ],
    });

    const newTitle = message.content[0].type === "text" 
      ? message.content[0].text.trim() 
      : "";

    return NextResponse.json({ newTitle });
  } catch (error: any) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
