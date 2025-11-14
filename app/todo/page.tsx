"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "1",
      title: "🤖 Automatisation du Ninjalinking",
      description: `**Concept:** Utiliser les moteurs de recherche AI pour automatiser le ninjalinking.

**Fonctionnalités:**
- Utiliser des moteurs AI (Perplexity, ChatGPT Search, Claude, etc.) pour trouver des forums/sites pertinents
- Fournir une adresse email dédiée pour les inscriptions
- Générer un mot de passe générique pour tous les forums
- Inscription automatique sur les forums ciblés
- Rédaction automatique de commentaires contextuels et naturels
- Insertion du lien homepage dans le profil créé
- Gestion multi-comptes avec rotation
- Tracking des liens créés

**Avantages:**
- Backlinks naturels et contextuels
- Présence sur forums de niche
- Automatisation complète du processus
- Scalable (10, 50, 100+ forums)

**Stack Technique:**
- Moteurs AI: Perplexity API, OpenAI, Claude
- Automation: Puppeteer/Playwright pour navigation
- Email: Service email temporaire ou dédié
- Base de données: Tracking des comptes créés`,
      completed: false,
      createdAt: new Date(),
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const addTodo = () => {
    if (!newTitle.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      completed: false,
      createdAt: new Date(),
    };

    setTodos([...todos, newTodo]);
    setNewTitle("");
    setNewDescription("");
    setIsAdding(false);
  };

  const toggleComplete = (id: string) => {
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTodo = (id: string) => {
    if (confirm("🗑️ Supprimer cette tâche ?")) {
      setTodos(todos.filter(t => t.id !== id));
    }
  };

  const startEditing = (todo: TodoItem) => {
    setEditingId(todo.id);
    setNewTitle(todo.title);
    setNewDescription(todo.description);
  };

  const saveEdit = (id: string) => {
    setTodos(todos.map(t => 
      t.id === id 
        ? { ...t, title: newTitle, description: newDescription }
        : t
    ));
    setEditingId(null);
    setNewTitle("");
    setNewDescription("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewTitle("");
    setNewDescription("");
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            📝 To-Do List
          </h1>
          <p className="text-gray-600">
            Gérez vos idées et projets futurs pour EcomFarm
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-blue-600">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Complétées</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-orange-600">{totalCount - completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Square className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter une nouvelle tâche
          </button>
        )}

        {/* Add Form */}
        {isAdding && (
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-300 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Nouvelle Tâche</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Automatisation du Ninjalinking"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Markdown supporté)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Décrivez votre idée en détail..."
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addTodo}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle("");
                    setNewDescription("");
                  }}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-4">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-white rounded-xl p-6 shadow-md border-2 transition-all ${
                todo.completed
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {editingId === todo.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => saveEdit(todo.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleComplete(todo.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-6 h-6 text-green-600" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400 hover:text-blue-600 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3
                        className={`text-xl font-bold mb-3 ${
                          todo.completed
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {todo.title}
                      </h3>
                      <div
                        className={`prose prose-sm max-w-none ${
                          todo.completed ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        {todo.description.split("\n").map((line, i) => {
                          if (line.startsWith("**") && line.endsWith("**")) {
                            return (
                              <p key={i} className="font-bold text-base mb-2 mt-3">
                                {line.replace(/\*\*/g, "")}
                              </p>
                            );
                          }
                          if (line.startsWith("- ")) {
                            return (
                              <li key={i} className="ml-4">
                                {line.substring(2)}
                              </li>
                            );
                          }
                          return line ? <p key={i} className="mb-2">{line}</p> : <br key={i} />;
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(todo)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-md border-2 border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucune tâche
            </h3>
            <p className="text-gray-600">
              Ajoutez votre première tâche pour commencer !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
