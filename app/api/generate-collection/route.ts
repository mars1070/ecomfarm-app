import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeErrorMessage } from "@/lib/error-messages";

export async function POST(request: NextRequest) {
  try {
    const { 
      collectionName, 
      collectionHandle,
      shopUrl,
      previousCollection,
      nextCollection,
      isFirst,
      isLast,
      allCollections,
      claudeApiKey,
      language = "fr"
    } = await request.json();

    if (!claudeApiKey) {
      return NextResponse.json(
        { error: "Clé API Claude manquante" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: claudeApiKey });

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

    // Build context about all collections for semantic understanding
    const collectionsContext = allCollections
      .map((col: any, idx: number) => `${idx + 1}. ${col.name}`)
      .join("\n");

    // Determine link structure
    let linkInstructions = "";
    if (isFirst) {
      // Extract main niche keyword from collection name
      const nicheKeyword = collectionName.split(' ')[0].toLowerCase();
      
      linkInstructions = `
LINK STRUCTURE FOR FIRST COLLECTION:
- Link 1 (FIRST): Homepage → ${shopUrl}
  Anchor: Use niche keyword + appropriate word for "shop/store" in target language
  Examples: French → "boutique de ${nicheKeyword}", English → "${nicheKeyword} shop", Spanish → "tienda de ${nicheKeyword}"
  Keep anchor in LOWERCASE for natural flow in sentence
  INTEGRATE THIS LINK IN PARAGRAPH 2
- Link 2 (SECOND): Next collection → ${shopUrl}/collections/${nextCollection.handle}
  Anchor base: "${nextCollection.name.toLowerCase()}"
  CRITICAL: Adjust the anchor text (plural, gender, conjugation) so the sentence is grammatically correct (e.g., "paravent noir" → "paravents noirs" if referencing multiple items)
  IMPORTANT: Keep anchor in lowercase for grammatical correctness in context
  Reminder: ONLY change the visible anchor text, never the URL/handle
  INTEGRATE THIS LINK IN PARAGRAPH 3
`;
    } else if (isLast) {
      linkInstructions = `
LINK STRUCTURE FOR LAST COLLECTION:
- Link 1: Previous → ${shopUrl}/collections/${previousCollection.handle}
  Anchor base: "${previousCollection.name.toLowerCase()}"
  CRITICAL: Adjust anchor text to match grammar (plural/gender/conjugation) while keeping the URL unchanged
- Link 2: Loop back to first → ${shopUrl}/collections/${allCollections[0].handle}
  Anchor base: "${allCollections[0].name.toLowerCase()}"
  CRITICAL: Adjust anchor text to match grammar (plural/gender/conjugation) while keeping the URL unchanged
`;
    } else {
      linkInstructions = `
LINK STRUCTURE FOR MIDDLE COLLECTION:
- Link 1: Previous → ${shopUrl}/collections/${previousCollection.handle}
  Anchor base: "${previousCollection.name.toLowerCase()}"
  CRITICAL: Adjust anchor text to match grammar (plural/gender/conjugation) while keeping the URL unchanged
- Link 2: Next → ${shopUrl}/collections/${nextCollection.handle}
  Anchor base: "${nextCollection.name.toLowerCase()}"
  CRITICAL: Adjust anchor text to match grammar (plural/gender/conjugation) while keeping the URL unchanged
`;
    }

    const prompt = `Expert SEO copywriter. Write natural e-commerce content in ${targetLang}.

COLLECTION: ${collectionName}
URL: ${shopUrl}/collections/${collectionHandle}
POSITION: ${isFirst ? "FIRST" : isLast ? "LAST" : "MIDDLE"}

ALL COLLECTIONS:
${collectionsContext}

${linkInstructions}

STRUCTURE (MANDATORY):
- 4 paragraphs, each with <h2>
- 60-90 words per paragraph (300-400 total)
- Start directly with <h2> (no intro text)

H2 TITLES:
- Short (4-7 words max)
- CRITICAL: Include main keyword "${collectionName}" in ALL 4 titles (or close contextual variant)
- If exact keyword doesn't fit, use contextual variant (e.g., "paravent" → "séparation", "grillz" → "bijoux dentaires")
- NEVER use generic words alone ("style", "design", "qualité") - always pair with main keyword or variant
- Address customer questions/needs
- CRITICAL GRAMMAR RULES FOR QUESTIONS:
  * Questions MUST be grammatically correct and natural
  * French: Use proper question structure with verb inversion or "est-ce que"
  * CORRECT: "Comment choisir un paravent pour terrasse ?" (natural question)
  * CORRECT: "Pourquoi installer un paravent sur sa terrasse ?" (natural question)
  * WRONG: "Paravent terrasse résistant aux intempéries?" (not a real question!)
  * WRONG: "Paravent noir pour intérieur?" (not a question structure!)
  * If you can't make a REAL grammatical question, use a statement instead
  * ALWAYS add "?" at end of questions (don't forget!)
- Max 1-2 questions, rest statements
- CRITICAL CAPITALIZATION: Follow standard capitalization rules for the target language
  * French: Only capitalize first word and proper nouns (NOT common nouns mid-sentence)
  * CORRECT: "Paravent noir pour votre intérieur" (lowercase "noir")
  * WRONG: "Paravent Noir pour votre Intérieur" (uppercase "Noir")
  * English: Capitalize first word and important words (title case)
  * The keyword must be included but follow natural grammar rules
  * NEVER use colons ":" in titles

SEMANTIC STRATEGY ("Word Mystery"):
- Write so topic is obvious even without main keyword
- Use rich vocabulary: materials, techniques, styles, uses, product names, etc.
- Focus on diverse topics AROUND the main keyword (don't force synonyms)
- Use the main keyword naturally when relevant
- Build semantic web around the product category
- Stay natural, don't overdo it

STRONG TAGS (Strategic Emphasis):
- MANDATORY: 2-3 per paragraph (not more, not less)
- Can be: single words OR short phrases (2-4 words max)
- Use for:
  * Main keyword (if naturally present in paragraph)
  * Real benefits ("livraison rapide", "garantie 2 ans", "fait main")
  * Key features ("or 18 carats", "résistant à l'eau", "modulable")
  * Important differentiators ("sur mesure", "personnalisable", "unique")
  * Technical terms that matter ("bois massif", "acier inoxydable")
- Ask: "Would customer care?" If no → don't bold
- Examples: "<strong>paravent noir</strong>", "<strong>livraison gratuite</strong>", "<strong>bois massif</strong>"
- Spread them naturally across the paragraph (beginning, middle, end)
- Don't bold generic words ("qualité", "style") unless paired with specifics

INTERNAL LINKS (Exactly 2):
- Never say "collection" - use natural references
- Integrate in paragraphs 2 and 3
- Use anchor text provided BUT ALWAYS IN PLURAL FORM
- CRITICAL: Keep anchors in LOWERCASE even in middle of sentence for grammatical correctness
- CRITICAL: If anchor is singular, convert to PLURAL (e.g., "paravent noir" → "paravents noirs")
- Example French: "Découvrez nos paravents noirs" NOT "Découvrez notre paravent noir"
- Example English: "Explore our gold grillz" NOT "Explore our gold grill"
- Must feel organic in context
- IMPORTANT: Add title attribute with EXACT same text as anchor (for SEO)
- Format: <a href="URL" title="anchor text">anchor text</a>
- Example: <a href="/collections/paravent-noir" title="paravents noirs">paravents noirs</a>

CONTENT RULES:
- Factual, relevant, informative
- Professional but accessible tone
- Speak TO and LIKE your target audience
- Use niche-specific vocabulary, slang, or known terms from that community
- Examples: fishing → "tackle", "bait", "catch"; punk → "DIY", "scene", "underground"
- Mention well-known specific product names when relevant (not everywhere, just when it serves the customer)
- Examples: "Nike Air Max", "iPhone", "Levi's 501" - but only popular/recognized items
- No poetry, no invented features
- No marketing fluff

HTML FORMAT:
- <h2> + <p> structure
- Optional <h3> if relevant
- <a href="URL" title="anchor text">anchor text</a> for links (title = anchor)
- No lists, no bullets
- Shopify-ready

BANNED WORDS:
"collection" (for products), "elevate", "premium", "luxurious", "statement", "transform", "perfect", "ultimate", "revolutionary", "game-changer", "curated", "handpicked", "discover", "explore"

BANNED CHARACTERS:
"—" (em dash), "–" (en dash), ":" (colon in titles) - Use simple hyphen "-" or comma "," instead

OUTPUT:
- Pure HTML in ${targetLang}
- First character must be "<"
- No markdown, no explanations
- Start with <h2>`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: `You are an expert SEO copywriter. Always respond in ${targetLang}. You write natural, engaging content with perfect internal linking strategy. CRITICAL GRAMMAR RULES: 1) Always follow proper grammar and capitalization for ${targetLang}. In French, only capitalize the first word and proper nouns in titles (e.g., "Paravent noir" NOT "Paravent Noir"). 2) Questions MUST be grammatically correct with proper question structure (e.g., "Comment choisir..." or "Pourquoi opter..."). NEVER write fake questions like "Paravent terrasse résistant?" - if you can't make a real question, use a statement instead.`,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let content = message.content[0].type === "text" 
      ? message.content[0].text.trim() 
      : "";

    // Clean markdown code blocks if present
    content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
    content = content.trim();

    // Verify that the content has exactly 2 links
    const linkCount = (content.match(/<a href=/g) || []).length;
    
    return NextResponse.json({ 
      content,
      linkCount,
      warning: linkCount !== 2 ? `Warning: Generated ${linkCount} links instead of 2` : null
    });

  } catch (error: any) {
    console.error("Error generating collection content:", error);
    return NextResponse.json(
      { error: getClaudeErrorMessage(error) },
      { status: 500 }
    );
  }
}
