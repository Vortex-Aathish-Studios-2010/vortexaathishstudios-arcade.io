import { test } from "node:test";
import assert from "node:assert/strict";
import { arcade } from "./arcade.mjs";
import { openArcadeDB } from "./local-db.mjs";

for (const [game, moves] of [
  ["trio", [0, 3, 1, 4, 2]],
  ["four", [0, 1, 0, 1, 0, 1, 0]],
]) {
  test(
    game + ": join by code, enforce turns, update rankings once",
    async () => {
      const db = openArcadeDB();
      const call = async (player, path, body) => {
        const response = await arcade(
          new Request("https://example.test/api/arcade/" + path, {
            method: body ? "POST" : "GET",
            headers: { authorization: "Bearer " + player.repeat(64) },
            body: body ? JSON.stringify(body) : undefined,
          }),
          db,
        );
        return { status: response.status, data: await response.json() };
      };
      for (const p of ["a", "b", "c"])
        await call(p, "profile", { name: "Player " + p, score: 2 });
      const {
        data: { code },
      } = await call("a", "rooms", { game });
      assert.match(code, /^[A-Z2-9]{6}$/);
      const path = "rooms/" + code;
      const joined = await call("b", path + "/join", {});
      assert.equal(joined.data.me, "O");
      assert.equal((await call("c", path + "/join", {})).status, 409);
      assert.equal((await call("c", path)).status, 403);
      let state = joined.data;
      assert.equal(
        (await call("b", path + "/move", { cell: 0, board: state.board }))
          .status,
        409,
      );
      for (const [i, cell] of moves.entries()) {
        const previous = state.board;
        const player = i % 2 ? "b" : "a";
        const moved = await call(player, path + "/move", {
          cell,
          board: previous,
        });
        assert.equal(moved.status, 200);
        state = moved.data;
        assert.equal(
          (await call(player, path + "/move", { cell, board: previous }))
            .status,
          409,
        );
        assert.equal(
          (await call(i % 2 ? "a" : "b", path)).data.board,
          state.board,
        );
      }
      assert.equal(state.result, "X");
      assert.deepEqual((await call("a", "leaders")).data[0], {
        name: "Player a",
        avatar: "orbit",
        score: 22,
      });
      assert.equal(
        (
          await call("a", "profile", {
            name: "Player a",
            score: 10,
            avatar: "invalid",
          })
        ).status,
        400,
      );
      await call("a", "profile", {
        name: "Player a",
        score: 10,
        avatar: "fox",
      });
      assert.equal((await call("a", "leaders")).data[0].avatar, "fox");
      await call("a", "profile", { name: "Player a", score: 6 });
      assert.equal((await call("b", "leaders")).data[0].score, 30);
      await call("b", path + "/leave", {});
      assert.equal((await call("a", path)).status, 404);
    },
  );
}

import { roomGames } from "../src/lib/roomCatalog.mjs";
function fixture() {
  const db = openArcadeDB();
  let now = Date.now();
  return {
    db,
    advance(ms) {
      now += ms;
    },
    async call(player, path, body) {
      const r = await arcade(
        new Request("https://example.test/api/arcade/" + path, {
          method: body ? "POST" : "GET",
          headers: { authorization: "Bearer " + player.repeat(64) },
          body: body ? JSON.stringify(body) : undefined,
        }),
        db,
        now,
      );
      return { status: r.status, data: await r.json() };
    },
  };
}
for (const game of roomGames.filter((g) => g.mode === "challenge"))
  test(
    game.id +
      ": synchronized room, live scores, immutable finish and one award",
    async () => {
      const f = fixture();
      for (const p of ["a", "b", "c"])
        await f.call(p, "profile", { name: "Player " + p, score: 0 });
      const created = await f.call("a", "rooms", { game: game.id });
      assert.equal(created.status, 200);
      const path = "rooms/" + created.data.code;
      assert.equal((await f.call("a", path + "/start", {})).status, 409);
      await f.call("b", path + "/join", {});
      assert.equal((await f.call("c", path)).status, 403);
      await f.call("a", path + "/ready", {});
      await f.call("b", path + "/ready", {});
      assert.equal((await f.call("b", path + "/start", {})).status, 409);
      const start = await f.call("a", path + "/start", {});
      assert.equal(start.data.ends - start.data.starts, game.seconds * 1000);
      assert.equal(
        (await f.call("a", path + "/progress", { score: 20, done: false }))
          .status,
        409,
      );
      assert.equal((await f.call("a", path + "/start", {})).status, 409);
      f.advance(3100);
      assert.equal(
        (await f.call("a", path + "/progress", { score: -1, done: false }))
          .status,
        400,
      );
      await f.call("a", path + "/progress", { score: 40, done: false });
      assert.equal((await f.call("b", path)).data.hostScore, 40);
      await f.call("a", path + "/progress", { score: 30, done: true });
      await f.call("a", path + "/progress", { score: 999, done: true });
      assert.equal((await f.call("b", path)).data.hostScore, 40);
      const result = await f.call("b", path + "/progress", {
        score: 20,
        done: true,
      });
      assert.equal(result.data.result, "X");
      await f.call("b", path + "/progress", { score: 900, done: true });
      assert.equal((await f.call("a", "leaders")).data[0].score, 20);
    },
  );
test("challenge deadline finalizes when one player disconnects", async () => {
  const f = fixture();
  for (const p of ["a", "b"])
    await f.call(p, "profile", { name: "Player " + p, score: 0 });
  const path =
    "rooms/" + (await f.call("a", "rooms", { game: "snake" })).data.code;
  await f.call("b", path + "/join", {});
  await f.call("a", path + "/ready", {});
  await f.call("b", path + "/ready", {});
  await f.call("a", path + "/start", {});
  f.advance(3100);
  await f.call("b", path + "/progress", { score: 10, done: false });
  f.advance(180000);
  assert.equal((await f.call("a", path)).data.result, "O");
  assert.equal((await f.call("b", "leaders")).data[0].score, 20);
});
test("online chess enforces legal turns and persists checkmate", async () => {
  const f = fixture();
  for (const p of ["a", "b"])
    await f.call(p, "profile", { name: "Player " + p, score: 0 });
  const path =
    "rooms/" + (await f.call("a", "rooms", { game: "chess" })).data.code;
  let state = (await f.call("b", path + "/join", {})).data;
  assert.equal(
    (
      await f.call("b", path + "/move", {
        from: "e7",
        to: "e5",
        board: state.board,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await f.call("a", path + "/move", {
        from: "e2",
        to: "e5",
        board: state.board,
      })
    ).status,
    400,
  );
  for (const [i, [from, to]] of [
    ["f2", "f3"],
    ["e7", "e5"],
    ["g2", "g4"],
    ["d8", "h4"],
  ].entries()) {
    const r = await f.call(i % 2 ? "b" : "a", path + "/move", {
      from,
      to,
      board: state.board,
    });
    assert.equal(r.status, 200);
    state = r.data;
  }
  assert.equal(state.result, "O");
  assert.equal((await f.call("b", "leaders")).data[0].score, 20);
  assert.equal(
    (
      await f.call("a", path + "/move", {
        from: "e2",
        to: "e4",
        board: state.board,
      })
    ).status,
    409,
  );
});
