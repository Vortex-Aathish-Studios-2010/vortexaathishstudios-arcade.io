import {expect,it,vi} from 'vitest';
import {advanceSnake,safeBombCell} from '@/lib/snakePhysics';
import {detectDevice,preferredOrientation,orientationController} from '@/lib/deviceLayout';
import {createCanvasResolution} from '@/lib/canvasResolution';
it('wraps solo Snake at all four edges without a wall death',()=>{
 for(const [head,direction,expected] of [[[0,0],[-1,0],[23,0]],[[23,17],[1,0],[0,17]],[[0,0],[0,-1],[0,17]],[[23,17],[0,1],[23,0]]]){
  const next=advanceSnake([head as [number,number]],direction as [number,number],[10,10],24,18);expect(next.collision).toBe(false);expect(next.snake[0]).toEqual(expected);
 }
 expect(safeBombCell([[0,0]],[1,1],[],2,2)).toBe(null);
 expect(advanceSnake([[2,2]],[1,0],[9,9],24,18,[[3,2]]).collision).toBe(true);
});
it('uses the physical native device for orientation and leaves tablets unrestricted',()=>{
 for(const [width,height] of [[390,844],[844,390]])expect(detectDevice({width,height,touch:true,native:true,screenWidth:390,screenHeight:844})).toBe('phone');
 expect(detectDevice({width:800,height:1200,touch:true,native:true,screenWidth:800,screenHeight:1200})).toBe('tablet');
 expect(detectDevice({width:1400,height:900,touch:false,native:false})).toBe('laptop');
 expect(preferredOrientation('phone','snake')).toBe('landscape');expect(preferredOrientation('phone','chess')).toBe('portrait');expect(preferredOrientation('tablet','snake')).toBe('any');
});
it('serializes native orientation requests and ends in the latest requested orientation',async()=>{
 let release:()=>void;const calls:string[]=[];
 const control=orientationController({lock:async({orientation})=>{calls.push(orientation);if(calls.length===1)await new Promise<void>(r=>release=r);},unlock:async()=>{calls.push('any');}});
 const first=control('landscape');await Promise.resolve();await Promise.resolve();const stale=control('portrait'),last=control('any');release!();await Promise.all([first,stale,last]);expect(calls).toEqual(['landscape','any']);
});
it('resizes a sharp canvas buffer without changing gameplay coordinates',()=>{
 const canvas=document.createElement('canvas'),setTransform=vi.fn();vi.spyOn(canvas,'getContext').mockReturnValue({setTransform} as any);
 let width=300;vi.spyOn(canvas,'getBoundingClientRect').mockImplementation(()=>({width,height:width/2} as DOMRect));
 const media=vi.spyOn(window,'matchMedia').mockReturnValue({addEventListener:vi.fn(),removeEventListener:vi.fn()} as any);
 vi.stubGlobal('devicePixelRatio',2);const resolution=createCanvasResolution(canvas,600,300)!;expect(canvas.width).toBe(600);expect(canvas.height).toBe(300);
 width=500;resolution.resize();expect(canvas.width).toBe(1000);expect(setTransform).toHaveBeenLastCalledWith(1000/600,0,0,500/300,0,0);resolution.dispose();media.mockRestore();vi.unstubAllGlobals();
});
