import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const { products, apiKey, mode = "both", language = "fr", customTitlePrompt = null, customDescPrompt = null } = await request.json();

    const languageNames: Record<string, string> = {
      fr: "French",
      en: "English",
      es: "Spanish",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      nl: "Dutch",
      pl: "Polish",
      ru: "Russian",
      ja: "Japanese",
      zh: "Chinese",
      ko: "Korean",
      ar: "Arabic",
      tr: "Turkish"
    };
    const targetLang = languageNames[language] || "French";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key manquante" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Process all products in parallel
    const results = await Promise.all(
      products.map(async (product: { originalTitle: string; index: number }) => {
        try {
          let newTitle = "";
          let description = "";

          // Generate based on mode
          if (mode === "both") {
            // Generate title and description in parallel
            const [titleMessage, descMessage] = await Promise.all([
            anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 200,
              system: customTitlePrompt ? "You are a helpful AI assistant." : `You are an expert in e-commerce SEO. Always respond in ${targetLang}.`,
              messages: [
                {
                  role: "user",
                  content: customTitlePrompt 
                    ? customTitlePrompt.replace('{title}', product.originalTitle)
                    : `Shorten this product title into a single sentence of approximately 50 characters. You must imperatively make it a 100% grammatically correct sentence, not just illogical words strung together. The structure should be: main keyword + target + distinctive product specificity. The title must be grammatically correct and read like a natural sentence, while remaining clear and attractive to a buyer. Capitalize the first letter of all important words (not linking words like 'for', 'with', 'and', 'of'). Correct incorrect terms or formulations and simplify to keep only the essential and visible information that interests the buyer. Avoid unnecessary words, get straight to the point.

Original title: ${product.originalTitle}

Respond only with the new title in ${targetLang}, without quotes or explanations.`,
                },
              ],
            }),
            // Generate description based on original title
            anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 500,
              system: customDescPrompt ? "You are a helpful AI assistant." : `You are an expert in e-commerce SEO copywriting. Always respond in ${targetLang}.`,
              messages: [
                {
                  role: "user",
                  content: customDescPrompt
                    ? customDescPrompt.replace('{title}', product.originalTitle)
                    : `Write an SEO product description of 200-250 characters in exactly 3 sentences. Adapt your tone to match the product type.

STRUCTURE:
Sentence 1: Action verb + main keyword + value OR lifestyle (problem/solution only if relevant for practical products)
Sentence 2: ONE concrete feature + usage context + benefit
Sentence 3: Imperative verb + final benefit + usage projection

ADAPT TONE:
- Practical/tech: Professional, solution-focused
- Fashion/lifestyle: Aspirational, stylish (NO problem/solution)
- Streetwear: Slightly casual but professional, never cheap
- Luxury: Refined, elegant
- Sports: Dynamic, performance-focused

RULES:
- Speak TO the target persona
- Integrate main keyword naturally
- Use descriptive adjectives matching product universe
- Avoid generic words ("daily", "revolutionary", "unique")
- Stay factual, no excessive hyperbole

Product title: ${product.originalTitle}

Provide only the final product description text in ${targetLang}, without explanation or additional comment.
Precision test: By hiding the main keyword, the reader must understand precisely which product it is thanks to the semantic field used.`,
                },
              ],
            }),
            ]);

            newTitle = titleMessage.content[0].type === "text" 
              ? titleMessage.content[0].text.trim() 
              : "";
            
            description = descMessage.content[0].type === "text" 
              ? descMessage.content[0].text.trim() 
              : "";
          } else if (mode === "title") {
            // Generate only title
            const titleMessage = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 200,
              system: customTitlePrompt ? "You are a helpful AI assistant." : `You are an expert in e-commerce SEO. Always respond in ${targetLang}.`,
              messages: [
                {
                  role: "user",
                  content: customTitlePrompt
                    ? customTitlePrompt.replace('{title}', product.originalTitle)
                    : `Shorten this product title into a single sentence of approximately 50 characters. You must imperatively make it a 100% grammatically correct sentence, not just illogical words strung together. The structure should be: main keyword + target + distinctive product specificity. The title must be grammatically correct and read like a natural sentence, while remaining clear and attractive to a buyer. Capitalize the first letter of all important words (not linking words like 'for', 'with', 'and', 'of'). Correct incorrect terms or formulations and simplify to keep only the essential and visible information that interests the buyer. Avoid unnecessary words, get straight to the point.

Original title: ${product.originalTitle}

Respond only with the new title in ${targetLang}, without quotes or explanations.`,
                },
              ],
            });

            newTitle = titleMessage.content[0].type === "text" 
              ? titleMessage.content[0].text.trim() 
              : "";
          } else if (mode === "description") {
            // Generate only description
            const descMessage = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 500,
              system: customDescPrompt ? "You are a helpful AI assistant." : `You are an expert in e-commerce SEO copywriting. Always respond in ${targetLang}.`,
              messages: [
                {
                  role: "user",
                  content: customDescPrompt
                    ? customDescPrompt.replace('{title}', product.originalTitle)
                    : `Write an SEO product description of 200-250 characters in exactly 3 sentences. Adapt your tone to match the product type.

STRUCTURE:
Sentence 1: Action verb + main keyword + value OR lifestyle (problem/solution only if relevant for practical products)
Sentence 2: ONE concrete feature + usage context + benefit
Sentence 3: Imperative verb + final benefit + usage projection

ADAPT TONE:
- Practical/tech: Professional, solution-focused
- Fashion/lifestyle: Aspirational, stylish (NO problem/solution)
- Streetwear: Slightly casual but professional, never cheap
- Luxury: Refined, elegant
- Sports: Dynamic, performance-focused

RULES:
- Speak TO the target persona
- Integrate main keyword naturally
- Use descriptive adjectives matching product universe
- Avoid generic words ("daily", "revolutionary", "unique")
- Stay factual, no excessive hyperbole

Product title: ${product.originalTitle}

Provide only the final product description text in ${targetLang}, without explanation or additional comment.
Precision test: By hiding the main keyword, the reader must understand precisely which product it is thanks to the semantic field used.`,
                },
              ],
            });

            description = descMessage.content[0].type === "text" 
              ? descMessage.content[0].text.trim() 
              : "";
          }

          return {
            index: product.index,
            newTitle,
            description,
            success: true,
          };
        } catch (error: any) {
          return {
            index: product.index,
            error: error.message,
            success: false,
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error in batch generation:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
