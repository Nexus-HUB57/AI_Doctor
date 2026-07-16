import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { literatureRouter } from './literature';

function createPubMedSearchResponse(count: number = 2) {
  return {
    ok: true,
    json: async () => ({
      esearchresult: {
        idlist: count > 0 ? ['12345678', '23456789'].slice(0, count) : [],
        count: String(count),
      },
    }),
  };
}

function createPubMedSummaryResponse() {
  return {
    ok: true,
    json: async () => ({
      result: {
        '12345678': {
          title: 'CAR-T Cell Therapy in Solid Tumors: A Review',
          authors: [{ name: 'Smith J' }, { name: 'Doe A' }],
          pubdate: '2024 Mar',
          fulljournalname: 'Nature Medicine',
          elocationid: 'doi: 10.1038/s41591-024-02567-8',
        },
        '23456789': {
          title: 'Immune Checkpoint Inhibitors: Latest Advances',
          authors: [{ name: 'Johnson K' }],
          pubdate: '2024 Jan',
          fulljournalname: 'The Lancet Oncology',
        },
        uids: ['12345678', '23456789'],
      },
    }),
  };
}

function createClinicalTrialsResponse() {
  return {
    ok: true,
    json: async () => ({
      studies: [
        {
          protocolSection: {
            identificationModule: { nctId: 'NCT05551234', briefTitle: 'Pembrolizumab in Melanoma' },
            statusModule: { overallStatus: 'Recruiting', startDateStruct: { date: '2024-01-15' } },
            designModule: { phases: ['Phase 3'] },
            conditionsModule: { conditions: ['Melanoma'] },
            armsInterventionsModule: {
              interventions: [{ type: 'Drug', name: 'Pembrolizumab' }],
            },
            recruitmentModule: { targetEnrollment: '300' },
            contactsLocationsModule: {
              locations: [{ facility: { name: 'Hospital A' } }],
            },
          },
        },
      ],
      totalCount: 1,
    }),
  };
}

describe('Literature Router', () => {
  let caller: ReturnType<typeof literatureRouter.createCaller>;

  beforeEach(() => {
    caller = literatureRouter.createCaller({});
    mockFetch.mockReset();
  });

  describe('pubmed.search', () => {
    it('should search PubMed with valid query', async () => {
      mockFetch
        .mockResolvedValueOnce(createPubMedSearchResponse(2))
        .mockResolvedValueOnce(createPubMedSummaryResponse());

      const result = await caller.pubmed.search({ query: 'CAR-T cell therapy cancer', limit: 10 });
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.total).toBe(2);
      if (result.results.length > 0) {
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('pmid');
        expect(result.results[0]).toHaveProperty('title');
        expect(result.results[0]).toHaveProperty('authors');
      }
    });

    it('should handle empty PubMed results', async () => {
      mockFetch.mockResolvedValueOnce(createPubMedSearchResponse(0));

      const result = await caller.pubmed.search({ query: 'nonexistent_xyz_query_12345' });
      expect(result.results).toHaveLength(0);
    });
  });

  describe('clinicalTrials.search', () => {
    it('should search clinical trials with valid query', async () => {
      mockFetch.mockResolvedValueOnce(createClinicalTrialsResponse());

      const result = await caller.clinicalTrials.search({ query: 'melanoma immunotherapy' });
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.total).toBe(1);
      if (result.results.length > 0) {
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('nctNumber');
        expect(result.results[0]).toHaveProperty('title');
        expect(result.results[0]).toHaveProperty('status');
        expect(result.results[0]).toHaveProperty('phase');
      }
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await caller.clinicalTrials.search({ query: 'test' });
      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('trendingTopics', () => {
    it('should return curated topics', async () => {
      const result = await caller.trendingTopics();
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('lastUpdated');
      expect(Array.isArray(result.topics)).toBe(true);
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.topics[0]).toHaveProperty('topic');
      expect(result.topics[0]).toHaveProperty('category');
      expect(result.topics[0]).toHaveProperty('relevance');
    });
  });

  describe('cache.saveArticle and cache.getArticles', () => {
    it('should save an article and retrieve it', async () => {
      const article = {
        id: 'test_article_1',
        title: 'Test Article on Oncology',
        authors: ['Author A', 'Author B'],
        abstract: 'This is a test abstract.',
        journal: 'Test Journal',
        doi: '10.1234/test.2024',
      };

      const saveResult = await caller.cache.saveArticle(article);
      expect(saveResult.success).toBe(true);
      expect(saveResult.id).toBe('test_article_1');

      const articles = await caller.cache.getArticles();
      expect(Array.isArray(articles)).toBe(true);
      const found = articles.find((a: any) => a.id === 'test_article_1');
      expect(found).toBeDefined();
      expect(found.title).toBe('Test Article on Oncology');
    });

    it('should return articles sorted by most recent', async () => {
      // Save two articles with a slight delay
      await caller.cache.saveArticle({
        id: 'sort_test_1',
        title: 'First Article',
        authors: ['A'],
        abstract: 'Abstract 1',
        journal: 'J1',
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await caller.cache.saveArticle({
        id: 'sort_test_2',
        title: 'Second Article',
        authors: ['B'],
        abstract: 'Abstract 2',
        journal: 'J2',
      });

      const articles = await caller.cache.getArticles();
      // Most recently saved should be first
      const ids = articles.map((a: any) => a.id);
      const firstIdx = ids.indexOf('sort_test_1');
      const secondIdx = ids.indexOf('sort_test_2');
      // sort_test_2 was saved later, should appear earlier in the list
      if (firstIdx !== -1 && secondIdx !== -1) {
        expect(secondIdx).toBeLessThan(firstIdx);
      }
    });
  });
});