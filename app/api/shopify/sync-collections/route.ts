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

    console.log(`🔄 Syncing collections for ${store.shopDomain}...`);

    const client = new ShopifyClient(store);
    const result = await client.getAllCollections();

    console.log(`✅ Found ${result.total} collections (${result.custom_collections.length} custom, ${result.smart_collections.length} smart)`);

    // Format collections for display with real product counts
    const formattedCollections = await Promise.all([
      ...result.custom_collections.map(async (c: any) => {
        // Get real product count for this collection
        const products = await client.getCollectionProducts(c.id.toString(), 'custom');
        return {
          id: c.id.toString(),
          title: c.title,
          handle: c.handle,
          type: 'custom' as const,
          productsCount: products.length,
          published: c.published_at !== null,
          image: c.image?.src || null,
          bodyHtml: c.body_html || '',
          products: products, // Include actual products
        };
      }),
      ...result.smart_collections.map(async (c: any) => {
        // Get real product count for this collection
        const products = await client.getCollectionProducts(c.id.toString(), 'smart');
        return {
          id: c.id.toString(),
          title: c.title,
          handle: c.handle,
          type: 'smart' as const,
          productsCount: products.length,
          published: c.published_at !== null,
          image: c.image?.src || null,
          bodyHtml: c.body_html || '',
          products: products, // Include actual products
        };
      }),
    ]);

    return NextResponse.json({
      success: true,
      collections: formattedCollections,
      total: result.total,
    });
  } catch (error: any) {
    console.error("❌ Shopify sync collections error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
