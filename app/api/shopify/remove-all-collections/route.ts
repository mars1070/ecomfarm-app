import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';

export async function POST(req: NextRequest) {
  try {
    const { store } = await req.json();

    if (!store) {
      return NextResponse.json(
        { success: false, message: 'Store requis' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);

    console.log(`🗑️ DÉBUT SUPPRESSION DE TOUS LES ASSIGNMENTS`);

    // MÉTHODE REST API (officielle Shopify)
    // 1. Récupérer TOUS les produits
    // 2. Pour chaque produit, récupérer ses collects
    // 3. Supprimer chaque collect
    
    console.log(`📦 Récupération de tous les produits...`);
    const productsData = await client.getAllProducts();
    const products = productsData.products || [];
    console.log(`   ✅ ${products.length} produits récupérés`);

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun produit trouvé',
        removed: 0,
      });
    }

    // Pour chaque produit, supprimer tous ses collects
    console.log(`🗑️ Suppression des assignments...`);
    let totalRemoved = 0;
    let errors = 0;
    let processedProducts = 0;

    for (const product of products) {
      try {
        // Récupérer tous les collects de ce produit
        const collects = await client.getProductCollects(product.id.toString());
        
        if (collects.length > 0) {
          console.log(`   🗑️ ${product.title}: ${collects.length} collection(s) à supprimer`);
          
          // Supprimer chaque collect
          for (const collect of collects) {
            try {
              // DELETE /collects/{collect_id}.json (méthode officielle Shopify)
              await client.removeProductFromCollection(collect.id.toString());
              totalRemoved++;
              
              // Rate limiting: 2 req/sec
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              errors++;
              console.error(`   ❌ Erreur suppression collect ${collect.id}:`, error);
            }
          }
        }
        
        processedProducts++;
        
        // Log progression tous les 10 produits
        if (processedProducts % 10 === 0) {
          console.log(`   📊 ${processedProducts}/${products.length} produits traités (${totalRemoved} assignments supprimés)`);
        }
        
      } catch (error) {
        errors++;
        console.error(`   ❌ Erreur pour ${product.title}:`, error);
      }
    }

    console.log(`✅ ${totalRemoved} assignments supprimés sur ${products.length} produits (${errors} erreurs)`);

    return NextResponse.json({
      success: true,
      message: `${totalRemoved} assignments supprimés avec succès`,
      removed: totalRemoved,
      errors: errors,
      productsProcessed: processedProducts,
    });

  } catch (error: any) {
    console.error('❌ Erreur suppression assignments:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la suppression' 
      },
      { status: 500 }
    );
  }
}
