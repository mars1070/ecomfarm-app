import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';

export async function POST(req: NextRequest) {
  try {
    const { store, productId, publishDate } = await req.json();

    if (!store || !productId) {
      return NextResponse.json(
        { success: false, message: 'Store et productId requis' },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    console.log(`📅 Planification visibilité produit ${productId}...`);

    // 1. Mettre le produit en mode ACTIF (REST API)
    await client.updateProduct(productId, {
      status: 'active', // OBLIGATOIRE: Actif (pas draft)
    });

    console.log(`   ✅ Produit mis en mode ACTIF`);

    // 2. Récupérer l'ID de la publication "Online Store"
    const publicationsQuery = `
      query {
        publications(first: 10) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    const publicationsResult = await client.graphql(publicationsQuery);
    const publications = publicationsResult.publications?.edges || [];
    
    // Trouver Online Store
    const onlineStore = publications.find((edge: any) => 
      edge.node.name === 'Online Store' || edge.node.name === 'Boutique en ligne'
    );

    if (!onlineStore) {
      throw new Error('Canal "Online Store" introuvable');
    }

    const publicationId = onlineStore.node.id;
    console.log(`   📺 Canal trouvé: ${onlineStore.node.name} (${publicationId})`);

    // 3. Gérer la publication sur les canaux de vente avec GraphQL
    const now = new Date();
    const scheduledDate = publishDate ? new Date(publishDate) : now;
    const isImmediate = scheduledDate <= now;

    if (isImmediate) {
      // Publication immédiate avec GraphQL publishablePublish
      console.log(`   🚀 Publication immédiate sur Online Store`);
      
      const publishMutation = `
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationsCount {
                count
              }
              publicationCount(onlyPublished: true)
            }
            shop {
              publicationCount
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        id: `gid://shopify/Product/${productId}`,
        input: [
          {
            publicationId: publicationId, // Online Store (récupéré dynamiquement)
          }
        ]
      };

      const result = await client.graphql(publishMutation, variables);
      
      if (result.publishablePublish?.userErrors?.length > 0) {
        throw new Error(result.publishablePublish.userErrors[0].message);
      }
      
      console.log(`   ✅ Publié sur Online Store`);
      
      return NextResponse.json({
        success: true,
        message: 'Produit publié immédiatement sur Online Store',
        productId: productId,
      });
      
    } else {
      // Planification future avec GraphQL publishablePublish + publishedAt
      console.log(`   ⏰ Planification pour ${scheduledDate.toISOString()}`);
      
      // Utiliser publishablePublish avec publishedAt pour planifier
      const scheduleMutation = `
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable {
              availablePublicationsCount {
                count
              }
              publicationCount(onlyPublished: true)
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        id: `gid://shopify/Product/${productId}`,
        input: [
          {
            publicationId: publicationId, // Online Store (récupéré dynamiquement)
            publishDate: scheduledDate.toISOString(), // Date de publication planifiée
          }
        ]
      };

      const result = await client.graphql(scheduleMutation, variables);
      
      if (result.publishablePublish?.userErrors?.length > 0) {
        throw new Error(result.publishablePublish.userErrors[0].message);
      }
      
      console.log(`   ✅ Planification enregistrée`);
      
      return NextResponse.json({
        success: true,
        message: 'Produit planifié pour publication',
        productId: productId,
        scheduledDate: scheduledDate.toISOString(),
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur planification visibilité:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de la planification' 
      },
      { status: 500 }
    );
  }
}
