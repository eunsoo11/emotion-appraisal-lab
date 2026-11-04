/* Shared by the browser and the dependency-free Node tests. */
(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.EmotionData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const factors = [
    [1, '목표 불일치', '텍스트'], [2, '목표 일치', '텍스트'],
    [3, '타인에게 원인 귀속', '텍스트'], [4, '상황·사건 중심', '텍스트'],
    [5, '높은 통제 가능성', '텍스트'], [6, '낮은 통제 가능성', '텍스트'],
    [7, '수단적 문제', '텍스트', '수단적 문제(목표 방해)'],
    [8, '내재적 문제', '텍스트', '내재적 문제(대상 자체의 부정적 속성)'],
    [9, '보상 획득 동기', '텍스트'], [10, '결과의 확실성', '텍스트'],
    [11, '결과의 불확실성', '텍스트'], [12, '사건과 예상의 불일치', '텍스트'],
    [13, '내려간 눈썹', '이미지'], [14, '각진 입 모양', '이미지'],
    [15, '고함', '오디오'], [16, '비난하는 발화 내용', '텍스트'],
    [17, '미소', '이미지'], [18, '뛰어오르는 행동', '이미지'],
    [19, '올라간 눈썹', '이미지'], [20, '커진 눈', '이미지'],
    [21, '뒤로 당겨진 입술', '이미지'], [22, '도주 행동', '이미지'],
    [23, '올라간 눈썹 안쪽', '이미지'], [24, '눈물', '이미지'],
    [25, '소리가 동반되는 울음', '오디오'], [26, '벌어진 입', '이미지'],
    [27, '놀라 숨을 들이키는 소리', '오디오'],
    [28, '코를 찡그리는 표정', '이미지'], [29, '대상을 밀어내는 행동', '이미지']
  ].map(([id, name, modality, full]) => ({ id, name, modality, full: full || name }));
  const emotions = [
    { id: 'Anger', label: 'Anger', items: [1,3,5,7,13,14,15,16] },
    { id: 'Frustration', label: 'Frustration', items: [1,4,5,7,13] },
    { id: 'Joy', label: 'Happiness·Joy', items: [2,4,9,10,17,18] },
    { id: 'Fear', label: 'Fear', items: [1,4,6,11,19,20,21,22] },
    { id: 'Sadness', label: 'Sadness', items: [1,4,6,9,10,23,24,25] },
    { id: 'Surprise', label: 'Surprise', items: [12,19,20,26,27] },
    { id: 'Disgust', label: 'Disgust', items: [1,4,5,8,28,29] }
  ];
  const scenarios = [
    {
      id: 'anger-frustration', title: '01 · Anger와 Frustration',
      subtitle: '공통된 4개 요소만으로는 후보가 바뀌지 않습니다.',
      initial: 'Anger', compare: 'Frustration', practiceStep: 1,
      dialogue: [
        ['A', '왜 자꾸 제출이 안 돼?'],
        ['B', '서버 오류래. 설정만 바꾸면 다시 보낼 수 있대.'],
        ['Target · A', '마감 직전인데 자꾸 막히네. 설정부터 바꿔볼게.']
      ],
      inputNote: '교육용 가상 사례 · 내려간 눈썹을 영상에서 확인했다는 가정입니다. 실제 영상은 첨부되지 않았습니다.',
      steps: [
        { title: '초기 예측: Anger', text: '초기 분류기 출력이 Anger라고 가정합니다. 평가 요소는 아직 확인하지 않았습니다.', changes: [], active: [], turns: [2] },
        { title: '공통 4개 요소 확인 → 동률', text: '목표 불일치·높은 통제 가능성·수단적 문제·내려간 눈썹을 해당으로 기록합니다. Anger와 Frustration이 모두 4점이므로 이동을 보류합니다.', changes: [[1,1],[5,1],[7,1],[13,1]], active: [1,5,7,13], turns: [1,2] },
        { title: '두 후보를 구분하는 근거 확인', text: '대화에서 타인을 탓하기보다 서버 오류와 설정 변경에 초점을 둔다고 해석합니다. 상황·사건 중심=해당, 타인에게 원인 귀속=비해당으로 기록합니다.', changes: [[4,1],[3,0]], active: [3,4], turns: [1,2] },
        { title: '후보 이동: Anger → Frustration', text: '해당 항목 수가 Anger 4개, Frustration 5개가 되어 검토 후보를 이동합니다. 비해당 항목은 따로 표시하며 점수에서 차감하지 않습니다.', changes: [], active: [4], turns: [1,2], move: true },
        { title: '잠정 후보: Frustration', text: '현재 확인한 근거에서는 Frustration을 우선 검토합니다. 직접 실습으로 전환해 타인 원인·고함·비난 발화 등을 다르게 평가해 보세요.', changes: [], active: [], turns: [], final: true }
      ]
    },
    {
      id: 'fear-sadness', title: '02 · Fear에서 Sadness로',
      subtitle: '이미 확정된 면접 결과를 확인하며 후보를 갱신합니다.',
      initial: 'Fear', compare: 'Sadness', practiceStep: 2,
      dialogue: [
        ['A', '면접 결과 나왔어?'], ['B', '응. 또 떨어졌어.'],
        ['A', '아.. 이번에는 정말 기대했는데.'],
        ['Target · B', '괜찮아, 뭐. 익숙한 일이잖아.']
      ],
      inputNote: '사용자가 제공한 대화 예시 · 입력은 대화문뿐입니다. 화자 B의 표정과 음성은 미확인으로 남깁니다.',
      steps: [
        { title: '초기 예측: Fear', text: '검토 대상은 마지막 발화의 B와 이번 면접 결과입니다. 초기 예측을 Fear라고 가정합니다.', changes: [], active: [], turns: [3] },
        { title: '공통 근거: 목표 불일치', text: 'B의 “또 떨어졌어”를 면접 맥락에서 원치 않은 결과로 해석합니다. 목표 불일치=해당, 목표 일치=비해당으로 기록합니다.', changes: [[1,1],[2,0]], active: [1,2], turns: [1] },
        { title: '공통 근거: 상황·사건 중심', text: '반복된 불합격 상황에 초점을 둔다고 해석합니다. Fear와 Sadness 모두 해당 항목 수가 2개가 됩니다.', changes: [[4,1]], active: [4], turns: [1,3] },
        { title: '통제 가능성: 근거 부족', text: '“익숙하다”만으로 결과를 바꿀 수 없다고 단정하지 않습니다. 낮은 통제 가능성은 미확인으로 남겨 점수를 유지합니다.', changes: [[6,null]], active: [6], turns: [3] },
        { title: '구분 근거: 결과가 이미 확정됨', text: '“응. 또 떨어졌어”에서 이번 면접의 불합격 결과는 이미 알려져 있습니다. 결과의 확실성=해당, 불확실성=비해당으로 기록합니다. 미래의 다른 면접에 대한 불안을 판단한 것은 아닙니다.', changes: [[10,1],[11,0]], active: [10,11], turns: [1] },
        { title: '후보 이동: Fear → Sadness', text: 'Fear 2개, Sadness 3개입니다. 확인한 근거를 유지한 채 검토 후보를 Sadness로 이동합니다.', changes: [], active: [1,4,10], turns: [1], move: true },
        { title: '추가 조건: 확인할 수 없는 근거', text: '동기의 종류는 명시되지 않았습니다. A의 “기대했는데”를 B의 생각으로 옮기지 않습니다. B의 표정·음성 자료도 없으므로 관련 항목은 미확인입니다.', changes: [[9,null],[19,null],[20,null],[21,null],[22,null],[23,null],[24,null],[25,null]], active: [9,19,20,21,22,23,24,25], turns: [2,3] },
        { title: '잠정 후보: Sadness', text: '현재 근거에서는 Sadness를 우선 검토합니다. Neutral 가능성은 남아 있으며 실제 감정을 확정한 결과가 아닙니다.', changes: [], active: [1,4,10], turns: [3], final: true }
      ]
    },
    {
      id: 'fear-surprise', title: '03 · Fear와 Surprise',
      subtitle: '비슷한 표정 뒤에 있는 예상 불일치를 확인합니다.',
      initial: 'Fear', compare: 'Surprise', practiceStep: 1,
      dialogue: [['A', '문 좀 열어봐.'], ['친구들', '생일 축하해!'], ['Target · B', '헉! 너희가 올 줄은 전혀 몰랐어!']],
      inputNote: '교육용 가상 사례 · 올라간 눈썹·커진 눈·벌어진 입과 놀라 숨을 들이키는 소리가 관찰되었다고 가정합니다.',
      steps: [
        { title: '초기 예측: Fear', text: '초기 분류기가 Fear를 출력했다고 가정합니다. 이 단계에서는 표정의 의미를 확정하지 않습니다.', changes: [], active: [], turns: [2] },
        { title: '공통 표정 2개 확인 → 동률', text: '올라간 눈썹·커진 눈은 Fear와 Surprise에 공통입니다. 둘 다 2점이므로 표정 두 개만으로 후보를 이동하지 않습니다.', changes: [[19,1],[20,1]], active: [19,20], turns: [2] },
        { title: '예상 불일치와 추가 단서 확인', text: '“올 줄은 전혀 몰랐어”를 예상 불일치로 평가합니다. 가상 영상의 벌어진 입과 가상 음성의 들이키는 소리도 반영하여 Surprise가 5점이 됩니다.', changes: [[12,1],[26,1],[27,1]], active: [12,26,27], turns: [1,2] },
        { title: '후보 이동: Fear → Surprise', text: 'Fear 2개, Surprise 5개입니다. 공통 표정에 더해 확인한 구분 근거를 바탕으로 검토 후보를 이동합니다.', changes: [], active: [12], turns: [2], move: true },
        { title: '잠정 후보: Surprise', text: '직접 실습으로 전환해 예상 불일치를 미확인으로 되돌리거나 다른 조건을 추가해 보세요. 후보 이동은 항상 단독 최상위 여부를 다시 확인합니다.', changes: [], active: [], turns: [], final: true }
      ]
    }
  ];
  return { factors, emotions, scenarios, opposites: [[1,2],[5,6],[10,11]] };
});
