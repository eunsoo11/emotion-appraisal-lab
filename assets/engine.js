(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.EmotionEngine = factory(root.EmotionData);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data) {
  const byEmotion = Object.fromEntries(data.emotions.map(e => [e.id, e]));
  const ids = new Set(data.factors.map(f => f.id));
  const opposite = Object.fromEntries(data.opposites.flatMap(([a,b]) => [[a,b],[b,a]]));
  function blank(initial = 'Anger') {
    if (!byEmotion[initial]) throw new Error('Unknown initial candidate');
    return { evidence: Object.fromEntries(data.factors.map(f => [f.id, null])), current: initial, history: [initial] };
  }
  function setEvidence(state, id, value) {
    if (!ids.has(Number(id)) || ![null,0,1].includes(value)) throw new Error('Invalid evidence');
    const next = { ...state, evidence: { ...state.evidence }, history: [...state.history] };
    next.evidence[id] = value;
    const adjusted = [];
    if (value === 1 && next.evidence[opposite[id]] === 1) {
      next.evidence[opposite[id]] = 0;
      adjusted.push(Number(opposite[id]));
    }
    return { state: next, adjusted };
  }
  function applyChanges(state, changes) {
    return changes.reduce((s, [id, value]) => setEvidence(s, id, value).state, state);
  }
  function scores(state) {
    return data.emotions.map(e => {
      const yes = e.items.filter(id => state.evidence[id] === 1).length;
      const no = e.items.filter(id => state.evidence[id] === 0).length;
      return { id: e.id, yes, no, unknown: e.items.length - yes - no, total: e.items.length };
    });
  }
  function ranking(state) {
    const all = scores(state);
    const max = Math.max(...all.map(e => e.yes));
    const leaders = all.filter(e => e.yes === max);
    const current = all.find(e => e.id === state.current);
    const canMove = leaders.length === 1 && leaders[0].id !== state.current && max > current.yes;
    return { all, max, leaders, canMove, target: canMove ? leaders[0].id : null };
  }
  function move(state) {
    const { target } = ranking(state);
    return target ? { ...state, current: target, history: [...state.history, target] } : state;
  }
  function compare(a, b) {
    const x = byEmotion[a].items, y = byEmotion[b].items;
    return { shared: x.filter(id => y.includes(id)), onlyA: x.filter(id => !y.includes(id)), onlyB: y.filter(id => !x.includes(id)) };
  }
  function bestPartners(id) {
    const others = data.emotions.filter(e => e.id !== id).map(e => ({ id: e.id, count: compare(id,e.id).shared.length }));
    const max = Math.max(...others.map(e => e.count));
    return others.filter(e => e.count === max);
  }
  function nextChecks(state, a, b) {
    const c = compare(a,b);
    return [...c.onlyA, ...c.onlyB].filter(id => state.evidence[id] === null);
  }
  function replay(scenario, index) {
    if (!Number.isInteger(index) || index < 0 || index >= scenario.steps.length) throw new Error('Invalid story step');
    let state = blank(scenario.initial);
    for (let i=0; i<=index; i++) {
      state = applyChanges(state, scenario.steps[i].changes);
      if (scenario.steps[i].move) state = move(state);
    }
    return state;
  }
  return { blank, setEvidence, applyChanges, scores, ranking, move, compare, bestPartners, nextChecks, replay };
});
