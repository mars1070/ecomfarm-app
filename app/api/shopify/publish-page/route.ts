import { NextRequest, NextResponse } from "next/server";
import type { ShopifyStore, PublishMode } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { 
      store, 
      page, 
      publishMode = 'draft',
      scheduledDate 
    }: { 
      store: ShopifyStore; 
      page: {
        title: string;
        body_html: string;
        handle?: string;
      };
      publishMode?: PublishMode;
      scheduledDate?: string;
    } = await req.json();

    if (!store || !page || !page.title || !page.body_html) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare page data
    const pageData: any = {
      page: {
        title: page.title,
        body_html: page.body_html,
        handle: page.handle || page.title.toLowerCase().replace(/\s+/g, '-'),
      }
    };

    // Handle publish mode
    if (publishMode === 'draft') {
      pageData.page.published = false;
    } else if (publishMode === 'active') {
      pageData.page.published = true;
    } else if (publishMode === 'scheduled' && scheduledDate) {
      pageData.page.published = true;
      pageData.page.published_at = scheduledDate;
    }

    // Create page in Shopify
    const response = await fetch(
      `https://${store.shopDomain}/admin/api/${store.apiVersion}/pages.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": store.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API error: ${error}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Page ${publishMode === 'draft' ? 'saved as draft' : publishMode === 'scheduled' ? 'scheduled' : 'published'}`,
      data: result.page,
    });
  } catch (error: any) {
    console.error("Shopify publish page error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
