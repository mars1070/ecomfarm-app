import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    console.log("📝 [WRITE-ARTICLE] Starting article generation...");
    
    const { 
      keyword, 
      serpAnalysis, 
      claudeApiKey, 
      language = "fr",
      siteUrl,
      blogHandle,
      allArticles,
      position,
      previousArticle,
      nextArticle,
      crossGroupArticle, // Optional 3rd link to another group
    } = await request.json();

    console.log("📝 [WRITE-ARTICLE] Keyword:", keyword);
    console.log("📝 [WRITE-ARTICLE] Position:", position);
    console.log("📝 [WRITE-ARTICLE] Site URL:", siteUrl);
    console.log("📝 [WRITE-ARTICLE] Blog Handle:", blogHandle);

    if (!keyword || !serpAnalysis || !claudeApiKey) {
      console.error("❌ [WRITE-ARTICLE] Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Helper function to create slug from keyword
    const slugify = (text: string): string => {
      const slug = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return slug;
    };

    console.log("📝 [WRITE-ARTICLE] Initializing Anthropic SDK...");
    const anthropic = new Anthropic({ 
      apiKey: claudeApiKey,
      timeout: 300000  // 5 minutes timeout for long articles (default is 60s)
    });
    console.log("✅ [WRITE-ARTICLE] Anthropic SDK initialized with 5min timeout.");

    console.log("📝 [WRITE-ARTICLE] Preparing internal linking URLs...");
    // Prepare internal linking URLs before prompt
    let linkInstructions = "";
    if (siteUrl && blogHandle) {
      // Clean siteUrl to avoid double slashes (remove trailing slash if present)
      const cleanSiteUrl = siteUrl.replace(/\/$/, '');
      
      // Use dynamic blogHandle for each article (supports cross-blog linking)
      const homepageUrl = cleanSiteUrl;
      const previousUrl = previousArticle?.type === 'homepage' 
        ? homepageUrl 
        : previousArticle 
          ? `${cleanSiteUrl}/blogs/${previousArticle.blogHandle || blogHandle}/${slugify(previousArticle.keyword)}` 
          : null;
      const nextUrl = nextArticle ? `${cleanSiteUrl}/blogs/${nextArticle.blogHandle || blogHandle}/${slugify(nextArticle.keyword)}` : null;
      const firstUrl = allArticles?.[0] ? `${cleanSiteUrl}/blogs/${allArticles[0].blogHandle || blogHandle}/${slugify(allArticles[0].keyword)}` : null;
      const crossGroupUrl = crossGroupArticle ? `${cleanSiteUrl}/blogs/${crossGroupArticle.blogHandle || blogHandle}/${slugify(crossGroupArticle.keyword)}` : null;

      if (position === "first") {
        const linkCount = crossGroupArticle ? 3 : 2;
        linkInstructions = `
INTERNAL LINKING (MANDATORY - Exactly ${linkCount} links):
- Link 1: Homepage → ${homepageUrl}
  Anchor text: Use a natural phrase like "visit our homepage", "explore our site", "back to home", etc.
  INTEGRATE THIS LINK IN THE MIDDLE OF THE ARTICLE (around H2 section 3-4)
- Link 2: Next article → ${nextUrl}
  Base keyword: "${nextArticle?.keyword || ""}"
  INTEGRATE THIS LINK NEAR THE END (around H2 section 5-6)${crossGroupArticle ? `
- Link 3: Related article from another blog → ${crossGroupUrl}
  Base keyword: "${crossGroupArticle.keyword}"
  INTEGRATE THIS LINK AT THE VERY END (in conclusion or last section)
  NOTE: This is a cross-blog link to provide additional value` : ''}

LINK INTEGRATION RULES:
- Place links in the MIDDLE and END of the article (NOT in introduction)
- Integrate links NATURALLY within sentences (not standalone)
- Use contextual phrases like "as we discussed in...", "learn more about...", "related to..."
- Links should feel organic, not forced
- Format: <a href="URL">anchor text</a>
- ANCHOR TEXT FLEXIBILITY: You have FULL PERMISSION to adjust the anchor text for grammatical correctness:
  * Fix spelling/grammar errors in the base keyword
  * Add/remove articles (a, an, the) as needed
  * Adjust singular/plural forms for context
  * Add punctuation if needed
  * Adapt the phrase to fit naturally in the sentence
  * Example: Base "diamond grillz price" → "diamond grillz prices", "the price of diamond grillz", "diamond grillz pricing"
  * The anchor should RELATE to the base keyword but be grammatically perfect in context
- Exactly ${linkCount} internal links total (no more, no less)
`;
      } else if (position === "last") {
        const linkCount = crossGroupArticle ? 3 : 2;
        linkInstructions = `
INTERNAL LINKING (MANDATORY - Exactly ${linkCount} links):
- Link 1: Previous article → ${previousUrl}
  Base keyword: "${previousArticle?.keyword || ""}"
  INTEGRATE THIS LINK IN THE MIDDLE OF THE ARTICLE (around H2 section 3-4)
- Link 2: Loop back to first article → ${firstUrl}
  Base keyword: "${allArticles?.[0]?.keyword || ""}"
  INTEGRATE THIS LINK NEAR THE END (around H2 section 5-6)${crossGroupArticle ? `
- Link 3: Related article from another blog → ${crossGroupUrl}
  Base keyword: "${crossGroupArticle.keyword}"
  INTEGRATE THIS LINK AT THE VERY END (in conclusion or last section)
  NOTE: This is a cross-blog link to provide additional value` : ''}

LINK INTEGRATION RULES:
- Place links in the MIDDLE and END of the article (NOT in introduction)
- Integrate links NATURALLY within sentences (not standalone)
- Use contextual phrases like "as we discussed in...", "learn more about...", "related to..."
- Links should feel organic, not forced
- Format: <a href="URL">anchor text</a>
- ANCHOR TEXT FLEXIBILITY: You have FULL PERMISSION to adjust the anchor text for grammatical correctness:
  * Fix spelling/grammar errors in the base keyword
  * Add/remove articles (a, an, the) as needed
  * Adjust singular/plural forms for context
  * Add punctuation if needed
  * Adapt the phrase to fit naturally in the sentence
  * Example: Base "diamond grillz price" → "diamond grillz prices", "the price of diamond grillz", "diamond grillz pricing"
  * The anchor should RELATE to the base keyword but be grammatically perfect in context
- Exactly ${linkCount} internal links total (no more, no less)
`;
      } else {
        const linkCount = crossGroupArticle ? 3 : 2;
        linkInstructions = `
INTERNAL LINKING (MANDATORY - Exactly ${linkCount} links):
- Link 1: Previous article → ${previousUrl}
  Base keyword: "${previousArticle?.keyword || ""}"
  INTEGRATE THIS LINK IN THE MIDDLE OF THE ARTICLE (around H2 section 3-4)
- Link 2: Next article → ${nextUrl}
  Base keyword: "${nextArticle?.keyword || ""}"
  INTEGRATE THIS LINK NEAR THE END (around H2 section 5-6)${crossGroupArticle ? `
- Link 3: Related article from another blog → ${crossGroupUrl}
  Base keyword: "${crossGroupArticle.keyword}"
  INTEGRATE THIS LINK AT THE VERY END (in conclusion or last section)
  NOTE: This is a cross-blog link to provide additional value` : ''}

LINK INTEGRATION RULES:
- Place links in the MIDDLE and END of the article (NOT in introduction)
- Integrate links NATURALLY within sentences (not standalone)
- Use contextual phrases like "as we discussed in...", "learn more about...", "related to..."
- Links should feel organic, not forced
- Format: <a href="URL">anchor text</a>
- ANCHOR TEXT FLEXIBILITY: You have FULL PERMISSION to adjust the anchor text for grammatical correctness:
  * Fix spelling/grammar errors in the base keyword
  * Add/remove articles (a, an, the) as needed
  * Adjust singular/plural forms for context
  * Add punctuation if needed
  * Adapt the phrase to fit naturally in the sentence
  * Example: Base "diamond grillz price" → "diamond grillz prices", "the price of diamond grillz", "diamond grillz pricing"
  * The anchor should RELATE to the base keyword but be grammatically perfect in context
- Exactly ${linkCount} internal links total (no more, no less)
`;
      }
    }

    const writingPrompt = `Expert SEO writer. Create a focused, high-value blog article.

KEYWORD: ${keyword}

SERP BRIEF:
${serpAnalysis}

CORE RULES:

STRUCTURE:
- NO <h1> tag (Shopify auto-generates)
- Intro: 40-60 words (punchy!)
- 4-6 H2 sections (use H3 for subsections)
- Conclusion: 60-80 words
- Length: 1200-1800 words (prioritize essentials, cut fluff)

CONTENT STRATEGY:
- Answer search intent directly - no tangents
- Cover key topics from brief + add expert insights when valuable
- Use VARIED keywords: main keyword + semantic variations + long-tail phrases + niche terms
- Evergreen content (avoid years like "2024", "2025")
- Facts over marketing hype

FORMATTING:
- Paragraphs: 40-80 words (short = readable)
- H2/H3: Add emojis when helpful (✅ ❌ 💰 🎯 ⚠️)
- <strong> tags: Use for important keywords, key facts, specs, prices (2-5 per section)
- Lists: Include 1-2 bullet lists (<ul>) with 4-6 items for features/tips/benefits
- Tables: Use for comparisons (2+ options) with inline styles + emojis

Table template:
<table style="width:100%; border-collapse:collapse; margin:20px 0;">
  <tr style="background:#f3f4f6;"><th style="padding:12px; border:1px solid #ddd;">Critère</th><th style="padding:12px; border:1px solid #ddd;">Option 1</th></tr>
  <tr><td style="padding:10px; border:1px solid #ddd;"><strong>Prix</strong></td><td style="padding:10px; border:1px solid #ddd;">💰 $50-100</td></tr>
</table>

OPTIONAL ENHANCEMENTS:
- 1-2 external links (Wikipedia, official sources) if valuable
- YouTube embed if highly relevant:
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:20px 0;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
  </div>

AVOID:
- Words: "ultimate", "revolutionary", "game-changer", "unlock", "skyrocket", "leverage"
- Characters: "—" "–" (use "-" or ",")

${linkInstructions}

OUTPUT: Pure HTML in ${language}. Start with intro paragraph. No markdown, no explanations.`;

    console.log("📝 [WRITE-ARTICLE] Prompt prepared. Length:", writingPrompt.length, "characters");
    console.log("🚀 [WRITE-ARTICLE] Calling Claude Sonnet 4.5...");
    
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",  // Claude Sonnet 4.5 (Sept 2025) - Official model name
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: writingPrompt,
        },
      ],
    });
    const endTime = Date.now();
    
    console.log(`✅ [WRITE-ARTICLE] Claude responded in ${(endTime - startTime) / 1000}s`);
    console.log("📊 [WRITE-ARTICLE] Tokens - Input:", message.usage.input_tokens, "Output:", message.usage.output_tokens);

    let content = message.content[0].type === "text" 
      ? message.content[0].text.trim() 
      : "";

    // Clean markdown code blocks if present
    content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
    content = content.trim();

    // Remove H1 tag if Claude added it (Shopify generates it automatically)
    content = content.replace(/<h1>.*?<\/h1>\s*/gi, '');
    content = content.trim();

    // Calculate costs (Sonnet pricing)
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const totalCost = (inputTokens * 3 / 1_000_000) + (outputTokens * 15 / 1_000_000);

    const slug = slugify(keyword);
    const fullUrl = siteUrl && blogHandle 
      ? `${siteUrl}/blogs/${blogHandle}/${slug}`
      : null;

    return NextResponse.json({ 
      content,
      slug,
      fullUrl,
      wordCount: content.split(/\s+/).length,
      h2Count: (content.match(/<h2>/g) || []).length,
      linkCount: (content.match(/<a href=/g) || []).length,
      costs: {
        input: inputTokens,
        output: outputTokens,
        total: totalCost
      }
    });

  } catch (error: any) {
    console.error("Error in write-article:", error);
    return NextResponse.json(
      { error: error.message || "Failed to write article" },
      { status: 500 }
    );
  }
}
