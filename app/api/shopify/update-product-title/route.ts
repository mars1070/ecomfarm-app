import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';

export async function POST(req: NextRequest) {
  try {
    const { store, productId, title } = await req.json();

    if (!store || !productId || !title) {
      return NextResponse.json(
        { success: false, message: 'Store, productId et title requis' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);

    console.log(`🔄 Mise à jour du titre du produit ${productId}...`);
    console.log(`   Nouveau titre: "${title}"`);

    // Update product title using Shopify API
    const result = await client.updateProduct(productId, {
      title: title,
    });

    console.log(`✅ Titre du produit mis à jour avec succès`);

    return NextResponse.json({
      success: true,
      message: `Titre du produit mis à jour avec succès !`,
      product: result.product,
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du titre:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la mise à jour du titre' 
      },
      { status: 500 }
    );
  }
}
