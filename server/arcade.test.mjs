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
        await call(p, "profile", { name: "Player_" + p, score: 2 });
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
        name: "Player_a",
        avatar: "orbit",
        score: 22,
      });
      assert.equal(
        (
          await call("a", "profile", {
            name: "Player_a",
            score: 10,
            avatar: "invalid",
          })
        ).status,
        400,
      );
      await call("a", "profile", {
        name: "Player_a",
        score: 10,
        avatar: "fox",
      });
      assert.equal((await call("a", "leaders")).data[0].avatar, "fox");
      await call("a", "profile", { name: "Player_a", score: 6 });
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
        await f.call(p, "profile", { name: "Player_" + p, score: 0 });
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
    await f.call(p, "profile", { name: "Player_" + p, score: 0 });
  const path =
    "rooms/" + (await f.call("a", "rooms", { game: "memory" })).data.code;
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
    await f.call(p, "profile", { name: "Player_" + p, score: 0 });
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

test('usernames validate, reserve atomically and compare without case',async()=>{
 const f=fixture();
 for(const name of ['', 'ab', 'a'.repeat(16),'Bad Name','bad-name','éclair'])assert.equal((await f.call('a','profile',{name,score:0})).status,400,name);
 const results=await Promise.all([f.call('a','profile',{name:'Ali',score:5}),f.call('b','profile',{name:'aLI',score:9})]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(results.find(r=>r.status===409).data.error,'Username already taken. Try another.');
 const owner=results[0].status===200?'a':'b',other=owner==='a'?'b':'a';
 assert.equal((await f.call(other,'usernames?name=ALI')).data.available,false);assert.equal((await f.call(owner,'usernames?name=ALI')).data.available,true);
 assert.equal((await f.call(owner,'profile',{name:'ALI',score:1})).status,200);assert((await f.call(owner,'leaders')).data[0].score>=5);
 assert.equal((await f.call('c','rooms',{game:'snake'})).status,401);
});
test('legacy profiles retain scores and their owner can reserve the legacy name',async()=>{
 const f=fixture();await f.call('a','profile',{name:'Legacy',score:77});await f.call('b','profile',{name:'Legacy2',score:6});
 await f.db.prepare("UPDATE arcade_players SET username_key=NULL WHERE name='Legacy'").run();
 assert.equal((await f.call('c','profile',{name:'legacy',score:0})).status,409);
 assert.equal((await f.call('a','profile',{name:'Legacy',score:10})).status,200);assert.equal((await f.call('a','leaders')).data[0].score,77);
});
test('quick-match pairs two players, isolates games and expires abandoned searches',async()=>{
 const f=fixture();for(const p of ['a','b','c'])await f.call(p,'profile',{name:'Match_'+p,score:0});
 const a=await f.call('a','quick-match',{game:'snake'});assert.equal((await f.call('a','quick-match',{game:'snake'})).data.code,a.data.code);
 assert.equal((await f.call('a','quick-match',{game:'gravity-flip'})).status,409);
 const b=await f.call('b','quick-match',{game:'snake'});assert.equal(b.data.code,a.data.code);assert.equal((await f.call('b','rooms/'+b.data.code)).data.guest,'Match_b');
 const c=await f.call('c','quick-match',{game:'snake'});assert.notEqual(c.data.code,a.data.code);f.advance(46000);assert.equal((await f.call('c','rooms/'+c.data.code)).status,404);
 assert.equal((await f.call('c','quick-match',{game:'snake'})).status,200);
});
for(const game of ['snake','gravity-flip'])test(game+': authoritative live input, shared snapshots, disconnect and one award',async()=>{
 const f=fixture();for(const p of ['a','b','c'])await f.call(p,'profile',{name:'Live_'+p,score:0});
 const path='rooms/'+(await f.call('a','rooms',{game})).data.code;
 await f.call('b',path+'/join',{});assert.equal((await f.call('a',path+'/start',{})).status,409);
 await f.call('a',path+'/ready',{});await f.call('b',path+'/ready',{});await f.call('a',path+'/start',{});
 f.advance(3100);assert.equal((await f.call('c',path+'/live',{commands:[]})).status,403);assert.equal((await f.call('a',path+'/progress',{score:999,done:true})).status,409);
 const command=game==='snake'?{seq:1,turn:[0,-1]}:{seq:1,flip:true};
 const [a,b]=await Promise.all([f.call('a',path+'/live',{commands:[command]}),f.call('b',path+'/live',{commands:[]})]);assert.equal(a.status,200);assert.equal(b.status,200);
 f.advance(240);const shared=(await f.call('b',path+'/live',{commands:[]})).data;
 assert.equal(shared.live.players[0].seq,1);if(game==='snake')assert.equal(shared.live.players[0].direction[1],-1);else assert(shared.live.players[0].y<shared.live.players[1].y);
 assert.deepEqual((await f.call('a',path)).data.live,shared.live);
 f.advance(11000);const ended=(await f.call('a',path+'/live',{commands:[]})).data;assert.equal(ended.result,'X');assert.equal(ended.live.reason,'disconnect');
 await f.call('a',path+'/live',{commands:[command]});assert.equal((await f.call('a','leaders')).data[0].score,20);
});
test('simultaneous quick-match arrivals converge on one shared room',async()=>{
 const f=fixture();for(const p of ['a','b'])await f.call(p,'profile',{name:'Queue_'+p,score:0});
 await Promise.all(['a','b'].map(p=>f.call(p,'quick-match',{game:'snake'})));
 let rooms=(await f.db.prepare('SELECT * FROM arcade_rooms').all()).results;
 for(const p of ['a','b'])if(rooms.filter(r=>r.guest===null).length===2){await f.call(p,'quick-match',{game:'snake'});rooms=(await f.db.prepare('SELECT * FROM arcade_rooms').all()).results;}
 assert.equal(rooms.length,1);assert(rooms[0].guest);assert.notEqual(rooms[0].host,rooms[0].guest);
});
