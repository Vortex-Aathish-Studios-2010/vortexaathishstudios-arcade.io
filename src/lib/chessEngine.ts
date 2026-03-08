// Chess engine with full rules: moves, captures, check, checkmate, castling, en passant, promotion

export type PieceColor = "white" | "black";
export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

export interface Piece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

export type Board = (Piece | null)[][];
export type Position = [number, number]; // [row, col]

export interface Move {
  from: Position;
  to: Position;
  capture?: Piece;
  promotion?: PieceType;
  castling?: "kingside" | "queenside";
  enPassant?: boolean;
}

export interface GameState {
  board: Board;
  turn: PieceColor;
  moves: Move[];
  enPassantTarget: Position | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  capturedWhite: Piece[];
  capturedBlack: Piece[];
}

const PIECE_UNICODE: Record<PieceColor, Record<PieceType, string>> = {
  white: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

export const getPieceSymbol = (piece: Piece): string => PIECE_UNICODE[piece.color][piece.type];

export const createInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRow[c], color: "black" };
    board[1][c] = { type: "pawn", color: "black" };
    board[6][c] = { type: "pawn", color: "white" };
    board[7][c] = { type: backRow[c], color: "white" };
  }
  return board;
};

export const createInitialState = (): GameState => ({
  board: createInitialBoard(),
  turn: "white",
  moves: [],
  enPassantTarget: null,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  capturedWhite: [],
  capturedBlack: [],
});

const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const cloneBoard = (board: Board): Board => board.map(row => row.map(p => p ? { ...p } : null));

const findKing = (board: Board, color: PieceColor): Position => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.type === "king" && board[r][c]?.color === color)
        return [r, c];
  return [0, 0];
};

const isSquareAttacked = (board: Board, pos: Position, byColor: PieceColor): boolean => {
  const [tr, tc] = pos;
  // Knight attacks
  const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightMoves) {
    const nr = tr + dr, nc = tc + dc;
    if (inBounds(nr, nc) && board[nr][nc]?.type === "knight" && board[nr][nc]?.color === byColor)
      return true;
  }
  // Pawn attacks
  const pawnDir = byColor === "white" ? 1 : -1;
  for (const dc of [-1, 1]) {
    const nr = tr + pawnDir, nc = tc + dc;
    if (inBounds(nr, nc) && board[nr][nc]?.type === "pawn" && board[nr][nc]?.color === byColor)
      return true;
  }
  // King attacks
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = tr + dr, nc = tc + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.type === "king" && board[nr][nc]?.color === byColor)
        return true;
    }
  // Sliding: rook/queen (straight), bishop/queen (diagonal)
  const straight = [[0,1],[0,-1],[1,0],[-1,0]];
  const diagonal = [[1,1],[1,-1],[-1,1],[-1,-1]];
  for (const [dr, dc] of straight) {
    let nr = tr + dr, nc = tc + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === "rook" || p.type === "queen")) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  for (const [dr, dc] of diagonal) {
    let nr = tr + dr, nc = tc + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && (p.type === "bishop" || p.type === "queen")) return true;
        break;
      }
      nr += dr; nc += dc;
    }
  }
  return false;
};

export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color);
  return isSquareAttacked(board, kingPos, color === "white" ? "black" : "white");
};

const getRawMoves = (board: Board, pos: Position, enPassantTarget: Position | null): Position[] => {
  const [r, c] = pos;
  const piece = board[r][c];
  if (!piece) return [];
  const moves: Position[] = [];
  const color = piece.color;
  const enemy = color === "white" ? "black" : "white";

  switch (piece.type) {
    case "pawn": {
      const dir = color === "white" ? -1 : 1;
      const startRow = color === "white" ? 6 : 1;
      // Forward
      if (inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push([r + dir, c]);
        if (r === startRow && !board[r + 2 * dir][c])
          moves.push([r + 2 * dir, c]);
      }
      // Captures
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc;
        if (inBounds(nr, nc)) {
          if (board[nr][nc]?.color === enemy) moves.push([nr, nc]);
          if (enPassantTarget && enPassantTarget[0] === nr && enPassantTarget[1] === nc)
            moves.push([nr, nc]);
        }
      }
      break;
    }
    case "knight": {
      const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of offsets) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color !== color) moves.push([nr, nc]);
      }
      break;
    }
    case "bishop": {
      for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
          if (board[nr][nc]?.color === color) break;
          moves.push([nr, nc]);
          if (board[nr][nc]) break;
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case "rook": {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
          if (board[nr][nc]?.color === color) break;
          moves.push([nr, nc]);
          if (board[nr][nc]) break;
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case "queen": {
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc)) {
          if (board[nr][nc]?.color === color) break;
          moves.push([nr, nc]);
          if (board[nr][nc]) break;
          nr += dr; nc += dc;
        }
      }
      break;
    }
    case "king": {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (inBounds(nr, nc) && board[nr][nc]?.color !== color) moves.push([nr, nc]);
        }
      // Castling
      if (!piece.hasMoved && !isInCheck(board, color)) {
        const row = color === "white" ? 7 : 0;
        // Kingside
        const kr = board[row][7];
        if (kr?.type === "rook" && !kr.hasMoved && !board[row][5] && !board[row][6]) {
          if (!isSquareAttacked(board, [row, 5], enemy) && !isSquareAttacked(board, [row, 6], enemy))
            moves.push([row, 6]);
        }
        // Queenside
        const qr = board[row][0];
        if (qr?.type === "rook" && !qr.hasMoved && !board[row][1] && !board[row][2] && !board[row][3]) {
          if (!isSquareAttacked(board, [row, 2], enemy) && !isSquareAttacked(board, [row, 3], enemy))
            moves.push([row, 2]);
        }
      }
      break;
    }
  }
  return moves;
};

export const getLegalMoves = (board: Board, pos: Position, enPassantTarget: Position | null): Position[] => {
  const piece = board[pos[0]][pos[1]];
  if (!piece) return [];
  const raw = getRawMoves(board, pos, enPassantTarget);
  return raw.filter(([tr, tc]) => {
    const nb = cloneBoard(board);
    // En passant capture
    if (piece.type === "pawn" && enPassantTarget && tr === enPassantTarget[0] && tc === enPassantTarget[1]) {
      const captureRow = piece.color === "white" ? tr + 1 : tr - 1;
      nb[captureRow][tc] = null;
    }
    nb[tr][tc] = nb[pos[0]][pos[1]];
    nb[pos[0]][pos[1]] = null;
    // Handle castling king movement for check validation
    return !isInCheck(nb, piece.color);
  });
};

export const makeMove = (state: GameState, from: Position, to: Position, promotion?: PieceType): GameState => {
  const board = cloneBoard(state.board);
  const piece = board[from[0]][from[1]]!;
  const captured = board[to[0]][to[1]];
  const capturedWhite = [...state.capturedWhite];
  const capturedBlack = [...state.capturedBlack];
  let enPassantTarget: Position | null = null;
  let castling: "kingside" | "queenside" | undefined;
  let isEnPassant = false;

  // En passant
  if (piece.type === "pawn" && state.enPassantTarget &&
      to[0] === state.enPassantTarget[0] && to[1] === state.enPassantTarget[1]) {
    const captureRow = piece.color === "white" ? to[0] + 1 : to[0] - 1;
    const epCaptured = board[captureRow][to[1]];
    if (epCaptured) {
      if (epCaptured.color === "white") capturedWhite.push(epCaptured);
      else capturedBlack.push(epCaptured);
    }
    board[captureRow][to[1]] = null;
    isEnPassant = true;
  }

  // Captured piece
  if (captured) {
    if (captured.color === "white") capturedWhite.push(captured);
    else capturedBlack.push(captured);
  }

  // Castling
  if (piece.type === "king" && Math.abs(to[1] - from[1]) === 2) {
    const row = from[0];
    if (to[1] === 6) {
      board[row][5] = board[row][7];
      board[row][7] = null;
      if (board[row][5]) board[row][5]!.hasMoved = true;
      castling = "kingside";
    } else {
      board[row][3] = board[row][0];
      board[row][0] = null;
      if (board[row][3]) board[row][3]!.hasMoved = true;
      castling = "queenside";
    }
  }

  // Pawn double push — set en passant target
  if (piece.type === "pawn" && Math.abs(to[0] - from[0]) === 2) {
    enPassantTarget = [(from[0] + to[0]) / 2, from[1]];
  }

  // Move piece
  board[to[0]][to[1]] = { ...piece, hasMoved: true };
  board[from[0]][from[1]] = null;

  // Promotion
  if (piece.type === "pawn" && (to[0] === 0 || to[0] === 7)) {
    board[to[0]][to[1]] = { type: promotion || "queen", color: piece.color, hasMoved: true };
  }

  const nextTurn = state.turn === "white" ? "black" : "white";
  const isCheck = isInCheck(board, nextTurn);
  const hasLegalMoves = checkHasLegalMoves(board, nextTurn, enPassantTarget);

  const move: Move = {
    from, to,
    capture: captured || undefined,
    promotion: piece.type === "pawn" && (to[0] === 0 || to[0] === 7) ? (promotion || "queen") : undefined,
    castling,
    enPassant: isEnPassant,
  };

  return {
    board,
    turn: nextTurn,
    moves: [...state.moves, move],
    enPassantTarget,
    isCheck,
    isCheckmate: isCheck && !hasLegalMoves,
    isStalemate: !isCheck && !hasLegalMoves,
    capturedWhite,
    capturedBlack,
  };
};

const checkHasLegalMoves = (board: Board, color: PieceColor, enPassantTarget: Position | null): boolean => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color && getLegalMoves(board, [r, c], enPassantTarget).length > 0)
        return true;
  return false;
};

// --- AI (Hard Bot) ---
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000,
};

const POSITION_BONUS: Record<PieceType, number[][]> = {
  pawn: [
    [0,0,0,0,0,0,0,0],
    [50,50,50,50,50,50,50,50],
    [10,10,20,30,30,20,10,10],
    [5,5,10,25,25,10,5,5],
    [0,0,0,20,20,0,0,0],
    [5,-5,-10,0,0,-10,-5,5],
    [5,10,10,-20,-20,10,10,5],
    [0,0,0,0,0,0,0,0],
  ],
  knight: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,0,0,0,0,-20,-40],
    [-30,0,10,15,15,10,0,-30],
    [-30,5,15,20,20,15,5,-30],
    [-30,0,15,20,20,15,0,-30],
    [-30,5,10,15,15,10,5,-30],
    [-40,-20,0,5,5,0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  bishop: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,0,0,0,0,0,0,-10],
    [-10,0,10,10,10,10,0,-10],
    [-10,5,5,10,10,5,5,-10],
    [-10,0,10,10,10,10,0,-10],
    [-10,10,10,10,10,10,10,-10],
    [-10,5,0,0,0,0,5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  rook: [
    [0,0,0,0,0,0,0,0],
    [5,10,10,10,10,10,10,5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [0,0,0,5,5,0,0,0],
  ],
  queen: [
    [-20,-10,-10,-5,-5,-10,-10,-20],
    [-10,0,0,0,0,0,0,-10],
    [-10,0,5,5,5,5,0,-10],
    [-5,0,5,5,5,5,0,-5],
    [0,0,5,5,5,5,0,-5],
    [-10,5,5,5,5,5,0,-10],
    [-10,0,5,0,0,0,0,-10],
    [-20,-10,-10,-5,-5,-10,-10,-20],
  ],
  king: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20,20,0,0,0,0,20,20],
    [20,30,10,0,0,10,30,20],
  ],
};

const evaluateBoard = (board: Board): number => {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.type];
      const posBonus = p.color === "black"
        ? POSITION_BONUS[p.type][r][c]
        : POSITION_BONUS[p.type][7 - r][c];
      score += p.color === "black" ? (val + posBonus) : -(val + posBonus);
    }
  return score;
};

const minimax = (board: Board, depth: number, alpha: number, beta: number, maximizing: boolean, enPassantTarget: Position | null): number => {
  if (depth === 0) return evaluateBoard(board);
  
  const color: PieceColor = maximizing ? "black" : "white";
  const pieces: [number, number][] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color) pieces.push([r, c]);

  if (maximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of pieces) {
      const moves = getLegalMoves(board, [r, c], enPassantTarget);
      for (const [tr, tc] of moves) {
        const nb = cloneBoard(board);
        const piece = nb[r][c]!;
        // Handle en passant
        if (piece.type === "pawn" && enPassantTarget && tr === enPassantTarget[0] && tc === enPassantTarget[1]) {
          nb[piece.color === "white" ? tr + 1 : tr - 1][tc] = null;
        }
        nb[tr][tc] = { ...piece, hasMoved: true };
        nb[r][c] = null;
        // Promotion
        if (piece.type === "pawn" && (tr === 0 || tr === 7))
          nb[tr][tc] = { type: "queen", color: piece.color, hasMoved: true };
        // Castling
        if (piece.type === "king" && Math.abs(tc - c) === 2) {
          if (tc === 6) { nb[r][5] = nb[r][7]; nb[r][7] = null; }
          else { nb[r][3] = nb[r][0]; nb[r][0] = null; }
        }
        let newEp: Position | null = null;
        if (piece.type === "pawn" && Math.abs(tr - r) === 2) newEp = [(r + tr) / 2, c];
        const ev = minimax(nb, depth - 1, alpha, beta, false, newEp);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return maxEval === -Infinity ? (isInCheck(board, color) ? -20000 + (4 - depth) : 0) : maxEval;
  } else {
    let minEval = Infinity;
    for (const [r, c] of pieces) {
      const moves = getLegalMoves(board, [r, c], enPassantTarget);
      for (const [tr, tc] of moves) {
        const nb = cloneBoard(board);
        const piece = nb[r][c]!;
        if (piece.type === "pawn" && enPassantTarget && tr === enPassantTarget[0] && tc === enPassantTarget[1]) {
          nb[piece.color === "white" ? tr + 1 : tr - 1][tc] = null;
        }
        nb[tr][tc] = { ...piece, hasMoved: true };
        nb[r][c] = null;
        if (piece.type === "pawn" && (tr === 0 || tr === 7))
          nb[tr][tc] = { type: "queen", color: piece.color, hasMoved: true };
        if (piece.type === "king" && Math.abs(tc - c) === 2) {
          if (tc === 6) { nb[r][5] = nb[r][7]; nb[r][7] = null; }
          else { nb[r][3] = nb[r][0]; nb[r][0] = null; }
        }
        let newEp: Position | null = null;
        if (piece.type === "pawn" && Math.abs(tr - r) === 2) newEp = [(r + tr) / 2, c];
        const ev = minimax(nb, depth - 1, alpha, beta, true, newEp);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return minEval === Infinity ? (isInCheck(board, color) ? 20000 - (4 - depth) : 0) : minEval;
  }
};

export const getBotMove = (state: GameState): { from: Position; to: Position } | null => {
  const color = state.turn;
  const candidates: { from: Position; to: Position; score: number }[] = [];

  const pieces: [number, number][] = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (state.board[r][c]?.color === color) pieces.push([r, c]);

  for (const [r, c] of pieces) {
    const moves = getLegalMoves(state.board, [r, c], state.enPassantTarget);
    for (const [tr, tc] of moves) {
      const nb = cloneBoard(state.board);
      const piece = nb[r][c]!;
      if (piece.type === "pawn" && state.enPassantTarget && tr === state.enPassantTarget[0] && tc === state.enPassantTarget[1]) {
        nb[piece.color === "white" ? tr + 1 : tr - 1][tc] = null;
      }
      nb[tr][tc] = { ...piece, hasMoved: true };
      nb[r][c] = null;
      if (piece.type === "pawn" && (tr === 0 || tr === 7))
        nb[tr][tc] = { type: "queen", color: piece.color, hasMoved: true };
      if (piece.type === "king" && Math.abs(tc - c) === 2) {
        if (tc === 6) { nb[r][5] = nb[r][7]; nb[r][7] = null; }
        else { nb[r][3] = nb[r][0]; nb[r][0] = null; }
      }
      let newEp: Position | null = null;
      if (piece.type === "pawn" && Math.abs(tr - r) === 2) newEp = [(r + tr) / 2, c];

      const score = minimax(nb, 3, -Infinity, Infinity, color === "white", newEp);
      candidates.push({ from: [r, c], to: [tr, tc], score });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by best score
  candidates.sort((a, b) => color === "black" ? b.score - a.score : a.score - b.score);

  // Check if a move would create repetition (bot moving same piece back and forth)
  const isRepetition = (move: { from: Position; to: Position }) => {
    const history = state.moves;
    if (history.length < 3) return false;
    // Check if bot's last move was the reverse of this move
    const lastBotMove = history.length >= 2 ? history[history.length - 2] : null;
    if (lastBotMove &&
        lastBotMove.from[0] === move.to[0] && lastBotMove.from[1] === move.to[1] &&
        lastBotMove.to[0] === move.from[0] && lastBotMove.to[1] === move.from[1]) {
      return true;
    }
    // Check deeper: if this exact move was made 2 bot turns ago
    if (history.length >= 4) {
      const prevBotMove = history[history.length - 4];
      if (prevBotMove &&
          prevBotMove.from[0] === move.from[0] && prevBotMove.from[1] === move.from[1] &&
          prevBotMove.to[0] === move.to[0] && prevBotMove.to[1] === move.to[1]) {
        return true;
      }
    }
    return false;
  };

  // Pick best non-repeating move; fall back to best if all repeat
  const nonRepeating = candidates.find(m => !isRepetition(m));
  return nonRepeating || candidates[0];
};
