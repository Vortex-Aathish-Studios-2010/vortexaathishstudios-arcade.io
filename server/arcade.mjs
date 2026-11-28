import { Chess } from "chess.js";
import {validUsername,usernameKey,USERNAME_TAKEN,USERNAME_FORMAT} from "../src/lib/usernames.mjs";
import {createLiveMatch,applyLiveInputs,advanceLive,disconnectLive} from "./live-engine.mjs";
import { roomGame } from "../src/lib/roomCatalog.mjs";
const games = { trio: [3, 3, 3], four: [7, 6, 4] };
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const hour = 3600000;

class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function outcome(board, columns, rows, target, cell, mark) {
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ]) {
    let count = 1;
    for (const dir of [-1, 1]) {
      let x = (cell % columns) + dx * dir;
      let y = Math.floor(cell / columns) + dy * dir;
      while (
        x >= 0 &&
        x < columns &&
        y >= 0 &&
        y < rows &&
        board[y * columns + x] === mark
      ) {
        count++;
        x += dx * dir;
        y += dy * dir;
      }
    }
    if (count >= target) return mark;
  }
  return board.includes(".") ? "" : "draw";
}

export async function arcade(request, db, now = Date.now()) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const headers = { "cache-control": "no-store", vary: "Origin" };
  if (
    origin === url.origin ||
    [
      "https://localhost",
      "http://localhost",
      "capacitor://localhost",
      "https://vortex-aathish-studios-2010.github.io",
    ].includes(origin)
  ) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
    headers["access-control-allow-headers"] = "authorization,content-type";
  }
  const json = (value, status = 200) =>
    Response.json(value, { status, headers });
  try {
    if (request.method === "OPTIONS") return new Response(null, { headers });
    const path = url.pathname.replace(/^\/api\/arcade\//, "");
    const write = request.method === "POST";
    if (!write && request.method !== "GET")
      throw new GameError("Method unavailable", 405);
    if (path === "leaders" && !write) {
      const { results } = await db
        .prepare(
          "SELECT CASE WHEN username_key IS NOT NULL THEN name ELSE 'Player_' || substr(id,1,8) END AS name, avatar, solo + bonus AS score FROM arcade_players WHERE solo + bonus > 0 ORDER BY score DESC, name, id LIMIT 50",
        )
        .all();
      return json(results);
    }
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      throw new GameError("Player identity required", 401);
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    const id = Array.from(new Uint8Array(hash), (x) =>
      x.toString(16).padStart(2, "0"),
    ).join("");
    const body = write
      ? await request.json().catch(() => {
          throw new GameError("Invalid request");
        })
      : {};
    async function nameOwner(name) {
      // Also protect legacy names until their original owner reserves a valid name.
      return db.prepare("SELECT id FROM arcade_players WHERE username_key=? OR (username_key IS NULL AND lower(name)=?) ORDER BY CASE WHEN username_key IS NOT NULL THEN 0 ELSE 1 END,id LIMIT 1").bind(usernameKey(name),usernameKey(name)).first();
    }
    if (path === "usernames" && !write) {
      const name=url.searchParams.get("name")?.trim();
      if(!validUsername(name))return json({available:false,message:USERNAME_FORMAT});
      const owner=await nameOwner(name);
      return json({available:!owner||owner.id===id,message:owner&&owner.id!==id?USERNAME_TAKEN:"Username available"});
    }
    if(path === "profile" && !write){
      const profile=await db.prepare("SELECT name,username_key,avatar,solo,bonus FROM arcade_players WHERE id=?").bind(id).first();
      return json({name:profile?.name||'',registered:Boolean(profile?.username_key),avatar:profile?.avatar||'orbit',score:(profile?.solo||0)+(profile?.bonus||0)});
    }
    if (path === "profile" && write) {
      const name=String(body.name||"").trim(),avatar=body.avatar??null;
      if(!validUsername(name))throw new GameError(USERNAME_FORMAT);
      if(avatar!==null&&!["orbit","fox","bot","ninja","owl","cat","dragon","skull","diver","bear"].includes(avatar))throw new GameError("Choose an available avatar.");
      if(!Number.isSafeInteger(body.score)||body.score<0||body.score>2147483647)throw new GameError("Invalid player score");
      const owner=await nameOwner(name);if(owner&&owner.id!==id)throw new GameError(USERNAME_TAKEN,409);
      try {
        await db.prepare("INSERT INTO arcade_players(id,name,username_key,solo,avatar) VALUES(?,?,?,?,COALESCE(?,'orbit')) ON CONFLICT(id) DO UPDATE SET name=excluded.name,username_key=excluded.username_key,solo=MAX(arcade_players.solo,excluded.solo),avatar=COALESCE(?,arcade_players.avatar)").bind(id,name,usernameKey(name),body.score,avatar,avatar).run();
      } catch(error) {if(String(error.message).includes("UNIQUE"))throw new GameError(USERNAME_TAKEN,409);throw error;}
      return json({ok:true,name,usernameKey:usernameKey(name)});
    }
    if ((path === "rooms" || path === "quick-match") && write) {
      if (!roomGame(body.game)) throw new GameError("Choose a game");
      if (
        !(await db
          .prepare("SELECT id FROM arcade_players WHERE id=? AND username_key IS NOT NULL")
          .bind(id)
          .first())
      )
        throw new GameError("Save your player profile first.", 401);
      const quick=path==='quick-match';
      if(quick){
        const own=await db.prepare("SELECT code,rowid FROM arcade_rooms WHERE host=? AND game=? AND matchmaking=1 AND guest IS NULL AND expires>? ORDER BY expires DESC LIMIT 1").bind(id,body.game,now).first();
        if(own){
          // Concurrent arrivals may both enqueue. Only the later queue entry
          // claims an older one, avoiding two rooms pairing each other twice.
          const earlier=await db.prepare("SELECT code FROM arcade_rooms WHERE game=? AND host!=? AND matchmaking=1 AND guest IS NULL AND expires>? AND rowid<? ORDER BY rowid LIMIT 1").bind(body.game,id,now,own.rowid).first();
          if(earlier){
            const paired=await db.prepare("UPDATE arcade_rooms SET guest=?,guest_seen=?,matchmaking=0,expires=? WHERE code=? AND guest IS NULL AND matchmaking=1 AND EXISTS(SELECT 1 FROM arcade_rooms WHERE code=? AND guest IS NULL AND matchmaking=1)").bind(id,now,now+6*hour,earlier.code,own.code).run();
            if(paired.meta.changes){await db.prepare("DELETE FROM arcade_rooms WHERE code=? AND guest IS NULL AND matchmaking=1").bind(own.code).run();return json({code:earlier.code});}
          }
          return json({code:own.code});
        }
        const otherQueue=await db.prepare("SELECT code FROM arcade_rooms WHERE host=? AND matchmaking=1 AND guest IS NULL AND expires>?").bind(id,now).first();
        if(otherQueue)throw new GameError("Close your current search before choosing another game.",409);
        for(let i=0;i<3;i++){
          const waiting=await db.prepare("SELECT code FROM arcade_rooms WHERE game=? AND host!=? AND matchmaking=1 AND guest IS NULL AND expires>? ORDER BY expires LIMIT 1").bind(body.game,id,now).first();
          if(!waiting)break;
          const claimed=await db.prepare("UPDATE arcade_rooms SET guest=?,guest_seen=?,matchmaking=0,expires=? WHERE code=? AND guest IS NULL AND matchmaking=1").bind(id,now,now+6*hour,waiting.code).run();
          if(claimed.meta.changes)return json({code:waiting.code});
        }
      }
      const board =
        body.game === "chess"
          ? new Chess().pgn()
          : games[body.game]
            ? ".".repeat(games[body.game][0] * games[body.game][1])
            : "";
      await db
        .prepare("DELETE FROM arcade_rooms WHERE expires <= ?")
        .bind(now)
        .run();
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = Array.from(
          crypto.getRandomValues(new Uint8Array(6)),
          (x) => alphabet[x % alphabet.length],
        ).join("");
        const change = await db
          .prepare(
            "INSERT OR IGNORE INTO arcade_rooms(code,game,host,board,expires,matchmaking,host_seen) VALUES(?,?,?,?,?,?,?)",
          )
          .bind(code, body.game, id, board, now + (quick ? 45000 : 6 * hour),quick?1:0,now)
          .run();
        if (change.meta.changes) return json({ code });
        if(quick){const queued=await db.prepare("SELECT code FROM arcade_rooms WHERE host=? AND matchmaking=1 AND guest IS NULL AND expires>?").bind(id,now).first();if(queued)return json({code:queued.code});}
      }
      throw new GameError("Try creating the room again", 503);
    }
    const match =
      /^rooms\/([A-Z2-9]{6})(?:\/(join|move|leave|ready|start|progress|live))?$/.exec(
        path,
      );
    if (!match || Boolean(match[2]) !== write)
      throw new GameError("Room unavailable", 404);
    const [, code, action] = match;
    const lookup = () =>
      db
        .prepare(
          "SELECT r.*, h.name AS hostName,g.name AS guestName,h.avatar AS hostAvatar,g.avatar AS guestAvatar FROM arcade_rooms r JOIN arcade_players h ON r.host=h.id LEFT JOIN arcade_players g ON r.guest=g.id WHERE r.code=? AND expires>?",
        )
        .bind(code, now)
        .first();
    let room = await lookup();
    if (!room)
      throw new GameError(
        "This room has closed or the code is incorrect.",
        404,
      );
    if (action === "join" && id !== room.host && id !== room.guest) {
      if (
        !(await db
          .prepare("SELECT id FROM arcade_players WHERE id=? AND username_key IS NOT NULL")
          .bind(id)
          .first())
      )
        throw new GameError("Save your player profile first.", 401);
      const joined = await db
        .prepare(
          "UPDATE arcade_rooms SET guest=?,guest_seen=?,matchmaking=0,expires=? WHERE code=? AND guest IS NULL",
        )
        .bind(id, now, now+6*hour, code)
        .run();
      if (!joined.meta.changes) throw new GameError("This room is full.", 409);
      room = await lookup();
    }
    const me = id === room.host ? "X" : id === room.guest ? "O" : "";
    if (!me) throw new GameError("Join using the room code.", 403);
    if (action === "leave") {
      await db
        .prepare("DELETE FROM arcade_rooms WHERE code=?")
        .bind(code)
        .run();
      return json({ ok: true });
    }
    const config = roomGame(room.game);
    const challenge = config?.mode === "challenge";
    const live = config?.mode === "live";
    if(room.matchmaking && !room.guest){await db.prepare("UPDATE arcade_rooms SET expires=?,host_seen=? WHERE code=? AND guest IS NULL").bind(now+45000,now,code).run();}
    if (
      challenge &&
      room.starts &&
      !room.result &&
      (now >= room.ends || (room.host_done && room.guest_done))
    ) {
      await db
        .prepare(
          "UPDATE arcade_rooms SET result=CASE WHEN host_score=guest_score THEN 'draw' WHEN host_score>guest_score THEN 'X' ELSE 'O' END WHERE code=? AND result='' AND (ends<=? OR (host_done=1 AND guest_done=1))",
        )
        .bind(code, now)
        .run();
      room = await lookup();
    }
    if (action === "ready") {
      if (!(challenge||live) || room.starts || room.result)
        throw new GameError("This round has already started.", 409);
      const column = me === "X" ? "host_ready" : "guest_ready";
      await db
        .prepare(
          `UPDATE arcade_rooms SET ${column}=1 WHERE code=? AND starts=0`,
        )
        .bind(code)
        .run();
      room = await lookup();
    }
    if (action === "start") {
      if (
        !(challenge||live) ||
        me !== "X" ||
        !room.guest ||
        !room.host_ready ||
        !room.guest_ready ||
        room.starts
      )
        throw new GameError(
          "Both players must be ready before the host starts.",
          409,
        );
      await db
        .prepare(
          "UPDATE arcade_rooms SET starts=?, ends=?,live_state=?,host_seen=?,guest_seen=? WHERE code=? AND starts=0 AND host_ready=1 AND guest_ready=1",
        )
        .bind(now+3000,now+3000+config.seconds*1000,live?JSON.stringify(createLiveMatch(room.game,crypto.getRandomValues(new Uint32Array(1))[0],now+3000)):"",now,now,code)
        .run();
      room = await lookup();
    }
    if(action==='live'){
      if(!live||!room.starts||!room.guest)throw new GameError('Wait for both players to start.',409);
      if(!Array.isArray(body.commands)||body.commands.length>8)throw new GameError('Invalid controls.');
      const side=me==='X'?0:1,column=side===0?'host_seen':'guest_seen';
      for(let attempt=0;attempt<5;attempt++){
        if(room.result)break;
        const state=JSON.parse(room.live_state);
        const otherSeen=side===0?room.guest_seen:room.host_seen;
        if(now-Math.max(otherSeen,room.starts)>10000)disconnectLive(state,1-side);
        // Advance old input first; new steering begins at receipt time.
        advanceLive(state,now);
        if(now>=room.starts)applyLiveInputs(state,side,body.commands);
        const result=state.result||'';
        const changed=await db.prepare(`UPDATE arcade_rooms SET live_state=?,revision=revision+1,${column}=?,host_score=?,guest_score=?,result=? WHERE code=? AND revision=? AND result=''`).bind(JSON.stringify(state),now,state.players[0].score,state.players[1].score,result,code,room.revision).run();
        room=await lookup();
        if(!room)throw new GameError('The other player closed the room.',404);
        if(changed.meta.changes||room.result)break;
        if(attempt===4)throw new GameError('Connection busy. Retrying.',409);
      }
    }
    if (action === "progress") {
      if (!challenge || !room.starts || now < room.starts)
        throw new GameError("Wait for the countdown.", 409);
      if (
        !Number.isSafeInteger(body.score) ||
        body.score < 0 ||
        body.score > 1000000 ||
        typeof body.done !== "boolean"
      )
        throw new GameError("Invalid round score.");
      const side = me === "X" ? "host" : "guest";
      // A final score is immutable. Retried submissions cannot award twice.
      await db
        .prepare(
          `UPDATE arcade_rooms SET ${side}_score=MAX(${side}_score,?), ${side}_done=? WHERE code=? AND result='' AND ${side}_done=0 AND ends>?`,
        )
        .bind(body.score, body.done ? 1 : 0, code, now)
        .run();
      await db
        .prepare(
          "UPDATE arcade_rooms SET result=CASE WHEN host_score=guest_score THEN 'draw' WHEN host_score>guest_score THEN 'X' ELSE 'O' END WHERE code=? AND result='' AND host_done=1 AND guest_done=1",
        )
        .bind(code)
        .run();
      room = await lookup();
    }
    if (action === "move" && room.game === "chess") {
      const chess = new Chess();
      chess.loadPgn(room.board);
      if (
        !room.guest ||
        room.result ||
        room.board !== body.board ||
        chess.turn() !== (me === "X" ? "w" : "b")
      )
        throw new GameError("The board has changed.", 409);
      try {
        chess.move({
          from: body.from,
          to: body.to,
          promotion: body.promotion || "q",
        });
      } catch {
        throw new GameError("That chess move is not legal.");
      }
      const result = chess.isCheckmate() ? me : chess.isDraw() ? "draw" : "";
      const changed = await db
        .prepare(
          "UPDATE arcade_rooms SET board=?, result=?, expires=? WHERE code=? AND board=? AND result=''",
        )
        .bind(chess.pgn(), result, now + 6 * hour, code, room.board)
        .run();
      if (!changed.meta.changes)
        throw new GameError("The board has changed.", 409);
      room = await lookup();
    }
    const turn = room.board.replaceAll(".", "").length % 2 ? "O" : "X";
    if (action === "move" && room.game !== "chess") {
      if (challenge||live) throw new GameError("This game uses live controls.");
      if (
        !room.guest ||
        room.result ||
        me !== turn ||
        room.board !== body.board
      )
        throw new GameError("The board has changed.", 409);
      const [cols, rows, target] = games[room.game];
      let cell = body.cell;
      if (!Number.isInteger(cell) || cell < 0 || cell >= room.board.length)
        throw new GameError("Choose an empty space.");
      if (room.game === "four") {
        cell = (rows - 1) * cols + (cell % cols);
        while (cell >= 0 && room.board[cell] !== ".") cell -= cols;
      }
      if (room.board[cell] !== ".") throw new GameError("That space is full.");
      const board = room.board.slice(0, cell) + me + room.board.slice(cell + 1);
      const result = outcome(board, cols, rows, target, cell, me);
      const changed = await db
        .prepare(
          "UPDATE arcade_rooms SET board=?, result=?, expires=? WHERE code=? AND board=?",
        )
        .bind(board, result, now + 6 * hour, code, room.board)
        .run();
      if (!changed.meta.changes)
        throw new GameError("The board has changed.", 409);
      room = await lookup();
    }
    if (!room) throw new GameError("This room has closed.", 404);
    return json({
      code,
      game: room.game,
      host: room.hostName,
      guest: room.guestName,
      board: room.board,
      result: room.result,
      me,
      hostAvatar: room.hostAvatar,
      guestAvatar: room.guestAvatar,
      mode: config?.mode || "board",
      starts: room.starts,
      ends: room.ends,
      serverNow: now,
      hostScore: room.host_score,
      guestScore: room.guest_score,
      hostDone: Boolean(room.host_done),
      guestDone: Boolean(room.guest_done),
      live: live && room.live_state ? JSON.parse(room.live_state) : null,
      revision:room.revision,matchmaking:Boolean(room.matchmaking),
      opponentSeen:me === "X" ? room.guest_seen : room.host_seen,
      hostReady: Boolean(room.host_ready),
      guestReady: Boolean(room.guest_ready),
    });
  } catch (error) {
    if (!(error instanceof GameError))
      console.error("Arcade request failed", error.message);
    return json(
      {
        error:
          error instanceof GameError
            ? error.message
            : "The arcade server is unavailable.",
      },
      error.status || 503,
    );
  }
}
