import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeErrorMessage, getGeminiErrorMessage } from "@/lib/error-messages";

export async function POST(request: NextRequest) {
  try {
    const { claudeKey, geminiKey, perplexityKey } = await request.json();

    const results: {
      claude: { valid: boolean; error?: string };
      gemini: { valid: boolean; error?: string };
      perplexity: { valid: boolean; error?: string };
    } = {
      claude: { valid: false },
      gemini: { valid: false },
      perplexity: { valid: false }
    };

    // Test Claude API key
    if (claudeKey) {
      try {
        const anthropic = new Anthropic({ apiKey: claudeKey });
        
        // Make a minimal test request
        await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: "Hi"
            }
          ]
        });

        results.claude.valid = true;
      } catch (error: any) {
        results.claude.valid = false;
        results.claude.error = getClaudeErrorMessage(error);
      }
    }

    // Test Gemini API key
    if (geminiKey) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiKey });

        // Make a minimal test request
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Hi"
        });

        results.gemini.valid = true;
      } catch (error: any) {
        results.gemini.valid = false;
        results.gemini.error = getGeminiErrorMessage(error);
      }
    }

    // Test Perplexity API key
    if (perplexityKey) {
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",  // Updated from llama-3.1-sonar-small-128k-online (Nov 2025)
            messages: [
              {
                role: "user",
                content: "Hi"
              }
            ],
            max_tokens: 10,
          }),
        });

        if (response.ok) {
          results.perplexity.valid = true;
        } else {
          const errorData = await response.json();
          results.perplexity.valid = false;
          results.perplexity.error = errorData.error?.message || "Clé API invalide";
        }
      } catch (error: any) {
        results.perplexity.valid = false;
        results.perplexity.error = error.message || "Erreur de connexion à Perplexity";
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error testing API keys:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}
