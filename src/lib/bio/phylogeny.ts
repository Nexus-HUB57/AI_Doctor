/**
 * @module bio/phylogeny
 * @description Phylogenetic tree construction algorithms and Newick format utilities.
 * Implements UPGMA (Unweighted Pair Group Method with Arithmetic Mean) and
 * Neighbor-Joining tree construction from a distance matrix.
 * Pure TypeScript — no external bioinformatics dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** A node in a phylogenetic tree. */
export interface TreeNode {
  /** Display label (sequence name or internal node label). */
  name: string;
  /** Branch length from this node to its parent. 0 for root. */
  length: number;
  /** Child nodes. Empty array for leaves. */
  children: TreeNode[];
}

/** Result of building a phylogenetic tree. */
export interface PhylogenyResult {
  /** Root node of the tree. */
  tree: TreeNode;
  /** Newick-format string representation. */
  newick: string;
  /** The distance matrix used (for reference). */
  distanceMatrix: { names: string[]; matrix: number[][] };
  /** Algorithm used. */
  method: 'upgma' | 'neighbor_joining';
}

// ─── UPGMA Algorithm ──────────────────────────────────────────────────────────

/**
 * Build a phylogenetic tree using the UPGMA algorithm.
 *
 * UPGMA produces an ultrametric tree (all leaves equidistant from root).
 * Time complexity: O(n³).
 *
 * @param names - Sequence/taxon names.
 * @param distMatrix - Square distance matrix (symmetric, diagonal = 0).
 * @returns Phylogenetic tree root and Newick string.
 */
export function upgma(
  names: string[],
  distMatrix: number[][]
): PhylogenyResult {
  const n = names.length;
  if (n < 2) {
    const leaf: TreeNode = { name: names[0] || 'root', length: 0, children: [] };
    return {
      tree: leaf,
      newick: names[0] || 'root',
      distanceMatrix: { names, matrix: distMatrix },
      method: 'upgma',
    };
  }

  // Deep-copy the distance matrix
  const dist: number[][] = distMatrix.map((row) => [...row]);
  // Track active clusters
  const clusters: { size: number; node: TreeNode }[] = names.map((name) => ({
    size: 1,
    node: { name, length: 0, children: [] },
  }));
  // Map cluster indices to original name indices
  const activeIndices: number[] = Array.from({ length: n }, (_, i) => i);
  const clusterNames: string[] = [...names];

  while (activeIndices.length > 1) {
    // Find minimum distance pair
    let minDist = Infinity;
    let minI = 0;
    let minJ = 1;

    for (let a = 0; a < activeIndices.length; a++) {
      for (let b = a + 1; b < activeIndices.length; b++) {
        const d = dist[activeIndices[a]][activeIndices[b]];
        if (d < minDist) {
          minDist = d;
          minI = a;
          minJ = b;
        }
      }
    }

    const idxI = activeIndices[minI];
    const idxJ = activeIndices[minJ];
    const sizeI = clusters[idxI].size;
    const sizeJ = clusters[idxJ].size;
    const totalSize = sizeI + sizeJ;

    // Branch lengths (UPGMA is ultrametric)
    const branchLengthI = minDist / 2 - (clusters[idxI].node.length || 0);
    const branchLengthJ = minDist / 2 - (clusters[idxJ].node.length || 0);

    // Create new internal node
    const newNode: TreeNode = {
      name: `node_${clusterNames[idxI]}_${clusterNames[idxJ]}`,
      length: 0,
      children: [
        { ...clusters[idxI].node, length: branchLengthI },
        { ...clusters[idxJ].node, length: branchLengthJ },
      ],
    };

    // Set internal node height (for ultrametric property)
    newNode.length = minDist / 2;

    // Update distance matrix: new cluster replaces idxI, remove idxJ
    const newDistRow: number[] = new Array(n).fill(0);
    for (let k = 0; k < n; k++) {
      if (k === idxI || k === idxJ) continue;
      const dijI = dist[idxI][k];
      const dijJ = dist[idxJ][k];
      newDistRow[k] = (dijI * sizeI + dijJ * sizeJ) / totalSize;
    }

    // Write new distances
    for (let k = 0; k < n; k++) {
      dist[k][idxI] = newDistRow[k];
      dist[idxI][k] = newDistRow[k];
    }
    dist[idxI][idxI] = 0;

    // Remove idxJ from active list
    clusters[idxI] = { size: totalSize, node: newNode };
    clusterNames[idxI] = newNode.name;
    activeIndices.splice(minJ, 1);
  }

  const root = clusters[activeIndices[0]].node;
  root.length = 0;

  return {
    tree: root,
    newick: toNewick(root),
    distanceMatrix: { names, matrix: distMatrix },
    method: 'upgma',
  };
}

// ─── Neighbor-Joining Algorithm ───────────────────────────────────────────────

/**
 * Build a phylogenetic tree using the Neighbor-Joining algorithm.
 *
 * NJ does not assume a molecular clock and produces additive trees.
 * Time complexity: O(n³).
 *
 * @param names - Sequence/taxon names.
 * @param distMatrix - Square distance matrix (symmetric, diagonal = 0).
 * @returns Phylogenetic tree root and Newick string.
 */
export function neighborJoining(
  names: string[],
  distMatrix: number[][]
): PhylogenyResult {
  const n = names.length;
  if (n < 2) {
    const leaf: TreeNode = { name: names[0] || 'root', length: 0, children: [] };
    return {
      tree: leaf,
      newick: names[0] || 'root',
      distanceMatrix: { names, matrix: distMatrix },
      method: 'neighbor_joining',
    };
  }

  // Deep-copy
  const dist: number[][] = distMatrix.map((row) => [...row]);
  const nodes: TreeNode[] = names.map((name) => ({ name, length: 0, children: [] }));
  const active: number[] = Array.from({ length: n }, (_, i) => i);
  const clusterNames: string[] = [...names];
  let nextInternalId = 0;

  while (active.length > 2) {
    const r = active.length;

    // Compute total distance for each active node
    const rowSum: number[] = new Array(n).fill(0);
    for (const i of active) {
      for (const j of active) {
        rowSum[i] += dist[i][j];
      }
    }

    // Find minimum Q-matrix entry
    let minQ = Infinity;
    let minI = active[0];
    let minJ = active[1];

    for (let a = 0; a < active.length; a++) {
      for (let b = a + 1; b < active.length; b++) {
        const i = active[a];
        const j = active[b];
        const q = (r - 2) * dist[i][j] - rowSum[i] - rowSum[j];
        if (q < minQ) {
          minQ = q;
          minI = i;
          minJ = j;
        }
      }
    }

    // Compute branch lengths
    const dIJ = dist[minI][minJ];
    const branchI = r === 2
      ? dIJ / 2
      : (dIJ / 2) + (rowSum[minI] - rowSum[minJ]) / (2 * (r - 2));
    const branchJ = dIJ - branchI;

    // Create new internal node
    const internalName = `nj_${nextInternalId++}`;
    const newNode: TreeNode = {
      name: internalName,
      length: 0,
      children: [
        { ...nodes[minI], length: Math.max(0, branchI) },
        { ...nodes[minJ], length: Math.max(0, branchJ) },
      ],
    };

    // Update distance matrix
    const newDistRow: number[] = new Array(n).fill(0);
    for (const k of active) {
      if (k === minI || k === minJ) continue;
      newDistRow[k] = (dist[minI][k] + dist[minJ][k] - dIJ) / 2;
    }

    for (const k of active) {
      if (k === minI || k === minJ) continue;
      dist[k][minI] = newDistRow[k];
      dist[minI][k] = newDistRow[k];
    }
    dist[minI][minI] = 0;

    // Update bookkeeping
    nodes[minI] = newNode;
    clusterNames[minI] = internalName;
    active.splice(active.indexOf(minJ), 1);
  }

  // Last two nodes: join them
  const lastI = active[0];
  const lastJ = active[1];
  const root: TreeNode = {
    name: 'root',
    length: 0,
    children: [
      { ...nodes[lastI], length: dist[lastI][lastJ] / 2 },
      { ...nodes[lastJ], length: dist[lastI][lastJ] / 2 },
    ],
  };

  return {
    tree: root,
    newick: toNewick(root),
    distanceMatrix: { names, matrix: distMatrix },
    method: 'neighbor_joining',
  };
}

// ─── Newick Format ────────────────────────────────────────────────────────────

/**
 * Convert a TreeNode tree to Newick format string.
 *
 * Format: `((A:0.1,B:0.2):0.3,C:0.4);`
 *
 * @param node - Root node of the tree.
 * @returns Newick string with trailing semicolon.
 */
export function toNewick(node: TreeNode): string {
  if (node.children.length === 0) {
    return formatLength(node.length) > 0
      ? `${node.name}:${formatLength(node.length)}`
      : node.name;
  }

  const childStr = node.children.map((c) => toNewick(c)).join(',');
  const lengthStr = formatLength(node.length) > 0 ? `:${formatLength(node.length)}` : '';

  // Skip internal node names unless they look meaningful
  const nameStr = node.name && !node.name.startsWith('node_') && !node.name.startsWith('nj_') && node.name !== 'root'
    ? node.name
    : '';

  return `(${childStr})${nameStr}${lengthStr}`;
}

/**
 * Parse a Newick string into a TreeNode tree.
 *
 * Handles standard Newick: `((A:0.1,B:0.2)ab:0.3,C:0.4)root:0;`
 *
 * @param newick - Newick format string (with or without trailing `;`).
 * @returns Root TreeNode.
 */
export function fromNewick(newick: string): TreeNode {
  const s = newick.trim().replace(/;$/, '');

  let pos = 0;

  function parseNode(): TreeNode {
    let children: TreeNode[] = [];

    if (s[pos] === '(') {
      pos++; // skip '('
      children.push(parseNode());
      while (s[pos] === ',') {
        pos++; // skip ','
        children.push(parseNode());
      }
      pos++; // skip ')'
    }

    // Read name (everything until ':' or ',' or ')' or end)
    let name = '';
    while (pos < s.length && s[pos] !== ':' && s[pos] !== ',' && s[pos] !== ')' && s[pos] !== ';') {
      name += s[pos];
      pos++;
    }
    name = name.trim();

    // Read branch length
    let length = 0;
    if (pos < s.length && s[pos] === ':') {
      pos++; // skip ':'
      let lenStr = '';
      while (pos < s.length && s[pos] !== ',' && s[pos] !== ')' && s[pos] !== ';') {
        lenStr += s[pos];
        pos++;
      }
      length = parseFloat(lenStr) || 0;
    }

    return { name: name || (children.length === 0 ? 'unnamed' : ''), length, children };
  }

  return parseNode();
}

// ─── Tree Layout (for SVG rendering) ──────────────────────────────────────────

/** A 2D point for tree node positioning. */
export interface TreeLayoutNode {
  /** Reference to the original TreeNode. */
  node: TreeNode;
  /** X coordinate (horizontal = branch length axis). */
  x: number;
  /** Y coordinate (vertical = leaf ordering). */
  y: number;
  /** Layout children with computed positions. */
  children: TreeLayoutNode[];
}

/** Options for tree layout computation. */
export interface LayoutOptions {
  /** Horizontal pixels per unit of branch length. Default: 100. */
  widthScale?: number;
  /** Vertical pixels between leaf nodes. Default: 40. */
  leafSpacing?: number;
  /** Left margin in pixels. Default: 120. */
  marginLeft?: number;
  /** Top margin in pixels. Default: 30. */
  marginTop?: number;
}

/**
 * Compute a rectangular (cladogram-style) layout for a phylogenetic tree.
 *
 * Leaves are evenly spaced vertically. X positions reflect branch lengths.
 *
 * @param root - Root TreeNode.
 * @param options - Layout configuration.
 * @returns Layout root with x/y coordinates for all nodes.
 */
export function computeTreeLayout(
  root: TreeNode,
  options: LayoutOptions = {}
): TreeLayoutNode {
  const {
    widthScale = 100,
    leafSpacing = 40,
    marginLeft = 120,
    marginTop = 30,
  } = options;

  // Collect leaves in order
  const leaves: TreeNode[] = [];
  function collectLeaves(node: TreeNode) {
    if (node.children.length === 0) {
      leaves.push(node);
    } else {
      for (const child of node.children) {
        collectLeaves(child);
      }
    }
  }
  collectLeaves(root);

  // Map each node to its cumulative x (distance from root)
  const xMap = new Map<TreeNode, number>();
  function computeX(node: TreeNode, cumulative: number) {
    xMap.set(node, cumulative);
    for (const child of node.children) {
      computeX(child, cumulative + child.length);
    }
  }
  computeX(root, 0);

  // Map each leaf to its y position
  const yMap = new Map<TreeNode, number>();
  for (let i = 0; i < leaves.length; i++) {
    yMap.set(leaves[i], marginTop + i * leafSpacing);
  }

  // Build layout tree
  function layoutNode(node: TreeNode): TreeLayoutNode {
    const x = marginLeft + (xMap.get(node) || 0) * widthScale;

    if (node.children.length === 0) {
      return {
        node,
        x,
        y: yMap.get(node) || 0,
        children: [],
      };
    }

    const layoutChildren = node.children.map((c) => layoutNode(c));
    const yPositions = layoutChildren.map((c) => c.y);
    const y = (Math.min(...yPositions) + Math.max(...yPositions)) / 2;

    return {
      node,
      x,
      y,
      children: layoutChildren,
    };
  }

  return layoutNode(root);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLength(len: number): number {
  return Math.round(len * 10000) / 10000;
}