// ─────────────────────────────────────────────────────────────
// K-mer Frequency Analysis — O(n) sliding window
// ─────────────────────────────────────────────────────────────

export interface KmerEntry {
  kmer: string;
  count: number;
  frequency: number; // 0–1
}

export function computeKmerFrequencies(
  sequence: string,
  k: number = 3
): KmerEntry[] {
  const seq = sequence.toUpperCase();
  if (seq.length < k) return [];

  const counts: Record<string, number> = {};
  let total = 0;

  for (let i = 0; i <= seq.length - k; i++) {
    const kmer = seq.substring(i, i + k);
    if (/^[AUGC]+$/.test(kmer)) {
      counts[kmer] = (counts[kmer] || 0) + 1;
      total++;
    }
  }

  return Object.entries(counts)
    .map(([kmer, count]) => ({
      kmer,
      count,
      frequency: Math.round((count / total) * 10000) / 10000,
    }))
    .sort((a, b) => b.count - a.count);
}

// Diversity indices for sequence analysis
export interface DiversityIndices {
  shannon: number;    // Shannon entropy (bits)
  simpson: number;    // Simpson's diversity index (1-D)
  evenness: number;   // Pielou's evenness (0–1)
  richness: number;   // Number of unique k-mers
}

export function computeDiversityIndices(
  sequence: string,
  k: number = 3
): DiversityIndices {
  const kmers = computeKmerFrequencies(sequence, k);
  if (kmers.length === 0) return { shannon: 0, simpson: 0, evenness: 0, richness: 0 };

  const total = kmers.reduce((sum, e) => sum + e.count, 0);
  const richness = kmers.length;

  // Shannon: H = -sum(pi * ln(pi))
  let shannon = 0;
  for (const kmer of kmers) {
    const pi = kmer.count / total;
    if (pi > 0) shannon -= pi * Math.log2(pi);
  }

  // Simpson: D = sum(pi^2), 1-D = diversity
  let simpsonD = 0;
  for (const kmer of kmers) {
    const pi = kmer.count / total;
    simpsonD += pi * pi;
  }
  const simpson = 1 - simpsonD;

  // Pielou's Evenness: J = H / ln(S)
  const maxShannon = Math.log2(richness);
  const evenness = maxShannon > 0 ? shannon / maxShannon : 0;

  return {
    shannon: Math.round(shannon * 1000) / 1000,
    simpson: Math.round(simpson * 10000) / 10000,
    evenness: Math.round(evenness * 10000) / 10000,
    richness,
  };
}

// Nucleotide composition percentages
export function computeComposition(sequence: string) {
  const seq = sequence.toUpperCase();
  const len = seq.length || 1;
  let A = 0, U = 0, G = 0, C = 0;
  for (const ch of seq) {
    if (ch === 'A') A++;
    else if (ch === 'U') U++;
    else if (ch === 'G') G++;
    else if (ch === 'C') C++;
  }
  return {
    A: Math.round((A / len) * 10000) / 100,
    U: Math.round((U / len) * 10000) / 100,
    G: Math.round((G / len) * 10000) / 100,
    C: Math.round((C / len) * 10000) / 100,
    GC: Math.round(((G + C) / len) * 10000) / 100,
  };
}