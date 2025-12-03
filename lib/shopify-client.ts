// Shopify API Client Utility

import type { ShopifyStore } from '@/types/shopify';

export class ShopifyClient {
  private store: ShopifyStore;
  private baseUrl: string;

  constructor(store: ShopifyStore) {
    this.store = store;
    this.baseUrl = `https://${store.shopDomain}/admin/api/${store.apiVersion}`;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'X-Shopify-Access-Token': this.store.accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify API Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // GraphQL request for advanced features (scheduling, etc.)
  async graphql(query: string, variables: any = {}) {
    const url = `https://${this.store.shopDomain}/admin/api/${this.store.apiVersion}/graphql.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.store.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify GraphQL Error (${response.status}): ${error}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  // GraphQL request that returns full response (including errors)
  async graphqlRequest(query: string, variables: any = {}) {
    const url = `https://${this.store.shopDomain}/admin/api/${this.store.apiVersion}/graphql.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.store.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify GraphQL Error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // ===== PRODUCTS =====
  async createProduct(product: any) {
    return this.request('/products.json', {
      method: 'POST',
      body: JSON.stringify({ product }),
    });
  }

  async updateProduct(productId: string, product: any) {
    return this.request(`/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product }),
    });
  }

  async getProducts(limit: number = 250) {
    return this.request(`/products.json?limit=${limit}`);
  }

  async getAllProducts() {
    let allProducts: any[] = [];
    let hasMore = true;
    let pageInfo: string | null = null;

    console.log('🔄 Fetching ALL products with pagination...');

    while (hasMore) {
      try {
        const url: string = pageInfo 
          ? `/products.json?limit=250&page_info=${pageInfo}`
          : '/products.json?limit=250';
        
        const response: Response = await fetch(
          `https://${this.store.shopDomain}/admin/api/2025-01${url}`,
          {
            headers: {
              'X-Shopify-Access-Token': this.store.accessToken,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const products = data.products || [];
        allProducts = allProducts.concat(products);

        console.log(`✅ Fetched ${products.length} products (Total: ${allProducts.length})`);

        // Check for next page in Link header
        const linkHeader: string | null = response.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
          // Extract page_info from Link header
          const match: RegExpMatchArray | null = linkHeader.match(/page_info=([^&>]+)/);
          if (match) {
            pageInfo = match[1];
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        // Small delay to respect rate limits (2 req/sec)
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Error fetching products page:', error);
        hasMore = false;
      }
    }

    console.log(`✅ Total products fetched: ${allProducts.length}`);
    return { products: allProducts };
  }

  async getProductByHandle(handle: string) {
    try {
      // Shopify API permet de chercher par handle
      const response = await this.request(`/products.json?handle=${handle}&limit=1`);
      return response.products && response.products.length > 0 ? response.products[0] : null;
    } catch (error) {
      return null;
    }
  }

  async deleteProduct(productId: string) {
    return this.request(`/products/${productId}.json`, {
      method: 'DELETE',
    });
  }

  // Schedule product publication to a Sales Channel (Online Store)
  async scheduleProductPublication(productId: string, publishDate: string) {
    const query = `
      mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          shop {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Get the Online Store publication ID (usually the main sales channel)
    // We need to get this first
    const publicationsQuery = `
      {
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

    const publicationsData = await this.graphql(publicationsQuery);
    const onlineStore = publicationsData.publications.edges.find(
      (edge: any) => edge.node.name === 'Online Store' || edge.node.name.includes('Online')
    );

    if (!onlineStore) {
      throw new Error('Online Store publication not found');
    }

    const variables = {
      id: `gid://shopify/Product/${productId}`,
      input: {
        publicationId: onlineStore.node.id,
        publishDate: publishDate, // ISO 8601 format
      },
    };

    return this.graphql(query, variables);
  }

  // ===== COLLECTIONS =====
  async createCollection(collection: any) {
    return this.request('/custom_collections.json', {
      method: 'POST',
      body: JSON.stringify({ custom_collection: collection }),
    });
  }

  async updateCollection(collectionId: string, collection: any) {
    return this.request(`/custom_collections/${collectionId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ custom_collection: collection }),
    });
  }

  async getCollections(limit = 250) {
    // Get both custom and smart collections
    const customCollections = await this.request(`/custom_collections.json?limit=${limit}`);
    const smartCollections = await this.request(`/smart_collections.json?limit=${limit}`);
    
    return {
      custom_collections: customCollections.custom_collections || [],
      smart_collections: smartCollections.smart_collections || [],
    };
  }

  async getAllCollections() {
    // Get collections (max 250 each type - Shopify limit)
    // No pagination needed for most stores
    const limit = 250;

    try {
      // Get custom collections
      const customResponse = await this.request(`/custom_collections.json?limit=${limit}`);
      const allCustom = customResponse.custom_collections || [];

      // Get smart collections
      const smartResponse = await this.request(`/smart_collections.json?limit=${limit}`);
      const allSmart = smartResponse.smart_collections || [];

      console.log(`✅ Fetched ${allCustom.length} custom + ${allSmart.length} smart collections`);

      return {
        custom_collections: allCustom,
        smart_collections: allSmart,
        total: allCustom.length + allSmart.length,
      };
    } catch (error) {
      console.error('❌ Error fetching collections:', error);
      throw error;
    }
  }

  async getCollectionByHandle(handle: string) {
    try {
      // Try custom collections first
      const customResponse = await this.request(`/custom_collections.json?handle=${handle}&limit=1`);
      if (customResponse.custom_collections && customResponse.custom_collections.length > 0) {
        return { ...customResponse.custom_collections[0], type: 'custom' };
      }

      // Try smart collections
      const smartResponse = await this.request(`/smart_collections.json?handle=${handle}&limit=1`);
      if (smartResponse.smart_collections && smartResponse.smart_collections.length > 0) {
        return { ...smartResponse.smart_collections[0], type: 'smart' };
      }

      return null;
    } catch (error) {
      console.error('Error fetching collection by handle:', error);
      return null;
    }
  }

  async getCollectionProducts(collectionId: string, type: 'custom' | 'smart') {
    try {
      // Méthode recommandée par Shopify: utiliser l'endpoint products avec collection_id
      const endpoint = type === 'custom' 
        ? `/collections/${collectionId}/products.json`
        : `/collections/${collectionId}/products.json`;
      
      let allProducts: any[] = [];
      let hasMore = true;
      let pageInfo = '';
      
      // Pagination avec limit=250 (max Shopify)
      while (hasMore) {
        const url = pageInfo 
          ? `${endpoint}?limit=250&page_info=${pageInfo}`
          : `${endpoint}?limit=250`;
        
        const response = await this.request(url);
        const products = response.products || [];
        
        allProducts.push(...products);
        
        // Vérifier s'il y a plus de pages (header Link)
        hasMore = products.length === 250;
        
        if (hasMore && response.products.length > 0) {
          // Extraire page_info du dernier produit si disponible
          // Pour simplifier, on s'arrête à 250 produits par collection
          hasMore = false;
        }
      }
      
      return allProducts;
    } catch (error) {
      console.error(`Error fetching products for collection ${collectionId}:`, error);
      return [];
    }
  }

  async updateProductImage(productId: string, imageId: string, position: number) {
    return this.request(`/products/${productId}/images/${imageId}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        image: {
          id: imageId,
          position: position
        }
      })
    });
  }

  async updateProductHandle(productId: string, handle: string | null) {
    return this.request(`/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        product: {
          id: productId,
          handle: handle
        }
      })
    });
  }

  async deleteProductImage(productId: string, imageId: string) {
    return this.request(`/products/${productId}/images/${imageId}.json`, {
      method: 'DELETE',
    });
  }

  async getProductCollects(productId: string) {
    try {
      const response = await this.request(`/collects.json?product_id=${productId}&limit=250`);
      return response.collects || [];
    } catch (error) {
      console.error(`Error fetching collects for product ${productId}:`, error);
      return [];
    }
  }

  async addProductToCollection(productId: string, collectionId: string) {
    return this.request('/collects.json', {
      method: 'POST',
      body: JSON.stringify({
        collect: {
          product_id: parseInt(productId),
          collection_id: parseInt(collectionId),
        }
      }),
    });
  }

  async removeProductFromCollection(collectId: string) {
    return this.request(`/collects/${collectId}.json`, {
      method: 'DELETE',
    });
  }

  // ===== BLOGS & ARTICLES =====
  async getBlogs() {
    return this.request('/blogs.json');
  }

  async createArticle(blogId: string, article: any) {
    return this.request(`/blogs/${blogId}/articles.json`, {
      method: 'POST',
      body: JSON.stringify({ article }),
    });
  }

  async updateArticle(blogId: string, articleId: string, article: any) {
    return this.request(`/blogs/${blogId}/articles/${articleId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ article }),
    });
  }

  async getArticles(blogId: string, limit = 50) {
    return this.request(`/blogs/${blogId}/articles.json?limit=${limit}`);
  }

  async deleteArticle(blogId: string, articleId: string) {
    return this.request(`/blogs/${blogId}/articles/${articleId}.json`, {
      method: 'DELETE',
    });
  }

  // ===== UTILITY =====
  async testConnection() {
    try {
      await this.request('/shop.json');
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

// Helper function to prepare publish options for articles
export function preparePublishOptions(mode: 'draft' | 'active' | 'scheduled', scheduledDate?: string) {
  if (mode === 'draft') {
    return {
      published: false,
      published_at: null, // null = draft (not published)
    };
  } else if (mode === 'scheduled' && scheduledDate) {
    return {
      published: false, // IMPORTANT: false = hidden until published_at date
      published_at: scheduledDate, // future date = will be published automatically
    };
  } else {
    // active
    return {
      published: true,
      published_at: new Date().toISOString(), // current date = published now
    };
  }
}

// Helper function for products (different from articles)
export function prepareProductPublishOptions(mode: 'draft' | 'active' | 'scheduled', scheduledDate?: string) {
  if (mode === 'draft') {
    return {
      status: 'draft' as const,
      published_at: null,
    };
  } else if (mode === 'scheduled' && scheduledDate) {
    return {
      status: 'active' as const,
      published_at: scheduledDate,
    };
  } else {
    // active
    return {
      status: 'active' as const,
      published_at: new Date().toISOString(),
    };
  }
}

// Helper function for collections
export function prepareCollectionPublishOptions(mode: 'draft' | 'active' | 'scheduled', scheduledDate?: string) {
  // Collections use published_at similar to articles
  if (mode === 'draft') {
    return {
      published_at: null,
    };
  } else if (mode === 'scheduled' && scheduledDate) {
    return {
      published_at: scheduledDate,
    };
  } else {
    return {
      published_at: new Date().toISOString(),
    };
  }
}
