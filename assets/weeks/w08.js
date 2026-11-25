/* ══════════════════════════════════════════════════════════════
   Week 08 — 중간 정리와 프로젝트 시작
   실습이 없는 주차 : 중간고사(설계 시험) + 팀 편성 + 제안서
══════════════════════════════════════════════════════════════ */
export const W = {
  id: "w08", no: 8, lab: "mid", labTitle: "중간고사와 프로젝트 착수",
  topic: "중간 정리와 프로젝트 시작",
  h1: "절반을 되짚고, 만들 것을 정한다",
  lead: "이번 주에는 실습이 없습니다. <b>수업 전</b>에 1~7주차를 스스로 점검하고, " +
        "<b>수업 중</b>에 중간고사(2시간 설계 시험)를 치르고, " +
        "<b>수업 후</b>에 팀을 짜고 프로젝트 제안서를 냅니다.",
  chips: ["1~7주차 정리", "중간고사", "팀 편성", "제안서"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w08", count: 25, pad: 2, per: 8, title: "W08 중간 정리와 프로젝트 시작", narration: "w08" },
  footnote: "중간고사는 종이 시험지로 치르고, 답안은 이 페이지에 올립니다.",

  concepts: [
    { q: "combinational circuit 에서 <b>latch</b>가 생기는 때는?",
      opts: ["감지 목록을 빠뜨렸을 때",
             "어떤 경우에 출력값이 정해지지 않을 때",
             "process 를 썼을 때",
             "when others 를 썼을 때"], ans: 1 },
    { q: "sequential circuit 의 process 에서 대입이 일어나지 않으면?",
      opts: ["latch 가 생긴다", "값을 유지한다 — 정상",
             "0 이 된다", "오류가 난다"], ans: 1 },
    { q: "<code>C</code> 와 <code>V</code> flag 의 차이는?",
      opts: ["덧셈용과 뺄셈용",
             "부호 없는 수로 볼 때와 부호 있는 수로 볼 때의 overflow",
             "하드웨어와 소프트웨어",
             "같은 것의 다른 이름"], ans: 1 },
    { q: "50 MHz 에서 1초를 만드는 바른 방법은?",
      opts: ["clock 을 5천만으로 나눈 새 clock 을 만든다",
             "5천만 clock 을 세고 한 clock 폭의 en pulse 를 올린다",
             "process 안에서 wait 를 쓴다",
             "counter 를 5천만까지 센다"], ans: 1 },
    { q: "<code>generic</code> 이 있어서 좋은 점은?",
      opts: ["포트를 줄일 수 있다",
             "같은 회로를 크기·시간만 바꿔 여러 벌 쓸 수 있다",
             "synthesis 가 빨라진다",
             "핀이 줄어든다"], ans: 1 },
  ],

  /* 실습이 없으므로 체크리스트를 직접 정한다 */
  ready: {
    pre: [
      { label: "복습 개념 확인 채점", ok: (t, f, S) => S.cGraded },
      { label: "약한 곳 적기 (40자 이상)", ok: (t) => t("weak").length >= 40 },
      { label: "질문 적기", ok: (t) => t("ask").length >= 10 },
    ],
    in: [
      { label: "답안 파일 올리기", ok: (t, f) => f("exam") },
      { label: "설계한 회로 한 줄 설명", ok: (t) => t("examnote").length >= 20 },
    ],
    post: [
      { label: "팀 정보 적기", ok: (t) => t("team").length >= 20 },
      { label: "만들 것 적기 (60자 이상)", ok: (t) => t("plan").length >= 60 },
      { label: "일정 적기", ok: (t) => t("sched").length >= 30 },
      { label: "제안서 파일 (선택)", ok: () => true },
    ],
  },

  pre: {
    head: "수업 전에 할 일",
    sub: "1~7주차를 스스로 점검합니다. 시험 범위는 여기까지입니다.",
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "복습 개념 확인", pts: "15점 · 자동채점", widget: "concept", blocks: [
        { t: "p", html: "일곱 주 동안 가장 자주 틀린 곳만 모았습니다. 한 문항 3점입니다." },
      ] },
      { no: 2, title: "약한 곳 스스로 적기", pts: "10점", widget: "textArea",
        area: { id: "weak", tall: true,
                ph: "예) 4주차의 latch 는 이해했는데, 6주차에서 '대입이 없으면 유지' 와 헷갈린다. 그리고 …" },
        blocks: [
          { t: "p", html: "아래 표를 보고 <b>다시 봐야 할 주차와 까닭</b>을 적으세요. " +
            "\"다 알겠다\" 는 답은 점수를 받지 못합니다 — 시험 전에 무엇을 더 볼지 정하는 칸입니다." },
          { t: "table", caption: "시험 범위와 각 주차의 핵심 한 줄",
            head: ["주", "주제", "꼭 알아야 하는 것"],
            rows: [["1", "FPGA · 설계 흐름", "LUT 가 truth table 을 저장한다 · 다섯 단계"],
                   ["2", "entity / architecture", "모든 줄이 동시에 존재한다"],
                   ["3", "벡터 · 선택 구문", "when-else 는 우선순위, with-select 는 값마다"],
                   ["4", "process · case", "기본값 먼저 → latch 를 막는다"],
                   ["5", "산술회로", "2's complement · C 와 V 의 차이"],
                   ["6", "clock · register", "edge 에서만 바뀐다 · en=0 이면 유지"],
                   ["7", "counter · 버튼", "파생 clock 이 아니라 clock enable"]] },
        ] },
      { no: 3, title: "질문", pts: "5점", widget: "textArea",
        area: { id: "ask", ph: "예) 시험에 state diagram 도 나옵니까? 그리고 numeric_std 변환이 헷갈립니다." },
        blocks: [{ t: "p", html: "시험 전에 다루었으면 하는 것을 적으세요. 많이 나온 것부터 수업 시작할 때 다룹니다." }] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 시험 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "중간고사 — 2시간 설계 시험",
    sub: "종이 시험지를 받아 <b>회로를 설계하고 코드를 손으로 씁니다</b>. 끝나면 답안을 여기에 올립니다.",
    steps: [
      { no: 1, title: "시험 안내", blocks: [
        { t: "p", html: "암기 시험이 아니라 <b>설계 시험</b>입니다. " +
          "주어진 사양을 읽고 block diagram 을 그린 뒤 VHDL 로 옮기는 것까지가 한 문제입니다." },
        { t: "table", caption: "시험 구성", head: ["", "내용", "비중"],
          rows: [["1부", "개념 · 코드 읽기 (단답)", "30%"],
                 ["2부", "combinational circuit 설계 — block diagram + 코드", "35%"],
                 ["3부", "sequential circuit 설계 — timing + 코드", "35%"]] },
        { t: "note", html: "<b>A반과 B반의 문제는 다릅니다.</b> 설계 목표는 같지만 회로가 다릅니다. " +
          "문법이 조금 틀려도 <b>회로가 맞으면</b> 점수를 받습니다 — 반대로 문법만 맞고 " +
          "latch 가 생기는 코드는 감점입니다." },
      ] },
      { no: 2, title: "답안 올리기", pts: "40점 · 교수 채점", widget: "upload",
        up: { id: "exam", label: "답안 사진 또는 스캔 (여러 장 가능)", accept: "image/*,.pdf", multiple: true },
        blocks: [{ t: "p", html: "시험이 끝나면 답안을 사진으로 찍거나 스캔해 올리세요. " +
          "원본 답안지는 그대로 제출하고, 이 파일은 <b>본인 보관용 기록</b>입니다." }] },
      { no: 3, title: "설계한 회로 한 줄 설명", widget: "textArea",
        area: { id: "examnote", ph: "예) 2부는 3입력 다수결에 enable 을 붙이는 문제였고, AND 세 개를 OR 로 묶은 뒤 …" },
        blocks: [{ t: "p", html: "시험장을 나오면서 <b>무엇을 설계했는지</b> 한두 줄로 적으세요. " +
          "채점 뒤 피드백을 돌려줄 때 기준이 됩니다." }] },
      { no: 4, title: "제출", widget: "submitIn",
        blocks: [{ t: "p", html: "시험 종료 후 바로 제출하세요." }] },
    ],
  },

  post: {
    head: "프로젝트 착수 — 팀과 할 일 정하기",
    sub: "13~15주차에 만들 <b>ALU + 제어 FSM</b> 의 팀을 짜고 제안서를 냅니다.",
    steps: [
      { no: 1, title: "팀 편성", pts: "10점", widget: "textArea",
        area: { id: "team", ph: "예) 20261234 홍길동(팀장·datapath), 20261235 김철수(제어 FSM), 20261236 이영희(검증·발표)" },
        blocks: [
          { t: "p", html: "3~4명으로 팀을 짜고 <b>학번 · 이름 · 맡을 부분</b>을 적으세요. " +
            "팀원 모두가 각자 이 칸에 같은 내용을 적어 제출합니다." },
          { t: "note", html: "<b>역할은 셋으로 나누는 것을 권합니다.</b> " +
            "datapath(12주차에 만든 reg_file + ALU) · 제어 FSM(9~10주차) · 검증과 발표(14~15주차). " +
            "혼자 다 하는 팀은 14주차에 반드시 막힙니다." },
        ] },
      { no: 2, title: "무엇을 만들 것인가", pts: "12점", widget: "textArea",
        area: { id: "plan", tall: true,
                ph: "예) 4비트 ALU 8가지 연산에 KEY 로 진행하는 Moore FSM 을 붙인다. IDLE 에서 KEY1 을 누르면 LOAD_A 로 가고 …" },
        blocks: [
          { t: "p", html: "최종 과제는 <b>ALU + 제어 FSM</b> 입니다. " +
            "datapath 는 12주차에 이미 만들었으니, 팀이 정할 것은 <b>제어 FSM 의 상태와 차례</b>입니다." },
          { t: "table", caption: "기본 사양 (모든 팀 공통)", head: ["부분", "내용"],
            rows: [["ALU", "4비트, F[2:0] 으로 고르는 8가지 연산, C/V/Z flag"],
                   ["register", "A 쪽 4개 · B 쪽 4개 (12주차 reg_file 두 벌)"],
                   ["제어", "KEY 로 진행하는 Moore FSM — IDLE → LOAD_A → LOAD_B → EXEC → SHOW"],
                   ["표시", "HEX 에 결과, LEDR 에 flag"]] },
          { t: "note", html: "<b>여기에 팀만의 것을 하나 더하세요.</b> 자동 반복 실행, 연산 이력 저장(12주차 RAM), " +
            "오류 입력 거르기 같은 것이면 좋습니다. 무엇을 더할지와 <b>왜</b> 더하는지를 적으세요." },
        ] },
      { no: 3, title: "일정", pts: "8점", widget: "textArea",
        area: { id: "sched", ph: "예) 13주차까지 state diagram 확정과 datapath 통합, 14주차 testbench 20케이스, 15주차 보드 시연 연습 …" },
        blocks: [{ t: "p", html: "13 · 14 · 15주차에 각각 무엇을 끝낼지 적으세요. " +
          "\"열심히 한다\" 가 아니라 <b>그 주에 끝나 있어야 할 것</b>을 적습니다." }] },
      { no: 4, title: "제안서 파일 (선택)", widget: "upload",
        up: { id: "proposal", label: "state diagram 초안이나 block diagram 을 그렸다면 올리세요 (선택)", accept: "image/*,.pdf" },
        blocks: [{ t: "p", html: "손으로 그린 state diagram 사진이면 충분합니다. 13주차에 이것부터 봅니다." }] },
      { no: 5, title: "제안서 제출", widget: "submitPost",
        blocks: [{ t: "p", html: "팀원 <b>각자</b> 제출하세요. 제출하면 <b>제안서 PDF</b> 가 만들어집니다." }] },
    ],
  },
};
