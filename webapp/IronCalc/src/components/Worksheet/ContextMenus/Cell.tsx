import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clipboard,
  ClipboardPaste,
  Copy,
  Eraser,
  EyeOff,
  Link,
  Link2Off,
  Merge,
  MoveHorizontal,
  MoveVertical,
  PaintRoller,
  Scissors,
  Snowflake,
  SquareFunction,
  StickyNote,
  StickyNoteX,
  Tag,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Menu } from "../../Menu/Menu";
import { MenuDivider } from "../../Menu/MenuDivider";
import { MenuItem, MenuItemWithSubmenu } from "../../Menu/MenuItem";
import type { MergeCellsOperation } from "../../Toolbar/Toolbar";

// The merge operations of the toolbar's merge menu
export type MergeOperation = MergeCellsOperation;

export type ClearOperation = "contents" | "formatting" | "all";

// The selection the menu acts on, normalized: start <= end
export interface CellMenuSelection {
  rowStart: number;
  rowEnd: number;
  columnStart: number;
  columnEnd: number;
  // column names of columnStart and columnEnd, like "C"
  columnStartName: string;
  columnEndName: string;
}

interface CellContextMenuProps {
  open: boolean;
  onClose: () => void;
  anchorPosition: { x: number; y: number } | null;
  selection: CellMenuSelection;
  canEdit: boolean;
  hasLink: boolean;
  hasNote: boolean;
  // More than one cell is selected, so the selection can be merged
  canMerge: boolean;
  // The selection touches merged cells, so it can be unmerged
  canUnmerge: boolean;
  frozenRows: number;
  frozenColumns: number;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onPasteValues: () => void;
  onPasteFormat: () => void;
  onInsertRowsAbove: () => void;
  onInsertRowsBelow: () => void;
  onInsertColumnsLeft: () => void;
  onInsertColumnsRight: () => void;
  onDeleteRows: () => void;
  onDeleteColumns: () => void;
  onClear: (operation: ClearOperation) => void;
  onEditLink: () => void;
  onDeleteLink: () => void;
  onEditNote: () => void;
  onDeleteNote: () => void;
  onMerge: (operation: MergeOperation) => void;
  onHideRows: () => void;
  onHideColumns: () => void;
  onResizeRows: () => void;
  onResizeColumns: () => void;
  onFreezeRows: () => void;
  onFreezeColumns: () => void;
  onUnfreeze: () => void;
  onDefineNamedRange: () => void;
  onConditionalFormatting: () => void;
}

// The cell menu: Google Sheets' items where IronCalc has the feature, in its
// order, then IronCalc's other operations on the selection.
const CellContextMenu = (properties: CellContextMenuProps) => {
  const { t } = useTranslation();
  const p = properties;
  const { rowStart, rowEnd, columnStart, columnEnd } = p.selection;
  const { columnStartName, columnEndName } = p.selection;
  const rowCount = rowEnd - rowStart + 1;
  const columnCount = columnEnd - columnStart + 1;

  if (!p.anchorPosition) {
    return null;
  }

  if (!p.canEdit) {
    return (
      <Menu open={p.open} onClose={p.onClose} anchorPosition={p.anchorPosition}>
        <MenuItem icon={<Copy />} onClick={p.onCopy}>
          {t("context_menu.cell.copy")}
        </MenuItem>
      </Menu>
    );
  }

  return (
    <Menu open={p.open} onClose={p.onClose} anchorPosition={p.anchorPosition}>
      <MenuItem icon={<Scissors />} onClick={p.onCut}>
        {t("context_menu.cell.cut")}
      </MenuItem>
      <MenuItem icon={<Copy />} onClick={p.onCopy}>
        {t("context_menu.cell.copy")}
      </MenuItem>
      <MenuItem icon={<Clipboard />} onClick={p.onPaste}>
        {t("context_menu.cell.paste")}
      </MenuItem>
      <MenuItemWithSubmenu
        icon={<ClipboardPaste />}
        submenu={
          <>
            <MenuItem onClick={p.onPasteValues}>
              {t("context_menu.cell.paste_values")}
            </MenuItem>
            <MenuItem onClick={p.onPasteFormat}>
              {t("context_menu.cell.paste_format")}
            </MenuItem>
          </>
        }
      >
        {t("context_menu.cell.paste_special")}
      </MenuItemWithSubmenu>

      <MenuDivider />

      <MenuItem icon={<ArrowUp />} onClick={p.onInsertRowsAbove}>
        {t("context_menu.row_header.insert_rows_above", { count: rowCount })}
      </MenuItem>
      <MenuItem icon={<ArrowDown />} onClick={p.onInsertRowsBelow}>
        {t("context_menu.row_header.insert_rows_below", { count: rowCount })}
      </MenuItem>
      <MenuItem icon={<ArrowLeft />} onClick={p.onInsertColumnsLeft}>
        {t("context_menu.column_header.insert_columns_before", {
          count: columnCount,
        })}
      </MenuItem>
      <MenuItem icon={<ArrowRight />} onClick={p.onInsertColumnsRight}>
        {t("context_menu.column_header.insert_columns_after", {
          count: columnCount,
        })}
      </MenuItem>
      <MenuItem icon={<Trash2 />} onClick={p.onDeleteRows}>
        {rowCount === 1
          ? t("context_menu.row_header.delete_row", { row: rowStart })
          : t("context_menu.row_header.delete_rows", { rowStart, rowEnd })}
      </MenuItem>
      <MenuItem icon={<Trash2 />} onClick={p.onDeleteColumns}>
        {columnCount === 1
          ? t("context_menu.column_header.delete_column", {
              column: columnStartName,
            })
          : t("context_menu.column_header.delete_columns", {
              columnStart: columnStartName,
              columnEnd: columnEndName,
            })}
      </MenuItem>
      <MenuItemWithSubmenu
        icon={<Eraser />}
        submenu={
          <>
            <MenuItem onClick={() => p.onClear("contents")}>
              {t("context_menu.cell.clear_contents")}
            </MenuItem>
            <MenuItem onClick={() => p.onClear("formatting")}>
              {t("toolbar.clear_formatting")}
            </MenuItem>
            <MenuItem onClick={() => p.onClear("all")}>
              {t("context_menu.cell.clear_all")}
            </MenuItem>
          </>
        }
      >
        {t("context_menu.cell.clear")}
      </MenuItemWithSubmenu>

      <MenuDivider />

      <MenuItem icon={<Link />} onClick={p.onEditLink}>
        {p.hasLink ? t("link_tooltip.edit") : t("toolbar.add_link")}
      </MenuItem>
      {p.hasLink ? (
        <MenuItem icon={<Link2Off />} onClick={p.onDeleteLink}>
          {t("link_tooltip.break")}
        </MenuItem>
      ) : null}
      <MenuItem icon={<StickyNote />} onClick={p.onEditNote}>
        {p.hasNote
          ? t("context_menu.cell.edit_note")
          : t("context_menu.cell.add_note")}
      </MenuItem>
      {p.hasNote ? (
        <MenuItem icon={<StickyNoteX />} onClick={p.onDeleteNote}>
          {t("context_menu.cell.delete_note")}
        </MenuItem>
      ) : null}

      <MenuDivider />

      {p.canMerge || p.canUnmerge ? (
        <MenuItemWithSubmenu
          icon={<Merge />}
          submenu={
            <>
              {p.canMerge ? (
                <>
                  <MenuItem onClick={() => p.onMerge("merge")}>
                    {t("toolbar.merge_menu.merge")}
                  </MenuItem>
                  <MenuItem onClick={() => p.onMerge("merge_center")}>
                    {t("toolbar.merge_menu.merge_center")}
                  </MenuItem>
                  <MenuItem onClick={() => p.onMerge("merge_across")}>
                    {t("toolbar.merge_menu.merge_across")}
                  </MenuItem>
                  <MenuItem onClick={() => p.onMerge("merge_down")}>
                    {t("toolbar.merge_menu.merge_down")}
                  </MenuItem>
                </>
              ) : null}
              {p.canUnmerge ? (
                <MenuItem onClick={() => p.onMerge("unmerge")}>
                  {t("toolbar.merge_menu.unmerge")}
                </MenuItem>
              ) : null}
            </>
          }
        >
          {t("toolbar.merge_cells")}
        </MenuItemWithSubmenu>
      ) : null}
      <MenuItem icon={<EyeOff />} onClick={p.onHideRows}>
        {rowCount === 1
          ? t("context_menu.row_header.hide_row", { row: rowStart })
          : t("context_menu.row_header.hide_rows", { rowStart, rowEnd })}
      </MenuItem>
      <MenuItem icon={<EyeOff />} onClick={p.onHideColumns}>
        {columnCount === 1
          ? t("context_menu.column_header.hide_column", {
              column: columnStartName,
            })
          : t("context_menu.column_header.hide_columns", {
              columnStart: columnStartName,
              columnEnd: columnEndName,
            })}
      </MenuItem>
      <MenuItem icon={<MoveVertical />} onClick={p.onResizeRows}>
        {t("context_menu.row_header.set_row_height")}
      </MenuItem>
      <MenuItem icon={<MoveHorizontal />} onClick={p.onResizeColumns}>
        {t("context_menu.column_header.set_column_width")}
      </MenuItem>
      <MenuItemWithSubmenu
        icon={<Snowflake />}
        submenu={
          <>
            <MenuItem onClick={p.onFreezeRows}>
              {t("context_menu.row_header.freeze_rows", { row: rowStart })}
            </MenuItem>
            <MenuItem onClick={p.onFreezeColumns}>
              {t("context_menu.column_header.freeze_columns", {
                column: columnStartName,
              })}
            </MenuItem>
            {p.frozenRows > 0 || p.frozenColumns > 0 ? (
              <MenuItem onClick={p.onUnfreeze}>
                {t("context_menu.cell.unfreeze")}
              </MenuItem>
            ) : null}
          </>
        }
      >
        {t("context_menu.cell.freeze")}
      </MenuItemWithSubmenu>

      <MenuDivider />

      <MenuItemWithSubmenu
        icon={<SquareFunction />}
        submenu={
          <>
            <MenuItem icon={<Tag />} onClick={p.onDefineNamedRange}>
              {t("context_menu.cell.define_named_range")}
            </MenuItem>
            <MenuItem
              icon={<PaintRoller />}
              onClick={p.onConditionalFormatting}
            >
              {t("toolbar.conditional_formatting")}
            </MenuItem>
          </>
        }
      >
        {t("context_menu.cell.more_actions")}
      </MenuItemWithSubmenu>
    </Menu>
  );
};

export default CellContextMenu;
