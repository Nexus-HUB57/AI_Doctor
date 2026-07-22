// ─────────────────────────────────────────────────────────────
// Needleman-Wunsch Global Alignment + Distance Matrix
// ─────────────────────────────────────────────────────────────

export interface AlignmentResult {
  seqA: string;
  seqB: string;
  alignedA: string;
  alignedB: string;
  score: number;
  identity: number;    // 0–100 %
  similarity: number;  // 0–100 % (including conservative substitutions)
  gaps: number;
  alignmentLength: number;
}

// Simple scoring: match +2, mismatch -1, gap -2
const MATCH = 2;
const MISMATCH = -1;
const GAP = -2;

const isMatchOrSimilar = (a: string, b: string): boolean => {
  if (a === b) return true;
  // Conservative: G-U wobble pair
  if ((a === 'G' && b === 'U') || (a === 'U' && b === 'G')) return true;
  // Purine-purine or pyrimidine-pyrimidine (transitions)
  const purines = 'AG';
  const pyrimidines = 'UC';
  if (purines.includes(a) && purines.includes(b)) return true;
  if (pyrimidines.includes(a) && pyrimidines.includes(b)) return true;
  return false;
};

export function needlemanWunsch(seqA: string, seqB: string): AlignmentResult {
  const a = seqA.toUpperCase();
  const b = seqB.toUpperCase();
  const m = a.length;
  const n = b.length;

  // DP matrix
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j * GAP : j === 0 ? i * GAP : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const score = a[i - 1] === b[j - 1] ? MATCH : MISMATCH;
      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + score,
        dp[i - 1][j] + GAP,
        dp[i][j - 1] + GAP
      );
    }
  }

  // Traceback
  let alignedA = '';
  let alignedB = '';
  let i = m, j = n;
  let gaps = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? MATCH : MISMATCH)) {
      alignedA = a[i - 1] + alignedA;
      alignedB = b[j - 1] + alignedB;
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + GAP) {
      alignedA = a[i - 1] + alignedA;
      alignedB = '-' + alignedB;
      gaps++;
      i--;
    } else {
      alignedA = '-' + alignedA;
      alignedB = b[j - 1] + alignedB;
      gaps++;
      j--;
    }
  }

  // Compute identity and similarity
  const alignLen = alignedA.length || 1;
  let matches = 0, similar = 0;
  for (let k = 0; k < alignedA.length; k++) {
    if (alignedA[k] === '-' || alignedB[k] === '-') continue;
    if (alignedA[k] === alignedB[k]) matches++;
    else if (isMatchOrSimilar(alignedA[k], alignedB[k])) similar++;
  }

  return {
    seqA, seqB, alignedA, alignedB,
    score: dp[m][n],
    identity: Math.round((matches / alignLen) * 10000) / 100,
    similarity: Math.round(((matches + similar) / alignLen) * 10000) / 100,
    gaps,
    alignmentLength: alignLen,
  };
}

// Pairwise distance matrix for multiple sequences
export interface DistanceMatrix {
  labels: string[];
  matrix: number[][];
}

export function buildDistanceMatrix(
  sequences: { id: string; sequence: string }[]
): DistanceMatrix {
  const n = sequences.length;
  const labels = sequences.map(s => s.id);
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const result = needlemanWunsch(sequences[i].sequence, sequences[j].sequence);
      // Convert identity percentage to distance (0 = identical, 1 = completely different)
      const distance = 1 - result.identity / 100;
      matrix[i][j] = Math.round(distance * 10000) / 10000;
      matrix[j][i] = matrix[i][j];
    }
  }

  return { labels, matrix };
}

// UPGMA clustering from distance matrix → Newick string
export function upgmaToNewick(dm: DistanceMatrix): string {
  const { labels, matrix } = dm;
  const n = labels.length;
  if (n === 0) return ';';
  if (n === 1) return `${labels[0]};`;

  // Working clusters
  let clusters: { name: string; size: number; height: number }[] = labels.map(l => ({
    name: l, size: 1, height: 0,
  }));

  // Working distance matrix (copy)
  const dist: number[][] = matrix.map(row => [...row]);
  const active = new Set(Array.from({ length: n }, (_, i) => i));

  while (active.size > 1) {
    // Find minimum distance between active clusters
    let minDist = Infinity;
    let minI = -1, minJ = -1;

    const activeArr = Array.from(active);
    for (let a = 0; a < activeArr.length; a++) {
      for (let b = a + 1; b < activeArr.length; b++) {
        const ci = activeArr[a];
        const cj = activeArr[b];
        if (dist[ci][cj] < minDist) {
          minDist = dist[ci][cj];
          minI = ci;
          minJ = cj;
        }
      }
    }

    if (minI === -1 || minJ === -1) break;

    const cI = clusters[minI];
    const cJ = clusters[minJ];
    const newHeight = minDist / 2;
    const branchI = newHeight - cI.height;
    const branchJ = newHeight - cJ.height;

    // Create merged cluster name (Newick subtree)
    const newName = `(${cI.name}:${branchI.toFixed(4)},${cJ.name}:${branchJ.toFixed(4)})`;

    // Update distance matrix: UPGMA weighted average
    const newIndex = minI; // Reuse minI slot
    for (const k of active) {
      if (k === minI || k === minJ) continue;
      const d = (dist[minI][k] * cI.size + dist[minJ][k] * cJ.size) / (cI.size + cJ.size);
      dist[newIndex][k] = Math.round(d * 10000) / 10000;
      dist[k][newIndex] = dist[newIndex][k];
    }

    clusters[newIndex] = {
      name: newName,
      size: cI.size + cJ.size,
      height: newHeight,
    };

    active.delete(minJ);
  }

  const rootIdx = Array.from(active)[0];
  return `${clusters[rootIdx].name};`;
}