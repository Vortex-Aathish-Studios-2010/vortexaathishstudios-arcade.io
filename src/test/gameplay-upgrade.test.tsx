import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import { gravityDifficulty, RUNNER_SIZE } from "@/lib/gravityPhysics";
import { advanceSnake } from "@/lib/snakePhysics";
import { rotatePiece, flipPiece, placementAt } from "@/lib/konoodlePlacement";
import solution from "@/lib/konoodleSolution.json";
import { seededRandom } from "@/lib/matchPlay";
import { roomGames } from "@/lib/roomCatalog.mjs";
import { challengeComponents } from "@/components/ChallengeRound";
it("offers every library game with a real multiplayer component", () => {
  expect(roomGames).toHaveLength(17);
  for (const g of roomGames.filter((g) => g.mode === "challenge"))
    expect(challengeComponents[g.id]).toBeDefined();
});
it("scales Gravity Flip with score without impossible clearance or travel times", () => {
  for (let s = 0; s < 5000; s += 25) {
    const a = gravityDifficulty(s),
      b = gravityDifficulty(s + 25);
    expect(b.speed).toBeGreaterThan(a.speed);
    expect(b.gap).toBeLessThanOrEqual(a.gap);
    expect(a.gap).toBeGreaterThan(RUNNER_SIZE);
    expect((a.spacing - 54) / a.speed).toBeGreaterThan(0.74);
  }
});
it("allows Snake to enter the moving tail but rejects a body collision", () => {
  expect(
    advanceSnake(
      [
        [1, 1],
        [1, 2],
        [0, 2],
        [0, 1],
      ],
      [-1, 0],
      [3, 3],
      5,
      5,
    ).collision,
  ).toBe(false);
  expect(
    advanceSnake(
      [
        [1, 1],
        [1, 2],
        [0, 2],
        [0, 1],
      ],
      [0, 1],
      [3, 3],
      5,
      5,
    ).collision,
  ).toBe(true);
});
it("keeps Konoodle transforms and placements valid, including a full solvable board", () => {
  const cells = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
  ];
  expect(rotatePiece(rotatePiece(rotatePiece(rotatePiece(cells))))).toEqual(
    cells,
  );
  expect(flipPiece(flipPiece(cells))).toEqual(cells);
  expect(placementAt(cells, 0, 0, [[1, 0]])).toBeNull();
  expect(placementAt(cells, 4, 10, [])).toBeNull();
  const filled = solution.flatMap((p) => p.cells.map((c) => c.join(",")));
  expect(new Set(filled).size).toBe(55);
});
it("gives both players identical random sequences", () => {
  const a = seededRandom("ABC234"),
    b = seededRandom("ABC234");
  for (let i = 0; i < 100; i++) expect(a()).toBe(b());
});
describe("chess rules", () => {
  it("handles castling, en passant and promotion", () => {
    const c = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    c.move("O-O");
    expect(c.get("f1")?.type).toBe("r");
    const ep = new Chess();
    for (const m of ["e4", "a6", "e5", "d5", "exd6"]) ep.move(m);
    expect(ep.get("d5")).toBeUndefined();
    const p = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
    p.move({ from: "a7", to: "a8", promotion: "n" });
    expect(p.get("a8")?.type).toBe("n");
  });
  it("detects repetition with complete move history", () => {
    const c = new Chess();
    for (let i = 0; i < 2; i++)
      for (const m of ["Nf3", "Nf6", "Ng1", "Ng8"]) c.move(m);
    const restored = new Chess();
    restored.loadPgn(c.pgn());
    expect(restored.isThreefoldRepetition()).toBe(true);
  });
});
