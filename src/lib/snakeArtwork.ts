import type { SnakeCell } from './snakePhysics';
export function wrappedLerp(from:number,to:number,alpha:number,size:number){let delta=to-from;if(delta>size/2)delta-=size;if(delta< -size/2)delta+=size;return ((from+delta*alpha)%size+size)%size;}
export function drawSnake(ctx:CanvasRenderingContext2D,body:SnakeCell[],previous:SnakeCell[],direction:SnakeCell,alpha:number,cols:number,rows:number,cell:number,color:string){
 const w=cols*cell,h=rows*cell;
 const points=body.map((p,i)=>{const old=previous[i]||previous.at(-1)||p;return[(wrappedLerp(old[0],p[0],alpha,cols)+.5)*cell,(wrappedLerp(old[1],p[1],alpha,rows)+.5)*cell];});
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const ox of[-w,0,w])for(const oy of[-h,0,h]){
  ctx.save();ctx.translate(ox,oy);ctx.strokeStyle=color;ctx.lineWidth=cell*.72;
  for(let i=0;i<points.length;i++){const p=points[i];ctx.beginPath();ctx.arc(p[0],p[1],cell*.35,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(i){const q=points[i-1];let dx=q[0]-p[0],dy=q[1]-p[1];if(dx>w/2)dx-=w;if(dx< -w/2)dx+=w;if(dy>h/2)dy-=h;if(dy< -h/2)dy+=h;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]+dx,p[1]+dy);ctx.stroke();}}
  if(points.length){const p=points[0];ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(Math.atan2(direction[1],direction[0]));ctx.fillStyle='#e9f2d1';for(const y of[-.19,.19]){ctx.beginPath();ctx.arc(cell*.16,cell*y,cell*.13,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#13231c';for(const y of[-.19,.19]){ctx.beginPath();ctx.arc(cell*.2,cell*y,cell*.065,0,Math.PI*2);ctx.fill();}ctx.restore();}
  ctx.restore();
 }
 return points[0];
}
export function drawBomb(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,armed:boolean,time:number){
 ctx.save();ctx.translate(x,y);ctx.globalAlpha=armed?1:.45+.2*Math.sin(time/90);ctx.fillStyle='#ef845f';ctx.beginPath();ctx.arc(0,0,r*1.05,0,Math.PI*2);ctx.fill();ctx.fillStyle='#312327';ctx.beginPath();ctx.arc(0,0,r*.7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffc98b';ctx.lineWidth=Math.max(2,r*.17);ctx.beginPath();ctx.moveTo(-r*.25,-r*.25);ctx.lineTo(r*.25,r*.25);ctx.moveTo(-r*.25,r*.25);ctx.lineTo(r*.25,-r*.25);ctx.stroke();ctx.beginPath();ctx.moveTo(r*.35,-r*.6);ctx.quadraticCurveTo(r*.75,-r*1.2,r*1.05,-r*.8);ctx.stroke();ctx.fillStyle='#ffe0a2';ctx.fillRect(r*.9,-r,3,3);ctx.restore();
}
