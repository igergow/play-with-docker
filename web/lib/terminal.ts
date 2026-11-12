// Terminal service wrapping XTerm.js with fit, fullscreen, and keyboard shortcuts
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import type { KeyboardShortcutPreset } from './types';

export interface TerminalGeometry {
  cols: number;
  rows: number;
}

export interface TerminalServiceOptions {
  fontSize?: number;
  fontFamily?: string;
  theme?: any;
}

export class TerminalService {
  private term: Terminal;
  private fitAddon: FitAddon;
  private searchAddon: SearchAddon;
  private element: HTMLElement | null = null;
  private onDataCallback?: (data: string) => void;
  private onResizeCallback?: (geometry: TerminalGeometry) => void;
  private keyboardShortcuts: KeyboardShortcutPreset | null = null;

  constructor(options?: TerminalServiceOptions) {
    this.term = new Terminal({
      cursorBlink: true,
      fontSize: options?.fontSize || 14,
      fontFamily: options?.fontFamily || 'Menlo, Monaco, "Courier New", monospace',
      theme: options?.theme || {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    this.fitAddon = new FitAddon();
    this.searchAddon = new SearchAddon();

    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(this.searchAddon);

    // Handle terminal data (user input)
    this.term.onData((data) => {
      if (this.onDataCallback) {
        this.onDataCallback(data);
      }
    });

    // Handle terminal resize
    this.term.onResize(({ cols, rows }) => {
      if (this.onResizeCallback) {
        this.onResizeCallback({ cols, rows });
      }
    });
  }

  open(element: HTMLElement) {
    this.element = element;
    this.term.open(element);
    this.fit();
  }

  write(data: string) {
    this.term.write(data);
  }

  writeln(data: string) {
    this.term.writeln(data);
  }

  clear() {
    this.term.clear();
  }

  fit() {
    if (this.element) {
      try {
        this.fitAddon.fit();
      } catch (error) {
        console.error('Error fitting terminal:', error);
      }
    }
  }

  focus() {
    this.term.focus();
  }

  blur() {
    this.term.blur();
  }

  getGeometry(): TerminalGeometry {
    return {
      cols: this.term.cols,
      rows: this.term.rows,
    };
  }

  proposeGeometry(): TerminalGeometry {
    const proposed = this.fitAddon.proposeDimensions();
    return {
      cols: proposed?.cols || this.term.cols,
      rows: proposed?.rows || this.term.rows,
    };
  }

  onData(callback: (data: string) => void) {
    this.onDataCallback = callback;
  }

  onResize(callback: (geometry: TerminalGeometry) => void) {
    this.onResizeCallback = callback;
  }

  setFontSize(size: number) {
    this.term.options.fontSize = size;
    this.fit();
  }

  getFontSize(): number {
    return this.term.options.fontSize || 14;
  }

  setKeyboardShortcuts(shortcuts: KeyboardShortcutPreset) {
    this.keyboardShortcuts = shortcuts;
  }

  getKeyboardShortcuts(): KeyboardShortcutPreset | null {
    return this.keyboardShortcuts;
  }

  search(text: string, options?: { incremental?: boolean }) {
    return this.searchAddon.findNext(text, options);
  }

  searchPrevious(text: string, options?: { incremental?: boolean }) {
    return this.searchAddon.findPrevious(text, options);
  }

  dispose() {
    this.term.dispose();
  }

  getTerminal(): Terminal {
    return this.term;
  }
}

// Keyboard shortcut presets matching AngularJS implementation
export const keyboardShortcutPresets: KeyboardShortcutPreset[] = [
  {
    name: 'None',
    presets: [],
  },
  {
    name: 'Mac',
    presets: [
      { command: 'Cmd+C', description: 'Copy' },
      { command: 'Cmd+V', description: 'Paste' },
    ],
  },
  {
    name: 'Windows',
    presets: [
      { command: 'Ctrl+Shift+C', description: 'Copy' },
      { command: 'Ctrl+Shift+V', description: 'Paste' },
    ],
  },
];

// Font size options
export const terminalFontSizes = [10, 12, 14, 16, 18, 20, 22, 24];

// Helper to manage multiple terminal instances
export class TerminalManager {
  private terminals: Map<string, TerminalService> = new Map();

  create(id: string, options?: TerminalServiceOptions): TerminalService {
    const terminal = new TerminalService(options);
    this.terminals.set(id, terminal);
    return terminal;
  }

  get(id: string): TerminalService | undefined {
    return this.terminals.get(id);
  }

  has(id: string): boolean {
    return this.terminals.has(id);
  }

  remove(id: string): boolean {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.dispose();
      return this.terminals.delete(id);
    }
    return false;
  }

  clear() {
    this.terminals.forEach((terminal) => terminal.dispose());
    this.terminals.clear();
  }

  getAll(): Map<string, TerminalService> {
    return this.terminals;
  }
}

