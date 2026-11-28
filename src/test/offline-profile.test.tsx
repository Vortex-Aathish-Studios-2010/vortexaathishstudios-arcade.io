import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {UsernameGate} from '@/components/UsernameGate';
import {api,watchScores,hasRegisteredUsername,getSyncState} from '@/lib/arcade';
import {setPlayerName,addPoints,getPoints} from '@/lib/streaks';
beforeEach(()=>{localStorage.clear();vi.useFakeTimers();});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});
it('allows first-launch solo play offline without any network request or username',async()=>{
 vi.spyOn(navigator,'onLine','get').mockReturnValue(false);const fetch=vi.spyOn(globalThis,'fetch'),solo=vi.fn();
 render(<UsernameGate onComplete={vi.fn()} onPlaySolo={solo}/>);
 expect(screen.getByText('Username checking needs internet. You can still play solo!')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Play solo offline'}));expect(solo).toHaveBeenCalledOnce();
 await expect(api('leaders')).rejects.toThrow('Connect');expect(fetch).not.toHaveBeenCalled();
});
it('preserves offline scores and automatically syncs them once internet returns',async()=>{
 let online=false;vi.spyOn(navigator,'onLine','get').mockImplementation(()=>online);
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>({ok:true,status:200,json:async()=>({ok:true})}) as Response);
 setPlayerName('OfflineAce');localStorage.setItem('arcade.username.key','offlineace');const stop=watchScores();
 addPoints(45);await act(async()=>vi.advanceTimersByTimeAsync(1000));expect(getPoints()).toBe(45);expect(fetch).not.toHaveBeenCalled();expect(getSyncState()).toBe('offline');
 online=true;window.dispatchEvent(new Event('online'));await act(async()=>vi.advanceTimersByTimeAsync(50));
 expect(fetch).toHaveBeenCalledOnce();expect(JSON.parse(fetch.mock.calls[0][1]!.body as string)).toMatchObject({name:'OfflineAce',score:45});expect(hasRegisteredUsername()).toBe(true);expect(getSyncState()).toBe('saved');expect(getPoints()).toBe(45);stop();
});
