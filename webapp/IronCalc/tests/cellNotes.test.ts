import { readFile } from "node:fs/promises";
import { initSync } from "@ironcalc/wasm";
import { beforeAll, expect, test } from "vitest";
import { parseCellReference } from "../src/components/WorksheetCanvas/cellNotes";

beforeAll(async () => {
  const buffer = await readFile("node_modules/@ironcalc/wasm/wasm_bg.wasm");
  initSync({ module: buffer });
});

test("cell references", () => {
  expect(parseCellReference("A1")).toEqual([1, 1]);
  expect(parseCellReference("AB12")).toEqual([12, 28]);
  expect(parseCellReference("XFD1048576")).toEqual([1048576, 16384]);
});

test("what is not a cell reference", () => {
  expect(parseCellReference("")).toBeNull();
  expect(parseCellReference("A")).toBeNull();
  expect(parseCellReference("12")).toBeNull();
  expect(parseCellReference("a1")).toBeNull();
  expect(parseCellReference("Sheet1!A1")).toBeNull();
});
