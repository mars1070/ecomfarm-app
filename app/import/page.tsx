'use client';
import { useState } from 'react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process-article', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erreur lors du traitement du fichier');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors du traitement du fichier');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Importation d'articles</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionnez votre fichier texte (.txt)
          </label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={!file || isProcessing}
          className={`px-4 py-2 rounded-md text-white font-medium
            ${!file || isProcessing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isProcessing ? 'Traitement en cours...' : 'Traiter le fichier'}
        </button>
      </form>

      {downloadUrl && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">Fichier traité avec succès !</p>
          <a
            href={downloadUrl}
            download="articles_export.csv"
            className="mt-2 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Télécharger le fichier CSV
          </a>
        </div>
      )}
    </div>
  );
}
