import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeErrorMessage, getGeminiErrorMessage, getImageFetchErrorMessage } from "@/lib/error-messages";

export async function POST(request: NextRequest) {
  try {
    const { products, claudeApiKey, geminiApiKey, mode = "both", language = "fr", useImageForTitle = false, productNiche = null } = await request.json();

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

    // Initialize APIs
    const anthropic = claudeApiKey ? new Anthropic({ apiKey: claudeApiKey }) : null;
    const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

    // Process all products in parallel
    const results = await Promise.all(
      products.map(async (product: { originalTitle: string; imageUrl?: string; index: number }) => {
        try {
          let newTitle = "";
          let description = "";

          // Generate title
          if (mode === "both" || mode === "title") {
            let shouldUseImage = useImageForTitle;
            if (shouldUseImage && product.imageUrl && geminiClient) {
              // Use Gemini to analyze image and generate title
              try {
                // Fetch image
                const imageResponse = await fetch(product.imageUrl);
                if (imageResponse.ok) {
                  const imageBuffer = await imageResponse.arrayBuffer();
                  const base64Image = Buffer.from(imageBuffer).toString('base64');
                  const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

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
1. START WITH THE MAIN KEYWORD: The product category/type that people search for MUST be prominent and logical
2. WRITE NATURALLY: Use proper grammar with prepositions - NOT just keyword stuffing!
   - French: Use "à", "en", "de", "avec" → "Sac à Bandoulière en Cuir Noir" NOT "Sac Bandoulière Cuir Noir"
   - English: Use "with", "in", "of" → "Bag with Leather Strap" or natural adjective order
   - Spanish: Use "de", "con", "en" → "Bolso de Cuero Negro"
   Write like a REAL product title that sounds natural, not robotic keyword stuffing!
3. LOGICAL WORD ORDER: Write like a NATURAL SENTENCE, not keyword stuffing!
   - Identify the MAIN PRODUCT CATEGORY (Hot Water Plush, Coffee Mug, Crossbody Bag, etc.)
   - Build a natural phrase around it with descriptive words BEFORE the category
   - English: Descriptive words + Main Category + Details
     ✓ "Cute Stitch Hot Water Plush" (natural sentence flow)
     ✓ "Vintage Floral Coffee Mug" (natural sentence flow)
     ✓ "Modern Black Leather Crossbody Bag" (natural sentence flow)
     NOT "Hot Water Bottle Cute Plush Bunny" (robotic keyword stuffing!)
   - French: Main product first with prepositions → "Bouillotte en Peluche Stitch Bleu" NOT "Stitch Peluche Bouillotte"
   - Spanish: Similar structure → "Taza de Cerámica Vintage Floral"
   Think: How would you NATURALLY describe this product in a sentence?
4. HIGHLIGHT DIFFERENTIATORS: Add what makes THIS product unique
5. BE PRECISE: Use exact colors, materials, styles - not generic terms
6. Maximum 55 characters
7. CRITICAL - Title Case capitalization: EVERY important word MUST start with a capital letter!
   - Capitalize ALL nouns, adjectives, verbs, colors, materials, styles
   - ONLY keep linking words lowercase: with, for, and, of, in, on, at, to, from, by, avec, en, de, pour, et, à, au, du, des, con, para, y, mit, von, für, und
   - Example CORRECT: "Doudou Lapin Rose Pâle à Robe Imprimée et Cils"
   - Example WRONG: "Doudou Lapin rose pâle à robe imprimée et cils" (missing capitals!)
8. NO generic titles - each product needs its own unique title

GOOD EXAMPLES (natural sentence flow):
English (descriptive words + main category, like speaking naturally):
✓ "Cute Stitch Hot Water Plush"
✓ "Vintage Floral Coffee Mug"
✓ "Modern Black Leather Crossbody Bag"
✓ "Minimalist White Ceramic Vase"
✓ "Bohemian Macrame Wall Hanging with Tassels"
✓ "Vintage Gold Filigree Drop Earrings"

French (product type first, natural grammar with prepositions, Title Case):
✓ "Bouillotte en Peluche Stitch Bleu"
✓ "Mug en Céramique Vintage Floral"
✓ "Vase en Porcelaine Blanc Minimaliste"
✓ "Sac à Bandoulière en Cuir Noir"
✓ "Boucles d'Oreilles en Or Vintage"
✓ "Doudou Lapin Rose Pâle à Robe Imprimée et Cils"

BAD EXAMPLES (robotic keyword stuffing, unnatural, or missing capitals):
✗ "Hot Water Bottle Cute Plush Bunny" (keyword stuffing - not natural!)
✗ "Coffee Mug Ceramic Vintage Floral" (keyword stuffing - not natural!)
✗ "Plush Cute Hot Water Bottle" (wrong order - not natural!)
✗ "Stitch Peluche Bouillotte Bleu" (character/brand first - WRONG for French!)
✗ "Sac Bandoulière Cuir Noir" (no prepositions - sounds robotic!)
✗ "Mug Céramique Floral" (missing "en" - unnatural!)
✗ "Doudou Lapin rose pâle à robe imprimée et cils" (missing capitals on important words!)
✗ "sac à bandoulière en cuir noir" (all lowercase - WRONG!)
✗ "Earrings" (no differentiators at all)

REMEMBER: Two similar products should have DIFFERENT titles based on their unique characteristics!
Example: 
- Product A: "Vintage Floral Ceramic Coffee Mug"
- Product B: "Modern Minimalist White Coffee Mug"
(Same product type, but different styles and features)

Think: "What makes THIS product different from similar products? How would I describe it to someone who can't see it?"

Respond ONLY with the unique, specific product title in ${targetLang}, without quotes or explanations.`;

                  const response = await geminiClient.models.generateContent({
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

                  newTitle = response.text?.trim() || "";
                }
              } catch (error: any) {
                console.error("Gemini error, falling back to Claude:", getGeminiErrorMessage(error));
                // Fallback to Claude if Gemini fails
                shouldUseImage = false;
              }
            }
            
            // Use Claude if not using image or if Gemini failed
            if (!newTitle && anthropic) {
              const titleMessage = await anthropic.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 200,
                system: `You are an expert in e-commerce SEO. Always respond in ${targetLang}.`,
                messages: [
                  {
                    role: "user",
                    content: `Shorten this product title into a single sentence of approximately 50 characters. You must imperatively make it a 100% grammatically correct sentence, not just illogical words strung together. The structure should be: main keyword + target + distinctive product specificity. The title must be grammatically correct and read like a natural sentence, while remaining clear and attractive to a buyer. Capitalize the first letter of all important words (not linking words like 'for', 'with', 'and', 'of'). Correct incorrect terms or formulations and simplify to keep only the essential and visible information that interests the buyer. Avoid unnecessary words, get straight to the point.

Original title: ${product.originalTitle}

Respond only with the new title in ${targetLang}, without quotes or explanations.`,
                  },
                ],
              });

              newTitle = titleMessage.content[0].type === "text" 
                ? titleMessage.content[0].text.trim() 
                : "";
            }
          }

          // Generate description with Claude
          if ((mode === "both" || mode === "description") && anthropic) {
            const descMessage = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 500,
              system: `You are an expert in e-commerce SEO copywriting. Always respond in ${targetLang}.`,
              messages: [
                {
                  role: "user",
                  content: `Write a natural product description in ${targetLang} - around 200-250 characters (3-4 sentences).

Product: ${newTitle || product.originalTitle}

CRITICAL RULES:
1. Write NATURALLY and conversationally - like talking to a friend, not a marketing robot
2. VARY your structure - DON'T always start the same way (mix it up!)
3. NO capital letters for the product name - write it normally in the sentence
4. Be SPECIFIC about features: exact colors, materials, dimensions, uses
5. BANNED WORDS: "elevate", "premium", "luxurious", "statement", "transform", "perfect", "ultimate", "revolutionary", "game-changer"
6. Keep sentences SHORT and punchy - no long complicated phrases

VARY YOUR OPENING - DON'T start with the product name! Use different styles:
- Lead with benefit: "Stay warm and cozy with this..."
- Start with style/adjective: "Adorable and functional, this..."
- Target audience: "Perfect for coffee lovers, this..."
- Describe feeling/use: "Enjoy comfort on cold nights with..."
- Feature first: "Soft plush fabric and cute design make..."
- Context: "Whether at home or on the go, this..."

AVOID starting directly with: "This [product name]..." or "[Product name] features..."

GOOD EXAMPLES (natural, varied, specific, ~200-250 chars - notice varied openings):
✓ "Stay warm and cozy on chilly nights with this adorable plush hot water bottle. Features soft fabric with a cute Stitch character design. The removable cover is machine washable. Great for kids and adults alike."

✓ "Sip your morning coffee in style with this handcrafted ceramic mug. Delicate vintage floral pattern adds charm to your routine. Holds 12oz and is microwave and dishwasher safe. A lovely addition to any kitchen."

✓ "Make a bold impression with these eye-catching gold-tone grillz. Full pavé cubic zirconia stones deliver maximum sparkle. Comfortable one-size-fits-most design with adjustable fit. Easy to apply and remove for any occasion."

✓ "Keep warm all winter long with this chunky cable knit beanie. Soft acrylic yarn feels great against your skin. Stretchy ribbed cuff ensures a snug fit. Available in multiple colors to match any outfit."

BAD EXAMPLES (avoid these!):
✗ "Elevate your urban style with our premium Iced Out Gold Tone Pave Full Set Grillz, transforming your smile into a luxurious statement piece..." (TOO FANCY, TOO LONG, GENERIC!)
✗ "Transform your look with this perfect accessory..." (BANNED WORDS, TOO VAGUE!)
✗ "The ultimate solution for your needs..." (GENERIC MARKETING SPEAK!)

Write ONLY the description (200-250 characters). Be natural, specific, and conversational.`,
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
          // Déterminer le type d'erreur pour un message clair
          let errorMessage = "⚠️ Erreur lors du traitement de ce produit";
          
          if (error.message?.includes("anthropic") || error.message?.includes("claude")) {
            errorMessage = getClaudeErrorMessage(error);
          } else if (error.message?.includes("gemini") || error.message?.includes("google")) {
            errorMessage = getGeminiErrorMessage(error);
          } else if (error.message?.includes("fetch") || error.message?.includes("image")) {
            errorMessage = getImageFetchErrorMessage(product.imageUrl || "", error);
          } else {
            errorMessage = `⚠️ ${error.message?.substring(0, 100) || "Erreur inconnue"}`;
          }
          
          return {
            index: product.index,
            error: errorMessage,
            success: false,
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error in batch generation:", error);
    return NextResponse.json(
      { error: "⚠️ Erreur générale lors du traitement. Vérifiez vos clés API et votre connexion." },
      { status: 500 }
    );
  }
}
