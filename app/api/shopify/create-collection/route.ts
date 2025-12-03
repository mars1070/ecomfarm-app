import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';

export async function POST(req: NextRequest) {
  try {
    const { store, collection } = await req.json();

    if (!store || !collection) {
      return NextResponse.json(
        { success: false, message: 'Store et collection requis' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);

    console.log(`📤 Création de la collection "${collection.title}" dans Shopify...`);

    // Créer la collection custom dans Shopify
    const response = await client.createCollection({
      title: collection.title,
      handle: collection.handle,
      body_html: collection.body_html || '',
      published: collection.published !== false,
      published_at: collection.published_at || null,
    });

    console.log(`✅ Collection créée avec succès (ID: ${response.custom_collection.id})`);

    return NextResponse.json({
      success: true,
      collection: response.custom_collection,
      message: `Collection "${collection.title}" créée avec succès`,
    });

  } catch (error: any) {
    console.error('❌ Erreur création collection:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la création de la collection' 
      },
      { status: 500 }
    );
  }
}
