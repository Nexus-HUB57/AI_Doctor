// ─────────────────────────────────────────────────────────────
// FASTA / FASTQ Parsers — Client-side, zero dependencies
// ─────────────────────────────────────────────────────────────

export interface ParsedSequence {
  id: string;
  header: string;
  sequence: string;
  length: number;
  gcContent: number;
  nucleotideCounts: { A: number; U: number; G: number; C: number; other: number };
}

// FASTA: lines starting with '>' are headers
export function parseFasta(text: string): ParsedSequence[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const sequences: ParsedSequence[] = [];
  let currentId = '';
  let currentHeader = '';
  let currentSeq = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('>')) {
      if (currentSeq.length > 0) {
        sequences.push(buildSequence(currentId, currentHeader, currentSeq));
      }
      currentHeader = line.substring(1).trim();
      currentId = currentHeader.split(/\s+/)[0];
      currentSeq = '';
    } else if (line.length > 0) {
      currentSeq += line.toUpperCase().replace(/[^AUGC]/g, '');
    }
  }
  if (currentSeq.length > 0) {
    sequences.push(buildSequence(currentId, currentHeader, currentSeq));
  }
  return sequences;
}

// FASTQ: 4 lines per record (header, sequence, +, quality)
export function parseFastq(text: string): ParsedSequence[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const sequences: ParsedSequence[] = [];

  for (let i = 0; i < lines.length - 3; i += 4) {
    const headerLine = lines[i]?.trim() || '';
    const seqLine = lines[i + 1]?.trim() || '';
    if (!headerLine.startsWith('@')) continue;

    const header = headerLine.substring(1).trim();
    const id = header.split(/\s+/)[0];
    const cleaned = seqLine.toUpperCase().replace(/[^AUGC]/g, '');

    if (cleaned.length > 0) {
      sequences.push(buildSequence(id, header, cleaned));
    }
  }
  return sequences;
}

// Auto-detect format and parse
export function parseSequences(text: string): ParsedSequence[] {
  const trimmed = text.trim();
  if (trimmed.startsWith('>')) return parseFasta(trimmed);
  if (trimmed.startsWith('@') && trimmed.split('\n').length >= 4) return parseFastq(trimmed);
  // Plain sequence — treat entire input as one sequence
  const cleaned = trimmed.toUpperCase().replace(/[^AUGC]/g, '');
  if (cleaned.length > 0) {
    return [buildSequence('seq_1', 'User input', cleaned)];
  }
  return [];
}

// ── Internal ──

function countNucleotides(seq: string) {
  const counts = { A: 0, U: 0, G: 0, C: 0, other: 0 };
  for (const ch of seq) {
    if (ch === 'A') counts.A++;
    else if (ch === 'U') counts.U++;
    else if (ch === 'G') counts.G++;
    else if (ch === 'C') counts.C++;
    else counts.other++;
  }
  return counts;
}

function buildSequence(id: string, header: string, sequence: string): ParsedSequence {
  const counts = countNucleotides(sequence);
  const gc = sequence.length > 0
    ? ((counts.G + counts.C) / sequence.length) * 100
    : 0;

  return {
    id,
    header,
    sequence,
    length: sequence.length,
    gcContent: Math.round(gc * 100) / 100,
    nucleotideCounts: counts,
  };
}