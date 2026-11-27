import { publicAsset } from "./assets";
export function createChessBot() {
  const worker = new Worker(publicAsset("engine/stockfish-19-lite-single.js"));
  let readyResolve: () => void, readyReject: (error: Error) => void;
  let pending: {
    resolve: (move: string) => void;
    reject: (error: Error) => void;
  } | null = null;
  let disposed = false;
  const ready = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  const bootTimer = setTimeout(
    () =>
      readyReject(
        new Error(
          "Chess engine could not load. Reconnect once to download it.",
        ),
      ),
    20000,
  );
  worker.onerror = () => {
    const e = new Error("Chess engine unavailable. Try reloading the game.");
    readyReject(e);
    pending?.reject(e);
    pending = null;
  };
  worker.onmessage = (e) => {
    const line = String(e.data);
    if (line === "uciok") {
      worker.postMessage("setoption name Threads value 1");
      worker.postMessage("setoption name Hash value 16");
      worker.postMessage("setoption name UCI_LimitStrength value true");
      worker.postMessage("setoption name UCI_Elo value 2000");
      worker.postMessage("isready");
    }
    if (line === "readyok") {
      clearTimeout(bootTimer);
      readyResolve();
    }
    if (line.startsWith("bestmove ") && pending) {
      const job = pending;
      pending = null;
      job.resolve(line.split(" ")[1]);
    }
  };
  worker.postMessage("uci");
  return {
    async move(fen: string) {
      await ready;
      if (disposed) throw new Error("Engine stopped");
      return new Promise<string>((resolve, reject) => {
        pending = { resolve, reject };
        worker.postMessage("position fen " + fen);
        worker.postMessage("go movetime 1200");
      });
    },
    dispose() {
      disposed = true;
      clearTimeout(bootTimer);
      worker.terminate();
      pending?.reject(new Error("Engine stopped"));
      pending = null;
    },
  };
}
