/* ══════════════════════════════════════════════════════════════
   Week 13 — 최종 프로젝트 ① 설계
   실습 대신 팀 산출물 : state diagram · datapath 통합 · 설계서
══════════════════════════════════════════════════════════════ */
export const W = {
  id: "w13", no: 13, lab: "proj1", labTitle: "프로젝트 ① 설계",
  topic: "프로젝트 ① 설계",
  h1: "state diagram 부터 그린다",
  lead: "datapath 는 12주차에 이미 만들었습니다. 이번 주에 할 일은 <b>제어 FSM 의 state diagram 을 확정</b>하고 " +
        "datapath 에 연결하는 것입니다. <b>수업 전</b>에 state diagram 초안을 그려 오고, " +
        "<b>수업 중</b>에 확인받고 통합하고, <b>수업 후</b>에 설계서를 냅니다.",
  chips: ["state diagram 확정", "datapath 통합", "설계서", "역할 분담"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w13", count: 23, pad: 2, per: 8, title: "W13 프로젝트 ① 설계", narration: "w13" },
  footnote: "제출은 팀원 각자 합니다. 같은 팀이면 같은 산출물을 올려도 됩니다.",

  concepts: [
    { q: "제어 FSM 과 datapath 를 나누면 무엇이 좋습니까?",
      opts: ["코드가 짧아진다",
             "데이터가 흐르는 길과 \"언제 무엇을 할지\" 를 따로 설계하고 따로 검증할 수 있다",
             "핀이 줄어든다",
             "clock 이 빨라진다"], ans: 1 },
    { q: "Moore FSM 으로 제어부를 만들 때 <b>출력</b>(we, 주소, f) 은 무엇으로 정합니까?",
      opts: ["지금 상태만으로", "지금 상태와 입력으로",
             "clock 으로", "datapath 의 결과로"], ans: 0 },
    { q: "KEY 를 FSM 의 진행 신호로 쓸 때 반드시 거쳐야 하는 것은?",
      opts: ["tick_gen", "debounce 와 edge 검출",
             "register file", "7-segment decoder"], ans: 1 },
    { q: "state diagram 을 먼저 그리는 까닭으로 가장 알맞은 것은?",
      opts: ["보고서에 넣어야 해서",
             "코드부터 쓰면 빠지는 경우가 반드시 생겨서",
             "synthesis 기가 요구해서",
             "simulation 이 빨라져서"], ans: 1 },
    { q: "register file 에 값을 쓰는 clock 에 제어부가 내보내야 하는 것은?",
      opts: ["we 와 waddr 와 wdata 가 모두 맞아떨어져야 한다",
             "we 만 1 이면 된다",
             "주소만 맞으면 된다",
             "clock 을 멈춰야 한다"], ans: 0 },
  ],

  ready: {
    pre: [
      { label: "개념 확인 채점", ok: (t, f, S) => S.cGraded },
      { label: "state diagram 초안 올리기", ok: (t, f) => f("draft") },
      { label: "상태 목록 적기 (40자 이상)", ok: (t) => t("states").length >= 40 },
    ],
    in: [
      { label: "확인받은 state diagram 올리기", ok: (t, f) => f("sd") },
      { label: "통합 코드 올리기", ok: (t, f) => f("src") },
      { label: "컴파일 결과 캡처", ok: (t, f) => f("cap") },
      { label: "오늘 막힌 곳 적기", ok: (t) => t("stuck").length >= 20 },
    ],
    post: [
      { label: "설계서 올리기", ok: (t, f) => f("doc") },
      { label: "설계 결정 세 가지 적기", ok: (t) => t("why").length >= 80 },
      { label: "다음 주 계획 적기", ok: (t) => t("next").length >= 30 },
    ],
  },

  pre: {
    head: "수업 전에 할 일",
    sub: "팀이 모여 <b>state diagram 초안</b>을 그려 옵니다. 종이에 손으로 그린 것이면 충분합니다.",
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "10점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "프로젝트에 바로 쓰이는 것만 모았습니다. 한 문항 2점입니다." }] },
      { no: 2, title: "상태 목록 적기", pts: "12점", widget: "textArea",
        area: { id: "states", tall: true,
                ph: "예) IDLE: 아무것도 안 함, KEY1 을 누르면 LOAD_A 로 / LOAD_A: SW 값을 A 쪽 register 에 쓴다 (we=1, waddr=…) / …" },
        blocks: [
          { t: "p", html: "상태를 <b>하나씩 줄바꿈해</b> 적으세요. 각 줄에 " +
            "<b>그 상태에서 무엇을 내보내는지</b>와 <b>무엇을 만나면 어디로 가는지</b>를 함께 씁니다." },
          { t: "table", caption: "기본 뼈대 — 여기서 시작해 팀에 맞게 고치세요",
            head: ["상태", "내보내는 것", "다음으로"],
            rows: [["IDLE", "아무 쓰기도 하지 않음", "KEY pulse → LOAD_A"],
                   ["LOAD_A", "we=1, A 쪽 주소, wdata=SW", "KEY pulse → LOAD_B"],
                   ["LOAD_B", "we=1, B 쪽 주소, wdata=SW", "KEY pulse → EXEC"],
                   ["EXEC", "f=SW[2:0], 결과를 register 에", "KEY pulse → SHOW"],
                   ["SHOW", "HEX 에 결과, LEDR 에 flag", "KEY pulse → IDLE"]] },
          { t: "note", html: "<b>상태마다 \"무엇을 내보내는가\" 를 반드시 적으세요.</b> " +
            "Moore FSM 이므로 출력은 상태만 보고 정해집니다 — " +
            "이 표가 그대로 <code>with st select</code> 코드가 됩니다." },
        ] },
      { no: 3, title: "state diagram 초안 올리기", pts: "8점", widget: "upload",
        up: { id: "draft", label: "손으로 그린 state diagram 사진 (여러 장 가능)", accept: "image/*,.pdf", multiple: true },
        blocks: [{ t: "p", html: "동그라미와 화살표, 그리고 <b>화살표마다 조건</b>이 적혀 있으면 됩니다. " +
          "예쁘게 그릴 필요 없습니다 — 수업 시간에 이것을 보며 확인합니다." }] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "수업 전까지 내세요. 초안이 없으면 수업 중에 진도를 나가지 못합니다." }] },
    ],
  },

  inc: {
    head: "수업 중 — 확인받고 통합한다",
    sub: "조교·교수 확인을 받은 뒤 datapath 와 FSM 을 하나로 합쳐 컴파일까지 끝냅니다.",
    steps: [
      { no: 1, title: "state diagram 확인받기", pts: "10점", widget: "upload",
        up: { id: "sd", label: "확인받은 state diagram (고친 것)", accept: "image/*,.pdf", multiple: true },
        blocks: [
          { t: "p", html: "초안을 들고 와 확인을 받습니다. 가장 자주 지적되는 것 세 가지는 아래와 같습니다." },
          { t: "table", cls: "tt", caption: "확인 때 보는 것",
            head: ["보는 것", "흔한 문제"],
            rows: [["모든 화살표에 조건이 있는가", "\"그 외\" 경우가 빠져 있다"],
                   ["상태마다 출력이 정해지는가", "EXEC 에서 we 를 안 내렸다"],
                   ["되돌아올 길이 있는가", "SHOW 에서 IDLE 로 못 돌아온다"]] },
        ] },
      { no: 2, title: "datapath 와 합치기", pts: "20점", widget: "upload",
        up: { id: "src", label: "통합한 소스 (zip 또는 주요 .vhd)", accept: ".zip,.vhd", multiple: true },
        blocks: [
          { t: "p", html: "12주차의 <code>reg_file</code> 과 <code>alu</code> 는 <b>건드리지 않습니다</b>. " +
            "제어 FSM 을 새로 쓰고 TOP 에서 선을 잇습니다 — 11주차에 한 것과 같은 일입니다." },
          { t: "note", html: "<b>막히면 여기부터 보세요.</b> ① KEY 는 debounce 를 거쳤는가 " +
            "② we 가 한 clock 만 올라가는가(계속 1 이면 같은 값을 반복해 쓴다) " +
            "③ 상태가 바뀌는 clock 과 값이 쓰이는 clock 이 어긋나지 않는가." },
        ] },
      { no: 3, title: "컴파일 결과", pts: "10점", widget: "upload",
        up: { id: "cap", label: "Quartus Compilation Report 캡처 (Flow Summary)", accept: "image/*,.pdf" },
        blocks: [{ t: "p", html: "Errors 0 이어야 합니다. Latch 경고가 있으면 FSM 의 출력에 " +
          "기본값을 안 준 곳이 있습니다 — 4주차의 그 문제입니다." }] },
      { no: 4, title: "오늘 막힌 곳", widget: "textArea",
        area: { id: "stuck", ph: "예) EXEC 에서 결과를 다시 register 에 쓰려니 waddr 가 A 쪽인지 B 쪽인지 정하지 못했다." },
        blocks: [{ t: "p", html: "해결했든 못 했든 적으세요. 다음 주 수업은 여기 모인 것부터 다룹니다." }] },
      { no: 5, title: "제출", widget: "submitIn",
        blocks: [{ t: "p", html: "실습실을 나가기 전에 제출하세요." }] },
    ],
  },

  post: {
    head: "수업 후 — 설계서 쓰기",
    sub: "남이 읽고 <b>그대로 다시 만들 수 있을 만큼</b> 적습니다.",
    steps: [
      { no: 1, title: "설계서", pts: "15점", widget: "upload",
        up: { id: "doc", label: "설계서 (PDF 권장)", accept: ".pdf,.docx,.md" },
        blocks: [
          { t: "p", html: "분량보다 <b>빠진 것이 없는지</b>가 중요합니다. 아래 다섯 가지가 들어 있으면 됩니다." },
          { t: "table", caption: "설계서에 들어갈 것", head: ["", "내용"],
            rows: [["1", "전체 block diagram — datapath 와 제어부를 나눠 그린 것"],
                   ["2", "state diagram — 화살표마다 조건"],
                   ["3", "포트와 신호 표 — 이름 · 폭 · 뜻"],
                   ["4", "pin assignment 표"],
                   ["5", "역할 분담과 일정"]] },
        ] },
      { no: 2, title: "설계 결정 세 가지", pts: "10점", widget: "textArea",
        area: { id: "why", tall: true,
                ph: "예) ① 결과를 A 쪽 0번 register 에 쓰기로 했다. 까닭은 … ② KEY1 하나로만 진행하게 했다. 까닭은 …" },
        blocks: [{ t: "p", html: "설계하면서 <b>둘 중 하나를 고른 자리</b>를 세 군데 골라, " +
          "무엇과 무엇 사이에서 왜 그것을 골랐는지 적으세요. " +
          "\"그렇게 하는 게 맞아서\" 는 답이 아닙니다 — <b>다른 쪽의 단점</b>을 적어야 합니다." }, { t: "note", html: "<b>AI 사용 기록.</b> 설계 중에 AI 를 썼다면 설계서 끝에 표 하나를 붙입니다 — <b>무엇을 물었나 · 무엇을 받아들였나 · 무엇이 틀렸고 어떻게 알았나</b>. state diagram 과 설계 결정은 팀이 먼저 정하고, AI 는 검토와 오류 메시지 풀이에 씁니다." }] },
      { no: 3, title: "다음 주 계획", pts: "5점", widget: "textArea",
        area: { id: "next", ph: "예) 14주차까지 testbench 20케이스를 만들고, flag C/V/Z 를 모두 확인한다." },
        blocks: [{ t: "p", html: "14주차는 <b>검증</b>입니다. 무엇을 어떻게 확인할지 미리 정해 오세요." }] },
      { no: 4, title: "제출", widget: "submitPost",
        blocks: [{ t: "p", html: "팀원 각자 제출하세요. 제출하면 <b>설계 보고서 PDF</b> 가 만들어집니다." }] },
    ],
  },
};
