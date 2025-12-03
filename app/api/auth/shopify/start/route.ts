import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter" },
        { status: 400 }
      );
    }

    // Nettoyer le shop domain (enlever https://, http://, www., etc.)
    shop = shop
      .replace(/^https?:\/\//, '')  // Enlever https:// ou http://
      .replace(/^www\./, '')         // Enlever www.
      .replace(/\/$/, '');           // Enlever trailing slash

    // Si ce n'est pas un domaine .myshopify.com, on ne peut pas continuer
    if (!shop.includes('.myshopify.com')) {
      return NextResponse.json(
        { 
          error: "Invalid shop domain", 
          message: "Vous devez utiliser votre domaine .myshopify.com (ex: mystore.myshopify.com), pas votre domaine personnalisé." 
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.SHOPIFY_API_KEY;
    
    // Détection automatique de l'URL (local vs production)
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/shopify/callback`;
    
    // Scopes requis pour votre app
    const scopes = [
      "read_customers",
      "read_orders",
      "read_products",
      "write_products",
      "read_content",
      "write_content",
      "write_publications"       // Pour scheduler la publication sur les Sales Channels
    ].join(",");

    // Générer un nonce pour la sécurité (optionnel mais recommandé)
    const state = Math.random().toString(36).substring(7);

    // Construire l'URL d'autorisation Shopify
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

    console.log("🚀 Starting OAuth flow for shop:", shop);
    console.log("📍 Redirect URI:", redirectUri);
    console.log("🔑 API Key:", apiKey ? "✅ Loaded" : "❌ Missing");

    // Rediriger vers Shopify pour l'autorisation
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error("❌ OAuth start error:", error);
    return NextResponse.json(
      { error: "Failed to start OAuth flow", details: error.message },
      { status: 500 }
    );
  }
}
