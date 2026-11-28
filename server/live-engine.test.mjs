import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLiveMatch,advanceLive,applyLiveInputs,disconnectLive,vacantCell,liveGravityDifficulty} from './live-engine.mjs';
const match=(game='snake')=>createLiveMatch(game,12345,1000);
for(const [name,head,dir,expected] of [['left',[0,0],[-1,0],[47,0]],['right',[47,29],[1,0],[0,29]],['top',[0,0],[0,-1],[0,29]],['bottom',[47,29],[0,1],[47,0]]])test('shared Snake wraps '+name+' including corners',()=>{
 const s=match();s.players[0].body=[head];s.players[0].direction=dir;advanceLive(s,1120);assert.deepEqual(s.players[0].body[0],expected);assert.equal(s.result,'');
});
test('food grows only its eater and controls cannot reverse or replay',()=>{
 const s=match();s.food=[[11,9],[2,2],[3,3]];advanceLive(s,1120);assert.equal(s.players[0].score,10);assert.equal(s.players[0].body.length,6);assert.equal(s.players[1].body.length,5);
 applyLiveInputs(s,0,[{seq:1,turn:[-1,0]},{seq:2,turn:[0,-1]},{seq:2,turn:[0,1]},null]);advanceLive(s,1240);assert.deepEqual(s.players[0].body[0],[11,8]);assert.equal(s.players[0].seq,2);
});
test('both players lose together on a head-on collision regardless of score',()=>{
 const s=match();s.players[0].body=[[10,10]];s.players[1].body=[[12,10]];s.players[0].score=40;advanceLive(s,1120);assert.equal(s.result,'draw');assert.equal(s.events.length,2);
});
test('hitting an opponent body loses the round',()=>{
 const s=match();s.players[0].body=[[10,10]];s.players[1].body=[[12,11],[11,11],[11,10],[12,10]];s.players[1].direction=[0,1];advanceLive(s,1120);assert.equal(s.result,'O');
});
test('bombs never spawn on snakes or food and explode when armed',()=>{
 const s=match();advanceLive(s,6160);assert(s.bombs.length>0);
 for(const b of s.bombs){assert(![...s.players.flatMap(p=>p.body),...s.food].some(c=>String(c)===String(b.cell)));assert(b.armed>s.time);}
 const hit=match();hit.bombs=[{cell:[11,9],armed:1000,expires:5000}];advanceLive(hit,1120);assert.equal(hit.result,'O');assert.deepEqual(hit.events[0].cell,[11,9]);
 const warning=match();warning.bombs=[{cell:[11,9],armed:2000,expires:5000}];advanceLive(warning,1120);assert.equal(warning.result,'');
 const full=match();full.cols=1;full.rows=1;full.food=[[0,0]];assert.equal(vacantCell(full),null);
});
test('Gravity Run syncs both players, ignores duplicate flips and increases difficulty',()=>{
 const s=match('gravity-flip');applyLiveInputs(s,0,[{seq:1,flip:true},{seq:1,flip:true}]);advanceLive(s,1200);assert(s.players[0].y<s.players[1].y);assert.equal(s.players[0].flips,1);assert.equal(s.players[0].score,s.players[1].score);
 assert(liveGravityDifficulty(800).speed>liveGravityDifficulty(100).speed);assert(liveGravityDifficulty(800).gap<liveGravityDifficulty(100).gap);assert(liveGravityDifficulty(5000).gap>=58);
 disconnectLive(s,1);assert.equal(s.result,'X');const frozen=JSON.stringify(s);advanceLive(s,9000);applyLiveInputs(s,0,[{seq:2,flip:true}]);assert.equal(JSON.stringify(s),frozen);
});
