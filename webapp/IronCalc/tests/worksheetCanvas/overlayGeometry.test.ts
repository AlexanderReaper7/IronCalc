// Unit tests for the geometry of the DOM overlays (the selection outline,
// the area outline and the autofill handle). These are HTML elements laid on
// top of the canvas, so the screenshot tests never see them; here the real
// WorksheetCanvas renders against the fake DOM and the tests assert the
// exact pixel geometry it assigned to the overlay styles.
//
// The interesting cases are frozen panes: overlays must be laid out in
// *screen* geometry, where rows/columns scrolled behind the frozen separator
// take no space, not in sheet geometry (the plain sum of cell sizes).

import { expect, test } from "vitest";
import {
  headerColumnWidth,
  headerRowHeight,
  LAST_COLUMN,
  LAST_ROW,
} from "../../src/components/WorksheetCanvas/constants";
import { newModel, renderWorksheet } from "./harness";

// Default cell geometry (base/src/constants.rs) and the frozen-pane
// separator (worksheetCanvas.ts, not importable here: that module needs the
// fake DOM installed before it loads)
const COLUMN_WIDTH = 90;
const ROW_HEIGHT = 25;
const FROZEN_SEPARATOR = 3;

const px = (value: string): number => {
  expect(value).toMatch(/^-?[\d.]+px$/);
  return Number(value.slice(0, -2));
};

const rect = (element: HTMLElement) => ({
  left: px(element.style.left),
  top: px(element.style.top),
  width: px(element.style.width),
  height: px(element.style.height),
});

// The handle div is centered on its corner: left = x - width / 2 - 1, and
// the fake getBoundingClientRect reports a 6x6 handle
const handleCorner = (element: HTMLElement) => ({
  x: px(element.style.left) + 4,
  y: px(element.style.top) + 4,
});

function cell(row: number, column: number, width = 1, height = 1) {
  return { sheet: 0, row, column, width, height };
}

// Screen x of the left edge of a column in the top-left pane
const columnX = (column: number): number =>
  headerColumnWidth + (column - 1) * COLUMN_WIDTH;
// Screen y of the top edge of a row in the top-left pane
const rowY = (row: number): number => headerRowHeight + (row - 1) * ROW_HEIGHT;

test("a single selected cell: outline hugs the cell, handle on its corner", async () => {
  const model = await newModel();
  model.setSelectedCell(2, 2);
  const { worksheet } = await renderWorksheet(model);

  const [x, y] = [columnX(2), rowY(2)];
  expect(rect(worksheet.cellOutline)).toEqual({
    left: x - 1,
    top: y - 1,
    width: COLUMN_WIDTH - 1,
    height: ROW_HEIGHT - 1,
  });
  // A single cell shows no area outline
  expect(worksheet.areaOutline.style.visibility).toBe("hidden");
  expect(handleCorner(worksheet.cellOutlineHandle)).toEqual({
    x: x + COLUMN_WIDTH,
    y: y + ROW_HEIGHT,
  });
});

test("a selected merged cell: outline covers the merged rectangle", async () => {
  const model = await newModel();
  // B2:C3 merged, 2 columns by 2 rows
  model.mergeCells(cell(2, 2, 2, 2));
  model.setSelectedCell(2, 2);
  const { worksheet } = await renderWorksheet(model);

  const [x, y] = [columnX(2), rowY(2)];
  expect(rect(worksheet.cellOutline)).toEqual({
    left: x - 1,
    top: y - 1,
    width: 2 * COLUMN_WIDTH - 1,
    height: 2 * ROW_HEIGHT - 1,
  });
  expect(worksheet.areaOutline.style.visibility).toBe("hidden");
  expect(handleCorner(worksheet.cellOutlineHandle)).toEqual({
    x: x + 2 * COLUMN_WIDTH,
    y: y + 2 * ROW_HEIGHT,
  });
});

// Five frozen rows, scrolled down so rows 6-14 are hidden behind the frozen
// separator, and B3:B18 merged across the frozen line. On screen the merged
// cell spans rows 3-5 (frozen), the separator and rows 15-18 — NOT the sum
// of its sixteen row heights.
test("a merged cell across the frozen line: outline spans only the visible rows", async () => {
  const model = await newModel();
  model.setFrozenRowsCount(0, 5);
  model.setTopLeftVisibleCell(15, 1);
  model.mergeCells(cell(3, 2, 1, 16));
  model.setSelectedCell(3, 2);
  const { worksheet } = await renderWorksheet(model, { height: 300 });

  const [x, y] = [columnX(2), rowY(3)];
  // Rows 3-5 in the frozen pane, then the separator, then rows 15-18
  const heightOnScreen = 3 * ROW_HEIGHT + FROZEN_SEPARATOR + 4 * ROW_HEIGHT;
  expect(rect(worksheet.cellOutline)).toEqual({
    left: x - 1,
    top: y - 1,
    width: COLUMN_WIDTH - 1,
    height: heightOnScreen - 1,
  });
  expect(worksheet.areaOutline.style.visibility).toBe("hidden");
  // The handle sits on the on-screen bottom-right corner of B18
  expect(handleCorner(worksheet.cellOutlineHandle)).toEqual({
    x: x + COLUMN_WIDTH,
    y: y + heightOnScreen,
  });
});

// Six frozen rows, scrolled down to row 35, and B4:B34 merged: the merge
// starts in the frozen pane and disappears into the hidden band behind the
// separator. Selecting it must show the outline over the frozen part (rows
// 4-6 down to the separator), with no bottom edge (the cell continues under
// the separator) and no handle (its corner is not on screen).
test("a merged cell reaching from the frozen pane into the hidden band keeps its outline", async () => {
  const model = await newModel();
  model.setFrozenRowsCount(0, 6);
  model.setTopLeftVisibleCell(35, 1);
  model.mergeCells(cell(4, 2, 1, 31));
  model.setSelectedCell(4, 2);
  const { worksheet } = await renderWorksheet(model);

  const [x, y] = [columnX(2), rowY(4)];
  // Rows 4-6 in the frozen pane plus the separator the merge vanishes under
  const heightOnScreen = 3 * ROW_HEIGHT + FROZEN_SEPARATOR;
  expect(worksheet.cellOutline.style.visibility).toBe("visible");
  expect(rect(worksheet.cellOutline)).toEqual({
    left: x - 1,
    top: y - 1,
    width: COLUMN_WIDTH - 1,
    height: heightOnScreen - 1,
  });
  expect(worksheet.cellOutline.style.borderBottom).toBe("none");
  expect(worksheet.cellOutline.style.borderRight).toBe("");
  expect(worksheet.cellOutlineHandle.style.visibility).toBe("hidden");
});

// A merged cell that lies entirely in the hidden band shows no outline at all
test("a merged cell entirely scrolled behind the frozen pane hides its outline", async () => {
  const model = await newModel();
  model.setFrozenRowsCount(0, 6);
  model.setTopLeftVisibleCell(35, 1);
  model.mergeCells(cell(10, 2, 1, 11));
  model.setSelectedCell(10, 2);
  const { worksheet } = await renderWorksheet(model);

  expect(worksheet.cellOutline.style.visibility).toBe("hidden");
  expect(worksheet.cellOutlineHandle.style.visibility).toBe("hidden");
});

// The same geometry for a plain (unmerged) selection B3:B18 across the
// frozen line, drawn by the area outline
test("a selected area across the frozen line: area outline spans only the visible rows", async () => {
  const model = await newModel();
  model.setFrozenRowsCount(0, 5);
  model.setTopLeftVisibleCell(15, 1);
  model.setSelectedCell(3, 2);
  model.setSelectedRange(3, 2, 18, 2);
  const { worksheet } = await renderWorksheet(model, { height: 300 });

  const [x, y] = [columnX(2), rowY(3)];
  const heightOnScreen = 3 * ROW_HEIGHT + FROZEN_SEPARATOR + 4 * ROW_HEIGHT;
  expect(worksheet.areaOutline.style.visibility).toBe("visible");
  expect(rect(worksheet.areaOutline)).toEqual({
    left: x,
    top: y,
    width: COLUMN_WIDTH - 1,
    height: heightOnScreen - 1,
  });
  expect(handleCorner(worksheet.cellOutlineHandle)).toEqual({
    x: x + COLUMN_WIDTH,
    y: y + heightOnScreen,
  });
});

test("a grid bounded by its content ends past the last value and grows with the selection", async () => {
  const model = await newModel();
  model.setUserInput(0, 3, 3, "C3");
  model.setUserInput(0, 5, 2, "B5");
  const options = { width: 800, height: 600, sheetExtent: "content" as const };
  let { worksheet } = await renderWorksheet(model, options);
  // the last value is in row 5 and column C, plus the margins
  expect([worksheet.lastRow, worksheet.lastColumn]).toEqual([15, 6]);
  // the scroll area ends where the grid does
  const [width, height] = worksheet.getSheetDimensions();
  expect(height).toBe(headerRowHeight + 15 * ROW_HEIGHT);
  expect(width).toBe(headerColumnWidth + 6 * COLUMN_WIDTH);
  // nothing below or to the right of the grid is a cell
  expect(
    worksheet.getCellByCoordinates(headerColumnWidth + 50, height + 10),
  ).toBeNull();
  expect(
    worksheet.getCellByCoordinates(width + 10, headerRowHeight + 10),
  ).toBeNull();
  expect(
    worksheet.getCellByCoordinates(
      headerColumnWidth + 150,
      headerRowHeight + 30,
    ),
  ).toEqual({ row: 2, column: 2 });

  // moving the selection past the end grows the grid
  model.setSelectedCell(20, 9);
  ({ worksheet } = await renderWorksheet(model, options));
  expect([worksheet.lastRow, worksheet.lastColumn]).toEqual([30, 12]);
});

test("an unbounded grid runs to the last row and column", async () => {
  const model = await newModel();
  model.setUserInput(0, 3, 3, "C3");
  const { worksheet } = await renderWorksheet(model);
  expect([worksheet.lastRow, worksheet.lastColumn]).toEqual([
    LAST_ROW,
    LAST_COLUMN,
  ]);
});
