import { useState } from "react";
import { getPlayerName, setPlayerName, getPlayerAvatar, setPlayerAvatar, getDailyStreak } from "@/lib/streaks";
import { AVATARS, PlayerAvatar } from "./PlayerAvatar";
import { Flame } from "lucide-react";
export function UsernameGate({onComplete}:{onComplete:(username:string)=>void}) {
  const [name,setName]=useState(getPlayerName);
  const [avatar,setAvatar]=useState(getPlayerAvatar);
  const [error,setError]=useState("");
  return <form className="profile-form" onSubmit={e=>{
    e.preventDefault(); const clean=name.trim();
    if(clean.length<2||clean.length>20){setError("Use 2 to 20 characters.");return;}
    setPlayerAvatar(avatar); setPlayerName(clean); onComplete(clean);
  }}>
    <div className="profile-preview"><PlayerAvatar id={avatar} size={76}/><div><strong>{name.trim()||"Your player"}</strong><span><Flame size={16}/>{getDailyStreak()} day streak</span></div></div>
    <label>Username<input value={name} maxLength={20} autoComplete="nickname" placeholder="Your username" required onChange={e=>{setError("");setName(e.target.value);}}/></label>
    <fieldset><legend>Choose your avatar</legend><div className="avatar-grid">{AVATARS.map(a=><button type="button" key={a.id} aria-label={`Choose ${a.name} avatar`} aria-pressed={avatar===a.id} onClick={()=>setAvatar(a.id)}><PlayerAvatar id={a.id} size={56}/><span>{a.name}</span></button>)}</div></fieldset>
    <p>Your username and avatar appear in rooms and rankings. Saved points sync when you connect.</p>
    {error&&<p role="alert">{error}</p>}
    <button className="solid-button">Save profile</button>
  </form>;
}
