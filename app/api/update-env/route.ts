import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: "Client ID et Secret requis" },
        { status: 400 }
      );
    }

    // Path to .env.local
    const envPath = path.join(process.cwd(), ".env.local");

    // Read current .env.local
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Update or add SHOPIFY_API_KEY and SHOPIFY_API_SECRET
    const lines = envContent.split("\n");
    let apiKeyUpdated = false;
    let apiSecretUpdated = false;

    const updatedLines = lines.map((line) => {
      if (line.startsWith("SHOPIFY_API_KEY=")) {
        apiKeyUpdated = true;
        return `SHOPIFY_API_KEY=${clientId}`;
      }
      if (line.startsWith("SHOPIFY_API_SECRET=")) {
        apiSecretUpdated = true;
        return `SHOPIFY_API_SECRET=${clientSecret}`;
      }
      return line;
    });

    // Add if not found
    if (!apiKeyUpdated) {
      updatedLines.push(`SHOPIFY_API_KEY=${clientId}`);
    }
    if (!apiSecretUpdated) {
      updatedLines.push(`SHOPIFY_API_SECRET=${clientSecret}`);
    }

    // Write back to .env.local
    fs.writeFileSync(envPath, updatedLines.join("\n"), "utf-8");

    console.log("✅ .env.local mis à jour avec succès");

    return NextResponse.json({
      success: true,
      message: "Variables d'environnement mises à jour ! Redémarrez le serveur pour appliquer les changements.",
    });
  } catch (error: any) {
    console.error("❌ Erreur mise à jour .env.local:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
