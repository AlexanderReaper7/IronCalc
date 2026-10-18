import type { Comment } from "@ironcalc/wasm";
import { PencilLine, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  headerColumnWidth,
  headerRowHeight,
} from "../WorksheetCanvas/constants";

// The cell the card belongs to, and its rectangle on the canvas. `comment` is
// null while a new note is being written.
export interface NoteCardCell {
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
  comment: Comment | null;
}

// The note of a cell, shown beside it. Clicking the text edits it in place:
// leaving the field or Ctrl+Enter keeps the text, Escape drops the change, and
// an empty text deletes the note.
const NoteCard = (props: {
  cell: NoteCardCell;
  // The width of the sheet area, to keep the card inside it
  areaWidth: number;
  editing: boolean;
  canEdit: boolean;
  onStartEdit: () => void;
  onSave: (text: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) => {
  const { cell, editing, canEdit } = props;
  const { t } = useTranslation();
  const rootElement = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [draft, setDraft] = useState(cell.comment?.text ?? "");
  // Escape and Ctrl+Enter end the edit themselves; the blur that follows
  // must not save again
  const done = useRef(false);

  // Kept invisible on its first paint so it can be measured and placed to the
  // right of the cell, or to its left when there is no room.
  useLayoutEffect(() => {
    const measured = rootElement.current?.offsetWidth || 240;
    setWidth((previous) => (previous === measured ? previous : measured));
  });

  // Flush with the cell edge, like the link tooltip: a gap would make the
  // pointer cross a neighboring cell on its way to the card.
  let left = cell.x + cell.width - 1;
  if (width !== null && left + width > props.areaWidth) {
    left = Math.max(headerColumnWidth + 2, cell.x - width + 1);
  }
  const top = Math.max(headerRowHeight, cell.y);

  const finish = (save: boolean) => {
    if (done.current) {
      return;
    }
    done.current = true;
    if (save) {
      props.onSave(draft.trim());
    } else {
      props.onCancel();
    }
  };

  return (
    <div
      ref={rootElement}
      className={`ic-worksheet-note-card${editing ? " ic-worksheet-note-card--editing" : ""}`}
      style={{ left, top, visibility: width === null ? "hidden" : "visible" }}
      onPointerEnter={props.onPointerEnter}
      onPointerLeave={props.onPointerLeave}
      // Interacting with the card must not select the cells underneath
      onPointerDown={(event) => event.stopPropagation()}
    >
      {editing ? (
        <textarea
          className="ic-worksheet-note-card-input"
          aria-label={t("note_card.label")}
          placeholder={t("note_card.placeholder")}
          value={draft}
          // biome-ignore lint/a11y/noAutofocus: the user asked to write the note
          autoFocus
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Escape") {
              event.preventDefault();
              finish(false);
            } else if (
              event.key === "Enter" &&
              (event.ctrlKey || event.metaKey)
            ) {
              event.preventDefault();
              finish(true);
            }
          }}
        />
      ) : (
        <>
          {cell.comment?.author_name ? (
            <div className="ic-worksheet-note-card-author">
              {cell.comment.author_name}
            </div>
          ) : null}
          <button
            type="button"
            className="ic-worksheet-note-card-text"
            disabled={!canEdit}
            onClick={props.onStartEdit}
          >
            {cell.comment?.text}
          </button>
          {canEdit ? (
            <div className="ic-worksheet-note-card-actions">
              <button
                type="button"
                className="ic-worksheet-link-tooltip-button"
                title={t("note_card.edit")}
                aria-label={t("note_card.edit")}
                onClick={props.onStartEdit}
              >
                <PencilLine />
              </button>
              <button
                type="button"
                className="ic-worksheet-link-tooltip-button"
                title={t("note_card.delete")}
                aria-label={t("note_card.delete")}
                onClick={props.onDelete}
              >
                <Trash2 />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default NoteCard;
