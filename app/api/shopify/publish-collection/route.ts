import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient, prepareCollectionPublishOptions } from "@/lib/shopify-client";
import type { ShopifyStore, ShopifyCollection, PublishMode } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { 
      store, 
      collection, 
      publishMode = 'draft',
      scheduledDate 
    }: { 
      store: ShopifyStore; 
      collection: Partial<ShopifyCollection>;
      publishMode?: PublishMode;
      scheduledDate?: string;
    } = await req.json();

    if (!store || !collection) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    // Prepare publish options for collections
    const publishOptions = prepareCollectionPublishOptions(publishMode, scheduledDate);

    // Merge collection data with publish options
    const collectionData = {
      ...collection,
      ...publishOptions,
    };

    // Create collection in Shopify
    const result = await client.createCollection(collectionData);

    return NextResponse.json({
      success: true,
      message: `Collection ${publishMode === 'draft' ? 'saved as draft' : publishMode === 'scheduled' ? 'scheduled' : 'published'}`,
      data: result,
    });
  } catch (error: any) {
    console.error("Shopify publish collection error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
