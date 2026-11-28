import { useCallback,useEffect,useRef,useState } from 'react';
import { ArrowLeft,ArrowRight,ArrowUp,ArrowDown,ArrowUpDown,WifiOff } from 'lucide-react';
import { api,Room } from '@/lib/arcade';
import { advanceLive,applyLiveInputs } from '../../server/live-engine.mjs';
import { createCanvasResolution } from '@/lib/canvasResolution';
import { drawSnake,drawBomb } from '@/lib/snakeArtwork';
import { sfx } from '@/lib/sounds';

type Command={seq:number;turn?:number[];flip?:boolean};
export function LiveRound({room,onSnapshot}:{room:Room;onSnapshot:(next:Room)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(room),notify=useRef(onSnapshot),snapshot=useRef({state:room.live,received:performance.now(),revision:room.revision||0});
 latest.current=room;notify.current=onSnapshot;
 const side=room.me==='X'?0:1,sequence=useRef(room.live?.players[side].seq||0),pending=useRef<Command[]>([]),flush=useRef(()=>{}),offset=useRef((room.serverNow||Date.now())-Date.now()),touch=useRef<number[]|null>(null);
 const [connection,setConnection]=useState('Connecting…'),[clock,setClock]=useState(Date.now()+offset.current),[lost,setLost]=useState(false);
 const lastSuccess=useRef(Date.now()),playedExplosion=useRef(false);
 useEffect(()=>{
  if(room.live&&(room.revision||0)>snapshot.current.revision){snapshot.current={state:room.live,received:performance.now(),revision:room.revision||0};sequence.current=Math.max(sequence.current,room.live.players[side].seq);}
  if(room.result&&!playedExplosion.current){playedExplosion.current=true;if(room.live?.reason==='collision')sfx.explosion();else sfx.gameOver();}
 },[room.live,room.revision,room.result,side]);
 const control=useCallback((turn?:number[])=>{
  if(latest.current.result||Date.now()+offset.current<(latest.current.starts||0)||pending.current.length>=8)return;
  const command={seq:++sequence.current,...(turn?{turn}:{flip:true})};pending.current.push(command);flush.current();
 },[]);
 useEffect(()=>{
  let cancelled=false,busy=false,timer:ReturnType<typeof setTimeout>;
  async function send(){
   if(cancelled||busy||latest.current.result)return;clearTimeout(timer);busy=true;const sent=performance.now();
   try{
    const next=await api<Room>('rooms/'+room.code+'/live',{commands:pending.current.slice(0,8)});
    if(cancelled)return;
    offset.current=(next.serverNow||Date.now())-Date.now()+(performance.now()-sent)/2;
    lastSuccess.current=Date.now();setLost(false);
    const ack=next.live?.players[side]?.seq||0;pending.current=pending.current.filter(c=>c.seq>ack);sequence.current=Math.max(sequence.current,ack);
    if(next.live&&(next.revision||0)>=snapshot.current.revision)snapshot.current={state:next.live,received:performance.now(),revision:next.revision||0};
    const missing=(next.serverNow||Date.now())-Math.max(next.opponentSeen||0,next.starts||0);
    setConnection(next.result?'Round complete':missing>3000?'Opponent reconnecting…':'Live · both players connected');notify.current(next);
   }catch{if(!cancelled)setConnection('Connection lost. Reconnecting…');}
   finally{busy=false;if(!cancelled&&!latest.current.result)timer=setTimeout(send,document.hidden?500:Math.max(25,100-(performance.now()-sent)));}
  }
  flush.current=()=>{void send();};void send();
  const tick=setInterval(()=>{setClock(Date.now()+offset.current);if(Date.now()-lastSuccess.current>10000)setLost(true);},100);
  return()=>{cancelled=true;clearTimeout(timer);clearInterval(tick);flush.current=()=>{};};
 },[room.code,side]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).closest('input,textarea')||e.repeat)return;
   const dirs:Record<string,number[]>={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
   if(room.game==='snake'&&dirs[e.key]){e.preventDefault();control(dirs[e.key]);}
   else if(room.game==='gravity-flip'&&(e.code==='Space'||e.key==='ArrowUp')){e.preventDefault();control();}
  };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
 },[room.game,control]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const snake=room.game==='snake',W=snake?960:900,H=snake?600:460;
  const resolution=createCanvasResolution(el,W,H);if(!resolution)return;const ctx=resolution.context;
  let frame=0,projection=room.live?structuredClone(room.live):null,projectedRevision=-1,resultAt=0;
  const colors=['#b5d57a','#78bfff'];
  function label(text:string,x:number,y:number,color:string){ctx.font='bold 15px system-ui';ctx.textAlign='center';const width=ctx.measureText(text).width+16;x=Math.max(width/2+3,Math.min(W-width/2-3,x));y=Math.max(22,y);ctx.fillStyle='#101914e8';ctx.beginPath();ctx.roundRect(x-width/2,y-17,width,23,5);ctx.fill();ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function draw(time:number){
   const stored=snapshot.current;if(stored.state){
    if(stored.revision!==projectedRevision){projection=structuredClone(stored.state);projectedRevision=stored.revision;}
    // Predict only a bounded interval; the server always decides results.
    if(projection&&!stored.state.result){applyLiveInputs(projection,side,pending.current);advanceLive(projection,Math.min(Date.now()+offset.current,stored.state.time+300));}
    const s=projection||stored.state;
    ctx.fillStyle='#13231f';ctx.fillRect(0,0,W,H);
    if(snake){
     const cell=20;ctx.fillStyle='#294033';for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++){ctx.beginPath();ctx.arc((x+.5)*cell,(y+.5)*cell,.8,0,Math.PI*2);ctx.fill();}
     for(const f of s.food){ctx.fillStyle='#ed9b73';ctx.beginPath();ctx.roundRect(f[0]*cell+5,f[1]*cell+5,10,10,3);ctx.fill();}
     for(const bomb of s.bombs)drawBomb(ctx,(bomb.cell[0]+.5)*cell,(bomb.cell[1]+.5)*cell,8,bomb.armed<=s.time,time);
     const alpha=Math.min(1,Math.max(0,(Date.now()+offset.current-s.time)/120));
     s.players.forEach((p:any,i:number)=>{const head=drawSnake(ctx,p.body,p.previous||p.body,p.direction,alpha,s.cols,s.rows,cell,colors[i]);label(i===0?latest.current.host:latest.current.guest||'Player',head[0],head[1]-19,colors[i]);});
    }else{
     ctx.fillStyle='#293e31';ctx.fillRect(0,0,W,40);ctx.fillRect(0,420,W,40);ctx.strokeStyle='#a7bd7a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,40);ctx.lineTo(W,40);ctx.moveTo(0,420);ctx.lineTo(W,420);ctx.stroke();
     for(const g of s.gates){const y=g.top?40:40+g.gap,h=g.top?380-g.gap:380-g.gap;ctx.fillStyle='#bd8660';ctx.fillRect(g.x,y,54,h);ctx.fillStyle='#e0af77';ctx.fillRect(g.x,y,7,h);}
     for(const i of[1-side,side]){const p=s.players[i];ctx.save();ctx.globalAlpha=i===side?1:.45;ctx.fillStyle=colors[i];ctx.beginPath();ctx.roundRect(150,p.y,28,28,7);ctx.fill();ctx.strokeStyle=colors[i];ctx.lineWidth=i===side?2:5;ctx.stroke();ctx.fillStyle='#12271e';ctx.fillRect(168,p.y+8,5,5);ctx.restore();label(i===0?latest.current.host:latest.current.guest||'Player',164,p.y-(i===side?16:42),colors[i]);}
    }
    if(stored.state.result&&stored.state.reason==='collision'){
     if(!resultAt)resultAt=time;const age=(time-resultAt)/800;
     if(age<1)for(const e of stored.state.events||[]){const x=snake?(e.cell[0]+.5)*20:e.x,y=snake?(e.cell[1]+.5)*20:e.y;ctx.strokeStyle=`rgba(255,170,100,${1-age})`;ctx.lineWidth=9*(1-age);ctx.beginPath();ctx.arc(x,y,12+age*90,0,Math.PI*2);ctx.stroke();for(let i=0;i<14;i++){const a=i*Math.PI*2/14;ctx.fillStyle=`rgba(255,210,140,${1-age})`;ctx.fillRect(x+Math.cos(a)*age*100,y+Math.sin(a)*age*100,6,6);}}
    }
   }
   frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);resolution.dispose();};
 },[room.game,room.code,side]);
 const countdown=Math.ceil(((room.starts||0)-clock)/1000),finished=Boolean(room.result);
 return <section className="live-round" aria-label={room.game==='snake'?'Shared Snake arena':'Live Gravity Run'}>
  <div className="live-scoreboard">{[room.host,room.guest].map((name,i)=><div key={i} data-player={i}><span>{name}{side===i?' · You':''}</span><strong>{i===0?room.hostScore:room.guestScore}</strong></div>)}</div>
  <p className="live-connection" role="status">{lost?'Connection lost. This round has ended. Reconnect to see the result.':room.live?.reason==='disconnect'?'Your opponent disconnected. The round has ended.':connection}</p>
  <div className="live-arena"><canvas ref={canvas} aria-label={room.game==='snake'?'Both snakes, food and bombs':'Your runner and your opponent’s live ghost'} onPointerDown={e=>{e.preventDefault();touch.current=[e.clientX,e.clientY];e.currentTarget.setPointerCapture(e.pointerId);if(room.game==='gravity-flip')control();}} onPointerUp={e=>{if(room.game!=='snake'||!touch.current)return;const dx=e.clientX-touch.current[0],dy=e.clientY-touch.current[1];touch.current=null;if(Math.max(Math.abs(dx),Math.abs(dy))>12)control(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]);}}/>
   {countdown>0&&<div className="game-overlay"><h2>{countdown}</h2><p>Both players start together.</p></div>}
   {lost&&!finished&&<div className="game-overlay"><WifiOff/><h2>Connection lost</h2><p>Your solo games still work offline.</p></div>}
  </div>
  <div className="live-controls">{room.game==='snake'?[[ArrowLeft,[-1,0],'left'],[ArrowUp,[0,-1],'up'],[ArrowDown,[0,1],'down'],[ArrowRight,[1,0],'right']].map(([Icon,d,label]:any)=><button key={label} disabled={countdown>0||finished||lost} aria-label={'Move '+label} onPointerDown={()=>control(d)}><Icon size={25}/></button>):<button disabled={countdown>0||finished||lost} onPointerDown={()=>control()}><ArrowUpDown size={23}/>Flip gravity</button>}</div>
  <p className="club-help">{room.game==='snake'?'Green and blue share the arena. Edges wrap. Avoid bombs and both snake bodies.':'Your opponent is the tinted ghost. Tap, flip, and survive the same course.'}</p>
 </section>;
}
