const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../assets/data.js');
const E = require('../assets/engine.js');
const score = (s,id) => E.scores(s).find(e => e.id === id);

test('29 unique factors and all emotion/scenario references are valid', () => {
  const ids = new Set(D.factors.map(f=>f.id));
  assert.equal(ids.size,29);
  for (const emotion of D.emotions) {
    assert.equal(new Set(emotion.items).size, emotion.items.length);
    for (const id of emotion.items) assert(ids.has(id));
  }
  for (const scenario of D.scenarios) for (const step of scenario.steps) {
    for (const [id,value] of step.changes) { assert(ids.has(id)); assert([null,0,1].includes(value)); }
    for (const id of step.active) assert(ids.has(id));
    for (const turn of step.turns) assert(scenario.dialogue[turn]);
  }
});
test('four shared Anger/Frustration factors produce a tie and no move', () => {
  const s=E.replay(D.scenarios[0],1);
  assert.equal(score(s,'Anger').yes,4);
  assert.equal(score(s,'Frustration').yes,4);
  assert.equal(E.ranking(s).canMove,false);
  assert.equal(E.move(s).current,'Anger');
  assert.deepEqual(E.compare('Anger','Frustration').shared,[1,5,7,13]);
});
test('shared evidence propagates globally; checking a node cannot count it twice', () => {
  let s=E.setEvidence(E.blank(),1,1).state;
  s=E.setEvidence(s,1,1).state;
  for (const id of ['Anger','Frustration','Fear','Sadness','Disgust']) assert.equal(score(s,id).yes,1);
  assert.equal(score(s,'Joy').yes,0);
});
test('unique evidence permits a strict move and rechecking permits moving back', () => {
  let s=E.replay(D.scenarios[0],3);
  assert.equal(s.current,'Frustration');
  assert.deepEqual(s.history,['Anger','Frustration']);
  s=E.applyChanges(s,[[3,1],[15,1],[16,1]]);
  assert.equal(E.ranking(s).target,'Anger');
  s=E.move(s);
  assert.deepEqual(s.history,['Anger','Frustration','Anger']);
  assert.deepEqual(E.move(s).history,s.history);
});
test('unknown and negative evidence are separate and do not subtract from positives', () => {
  const s=E.applyChanges(E.blank('Fear'),[[1,1],[11,0]]);
  assert.deepEqual(score(s,'Fear'),{id:'Fear',yes:1,no:1,unknown:6,total:8});
  assert.equal(s.evidence[25],null);
});
test('opposing values cannot both be yes; unrelated causes are not auto-exclusive', () => {
  let s=E.applyChanges(E.blank(),[[10,1],[11,1],[3,1],[4,1]]);
  assert.equal(s.evidence[10],0);
  assert.equal(s.evidence[11],1);
  assert.equal(s.evidence[3],1);
  assert.equal(s.evidence[4],1);
  assert.throws(()=>E.setEvidence(s,30,1));
  assert.throws(()=>E.setEvidence(s,1,'yes'));
});
test('Fear/Sadness replay retains missing modalities and restores earlier state', () => {
  const scenario=D.scenarios[1];
  const end=E.replay(scenario,7), start=E.replay(scenario,0), middle=E.replay(scenario,4);
  assert.equal(end.current,'Sadness');
  assert.equal(score(end,'Fear').yes,2);
  assert.equal(score(end,'Sadness').yes,3);
  for (const id of [6,9,19,20,21,22,23,24,25]) assert.equal(end.evidence[id],null);
  assert.equal(middle.current,'Fear');
  assert.equal(E.ranking(middle).target,'Sadness');
  assert.equal(start.current,'Fear');
  assert.deepEqual(start.history,['Fear']);
  assert.equal(start.evidence[10],null);
});
test('Fear/Surprise shared expressions tie before distinguishing evidence arrives', () => {
  const scenario=D.scenarios[2];
  const shared=E.replay(scenario,1), end=E.replay(scenario,4);
  assert.equal(E.ranking(shared).canMove,false);
  assert.equal(score(shared,'Fear').yes,2);
  assert.equal(score(shared,'Surprise').yes,2);
  assert.equal(end.current,'Surprise');
  assert.equal(score(end,'Surprise').yes,5);
});
test('next questions come from unknown distinguishing factors, not shared factors', () => {
  const s=E.replay(D.scenarios[0],1);
  assert.deepEqual(E.nextChecks(s,'Anger','Frustration'),[3,14,15,16,4]);
  assert.deepEqual(E.bestPartners('Anger'),[{id:'Frustration',count:4}]);
});
