// Shared deterministic simulation: the server owns collisions, scores and results.
export const LIVE_GAMES = new Set(['snake','gravity-flip']);
export const wrap = (n,size) => (n%size+size)%size;
const equal=(a,b)=>a[0]===b[0]&&a[1]===b[1];
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function vacantCell(s,extra=[]){
  const occupied=[...s.players.flatMap(p=>p.body||[]),...(s.food||[]),...(s.bombs||[]).map(b=>b.cell),...extra];
  const free=[];
  for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++)if(!occupied.some(c=>equal(c,[x,y])))free.push([x,y]);
  return free.length?free[Math.floor(random(s)*free.length)]:null;
}
export function createLiveMatch(game,seed,starts){
 const s={game,seed:seed>>>0,starts,time:starts,tick:0,result:'',reason:'',events:[],players:[0,1].map(i=>({score:0,alive:true,seq:0,queue:[],direction:i?[ -1,0]:[1,0],body:Array.from({length:5},(_,n)=>[i?37+n:10-n,i?20:9]),y:392,gravity:1,flips:0})),food:[],bombs:[],cols:48,rows:30,nextBomb:starts+5000,distance:0,gates:[]};
 if(game==='snake')for(let i=0;i<3;i++){const cell=vacantCell(s);if(cell)s.food.push(cell);}
 return s;
}
export function applyLiveInputs(s,side,commands){
 const p=s.players[side];if(!p||s.result)return;
 for(const command of commands){
  if(!command||typeof command!=="object")continue;
  if(!Number.isSafeInteger(command.seq)||command.seq<=p.seq||command.seq>2147483647)continue;
  if(s.game==='snake'){
   const d=command.turn;
   if(!Array.isArray(d)||d.length!==2||!d.every(Number.isInteger)||Math.abs(d[0])+Math.abs(d[1])!==1)continue;
   const prev=p.queue.at(-1)||p.direction;
   if(p.queue.length<2&&!(d[0]===-prev[0]&&d[1]===-prev[1])&&!equal(d,prev))p.queue.push(d);
  }else if(command.flip===true){p.gravity*=-1;p.flips++;}else continue;
  p.seq=command.seq;
 }
}
export function endLive(s,reason){
 if(s.result)return;
 s.reason=reason;
 if(s.players[0].alive!==s.players[1].alive)s.result=s.players[0].alive?'X':'O';
 else if(s.players.every(p=>!p.alive))s.result='draw';
 else s.result=s.players[0].score===s.players[1].score?'draw':s.players[0].score>s.players[1].score?'X':'O';
}
export function disconnectLive(s,side){if(s.result)return;s.players[side].alive=false;endLive(s,'disconnect');}
function snakeStep(s){
 s.bombs=s.bombs.filter(b=>b.expires>s.time);
 const heads=s.players.map(p=>{if(p.queue.length)p.direction=p.queue.shift();return [wrap(p.body[0][0]+p.direction[0],s.cols),wrap(p.body[0][1]+p.direction[1],s.rows)];});
 const eating=heads.map(h=>s.food.findIndex(c=>equal(c,h)));
 const bodies=s.players.map((p,i)=>eating[i]>=0?p.body:p.body.slice(0,-1));
 const collision=heads.map((h,i)=>equal(h,heads[1-i])||bodies.flat().some(c=>equal(c,h))||s.bombs.some(b=>b.armed<=s.time&&equal(b.cell,h)));
 s.players.forEach((p,i)=>{p.previous=p.body;p.alive=!collision[i];p.body=[heads[i],...p.body].slice(0,p.body.length+(eating[i]>=0?1:0));if(!collision[i]&&eating[i]>=0)p.score+=10;});
 if(collision.some(Boolean)){
  s.events=collision.flatMap((hit,i)=>hit?[{type:'explosion',side:i,cell:heads[i],at:s.time}]:[]);endLive(s,'collision');return;
 }
 s.food=s.food.filter((_,i)=>!eating.includes(i));
 while(s.food.length<3){const cell=vacantCell(s);if(!cell)break;s.food.push(cell);}
 s.bombs=s.bombs.filter(b=>b.expires>s.time);
 if(s.time>=s.nextBomb&&s.bombs.length<10){
  const buffer=s.players.flatMap(p=>{const cells=[];for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)cells.push([wrap(p.body[0][0]+x,s.cols),wrap(p.body[0][1]+y,s.rows)]);return cells;});
  const cell=vacantCell(s,buffer);if(cell)s.bombs.push({cell,armed:s.time+900,expires:s.time+18000});
  s.nextBomb=s.time+Math.max(2200,5000-s.tick*5);
 }
}
export function liveGravityDifficulty(score){const speed=300+400*(1-Math.exp(-Math.max(0,score)/420));return{speed,gap:Math.max(58,248-score*.24),spacing:54+speed*(.74+Math.max(.18,1-score*.0012))};}
function gravityStep(s,dt){
 const d=liveGravityDifficulty(s.distance/20);s.distance+=d.speed*dt;
 if(!s.gates.length||900-s.gates.at(-1).x>=d.spacing)s.gates.push({x:920,top:random(s)<.5,gap:d.gap});
 for(const gate of s.gates)gate.x-=d.speed*dt;
 for(let i=0;i<2;i++){
  const p=s.players[i];p.y=Math.max(40,Math.min(392,p.y+p.gravity*520*dt));p.score=Math.floor(s.distance/20);
  for(const gate of s.gates){const top=gate.top?40:40+gate.gap,bottom=gate.top?420-gate.gap:420;if(153<gate.x+54&&175>gate.x&&p.y+3<bottom&&p.y+25>top){p.alive=false;s.events.push({type:'explosion',side:i,x:164,y:p.y+14,at:s.time});break;}}
 }
 s.gates=s.gates.filter(g=>g.x>-70);if(s.players.some(p=>!p.alive))endLive(s,'collision');
}
export function advanceLive(s,until){
 if(s.result||until<=s.starts)return s;
 const limit=Math.min(until,s.starts+180000);
 const step=s.game==='snake'?120:1000/60;
 // Bounded catch-up; the room service handles extended absence as a disconnect.
 const count=Math.min(600,Math.floor((limit-s.time)/step));
 for(let i=0;i<count&&!s.result;i++){s.time+=step;s.tick++;if(s.game==='snake')snakeStep(s);else gravityStep(s,step/1000);}
 if(limit>=s.starts+180000)endLive(s,'time');
 return s;
}
