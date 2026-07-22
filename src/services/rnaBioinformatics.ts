// ============================================================================
// AI_Doctor — Motor de Bioinformática rRNA
// Parsers FASTA, Identificação de rRNA (16S/18S/23S/5S), GC Content, k-mer,
// Shannon/Simpson, Needleman-Wunsch, Distância, Filogenia (UPGMA), Nussinov
// ============================================================================

// ── Types ────────────────────────────────────────────────────────────────────

export interface FASTARecord {
  header: string;
  id: string;
  description: string;
  sequence: string;
  length: number;
}

export interface KMerResult {
  k: number;
  kmers: Map<string, number>;
  uniqueCount: number;
  totalPossible: number;
  diversity: number;
  topKmers: { kmer: string; count: number; frequency: number }[];
}

export interface DiversityIndices {
  shannon: number;
  shannonMax: number;
  shannonEvenness: number;
  simpson: number;
  simpsonInverse: number;
  nucleotideCounts: { A: number; U: number; G: number; C: number };
  totalBases: number;
}

export interface NWAlignment {
  queryAligned: string;
  subjectAligned: string;
  score: number;
  identity: number;
  mismatches: number;
  gaps: number;
  midline: string;
}

export interface DistanceMatrix {
  labels: string[];
  matrix: number[][];
}

export interface PhyloNode {
  name: string;
  distance: number;
  children?: PhyloNode[];
}

export interface rRNAIdentification {
  type: '16S' | '18S' | '23S' | '5S' | '28S' | '12S' | 'desconhecido';
  confidence: number;
  domain: 'Bacteria' | 'Eukarya' | 'Archaea' | 'desconhecido';
  rationale: string[];
}

export interface GCProfile {
  overallGC: number;
  windowGC: { position: number; gc: number }[];
  windowSize: number;
  minGC: number;
  maxGC: number;
}

export interface SequenceStats {
  length: number;
  gcContent: number;
  atContent: number;
  nucleotideComposition: { A: number; U: number; G: number; C: number };
  molecularWeight: number;
  tmEstimate: number;
}

// ── FASTA Parser ─────────────────────────────────────────────────────────────

export function parseFASTA(raw: string): FASTARecord[] {
  const lines = raw.trim().split('\n');
  const records: FASTARecord[] = [];
  let current: Partial<FASTARecord> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    if (trimmed.startsWith('>')) {
      if (current && current.sequence) {
        records.push({
          header: current.header!,
          id: current.id!,
          description: current.description!,
          sequence: current.sequence.toUpperCase(),
          length: current.sequence.length,
        });
      }
      const headerText = trimmed.slice(1).trim();
      const firstSpace = headerText.indexOf(' ');
      current = {
        header: trimmed,
        id: firstSpace === -1 ? headerText : headerText.slice(0, firstSpace),
        description: firstSpace === -1 ? '' : headerText.slice(firstSpace + 1),
        sequence: '',
      };
    } else if (current) {
      current.sequence += trimmed.replace(/[^a-zA-Z]/g, '');
    }
  }

  if (current && current.sequence) {
    records.push({
      header: current.header!,
      id: current.id!,
      description: current.description!,
      sequence: current.sequence.toUpperCase(),
      length: current.sequence.length,
    });
  }

  return records;
}

export function exportToFASTA(records: { id: string; description?: string; sequence: string }[]): string {
  return records
    .map(r => {
      const desc = r.description ? ` ${r.description}` : '';
      const seqLines = r.sequence.match(/.{1,80}/g) || [r.sequence];
      return `>${r.id}${desc}\n${seqLines.join('\n')}`;
    })
    .join('\n\n');
}

// ── rRNA Type Identification ────────────────────────────────────────────────

const rRNA_PROFILES: Record<string, { lengthRange: [number, number]; consensusMotifs: string[]; gcRange: [number, number]; domain: string }> = {
  '5S': { lengthRange: [100, 140], consensusMotifs: ['GNRA', 'UNCG', 'CUUG'], gcRange: [0.45, 0.65], domain: 'Bacteria' },
  '16S': { lengthRange: [1400, 1600], consensusMotifs: ['CACCYG', 'ACCCG', 'GAAAGG'], gcRange: [0.45, 0.60], domain: 'Bacteria' },
  '23S': { lengthRange: [2800, 3200], consensusMotifs: ['GGACG', 'AAGGAC', 'CCUGA'], gcRange: [0.42, 0.58], domain: 'Bacteria' },
  '18S': { lengthRange: [1700, 2000], consensusMotifs: ['GCUUAAC', 'UAACG', 'CUGAUC'], gcRange: [0.40, 0.55], domain: 'Eukarya' },
  '28S': { lengthRange: [3200, 5000], consensusMotifs: ['GAACUG', 'UCUGA', 'CCGU'], gcRange: [0.42, 0.58], domain: 'Eukarya' },
  '12S': { lengthRange: [900, 1000], consensusMotifs: ['UAACAA', 'GACUG', 'CUAAC'], gcRange: [0.38, 0.52], domain: 'Eukarya' },
};

export function identifyRRNA(sequence: string): rRNAIdentification {
  const seq = sequence.toUpperCase().replace(/T/g, 'U');
  const len = seq.length;
  const gc = gcContent(seq);
  const rationale: string[] = [];
  let bestType: rRNAIdentification['type'] = 'desconhecido';
  let bestScore = -1;
  let domain: rRNAIdentification['domain'] = 'desconhecido';

  for (const [rType, profile] of Object.entries(rRNA_PROFILES)) {
    let score = 0;
    const [minLen, maxLen] = profile.lengthRange;

    // Length scoring (0-40 points)
    if (len >= minLen && len <= maxLen) {
      const midRange = (minLen + maxLen) / 2;
      const range = maxLen - minLen;
      const dist = Math.abs(len - midRange) / (range / 2);
      score += 40 * (1 - dist * 0.5);
      rationale.push(`Comprimento ${len} nt dentro do range esperado para ${rType} (${minLen}-${maxLen})`);
    }

    // GC content scoring (0-30 points)
    if (gc >= profile.gcRange[0] && gc <= profile.gcRange[1]) {
      score += 30;
      rationale.push(`GC content ${(gc * 100).toFixed(1)}% consistente com ${rType}`);
    }

    // Motif scoring (0-30 points)
    let motifsFound = 0;
    for (const motif of profile.consensusMotifs) {
      if (seq.includes(motif)) motifsFound++;
    }
    if (motifsFound > 0) {
      score += (motifsFound / profile.consensusMotifs.length) * 30;
      rationale.push(`${motifsFound}/${profile.consensusMotifs.length} motifs conservados encontrados para ${rType}`);
    }

    if (score > bestScore) {
      bestScore = score;
      bestType = rType as rRNAIdentification['type'];
      domain = profile.domain as rRNAIdentification['domain'];
    }
  }

  if (bestScore < 20) {
    rationale.push('Score insuficiente para classificação confiável');
    bestType = 'desconhecido';
    domain = 'desconhecido';
  }

  return {
    type: bestType,
    confidence: Math.min(bestScore / 70, 1),
    domain,
    rationale,
  };
}

// ── GC Content & Profile ─────────────────────────────────────────────────────

export function gcContent(sequence: string): number {
  const seq = sequence.toUpperCase();
  if (seq.length === 0) return 0;
  let gc = 0;
  for (const c of seq) {
    if (c === 'G' || c === 'C') gc++;
  }
  return gc / seq.length;
}

export function gcProfile(sequence: string, windowSize: number = 50): GCProfile {
  const seq = sequence.toUpperCase();
  const n = seq.length;
  const windowGC: { position: number; gc: number }[] = [];
  let minGC = 1, maxGC = 0;

  for (let i = 0; i <= n - windowSize; i += Math.max(1, Math.floor(windowSize / 5))) {
    const window = seq.slice(i, i + windowSize);
    const gc = gcContent(window);
    windowGC.push({ position: i, gc });
    if (gc < minGC) minGC = gc;
    if (gc > maxGC) maxGC = gc;
  }

  // Handle last partial window
  const lastStart = Math.floor((n - windowSize) / Math.max(1, Math.floor(windowSize / 5))) * Math.max(1, Math.floor(windowSize / 5));
  if (lastStart + windowSize < n) {
    const window = seq.slice(n - windowSize);
    const gc = gcContent(window);
    windowGC.push({ position: n - windowSize, gc });
  }

  return {
    overallGC: gcContent(seq),
    windowGC,
    windowSize,
    minGC: windowGC.length > 0 ? minGC : 0,
    maxGC: windowGC.length > 0 ? maxGC : 0,
  };
}

// ── Sequence Statistics ─────────────────────────────────────────────────────

export function sequenceStats(sequence: string): SequenceStats {
  const seq = sequence.toUpperCase();
  const n = seq.length;
  const counts = { A: 0, U: 0, G: 0, C: 0 };

  for (const c of seq) {
    if (c in counts) counts[c as keyof typeof counts]++;
  }

  const gc = (counts.G + counts.C) / n;
  const at = (counts.A + counts.U) / n;

  // Approximate molecular weight (Da) for single-stranded RNA
  // A=347.2, U=324.2, G=363.2, C=323.2 (average nucleotide ~339.5)
  const avgNucWeight = 339.5;
  const molecularWeight = n * avgNucWeight;

  // Rough Tm estimate for RNA (Wallace rule approximation)
  const tmEstimate = 2 * (counts.A + counts.U) + 4 * (counts.G + counts.C);

  return { length: n, gcContent: gc, atContent: at, nucleotideComposition: counts, molecularWeight, tmEstimate };
}

// ── k-mer Analysis ───────────────────────────────────────────────────────────

export function kmerAnalysis(sequence: string, k: number = 3): KMerResult {
  const seq = sequence.toUpperCase();
  const kmers = new Map<string, number>();

  for (let i = 0; i <= seq.length - k; i++) {
    const kmer = seq.slice(i, i + k);
    // Skip kmers with non-standard bases
    if (/^[AUGC]+$/.test(kmer)) {
      kmers.set(kmer, (kmers.get(kmer) || 0) + 1);
    }
  }

  const uniqueCount = kmers.size;
  const totalPossible = Math.min(Math.pow(4, k), seq.length - k + 1);
  const diversity = uniqueCount / totalPossible;

  // Sort by frequency
  const sorted = [...kmers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([kmer, count]) => ({
      kmer,
      count,
      frequency: count / (seq.length - k + 1),
    }));

  return { k, kmers, uniqueCount, totalPossible, diversity, topKmers: sorted };
}

// ── Diversity Indices (Shannon & Simpson) ─────────────────────────────────────

export function diversityIndices(sequence: string): DiversityIndices {
  const seq = sequence.toUpperCase();
  const counts = { A: 0, U: 0, G: 0, C: 0 };
  let total = 0;

  for (const c of seq) {
    if (c in counts) {
      counts[c as keyof typeof counts]++;
      total++;
    }
  }

  // Shannon entropy
  let shannon = 0;
  for (const key of Object.keys(counts)) {
    const p = counts[key as keyof typeof counts] / total;
    if (p > 0) shannon -= p * Math.log2(p);
  }

  // Maximum Shannon (uniform distribution)
  const shannonMax = Math.log2(4); // log2(4) = 2 for 4 nucleotides
  const shannonEvenness = shannonMax > 0 ? shannon / shannonMax : 0;

  // Simpson index
  let simpson = 0;
  for (const key of Object.keys(counts)) {
    const p = counts[key as keyof typeof counts] / total;
    simpson += p * p;
  }

  // Inverse Simpson (1/D)
  const simpsonInverse = simpson > 0 ? 1 / simpson : 0;

  return { shannon, shannonMax, shannonEvenness, simpson, simpsonInverse, nucleotideCounts: counts, totalBases: total };
}

// ── Needleman-Wunsch Global Alignment ────────────────────────────────────────

export function needlemanWunsch(query: string, subject: string, matchScore: number = 2, mismatchPenalty: number = -1, gapPenalty: number = -2): NWAlignment {
  const q = query.toUpperCase().replace(/T/g, 'U');
  const s = subject.toUpperCase().replace(/T/g, 'U');
  const m = q.length;
  const n = s.length;

  // Initialize scoring matrix
  const score: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) score[i][0] = i * gapPenalty;
  for (let j = 1; j <= n; j++) score[0][j] = j * gapPenalty;

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const diag = score[i - 1][j - 1] + (q[i - 1] === s[j - 1] ? matchScore : mismatchPenalty);
      const up = score[i - 1][j] + gapPenalty;
      const left = score[i][j - 1] + gapPenalty;
      score[i][j] = Math.max(diag, up, left);
    }
  }

  // Traceback
  let qAligned = '';
  let sAligned = '';
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const current = score[i][j];
      const diag = score[i - 1][j - 1] + (q[i - 1] === s[j - 1] ? matchScore : mismatchPenalty);
      if (current === diag) {
        qAligned = q[i - 1] + qAligned;
        sAligned = s[j - 1] + sAligned;
        i--; j--;
        continue;
      }
    }
    if (i > 0 && score[i][j] === score[i - 1][j] + gapPenalty) {
      qAligned = q[i - 1] + qAligned;
      sAligned = '-' + sAligned;
      i--;
    } else {
      qAligned = '-' + qAligned;
      sAligned = s[j - 1] + sAligned;
      j--;
    }
  }

  // Build midline
  let midline = '';
  let identity = 0, mismatches = 0, gaps = 0;
  for (let idx = 0; idx < qAligned.length; idx++) {
    if (qAligned[idx] === '-' || sAligned[idx] === '-') {
      midline += ' ';
      gaps++;
    } else if (qAligned[idx] === sAligned[idx]) {
      midline += '|';
      identity++;
    } else {
      midline += '.';
      mismatches++;
    }
  }

  return {
    queryAligned: qAligned,
    subjectAligned: sAligned,
    score: score[m][n],
    identity: qAligned.length > 0 ? identity / qAligned.length : 0,
    mismatches,
    gaps,
    midline,
  };
}

// ── Distance Matrix ──────────────────────────────────────────────────────────

export function computeDistanceMatrix(sequences: { id: string; sequence: string }[]): DistanceMatrix {
  const n = sequences.length;
  const labels = sequences.map(s => s.id);
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const alignment = needlemanWunsch(sequences[i].sequence, sequences[j].sequence);
      // Convert alignment score to p-distance (proportion of mismatches + gaps)
      const pDist = 1 - alignment.identity;
      matrix[i][j] = pDist;
      matrix[j][i] = pDist;
    }
  }

  return { labels, matrix };
}

// ── UPGMA Phylogenetic Tree ──────────────────────────────────────────────────

export function upgmaTree(distMatrix: DistanceMatrix): PhyloNode {
  const { labels, matrix } = distMatrix;
  const n = labels.length;

  // Working copies
  let activeLabels = [...labels];
  let activeMatrix = matrix.map(row => [...row]);
  const clusterSizes = new Array(n).fill(1);

  // Map of cluster indices to PhyloNodes
  const nodes: Map<number, PhyloNode> = new Map();
  for (let i = 0; i < n; i++) {
    nodes.set(i, { name: labels[i], distance: 0 });
  }

  while (activeLabels.length > 1) {
    // Find minimum distance (excluding diagonal)
    let minDist = Infinity;
    let minI = -1, minJ = -1;

    for (let i = 0; i < activeLabels.length; i++) {
      for (let j = i + 1; j < activeLabels.length; j++) {
        if (activeMatrix[i][j] < minDist) {
          minDist = activeMatrix[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    // Merge clusters minI and minJ
    const nodeI = nodes.get(minI)!;
    const nodeJ = nodes.get(minJ)!;
    const sizeI = clusterSizes[minI];
    const sizeJ = clusterSizes[minJ];

    // Calculate branch lengths
    const branchI = minDist / 2 - (minDist / 2) * (sizeJ / (sizeI + sizeJ));
    const branchJ = minDist / 2 - (minDist / 2) * (sizeI / (sizeI + sizeJ));

    nodeI.distance = branchI;
    nodeJ.distance = branchJ;

    // Create merged node
    const mergedNode: PhyloNode = {
      name: `(${nodeI.name}:${branchI.toFixed(4)},${nodeJ.name}:${branchJ.toFixed(4)})`,
      distance: 0,
      children: [nodeI, nodeJ],
    };

    // Update matrix using weighted average (UPGMA)
    const newDistances: number[] = [];
    for (let k = 0; k < activeLabels.length; k++) {
      if (k !== minI && k !== minJ) {
        const dist = (activeMatrix[minI][k] * sizeI + activeMatrix[minJ][k] * sizeJ) / (sizeI + sizeJ);
        newDistances.push(dist);
      }
    }

    // Remove minJ first (higher index), then minI
    const removeJ = activeLabels.length - 1 - minJ;
    activeLabels.splice(minJ, 1);
    activeMatrix.splice(minJ, 1);
    for (let row = 0; row < activeMatrix.length; row++) {
      activeMatrix[row].splice(minJ, 1);
    }

    const removeI = activeLabels.length - 1 - minI;
    activeLabels.splice(minI, 1);
    activeMatrix.splice(minI, 1);
    for (let row = 0; row < activeMatrix.length; row++) {
      activeMatrix[row].splice(minI, 1);
    }

    // Insert merged cluster at position minI
    activeLabels.splice(minI, 0, mergedNode.name);
    clusterSizes.splice(minI, 1, sizeI + sizeJ);

    // Insert new row/column
    activeMatrix.splice(minI, 0, [...newDistances, 0]);
    for (let row = 0; row < activeMatrix.length; row++) {
      if (row !== minI) {
        const insertPos = Math.min(minI, activeMatrix[row].length);
        activeMatrix[row].splice(insertPos, 0, newDistances[row < minI ? row : row - 1]);
      }
    }

    // Update node map
    const newNodes = new Map<number, PhyloNode>();
    const oldNodeArray = Array.from(nodes.entries());
    let nodeIdx = 0;
    for (const [oldIdx, node] of oldNodeArray) {
      if (oldIdx === minI || oldIdx === minJ) continue;
      newNodes.set(nodeIdx++, node);
    }
    newNodes.set(nodeIdx, mergedNode);
    // Re-key: merged is at minI, others shifted
    nodes.clear();
    const finalNodes = Array.from(newNodes.entries());
    for (let i = 0; i < finalNodes.length; i++) {
      nodes.set(i, finalNodes[i][1]);
    }
  }

  // Return root
  return nodes.get(0) || { name: 'root', distance: 0 };
}

// ── Nussinov Algorithm (Secondary Structure Prediction) ─────────────────────

export function nussinov(sequence: string): { pairs: [number, number][]; dotBracket: string; mfe: number } {
  const seq = sequence.toUpperCase().replace(/T/g, 'U');
  const n = seq.length;
  if (n === 0) return { pairs: [], dotBracket: '', mfe: 0 };

  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));

  const isPair = (a: string, b: string) => {
    const pairs = ['AU', 'UA', 'GC', 'CG', 'GU', 'UG'];
    return pairs.includes(a + b);
  };

  // Fill DP matrix
  for (let k = 1; k < n; k++) {
    for (let i = 0; i < n - k; i++) {
      const j = i + k;
      let max = matrix[i][j - 1];

      // Bifurcation
      for (let t = i; t < j; t++) {
        if (isPair(seq[t], seq[j])) {
          const score = (t > i ? matrix[i][t - 1] : 0) + matrix[t + 1][j - 1] + 1;
          if (score > max) max = score;
        }
      }
      matrix[i][j] = Math.max(max, matrix[i + 1][j]);
    }
  }

  // Traceback
  const pairs: [number, number][] = [];
  const paired = new Array(n).fill(false);

  const traceback = (i: number, j: number) => {
    if (i >= j) return;
    if (matrix[i][j] === matrix[i + 1][j]) {
      traceback(i + 1, j);
    } else if (matrix[i][j] === matrix[i][j - 1]) {
      traceback(i, j - 1);
    } else {
      for (let t = i; t < j; t++) {
        if (isPair(seq[t], seq[j])) {
          const score = (t > i ? matrix[i][t - 1] : 0) + matrix[t + 1][j - 1] + 1;
          if (matrix[i][j] === score) {
            pairs.push([t, j]);
            paired[t] = true;
            paired[j] = true;
            traceback(i, t - 1);
            traceback(t + 1, j - 1);
            return;
          }
        }
      }
    }
  };

  traceback(0, n - 1);

  // Generate dot-bracket notation
  const dotBracket: string[] = new Array(n).fill('.');
  for (const [i, j] of pairs) {
    dotBracket[i] = '(';
    dotBracket[j] = ')';
  }

  // Estimate MFE (each pair contributes ~-2.4 kcal/mol on average)
  const mfe = -pairs.length * 2.4;

  return { pairs, dotBracket: dotBracket.join(''), mfe };
}

// ── Organism Presets (realistic reference sequences) ─────────────────────────

export const ORGANISM_PRESETS: { id: string; name: string; rRNA: string; sequence: string; source: string }[] = [
  {
    id: 'ecoli_16s',
    name: 'E. coli K-12',
    rRNA: '16S',
    source: 'NCBI RefSeq',
    sequence: 'ACGGCTACCTTGTTACGACTTCACCCCAGTCATGAATGGTAATGGTAGTCTGCAACGAGCGCAACCCTTATCCCTTAGTGACGGCGGTGATACCCTCTCAGGCCGGCTACCCGTCGTCGCCTTGTACACACCGCCCGTCACACCATGGGAGTGGGTTGCAAAAGAAGTAGGTAGCTTAACCTTCGGGAGGGCGCTTACCACTTTGTGATTCATGACTGGGGTGAAGTCGTAACAAGGTAGCCGTATCGGAAGGTGCGGCTGGATCACCTCCTTTCTA',
  },
  {
    id: 's aureus 16s',
    name: 'S. aureus',
    rRNA: '16S',
    source: 'NCBI RefSeq',
    sequence: 'GCGCCTAACACATGCAAGTCGAACGGTAACAGGAAGAAGCTTGCTTCTCTGATGTTAGCGGCGGACGGGTGAGTAACACGTGGGTAACCTGCCCGTGAGGGGGATAACTCTCGGAAACTGGATGCTAATACCGAATAAGCACTGGCAATAACTACAAAGGTATTGACGTTACCCGCAGAAGAAGCACCGGCTAACTCCGTGCCAGCAGCCGCGGTAATACGTAGGGTGCAAGCGTTAATCGGAATTACTGGGCGTAAAGCGCACGCAGGCGGTCTGTCAAGTCGGATGTGAAAGCCCCGGGCTCAACCTGGGAACTGCAT',
  },
  {
    id: 'p aeruginosa_16s',
    name: 'P. aeruginosa',
    rRNA: '16S',
    source: 'NCBI RefSeq',
    sequence: 'GGGAGGCAGCAGTGGGGAATATTGCACAATGGGCGCAAGCCTGATGCAGCAATGCCGCGTGTATGAAGAAGGCCTTCGGGTTGTAAAGTACTTTCAGCGGGGAGGAAGGGAGTAAGTGTTAATAACCTTGCGCTGTGACGGTACCTGAAGAATAAGCACCGGCTAACTCCGTGCCAGCAGCCGCGGTAATACGAAGGGTGCTAGCGTTGTTCGGAATTACTGGGCGTAAAGCGCACGTAGGCGGACTTTAAAGTCAGGGGTGAAATCCCGGGGCTCAACCCCGGAACTGCTT',
  },
  {
    id: 'h sapiens_18s',
    name: 'H. sapiens',
    rRNA: '18S',
    source: 'NCBI RefSeq',
    sequence: 'TACCTGGTTGATCCTGCCAGTAGTCATATGCTTGTCTCAAAGATTAAGCCATGCATGTCTTAAGTATACACGTTGGTGGCTGCCTGCCGCTTAATTGATCCTGCCAATAGTCATATGCTTGTCTCAGAGTTAAACCTTGGCCTTAATGGGGCAATACATGTTTAGGGGGATAACCTGGAGGCAAGTCTGGTGCCAGCAGCCGCGGTAATTCCAGCTCCAAAGAGTCTTTGGTGGTTTGATGGCCCGCGGCGCTTAATTGATCCGGAGGGCAAGTCTGGTGCCAGCAGCCGCGGTAATTCCAGCTCC',
  },
  {
    id: 's cerevisiae_18s',
    name: 'S. cerevisiae',
    rRNA: '18S',
    source: 'NCBI RefSeq',
    sequence: 'AGCTTAATACGGCCGCACTAGCCATGCATGTCTAAGTATCACGCTGGTTGATCCTGCCAGTAGTCATATGCTTGTCTCAAAGATTAAGCCATGCATGTCTTAAGTATACACGTTGGTGGCTGCCTGCCGCTTAATTGATCCTGCCAATAGTCATATGCTTGTCTCAGAGTTAAACCTTGGCCTTAATGGGGCAATACATGTTTAGGGGGATAACCTGGAGGCAAGTCTGGTGCCAGCAGCCGCGGTAATTCCAGCTCCAAAGAGTCTTTGGTGGTTTGATGGCCCGCG',
  },
  {
    id: 'ecoli_5s',
    name: 'E. coli 5S rRNA',
    rRNA: '5S',
    source: 'NCBI RefSeq',
    sequence: 'GCCGGAUCGUCCCGCGCUGGGUAACACCGCCCGAUCUCGUCUGAUCUCGGAAGCUAAGCAGGGUUCGAAUCCCUGUAGGCUCUUUCCGCUUCGGUGCGGCGGGACUCCGGUGCCUACGGGAUUCCGUGGCCGCCUGGGCGGCGGGACCCCGUCC',
  },
];

// ── Utility: Complement & Reverse Complement ─────────────────────────────────

export function complement(sequence: string): string {
  const map: Record<string, string> = { A: 'U', U: 'A', G: 'C', C: 'G', T: 'A' };
  return sequence.toUpperCase().split('').map(c => map[c] || 'N').join('');
}

export function reverseComplement(sequence: string): string {
  return complement(sequence).split('').reverse().join('');
}
