export { parseFasta, parseFastq, parseSequences } from './parsers';
export type { ParsedSequence } from './parsers';

export { identifyRRNAGenes, classifySequence } from './rna-tools';
export type { RRNAGeneHit } from './rna-tools';

export {
  computeKmerFrequencies,
  computeDiversityIndices,
  computeComposition,
} from './analysis';
export type { KmerEntry, DiversityIndices } from './analysis';

export { needlemanWunsch, buildDistanceMatrix, upgmaToNewick } from './alignment';
export type { AlignmentResult, DistanceMatrix } from './alignment';