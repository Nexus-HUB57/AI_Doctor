/**
 * Literature Integration Service
 * Integrates PubMed and Google Scholar for RAG expansion
 */

export interface PubMedArticle {
  pubmed_id: string;
  title: string;
  authors: string[];
  abstract: string;
  publication_year: number;
  journal: string;
  doi?: string;
  relevance_score?: number;
  tumor_types?: string[];
  keywords?: string[];
}

export interface ClinicalTrial {
  nct_number: string;
  title: string;
  condition: string;
  intervention: string;
  status: string;
  phase: string;
  enrollment: number;
  start_date: string;
  completion_date?: string;
  sponsor: string;
  url: string;
  relevance_score?: number;
}

export class LiteratureIntegrationService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Search PubMed for oncology-related articles
   */
  async searchPubMed(
    query: string,
    filters?: {
      tumorType?: string;
      minYear?: number;
      maxYear?: number;
      limit?: number;
    }
  ): Promise<PubMedArticle[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/pubmed/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          tumor_type: filters?.tumorType,
          min_year: filters?.minYear,
          max_year: filters?.maxYear,
          limit: filters?.limit || 20
        })
      });

      if (!response.ok) throw new Error('PubMed search failed');
      return response.json();
    } catch (error) {
      console.error('Error searching PubMed:', error);
      return [];
    }
  }

  /**
   * Get article details from PubMed
   */
  async getPubMedArticle(pubmedId: string): Promise<PubMedArticle | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/pubmed/${pubmedId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error fetching PubMed article:', error);
      return null;
    }
  }

  /**
   * Search Google Scholar for articles
   */
  async searchScholar(
    query: string,
    filters?: {
      minYear?: number;
      maxYear?: number;
      limit?: number;
    }
  ): Promise<PubMedArticle[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/scholar/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          min_year: filters?.minYear,
          max_year: filters?.maxYear,
          limit: filters?.limit || 20
        })
      });

      if (!response.ok) throw new Error('Scholar search failed');
      return response.json();
    } catch (error) {
      console.error('Error searching Scholar:', error);
      return [];
    }
  }

  /**
   * Search clinical trials
   */
  async searchClinicalTrials(
    query: string,
    filters?: {
      condition?: string;
      status?: 'Recruiting' | 'Active' | 'Completed' | 'Terminated';
      phase?: string;
      limit?: number;
    }
  ): Promise<ClinicalTrial[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/clinical-trials/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          condition: filters?.condition,
          status: filters?.status,
          phase: filters?.phase,
          limit: filters?.limit || 20
        })
      });

      if (!response.ok) throw new Error('Clinical trials search failed');
      return response.json();
    } catch (error) {
      console.error('Error searching clinical trials:', error);
      return [];
    }
  }

  /**
   * Get clinical trial details
   */
  async getClinicalTrial(nctNumber: string): Promise<ClinicalTrial | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/clinical-trials/${nctNumber}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error fetching clinical trial:', error);
      return null;
    }
  }

  /**
   * Search for relevant literature for a specific patient case
   */
  async searchForPatientCase(
    tumorType: string,
    stage: string,
    mutations?: string[],
    priorTreatments?: string[]
  ): Promise<{
    pubmed_articles: PubMedArticle[];
    clinical_trials: ClinicalTrial[];
    relevant_keywords: string[];
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/patient-case-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tumor_type: tumorType,
          stage,
          mutations,
          prior_treatments: priorTreatments
        })
      });

      if (!response.ok) throw new Error('Patient case search failed');
      return response.json();
    } catch (error) {
      console.error('Error searching for patient case literature:', error);
      return {
        pubmed_articles: [],
        clinical_trials: [],
        relevant_keywords: []
      };
    }
  }

  /**
   * Get literature recommendations for a treatment
   */
  async getLiteratureForTreatment(treatment: string): Promise<PubMedArticle[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/treatment-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ treatment })
      });

      if (!response.ok) throw new Error('Treatment literature search failed');
      return response.json();
    } catch (error) {
      console.error('Error fetching treatment literature:', error);
      return [];
    }
  }

  /**
   * Cache an article for future use
   */
  async cacheArticle(article: PubMedArticle): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/literature/cache`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
    } catch (error) {
      console.error('Error caching article:', error);
    }
  }

  /**
   * Get cached articles
   */
  async getCachedArticles(query: string): Promise<PubMedArticle[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/cache?query=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching cached articles:', error);
      return [];
    }
  }

  /**
   * Get trending topics in oncology
   */
  async getTrendingTopics(): Promise<{
    topic: string;
    article_count: number;
    recent_articles: PubMedArticle[];
  }[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/trending-topics`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  /**
   * Generate literature summary for a topic
   */
  async generateLiteratureSummary(topic: string, limit: number = 10): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/literature/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, limit })
      });

      if (!response.ok) throw new Error('Summary generation failed');
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error generating literature summary:', error);
      return '';
    }
  }
}

export const literatureService = new LiteratureIntegrationService();
