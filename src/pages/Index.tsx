import { Link } from 'react-router-dom';
import { Users,Play,WifiOff } from 'lucide-react';
import { games } from '@/lib/gameData';
import { entertainmentGames } from '@/lib/entertainmentData';
import { OfflineWarning } from '@/components/OfflineWarning';
import { publicAsset } from '@/lib/assets';
import { useOnline } from '@/lib/connectivity';
const library=[...games.filter(g=>g.available).map(g=>({...g,url:'/game/'+g.id})),...entertainmentGames.filter(g=>g.available).map(g=>({...g,url:'/entertainment/'+g.id}))];
export default function Index(){
 const online=useOnline();
 return <main className="studio-main games-menu">
  <OfflineWarning/>
  <h1 className="sr-only" aria-label="Game library">Games menu</h1>
  {!online&&<p className="solo-message"><WifiOff size={17}/> Multiplayer needs internet. You can still play solo!</p>}
  <div className="poster-grid">{library.map(game=><article className="game-poster" key={game.id}>
    <img src={publicAsset('covers/'+game.id+'.webp')} alt={game.name==='Gravity Flip Runner'?'Gravity Run':game.name} loading="lazy" width={600} height={375}/>
    <div><h2>{game.id==='gravity-flip'?'Gravity Run':game.name}</h2><div className="game-menu-actions">
      <Link className="solid-button" to={game.url} state={{fromLibrary:true,solo:true}}><Play size={16}/>Solo</Link>
      <Link className="club-light" to={'/rooms?game='+game.id}><Users size={16}/>Multiplayer</Link>
    </div></div>
  </article>)}</div>
 </main>;
}
