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

export async function arcade(request, db) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const headers = { "cache-control": "no-store", vary: "Origin" };
  if (
    origin === url.origin ||
    ["https://localhost", "http://localhost", "capacitor://localhost", "https://vortex-aathish-studios-2010.github.io"].includes(
      origin,
    )
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
          "SELECT name, avatar, solo + bonus AS score FROM arcade_players WHERE solo + bonus > 0 ORDER BY score DESC, name, id LIMIT 50",
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
    if (path === "profile" && write) {
      const name = String(body.name || "").trim();
      const avatar = body.avatar ?? null;
      if (avatar !== null && !["orbit","fox","bot","ninja","owl","cat","dragon","skull","diver","bear"].includes(avatar)) throw new GameError("Choose an available avatar.");
      if (
        name.length < 2 ||
        name.length > 20 ||
        !Number.isSafeInteger(body.score) ||
        body.score < 0 ||
        body.score > 2147483647
      )
        throw new GameError("Invalid player profile");
      await db
        .prepare(
          "INSERT INTO arcade_players(id,name,solo,avatar) VALUES(?,?,?,COALESCE(?,'orbit')) ON CONFLICT(id) DO UPDATE SET name=excluded.name,solo=MAX(arcade_players.solo,excluded.solo),avatar=COALESCE(?,arcade_players.avatar)",
        )
        .bind(id, name, body.score, avatar, avatar)
        .run();
      return json({ ok: true });
    }
    const now = Date.now();
    if (path === "rooms" && write) {
      if (!Object.hasOwn(games, body.game))
        throw new GameError("Choose a game");
      const [cols, rows] = games[body.game];
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
            "INSERT OR IGNORE INTO arcade_rooms(code,game,host,board,expires) VALUES(?,?,?,?,?)",
          )
          .bind(code, body.game, id, ".".repeat(cols * rows), now + 6 * hour)
          .run();
        if (change.meta.changes) return json({ code });
      }
      throw new GameError("Try creating the room again", 503);
    }
    const match = /^rooms\/([A-Z2-9]{6})(?:\/(join|move|leave))?$/.exec(path);
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
      const joined = await db
        .prepare(
          "UPDATE arcade_rooms SET guest=? WHERE code=? AND guest IS NULL",
        )
        .bind(id, code)
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
    const turn = room.board.replaceAll(".", "").length % 2 ? "O" : "X";
    if (action === "move") {
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
