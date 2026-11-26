import { getPlayerName } from "@/lib/streaks";
import { useEffect, useState } from "react";
import { Trophy, RefreshCw, CloudUpload } from "lucide-react";
import { api, playerPoints, Rank, syncProfile, getSyncState } from "@/lib/arcade";
import { UsernameGate } from "@/components/UsernameGate";
import { PlayerAvatar } from "@/components/PlayerAvatar";
function cached(): Rank[] { try { const rows=JSON.parse(localStorage.getItem("arcade.ranks")||"[]"); return Array.isArray(rows)?rows:[]; } catch {return [];} }
const syncText = { name:"Choose a username below to put your saved points on the leaderboard.", offline:"Offline. Your points are saved here and will sync when you reconnect.", pending:"Points saved on this device. Waiting to sync…", syncing:"Syncing your saved points…", saved:"Your solo points are synced.", error:"Your points are safe here. The server could not be reached; we’ll retry automatically." };
export default function LeaderboardPage() {
  const [rows,setRows]=useState<Rank[]>(cached);
  const [live,setLive]=useState(false);
  const [points,setPoints]=useState(playerPoints);
  const [sync,setSync]=useState(getSyncState);
  const [profile,setProfile]=useState(()=>!getPlayerName());
  const [retrying,setRetrying]=useState(false);
  useEffect(()=>{
    let stopped=false; let timer:ReturnType<typeof setTimeout>;
    async function read(){
      try {if(!document.hidden){ const next=await api<Rank[]>("leaders"); if(stopped)return; setRows(next);setLive(true);localStorage.setItem("arcade.ranks",JSON.stringify(next)); }}
      catch {if(!stopped)setLive(false);}
      if(!stopped)timer=setTimeout(read,2000);
    }
    const changed=()=>{setPoints(playerPoints());setSync(getSyncState());};
    window.addEventListener("arcade-score",changed);window.addEventListener("arcade-sync",changed);
    void syncProfile().catch(()=>{}).finally(()=>{if(!stopped)void read();});
    return()=>{stopped=true;clearTimeout(timer);window.removeEventListener("arcade-score",changed);window.removeEventListener("arcade-sync",changed);};
  },[]);
  async function retry(){setRetrying(true);try{await syncProfile();const next=await api<Rank[]>("leaders");setRows(next);setLive(true);}catch{setLive(false);}finally{setRetrying(false);}}
  return <main className="club-page"><div className="club-wrap">
    <header className="club-title"><Trophy/><h1>Leaderboard</h1><p>{live?"Live rankings · refresh every 2 seconds":"Rankings unavailable · showing last saved results"}</p></header>
    <section className="score-summary"><div><span>YOUR SOLO POINTS</span><strong>{points.toLocaleString()}</strong></div><CloudUpload size={28}/><p role="status">{syncText[sync]}</p>{getPlayerName()&&<button className="club-light" disabled={retrying} onClick={retry}><RefreshCw size={16}/>{retrying?"Syncing…":"Sync now"}</button>}</section>
    {profile&&<section className="club-box"><h2>Claim your place</h2><UsernameGate onComplete={()=>{setProfile(false);void retry();}}/></section>}
    <p className="club-help">Solo points plus room bonuses. A room win earns 20 points; a draw earns 5. Points from different devices are separate.</p>
    {rows.length?<ol className="club-ranks">{rows.map((r,i)=><li key={i}><span>{i+1}</span><PlayerAvatar id={r.avatar} size={44}/><strong>{r.name}</strong><b>{r.score.toLocaleString()}</b></li>)}</ol>:<div className="club-box"><h2>{live?"The next spot is yours":"Your scores stay with you"}</h2><p>{live?"Complete a round and save your profile to join the rankings.":"Keep playing solo. Your saved points will upload when the server is reachable."}</p></div>}
  </div></main>;
}
