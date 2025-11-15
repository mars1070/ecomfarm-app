import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient, prepareProductPublishOptions } from "@/lib/shopify-client";
import type { ShopifyStore, ShopifyProduct, PublishMode } from "@/types/shopify";

export async function POST(req: NextRequest) {
  try {
    const { 
      store, 
      product, 
      publishMode = 'draft',
      scheduledDate 
    }: { 
      store: ShopifyStore; 
      product: Partial<ShopifyProduct> & { handle?: string };
      publishMode?: PublishMode;
      scheduledDate?: string;
    } = await req.json();

    if (!store || !product) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    let result;
    let isUpdate = false;
    let productId: string;

    // Pour le scheduling, on crée TOUJOURS en "active" mais non publié sur les channels
    // Ensuite on schedule la publication sur Online Store
    const createAsActive = publishMode === 'scheduled';
    
    // Prepare publish options
    const publishOptions = createAsActive 
      ? { status: 'active' as const, published_at: null } // Active mais non publié
      : prepareProductPublishOptions(publishMode, scheduledDate);

    // Merge product data with publish options
    const productData = {
      ...product,
      ...publishOptions,
    };

    // Si le produit a un Handle, vérifier s'il existe déjà
    if (product.handle) {
      const existingProduct = await client.getProductByHandle(product.handle);
      
      if (existingProduct) {
        // Produit existe -> METTRE À JOUR
        console.log(`✏️ Updating existing product: ${product.handle} (ID: ${existingProduct.id})`);
        
        // Ne pas inclure le handle dans l'update (Shopify ne permet pas de le changer)
        const { handle, ...updateData } = productData;
        
        result = await client.updateProduct(existingProduct.id, updateData);
        isUpdate = true;
        productId = existingProduct.id;
      } else {
        // Produit n'existe pas -> CRÉER
        console.log(`✨ Creating new product: ${product.handle}`);
        result = await client.createProduct(productData);
        productId = result.product.id;
      }
    } else {
      // Pas de handle -> CRÉER (nouveau produit)
      console.log(`✨ Creating new product without handle`);
      result = await client.createProduct(productData);
      productId = result.product.id;
    }

    // Si mode scheduled, programmer la publication sur Online Store
    if (publishMode === 'scheduled' && scheduledDate) {
      console.log(`📅 Scheduling publication for ${scheduledDate}`);
      await client.scheduleProductPublication(productId, scheduledDate);
    }

    return NextResponse.json({
      success: true,
      message: isUpdate 
        ? `Product updated ${publishMode === 'draft' ? 'as draft' : publishMode === 'scheduled' ? 'and scheduled' : 'and published'}`
        : `Product created ${publishMode === 'draft' ? 'as draft' : publishMode === 'scheduled' ? 'and scheduled' : 'and published'}`,
      data: result,
      isUpdate,
    });
  } catch (error: any) {
    console.error("Shopify publish product error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
