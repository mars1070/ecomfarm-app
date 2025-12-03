import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';

export async function POST(req: NextRequest) {
  try {
    const { store } = await req.json();

    if (!store) {
      return NextResponse.json(
        { success: false, message: 'Store requis' },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store.shop_domain, store.access_token);

    console.log(`🔍 Recherche des produits NON assignés...`);

    // 1. Récupérer TOUS les produits
    const productsData = await client.getAllProducts();
    const allProducts = productsData.products || [];
    console.log(`   ✅ ${allProducts.length} produits récupérés`);

    // 2. Pour chaque produit, vérifier s'il a des collects
    const unassignedProducts: any[] = [];
    let checkedCount = 0;

    for (const product of allProducts) {
      try {
        const collects = await client.getProductCollects(product.id.toString());
        
        if (collects.length === 0) {
          unassignedProducts.push(product);
          console.log(`   📦 Produit NON assigné: "${product.title}"`);
        }
        
        checkedCount++;
        
        // Log progression tous les 50 produits
        if (checkedCount % 50 === 0) {
          console.log(`   📊 ${checkedCount}/${allProducts.length} produits vérifiés (${unassignedProducts.length} non assignés)`);
        }
        
        // Rate limiting: 500ms pour respecter 2 req/sec de Shopify
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${product.title}:`, error);
      }
    }

    console.log(`✅ ${unassignedProducts.length} produits NON assignés trouvés sur ${allProducts.length} total`);

    return NextResponse.json({
      success: true,
      unassignedProducts: unassignedProducts,
      total: allProducts.length,
      unassignedCount: unassignedProducts.length,
    });

  } catch (error: any) {
    console.error('❌ Erreur recherche produits non assignés:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la recherche' 
      },
      { status: 500 }
    );
  }
}
