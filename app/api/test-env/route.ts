import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    shopify_api_key: process.env.SHOPIFY_API_KEY ? '✅ Défini' : '❌ Manquant',
    shopify_api_secret: process.env.SHOPIFY_API_SECRET ? '✅ Défini' : '❌ Manquant',
    app_url: process.env.NEXT_PUBLIC_APP_URL || '❌ Manquant',
    node_env: process.env.NODE_ENV,
  });
}
