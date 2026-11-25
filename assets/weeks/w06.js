/* ══════════════════════════════════════════════════════════════
   Week 06 — clock 과 register : 값을 붙잡는 회로   (Lab 5)
   실습 reg8 (전체 코드 제공) · 과제 led_bounce — LED 왕복 (새 설계 주제)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

const hex2 = (v) => (v & 0xff).toString(16).toUpperCase().padStart(2, "0");

/** 한 clock 동안 reg8 이 하는 일 — 예습 채점과 검증에 같이 쓴다 */
export function stepReg(prev, s) {
  if (s.reset) return 0;
  if (s.en) return s.d & 0xff;
  return prev;
}

export const W = {
  id: "w06", no: 6, lab: "lab05", labTitle: "register 와 shift register",
  topic: "clock 과 register",
  h1: "값을 붙잡는 회로",
  lead: "여기서부터 회로가 <b>기억</b>하기 시작합니다. <b>수업 전</b>에 clock 마다 register 가 어떻게 되는지 미리 적어 두고, " +
        "<b>수업 중</b>에 직접 돌려 맞춰 본 뒤 보드에서 버튼으로 한 clock 씩 진행시키고, " +
        "<b>수업 후</b>에 shift register 를 스스로 설계합니다.",
  chips: ["rising_edge", "synchronous reset", "clock enable", "shift register"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w06", count: 46, pad: 2, per: 8, title: "W06 clock 과 register", narration: "w06" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w06.vcd</span>)를 그대로 읽어 그린 것입니다. " +
            "한 구간(20 ns)이 한 clock 이고, rising edge 는 구간이 시작하고 5 ns 뒤입니다.",

  concepts: [
    { q: "<code>process (clk)</code> 와 <code>if rising_edge(clk) then</code> 이 함께 뜻하는 것은?",
      opts: ["clock 이 바뀔 때마다 계산한다",
             "clock 의 rising edge 에서만 값이 바뀌는 회로를 만든다",
             "clock 을 느리게 만든다",
             "combinational circuit 을 만든다"], ans: 1 },
    { q: "<b>synchronous reset</b>이란 무엇입니까?",
      opts: ["reset 이 들어오면 즉시 0 이 된다",
             "reset 을 clock 의 edge 에서 검사해 그때 0 이 된다",
             "reset 과 clock 이 같은 신호다",
             "reset 을 쓰지 않는다는 뜻이다"], ans: 1 },
    { q: "sequential circuit 의 process 에서 <code>else</code> 를 안 써서 대입이 일어나지 않으면?",
      opts: ["latch 가 생긴다 — combinational circuit 과 같은 문제",
             "flip-flop 이 값을 그대로 유지한다 — 정상 동작",
             "컴파일 오류가 난다",
             "출력이 0 이 된다"], ans: 1 },
    { q: "<code>en = '0'</code> 일 때 register 는 어떻게 됩니까?",
      opts: ["0 이 된다", "d 값이 들어간다",
             "이전 값을 그대로 유지한다", "값이 정해지지 않는다"], ans: 2 },
    { q: "<code>generic (N : integer := 8)</code> 를 쓰는 까닭은?",
      opts: ["포트를 하나 더 만들기 위해",
             "같은 회로를 크기만 바꿔 여러 번 쓰기 위해",
             "simulation 을 빠르게 하려고",
             "clock 을 나누기 위해"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 flip-flop 과 clock enable 을 확인하고, <b>clock 마다 register 값이 어떻게 되는지</b> 미리 적어 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "q1", label: "1번째 clock 뒤 q (8비트)", len: 8, ph: "00000000" },
        { key: "q2", label: "2번째 clock 뒤 q (8비트)", len: 8, ph: "00000000" },
        { key: "q3", label: "3번째 clock 뒤 q (8비트)", len: 8, ph: "00000000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const PAT = [[1, 0, 1], [1, 1, 0], [0, 1, 1], [1, 0, 0]];
        const mk = () => {
          const d = [nx() % 256, nx() % 256, nx() % 256];
          const en = PAT[nx() % PAT.length];
          return { d, en,
            given: `d = ${bin(d[0],8)}, ${bin(d[1],8)}, ${bin(d[2],8)}` +
                   `   ·   en = ${en.join(", ")}   (reset 은 계속 0, q 는 0 에서 시작)` };
        };
        return [mk(), mk()];
      },
      model(c) {
        let q = 0;
        const out = {};
        for (let k = 0; k < 3; k++) {
          q = stepReg(q, { reset: 0, en: c.en[k], d: c.d[k] });
          out["q" + (k + 1)] = bin(q, 8);
        }
        return out;
      },
    },
    reading: {
      question: "이 process 에는 <code>else</code> 가 없습니다. <code>reset</code> 도 <code>en</code> 도 0 이면 " +
                "<code>q</code> 에 아무 대입이 일어나지 않는데, 4주차에 배운 대로라면 latch 가 생겨야 합니다. " +
                "왜 여기서는 문제가 되지 않습니까?",
      ph: "예) sequential circuit 에는 이미 flip-flop 이 있어서 …",
      askPh: "예) synchronous reset 과 asynchronous reset 이 회로로는 어떻게 다른지 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "clock 마다 값 미리 적어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "reset 을 푼 뒤 clock 이 세 번 옵니다. 매 clock 의 <code>d</code> 와 <code>en</code> 이 아래와 같을 때 " +
          "<b>clock 마다 q 가 무엇이 되는지</b> 적으세요. 학번마다 값이 다르고, <b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w06-reg.png", cap: "그림 1. en 이 왜 \"유지\" 가 되는가",
          alt: "d 와 되먹임된 q 가 MUX 로 들어가고 en 이 MUX 를 고르며, 그 결과가 D flip-flop 여덟 개로 들어가 q 가 되는 block diagram." },
        { t: "note", html: "<b>어떻게 푸나.</b> 한 줄씩 내려가며 적으면 됩니다. " +
          "<code>en=1</code> 이면 그 clock 의 d 가 q 가 되고, <code>en=0</code> 이면 <b>앞 줄의 q 를 그대로</b> 옮겨 적습니다. " +
          "값이 d 를 따라가는 것이 아니라 <b>clock 이 올 때만</b> 바뀐다는 점이 핵심입니다." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>reg8.vhd</code> 의 process 입니다." },
        { t: "code", key: "read", name: "", text:
`  process (clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        q <= (others => '0');
      elsif en = '1' then
        q <= d;
      end if;
    end if;
  end process;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 8비트 register",
    sub: "이 틀 하나가 이 과목의 모든 sequential circuit 의 기본이 됩니다. 직접 입력해 돌리고 보드에서 버튼으로 한 clock 씩 진행시킵니다.",
    quizPoints: 8,
    compare: { points: 8, whyPh: "예) en=0 인 clock 에서 d 를 따라 적었는데, 사실은 앞 값을 유지한다." },
    practice: { file: "reg8.vhd", checkNote: "무작위 64clock 으로 유지·로드·reset 세 동작을 확인합니다.",
                sigs: "clk, reset, en, d, q", 
                localCmd: "ghdl -a --std=08 reg8.vhd grader/w06/tb_reg8_check.vhd && " +
                          "ghdl -r --std=08 tb_reg8_check --ieee-asserts=disable --stop-time=20us" },
    wave: {
      vcd: "vcd/w06.vcd", step: 20,
      sigs: [
        { path: "clk",   width: 1, label: "clk" },
        { path: "reset", width: 1, label: "reset" },
        { path: "en",    width: 1, label: "en" },
        { path: "d",     width: 8, label: "d" },
        { path: "q",     width: 8, label: "q" },
      ],
    },
    quiz: [
      { type: "vector",  path: "q", width: 8, label: "q",
        hint: "그 시각의 q 를 그대로 옮겨 적습니다. d 가 아니라 q 입니다." },
      { type: "vector",  path: "d", width: 8, label: "d",
        hint: "입력 쪽입니다. q 와 다른 구간이 있는지 보세요." },
      { type: "count",   path: "en", label: "en",
        hint: "전체 구간에서 en 이 1 인 구간을 세어 보세요." },
      { type: "decimal", path: "q", width: 8, label: "q", signed: false,
        hint: "부호 없는 8비트로 읽습니다. 0 ~ 255." },
    ],
    hunt: {
      bugs: 3,
      hint: "버그 하나는 채점기가 PASS 를 줘도 남아 있습니다. 사양 문장(어느 edge 에서, 무엇이 먼저)과 코드를 한 줄씩 대조하세요.",
      code: "-- reg8.vhd : 8비트 register, synchronous reset + 로드 enable (AI 가 쓴 코드)\nlibrary ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.std_logic_arith.all;\n\nentity reg8 is\n  port (clk, reset, en : in std_logic;\n        d : in  std_logic_vector(7 downto 0);\n        q : out std_logic_vector(7 downto 0));\nend entity reg8;\n\narchitecture rtl of reg8 is\nbegin\n  process (clk)\n  begin\n    if falling_edge(clk) then\n      if en = '1' then\n        q <= d;\n      elsif reset = '1' then\n        q <= (others => '0');\n      end if;\n    end if;\n  end process;\nend architecture rtl;\n",
    },
    design: {
      file: "led_bounce.vhd",
      localCmd: "ghdl -a --std=08 led_bounce.vhd grader/w06/tb_led_bounce_check.vhd && " +
                "ghdl -r --std=08 tb_led_bounce_check --ieee-asserts=disable --stop-time=20us",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;

entity led_bounce is
  port (clk, reset, en : in  std_logic;
        q   : out std_logic_vector(9 downto 0);
        dir : out std_logic);                      -- 0 = 위로(LEDR9 쪽), 1 = 아래로
end entity led_bounce;

architecture rtl of led_bounce is
  signal r : std_logic_vector(9 downto 0);         -- 지금 켜진 위치
  signal d : std_logic;                            -- 지금 방향
begin
  process (clk)
  begin
    if rising_edge(clk) then

      -- 여기를 채우세요.
      --  reset = '1'         : r <= "0000000001";  d <= '0';
      --  en = '1' , d = '0'  : 한 칸 위로.  단 r(9) = '1' 이면 d 를 '1' 로 바꾸고 한 칸 아래로
      --  en = '1' , d = '1'  : 한 칸 아래로. 단 r(0) = '1' 이면 d 를 '0' 으로 바꾸고 한 칸 위로

    end if;
  end process;

  q   <= r;
  dir <= d;
end architecture rtl;`,
    },
    quartus: { pins: 45, registers: 8, pinmap: PINMAP.lab05,
               regNote: "shift register 8비트 + debounce 가 쓰는 flip-flop 이 더해져 이보다 많을 수 있습니다" },
    board: {
      photoLabel: "보드 대표 사진 — SW 위치와 HEX1·HEX0 이 함께 보이게 두 장",
      fields: [
        { key: "h1", label: "① 로드 뒤 HEX1 HEX0", ph: "예: 9C" },
        { key: "h2", label: "② 왼쪽 shift 뒤 HEX1 HEX0", ph: "예: 39" },
        { key: "l0", label: "② 뒤 LEDR[0]", ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (d, label) => ({ d, label: `${label} — d = ${bin(d, 8)}`,
          sw: `SW[7:0]=${bin(d,8)} · ① SW[9:8]="11" 로 두고 KEY[1] 한 번 ` +
              `· ② SW[9:8]="01" 로 바꾸고 KEY[1] 한 번` });
        return [mk(1 + (u % 255), "첫째"), mk(1 + ((u >>> 9) % 255), "둘째")];
      },
      expect(c) {
        const d = c.d & 0xff;
        const shifted = ((d << 1) | (d & 1)) & 0xff;   // sin = SW(0) = d(0)
        return { h1: hex2(d), h2: hex2(shifted), l0: String(d & 1) };
      },
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "오늘부터 회로가 <b>기억</b>합니다. 지금까지는 입력이 바뀌면 출력이 곧바로 따라왔지만, " +
          "register 는 <b>clock 의 rising edge 에서만</b> 값을 받아들이고 그 사이에는 값을 붙잡고 있습니다." },
        { t: "fig", src: "figs/w06-reg.png", cap: "그림 1. en 이 왜 \"유지\" 가 되는가",
          alt: "d 와 되먹임된 q 가 MUX 로 들어가고 en 이 MUX 를 고르며, 그 결과가 D flip-flop 여덟 개로 들어가 q 가 되는 block diagram." },
        { t: "table", caption: "한 clock 동안 일어나는 일 — 위에서부터 먼저 본다",
          head: ["reset", "en", "edge 뒤의 q"],
          rows: [["1", "— (무엇이든)", "0"], ["0", "1", "d"], ["0", "0", "앞 값 그대로"]],
          hl: [[2,2]] },
        { t: "code", key: "lab", name: "reg8.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;

entity reg8 is
  port (clk, reset, en : in std_logic;
        d : in  std_logic_vector(7 downto 0);
        q : out std_logic_vector(7 downto 0));
end entity reg8;

architecture rtl of reg8 is
begin
  process (clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        q <= (others => '0');
      elsif en = '1' then
        q <= d;
      end if;
    end if;
  end process;
end architecture rtl;` },
        { t: "note", html: "<b>4주차의 규칙이 여기서는 반대가 됩니다.</b> combinational circuit 에서는 " +
          "\"대입이 없으면 latch\" 였지만, sequential circuit 에서는 \"대입이 없으면 <b>유지</b>\" 이고 그것이 정상입니다. " +
          "flip-flop 이 이미 값을 붙잡고 있으니 유지가 공짜입니다. " +
          "두 규칙을 헷갈리면 combinational circuit 에 latch 를 만들거나, sequential circuit 을 combinational circuit 으로 만들어 버립니다." },
        { t: "note", html: "<b>감지 목록에 clk 만 적었습니다.</b> <code>process (clk)</code> — " +
          "reset 과 en 과 d 는 적지 않습니다. 어차피 edge 에서만 읽기 때문입니다. " +
          "combinational circuit 에서 감지 목록을 빠뜨리면 큰일이었지만, clock 회로에서는 이것이 표준 형태입니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "2점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "<code>if rising_edge(clk) then</code> 안에 <code>if reset … elsif en …</code> 이 들어가는 " +
          "이 중첩 구조가 앞으로 모든 sequential circuit 에서 되풀이됩니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "한 구간(20 ns)이 한 clock 입니다. rising edge 는 구간이 시작하고 5 ns 뒤이고, " +
          "커서가 가리키는 구간 가운데에서는 이미 값이 안정되어 있습니다." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>en</code> 이 0 인 구간에서 <code>d</code> 는 바뀌는데 " +
          "<code>q</code> 는 그대로인 곳을 찾아보세요. 그리고 <code>reset</code> 과 <code>en</code> 이 " +
          "둘 다 1 인 구간에서 q 가 어느 쪽을 따랐는지 — <b>reset 이 먼저</b>입니다." },
      ] },
      { no: 4, title: "자가점검", pts: "8점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "AI 코드 감별 — 버그 찾기", pts: "6점", widget: "aiHunt", blocks: [{ t: "p", html: "방금 만든 회로를 AI 에게 같은 사양으로 시켰더니 아래 코드가 나왔습니다. 그럴듯해 보이지만 <b>버그가 있습니다</b>. AI 없이, 채점기와 waveform 과 과목 규약만으로 찾아 고치세요." }, { t: "note", html: "AI 가 자주 내는 실수를 알아보는 눈을 기르는 단계입니다. 고친 코드가 PASS 해야 하고, 찾은 버그마다 <b>어느 줄, 무엇이, 무엇으로 알았는지</b>를 적습니다." }] },
      { no: 6, title: "과제 사양 — LED 왕복 (새 설계)", blocks: [
        { t: "p", html: "실습에서는 shift register 를 <b>그대로 따라</b> 만들었습니다. 과제는 같은 도구로 <b>다른 회로</b>를 설계합니다. " +
          "켜진 LED 하나가 <code>en</code> 이 올 때마다 한 칸씩 움직이다가, <b>끝에 닿으면 방향을 바꿔</b> 되돌아옵니다." },
        { t: "fig", src: "figs/w06-bounce.png", cap: "그림 2. reset 뒤 en 펄스마다 켜지는 LED 와 dir",
          alt: "가로축은 en 펄스 횟수 0부터 20, 세로축은 LEDR0부터 LEDR9. 빨간 칸이 0에서 9까지 올라갔다가 다시 0까지 내려오고 다시 올라간다. 맨 위에 방향 화살표." },
        { t: "table", cls: "tt", caption: "동작 규칙 (entity 와 포트는 바꾸지 않습니다)",
          head: ["조건", "r (켜진 위치)", "d (방향)"],
          rows: [["reset = '1'", '"0000000001"', "'0'"],
                 ["en='1', d='0', r(9)='0'", "한 칸 위로 — 왼쪽 shift", "그대로"],
                 ["en='1', d='0', r(9)='1'", "한 칸 아래로", "<b>'1' 로 바꿈</b>"],
                 ["en='1', d='1', r(0)='0'", "한 칸 아래로 — 오른쪽 shift", "그대로"],
                 ["en='1', d='1', r(0)='1'", "한 칸 위로", "<b>'0' 으로 바꿈</b>"],
                 ["en = '0'", "그대로", "그대로"]],
          hl: [[2,2],[4,2]] },
        { t: "note", html: "<b>실습에서 가져올 것.</b> register 틀(rising_edge · synchronous reset · en)은 6주차 그대로이고, " +
          "한 칸 옮기기는 실습 shift register 의 <code>\"01\"</code> · <code>\"10\"</code> 줄과 같습니다. " +
          "새로 생각할 것은 <b>방향 flag d 하나</b>와 <b>끝에서 바꾸는 조건</b>뿐입니다." },
        { t: "note", html: "<b>보드에서 보려면</b> 과제 패키지의 <code>hw06_top</code> 을 쓰세요. board_kit 이 들어 있어 " +
          "KEY[2] 로 <b>1초 자동</b>, KEY[1] 로 <b>한 스텝씩</b> 볼 수 있습니다. HEX0 은 방향(U / d)을 보여 줍니다." },
      ] },
      { no: 7, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "빈 곳을 채우고 <b>GHDL 로 실행</b>을 누르면 무작위 en 300 clock (중간에 reset 한 번) 으로 " +
          "위치와 방향을 모두 확인합니다. 끝에서 <b>한 칸 머무르거나</b>, 끝을 <b>넘어가 사라지면</b> 그 자리에서 걸립니다." },
        { t: "note", html: "<b>내 PC 에서 먼저 돌려 보려면</b> 과제 패키지의 <code>sim/run_sim.bat</code> 을 더블클릭하세요. " +
          "ModelSim 이 열려 컴파일 · 실행 · waveform 까지 한 번에 보여 줍니다." },
      ] },
      { no: 8, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 5 TOP 은 CLOCK_50 · KEY 3 · SW 10 · LEDR 10 · HEX0~2 (21) = <b>45핀</b> 입니다. KEY[2] 와 HEX2 는 board_kit 의 자동 모드용입니다. " +
          "이번 주부터 <b>Total registers 가 0 이 아닌 것이 정상</b>입니다 — register 를 일부러 만들었으니까요. " +
          "숫자가 기대보다 크면 debounce 가 쓰는 flip-flop 까지 세어진 것입니다." },
      ] },
      { no: 9, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "KEY[0] 으로 reset 한 뒤, <b>본인 학번으로 지정된 값</b>을 SW[7:0] 에 놓고 " +
          "① 병렬 로드 ② 왼쪽 shift 를 각각 한 번씩 합니다. 두 번 모두 HEX 를 읽어 적으세요. " +
          "<b>SW[0] 은 d 의 맨 아랫자리이면서 동시에 sin</b> 이라는 점에 주의하세요." },
      ] },
      { no: 10, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 끝에서 방향을 바꾸는 순간",
    sub: "synthesis 결과를 확인하고, LED 가 끝에서 되돌아오는 clock 을 waveform 으로 설명한 뒤 토의에 답합니다.",
    rtl: { after: "RTL Viewer 에서 <b>위치 flip-flop 열 개와 방향 flip-flop 하나</b>, 그 앞의 MUX 가 보입니다. " +
                  "Compilation Report 의 Total registers 와 개수가 맞는지도 견주어 보세요." },
    explain: {
      ph: "예) 190 ns 의 rising edge 에서 q 가 10 0000 0000 이고 dir='0' 이었는데, 다음 edge 에서 q 는 01 0000 0000, dir 은 '1' 이 되었다. 같은 edge 에 …",
      waveLabel: "LED 가 끝(LEDR9 또는 LEDR0)에 닿았다가 되돌아오는 구간이 보이게 캡처하세요 — <span class='mono'>clk, en, q, dir</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "rising edge",   words: ["edge", "rising"] },
        { label: "방향 전환",   words: ["dir", "방향"] },
        { label: "끝 조건",     words: ["r(9)", "r(0)", "q(9)", "q(0)", "LEDR9", "LEDR0", "끝"] },
        { label: "구체적 값",   words: ["q =", "q=", "dir="] },
        { label: "근거 시각",   words: ["ns"] },
      ],
      model: "190 ns 의 rising edge 직전에 <span class='mono'>q = 10 0000 0000</span>, <span class='mono'>dir = '0'</span> 이었다. " +
        "이 edge 에서 회로는 <b>edge 직전 값</b>으로 판단하므로 <span class='mono'>r(9) = '1'</span> 조건이 참이 되고, " +
        "<b>같은 edge 에</b> <span class='mono'>d</span> 는 <span class='mono'>'1'</span> 로, <span class='mono'>r</span> 은 한 칸 아래인 " +
        "<span class='mono'>01 0000 0000</span> 으로 바뀐다. 방향을 먼저 바꾸고 다음 clock 에 옮기는 것이 아니라 두 register 가 동시에 바뀌므로, " +
        "LED 는 끝에서 머무르지 않고 바로 되돌아온다. en 이 0 인 clock 에서는 두 값 모두 그대로다.",
      rubric: [
        "끝에 닿은 구간 하나를 특정하고 그 시각을 적었다",
        "edge 전과 뒤의 q 와 dir 을 모두 적었다",
        "방향과 위치가 같은 edge 에 함께 바뀐다는 점을 설명했다",
        "en = 0 일 때 둘 다 유지된다는 점을 밝혔다",
      ],
    },
    discuss: { ph: "끝에서 한 칸 머물게 하려면 …" },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → RTL Viewer</b> 를 열어 " +
          "flip-flop 이 몇 개 생겼는지, 그 앞에 무엇이 붙어 있는지 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 led_bounce 를 돌리고, <b>LED 가 끝에 닿아 방향을 바꾸는 clock</b> 하나를 골라 " +
          "그 edge 앞뒤의 q 와 dir 을 근거로 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "LED 가 0 에서 출발해 다시 0 으로 돌아오기까지 en 펄스가 몇 번 필요합니까? 왜 20 이 아닌지 설명하세요. " +
          "그리고 <b>끝에서 한 칸 머물렀다가</b> 되돌아오게 바꾸려면 상태(register)를 무엇을 더 두어야 할지, " +
          "자동 모드(1초)에서 사람 눈에 어떻게 보일지 함께 쓰세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
