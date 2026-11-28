import { useEffect,useState } from 'react';
import { getPlayerName,setPlayerName,getPlayerAvatar,setPlayerAvatar,getDailyStreak } from '@/lib/streaks';
import { api,hasRegisteredUsername,playerPoints } from '@/lib/arcade';
import { validUsername,usernameKey,USERNAME_FORMAT,USERNAME_TAKEN } from '@/lib/usernames.mjs';
import { useOnline } from '@/lib/connectivity';
import { AVATARS,PlayerAvatar } from './PlayerAvatar';
import { Flame } from 'lucide-react';
export function UsernameGate({onComplete,onPlaySolo}:{onComplete:(username:string)=>void;onPlaySolo?:()=>void}){
 const [name,setName]=useState(getPlayerName),[avatar,setAvatar]=useState(getPlayerAvatar),[error,setError]=useState(''),[busy,setBusy]=useState(false),[availability,setAvailability]=useState(''),[retry,setRetry]=useState(0);
 const online=useOnline();
 const existing=hasRegisteredUsername()&&usernameKey(name)===usernameKey(getPlayerName());
 useEffect(()=>{
  if(!online){setAvailability('offline');return;}
  if(!validUsername(name.trim())){setAvailability('');return;}
  let cancelled=false;setAvailability('checking');
  const timer=setTimeout(()=>{api<{available:boolean}>('usernames?name='+encodeURIComponent(name.trim())).then(r=>{if(!cancelled)setAvailability(r.available?'available':'taken');}).catch(()=>{if(!cancelled)setAvailability('error');});},250);
  return()=>{cancelled=true;clearTimeout(timer);};
 },[name,online,retry]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(busy)return;const clean=name.trim();
  if(!validUsername(clean)){setError(USERNAME_FORMAT);return;}
  if(!online&&!existing){setError('Connect to the internet to reserve your username. You can still play solo!');return;}
  setBusy(true);setError('');
  try{
   if(online){await api('profile',{name:clean,avatar,score:playerPoints()});localStorage.setItem('arcade.username.key',usernameKey(clean));}
   setPlayerAvatar(avatar);setPlayerName(clean);window.dispatchEvent(new Event('arcade-username'));onComplete(clean);
  }catch(e){setError(e instanceof Error?e.message:'Could not save. Please try again.');}finally{setBusy(false);}
 }
 const status=availability==='checking'?'Checking username…':availability==='available'?'Username available':availability==='taken'?USERNAME_TAKEN:availability==='offline'?(existing?'Your profile is saved on this device.':'Username checking needs internet. You can still play solo!'):availability==='error'?'Cannot check right now. Reconnect and try again.':USERNAME_FORMAT;
 return <form className="profile-form" onSubmit={save}>
  <div className="profile-preview"><PlayerAvatar id={avatar} size={76}/><div><strong>{name.trim()||'Your player'}</strong><span><Flame size={16}/>{getDailyStreak()} day streak</span></div></div>
  <label>Username<input value={name} minLength={3} maxLength={15} pattern="[A-Za-z0-9_]{3,15}" autoCapitalize="none" autoComplete="nickname" spellCheck={false} placeholder="Choose a unique name" required disabled={busy} onChange={e=>{setError('');setName(e.target.value.trim());}}/></label>
  <p role="status" aria-live="polite" className={'username-status '+availability}>{status}</p>
  <fieldset disabled={busy}><legend>Choose your avatar</legend><div className="avatar-grid">{AVATARS.map(a=><button type="button" key={a.id} aria-label={`Choose ${a.name} avatar`} aria-pressed={avatar===a.id} onClick={()=>setAvatar(a.id)}><PlayerAvatar id={a.id} size={56}/><span>{a.name}</span></button>)}</div></fieldset>
  <p>Your unique name appears above your player in online games. Solo progress stays saved on this device.</p>
  {availability==='error'&&<button type="button" className="club-light" onClick={()=>setRetry(r=>r+1)}>Retry username check</button>}
  {error&&<p role="alert" className="username-error">{error}</p>}
  <button className="solid-button" disabled={busy||!validUsername(name.trim())||(online?availability!=='available':!existing)}>{busy?'Saving…':'Save profile'}</button>
  {onPlaySolo&&<button className="club-light" type="button" onClick={onPlaySolo}>{online?'Play solo':'Play solo offline'}</button>}
 </form>;
}
