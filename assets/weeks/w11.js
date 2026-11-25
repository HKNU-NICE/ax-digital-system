/* ══════════════════════════════════════════════════════════════
   Week 11 — hierarchical design 과 재사용 : 분:초 시계   (Lab 9)
   실습 clock_mmss (전체 코드 제공) · 과제 clock_hhmmss — 시:분:초 (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";

const mmss = (sec) => {
  const s = ((sec % 3600) + 3600) % 3600;
  return String(Math.floor(s / 60)).padStart(2, "0") + String(s % 60).padStart(2, "0");
};

export const W = {
  id: "w11", no: 11, lab: "lab09", labTitle: "분:초 시계 (hierarchical design)",
  topic: "hierarchical design 과 재사용",
  h1: "같은 부품 네 벌로 시계를",
  lead: "새 문법은 <code>package</code> 하나뿐입니다. 나머지는 <b>지금까지 만든 것을 조립하는</b> 연습입니다. " +
        "<b>수업 전</b>에 시계 값을 미리 세어 보고, <b>수업 중</b>에 네 자리를 한 번에 만들어 보드에 올리고, " +
        "<b>수업 후</b>에 랩(lap) 기능을 한 겹 더 얹습니다.",
  chips: ["hierarchical design", "generic map", "package", "for … generate"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w11", count: 35, pad: 2, per: 8, title: "W11 hierarchical design", narration: "w11" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w11.vcd</span>)를 그대로 읽어 그린 것입니다. " +
            "한 구간(20 ns)이 1초입니다.",

  concepts: [
    { q: "<code>package</code> 에는 무엇을 모읍니까?",
      opts: ["여러 파일이 함께 쓰는 타입 · 상수 · 함수",
             "entity 와 architecture",
             "testbench",
             "pin assignment 정보"], ans: 0 },
    { q: "<code>use work.seg_pkg.all;</code> 는 어디에 씁니까?",
      opts: ["architecture 안", "package 를 쓰는 파일의 맨 위",
             "entity 선언 안", "generic map 안"], ans: 1 },
    { q: "<code>for i in 0 to 3 generate</code> 가 만드는 것은?",
      opts: ["네 번 도는 반복문", "똑같은 부품 네 벌 (동시에 존재하는 회로)",
             "네 clock 동안 도는 counter", "네 개의 process"], ans: 1 },
    { q: "자리마다 모듈러스가 10, 6, 10, 6 인 까닭은?",
      opts: ["초는 0~9 와 0~5, 분도 0~9 와 0~5 이므로",
             "10진수이기 때문에",
             "4비트라서",
             "generic 의 기본값이라서"], ans: 0 },
    { q: "아랫자리의 <code>carry</code> 를 윗자리의 무엇으로 잇습니까?",
      opts: ["clk", "reset", "en", "q"], ans: 2 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 hierarchical design 과 package 를 확인하고, <b>시계가 몇 분 몇 초를 가리키는지</b> 미리 세어 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "now",  label: "그때의 분초 (4자리)",        len: 4, ph: "0000" },
        { key: "next", label: "한 틱 더 가면 (4자리)",      len: 4, ph: "0000" },
        { key: "hold", label: "hold=1 로 10틱 뒤 (4자리)",  len: 4, ph: "0000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (lo, hi) => {
          const n = lo + (nx() % (hi - lo + 1));
          return { n, given: `reset 뒤 tick 을 ${n} 번 받았을 때 (hold 는 0)` };
        };
        return [mk(55, 75), mk(115, 185)];
      },
      model: (c) => ({ now: mmss(c.n), next: mmss(c.n + 1), hold: mmss(c.n) }),
    },
    reading: {
      question: "<code>en(0) &lt;= tick and not hold;</code> 한 줄이 시계 전체를 멈춥니다. " +
                "자리마다 멈춤 신호를 따로 넣지 않아도 되는 까닭은 무엇입니까?",
      ph: "예) 윗자리는 아랫자리의 carry 를 en 으로 받으므로 …",
      askPh: "예) generate 안에서 en(i), en(i+1) 이 어떻게 이어지는지 헷갈립니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "시계 값 미리 세어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "reset 하면 00:00 에서 시작합니다. tick 을 몇 번 받은 뒤의 값을 " +
          "<b>분분초초 네 자리</b>로 적으세요 (예: 1분 23초 → <code>0123</code>). " +
          "학번마다 횟수가 다르고, <b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w11-hier.png", cap: "그림 1. clock_mmss 의 계층 — 같은 부품 네 벌",
          alt: "clock_mmss 아래에 counter_mod 네 개가 MODULUS 10, 6, 10, 6 으로 달려 있고 옆에서 seg_pkg 를 use 하는 계층 그림." },
        { t: "note", html: "<b>어떻게 푸나.</b> 60 으로 나눈 몫이 분, 나머지가 초입니다. " +
          "세 번째 칸은 <code>hold</code> 를 올린 채로 10틱을 더 보냈을 때입니다 — " +
          "시계가 멈춰 있으면 값이 어떻게 될지 생각해 보세요." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>clock_mmss.vhd</code> 의 핵심 부분입니다." },
        { t: "code", key: "read", name: "", text:
`  constant MODS : int_array := (10, 6, 10, 6);     -- 자리별 modulus
  signal en : std_logic_vector(0 to 4);            -- en(0)=tick, en(i+1)=carry(i)
begin
  en(0) <= tick and not hold;

  g_digit : for i in 0 to 3 generate
    u : entity work.counter_mod
      generic map (MODULUS => MODS(i), WIDTH => 4)
      port map (clk => clk, reset => reset, en => en(i),
                q => d(i), carry => en(i+1));
    digits(i) <= digit2seg(d(i));                  -- package 함수
  end generate;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 분:초 시계",
    sub: "이번 주에 받은 <code>counter_mod</code> 를 네 벌 놓고 carry 로 잇습니다. 자리마다 다른 것은 generic 하나뿐입니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) 60초가 아니라 100초마다 분이 올라간다고 보았다." },
    practice: { file: "clock_mmss.vhd", checkNote: "무작위 tick/hold 800clock 으로 분:초를 BCD 로 확인합니다.",
                sigs: "clk, tick, hold, mm, ss",
                localCmd: "ghdl -a --std=08 grader/w11/dep_seg_pkg.vhd grader/w11/dep_counter_mod.vhd " +
                          "clock_mmss.vhd grader/w11/tb_clock_mmss_check.vhd && " +
                          "ghdl -r --std=08 tb_clock_mmss_check --ieee-asserts=disable --stop-time=60us" },
    wave: {
      vcd: "vcd/w11.vcd", step: 20,
      sigs: [
        { path: "tick", width: 1, label: "tick (1초)" },
        { path: "hold", width: 1, label: "hold" },
        { path: "mm",   width: 8, label: "mm (BCD)" },
        { path: "ss",   width: 8, label: "ss (BCD)" },
      ],
    },
    quiz: [
      { type: "vector",  path: "ss", width: 8, label: "ss",
        hint: "BCD 입니다 — 위 네 비트가 십의 자리, 아래 네 비트가 일의 자리." },
      { type: "vector",  path: "mm", width: 8, label: "mm",
        hint: "분도 같은 BCD 입니다. 60초마다 한 번 올라갑니다." },
      { type: "count",   path: "hold", label: "hold",
        hint: "시계가 멈춰 있는 구간이 몇 개인지 세어 보세요." },
      { type: "count",   path: "tick", label: "tick",
        hint: "전체 구간 가운데 tick 이 1 인 구간입니다." },
    ],
    design: {
      file: "clock_hhmmss.vhd",
      localCmd: "ghdl -a --std=08 grader/w11/dep_seg_pkg.vhd grader/w11/dep_counter_mod.vhd " +
                "clock_hhmmss.vhd grader/w11/tb_clock_hhmmss_check.vhd && " +
                "ghdl -r --std=08 tb_clock_hhmmss_check --ieee-asserts=disable --stop-time=2ms",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.seg_pkg.all;

entity clock_hhmmss is
  port (
    clk, reset : in  std_logic;
    tick       : in  std_logic;
    hold       : in  std_logic;
    digits     : out seg_array_t(5 downto 0);   -- 5:시십 4:시일 3:분십 2:분일 1:초십 0:초일
    hh, mm, ss : out unsigned(7 downto 0)       -- BCD (십 & 일)
  );
end entity clock_hhmmss;

architecture rtl of clock_hhmmss is
  type int_array is array (0 to 5) of positive;

  -- ① 여섯 자리의 modulus 를 정하시오. 초일·초십·분일·분십은 실습과 같다.
  constant MODS : int_array := (10, 6, 10, 6, 1, 1);

  type u4_array is array (0 to 5) of unsigned(3 downto 0);
  signal d  : u4_array;
  signal en : std_logic_vector(0 to 6);
  signal wrap23 : std_logic;
  signal rstv   : std_logic_vector(0 to 5);   -- 자리마다 쓰는 reset
begin
  en(0) <= tick and not hold;

  -- ② 23 시에서 올림이 들어오는 순간을 알리는 wrap23 을 쓰시오.
  --    "시십 자리가 2 이고, 시일 자리가 3 이고, 시 자리로 올림이 들어올 때" 이다.
  --    시 자리로 들어오는 올림은 en(4) 이다.


  -- ③ 자리마다 쓸 reset 을 정하시오.
  --    0~3 번 자리는 reset 그대로. 4, 5 번 자리는 reset 이나 wrap23 중 하나라도 1 이면 0 이 되어야 한다.


  g_digit : for i in 0 to 5 generate
    u : entity work.counter_mod
      generic map (MODULUS => MODS(i), WIDTH => 4)
      port map (clk   => clk,
                reset => rstv(i),
                en    => en(i), q => d(i), carry => en(i+1));
    digits(i) <= digit2seg(d(i));
  end generate;

  ss <= d(1) & d(0);
  mm <= d(3) & d(2);
  hh <= d(5) & d(4);
end architecture rtl;`,
    },
    quartus: { pins: 42, registers: 16, pinmap: PINMAP.lab09,
               regNote: "자리마다 4비트씩 네 자리 = 16, 여기에 tick_gen 과 debounce 가 더해집니다" },
    board: {
      photoLabel: "보드 대표 사진 — HEX3~HEX0 네 자리가 모두 읽히게 두 장",
      fields: [
        { key: "now",  label: "그때의 분초 (4자리)",   ph: "예: 0135" },
        { key: "mm",   label: "HEX3 HEX2 (분)",      ph: "예: 01" },
        { key: "ss",   label: "HEX1 HEX0 (초)",      ph: "예: 35" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (n, label) => ({ n, label: `${label} — ${n} 초째`,
          sw: `KEY[0] 으로 reset 하고 SW[0]=1 (빠른 모드) 로 두어 ${n} 번째 초에서 읽는다` });
        return [mk(45 + (u % 30), "첫째"), mk(95 + ((u >>> 9) % 40), "둘째")];
      },
      expect: (c) => ({ now: mmss(c.n), mm: mmss(c.n).slice(0, 2), ss: mmss(c.n).slice(2) }),
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "오늘의 새 부품은 <code>counter_mod</code> 하나뿐이고, <b>그것도 전체 코드를 드립니다.</b> " +
          "이 한 부품을 네 벌 놓고 <code>carry</code> 로 잇기만 하면 시계가 됩니다 — " +
          "같은 것을 네 번 쓰면서 <b>generic 만 바꾸는 것</b>, 이것이 hierarchical design 의 이득입니다." },
        { t: "fig", src: "figs/w11-hier.png", cap: "그림 1. clock_mmss 의 계층 — 같은 부품 네 벌",
          alt: "clock_mmss 아래에 counter_mod 네 개가 MODULUS 10, 6, 10, 6 으로 달려 있고 옆에서 seg_pkg 를 use 하는 계층 그림." },
        { t: "table", caption: "자리마다 다른 것은 generic 하나뿐",
          head: ["i", "자리", "MODULUS", "en 으로 받는 것"],
          rows: [["0", "초 일의 자리", "10", "tick"],
                 ["1", "초 십의 자리", "6", "0번 자리의 carry"],
                 ["2", "분 일의 자리", "10", "1번 자리의 carry"],
                 ["3", "분 십의 자리", "6", "2번 자리의 carry"]],
          hl: [[0,2],[1,2]] },
        { t: "code", key: "lab", name: "clock_mmss.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.seg_pkg.all;

entity clock_mmss is
  port (
    clk, reset : in  std_logic;
    tick       : in  std_logic;
    hold       : in  std_logic;
    digits     : out seg_array_t(3 downto 0);
    mm, ss     : out unsigned(7 downto 0)
  );
end entity clock_mmss;

architecture rtl of clock_mmss is
  type int_array is array (0 to 3) of positive;
  constant MODS : int_array := (10, 6, 10, 6);
  type u4_array is array (0 to 3) of unsigned(3 downto 0);
  signal d  : u4_array;
  signal en : std_logic_vector(0 to 4);
begin
  en(0) <= tick and not hold;

  g_digit : for i in 0 to 3 generate
    u : entity work.counter_mod
      generic map (MODULUS => MODS(i), WIDTH => 4)
      port map (clk => clk, reset => reset, en => en(i),
                q => d(i), carry => en(i+1));
    digits(i) <= digit2seg(d(i));
  end generate;

  ss <= d(1) & d(0);
  mm <= d(3) & d(2);
end architecture rtl;` },
        { t: "note", html: "<b>\"component 로 써야 하지 않나요?\"</b> 둘 다 표준이고 같은 회로가 됩니다. " +
          "<code>component</code> 는 VHDL-87 부터 있던 방식이라 <b>교과서와 인터넷 예제, 오래된 회사 코드</b>의 " +
          "대부분이 그쪽입니다. <code>entity work.이름</code> 직접 instance 화는 VHDL-93 에서 더해진 것으로, " +
          "<b>포트 목록을 두 번 적지 않아도 되는</b> 것이 장점입니다 — 포트를 고칠 때 한 군데만 고치면 됩니다. " +
          "이 과목은 한 프로젝트 안에서만 부품을 쓰므로 짧은 쪽을 기본으로 삼았습니다. " +
          "<b>5주차 component 장</b>에서 같은 회로를 두 가지로 나란히 써 두었으니 꼭 읽어 두세요 — " +
          "읽을 줄 모르면 남의 코드를 못 봅니다. 자세히는 <b>부록 R §4</b>." },
        { t: "table", caption: "언제 어느 쪽을 쓰나", head: ["이럴 때", "쓰는 방식", "까닭"],
          rows: [["한 프로젝트 안의 내 부품", "<code>entity work.이름</code>", "포트 목록이 한 군데뿐이라 어긋날 일이 없다"],
                 ["교과서 · 예제 코드를 읽을 때", "<code>component</code>", "대부분이 이 방식으로 쓰여 있다"],
                 ["VHDL-87 만 받는 낡은 도구", "<code>component</code>", "직접 instance 화가 VHDL-93 기능이다"],
                 ["같은 자리에 다른 구현을 바꿔 끼울 때", "<code>component</code> + configuration", "binding 을 나중에 정할 수 있다"],
                 ["Verilog 모듈을 섞어 쓸 때", "<code>component</code>", "도구에 따라 component 선언을 요구한다"]],
          hl: [[0,1]] },
        { t: "note", html: "<b>이 파일 하나만으로는 컴파일되지 않습니다.</b> " +
          "맨 위의 <code>use work.seg_pkg.all;</code> 과 가운데의 <code>entity work.counter_mod</code> 때문에, " +
          "<b>그 둘이 먼저 <code>work</code> 라이브러리에 들어가 있어야</b> 합니다. " +
          "없으면 이렇게 납니다 — <code>error: unit \"seg_pkg\" not found in library \"work\"</code>." },
        { t: "table", caption: "어디서 어떻게 넣나", head: ["곳", "해야 할 일"],
          rows: [["이 페이지의 <b>직접 돌려 보기</b>", "아무것도 안 해도 됩니다 — 채점기가 두 파일을 함께 넣어 줍니다"],
                 ["내 PC (GHDL · ModelSim)", "<code>seg_pkg.vhd</code> → <code>counter_mod.vhd</code> → <code>clock_mmss.vhd</code> <b>순서대로</b> 분석"],
                 ["Quartus", "세 파일을 모두 프로젝트에 추가 (Project → Add/Remove Files). 순서는 Quartus 가 잡습니다"]],
          hl: [[1,1]] },
        { t: "note", html: "<b>en 사슬 하나가 전부입니다.</b> <code>en(0)</code> 은 tick, " +
          "<code>en(i+1)</code> 은 i번 자리의 carry — 즉 아랫자리가 한 바퀴를 넘기는 그 clock 에만 " +
          "윗자리가 올라갑니다. 7주차에 <code>carry &lt;= en and last;</code> 로 만들어 둔 덕분에 " +
          "여기서는 선만 이으면 됩니다." },
        { t: "note", html: "<b>package 는 \"여러 파일이 함께 쓰는 것\" 을 모은 곳입니다.</b> " +
          "<code>seg_t</code> 타입, <code>seg_array_t</code> 배열, <code>SEG_OFF</code> 상수, " +
          "<code>digit2seg</code> 함수 — 네 자리가 모두 같은 decoder 를 쓰므로 함수 한 벌로 끝납니다. " +
          "entity 로 만들면 네 벌을 instance 화해야 하지만, 함수는 그냥 부르면 됩니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "<code>generate</code> 안에서 <code>generic map</code> 과 <code>port map</code> 을 " +
          "함께 쓰는 모양에 손이 익습니다. 실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "한 구간(20 ns)이 1초입니다. 도중에 <code>hold</code> 를 올려 멈춥니다." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>ss</code> 가 BCD 라는 점에 주의하세요 — " +
          "9 다음이 10(2진 1010)이 아니라 0x10 입니다. " +
          "그리고 <code>hold</code> 가 1 인 구간에서는 tick 이 와도 값이 움직이지 않습니다." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "설계 사양 — 시:분:초로 넓히기", blocks: [
        { t: "p", html: "분:초 네 자리를 <b>시:분:초 여섯 자리</b>로 넓힙니다. " +
          "<code>counter_mod</code> 를 <b>두 벌 더</b> 놓고 <code>carry</code> 로 잇기만 하면 거의 끝나는데, " +
          "<b>한 군데</b>가 그대로 되지 않습니다 — 그 한 군데가 이 과제의 핵심입니다." },
        { t: "table", caption: "여섯 자리", head: ["i","자리","MODULUS","en 으로 받는 것"],
          rows: [["0","초 일의 자리","10","tick"],
                 ["1","초 십의 자리","6","0번의 carry"],
                 ["2","분 일의 자리","10","1번의 carry"],
                 ["3","분 십의 자리","6","2번의 carry"],
                 ["4","시 일의 자리","10","3번의 carry"],
                 ["5","시 십의 자리","<b>3</b>","4번의 carry"]],
          hl: [[5,2]] },
        { t: "note", html: "<b>자리마다 modulus 를 주는 방식만으로는 틀립니다.</b> " +
          "시 십의 자리에 3 을 주면 0~2 를 돌고 시 일의 자리는 0~9 를 도니, " +
          "시계가 <b>00 부터 29 까지</b> 갑니다. 23 다음은 24 가 되어 버립니다. " +
          "60초·60분과 달리 <b>24 는 두 자리로 쪼개지지 않기</b> 때문입니다 — " +
          "60 = 6 × 10 이지만 24 ≠ 3 × 10 입니다." },
        { t: "note", html: "<b>그래서 23 다음을 따로 처리합니다.</b> " +
          "\"시가 23 인데 올림이 또 들어오면 두 자리를 함께 0 으로\" 를 한 줄로 씁니다. " +
          "<code>counter_mod</code> 의 <code>reset</code> 포트를 그 자리의 " +
          "<b>동기 클리어</b>로 쓰면 부품을 전혀 고치지 않아도 됩니다 — " +
          "<code>reset =&gt; reset or wrap23</code> 입니다." },
        { t: "table", cls: "tt", caption: "시 자리의 경계",
          head: ["지금 hh","시 자리로 올림","wrap23","edge 뒤의 hh"],
          rows: [["22","1","0","23"], ["23","0","0","23"],
                 ["<b>23</b>","<b>1</b>","<b>1</b>","<b>00</b>"], ["00","1","0","01"]],
          hl: [[2,2],[2,3]] },
        { t: "note", html: "<b>왜 reset 포트를 쓰는 것이 깔끔한가.</b> " +
          "<code>counter_mod</code> 는 수업 중에 단독으로 먼저 검사해 둔 부품입니다. " +
          "\"24 가 되면 0 으로\" 를 부품 안에 넣으려면 generic 을 더하고 부품을 다시 검증해야 하지만, " +
          "바깥에서 reset 선 하나만 바꾸면 부품은 그대로입니다. " +
          "11주차 내내 말한 <b>hierarchical design 의 쓸모</b>가 바로 이것입니다." },
      ] },
      { no: 6, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② ③ 을 채우고 <b>GHDL 로 실행</b>을 누르면 채점기가 무작위 1,500clock 을 돌린 뒤 " +
          "<b>하루를 통째로</b> (86,400초) 돌려 23:59:59 다음이 00:00:00 인지까지 확인합니다. " +
          "23 처리를 빼먹으면 <code>24:00:00</code> 이 찍히며 그 자리에서 걸립니다." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 9 TOP 은 CLOCK_50 · KEY 2 · SW 2 · LEDR 10 · HEX0~3 (28) = <b>42핀</b> 입니다. " +
          "계층 창(Hierarchy)에서 <code>counter_mod</code> 네 벌이 각각 보이는지 확인해 보세요." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "KEY[0] 으로 reset 하면 00:00 에서 시작합니다. SW[0] 을 올려 빠른 모드로 두고 " +
          "<b>본인 학번으로 지정된 초</b>에서 HEX 네 자리를 읽어 적으세요." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 자리마다 나눌 수 없는 수",
    sub: "synthesis 결과를 확인하고, 23 시 다음이 어떻게 00 이 되는지 설명한 뒤 토의에 답합니다.",
    rtl: { after: "계층 창에서 <code>counter_mod</code> 가 <b>여섯 벌</b> 보이는지, " +
                  "그리고 시 두 자리의 reset 선에만 게이트가 하나 붙어 있는지 확인해 보세요." },
    explain: {
      ph: "예) 23:59:59 구간에서 wrap23 이 1 이 되었고, 다음 rising edge 에서 hh 가 00 이 되었다. 이때 시 두 자리의 reset 은 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>tick, en(4), d(4), d(5), wrap23</span> 이 모두 나와야 합니다",
      concepts: [
        { label: "23 의 경계",   words: ["23", "24", "00"] },
        { label: "나눌 수 없음",  words: ["24", "3", "10", "쪼개", "나눌", "나누어"] },
        { label: "동기 클리어",   words: ["reset", "클리어", "0으로", "0 으로"] },
        { label: "부품 그대로",   words: ["고치지", "그대로", "재사용", "건드리지"] },
        { label: "근거 시각",     words: ["ns", "초"] },
      ],
      model: "<span class='mono'>23:59:59</span> 인 구간을 보자. 그 구간에서 초·분 자리가 모두 마지막 값이므로 " +
        "올림이 줄줄이 이어져 시 자리의 en, 곧 <span class='mono'>en(4)</span> 가 1 이 된다. " +
        "시 두 자리가 2 와 3 이므로 <span class='mono'>wrap23</span> 도 같은 구간에서 1 이 된다 — " +
        "조합 신호이므로 edge 를 기다리지 않는다. " +
        "다음 rising edge 에서 시 두 자리의 <code>reset</code> 이 1 이었으므로 두 자리가 함께 0 이 되어 " +
        "<span class='mono'>00:00:00</span> 이 된다. " +
        "자리마다 modulus 를 주는 방식만으로는 이렇게 되지 않는다. " +
        "60 = 6 × 10 이라 분·초는 두 자리로 깔끔히 쪼개지지만, " +
        "24 는 3 × 10 이 아니므로 시 자리는 00~29 를 돌아 버린다. " +
        "그래서 경계 하나만 바깥에서 따로 처리했고, " +
        "<code>counter_mod</code> 는 한 글자도 고치지 않았다.",
      rubric: [
        "23:59:59 구간을 특정하고 그때 시 자리로 올림이 들어온 것을 보였다",
        "wrap23 이 어떤 조건으로 1 이 되는지 적었다",
        "24 가 두 자리로 쪼개지지 않는다는 점을 60 과 견주어 설명했다",
        "counter_mod 를 고치지 않고 풀었다는 점을 밝혔다",
      ],
    },
    discuss: { ph: "시를 한 벌로 세면 …" },
    review: {
      n: 3,
      prompt: "너는 VHDL 코드 리뷰어다. 아래는 내가 AI 없이 직접 쓴 clock_hhmmss.vhd 이다.\n\n[사양] counter_mod 여섯 개를 carry 로 이은 시:분:초 BCD 시계. 자리별 modulus 10,6,10,6,10,3. 시는 00~23 이어야 하므로 23:59:59 다음은 00:00:00.\n[과목 규약] VHDL-2008, ieee.numeric_std 만 사용, rising_edge, synchronous reset, synthesis 가능한 코드.\n\n[요청]\n1. 고친 전체 코드는 주지 마라. 지적만 해라.\n2. 지적은 많아야 5개. 각각 (줄 번호) (무엇이 문제인지) (왜 문제인지) (어떤 입력이나 waveform 으로 확인할 수 있는지) 를 적어라.\n3. 사양의 경계에서 틀리기 쉬운 테스트 입력 3개를 제안해라.\n4. 확신이 없는 지적에는 '불확실' 이라고 표시해라.",
    },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Project Navigator → Hierarchy</b> 와 RTL Viewer 를 함께 열어 " +
          "<b>그림 1</b> 의 계층이 그대로 나오는지 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "10점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 <code>clock_hhmmss</code> 를 돌리고, " +
          "<b>23:59:59 에서 00:00:00 으로 넘어가는 구간</b>을 골라 무슨 일이 일어나는지 설명하시오." },
      ] },
      { no: 3, title: "AI 리뷰 판정 — 내 코드를 AI 에게 검토받기", pts: "6점", widget: "aiReview", blocks: [{ t: "p", html: "과제 코드는 AI 없이 다 썼습니다. 이제 AI 에게 <b>리뷰만</b> 받습니다. AI 지적은 맞을 때도 있고 그럴듯하게 틀릴 때도 있습니다. <b>지적 세 개를 골라 맞는지 판정</b>하고 근거를 적으세요." }, { t: "note", html: "판정 근거는 사양 문장, 채점기 결과, waveform 중 하나여야 합니다. \"AI 가 그렇다고 해서\" 는 근거가 아닙니다. 틀린 지적을 하나라도 찾아내면 잘한 것입니다." }] },
      { no: 4, title: "토의", pts: "9점", widget: "discuss", blocks: [
        { t: "p", html: "시를 두 자리로 쪼개는 대신 <code>counter_mod</code> <b>한 벌</b>로 " +
          "<code>MODULUS=24, WIDTH=5</code> 로 세는 방법도 있습니다. " +
          "그렇게 하면 23 처리가 필요 없어지는데, 대신 무엇이 번거로워집니까? " +
          "(힌트 — HEX 에 띄울 때 0~23 을 두 자리 10진수로 바꿔야 합니다.) " +
          "두 방식을 비교해 어느 쪽을 고를지 이유와 함께 적고, " +
          "<b>12시간제(AM/PM)</b> 로 바꾼다면 어디를 더 고쳐야 하는지도 쓰세요." },
      ] },
      { no: 5, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
