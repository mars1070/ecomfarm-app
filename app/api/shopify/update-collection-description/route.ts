import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';

export async function POST(req: NextRequest) {
  try {
    const { store, collectionId, bodyHtml } = await req.json();

    if (!store || !collectionId || !bodyHtml) {
      return NextResponse.json(
        { success: false, message: 'Store, collectionId et bodyHtml requis' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);

    console.log(`📝 Mise à jour de la description de la collection ${collectionId}...`);

    // Mettre à jour la description de la collection
    const response = await client.updateCollection(collectionId, {
      body_html: bodyHtml,
    });

    console.log(`✅ Description mise à jour avec succès`);

    return NextResponse.json({
      success: true,
      collection: response.custom_collection,
      message: 'Description mise à jour avec succès',
    });

  } catch (error: any) {
    console.error('❌ Erreur mise à jour description:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la mise à jour de la description' 
      },
      { status: 500 }
    );
  }
}
