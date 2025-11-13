import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeErrorMessage, getGeminiErrorMessage } from "@/lib/error-messages";

export async function POST(request: NextRequest) {
  try {
    const { claudeKey, geminiKey } = await request.json();

    const results: {
      claude: { valid: boolean; error?: string };
      gemini: { valid: boolean; error?: string };
    } = {
      claude: { valid: false },
      gemini: { valid: false }
    };

    // Test Claude API key
    if (claudeKey) {
      try {
        const anthropic = new Anthropic({ apiKey: claudeKey });
        
        // Make a minimal test request
        await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
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

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error testing API keys:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}
