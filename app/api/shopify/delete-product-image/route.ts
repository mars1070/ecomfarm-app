import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';

export async function POST(req: NextRequest) {
  try {
    const { store, productId, imageId } = await req.json();

    if (!store || !productId || !imageId) {
      return NextResponse.json(
        { success: false, message: 'Store, productId et imageId requis' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);

    console.log(`🗑️ Suppression de l'image ${imageId} du produit ${productId}...`);

    // Delete product image using Shopify API
    await client.deleteProductImage(productId, imageId);

    console.log(`✅ Image supprimée avec succès`);

    return NextResponse.json({
      success: true,
      message: `Image supprimée avec succès !`,
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la suppression de l\'image:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la suppression de l\'image' 
      },
      { status: 500 }
    );
  }
}
