// ─────────────────────────────────────────────────────────────
// Bio Library — Barrel Export
// Client-side bioinformatics: parsers, analysis, alignment,
// phylogeny (UPGMA + NJ), taxonomy, rRNA identification
// ─────────────────────────────────────────────────────────────

// Parsers
export { parseFasta, parseFastq, parseSequences } from './parsers';
export type { ParsedSequence } from './parsers';

// rRNA Tools
export { identifyRRNAGenes, classifySequence as classifyRRNA } from './rna-tools';
export type { RRNAGeneHit } from './rna-tools';

// Analysis
export {
  computeKmerFrequencies,
  computeDiversityIndices,
  computeComposition,
} from './analysis';
export type { KmerEntry, DiversityIndices } from './analysis';

// Alignment
export { needlemanWunsch, buildDistanceMatrix, upgmaToNewick } from './alignment';
export type { AlignmentResult, DistanceMatrix } from './alignment';

// Phylogeny
export {
  upgma,
  neighborJoining,
  toNewick,
  fromNewick,
  computeTreeLayout,
} from './phylogeny';
export type { TreeNode, PhylogenyResult, TreeLayoutNode, LayoutOptions } from './phylogeny';

// Taxonomy
export { classifyTaxon, classifyTaxa } from './taxonomy';
export type { TaxonAssignment, ClassificationReport } from './taxonomy';
