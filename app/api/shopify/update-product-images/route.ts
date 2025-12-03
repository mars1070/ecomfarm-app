import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient } from "@/lib/shopify-client";
import type { ShopifyStore } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { store, productId, images }: { 
      store: ShopifyStore; 
      productId: string; 
      images: any[] 
    } = await req.json();

    if (!store || !productId || !images) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating image order for product ${productId}...`);

    const client = new ShopifyClient(store);

    // Update each image position via Shopify API
    const updatePromises = images.map((image, index) => {
      return client.updateProductImage(productId, image.id, index + 1);
    });

    await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${images.length} image positions`);

    return NextResponse.json({
      success: true,
      message: `${images.length} images réorganisées avec succès !`,
    });
  } catch (error: any) {
    console.error("❌ Error updating product images:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
