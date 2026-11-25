/* ══════════════════════════════════════════════════════════════
   Week 14 — 최종 프로젝트 ② 검증
   testbench · 자체검사 · 보드 시연 준비
══════════════════════════════════════════════════════════════ */
export const W = {
  id: "w14", no: 14, lab: "proj2", labTitle: "프로젝트 ② 검증",
  topic: "프로젝트 ② 검증",
  h1: "맞는지 증명한다",
  lead: "\"보드에서 되던데요\" 는 증명이 아닙니다. <b>자체검사 testbench</b>로 모든 경우를 돌려 " +
        "PASS 를 받아 내는 것이 이번 주의 일입니다.",
  chips: ["자체검사 TB", "경계값", "flag 검증", "보드 시연 준비"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w14", count: 21, pad: 2, per: 8, title: "W14 프로젝트 ② 검증", narration: "w14" },
  footnote: "제출은 팀원 각자 합니다.",

  concepts: [
    { q: "<b>자체검사</b> testbench 란?",
      opts: ["waveform 을 눈으로 보는 testbench",
             "기대값을 스스로 계산해 틀리면 알려 주는 testbench",
             "synthesis 까지 하는 testbench",
             "보드에서 도는 testbench"], ans: 1 },
    { q: "4비트 ALU 의 ADD 를 <b>exhaustive test</b>하면 몇 가지입니까?",
      opts: ["16", "32", "256", "512"], ans: 2 },
    { q: "경계값을 먼저 넣어 보는 까닭은?",
      opts: ["빨라서",
             "overflow·carry 처럼 틀리기 쉬운 곳이 경계에 몰려 있어서",
             "문법 검사가 되어서",
             "synthesis 결과가 달라져서"], ans: 1 },
    { q: "simulation 은 통과하는데 보드에서 안 될 때 가장 먼저 볼 것은?",
      opts: ["pin assignment 와 KEY 의 극성(눌림=0)",
             "clock 주파수",
             "testbench",
             "ALU 의 연산표"], ans: 0 },
    { q: "<code>assert</code> 문을 쓰는 목적은?",
      opts: ["simulation 을 멈추려고",
             "기대와 다르면 메시지를 내고 실패를 알리려고",
             "synthesis 에 쓰려고",
             "waveform 을 저장하려고"], ans: 1 },
  ],

  ready: {
    pre: [
      { label: "개념 확인 채점", ok: (t, f, S) => S.cGraded },
      { label: "검사 계획 적기 (60자 이상)", ok: (t) => t("plan").length >= 60 },
      { label: "직접 고른 경계값 적기", ok: (t) => t("edge").length >= 30 },
    ],
    in: [
      { label: "testbench 올리기", ok: (t, f) => f("tb") },
      { label: "PASS 화면 올리기", ok: (t, f) => f("pass") },
      { label: "찾은 버그 적기", ok: (t) => t("bug").length >= 20 },
    ],
    post: [
      { label: "검증 보고 적기 (80자 이상)", ok: (t) => t("report").length >= 80 },
      { label: "보드 시연 영상 올리기", ok: (t, f) => f("video") },
      { label: "남은 문제 적기", ok: (t) => t("left").length >= 20 },
    ],
  },

  pre: {
    head: "수업 전에 할 일",
    sub: "무엇을 어떻게 확인할지 <b>먼저 정합니다</b>. testbench 는 계획이 있어야 쓸 수 있습니다.",
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "10점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "한 문항 2점입니다." }] },
      { no: 2, title: "검사 계획", pts: "12점", widget: "textArea",
        area: { id: "plan", tall: true,
                ph: "예) ① ALU 8가지 연산을 op1·op2 전수(256)로 돌려 결과와 C/V/Z 를 모두 비교한다. ② FSM 은 …" },
        blocks: [
          { t: "p", html: "<b>무엇을</b> <b>어떤 입력으로</b> <b>무엇과 비교해</b> 확인할지 적으세요." },
          { t: "table", caption: "세 층으로 나눠 생각하면 쉽습니다",
            head: ["층", "무엇을", "어떻게"],
            rows: [["부품", "ALU 하나", "op1·op2 전수 256가지 × 연산 8가지"],
                   ["datapath", "reg_file + ALU", "값을 쓰고 읽어 ALU 결과와 비교"],
                   ["전체", "FSM 까지", "KEY 차례를 흉내 내어 t0~t5 시나리오"]] },
          { t: "note", html: "<b>전부 전수로 돌릴 필요는 없습니다.</b> 부품은 전수, 전체는 시나리오 — " +
            "5주차 adder-subtractor 에서 512가지를 돌려 본 그 방식 그대로입니다." },
        ] },
      { no: 3, title: "경계값 고르기", pts: "8점", widget: "textArea",
        area: { id: "edge", ph: "예) 0111 + 0001 (overflow), 1111 + 0001 (carry), 1000 - 0001 (음수 경계) …" },
        blocks: [{ t: "p", html: "손으로 먼저 확인할 <b>경계값 다섯 가지</b>를 고르고 각각 왜 골랐는지 적으세요. " +
          "틀리기 쉬운 곳은 거의 언제나 경계에 몰려 있습니다." }, { t: "note", html: "다섯 개를 <b>먼저 혼자</b> 고른 뒤, AI 에게 \"이 회로에서 틀리기 쉬운 경계값\" 을 물어 견주어 보세요. AI 가 더해 준 것이 정말 경계인지 직접 판단해서, 받아들였다면 <b>(AI)</b> 라고 표시합니다." }] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "수업 중 — testbench 를 돌린다",
    sub: "계획대로 자체검사 testbench 를 쓰고, PASS 가 나올 때까지 고칩니다.",
    steps: [
      { no: 1, title: "testbench", pts: "20점", widget: "upload",
        up: { id: "tb", label: "testbench 소스 (.vhd 또는 zip)", accept: ".vhd,.zip", multiple: true },
        blocks: [
          { t: "p", html: "5주차부터 써 온 채점기와 같은 모양으로 쓰면 됩니다 — " +
            "기대값을 testbench 가 <b>스스로 계산</b>하고, 다르면 어떤 입력에서 틀렸는지 찍어 줍니다." },
          { t: "code", key: "tbshape", name: "자체검사 testbench 의 모양", text:
`for a in 0 to 15 loop
  for b in 0 to 15 loop
    op1 <= std_logic_vector(to_unsigned(a, 4));
    op2 <= std_logic_vector(to_unsigned(b, 4));
    wait for 1 ns;
    want := (a + b) mod 16;                      -- 기대값을 여기서 계산
    if to_integer(unsigned(alu_out)) /= want then
      bad := bad + 1;
      report "MISMATCH a=" & integer'image(a) & " b=" & integer'image(b);
    end if;
  end loop;
end loop;
assert bad = 0 report "ALU check failed" severity failure;` },
          { t: "note", html: "<b>문자열은 ASCII 만 쓰세요.</b> GHDL 은 VHDL 문자열 안의 한글을 거부합니다. " +
            "주석에는 한글을 써도 됩니다." },
        ] },
      { no: 2, title: "PASS 화면", pts: "12점", widget: "upload",
        up: { id: "pass", label: "ModelSim 또는 GHDL 실행 화면 (PASS 가 보이게)", accept: "image/*,.pdf", multiple: true },
        blocks: [{ t: "p", html: "<b>몇 가지를 돌렸는지</b>가 화면에 찍혀 있어야 합니다. " +
          "\"오류 없음\" 만으로는 몇 가지를 검사했는지 알 수 없습니다." }] },
      { no: 3, title: "찾은 버그", pts: "8점", widget: "textArea",
        area: { id: "bug", tall: true,
                ph: "예) SUB 에서 op1 < op2 일 때 C 가 반대로 나왔다. diff(4) 를 그대로 쓴 것이 원인이었고 …" },
        blocks: [{ t: "p", html: "<b>버그를 찾은 팀이 점수를 받습니다.</b> " +
          "\"처음부터 다 맞았다\" 는 보통 검사가 모자란 것입니다 — 경계값을 더 넣어 보세요. " +
          "찾았다면 <b>증상 · 원인 · 고친 곳</b>을 적으세요." }, { t: "note", html: "AI 가 제안한 테스트로 찾은 버그, 또는 <b>AI 가 틀린 지적을 해서 그것을 반박한 일</b>도 한 건으로 적을 수 있습니다. 어느 쪽이었는지 밝히세요." }] },
      { no: 4, title: "제출", widget: "submitIn",
        blocks: [{ t: "p", html: "실습실을 나가기 전에 제출하세요." }] },
    ],
  },

  post: {
    head: "수업 후 — 검증 보고와 시연 준비",
    sub: "무엇을 얼마나 확인했는지 적고, 보드 시연을 녹화해 둡니다.",
    steps: [
      { no: 1, title: "검증 보고", pts: "15점", widget: "textArea",
        area: { id: "report", tall: true,
                ph: "예) ALU 는 연산 8가지 × 입력 256가지 = 2048 케이스를 exhaustive test 해 전부 통과했다. FSM 은 …" },
        blocks: [
          { t: "p", html: "<b>숫자로</b> 적으세요 — 몇 가지를 돌렸고 몇 개가 통과했는지. " +
            "그리고 <b>확인하지 못한 것</b>도 함께 적으세요. 정직한 보고가 더 좋은 점수를 받습니다." },
        ] },
      { no: 2, title: "보드 시연 영상", pts: "10점", widget: "upload",
        up: { id: "video", label: "보드 동작 영상 10~30초 (mp4) 또는 연속 사진", accept: "video/*,image/*", multiple: true },
        blocks: [{ t: "p", html: "KEY 를 눌러 <b>IDLE → LOAD_A → LOAD_B → EXEC → SHOW</b> 한 바퀴가 " +
          "도는 것이 보이게 찍으세요. 15주차 발표에서 이 영상을 씁니다 — " +
          "현장에서 보드가 말을 안 들을 때를 대비한 보험이기도 합니다." }] },
      { no: 3, title: "남은 문제", pts: "5점", widget: "textArea",
        area: { id: "left", ph: "예) 연산 결과를 다시 register 에 쓸 때 가끔 한 clock 늦게 반영된다. 원인은 아직 …" },
        blocks: [{ t: "p", html: "15주차까지 남은 것을 적으세요. 없으면 \"없음\" 과 그 근거를 적습니다." }] },
      { no: 4, title: "제출", widget: "submitPost",
        blocks: [{ t: "p", html: "팀원 각자 제출하세요. 제출하면 <b>검증 보고서 PDF</b> 가 만들어집니다." }] },
    ],
  },
};
