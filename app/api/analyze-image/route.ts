import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, apiKey, language = "fr", productNiche = null } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Gemini API key manquante" },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL de l'image manquante" },
        { status: 400 }
      );
    }

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

    // Initialize Gemini 2.5 Flash
    const client = new GoogleGenAI({ apiKey: apiKey });

    // Fetch the image from CDN
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Impossible de charger l'image depuis le CDN" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Analyze image and generate SEO title
    const nicheContext = productNiche ? `\n\nIMPORTANT PRODUCT CATEGORY: This product is a "${productNiche}". Make sure to identify it correctly as ${productNiche}, not as something else that might look similar.` : '';
    
    const prompt = `You are an expert e-commerce copywriter. Analyze this product image and create a natural, SEO-optimized product title in ${targetLang}.${nicheContext}

CRITICAL: Each product is UNIQUE with its own DIFFERENTIATING characteristics. Your title MUST highlight what makes THIS specific product different from others.

IDENTIFY THE UNIQUE FEATURES:
- What is the SPECIFIC style/design? (vintage, modern, minimalist, bohemian, etc.)
- What is the EXACT color/pattern? (navy blue, floral, striped, geometric, etc.)
- What is the SPECIFIC material? (cotton, velvet, marble, wood, metal, etc.)
- What is the UNIQUE shape/form? (round, square, oversized, slim-fit, etc.)
- Who is the TARGET audience? (women's, men's, kids, unisex, etc.)
- What is the SPECIFIC use/function? (decorative, functional, outdoor, indoor, etc.)

TITLE STRUCTURE RULES:
1. HIGHLIGHT DIFFERENTIATORS: Focus on what makes THIS product unique
2. NATURAL ADJECTIVE ORDER: Place specific adjectives BEFORE the noun
3. BE PRECISE: Use exact colors, materials, styles - not generic terms
4. CONNECTORS OPTIONAL: Use "&", "with", "for" only when natural
5. Maximum 55 characters
6. Title Case capitalization
7. NO generic titles - each product needs its own unique title

GOOD EXAMPLES (each title is unique and specific):
✓ "Vintage Gold Filigree Drop Earrings" (style + material + type)
✓ "Modern Black Leather Crossbody Bag" (style + color + material + type)
✓ "Oversized Chunky Knit Beige Throw Blanket" (size + texture + color + type)
✓ "Minimalist White Ceramic Vase Set" (style + color + material + type)
✓ "Bohemian Macrame Wall Hanging with Tassels" (style + type + detail)
✓ "Slim Fit Navy Blue Denim Jacket" (fit + color + material + type)

BAD EXAMPLES (too generic, not differentiating):
✗ "Earrings" (no differentiators at all)
✗ "Leather Bag" (too generic, missing style/color)
✗ "Throw Blanket" (missing texture, color, size)
✗ "Vase" (no style, color, or material)

REMEMBER: Two similar products should have DIFFERENT titles based on their unique characteristics!
Example: 
- Product A: "Vintage Floral Ceramic Coffee Mug"
- Product B: "Modern Minimalist White Coffee Mug"
(Same product type, but different styles and features)

Think: "What makes THIS product different from similar products? How would I describe it to someone who can't see it?"

Respond ONLY with the unique, specific product title in ${targetLang}, without quotes or explanations.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        },
        prompt
      ]
    });

    const title = response.text?.trim() || '';

    return NextResponse.json({ title });
  } catch (error: any) {
    console.error("Error analyzing image with Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse de l'image" },
      { status: 500 }
    );
  }
}
