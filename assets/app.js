(() => {
  'use strict';
  const D = window.EmotionData, E = window.EmotionEngine;
  const $ = id => document.getElementById(id);
  const factorById = Object.fromEntries(D.factors.map(f => [f.id, f]));
  const params = new URLSearchParams(window.location.search);
  let scenario = D.scenarios.find(s => s.id === params.get('scenario')) || D.scenarios[0];
  let mode = params.get('mode') === 'story' ? 'story' : 'practice';
  let step = mode === 'story' ? 0 : scenario.practiceStep;
  let state = E.replay(scenario, step);
  let focus = scenario.initial, partner = scenario.compare;
  let showAll = false, visible = [], framePending = false;
  let notice = '공통 근거와 구분 근거를 직접 바꿔 보세요. 감정 노드를 누르면 연결만 바뀌며, 현재 후보는 이동 버튼으로 변경합니다.';
  const stateLabel = value => value === 1 ? '해당' : value === 0 ? '비해당' : '미확인';
  const stateAttr = value => value === null ? 'unknown' : String(value);
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function option(value, text) { const o = element('option', '', text); o.value = value; return o; }
  D.scenarios.forEach(s => $('scenario-select').append(option(s.id, s.title)));
  D.emotions.forEach(e => $('initial-select').append(option(e.id, e.label)));
  for (const example of D.scenarios) {
    const card = element('article', 'gallery-card');
    card.dataset.scenario = example.id;
    card.append(element('h3', '', example.title), element('p', 'small secondary', example.subtitle));
    card.append(element('p', 'gallery-quote', `“${example.dialogue[example.dialogue.length-1][1]}”`));
    const actions = element('div', 'gallery-actions');
    for (const [nextMode,label] of [['story','스토리 따라가기'],['practice','직접 실습']]) {
      const button = element('button', nextMode === 'story' ? 'primary' : '', label);
      button.type = 'button';
      button.setAttribute('aria-label', `${example.title} ${label}`);
      button.addEventListener('click', () => {
        mode = nextMode;
        loadScenario(example.id);
        $('lab-workspace').scrollIntoView({block:'start'});
      });
      actions.append(button);
    }
    card.append(actions);
    $('scenario-gallery').append(card);
  }
  function choosePartner(id) {
    if (id === scenario.initial) return scenario.compare;
    if (id === scenario.compare) return scenario.initial;
    return E.bestPartners(id)[0].id;
  }
  function focusOn(id) { focus = id; partner = choosePartner(id); }
  function loadScenario(id) {
    scenario = D.scenarios.find(s => s.id === id) || D.scenarios[0];
    step = mode === 'story' ? 0 : scenario.practiceStep;
    state = E.replay(scenario, step);
    focusOn(state.current);
    notice = '예시의 시작 상태를 불러왔습니다. 확인한 근거는 화면 밖의 감정에도 동일하게 반영됩니다.';
    render();
  }
  function restoreStep(index) {
    step = index;
    state = E.replay(scenario, step);
    focusOn(state.current);
    render();
  }
  function switchMode(next) {
    if (mode === next) return;
    mode = next;
    if (mode === 'story') restoreStep(0);
    else {
      notice = '지금까지 확인한 평가 상태와 후보를 가져왔습니다. 요소를 눌러 다른 판단을 실험해 보세요.';
      render();
    }
  }
  function drawConnections() {
    const surface = $('network'), rect = surface.getBoundingClientRect(), svg = $('connections');
    if (!rect.width || !rect.height) return;
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    svg.replaceChildren();
    for (const id of visible) {
      const source = surface.querySelector(`[data-factor="${id}"]`);
      if (!source) continue;
      const a = source.getBoundingClientRect();
      for (const emotion of D.emotions.filter(e => e.items.includes(id))) {
        const target = surface.querySelector(`[data-emotion="${emotion.id}"]`);
        const b = target.getBoundingClientRect();
        const x1 = a.right - rect.left, y1 = a.top + a.height / 2 - rect.top;
        const x2 = b.left - rect.left, y2 = b.top + b.height / 2 - rect.top;
        const bend = (x2 - x1) * .52;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const value = state.evidence[id];
        path.setAttribute('d', `M${x1},${y1} C${x1+bend},${y1} ${x2-bend},${y2} ${x2},${y2}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', value === 1 ? 'var(--blue)' : value === 0 ? 'var(--orange)' : 'var(--line)');
        path.setAttribute('stroke-width', value === null ? '1' : '1.8');
        path.setAttribute('opacity', emotion.id === focus || emotion.id === partner ? '.85' : '.23');
        svg.appendChild(path);
      }
    }
  }
  function scheduleConnections() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => { framePending = false; drawConnections(); });
  }
  function renderDialogue() {
    const activeTurns = mode === 'story' ? scenario.steps[step].turns : [];
    $('dialogue').replaceChildren();
    scenario.dialogue.forEach(([speaker, line], index) => {
      const row = element('div', 'dialogue-row');
      row.dataset.active = String(activeTurns.includes(index));
      row.append(element('span', 'dialogue-who', speaker), element('span', '', `“${line}”`));
      $('dialogue').append(row);
    });
  }
  function renderFactors() {
    const c = E.compare(focus, partner);
    visible = showAll ? D.factors.map(f => f.id) : [...c.shared, ...c.onlyA, ...c.onlyB];
    const active = mode === 'story' ? scenario.steps[step].active : [];
    $('factors').replaceChildren();
    for (const id of visible) {
      const f = factorById[id], value = state.evidence[id];
      const button = element('button', 'factor-node');
      button.type = 'button';
      button.dataset.factor = String(id);
      button.dataset.value = stateAttr(value);
      button.dataset.shared = String(c.shared.includes(id));
      button.dataset.active = String(active.includes(id));
      button.disabled = mode === 'story';
      button.title = f.full;
      button.setAttribute('aria-label', `${f.full}, ${f.modality}, ${stateLabel(value)}${mode === 'practice' ? '. 클릭하여 평가 상태 변경' : ''}`);
      const meta = element('span', 'node-meta');
      meta.dataset.value = stateAttr(value);
      meta.append(element('i', 'node-dot'), document.createTextNode(`[${f.modality}] · ${stateLabel(value)}`));
      button.append(element('span', 'node-title', f.name), meta);
      button.addEventListener('click', () => {
        if (mode !== 'practice') return;
        const next = state.evidence[id] === null ? 1 : state.evidence[id] === 1 ? 0 : null;
        const update = E.setEvidence(state, id, next);
        state = update.state;
        notice = `${f.name} → ${stateLabel(next)}. 연결된 모든 감정의 점수를 갱신했습니다.`;
        if (update.adjusted.length) notice += ` 같은 사건의 반대 조건인 ${update.adjusted.map(x => factorById[x].name).join(', ')}은 비해당으로 변경했습니다.`;
        render();
        $('factors').querySelector(`[data-factor="${id}"]`)?.focus({preventScroll:true});
      });
      $('factors').append(button);
    }
  }
  function renderEmotions() {
    $('emotions').replaceChildren();
    for (const score of E.scores(state)) {
      const emotion = D.emotions.find(e => e.id === score.id);
      const button = element('button', 'emotion-node');
      button.type = 'button';
      button.dataset.emotion = score.id;
      button.dataset.current = String(score.id === state.current);
      button.dataset.yes = String(score.yes);
      button.dataset.no = String(score.no);
      button.setAttribute('aria-pressed', String(score.id === focus));
      button.setAttribute('aria-label', `${emotion.label}, 해당 ${score.yes}, 비해당 ${score.no}, 미확인 ${score.unknown}. 연결 보기`);
      button.append(element('span', '', emotion.label), element('span', 'node-count', `해당 ${score.yes} · 비해당 ${score.no}`), element('span', 'node-count secondary', `미확인 ${score.unknown}`));
      if (score.id === state.current) button.append(element('span', 'current-label', mode === 'story' && scenario.steps[step].final ? '잠정 최종 후보' : '현재 후보'));
      button.addEventListener('click', () => {
        focusOn(score.id);
        render();
        $('emotions').querySelector(`[data-emotion="${score.id}"]`)?.focus({preventScroll:true});
      });
      $('emotions').append(button);
    }
  }
  function render() {
    const isStory = mode === 'story', stage = scenario.steps[step], r = E.ranking(state);
    $('scenario-select').value = scenario.id;
    for (const card of $('scenario-gallery').children) card.dataset.selected = String(card.dataset.scenario === scenario.id);
    $('scenario-title').textContent = scenario.title;
    $('scenario-subtitle').textContent = scenario.subtitle;
    $('input-note').textContent = scenario.inputNote;
    $('mode-story').setAttribute('aria-pressed', String(isStory));
    $('mode-practice').setAttribute('aria-pressed', String(!isStory));
    $('story-controls').hidden = !isStory;
    $('practice-controls').hidden = isStory;
    $('initial-select').value = state.history[0];
    $('prev-step').disabled = step === 0;
    $('next-step').disabled = step === scenario.steps.length - 1;
    $('next-step').textContent = step === scenario.steps.length - 1 ? '스토리 완료' : scenario.steps[step+1]?.move ? '후보 이동 확인' : '다음 단계';
    $('step-number').textContent = `${step+1} / ${scenario.steps.length}`;
    $('stage-title').textContent = isStory ? stage.title : '평가 요소를 눌러 직접 확인하기';
    $('stage-text').textContent = isStory ? stage.text : notice;
    $('current-candidate').textContent = state.current;
    $('move-candidate').hidden = isStory;
    $('move-candidate').disabled = !r.canMove;
    $('move-candidate').textContent = r.canMove ? `${r.target}로 이동` : '최상위 후보로 이동';
    $('ranking').textContent = r.max === 0 ? '확인된 해당 항목이 없습니다. 근거부터 확인하세요.' : `예시 점수: 해당 항목 수 · ${r.leaders.length > 1 ? '공동 최상위' : '최상위'} ${r.leaders.map(e => e.id).join(', ')} (${r.max})${r.leaders.length > 1 ? ' · 동률: 이동 보류' : ''}`;
    $('history').textContent = `후보 이동: ${state.history.join(' → ')}`;
    $('factor-instruction').textContent = isStory ? '평가 요소 · 현재 단계의 확인 결과' : '평가 요소 · 미확인 → 해당 → 비해당';
    const c = E.compare(focus, partner), best = E.bestPartners(focus);
    $('comparison-detail').textContent = `연결 보기: ${focus} ↔ ${partner} · 공통 ${c.shared.length}개 · 최대 공통: ${best.map(x=>x.id).join(', ')} (${best[0].count}개)`;
    $('partner-select').replaceChildren(...D.emotions.filter(e => e.id !== focus).map(e => option(e.id,e.label)));
    $('partner-select').value = partner;
    $('show-all').checked = showAll;
    const missing = E.nextChecks(state, focus, partner);
    const commonYes = c.shared.filter(id => state.evidence[id] === 1).length;
    $('next-checks').textContent = `${commonYes}개의 확인된 공통 요소는 두 후보를 모두 지지합니다. ${missing.length ? '아직 확인하지 않은 구분 요소: ' + missing.map(id=>factorById[id].full).join(' / ') : '현재 두 후보의 구분 요소는 모두 검토되었습니다. 근거의 해석이나 다른 후보도 확인하세요.'}`;
    renderDialogue();
    renderFactors();
    renderEmotions();
    scheduleConnections();
  }
  $('scenario-select').addEventListener('change', event => loadScenario(event.target.value));
  $('mode-story').addEventListener('click', () => switchMode('story'));
  $('mode-practice').addEventListener('click', () => switchMode('practice'));
  $('prev-step').addEventListener('click', () => { if (mode === 'story' && step > 0) restoreStep(step-1); });
  $('next-step').addEventListener('click', () => { if (mode === 'story' && step < scenario.steps.length-1) restoreStep(step+1); });
  $('initial-select').addEventListener('change', event => {
    state = { ...state, current: event.target.value, history: [event.target.value] };
    focusOn(state.current);
    notice = '초기 후보를 변경했습니다. 확인한 평가 요소는 유지하고 후보 이동 이력을 새로 시작합니다.';
    render();
  });
  $('reset-example').addEventListener('click', () => loadScenario(scenario.id));
  $('clear-evidence').addEventListener('click', () => {
    state = E.blank(state.history[0]);
    focusOn(state.current);
    notice = '모든 평가 요소를 미확인으로 비웠습니다. 새 근거를 입력하세요.';
    render();
  });
  $('partner-select').addEventListener('change', event => { partner = event.target.value; render(); });
  $('show-all').addEventListener('change', event => { showAll = event.target.checked; render(); });
  $('move-candidate').addEventListener('click', () => {
    if (mode !== 'practice') return;
    const old = state.current;
    state = E.move(state);
    if (old !== state.current) {
      focusOn(state.current);
      notice = `${old} → ${state.current}. 기존 평가 상태를 유지했습니다. 새 후보의 미확인 요소를 이어서 검토하세요.`;
    }
    render();
  });
  new ResizeObserver(scheduleConnections).observe($('network'));
  render();
})();
