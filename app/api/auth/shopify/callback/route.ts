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

    // Rediriger vers la page de configuration avec les infos
    const redirectUrl = new URL("/shopify-stores", req.url);
    redirectUrl.searchParams.set("shop", shop);
    redirectUrl.searchParams.set("token", accessToken);
    redirectUrl.searchParams.set("success", "true");

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("❌ OAuth callback error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
