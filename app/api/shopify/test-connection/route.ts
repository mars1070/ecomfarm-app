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

    const client = new ShopifyClient(store);
    const result = await client.testConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Shopify connection test error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
