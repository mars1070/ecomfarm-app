"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Package, BookOpen, Settings, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Fiches Produits", href: "/fiches-produits", icon: Package },
  { name: "Collections", href: "/collections", icon: FileText },
  { name: "Articles de Blog", href: "/blog", icon: BookOpen },
  { name: "Tarification", href: "/tarification", icon: DollarSign },
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
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

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
