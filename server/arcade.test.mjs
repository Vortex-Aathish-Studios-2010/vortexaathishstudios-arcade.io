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
      assert.equal((await call("a", "profile", {name:"Player a", score:10, avatar:"invalid"})).status,400);
      await call("a", "profile", { name: "Player a", score: 10, avatar:"fox" });
      assert.equal((await call("a", "leaders")).data[0].avatar,"fox");
      await call("a", "profile", { name: "Player a", score: 6 });
      assert.equal((await call("b", "leaders")).data[0].score, 30);
      await call("b", path + "/leave", {});
      assert.equal((await call("a", path)).status, 404);
    },
  );
}
