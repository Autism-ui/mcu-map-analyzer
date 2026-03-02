export interface MemoryRegion {
  name: string;
  origin: number;
  length: number;
  used: number;
  free: number;
}

export interface Symbol {
  name: string;
  address: number;
  size: number;
  section: string;
  file: string;
}

export interface Module {
  name: string;
  totalSize: number;
  textSize: number;
  dataSize: number;
  bssSize: number;
  rodataSize: number;
}

export interface ParsedMapData {
  memoryRegions: MemoryRegion[];
  symbols: Symbol[];
  modules: Module[];
}

export interface AlignmentIssue {
  symbolName: string;
  address: number;
  wastedBytes: number;
}

export interface OptimizationSuggestion {
  alignmentIssues: AlignmentIssue[];
  unusedSymbols: string[];
  duplicateSymbols: string[];
}
