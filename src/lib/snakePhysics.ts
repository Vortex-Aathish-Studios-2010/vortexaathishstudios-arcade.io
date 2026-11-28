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
    (snake[0][0] + direction[0] + cols) % cols,
    (snake[0][1] + direction[1] + rows) % rows,
  ];
  const ate = head[0] === food[0] && head[1] === food[1];
  const body = ate ? snake : snake.slice(0, -1);
  const collision =
    [...body, ...rocks].some((p) => p[0] === head[0] && p[1] === head[1]);
  return {
    collision,
    head,
    ate,
    snake: collision
      ? snake
      : [head, ...snake].slice(0, snake.length + (ate ? 1 : 0)),
  };
}

export function safeBombCell(snake:SnakeCell[],food:SnakeCell,bombs:SnakeCell[],cols:number,rows:number,random=Math.random):SnakeCell|null {
 const free:SnakeCell[]=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const dx=Math.min(Math.abs(x-snake[0][0]),cols-Math.abs(x-snake[0][0])),dy=Math.min(Math.abs(y-snake[0][1]),rows-Math.abs(y-snake[0][1]));
  if(dx<=2&&dy<=2)continue;
  if(![...snake,food,...bombs].some(p=>p[0]===x&&p[1]===y))free.push([x,y]);
 }
 return free.length?free[Math.floor(random()*free.length)]:null;
}
