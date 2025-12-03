import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient } from "@/lib/shopify-client";
import type { ShopifyStore } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { store }: { store: ShopifyStore } = await req.json();

    if (!store || !store.shopDomain || !store.accessToken) {
      return NextResponse.json(
        { success: false, message: "Missing store credentials" },
        { status: 400 }
      );
    }

    console.log(`🔄 Syncing ALL products for ${store.shopDomain}...`);

    const client = new ShopifyClient(store);
    const result = await client.getAllProducts();

    console.log(`✅ Found ${result.products?.length || 0} products (ALL products fetched)`);

    // Format products for display
    const formattedProducts = (result.products || []).map((p: any) => ({
      id: p.id.toString(),
      title: p.title,
      handle: p.handle,
      vendor: p.vendor || '',
      productType: p.product_type || '',
      tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [],
      status: p.status,
      variants: p.variants || [],
      images: p.images || [],
      bodyHtml: p.body_html || '',
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error: any) {
    console.error("❌ Shopify sync products error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
