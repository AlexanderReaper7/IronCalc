import type { Comment } from "@ironcalc/wasm";
import { columnNumberFromName } from "@ironcalc/wasm";
import { headerColumnWidth, headerRowHeight } from "./constants";
import type WorksheetCanvas from "./worksheetCanvas";

// A cell with a note, and its rectangle on the canvas. The note card (a React
// component) is anchored to it.
export interface NoteCell {
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
  comment: Comment;
}

export interface CellNotesOptions {
  // The pointer is over a cell with a note (or over none when null). Drives
  // the note card shown by the React side.
  onNoteHover?: (cell: NoteCell | null) => void;
}

/** The [row, column] of an A1 reference like "AB12", or null if it is not one. */
export function parseCellReference(reference: string): [number, number] | null {
  const match = /^([A-Z]+)([0-9]+)$/.exec(reference);
  if (!match) {
    return null;
  }
  try {
    return [Number.parseInt(match[2], 10), columnNumberFromName(match[1])];
  } catch {
    return null;
  }
}

// The notes (legacy comments) of the selected sheet: the marker in the corner
// of each cell that has one, and hit-testing on pointer moves for the note card.
// The card itself is rendered by React (see Worksheet/NoteCard.tsx).
export class CellNotes {
  private worksheet: WorksheetCanvas;
  private options: CellNotesOptions;
  // notes in the selected sheet keyed by "row-column"
  private notes: Map<string, Comment>;

  constructor(worksheet: WorksheetCanvas, options: CellNotesOptions) {
    this.worksheet = worksheet;
    this.options = options;
    this.notes = new Map<string, Comment>();
    this.attachHandlers();
  }

  setSheetComments(comments: Comment[]): void {
    this.notes.clear();
    for (const comment of comments) {
      const cell = parseCellReference(comment.cell_ref);
      if (cell) {
        this.notes.set(`${cell[0]}-${cell[1]}`, comment);
      }
    }
  }

  getComment(row: number, column: number): Comment | null {
    return this.notes.get(`${row}-${column}`) || null;
  }

  // The cell with a note at (row, column) with its current rectangle, or null.
  // Read from the model rather than the map, which is only rebuilt when the
  // sheet is rendered: the card is placed before that, right after an edit.
  noteCell(row: number, column: number): NoteCell | null {
    const sheet = this.worksheet.model.getSelectedSheet();
    const comment = this.worksheet.model.getCellComment(sheet, row, column);
    if (!comment) {
      return null;
    }
    const [x, y, width, height] = this.worksheet.getCellRectangle(row, column);
    return { row, column, x, y, width, height, comment };
  }

  private attachHandlers(): void {
    // Like the link handlers (cellLinks.ts) these listen on the sheet container
    // and are assigned rather than added, because a new WorksheetCanvas is made
    // on every React render over the same DOM elements. The mouse events are
    // used because the link handlers already own the pointer ones.
    const canvas = this.worksheet.canvas;
    const container = canvas.parentElement ?? canvas;
    container.onmousemove = (event) => {
      // While the pointer is over the card it is not hovering any cell: the
      // card handles its own pointer events.
      const target = event.target as Element;
      if (target.closest?.(".ic-worksheet-note-card")) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // over the row or column headers
      if (x < headerColumnWidth || y < headerRowHeight) {
        this.options.onNoteHover?.(null);
        return;
      }
      const cell = this.worksheet.getCellByCoordinates(x, y);
      this.options.onNoteHover?.(
        cell ? this.noteCell(cell.row, cell.column) : null,
      );
    };
    container.onmouseleave = () => {
      this.options.onNoteHover?.(null);
    };
  }
}
