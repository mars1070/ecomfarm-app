// Shopify Store Configuration Types

export interface ShopifyStore {
  id: string;
  name: string; // Nom du store (ex: "Grillz Shop", "Fishing Store")
  shopDomain: string; // Ex: "mystore.myshopify.com"
  accessToken: string; // Admin API Access Token
  apiVersion: string; // Ex: "2024-10"
  isActive: boolean;
  createdAt: string;
  lastSync?: string;
}

export interface ShopifyProduct {
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  status: 'active' | 'draft' | 'archived';
  published_at?: string | null; // null = draft, date = scheduled/published
  variants?: Array<{
    price: string;
    compare_at_price?: string;
    sku?: string;
    inventory_quantity?: number;
  }>;
  images?: Array<{
    src: string;
    alt?: string;
  }>;
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface ShopifyCollection {
  title: string;
  body_html?: string;
  sort_order?: 'alpha-asc' | 'alpha-desc' | 'best-selling' | 'created' | 'created-desc' | 'manual' | 'price-asc' | 'price-desc';
  published_at?: string | null; // null = draft, ISO date = published/scheduled
  image?: {
    src: string;
    alt?: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
}

export interface ShopifyArticle {
  title: string;
  author?: string;
  tags?: string; // Comma-separated string
  body_html: string;
  blog_id: number | string; // ID du blog Shopify
  published_at?: string | null; // null = draft, ISO date = published/scheduled
  image?: {
    src?: string;
    alt?: string;
    attachment?: string; // Base64-encoded image
  };
  summary_html?: string;
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    type: string;
  }>;
}

export interface ShopifyBlog {
  id: number;
  handle: string;
  title: string;
}

export type PublishMode = 'draft' | 'active' | 'scheduled';

export interface PublishOptions {
  mode: PublishMode;
  scheduledDate?: string; // ISO date string for scheduled publishing
}
