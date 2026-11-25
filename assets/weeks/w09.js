/* ══════════════════════════════════════════════════════════════
   Week 09 — FSM ① state diagram 에서 코드까지   (Lab 7)
   실습 seq_det_moore (전체 코드 제공) · 과제 seq_det110_mealy — "110" Mealy (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

/** 1011 검출기(Moore)의 다음 상태 — 예습 채점과 검증에 같이 쓴다 */
export function nextState(s, b) {
  switch (s) {
    case 0: return b ? 1 : 0;
    case 1: return b ? 1 : 2;
    case 2: return b ? 3 : 0;
    case 3: return b ? 4 : 2;
    default: return b ? 1 : 2;      // S1011 — 겹침 허용
  }
}

export const W = {
  id: "w09", no: 9, lab: "lab07", labTitle: "순서 검출기 (FSM)",
  topic: "FSM ① state diagram 에서 코드까지",
  h1: "state diagram 을 그대로 코드로",
  lead: "말로 된 조건을 <b>state diagram</b>로 그리고, 그 그림을 세 덩어리 코드로 옮깁니다. " +
        "<b>수업 전</b>에 bit stream 을 손으로 따라가 보고, <b>수업 중</b>에 직접 돌려 맞춘 뒤 보드에서 한 비트씩 넣어 보고, " +
        "<b>수업 후</b>에 같은 검출기를 Mealy 로 다시 설계합니다.",
  chips: ["state diagram", "열거형 상태", "Moore", "Mealy"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w09", count: 40, pad: 2, per: 8, title: "W09 FSM ①", narration: "w09" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w09.vcd</span>)를 그대로 읽어 그린 것입니다. " +
            "한 구간(20 ns)이 한 clock 입니다.",

  concepts: [
    { q: "FSM 을 VHDL 로 쓸 때 이 과목이 쓰는 \"세 덩어리\" 는 무엇입니까?",
      opts: ["entity · architecture · process",
             "상태 register · 다음 상태(조합) · 출력",
             "입력 · 처리 · 출력",
             "reset · clock · enable"], ans: 1 },
    { q: "<code>type state_t is (S0, S1, S10, S101, S1011);</code> 처럼 열거형을 쓰는 까닭은?",
      opts: ["메모리를 아끼려고",
             "state diagram 의 동그라미 이름을 코드에 그대로 쓸 수 있어서",
             "synthesis 가 빨라져서",
             "숫자로 쓰면 문법 오류가 나서"], ans: 1 },
    { q: "다음 상태를 정하는 process 맨 앞에 <code>nx &lt;= st;</code> 를 쓰는 까닭은?",
      opts: ["상태를 초기화하려고",
             "어떤 경우에도 값이 정해지게 해 latch 를 막으려고",
             "reset 을 대신하려고",
             "clock 을 기다리려고"], ans: 1 },
    { q: "Moore 와 Mealy 의 차이는?",
      opts: ["Moore 는 출력이 상태만으로, Mealy 는 상태와 입력으로 정해진다",
             "Moore 가 더 빠르다",
             "Mealy 는 clock 이 없다",
             "Moore 는 상태가 더 적다"], ans: 0 },
    { q: "\"겹침 허용\" 이란 무슨 뜻입니까?",
      opts: ["1011 을 찾으면 상태를 S0 으로 되돌린다",
             "1011 을 찾은 뒤에도 마지막 비트들을 다음 검출의 앞부분으로 쓴다",
             "두 개의 FSM 을 겹쳐 쓴다",
             "입력을 두 번씩 받는다"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 state diagram 그리는 법을 확인하고, <b>bit stream 을 손으로 따라가</b> 봅니다.",
    predict: {
      count: 2,
      fields: [
        { key: "st",  label: "마지막 비트 뒤의 state_code (3비트)", len: 3, ph: "000" },
        { key: "cnt", label: "det 가 1 이 된 횟수",                len: 1, ph: "0" },
        { key: "det", label: "마지막 비트 뒤의 det",                len: 1, ph: "0" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = () => {
          let bits = "";
          for (let i = 0; i < 10; i++) bits += (nx() % 2);
          // 1011 이 적어도 한 번은 나오도록 가운데에 심어 둔다
          const pos = 1 + (nx() % 5);
          bits = bits.slice(0, pos) + "1011" + bits.slice(pos + 4);
          return { bits, given: `x = ${bits}  (왼쪽부터 한 clock 에 한 비트, en 은 계속 1)` };
        };
        return [mk(), mk()];
      },
      model(c) {
        let s = 0, hit = 0;
        for (const ch of c.bits) {
          s = nextState(s, ch === "1" ? 1 : 0);
          if (s === 4) hit++;
        }
        return { st: bin(s, 3), cnt: String(hit), det: s === 4 ? "1" : "0" };
      },
    },
    reading: {
      question: "다음 상태를 정하는 process 는 <code>process (all)</code> 이고 " +
                "상태 register 는 <code>process (clk)</code> 입니다. 둘을 왜 나누어 썼습니까? " +
                "한 process 에 몰아 쓰면 무엇이 달라집니까?",
      ph: "예) 상태 register 는 edge 에서만 바뀌어야 하고, 다음 상태는 …",
      askPh: "예) state diagram 의 화살표를 코드의 어느 줄로 옮기는지 헷갈립니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "bit stream 손으로 따라가 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "아래 bit stream 을 왼쪽부터 한 비트씩 넣었을 때의 결과를 적으세요. " +
          "학번마다 bit stream 이 다르고, <b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w09-state.png", cap: "그림 1. 1011 검출기 state diagram (Moore, 겹침 허용)",
          alt: "S0, S1, S10, S101, S1011 다섯 상태가 한 줄로 놓이고 입력 0 과 1 에 따른 화살표가 앞뒤로 이어진 state diagram. S1011 은 이중 원으로 det=1 을 나타낸다." },
        { t: "note", html: "<b>어떻게 푸나.</b> S0 에서 시작해 손가락으로 화살표를 따라가면 됩니다. " +
          "<b>S1011 에 머무는 동안 det=1</b> 이고, 거기서도 다음 비트를 받아 계속 갑니다 — " +
          "0 이면 S10 으로, 1 이면 S1 로. 되돌아가는 화살표를 빠뜨리지 마세요." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>seq_det_moore.vhd</code> 의 두 process 입니다." },
        { t: "code", key: "read", name: "", text:
`  -- 1) 상태 register
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then st <= S0;
      elsif en = '1'  then st <= nx;
      end if;
    end if;
  end process;

  -- 2) 다음 상태 (조합)
  process (all) begin
    nx <= st;                       -- 기본값 : 제자리
    case st is
      when S0 => if x = '1' then nx <= S1; else nx <= S0; end if;
      ...
    end case;
  end process;

  -- 3) 출력 (Moore : 상태만 본다)
  det <= '1' when st = S1011 else '0';` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 1011 순서 검출기 (Moore)",
    sub: "state diagram 을 세 덩어리 코드로 옮깁니다. 직접 입력해 돌리고, 보드에서 스위치로 한 비트씩 넣어 봅니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) 1011 을 찾은 뒤 S0 으로 돌아간다고 보고 겹침을 놓쳤다." },
    practice: { file: "seq_det_moore.vhd", checkNote: "무작위 bit stream 400clock 으로 상태와 det 를 모두 확인합니다.",
                sigs: "clk, en, x, det, state_code", 
                localCmd: "ghdl -a --std=08 seq_det_moore.vhd grader/w09/tb_seq_det_moore_check.vhd && " +
                          "ghdl -r --std=08 tb_seq_det_moore_check --ieee-asserts=disable --stop-time=50us" },
    wave: {
      vcd: "vcd/w09.vcd", step: 20,
      sigs: [
        { path: "clk",   width: 1, label: "clk" },
        { path: "reset", width: 1, label: "reset" },
        { path: "en",    width: 1, label: "en" },
        { path: "x",     width: 1, label: "x" },
        { path: "stc",   width: 3, label: "state_code" },
        { path: "det",   width: 1, label: "det" },
      ],
    },
    quiz: [
      { type: "vector",  path: "stc", width: 3, label: "state_code",
        hint: "000=S0, 001=S1, 010=S10, 011=S101, 100=S1011 입니다." },
      { type: "decimal", path: "stc", width: 3, label: "state_code", signed: false,
        hint: "같은 값을 10진수로 읽으면 상태 번호가 됩니다." },
      { type: "count",   path: "det", label: "det",
        hint: "waveform 전체에서 1011 이 몇 번 검출되었는지와 같습니다." },
      { type: "count",   path: "en",  label: "en",
        hint: "en 이 0 인 구간에서는 상태가 멈춰 있습니다." },
    ],
    design: {
      file: "seq_det110_mealy.vhd",
      localCmd: "ghdl -a --std=08 seq_det110_mealy.vhd grader/w09/tb_seq_det110_mealy_check.vhd && " +
                "ghdl -r --std=08 tb_seq_det110_mealy_check --ieee-asserts=disable --stop-time=50us",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;

entity seq_det110_mealy is
  port (
    clk, reset : in  std_logic;
    en         : in  std_logic;
    x          : in  std_logic;
    det        : out std_logic
  );
end entity seq_det110_mealy;

architecture rtl of seq_det110_mealy is
  type state_t is (S0, S1, S11);          -- 세 개면 충분하다
  signal st, nx : state_t;
begin
  -- 상태 register : 실습의 Moore 판과 완전히 같다
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then st <= S0;
      elsif en = '1'  then st <= nx;
      end if;
    end if;
  end process;

  process (all) begin
    nx  <= st;
    det <= '0';                           -- 기본값 : latch 방지

    -- ① case 로 세 상태의 다음 상태를 쓰시오.
    --    S0  : x=1 이면 S1,  아니면 S0
    --    S1  : x=1 이면 S11, 아니면 S0
    --    S11 : x=1 이면 S11, 아니면 S0
    --
    -- ② S11 에서 x=0 인 바로 그 자리에 det 를 올리시오.
    --    Mealy 이므로 다음 clock 을 기다리지 않는다.
    --    단, en 이 0 이면 입력을 받아들이지 않으므로 det 도 0 이어야 한다.


  end process;
end architecture rtl;`,
    },
    quartus: { pins: 35, registers: 3, pinmap: PINMAP.lab07,
               regNote: "상태 register 는 몇 비트면 충분한지 생각해 보세요 — 검출 횟수 counter 와 debounce 가 더해집니다" },
    board: {
      photoLabel: "보드 대표 사진 — HEX0 (상태) 과 LEDR[9] (det) 이 함께 보이게 두 장",
      fields: [
        { key: "st",  label: "마지막 비트 뒤 HEX0", ph: "예: 3" },
        { key: "det", label: "그때 LEDR[9]",       ph: "0 또는 1" },
        { key: "cnt", label: "HEX1 (검출 횟수)",   ph: "예: 2" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (label) => {
          let bits = "";
          for (let i = 0; i < 8; i++) bits += (nx() % 2);
          const pos = 1 + (nx() % 3);
          bits = bits.slice(0, pos) + "1011" + bits.slice(pos + 4);
          return { bits, label: `${label} — ${bits}`,
            sw: `KEY[0] 으로 reset 한 뒤, SW[0] 을 맞추고 KEY[1] 을 누르기를 왼쪽 비트부터 되풀이` };
        };
        return [mk("첫째"), mk("둘째")];
      },
      expect(c) {
        let s = 0, hit = 0;
        for (const ch of c.bits) { s = nextState(s, ch === "1" ? 1 : 0); if (s === 4) hit++; }
        return { st: String(s), det: s === 4 ? "1" : "0", cnt: hit.toString(16).toUpperCase() };
      },
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "counter 도 사실 FSM 이었습니다 — 다만 \"다음 값 = 지금 값 + 1\" 이라는 규칙이 " +
          "너무 단순해서 state diagram 을 그릴 일이 없었을 뿐입니다. " +
          "오늘은 규칙이 복잡해지므로 <b>그림을 먼저 그리고</b> 코드로 옮깁니다." },
        { t: "fig", src: "figs/w09-state.png", cap: "그림 1. 1011 검출기 state diagram (Moore, 겹침 허용)",
          alt: "S0, S1, S10, S101, S1011 다섯 상태가 한 줄로 놓이고 입력 0 과 1 에 따른 화살표가 앞뒤로 이어진 state diagram. S1011 은 이중 원으로 det=1 을 나타낸다." },
        { t: "table", caption: "상태의 뜻 — 상태는 \"지금까지 맞은 앞부분\" 을 기억한다",
          head: ["상태", "뜻", "x=0 이면", "x=1 이면"],
          rows: [["S0", "아무것도 못 맞췄다", "S0", "S1"],
                 ["S1", "1 까지 맞았다", "S10", "S1"],
                 ["S10", "10 까지 맞았다", "S0", "S101"],
                 ["S101", "101 까지 맞았다", "S10", "S1011"],
                 ["S1011", "다 맞았다 (det=1)", "S10", "S1"]],
          hl: [[4,0]] },
        { t: "note", html: "<b>되돌아갈 때도 \"버리지 않습니다\".</b> S101 에서 0 이 오면 S0 이 아니라 " +
          "<b>S10</b> 으로 갑니다 — 방금 받은 \"10\" 이 다음 검출의 앞부분이 될 수 있기 때문입니다. " +
          "이 되돌아가는 화살표를 빠뜨리는 것이 FSM 설계에서 가장 흔한 실수입니다." },
        { t: "code", key: "lab", name: "seq_det_moore.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;

entity seq_det_moore is
  port (
    clk, reset : in  std_logic;
    en         : in  std_logic;
    x          : in  std_logic;
    det        : out std_logic;
    state_code : out std_logic_vector(2 downto 0)
  );
end entity seq_det_moore;

architecture rtl of seq_det_moore is
  type state_t is (S0, S1, S10, S101, S1011);
  signal st, nx : state_t;
begin
  -- 1) 상태 register
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then st <= S0;
      elsif en = '1'  then st <= nx;
      end if;
    end if;
  end process;

  -- 2) 다음 상태 (조합)
  process (all) begin
    nx <= st;                              -- 기본값 : 제자리
    case st is
      when S0    => if x = '1' then nx <= S1;    else nx <= S0;   end if;
      when S1    => if x = '1' then nx <= S1;    else nx <= S10;  end if;
      when S10   => if x = '1' then nx <= S101;  else nx <= S0;   end if;
      when S101  => if x = '1' then nx <= S1011; else nx <= S10;  end if;
      when S1011 => if x = '1' then nx <= S1;    else nx <= S10;  end if;
    end case;
  end process;

  -- 3) 출력 (Moore : 상태만 본다)
  det <= '1' when st = S1011 else '0';

  with st select state_code <=
    "000" when S0,
    "001" when S1,
    "010" when S10,
    "011" when S101,
    "100" when S1011;
end architecture rtl;` },
        { t: "note", html: "<b>process (all) 은 VHDL-2008 입니다.</b> 감지 목록을 자동으로 채워 주므로 " +
          "4주차에 배운 \"빠뜨리면 simulation 이 거짓말한다\" 문제가 생기지 않습니다. " +
          "Quartus 에서는 프로젝트 설정의 VHDL 버전을 2008 로 두어야 합니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "state diagram 의 화살표 열 개가 case 의 열 줄과 하나씩 대응하는 것을 손으로 확인하게 됩니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "bit stream 을 한 clock 에 하나씩 넣은 결과입니다. " +
          "<code>state_code</code> 가 state diagram 의 어느 동그라미에 있는지 좇아 보세요." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>det</code> 가 1 인 구간 바로 다음을 보세요. " +
          "S0 으로 돌아가지 않고 S10 이나 S1 로 가 있습니다 — 겹침 허용의 증거입니다. " +
          "그리고 en 이 0 인 구간에서는 x 가 바뀌어도 상태가 움직이지 않습니다." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "설계 사양 — \"110\" 검출기를 Mealy 로", blocks: [
        { t: "p", html: "실습에서 만든 것은 <b>1011</b> 을 찾는 <b>Moore</b> 검출기였습니다. " +
          "과제는 <b>110</b> 을 찾는 <b>Mealy</b> 검출기입니다 — 찾는 패턴도, 출력을 정하는 방식도 바뀝니다. " +
          "겹침은 그대로 허용합니다." },
        { t: "fig", src: "figs/w09-moore-mealy.png", cap: "그림 2. 같은 패턴인데 출력이 올라가는 clock 이 하나 다르다",
          alt: "Mealy 의 det 는 패턴의 마지막 비트가 들어오는 clock 에, Moore 의 det 는 그 다음 clock 에 올라가는 것을 나란히 그린 timing 도." },
        { t: "table", caption: "상태와 뜻 (세 개면 충분하다)", head: ["상태","여기까지 들어온 것","x=1 이면","x=0 이면"],
          rows: [["S0","아무것도 (또는 쓸모없는 0)","S1","S0"],
                 ["S1","\"1\"","S11","S0"],
                 ["S11","\"11\"","S11 (1 이 더 쌓여도 \"11\" 은 그대로)","<b>S0 · det=1</b>"]],
          hl: [[2,3]] },
        { t: "note", html: "<b>왜 S11 에서 x=1 이면 제자리인가.</b> 1 이 몇 개 더 들어와도 " +
          "\"마지막 두 개가 11\" 이라는 사실은 변하지 않습니다. 그래서 상태를 더 만들 필요가 없습니다 — " +
          "<code>1110</code> 도 <b>검출됩니다</b>." },
        { t: "note", html: "<b>닫는 비트가 0 인 것이 1011 과 다른 점입니다.</b> " +
          "110 의 마지막 0 은 새 패턴의 시작이 될 수 없으므로 (110 은 1 로 시작하니까) " +
          "det 를 올린 뒤 상태는 <b>S0</b> 으로 갑니다. 1011 에서 마지막 1 이 다음 패턴의 첫 1 이 되어 " +
          "S1 으로 되돌아갔던 것과 견주어 보세요." },
        { t: "note", html: "<b>en 을 잊지 마세요.</b> en 이 0 이면 이번 clock 에 x 를 아예 받아들이지 않으므로 " +
          "det 도 0 이어야 합니다. 채점기가 이 경우를 반드시 봅니다 — " +
          "<code>det &lt;= en;</code> 처럼 en 을 끼워 넣는 것이 요령입니다." },
      ] },
      { no: 6, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② 를 채우고 <b>GHDL 로 실행</b>을 누르면 무작위 400clock 으로 " +
          "<b>edge 전에</b> det 가 맞게 정해졌는지까지 확인합니다. " +
          "실습에서 받은 <code>seq_det_mealy.vhd</code> 를 이름만 바꿔 내면 패턴이 달라 바로 걸립니다." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 7 TOP 은 CLOCK_50 · KEY 2 · SW 1 · LEDR 10 · HEX0~2 (21) = <b>35핀</b> 입니다. " +
          "상태 register 가 몇 비트로 synthesis 되었는지 Compilation Report 에서 확인해 보세요 — " +
          "synthesis 기가 one-hot 으로 바꿨을 수도 있습니다." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "KEY[0] 으로 reset 한 뒤 <b>본인 학번으로 지정된 bit stream</b>을 왼쪽부터 한 비트씩 넣으세요. " +
          "SW[0] 으로 값을 맞추고 KEY[1] 을 누르면 한 비트가 들어갑니다. " +
          "HEX0 의 상태 번호가 state diagram 을 따라 움직이는 것을 눈으로 확인하세요." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 한 clock 의 차이",
    sub: "synthesis 결과를 확인하고, Moore 와 Mealy 의 출력 시점 차이를 설명한 뒤 토의에 답합니다.",
    rtl: { after: "RTL Viewer 에서 상태 register 와 다음 상태 논리가 나뉘어 보입니다. " +
                  "Mealy 판에서는 출력 쪽에 입력 x 가 들어가 있는지 확인해 보세요." },
    explain: {
      ph: "예) 입력 110 을 넣었을 때 내 Mealy 판은 마지막 0 이 들어오는 clock 에 det=1 이 되었고, 실습의 Moore 판은 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>clk, en, x, det</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "한 clock 차이", words: ["한 clock", "한 clock", "1clock", "빠르", "늦"] },
        { label: "상태 + 입력",  words: ["입력", "x", "상태와"] },
        { label: "겹침",        words: ["겹침", "겹치", "다시", "이어"] },
        { label: "구체적 입력",  words: ["110", "1011", "x ="] },
        { label: "근거 시각",    words: ["ns"] },
      ],
      model: "내 Mealy 판에 <span class='mono'>110</span> 을 한 clock 에 한 비트씩 넣어 보자. " +
        "상태가 S11 일 때 마지막 비트 0 이 <b>들어오는 그 clock 에</b> " +
        "<span class='mono'>det=1</span> 이 된다. 출력이 상태와 입력의 조합으로 정해지므로 " +
        "edge 를 기다릴 필요가 없기 때문이다. " +
        "실습의 Moore 판이라면 그 edge 에서 \"다 찾았다\" 상태로 바뀐 <b>다음</b> clock 부터 det=1 이 된다 — " +
        "출력이 상태만 보기 때문이다. 그래서 같은 입력에 대해 출력이 한 clock 어긋난다. " +
        "대신 Moore 의 det 는 clock 에 맞춰 한 clock 폭으로 깔끔하지만, " +
        "Mealy 의 det 는 입력 x 가 clock 중간에 흔들리면 같이 흔들릴 수 있다. " +
        "그래서 다른 회로의 입력으로 바로 쓸 때는 Moore 가 안전하고, " +
        "한 clock 이라도 빨라야 할 때는 Mealy 를 쓴다.",
      rubric: [
        "입력 bit stream 을 적고 det 가 올라간 clock 을 특정했다",
        "Mealy 가 왜 한 clock 빠른지 출력 논리로 설명했다",
        "Moore 의 출력이 왜 더 안정적인지 밝혔다",
        "어느 쪽을 언제 쓸지 한 문장으로 정리했다",
      ],
    },
    discuss: { ph: "1110 을 넣으면 …" },
    review: {
      n: 3,
      prompt: "너는 VHDL 코드 리뷰어다. 아래는 내가 AI 없이 직접 쓴 seq_det110_mealy.vhd 이다.\n\n[사양] 입력 x 에서 bit stream \"110\" 을 찾는 Mealy 검출기. 겹침 허용. 상태 S0, S1, S11. det 는 마지막 0 이 들어오는 그 clock 에 1 (조합 출력). reset 은 동기.\n[과목 규약] VHDL-2008, ieee.numeric_std 만 사용, rising_edge, synchronous reset, synthesis 가능한 코드.\n\n[요청]\n1. 고친 전체 코드는 주지 마라. 지적만 해라.\n2. 지적은 많아야 5개. 각각 (줄 번호) (무엇이 문제인지) (왜 문제인지) (어떤 입력이나 waveform 으로 확인할 수 있는지) 를 적어라.\n3. 사양의 경계에서 틀리기 쉬운 테스트 입력 3개를 제안해라.\n4. 확신이 없는 지적에는 '불확실' 이라고 표시해라.",
    },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → State Machine Viewer</b> 를 열면 " +
          "synthesis 기가 읽은 state diagram 이 그대로 나옵니다. <b>그림 1</b> 과 같은지 견주어 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "10점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 <code>seq_det110_mealy</code> 를 돌리고, " +
          "det 가 올라가는 clock 이 실습의 Moore 판과 왜 다른지 설명하시오." },
      ] },
      { no: 3, title: "AI 리뷰 판정 — 내 코드를 AI 에게 검토받기", pts: "6점", widget: "aiReview", blocks: [{ t: "p", html: "과제 코드는 AI 없이 다 썼습니다. 이제 AI 에게 <b>리뷰만</b> 받습니다. AI 지적은 맞을 때도 있고 그럴듯하게 틀릴 때도 있습니다. <b>지적 세 개를 골라 맞는지 판정</b>하고 근거를 적으세요." }, { t: "note", html: "판정 근거는 사양 문장, 채점기 결과, waveform 중 하나여야 합니다. \"AI 가 그렇다고 해서\" 는 근거가 아닙니다. 틀린 지적을 하나라도 찾아내면 잘한 것입니다." }] },
      { no: 4, title: "토의", pts: "9점", widget: "discuss", blocks: [
        { t: "p", html: "<b>1110</b> 을 넣으면 det 가 몇 번 올라갑니까? <b>11100</b> 이면? " +
          "왜 그런지 상태를 따라가며 적어 보세요. " +
          "그리고 <b>겹침을 허용하지 않는</b> 검출기로 바꾸려면 어느 화살표를 어디로 돌려야 합니까?" },
      ] },
      { no: 5, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
