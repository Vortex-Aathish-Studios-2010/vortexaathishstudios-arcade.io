export type SnakeCell = [number, number];
export function advanceSnake(
  snake: SnakeCell[],
  direction: SnakeCell,
  food: SnakeCell,
  cols: number,
  rows: number,
  rocks: SnakeCell[] = [],
) {
  const head: SnakeCell = [
    snake[0][0] + direction[0],
    snake[0][1] + direction[1],
  ];
  const ate = head[0] === food[0] && head[1] === food[1];
  const body = ate ? snake : snake.slice(0, -1);
  const collision =
    head[0] < 0 ||
    head[0] >= cols ||
    head[1] < 0 ||
    head[1] >= rows ||
    [...body, ...rocks].some((p) => p[0] === head[0] && p[1] === head[1]);
  return {
    collision,
    ate,
    snake: collision
      ? snake
      : [head, ...snake].slice(0, snake.length + (ate ? 1 : 0)),
  };
}
