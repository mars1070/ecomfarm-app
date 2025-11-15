import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const shop = searchParams.get("shop");
    const hmac = searchParams.get("hmac");

    // Validation
    if (!code || !shop) {
      return NextResponse.json(
        { error: "Missing code or shop parameter" },
        { status: 400 }
      );
    }

    console.log("📥 OAuth callback received:", { shop, code: code.substring(0, 10) + "..." });
    console.log("🔑 API Key:", process.env.SHOPIFY_API_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("🔐 API Secret:", process.env.SHOPIFY_API_SECRET ? "✅ Loaded" : "❌ Missing");

    // Échanger le code contre un access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("❌ Token exchange failed:", error);
      return NextResponse.json(
        { error: "Failed to exchange code for token", details: error },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    console.log("✅ Access token received:", accessToken.substring(0, 10) + "...");
    console.log("📋 Scopes:", scope);

    // Récupérer les infos de la boutique (nom, email, etc.)
    let shopName = shop.replace(".myshopify.com", "");
    try {
      const shopInfoResponse = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (shopInfoResponse.ok) {
        const shopData = await shopInfoResponse.json();
        shopName = shopData.shop.name; // Nom réel de la boutique
        console.log("🏪 Shop name:", shopName);
      }
    } catch (error) {
      console.log("⚠️ Could not fetch shop name, using default");
    }

    // Rediriger vers la page de configuration avec les infos
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${appUrl}/shopify-stores?shop=${shop}&token=${accessToken}&name=${encodeURIComponent(shopName)}&success=true`;

    console.log("🔄 Redirecting to:", redirectUrl);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("❌ OAuth callback error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
