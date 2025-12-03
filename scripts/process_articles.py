import re
import sys
import csv
from pathlib import Path

def extract_article_number(header):
    """Extrait le numéro d'article et le mot-clé de l'en-tête"""
    match = re.match(r'ARTICLE\s*(\d+):\s*(.+)', header, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, None

def extract_html_content(text):
    """Extrait le contenu HTML du texte"""
    # Recherche le premier <html> ou <div> ou <p> qui commence le contenu
    html_start = re.search(r'<[a-z][^>]*>', text, re.IGNORECASE)
    if not html_start:
        return ""
    
    html_content = text[html_start.start():]
    return html_content.strip()

def process_file(input_path, output_path):
    """Traite le fichier d'entrée et génère un fichier CSV"""
    with open(input_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Découper le contenu en articles
    articles = re.split(r'(?i)ARTICLE\s*\d+:', content)
    
    # Supprimer les entrées vides
    articles = [a.strip() for a in articles if a.strip()]
    
    results = []
    
    for i, article in enumerate(articles, 1):
        # Pour le premier article, on doit gérer différemment car le split a supprimé le numéro
        if i == 1:
            # On récupère le numéro et le mot-clé du premier article
            first_article_match = re.match(r'^([^\n]+)([\s\S]*)', article)
            if first_article_match:
                keyword = first_article_match.group(1).strip()
                content = first_article_match.group(2).strip()
                html_content = extract_html_content(content)
                results.append({
                    'article_number': i,
                    'keyword': keyword,
                    'html_content': html_content,
                    'serp_analysis': content.replace(html_content, '').strip()
                })
        else:
            # Pour les articles suivants, on a déjà le contenu
            html_content = extract_html_content(article)
            # On prend la première ligne comme mot-clé
            lines = [line.strip() for line in article.split('\n') if line.strip()]
            keyword = lines[0] if lines else f"Article {i}"
            
            results.append({
                'article_number': i,
                'keyword': keyword,
                'html_content': html_content,
                'serp_analysis': '\n'.join(lines[1:]).replace(html_content, '').strip()
            })
    
    # Écrire les résultats dans un fichier CSV
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['Numero_Article', 'Mot_Cle', 'Contenu_HTML', 'Analyse_SERP']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        
        writer.writeheader()
        for article in results:
            writer.writerow({
                'Numero_Article': article['article_number'],
                'Mot_Cle': article['keyword'],
                'Contenu_HTML': article['html_content'],
                'Analyse_SERP': article['serp_analysis']
            })

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Utilisation: python process_articles.py <fichier_entree> <fichier_sortie>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        process_file(input_path, output_path)
        print(f"Traitement terminé avec succès. Résultats enregistrés dans {output_path}")
    except Exception as e:
        print(f"Erreur lors du traitement du fichier: {str(e)}", file=sys.stderr)
        sys.exit(1)
