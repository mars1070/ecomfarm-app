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

    const writingPrompt = `You are an expert SEO content writer. Write a complete, SEO-optimized blog article.

IMPORTANT: Write evergreen content. Do NOT include specific years (like "2024", "2025", etc.) in titles or content unless absolutely necessary for the topic. Keep the content timeless.

KEYWORD/TOPIC: ${keyword}

SERP ANALYSIS & BRIEF:
${serpAnalysis}

STRICT SEO WRITING RULES:

STRUCTURE (MANDATORY):
- DO NOT include <h1> tag (Shopify generates it automatically from the article title)
- Start directly with introduction paragraph (no heading, 40-60 words - SHORT and punchy!)
- Then 5-8 sections with <h2> headings
- Use <h3> for subsections when relevant
- Conclusion paragraph at the end (60-80 words)
- Total length: 1500-2500 words

H2/H3 TITLES:
- Include target keyword or variations in 60% of H2 titles
- Address user questions/needs
- Clear, descriptive, engaging
- Use question format when appropriate (with "?")
- Add relevant emojis at the START of H2/H3 when it enhances clarity
- Examples: "✅ Benefits", "❌ Risks to Avoid", "💰 Cost Breakdown", "🎯 How to Choose", "⚠️ Important Warning"
- Don't force emojis - use only when they add visual value

CONTENT QUALITY:
- Follow ALL insights from SERP analysis as your BASE
- Cover ALL topics identified in the brief
- Use ALL essential keywords naturally (including niche-specific slang/jargon)
- Answer user intent completely
- Provide REAL value (facts, tips, examples)
- Write in a natural, engaging style
- Match the tone identified in analysis

CREATIVE FREEDOM (IMPORTANT!):
- You have FULL PERMISSION to go beyond the brief
- Add valuable insights, tips, or angles not mentioned in SERP analysis
- Deepen explanations where it adds value
- Include relevant details or nuances you know about the topic
- Add expert-level information that elevates the content
- The brief is your FOUNDATION, not your LIMIT
- Be comprehensive and thorough - don't hold back valuable information
- If you know something important that's missing from the brief, ADD IT

KEYWORD USAGE:
- Main keyword in first paragraph and naturally throughout
- Use semantic variations and related terms
- Include niche-specific terminology (slang, jargon, technical terms)
- Don't force keywords - stay natural and conversational
- Keyword density: 1-2% (natural occurrence)

STRONG TAGS:
- Distribute throughout the article (including lower sections, not just top)
- 2-5 per section when relevant (not every paragraph)
- Use strategically for:
  * Primary keywords when naturally relevant
  * Ultra-important ideas or key takeaways
  * Critical technical terms or specifications
  * Important numbers/stats/data points
  * Short impactful phrases (2-4 words max)
- Examples: <strong>18 carats</strong>, <strong>livraison gratuite</strong>, <strong>VVS diamonds</strong>
- Don't overuse - quality over quantity, stay natural

PARAGRAPHS:
- 40-80 words per paragraph (SHORTER = more readable!)
- One main idea per paragraph
- Use transition words between paragraphs
- Mix short (2-3 sentences) and medium paragraphs
- Break up long explanations into multiple short paragraphs

VISUAL ELEMENTS & FORMATTING:
- Use <p> tags for paragraphs
- Lists (maximum 1-2 per article):
  * Use <ul>/<li> for bullet lists when listing features, tips, or options
  * Use <ol>/<li> for numbered lists when showing steps, rankings, or sequences
  * Choose format based on context (bullets for unordered, numbers for ordered)
  * 3-6 items per list maximum
- Emojis: Use varied emojis based on context (not limited to ✅ ❌ 💡 ⚠️ 🎯 📊 💰)
  * Choose emojis that match the specific topic and tone
  * Examples: 🔥 💎 ⚡ 🌟 🎨 🛠️ 📈 🏆 💪 🎁 etc.
- Comparison tables: Encouraged when comparing options, but not mandatory
  * Use when it genuinely adds clarity and value
  * Maximum 1 table per article (very rarely 2 if absolutely necessary)
  * Don't force tables if comparison is simple

EXTERNAL LINKS & MEDIA (OPTIONAL):
- You MAY add 1-2 relevant external links if they add significant value
- Authoritative sources: Wikipedia, official organizations, research studies, government sites
- Social media embeds (when highly relevant):
  * YouTube videos: Embed relevant tutorial/review videos using iframe
  * Instagram posts: Link to popular posts related to the content
  * X/Twitter: Link to relevant tweets if they provide valuable context/info
- Use dofollow (no rel="nofollow")
- Format: <a href="URL" target="_blank">anchor text</a>
- Place where contextually relevant
- YouTube embed example:
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:20px 0;">
    <iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
  </div>
- Only include if you can find a genuinely relevant video/post

COMPARISON TABLES (ENCOURAGED BUT NOT FORCED):
When the article naturally compares 2+ distinct options/methods/products, a comparison table is highly valuable.
Use tables when they add clarity, but don't force them if the comparison is simple or doesn't fit.
Use this exact HTML structure with inline styles:

<table style="width:100%; border-collapse:collapse; margin:20px 0;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:12px; text-align:left; border:1px solid #ddd;">Critère</th>
      <th style="padding:12px; text-align:left; border:1px solid #ddd;">Option 1</th>
      <th style="padding:12px; text-align:left; border:1px solid #ddd;">Option 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px; border:1px solid #ddd;"><strong>Prix</strong></td>
      <td style="padding:10px; border:1px solid #ddd;">💰 $50-100</td>
      <td style="padding:10px; border:1px solid #ddd;">💰💰 $200-500</td>
    </tr>
    <tr style="background:#fafafa;">
      <td style="padding:10px; border:1px solid #ddd;"><strong>Qualité</strong></td>
      <td style="padding:10px; border:1px solid #ddd;">⭐⭐⭐ Bonne</td>
      <td style="padding:10px; border:1px solid #ddd;">⭐⭐⭐⭐⭐ Excellente</td>
    </tr>
    <tr>
      <td style="padding:10px; border:1px solid #ddd;"><strong>Recommandé pour</strong></td>
      <td style="padding:10px; border:1px solid #ddd;">✅ Débutants</td>
      <td style="padding:10px; border:1px solid #ddd;">✅ Professionnels</td>
    </tr>
  </tbody>
</table>

Use varied emojis in cells based on context:
- Common: ✅ (yes/good), ❌ (no/bad), ⭐ (rating), 💰 (price), 🎯 (recommended), ⚠️ (warning)
- But also: 🔥 (popular), 💎 (premium), ⚡ (fast), 🌟 (best), 🎨 (design), 🛠️ (tools), 📈 (growth), etc.
- Choose emojis that fit the specific comparison context
Alternate row backgrounds with style="background:#fafafa;" for better readability.

BANNED WORDS:
"ultimate", "revolutionary", "game-changer", "unlock", "skyrocket", "boost", "leverage", "cutting-edge", "state-of-the-art", "world-class"

BANNED CHARACTERS:
"—" (em dash), "–" (en dash) - Use simple hyphen "-" or comma "," instead

TONE & STYLE:
- Professional but accessible
- Speak TO the reader (use "you", "your")
- Be helpful and informative
- No marketing fluff or hype
- Factual and trustworthy

${linkInstructions}

OUTPUT FORMAT:
- Pure HTML in ${language}
- Start directly with introduction paragraph (NO <h1> tag)
- Then H2 sections with proper heading hierarchy (H2 → H3)
- Ready to publish in Shopify
- No markdown, no code blocks, no explanations

Write the complete article now.`;

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
