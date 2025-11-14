import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const { title, apiKey } = await request.json();

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
      max_tokens: 500,
      system: "You are an expert in e-commerce SEO copywriting. Always respond in French.",
      messages: [
        {
          role: "user",
          content: `Write an SEO product description of 200-250 characters in exactly 3 sentences. Adapt your tone and style to match the target persona of the product.

GENERAL STRUCTURE (3 sentences mandatory)
Sentence 1: Hook the reader with action verb + main keyword + value proposition OR lifestyle projection (adapt to product type - problem/solution works for practical items, but for fashion/lifestyle use aspiration/style)
Sentence 2: Concrete product feature + precise usage context + ONE clear benefit (avoid "and" and "while" - one idea only)
Sentence 3: Start with imperative verb + final benefit + projection detail to help visualize usage

ADAPT TO PRODUCT PERSONA
- Practical/tech products: Professional, solution-focused, clear benefits
- Fashion/clothing: Stylish, aspirational, lifestyle-oriented (avoid forced problem/solution)
- Streetwear/urban: Slightly casual but stay professional, never cheap or excessive
- Luxury: Refined, elegant, emphasize quality and exclusivity
- Sports/fitness: Dynamic, performance-focused, motivational
IMPORTANT: Always maintain professionalism - adapt tone but never become cheap, excessive, or unprofessional

STYLE RULES
- Use impactful action verbs at the beginning of sentences
- Sentence 1: Choose the right approach for the product (problem/solution, aspiration, lifestyle, performance...)
- Sentence 2: ONE single clear idea with precise context
- Sentence 3: Concrete projection with specific usage details
- Integrate real usage details (office, car, home, outdoor, street, events...)
- Use descriptive and natural adjectives that match the product universe
- Avoid generic words like "daily", "revolutionary", "unique"
- Stay factual and direct, without excessive hyperbole
- Each sentence must provide different and useful information
- Speak TO the target persona, not about them

SEO OPTIMIZATION
- Sentence 1: Naturally integrate the main keyword (pay attention to agreements)
- Naturally integrate the complete semantic field of the product to enrich SEO (synonyms, functions, category, uses, technical aspects)
- Ensure keywords integrate naturally into the discourse

Product title: ${title}

Provide only the final product description text in French, without explanation or additional comment.
Precision test: By hiding the main keyword, the reader must understand precisely which product it is thanks to the semantic field used.`,
        },
      ],
    });

    const description = message.content[0].type === "text" 
      ? message.content[0].text.trim() 
      : "";

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
