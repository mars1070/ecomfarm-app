import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient } from "@/lib/shopify-client";
import type { ShopifyStore } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { store, products, action }: { 
      store: ShopifyStore; 
      products: any[];
      action: 'reset' | 'custom';
    } = await req.json();

    if (!store || !products || !action) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating handles for ${products.length} products (action: ${action})...`);

    const client = new ShopifyClient(store);
    const results = [];
    let processedCount = 0;

    // Process in batches of 10 (fast processing with smart error handling)
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      batches.push(products.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} batches of ${BATCH_SIZE} products...`);

    for (const batch of batches) {
      // Process batch in parallel
      const batchPromises = batch.map(async (product) => {
        try {
          let newHandle = product.handle;

          // Si action = reset, on supprime le handle pour qu'il soit régénéré depuis le titre
          if (action === 'reset') {
            newHandle = null;
          }

          // Update product via Shopify API
          const response = await client.updateProductHandle(product.id, newHandle);

          processedCount++;
          console.log(`✅ Updated handle for product ${product.id} (${processedCount}/${products.length})`);

          return {
            id: product.id,
            title: product.title,
            success: true,
            newHandle: (response as any).product?.handle || 'auto-generated'
          };
        } catch (error: any) {
          processedCount++;
          
          // Si l'erreur indique que le handle existe déjà ou est identique, c'est un succès
          const errorMessage = error.message?.toLowerCase() || '';
          const isAlreadyValid = errorMessage.includes('handle') && 
                                 (errorMessage.includes('taken') || 
                                  errorMessage.includes('already') ||
                                  errorMessage.includes('exists'));
          
          if (isAlreadyValid) {
            console.log(`✅ Product ${product.id} handle already valid (${processedCount}/${products.length})`);
            return {
              id: product.id,
              title: product.title,
              success: true,
              newHandle: 'already-valid'
            };
          } else {
            console.error(`❌ Error updating product ${product.id}:`, error);
            return {
              id: product.id,
              title: product.title,
              success: false,
              error: error.message
            };
          }
        }
      });

      // Wait for all requests in batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Wait 1 second before next batch (2 req/sec = 2 req per second)
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const alreadyValidCount = results.filter(r => r.success && r.newHandle === 'already-valid').length;
    const updatedCount = successCount - alreadyValidCount;

    console.log(`✅ ${updatedCount} handles updated, ${alreadyValidCount} already valid, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `✅ ${updatedCount} slugs mis à jour, ${alreadyValidCount} déjà valides${failCount > 0 ? `, ${failCount} erreurs` : ''}`,
      results,
      stats: {
        total: products.length,
        updated: updatedCount,
        alreadyValid: alreadyValidCount,
        failed: failCount
      }
    });
  } catch (error: any) {
    console.error("❌ Error updating product handles:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
