// ─────────────────────────────────────────────────────────────
// rRNA Gene Identification — Conserved region scanning
// ─────────────────────────────────────────────────────────────

export interface RRNAGeneHit {
  gene: string;          // '16S' | '18S' | '23S' | '5S'
  confidence: number;    // 0–100
  region: string;        // descriptive region name
  start: number;
  end: number;
  consensusMatch: number; // % match to consensus
}

// Simplified consensus profiles for rRNA conserved regions
// Based on published conserved sequence motifs from RDP, SILVA databases
const CONSENSUS_PROFILES: Record<string, { motifs: string[]; gene: string; description: string }> = {
  '16S_bacterial': {
    gene: '16S',
    description: 'Bacterial 16S Small Subunit Ribosomal RNA',
    motifs: [
      'CCTACGGGAGGCAGCAG',  // V1-V2 region primer site
      'GTAGTCCACGCCGTAAAC',  // V3 region
      'GCCTACGGGAGGCAGCAG',
      'ACGGGCGGTGTGTACAAG',
      'GACTACGGGTATCTAATCC',
    ],
  },
  '18S_eukaryotic': {
    gene: '18S',
    description: 'Eukaryotic 18S Small Subunit Ribosomal RNA',
    motifs: [
      'GATCCTGCCAGTAGTCATAT',
      'AACTGAGAATCGCTAGTA',
      'TGATCCTGCCAGTAGTCAT',
      'CCTGAGAAACGGCTACCAC',
      'CGATCCTTCCGCAGGTTCAC',
    ],
  },
  '23S_bacterial': {
    gene: '23S',
    description: 'Bacterial 23S Large Subunit Ribosomal RNA',
    motifs: [
      'GGGATAACCTTGTTACGACTT',
      'CCGTCTGAATCAGGGTTCG',
      'GCCTGCGGCTTAATTTGAC',
      'CCTTTGAGACGGGTAACG',
      'GCGGCTTAATTTGACTCA',
    ],
  },
  '5S_universal': {
    gene: '5S',
    description: 'Universal 5S Ribosomal RNA (~120 nt)',
    motifs: [
      'GCCUACGGCCAUACCACCC',
      'CCTACGGCCATACCACCC',
      'GGCCATACCACCCGAATG',
    ],
  },
};

// Scan a sequence against all rRNA consensus profiles
export function identifyRRNAGenes(sequence: string): RRNAGeneHit[] {
  const hits: RRNAGeneHit[] = [];
  const seq = sequence.toUpperCase();

  for (const [, profile] of Object.entries(CONSENSUS_PROFILES)) {
    for (const motif of profile.motifs) {
      const m = motif.toUpperCase();
      const positions: number[] = [];

      // Allow up to 2 mismatches for short motifs, 3 for longer
      const maxMismatches = m.length >= 18 ? 3 : 2;

      for (let i = 0; i <= seq.length - m.length; i++) {
        let mismatches = 0;
        for (let j = 0; j < m.length; j++) {
          if (seq[i + j] !== m[j]) {
            mismatches++;
            if (mismatches > maxMismatches) break;
          }
        }
        if (mismatches <= maxMismatches) {
          positions.push(i);
        }
      }

      if (positions.length > 0) {
        const bestPos = positions[0];
        const matchPercent = Math.max(0, 100 - (maxMismatches / m.length) * 100);

        hits.push({
          gene: profile.gene,
          confidence: Math.min(100, Math.round(matchPercent * (positions.length > 1 ? 1.05 : 1))),
          region: profile.description,
          start: bestPos + 1,
          end: bestPos + m.length,
          consensusMatch: Math.round(matchPercent * 100) / 100,
        });
      }
    }
  }

  // Deduplicate: keep highest confidence per gene
  const best: Record<string, RRNAGeneHit> = {};
  for (const hit of hits) {
    if (!best[hit.gene] || hit.confidence > best[hit.gene].confidence) {
      best[hit.gene] = hit;
    }
  }

  return Object.values(best).sort((a, b) => b.confidence - a.confidence);
}

// Quick classification: what type of RNA is this most likely?
export function classifySequence(sequence: string): string {
  const hits = identifyRRNAGenes(sequence);
  if (hits.length === 0) return 'Unknown / Non-rRNA';
  if (hits[0].confidence >= 70) return hits[0].region;
  return 'Partial rRNA match';
}