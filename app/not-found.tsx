"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            404
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Oups ! Page introuvable
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <p className="text-sm text-gray-500">
            Vérifiez l'URL ou retournez à l'accueil pour continuer votre navigation.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Retour à l'accueil
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Page précédente
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-12 p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Search className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-900">Pages populaires</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/fiches-produits"
              className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-all text-left"
            >
              <p className="font-semibold text-blue-900">📝 Fiches Produits</p>
              <p className="text-xs text-blue-700">Générer des descriptions</p>
            </Link>
            <Link
              href="/collections"
              className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-all text-left"
            >
              <p className="font-semibold text-purple-900">📂 Collections</p>
              <p className="text-xs text-purple-700">Créer du contenu SEO</p>
            </Link>
            <Link
              href="/blog"
              className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:border-green-400 transition-all text-left"
            >
              <p className="font-semibold text-green-900">📰 Articles de Blog</p>
              <p className="text-xs text-green-700">Rédiger des articles</p>
            </Link>
            <Link
              href="/planification"
              className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg hover:border-orange-400 transition-all text-left"
            >
              <p className="font-semibold text-orange-900">📅 Planification</p>
              <p className="text-xs text-orange-700">Planifier vos publications</p>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-500">
          Besoin d'aide ? Consultez le{" "}
          <Link href="/info" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
            Guide Complet
          </Link>
        </p>
      </div>
    </div>
  );
}
