"use client";

import { BookOpen } from "lucide-react";

export default function Blog() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Articles de Blog</h1>
          <p className="mt-2 text-gray-600">
            Rédigez des articles de blog optimisés SEO avec l'IA
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Bientôt disponible
          </h3>
          <p className="text-gray-600">
            Cette fonctionnalité sera disponible prochainement.
          </p>
        </div>
      </div>
    </div>
  );
}
