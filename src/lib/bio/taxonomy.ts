/**
 * @module bio/taxonomy
 * @description Reference-based taxonomic classification for rRNA sequences.
 * Uses a curated set of well-known 16S/18S rRNA reference profiles with
 * characteristic sequence signatures to provide taxonomic assignments.
 *
 * This is a lightweight, offline classifier. For production use, integrate
 * with NCBI BLAST, SILVA, or RDP classifier APIs.
 *
 * Pure TypeScript — no external bioinformatics dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A taxonomic rank assignment. */
export interface TaxonAssignment {
  /** Assigned taxonomic rank. */
  rank: 'domain' | 'phylum' | 'class' | 'order' | 'family' | 'genus' | 'species';
  /** Taxon name at this rank. */
  name: string;
  /** Confidence (0-100). */
  confidence: number;
}

/** Full classification result for a sequence. */
export interface ClassificationReport {
  /** Sequence identifier. */
  sequenceId?: string;
  /** Sequence name. */
  sequenceName: string;
  /** Best-matching rRNA type (16S, 18S, 23S, 5S). */
  rnaType: string;
  /** Full taxonomic lineage from domain to genus/species. */
  lineage: TaxonAssignment[];
  /** Overall classification confidence (0-100). */
  overallConfidence: number;
  /** Human-readable summary. */
  summary: string;
}

// ─── Reference Profiles ───────────────────────────────────────────────────────

/** A reference taxonomic profile with characteristic k-mer signatures. */
interface ReferenceProfile {
  /** Scientific name at genus or species level. */
  name: string;
  /** Full lineage. */
  lineage: { rank: string; name: string }[];
  /** Domain: Bacteria, Archaea, or Eukarya. */
  domain: string;
  /** rRNA type this profile applies to. */
  rnaType: '16S' | '18S';
  /** Characteristic 5-mer signatures (present in this clade). */
  signatureKmers: string[];
  /** Typical GC range for this clade. */
  gcRange: [number, number];
  /** Typical 16S length range. */
  lengthRange: [number, number];
}

/**
 * Curated reference profiles based on well-known rRNA signatures.
 * These represent the most common bacterial/eukaryotic clades encountered
 * in 16S/18S rRNA amplicon studies.
 */
const REFERENCE_PROFILES: ReferenceProfile[] = [
  // -- Proteobacteria --
  {
    name: 'Escherichia',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Pseudomonadota' },
      { rank: 'class', name: 'Gammaproteobacteria' },
      { rank: 'order', name: 'Enterobacterales' },
      { rank: 'family', name: 'Enterobacteriaceae' },
      { rank: 'genus', name: 'Escherichia' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['AGAGTTTG', 'CCTACGGG', 'GAGGAAGG', 'ATGCGGTA', 'TACCGCGG'],
    gcRange: [49, 52],
    lengthRange: [1500, 1550],
  },
  {
    name: 'Pseudomonas',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Pseudomonadota' },
      { rank: 'class', name: 'Gammaproteobacteria' },
      { rank: 'order', name: 'Pseudomonadales' },
      { rank: 'family', name: 'Pseudomonadaceae' },
      { rank: 'genus', name: 'Pseudomonas' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['GGGAGGCAG', 'CCTACGGGA', 'GCGTCCGAT', 'TCGGTGTAG', 'GCTGCCTCC'],
    gcRange: [60, 67],
    lengthRange: [1500, 1560],
  },
  // -- Firmicutes --
  {
    name: 'Bacillus',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Bacillota' },
      { rank: 'class', name: 'Bacilli' },
      { rank: 'order', name: 'Bacillales' },
      { rank: 'family', name: 'Bacillaceae' },
      { rank: 'genus', name: 'Bacillus' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['CCTACGGGA', 'GGGAAAGCG', 'AACTGAGAC', 'GCAACGCGA', 'TTGCGGCGG'],
    gcRange: [42, 48],
    lengthRange: [1500, 1550],
  },
  {
    name: 'Staphylococcus',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Bacillota' },
      { rank: 'class', name: 'Bacilli' },
      { rank: 'order', name: 'Bacillales' },
      { rank: 'family', name: 'Staphylococcaceae' },
      { rank: 'genus', name: 'Staphylococcus' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['CCTACGGGA', 'ATCCTTGTA', 'GCGTTCGTC', 'TACTCCTAC', 'AGTTTGATC'],
    gcRange: [32, 37],
    lengthRange: [1480, 1520],
  },
  {
    name: 'Clostridium',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Bacillota' },
      { rank: 'class', name: 'Clostridia' },
      { rank: 'order', name: 'Eubacteriales' },
      { rank: 'family', name: 'Clostridiaceae' },
      { rank: 'genus', name: 'Clostridium' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['CCTACGGGA', 'GGGTGAAAG', 'AGAGTTTGA', 'TTTCGGTGA', 'CCGTCAATTC'],
    gcRange: [26, 35],
    lengthRange: [1500, 1560],
  },
  // -- Actinomycetota --
  {
    name: 'Streptomyces',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Actinomycetota' },
      { rank: 'class', name: 'Actinomycetia' },
      { rank: 'order', name: 'Streptomycetales' },
      { rank: 'family', name: 'Streptomycetaceae' },
      { rank: 'genus', name: 'Streptomyces' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['CCTACGGGA', 'GGTGAATAC', 'GGTGGTGAA', 'TGGGAAATC', 'CCTTCGGGG'],
    gcRange: [68, 74],
    lengthRange: [1510, 1560],
  },
  // -- Bacteroidota --
  {
    name: 'Bacteroides',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Bacteroidota' },
      { rank: 'class', name: 'Bacteroidia' },
      { rank: 'order', name: 'Bacteroidales' },
      { rank: 'family', name: 'Bacteroidaceae' },
      { rank: 'genus', name: 'Bacteroides' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['CCTACGGGA', 'GGGAAAGCG', 'AGAGTTTGA', 'AAGGAGGTG', 'CCGTCAATTC'],
    gcRange: [40, 48],
    lengthRange: [1500, 1550],
  },
  // -- Cyanobacteria --
  {
    name: 'Synechococcus',
    lineage: [
      { rank: 'domain', name: 'Bacteria' },
      { rank: 'phylum', name: 'Cyanobacteria' },
      { rank: 'class', name: 'Cyanophyceae' },
      { rank: 'order', name: 'Synechococcales' },
      { rank: 'family', name: 'Synechococcaceae' },
      { rank: 'genus', name: 'Synechococcus' },
    ],
    domain: 'Bacteria',
    rnaType: '16S',
    signatureKmers: ['CCTACGGGA', 'GACTACGGG', 'GGGATGAAG', 'TTGCGGCGG', 'TAGCCGATG'],
    gcRange: [53, 60],
    lengthRange: [1480, 1530],
  },
  // -- Archaea --
  {
    name: 'Methanobacterium',
    lineage: [
      { rank: 'domain', name: 'Archaea' },
      { rank: 'phylum', name: 'Euryarchaeota' },
      { rank: 'class', name: 'Methanobacteria' },
      { rank: 'order', name: 'Methanobacteriales' },
      { rank: 'family', name: 'Methanobacteriaceae' },
      { rank: 'genus', name: 'Methanobacterium' },
    ],
    domain: 'Archaea',
    rnaType: '16S',
    signatureKmers: ['AGAGTTTGA', 'TTGGGGTAT', 'CCGTCAATTC', 'GGTGAATAC', 'TCGGTGTAG'],
    gcRange: [30, 40],
    lengthRange: [1450, 1520],
  },
  // -- Eukaryotes (18S) --
  {
    name: 'Saccharomyces',
    lineage: [
      { rank: 'domain', name: 'Eukarya' },
      { rank: 'kingdom', name: 'Fungi' },
      { rank: 'phylum', name: 'Ascomycota' },
      { rank: 'class', name: 'Saccharomycetes' },
      { rank: 'order', name: 'Saccharomycetales' },
      { rank: 'family', name: 'Saccharomycetaceae' },
      { rank: 'genus', name: 'Saccharomyces' },
    ],
    domain: 'Eukarya',
    rnaType: '18S',
    signatureKmers: ['TACCTGGTT', 'CCTGAGAAA', 'GATCCTTCT', 'AAACTGAGA', 'CAGTAGTCA'],
    gcRange: [38, 45],
    lengthRange: [1700, 1850],
  },
  {
    name: 'Homo sapiens',
    lineage: [
      { rank: 'domain', name: 'Eukarya' },
      { rank: 'kingdom', name: 'Metazoa' },
      { rank: 'phylum', name: 'Chordata' },
      { rank: 'class', name: 'Mammalia' },
      { rank: 'order', name: 'Primates' },
      { rank: 'family', name: 'Hominidae' },
      { rank: 'genus', name: 'Homo' },
      { rank: 'species', name: 'H. sapiens' },
    ],
    domain: 'Eukarya',
    rnaType: '18S',
    signatureKmers: ['TACCTGGTT', 'CCTGAGAAA', 'GATCCTTCT', 'CAGTAGTCA', 'TGGTAAACC'],
    gcRange: [48, 55],
    lengthRange: [1850, 1900],
  },
];

// ─── Classification Engine ────────────────────────────────────────────────────

function clean(seq: string): string {
  return seq.replace(/\s/g, '').toUpperCase();
}

/**
 * Count how many of the profile's signature k-mers are present in the sequence.
 */
function countSignatureMatches(seq: string, profile: ReferenceProfile): number {
  let matches = 0;
  for (const kmer of profile.signatureKmers) {
    if (seq.includes(kmer.toUpperCase())) {
      matches++;
    }
  }
  return matches;
}

/**
 * Classify a single rRNA sequence using the reference profiles.
 *
 * Scoring:
 * - K-mer signature match: up to 60 points (proportional to matched/total)
 * - GC content within expected range: up to 15 points
 * - Length within expected range: up to 25 points
 *
 * @param seq - Nucleotide sequence.
 * @param name - Sequence name (for the report).
 * @returns Classification report with lineage and confidence.
 */
export function classifyTaxon(seq: string, name: string = 'unnamed'): ClassificationReport {
  const s = clean(seq);
  if (s.length === 0) {
    return {
      sequenceName: name,
      rnaType: 'Unknown',
      lineage: [],
      overallConfidence: 0,
      summary: 'Cannot classify an empty sequence.',
    };
  }

  // Compute GC content
  let gcCount = 0;
  let atCount = 0;
  for (const ch of s) {
    if (ch === 'G' || ch === 'C') gcCount++;
    else if (ch === 'A' || ch === 'T' || ch === 'U') atCount++;
  }
  const gcPct = (atCount + gcCount) > 0 ? (gcCount / (atCount + gcCount)) * 100 : 0;

  // Score each profile
  let bestProfile: ReferenceProfile | null = null;
  let bestScore = 0;

  for (const profile of REFERENCE_PROFILES) {
    const kmerMatches = countSignatureMatches(s, profile);
    const kmerScore = (kmerMatches / profile.signatureKmers.length) * 60;

    const gcOk = gcPct >= profile.gcRange[0] && gcPct <= profile.gcRange[1];
    const gcScore = gcOk ? 15 : 0;

    const lenOk = s.length >= profile.lengthRange[0] && s.length <= profile.lengthRange[1];
    const lenScore = lenOk ? 25 : 0;

    const total = kmerScore + gcScore + lenScore;

    if (total > bestScore) {
      bestScore = total;
      bestProfile = profile;
    }
  }

  if (!bestProfile || bestScore < 10) {
    return {
      sequenceName: name,
      rnaType: 'Unknown',
      lineage: [],
      overallConfidence: Math.round(bestScore),
      summary: `No confident taxonomic match found (best score: ${Math.round(bestScore)}/100). The sequence may not match any reference profile, may be heavily degraded, or may belong to an unrepresented clade. Consider using BLAST or RDP classifier for deeper analysis.`,
    };
  }

  const lineage: TaxonAssignment[] = bestProfile.lineage.map((l) => ({
    rank: l.rank as TaxonAssignment['rank'],
    name: l.name,
    confidence: Math.round(bestScore * (l.rank === 'domain' ? 1 : l.rank === 'phylum' ? 0.9 : l.rank === 'class' ? 0.8 : l.rank === 'order' ? 0.7 : l.rank === 'family' ? 0.6 : 0.5)),
  }));

  return {
    sequenceName: name,
    rnaType: bestProfile.rnaType,
    lineage,
    overallConfidence: Math.round(bestScore),
    summary: [
      `Best match: ${bestProfile.name} (${bestProfile.domain})`,
      `rRNA type: ${bestProfile.rnaType}`,
      `Confidence: ${Math.round(bestScore)}%`,
      `GC content: ${gcPct.toFixed(1)}% (expected ${bestProfile.gcRange[0]}-${bestProfile.gcRange[1]}%)`,
      `Sequence length: ${s.length} bp`,
      `Lineage: ${bestProfile.lineage.map((l) => l.name).join(' > ')}`,
    ].join('. ') + '.',
  };
}

/**
 * Classify multiple sequences at once.
 *
 * @param sequences - Array of {name, sequence} objects.
 * @returns Array of classification reports.
 */
export function classifyTaxa(
  sequences: { name: string; sequence: string }[]
): ClassificationReport[] {
  return sequences.map((s) => classifyTaxon(s.sequence, s.name));
}
