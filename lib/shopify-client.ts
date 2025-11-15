// Shopify API Client Utility

import type { ShopifyStore } from '@/types/shopify';

export class ShopifyClient {
  private store: ShopifyStore;
  private baseUrl: string;

  constructor(store: ShopifyStore) {
    this.store = store;
    this.baseUrl = `https://${store.shopDomain}/admin/api/${store.apiVersion}`;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
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
  private async graphql(query: string, variables: any = {}) {
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

  async getProducts(limit = 50) {
    return this.request(`/products.json?limit=${limit}`);
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

  async getCollections(limit = 50) {
    return this.request(`/custom_collections.json?limit=${limit}`);
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
      published_at: null, // null = draft (not published)
    };
  } else if (mode === 'scheduled' && scheduledDate) {
    return {
      published_at: scheduledDate, // future date = scheduled
    };
  } else {
    // active
    return {
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
