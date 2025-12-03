// Intelligent Cross-Group Linking Strategy

export interface Article {
  keyword: string;
  blogHandle: string;
  groupId: string;
}

export interface ArticleGroup {
  id: string;
  name: string;
  blogHandle: string;
  articles: Article[];
}

export interface LinkingPlan {
  articleIndex: number;
  keyword: string;
  blogHandle: string;
  links: {
    previous: { keyword: string; blogHandle: string; type: 'sequential' } | { type: 'homepage' } | null;
    next: { keyword: string; blogHandle: string; type: 'sequential' } | null;
    crossGroup: { keyword: string; blogHandle: string; type: 'cross-group' } | null;
  };
}

/**
 * Calculate intelligent cross-group linking
 * Strategy: Distribute cross-group links evenly across all articles
 */
export function calculateCrossGroupLinks(groups: ArticleGroup[]): LinkingPlan[] {
  if (groups.length === 0) return [];
  
  const allArticles = groups.flatMap((g, groupIndex) => 
    g.articles.map((a, articleIndex) => ({
      ...a,
      globalIndex: groups.slice(0, groupIndex).reduce((sum, grp) => sum + grp.articles.length, 0) + articleIndex,
      groupIndex,
    }))
  );

  const linkingPlan: LinkingPlan[] = [];

  allArticles.forEach((article, i) => {
    // Find articles in the SAME group
    const currentGroup = groups.find(g => g.id === article.groupId);
    const groupArticles = allArticles.filter(a => a.groupId === article.groupId);
    const indexInGroup = groupArticles.findIndex(a => a.keyword === article.keyword);
    
    // Previous link logic
    let previous: any = null;
    if (indexInGroup === 0) {
      // FIRST article in group → Link to HOMEPAGE
      previous = { type: 'homepage' as const };
    } else {
      // Other articles → Link to previous in group
      const prevArticle = groupArticles[indexInGroup - 1];
      previous = {
        keyword: prevArticle.keyword,
        blogHandle: prevArticle.blogHandle,
        type: 'sequential' as const,
      };
    }
    
    // Next link logic
    let next: any = null;
    if (indexInGroup === groupArticles.length - 1) {
      // LAST article in group → Loop back to FIRST article in group
      const firstArticle = groupArticles[0];
      next = {
        keyword: firstArticle.keyword,
        blogHandle: firstArticle.blogHandle,
        type: 'sequential' as const,
      };
    } else {
      // Other articles → Link to next in group
      const nextArticle = groupArticles[indexInGroup + 1];
      next = {
        keyword: nextArticle.keyword,
        blogHandle: nextArticle.blogHandle,
        type: 'sequential' as const,
      };
    }

    // Cross-group link logic
    let crossGroup = null;
    
    if (groups.length > 1) {
      // Find articles from OTHER groups
      const otherGroupArticles = allArticles.filter(a => a.groupId !== article.groupId);
      
      if (otherGroupArticles.length > 0) {
        // Strategy: Round-robin distribution
        // Each article gets a link to a different group article
        const crossGroupIndex = i % otherGroupArticles.length;
        const targetArticle = otherGroupArticles[crossGroupIndex];
        
        crossGroup = {
          keyword: targetArticle.keyword,
          blogHandle: targetArticle.blogHandle,
          type: 'cross-group' as const,
        };
      }
    }

    linkingPlan.push({
      articleIndex: i,
      keyword: article.keyword,
      blogHandle: article.blogHandle,
      links: {
        previous,
        next,
        crossGroup,
      },
    });
  });

  return linkingPlan;
}

/**
 * Generate visual representation of linking structure
 */
export function generateLinkingVisualization(groups: ArticleGroup[]): string {
  const plan = calculateCrossGroupLinks(groups);
  let output = '';

  output += '╔════════════════════════════════════════════════════════════════╗\n';
  output += '║           SCHÉMA DE MAILLAGE INTERNE - ARTICLES               ║\n';
  output += '╚════════════════════════════════════════════════════════════════╝\n\n';

  groups.forEach((group, groupIndex) => {
    output += `📁 GROUPE ${groupIndex + 1}: ${group.blogHandle} (${group.articles.length} articles)\n`;
    output += '─'.repeat(60) + '\n';

    group.articles.forEach((article, articleIndex) => {
      const globalIndex = groups.slice(0, groupIndex).reduce((sum, g) => sum + g.articles.length, 0) + articleIndex;
      const articlePlan = plan[globalIndex];

      output += `\n${globalIndex + 1}. ${article.keyword}\n`;
      output += `   Blog: /blogs/${article.blogHandle}/...\n`;
      
      // Sequential links
      if (articlePlan.links.previous) {
        if (articlePlan.links.previous.type === 'homepage') {
          output += `   ← Lien précédent: 🏠 PAGE D'ACCUEIL\n`;
          output += `      (/) ⭐ HOMEPAGE\n`;
        } else {
          output += `   ← Lien précédent: "${articlePlan.links.previous.keyword}"\n`;
          output += `      (/blogs/${articlePlan.links.previous.blogHandle}/...)\n`;
        }
      }
      
      if (articlePlan.links.next) {
        output += `   → Lien suivant: "${articlePlan.links.next.keyword}"\n`;
        output += `      (/blogs/${articlePlan.links.next.blogHandle}/...)\n`;
      }
      
      // Cross-group link
      if (articlePlan.links.crossGroup) {
        output += `   🔗 Lien cross-group: "${articlePlan.links.crossGroup.keyword}"\n`;
        output += `      (/blogs/${articlePlan.links.crossGroup.blogHandle}/...) ⭐\n`;
      }
    });

    output += '\n';
  });

  // Summary
  const totalArticles = plan.length;
  const totalLinks = plan.reduce((sum, p) => {
    let count = 0;
    if (p.links.previous) count++;
    if (p.links.next) count++;
    if (p.links.crossGroup) count++;
    return sum + count;
  }, 0);
  const crossGroupLinks = plan.filter(p => p.links.crossGroup !== null).length;

  output += '\n╔════════════════════════════════════════════════════════════════╗\n';
  output += '║                         STATISTIQUES                           ║\n';
  output += '╚════════════════════════════════════════════════════════════════╝\n';
  output += `📊 Total articles: ${totalArticles}\n`;
  output += `🔗 Total liens: ${totalLinks}\n`;
  output += `⭐ Liens cross-group: ${crossGroupLinks}\n`;
  output += `📈 Moyenne liens/article: ${(totalLinks / totalArticles).toFixed(1)}\n`;
  output += `🌐 Groupes: ${groups.length}\n`;

  return output;
}
