import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';

export async function POST(req: NextRequest) {
  try {
    const { store, product_id, collection_id } = await req.json();

    if (!store || !product_id || !collection_id) {
      return NextResponse.json(
        { success: false, message: 'Store, product_id et collection_id requis' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);

    // Vérifier si déjà assigné
    const existingCollects = await client.getProductCollects(product_id);
    const alreadyAssigned = existingCollects.some(
      (c: any) => c.collection_id.toString() === collection_id
    );

    if (alreadyAssigned) {
      return NextResponse.json({
        success: true,
        message: 'Produit déjà dans cette collection',
        already_assigned: true,
      });
    }

    // Ajouter le produit à la collection
    await client.addProductToCollection(product_id, collection_id);

    return NextResponse.json({
      success: true,
      message: 'Produit ajouté à la collection avec succès',
      already_assigned: false,
    });

  } catch (error: any) {
    console.error('❌ Erreur apply suggestion:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de l\'application de la suggestion' 
      },
      { status: 500 }
    );
  }
}
