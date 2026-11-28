import {render,screen,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach,expect,it} from 'vitest';
import Index from '@/pages/Index';
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,'onLine',{configurable:true,value:true});});
it('shows every game directly with Solo and Multiplayer choices',()=>{
 render(<MemoryRouter><Index/></MemoryRouter>);
 expect(screen.getByRole('heading',{name:'Game library'})).toBeInTheDocument();
 expect(screen.queryByText('Pick your arena')).not.toBeInTheDocument();
 const games=document.querySelectorAll('.game-poster');expect(games).toHaveLength(16);
 for(const game of games){expect(within(game as HTMLElement).getByRole('link',{name:'Solo'})).toHaveAttribute('href');expect(within(game as HTMLElement).getByRole('link',{name:'Multiplayer'})).toHaveAttribute('href');}
});
it('keeps all solo games available offline with a friendly multiplayer notice',()=>{
 Object.defineProperty(navigator,'onLine',{configurable:true,value:false});render(<MemoryRouter><Index/></MemoryRouter>);
 expect(screen.getByText('Multiplayer needs internet. You can still play solo!')).toBeInTheDocument();expect(screen.getAllByRole('link',{name:'Solo'})).toHaveLength(16);
});
