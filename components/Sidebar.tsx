"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ShoppingBag, BookOpen, Settings, DollarSign, Info, CheckSquare, Store, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Rédaction prête", title: true },
  { name: "Fiches Produits", href: "/fiches-produits", icon: ShoppingBag },
  { name: "Collections", href: "/collections", icon: FileText },
  { name: "Articles de Blog", href: "/blog", icon: BookOpen },
];

const bottomNavigation = [
  { name: "Gestion", title: true },
  { name: "🏪 Mes Stores Shopify", href: "/shopify-stores", icon: Store },
  { name: "Planification", href: "/planification", icon: Calendar },
  { name: "Outils", title: true },
  { name: "📝 To-Do List", href: "/todo", icon: CheckSquare },
  { name: "📤 TXT vers CSV", href: "/import", icon: FileText },
  { name: "📚 Guide Complet", href: "/info", icon: Info },
  { name: "💰 Tarification", href: "/tarification", icon: DollarSign },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">EcomFarm</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          if (item.title) {
            return (
              <div key={item.name} className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {item.name}
              </div>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon && <item.icon className="w-5 h-5 mr-3" />}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation (To-Do, Guide, Tarification) */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        {bottomNavigation.map((item) => {
          if (item.title) {
            return (
              <div key={item.name} className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {item.name}
              </div>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href!}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon && <item.icon className="w-5 h-5 mr-3" />}
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <div className="px-3 py-4 border-t border-gray-200">
        <Link
          href="/parametres"
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            pathname === "/parametres"
              ? "bg-primary/10 text-primary"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Settings className="w-5 h-5 mr-3" />
          Paramètres
        </Link>
      </div>
    </div>
  );
}
