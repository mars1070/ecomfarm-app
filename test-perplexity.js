// Test simple de l'API Perplexity avec le nouveau modèle "sonar"
// Usage: node test-perplexity.js VOTRE_CLE_API

const apiKey = process.argv[2];

if (!apiKey) {
  console.error("❌ Usage: node test-perplexity.js VOTRE_CLE_API");
  process.exit(1);
}

async function testPerplexity() {
  console.log("🔍 Test de l'API Perplexity avec le modèle 'sonar'...\n");

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: "What are the top 3 results for 'best grillz 2024'?"
          }
        ],
        max_tokens: 500,
      }),
    });

    console.log("📊 Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("\n❌ ERREUR:");
      console.error(JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    
    console.log("\n✅ SUCCÈS!");
    console.log("\n📝 Réponse:");
    console.log(data.choices[0].message.content);
    
    console.log("\n💰 Usage:");
    console.log("- Input tokens:", data.usage?.prompt_tokens || 0);
    console.log("- Output tokens:", data.usage?.completion_tokens || 0);
    console.log("- Total tokens:", data.usage?.total_tokens || 0);
    
    if (data.citations) {
      console.log("\n🔗 Citations:", data.citations.length);
    }

  } catch (error) {
    console.error("\n❌ ERREUR:", error.message);
  }
}

testPerplexity();
