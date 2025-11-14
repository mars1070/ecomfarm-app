import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient, preparePublishOptions } from "@/lib/shopify-client";
import type { ShopifyStore, ShopifyArticle, PublishMode } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { 
      store, 
      blogId, 
      article, 
      publishMode = 'draft',
      scheduledDate 
    }: { 
      store: ShopifyStore; 
      blogId: string; 
      article: Partial<ShopifyArticle>;
      publishMode?: PublishMode;
      scheduledDate?: string;
    } = await req.json();

    if (!store || !blogId || !article) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    // Prepare publish options based on mode
    const publishOptions = preparePublishOptions(publishMode, scheduledDate);

    // Merge article data with publish options
    const articleData = {
      ...article,
      ...publishOptions,
    };

    // Create article in Shopify
    const result = await client.createArticle(blogId, articleData);

    return NextResponse.json({
      success: true,
      message: `Article ${publishMode === 'draft' ? 'saved as draft' : publishMode === 'scheduled' ? 'scheduled' : 'published'}`,
      data: result,
    });
  } catch (error: any) {
    console.error("Shopify publish article error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
