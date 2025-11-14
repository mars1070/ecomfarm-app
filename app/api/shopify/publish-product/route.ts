import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient, prepareProductPublishOptions } from "@/lib/shopify-client";
import type { ShopifyStore, ShopifyProduct, PublishMode } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { 
      store, 
      product, 
      publishMode = 'draft',
      scheduledDate 
    }: { 
      store: ShopifyStore; 
      product: Partial<ShopifyProduct>;
      publishMode?: PublishMode;
      scheduledDate?: string;
    } = await req.json();

    if (!store || !product) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    // Prepare publish options for products
    const publishOptions = prepareProductPublishOptions(publishMode, scheduledDate);

    // Merge product data with publish options
    const productData = {
      ...product,
      ...publishOptions,
    };

    // Create product in Shopify
    const result = await client.createProduct(productData);

    return NextResponse.json({
      success: true,
      message: `Product ${publishMode === 'draft' ? 'saved as draft' : publishMode === 'scheduled' ? 'scheduled' : 'published'}`,
      data: result,
    });
  } catch (error: any) {
    console.error("Shopify publish product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
