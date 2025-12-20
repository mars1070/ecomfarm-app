import { NextRequest, NextResponse } from "next/server";
import { ShopifyClient } from "@/lib/shopify-client";
import type { ShopifyStore } from "@/types/shopify";

// GET - Récupérer tous les menus
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeJson = searchParams.get("store");

    if (!storeJson) {
      return NextResponse.json({ error: "Store non spécifié" }, { status: 400 });
    }

    const store: ShopifyStore = JSON.parse(storeJson);
    const client = new ShopifyClient(store);

    // GraphQL query pour récupérer tous les menus avec leurs items
    const query = `
      query GetMenus {
        menus(first: 50) {
          edges {
            node {
              id
              title
              handle
              isDefault
              items {
                id
                title
                type
                url
                resourceId
                items {
                  id
                  title
                  type
                  url
                  resourceId
                  items {
                    id
                    title
                    type
                    url
                    resourceId
                  }
                }
              }
            }
          }
        }
      }
    `;

    const data = await client.graphql(query);
    const menus = data.menus.edges.map((edge: any) => edge.node);

    return NextResponse.json({ menus });
  } catch (error: any) {
    console.error("Erreur récupération menus:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Créer un nouveau menu
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { store, title, handle, items } = body;

    if (!store || !title || !handle) {
      return NextResponse.json(
        { error: "Store, title et handle requis" },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    const mutation = `
      mutation CreateMenu($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
        menuCreate(title: $title, handle: $handle, items: $items) {
          menu {
            id
            title
            handle
            items {
              id
              title
              type
              url
              items {
                id
                title
                type
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      title,
      handle,
      items: items || [],
    };

    const data = await client.graphql(mutation, variables);

    if (data.menuCreate.userErrors && data.menuCreate.userErrors.length > 0) {
      return NextResponse.json(
        { error: data.menuCreate.userErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ menu: data.menuCreate.menu });
  } catch (error: any) {
    console.error("Erreur création menu:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Mettre à jour un menu existant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { store, menuId, title, handle, items } = body;

    if (!store || !menuId || !title) {
      return NextResponse.json(
        { error: "Store, menuId et title requis" },
        { status: 400 }
      );
    }

    const client = new ShopifyClient(store);

    const mutation = `
      mutation UpdateMenu($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
        menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
          menu {
            id
            title
            handle
            items {
              id
              title
              type
              url
              items {
                id
                title
                type
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      id: menuId,
      title,
      handle,
      items: items || [],
    };

    const data = await client.graphql(mutation, variables);

    if (data.menuUpdate.userErrors && data.menuUpdate.userErrors.length > 0) {
      return NextResponse.json(
        { error: data.menuUpdate.userErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ menu: data.menuUpdate.menu });
  } catch (error: any) {
    console.error("Erreur mise à jour menu:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un menu
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeJson = searchParams.get("store");
    const menuId = searchParams.get("menuId");

    if (!storeJson || !menuId) {
      return NextResponse.json(
        { error: "Store et menuId requis" },
        { status: 400 }
      );
    }

    const store: ShopifyStore = JSON.parse(storeJson);
    const client = new ShopifyClient(store);

    const mutation = `
      mutation DeleteMenu($id: ID!) {
        menuDelete(id: $id) {
          deletedMenuId
          userErrors {
            field
            message
          }
        }
      }
    `;

    const data = await client.graphql(mutation, { id: menuId });

    if (data.menuDelete.userErrors && data.menuDelete.userErrors.length > 0) {
      return NextResponse.json(
        { error: data.menuDelete.userErrors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, deletedMenuId: data.menuDelete.deletedMenuId });
  } catch (error: any) {
    console.error("Erreur suppression menu:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
