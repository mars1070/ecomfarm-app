import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify-client';
import type { ShopifyStore } from '@/types/shopify';
import Anthropic from '@anthropic-ai/sdk';

interface ProductMatch {
  productId: string;
  productTitle: string;
  collectionIds: string[];
  collectionTitles: string[];
  scores: number[];
  reasoning: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { store, claudeApiKey, autoApply = false, confidenceThreshold = 0.7 } = await req.json();

    if (!store) {
      return NextResponse.json(
        { success: false, message: 'Store requis' },
        { status: 400 }
      );
    }

    if (!claudeApiKey) {
      return NextResponse.json(
        { success: false, message: 'Clé API Claude requise' },
        { status: 400 }
      );
    }

    const shopifyStore: ShopifyStore = store;
    const client = new ShopifyClient(shopifyStore);
    const anthropic = new Anthropic({ 
      apiKey: claudeApiKey,
      timeout: 120000 // 2 minutes
    });

    console.log(`🤖 DÉBUT AI AUTO-ASSIGNMENT (Claude Haiku)`);
    console.log(`   Seuil de confiance: ${confidenceThreshold * 100}%`);

    // 1. Récupérer tous les produits
    console.log(`📦 Récupération des produits...`);
    const productsData = await client.getAllProducts();
    const products = productsData.products || [];
    console.log(`   ✅ ${products.length} produits récupérés`);

    // 2. Récupérer toutes les collections custom
    console.log(`📁 Récupération des collections...`);
    const collectionsData = await client.getAllCollections();
    const customCollections = collectionsData.custom_collections || [];
    console.log(`   ✅ ${customCollections.length} collections custom récupérées`);

    if (products.length === 0 || customCollections.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucun produit ou collection trouvé',
      });
    }

    // 3. Analyser avec Claude Haiku (par lots de 20 produits)
    console.log(`🧠 Analyse IA avec Claude Haiku...`);
    const matches: ProductMatch[] = [];
    const batchSize = 20;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(products.length / batchSize);
      
      console.log(`\n   📦 BATCH ${batchNum}/${totalBatches} - Analyse de ${batch.length} produits...`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Afficher les produits du batch
      batch.forEach((p, idx) => {
        console.log(`   ${idx + 1}. 📦 ${p.title}`);
      });
      
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   🤖 Envoi à Claude Haiku pour analyse...`);

      // Préparer les données pour Claude
      const productsInfo = batch.map(p => ({
        id: p.id.toString(),
        title: p.title,
        tags: p.tags || '',
        type: p.product_type || '',
        vendor: p.vendor || '',
      }));

      const collectionsInfo = customCollections.map((c: any) => ({
        title: c.title,
      }));

      const prompt = `Tu es un expert en e-commerce. Analyse chaque produit et assigne-le à TOUTES les collections pertinentes.

PRODUITS À ANALYSER:
${JSON.stringify(productsInfo, null, 2)}

COLLECTIONS DISPONIBLES:
${JSON.stringify(collectionsInfo, null, 2)}

⚠️ RÈGLE ABSOLUE: Utilise les TITRES EXACTS des collections listés ci-dessus. NE PAS inventer de titres !

INSTRUCTIONS:

1. ASSIGNE CHAQUE PRODUIT À TOUTES LES COLLECTIONS PERTINENTES
   - Collections générales (ex: "Paravents", "Paravents et Cloisons") → TOUS les paravents
   - Collections usage (ex: "Intérieur", "Extérieur", "Bureau") → Si usage correspond
   - Collections attribut (ex: "Noirs", "Blancs", "Bois", "Métal") → Si attribut présent
   - Collections fonction (ex: "Acoustiques", "Décoratifs") → Si fonction correspond
   - Collections taille (ex: "3 Panneaux", "4 Panneaux") → Si taille correspond

2. EXEMPLES:
   "Paravent Noir 3 Panneaux en Bois Bureau" devrait être dans:
   - "Paravents" ou "Paravents et Cloisons" (catégorie générale)
   - "Paravents Intérieur" (usage intérieur)
   - "Paravents Noirs" (couleur noire)
   - "Paravents en Bois" (matériau bois)
   - "Paravents 3 Panneaux" (taille)
   - "Paravents Bureau" (usage bureau)

3. LOGIQUE:
   - Si "Jardin", "Plage", "Extérieur" dans titre → PAS dans "Intérieur"
   - Si "Noir" dans titre → PAS dans "Blancs" ou autres couleurs
   - Sinon, assigne à TOUTES les collections qui ont du sens
   - Sois GÉNÉREUX dans les assignments

4. SCORE:
   - 0.9-1.0 = Attribut exact (couleur, matériau, taille)
   - 0.7-0.8 = Catégorie générale ou usage
   - 0.5-0.6 = Pertinent mais moins spécifique

FORMAT JSON STRICT (COPIE LES TITRES EXACTEMENT):
{
  "matches": [
    {
      "productId": "COPIE_ID_EXACT_DU_PRODUIT",
      "collectionTitles": ["COPIE_TITRE_EXACT_COLLECTION_1", "COPIE_TITRE_EXACT_COLLECTION_2"],
      "scores": [0.95, 0.80],
      "reasoning": ["Raison 1", "Raison 2"]
    }
  ]
}

⚠️ CRITIQUE: COPIE les TITRES de collections EXACTEMENT comme fournis ci-dessus. Ne change RIEN !

Retourne UNIQUEMENT le JSON, sans texte avant ou après.`;

      try {
        const message = await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 8000, // Augmenté pour plus de suggestions
          temperature: 0.1,
          messages: [{
            role: "user",
            content: prompt
          }]
        });

        const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
        
        // Extraire le JSON de la réponse
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('   ❌ Pas de JSON trouvé dans la réponse Claude');
          continue;
        }

        const aiResponse = JSON.parse(jsonMatch[0]);
        
        console.log(`   ✅ Réponse Claude reçue !`);
        console.log(`   📊 ${aiResponse.matches?.length || 0} produits avec suggestions`);
        
        // Traiter les résultats
        let batchMatchCount = 0;
        for (const match of aiResponse.matches || []) {
          if (match.collectionTitles && match.collectionTitles.length > 0) {
            const product = batch.find(p => p.id.toString() === match.productId);
            if (product) {
              // Mapper les titres vers les IDs
              const validCollectionIds: string[] = [];
              const validCollectionTitles: string[] = [];
              const validScores: number[] = [];
              const validReasoning: string[] = [];

              match.collectionTitles.forEach((title: string, index: number) => {
                const col = customCollections.find((c: any) => c.title === title);
                if (col) {
                  validCollectionIds.push(col.id.toString());
                  validCollectionTitles.push(col.title);
                  validScores.push(match.scores?.[index] || 0.8);
                  validReasoning.push(match.reasoning?.[index] || 'AI analysis');
                } else {
                  console.error(`   ❌ ERREUR: Collection "${title}" INTROUVABLE pour produit "${product.title}" - L'IA a inventé ce titre !`);
                  console.error(`   📋 Titres valides: ${customCollections.map((c: any) => c.title).join(', ')}`);
                }
              });

              if (validCollectionIds.length > 0) {
                batchMatchCount++;
                console.log(`   ✅ "${product.title}" → ${validCollectionIds.length} collection(s)`);
                matches.push({
                  productId: match.productId,
                  productTitle: product.title,
                  collectionIds: validCollectionIds,
                  collectionTitles: validCollectionTitles,
                  scores: validScores,
                  reasoning: validReasoning,
                });
              }
            }
          }
        }
        
        console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`   ✅ BATCH ${batchNum}/${totalBatches} TERMINÉ: ${batchMatchCount} produits assignés\n`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`   ❌ Erreur Claude pour batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log(`   ✅ ${matches.length} produits avec correspondances trouvés`);

    // 4. Appliquer si autoApply = true
    let applied = 0;
    const appliedDetails: any[] = [];

    if (autoApply) {
      console.log(`⚡ Application automatique...`);
      
      for (const match of matches) {
        // Cache collects for this product to avoid multiple reads
        let existingCollects: any[] = [];
        try {
          existingCollects = await client.getProductCollects(match.productId);
          // Wait after read to respect rate limit
          await new Promise(resolve => setTimeout(resolve, 600));
        } catch (error) {
          console.error(`   ❌ Erreur lecture collects pour ${match.productTitle}:`, error);
        }

        for (let i = 0; i < match.collectionIds.length; i++) {
          if (match.scores[i] >= confidenceThreshold) {
            try {
              // Check using cached collects
              const alreadyInCollection = existingCollects.some(
                (c: any) => c.collection_id.toString() === match.collectionIds[i]
              );

              if (!alreadyInCollection) {
                await client.addProductToCollection(match.productId, match.collectionIds[i]);
                applied++;
                appliedDetails.push({
                  product: match.productTitle,
                  collection: match.collectionTitles[i],
                  score: match.scores[i],
                  reasoning: match.reasoning[i],
                });
                console.log(`   ✅ ${match.productTitle} → ${match.collectionTitles[i]} (${(match.scores[i] * 100).toFixed(0)}%)`);
                
                // Rate limiting: increased to 800ms to stay under 2 req/sec
                await new Promise(resolve => setTimeout(resolve, 800));
              }
            } catch (error: any) {
              // Handle 429 with exponential backoff
              if (error.message?.includes('429')) {
                console.log(`   ⏸️ Rate limit atteint, pause de 2 secondes...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Retry once
                try {
                  await client.addProductToCollection(match.productId, match.collectionIds[i]);
                  applied++;
                  appliedDetails.push({
                    product: match.productTitle,
                    collection: match.collectionTitles[i],
                    score: match.scores[i],
                    reasoning: match.reasoning[i],
                  });
                  console.log(`   ✅ ${match.productTitle} → ${match.collectionTitles[i]} (${(match.scores[i] * 100).toFixed(0)}%) [retry]`);
                  await new Promise(resolve => setTimeout(resolve, 800));
                } catch (retryError) {
                  console.error(`   ❌ Échec retry pour ${match.productTitle}:`, retryError);
                }
              } else {
                console.error(`   ❌ Erreur pour ${match.productTitle}:`, error);
              }
            }
          }
        }
      }

      console.log(`✅ ${applied} assignments appliqués`);
    }

    // 5. Calculer statistiques
    const totalSuggestions = matches.reduce((sum, m) => sum + m.collectionIds.length, 0);
    const highConfidence = matches.reduce(
      (sum, m) => sum + m.scores.filter(s => s >= 0.7).length,
      0
    );

    console.log(`✅ ANALYSE IA TERMINÉE`);

    return NextResponse.json({
      success: true,
      matches: matches,
      stats: {
        total_products: products.length,
        total_collections: customCollections.length,
        products_with_matches: matches.length,
        total_suggestions: totalSuggestions,
        high_confidence_suggestions: highConfidence,
        applied: applied,
      },
      applied_details: autoApply ? appliedDetails : [],
    });

  } catch (error: any) {
    console.error('❌ Erreur AI auto-assignment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Erreur lors de l\'AI auto-assignment' 
      },
      { status: 500 }
    );
  }
}
