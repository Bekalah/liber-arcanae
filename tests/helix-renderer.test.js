/**
 * Auto-generated unit tests for helix-renderer.mjs
 * Detected testing framework: Jest
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import { renderHelix } from "../src/helix-renderer.mjs";

const W = 900;
const H = 600;

function createMockCtx(w, h) {
  const ops = [];
  const state = {};
  const ctx = { operations: ops, canvas: { width: w, height: h } };

  const defineProp = (key) => Object.defineProperty(ctx, key, {
    configurable: true, enumerable: true,
    get: () => state[key],
    set: (v) => { state[key] = v; ops.push({ op: "set", key, value: v }); }
  });
  ["fillStyle","strokeStyle","lineWidth","lineCap","lineJoin"].forEach(defineProp);

  ["save","restore","beginPath","stroke","fill"].forEach(name => {
    ctx[name] = () => ops.push({ op: name });
  });

  ctx.clearRect = (x,y,w,h) => ops.push({ op:"clearRect", x,y,w,h });
  ctx.fillRect  = (x,y,w,h) => ops.push({ op:"fillRect",  x,y,w,h });
  ctx.arc       = (x,y,r,s,e) => ops.push({ op:"arc", x,y,r,start:s,end:e });
  ctx.moveTo    = (x,y) => ops.push({ op:"moveTo", x,y });
  ctx.lineTo    = (x,y) => ops.push({ op:"lineTo", x,y });

  return ctx;
}

const NUM = Object.freeze({
  THREE: 3,
  SEVEN: 7,
  NINE: 9,
  ELEVEN: 11,
  TWENTYTWO: 22,
  THIRTYTHREE: 33,
  NINETYNINE: 99,
  ONEFORTYFOUR: 144
});

const palette = {
  bg: "#0f0f13",
  layers: ["#6699cc", "#88cc88", "#ccb366", "#cc6699"]
};

const defaultOpts = Object.freeze({ width: W, height: H, palette, NUM });

const count = (ops, name) => ops.filter(o => o.op === name).length;
const findIndex = (ops, pred, from = 0) => {
  for (let i = from; i < ops.length; i++) if (pred(ops[i], i)) return i;
  return -1;
};
const sliceByLayer = (ops, color) => {
  const start = findIndex(ops, o => o.op === "set" && o.key === "strokeStyle" && o.value === color);
  if (start === -1) return [];
  const end = findIndex(ops, (o, i) => i > start && o.op === "restore");
  return end === -1 ? ops.slice(start) : ops.slice(start, end);
};

describe("renderHelix (Jest)", () => {
  let ctx;
  beforeEach(() => {
    ctx = createMockCtx(W, H);
  });

  it("renders background clear/fill once and in order", () => {
    renderHelix(ctx, defaultOpts);
    const ops = ctx.operations;
    const ci = ops.findIndex(o => o.op === "clearRect");
    const fi = ops.findIndex(o => o.op === "fillRect");
    expect(ci).toBeGreaterThan(-1);
    expect(fi).toBeGreaterThan(-1);
    expect(ci).toBeLessThan(fi);
    expect(ops[ci]).toMatchObject({ x: 0, y: 0, w: W, h: H });
    expect(ops[fi]).toMatchObject({ x: 0, y: 0, w: W, h: H });
  });

  it("uses layer stroke colors in order (vesica, tree, fibonacci, helix)", () => {
    renderHelix(ctx, defaultOpts);
    const ops = ctx.operations;
    const [vesicaColor, treeColor, fibonacciColor, helixColor] = palette.layers;
    const i1 = findIndex(ops, o => o.op === "set" && o.key === "strokeStyle" && o.value === vesicaColor);
    const i2 = findIndex(ops, o => o.op === "set" && o.key === "strokeStyle" && o.value === treeColor);
    const i3 = findIndex(ops, o => o.op === "set" && o.key === "strokeStyle" && o.value === fibonacciColor);
    const i4 = findIndex(ops, o => o.op === "set" && o.key === "strokeStyle" && o.value === helixColor);
    expect(i1).toBeGreaterThan(-1);
    expect(i2).toBeGreaterThan(-1);
    expect(i3).toBeGreaterThan(-1);
    expect(i4).toBeGreaterThan(-1);
    expect(i1).toBeLessThan(i2);
    expect(i2).toBeLessThan(i3);
    expect(i3).toBeLessThan(i4);
  });

  it("balances save/restore calls (5 each)", () => {
    renderHelix(ctx, defaultOpts);
    const ops = ctx.operations;
    expect(count(ops, "save")).toBe(5);
    expect(count(ops, "restore")).toBe(5);
  });

  it("Vesica field draws 18 arcs with 18 strokes", () => {
    renderHelix(ctx, defaultOpts);
    const opsV = sliceByLayer(ctx.operations, palette.layers[0]);
    expect(count(opsV, "arc")).toBe(18);
    expect(count(opsV, "beginPath")).toBe(18);
    expect(count(opsV, "stroke")).toBe(18);
  });

  it("Tree-of-Life draws 22 paths and 10 node circles (fills), no extra strokes", () => {
    renderHelix(ctx, defaultOpts);
    const opsT = sliceByLayer(ctx.operations, palette.layers[1]);
    expect(count(opsT, "moveTo")).toBe(22);
    expect(count(opsT, "lineTo")).toBe(22);
    expect(count(opsT, "stroke")).toBe(22);
    expect(count(opsT, "arc")).toBe(10);
    expect(count(opsT, "fill")).toBe(10);
    expect(count(opsT, "beginPath")).toBe(32);
  });

  it("Fibonacci curve draws 33 line segments with one stroke", () => {
    renderHelix(ctx, defaultOpts);
    const opsF = sliceByLayer(ctx.operations, palette.layers[2]);
    expect(count(opsF, "beginPath")).toBe(1);
    expect(count(opsF, "moveTo")).toBe(1);
    expect(count(opsF, "lineTo")).toBe(33);
    expect(count(opsF, "stroke")).toBe(1);
    expect(count(opsF, "arc")).toBe(0);
    expect(count(opsF, "fill")).toBe(0);
  });

  it("Helix lattice draws two strands plus 10 crossbars (12 strokes total)", () => {
    renderHelix(ctx, defaultOpts);
    const opsH = sliceByLayer(ctx.operations, palette.layers[3]);
    expect(count(opsH, "beginPath")).toBe(12);
    expect(count(opsH, "moveTo")).toBe(12);
    expect(count(opsH, "lineTo")).toBe(298); // 144 + 144 + 10
    expect(count(opsH, "stroke")).toBe(12);
  });

  it("Helix lattice starts at midline (first moveTo y = H/2)", () => {
    renderHelix(ctx, defaultOpts);
    const ops = ctx.operations;
    const helixColor = palette.layers[3];
    const start = ops.findIndex(o => o.op === "set" && o.key === "strokeStyle" && o.value === helixColor);
    const firstMoveTo = ops.slice(start).find(o => o.op === "moveTo");
    expect(firstMoveTo).toBeTruthy();
    expect(firstMoveTo.y).toBeCloseTo(H / 2, 6);
  });

  it("throws on invalid options (missing palette or NUM)", () => {
    const badCtx = createMockCtx(W, H);
    expect(() => renderHelix(badCtx, { width: W, height: H, NUM })).toThrow();
    const badCtx2 = createMockCtx(W, H);
    expect(() => renderHelix(badCtx2, { width: W, height: H, palette })).toThrow();
  });

  it("is idempotent: repeated renders double background calls", () => {
    renderHelix(ctx, defaultOpts);
    const c1 = count(ctx.operations, "clearRect");
    const f1 = count(ctx.operations, "fillRect");
    renderHelix(ctx, defaultOpts);
    const c2 = count(ctx.operations, "clearRect");
    const f2 = count(ctx.operations, "fillRect");
    expect(c2).toBe(c1 * 2);
    expect(f2).toBe(f1 * 2);
  });

  it("aggregate operation totals match expected values", () => {
    renderHelix(ctx, defaultOpts);
    const ops = ctx.operations;
    expect(count(ops, "beginPath")).toBe(63);
    expect(count(ops, "arc")).toBe(28);
    expect(count(ops, "stroke")).toBe(53);
    expect(count(ops, "fill")).toBe(10);
    expect(count(ops, "moveTo")).toBe(35);
    expect(count(ops, "lineTo")).toBe(353);
  });
});