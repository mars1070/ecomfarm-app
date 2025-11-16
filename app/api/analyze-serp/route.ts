import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const { 
      keyword, 
      country, 
      perplexityApiKey, 
      claudeApiKey, 
      language, 
      perplexityModel = "sonar",
      // Optional Perplexity features
      searchRecencyFilter,
      searchDomainFilter,
      returnImages = false,
      returnRelatedQuestions = true,
      searchMode = "web"
    } = await request.json();

    if (!keyword || !perplexityApiKey || !claudeApiKey) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Model configuration (Updated November 2025)
    const modelConfig = perplexityModel === "sonar-pro" 
      ? {
          model: "sonar-pro",
          inputCost: 3 / 1_000_000,  // $3 per 1M tokens
          outputCost: 15 / 1_000_000  // $15 per 1M tokens
        }
      : {
          model: "sonar",  // Updated from llama-3.1-sonar-large-128k-online
          inputCost: 1 / 1_000_000,  // $1 per 1M tokens
          outputCost: 1 / 1_000_000   // $1 per 1M tokens
        };

    // Step 1: Use Perplexity to search and analyze SERP
    const perplexityPrompt = `You are an SEO expert analyzing search results.

TASK: Analyze the TOP 10-15 search results for the keyword "${keyword}" in ${country.toUpperCase()}.

WHAT TO EXTRACT:
1. **User Intent**: What is the user really looking for? (informational, transactional, navigational, commercial)
2. **Common Topics**: What topics/subtopics appear in most top-ranking pages?
3. **Keywords**: What related keywords and semantic terms are frequently used?
4. **Content Structure**: What content format works best? (listicles, how-to, comparison, guide, etc.)
5. **Key Points**: What specific information/questions do top pages address?
6. **Tone & Style**: What writing style do top pages use? (formal, casual, technical, etc.)
7. **Content Length**: Approximate word count of top-ranking pages
8. **Must-Have Elements**: What elements are ESSENTIAL to include in the article?

IMPORTANT:
- Focus on ACTIONABLE insights for writing
- Identify patterns across multiple top results
- Note what makes these pages rank well
- Extract specific topics/questions to cover

Provide a detailed analysis in ${language}.`;

    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [
          {
            role: "user",
            content: perplexityPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        // Perplexity-specific parameters (only add if provided)
        ...(searchRecencyFilter && { search_recency_filter: searchRecencyFilter }),
        ...(searchDomainFilter && { search_domain_filter: searchDomainFilter }),
        ...(returnImages && { return_images: true }),
        ...(returnRelatedQuestions && { return_related_questions: true }),
      }),
    });

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json();
      console.error("Perplexity API Error:", {
        status: perplexityResponse.status,
        statusText: perplexityResponse.statusText,
        error: errorData
      });
      throw new Error(`Perplexity API error: ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    const perplexityData = await perplexityResponse.json();
    const serpAnalysis = perplexityData.choices[0].message.content;
    
    // Extract additional data
    const citations = perplexityData.citations || [];
    const relatedQuestions = perplexityData.related_questions || [];
    const images = perplexityData.images || [];
    
    // Calculate Perplexity costs
    const perplexityInputTokens = perplexityData.usage?.prompt_tokens || 0;
    const perplexityOutputTokens = perplexityData.usage?.completion_tokens || 0;
    const perplexityCost = (perplexityInputTokens * modelConfig.inputCost) + (perplexityOutputTokens * modelConfig.outputCost);

    // Step 2: Use Claude to refine and structure the analysis
    const anthropic = new Anthropic({ 
      apiKey: claudeApiKey,
      timeout: 120000  // 2 minutes timeout for SERP analysis
    });

    const refinementPrompt = `You are an SEO expert analyzing SERP data. Extract and organize ONLY the most valuable SEO insights for writing.

KEYWORD: "${keyword}"

SERP ANALYSIS:
${serpAnalysis}

${relatedQuestions.length > 0 ? `\nKEY QUESTIONS:\n${relatedQuestions.slice(0, 5).join('\n')}` : ''}

⚠️ VALIDATION: First check if SERP matches keyword intent. If SERP is about a COMPLETELY DIFFERENT topic (e.g., "Offset Grillz" = jewelry but SERP shows BBQ), respond ONLY with: "SERP_MISMATCH: [reason]". Otherwise, create the brief below.

CREATE A FOCUSED BRIEF (800-1000 WORDS):

1. USER INTENT (1 sentence - what users really want)

2. KEY TOPICS (8-12 topics that appear in multiple top results)
   - Only topics found in 3+ top results
   - Include specific details (prices, comparisons, methods)
   - Skip redundant or minor topics

3. ESSENTIAL KEYWORDS (15-25 most important keywords)
   - Primary keywords (high frequency in SERP)
   - Semantic variations (natural language)
   - Long-tail phrases (specific user queries)
   - Niche-specific terms (slang, jargon, technical terms - KEEP even if rare!)
   - Skip only truly irrelevant or generic terms

4. H2/H3 STRUCTURE (6-8 H2 sections with key H3)
   - H2 titles that match top-ranking patterns
   - 2-3 most important H3 per H2
   - SEO-optimized and user-focused

5. TONE & STYLE (1-2 sentences - writing style of top results)

6. MUST-INCLUDE DATA (specific facts only)
   - Exact prices, statistics, numbers
   - Brand names and examples
   - Comparisons (A vs B format)
   - Tables needed (yes/no + what to compare)
   - Skip vague suggestions

7. COMPETITIVE EDGE (2-3 concrete improvements)
   - What top results are missing
   - Better organization ideas
   - Skip generic advice

8. TARGET LENGTH (word count from SERP + depth level)

FILTERING RULES:
✅ ALWAYS KEEP:
- Keywords appearing 3+ times in top results
- Topics covered by 5+ top results  
- Specific data (prices, stats, examples)
- Concrete structure patterns
- Niche-specific slang/jargon (even if rare - e.g., "iced out", "blank", "carnassier")
- Technical terms specific to the industry
- Brand names and product-specific terminology
- User search variations (even if uncommon)

❌ ONLY REMOVE:
- Generic marketing fluff ("revolutionary", "best ever")
- Obvious SEO explanations (Claude knows this)
- Repetitive reformulations of same concept
- Completely irrelevant terms (off-topic)
- Overly generic terms ("buy online", "shop now")

Be SELECTIVE. Quality over quantity. Format with bullets.

Output in ${language}.`;

    const claudeMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",  // Claude Sonnet 4.5 (Sept 2025) - Official model name
      max_tokens: 2500,  // Enough for comprehensive brief with ALL SERP data
      temperature: 0.2,  // Low temp for structured, complete output
      messages: [
        {
          role: "user",
          content: refinementPrompt,
        },
      ],
    });

    const analysis = claudeMessage.content[0].type === "text" 
      ? claudeMessage.content[0].text 
      : "";

    // Calculate Claude costs (Sonnet 4.5: $3 input / $15 output per 1M tokens)
    const claudeInputTokens = claudeMessage.usage.input_tokens;
    const claudeOutputTokens = claudeMessage.usage.output_tokens;
    const claudeCost = (claudeInputTokens * 3 / 1_000_000) + (claudeOutputTokens * 15 / 1_000_000);

    const totalCost = perplexityCost + claudeCost;

    return NextResponse.json({ 
      analysis,
      rawSerpData: serpAnalysis,
      enrichedData: {
        citations: citations.slice(0, 15),
        relatedQuestions: relatedQuestions.slice(0, 10),
        images: images.slice(0, 5),
        citationsCount: citations.length,
        questionsCount: relatedQuestions.length,
        imagesCount: images.length
      },
      costs: {
        perplexity: perplexityCost,
        claude: claudeCost,
        total: totalCost,
        breakdown: {
          perplexityModel: modelConfig.model,
          perplexityTokens: { input: perplexityInputTokens, output: perplexityOutputTokens },
          claudeTokens: { input: claudeInputTokens, output: claudeOutputTokens }
        }
      }
    });

  } catch (error: any) {
    console.error("Error in analyze-serp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze SERP" },
      { status: 500 }
    );
  }
}
