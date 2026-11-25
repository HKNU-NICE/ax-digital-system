/* ══════════════════════════════════════════════════════════════
   Week 02 — VHDL 기본 구조 ① : entity · architecture · 신호 대입  (Lab 1)
   실습 gates (전체 코드 제공) · 과제 gates7 — xnor 추가 (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";

export const W = {
  id: "w02", no: 2, lab: "lab01", labTitle: "기본 게이트 여섯 개",
  topic: "VHDL 기본 구조 ①",
  h1: "회로를 글로 적는다",
  lead: "VHDL 파일 하나의 구조를 익힙니다. <b>수업 전</b>에 entity 와 architecture 를 구분하고 출력을 미리 적어 두고, " +
        "<b>수업 중</b>에 게이트 여섯 개를 직접 써서 보드에 올리고, <b>수업 후</b>에 말로 쓰인 조건을 회로로 옮깁니다.",
  chips: ["entity", "architecture", "std_logic", "신호 대입 &lt;="],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w02", count: 46, pad: 2, per: 8, title: "W02 VHDL 기본 구조 ①", narration: "w02" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w02.vcd</span>)를 그대로 읽어 그린 것입니다.",

  concepts: [
    { q: "entity 와 architecture 는 각각 무엇을 적는 곳입니까?",
      opts: ["entity 는 동작, architecture 는 포트",
             "entity 는 부품의 겉모습(포트), architecture 는 속(회로)",
             "둘 다 같은 것이고 이름만 다르다",
             "entity 는 simulation 용, architecture 는 synthesis 용"], ans: 1 },
    { q: "VHDL 의 <code>&lt;=</code> 를 C 의 대입문과 같다고 보면 왜 안 됩니까?",
      opts: ["기호가 달라서",
             "줄이 차례로 실행되는 것이 아니라 모든 줄이 동시에 전선으로 존재하기 때문에",
             "속도가 느려서",
             "변수에만 쓸 수 있어서"], ans: 1 },
    { q: "<code>library ieee; use ieee.std_logic_1164.all;</code> 두 줄을 빠뜨리면?",
      opts: ["경고만 나고 잘 돌아간다",
             "std_logic 을 모른다는 오류가 난다",
             "simulation 만 안 되고 synthesis 는 된다",
             "포트 이름이 바뀐다"], ans: 1 },
    { q: "entity 의 마지막 포트 뒤에 세미콜론을 찍으면 어떻게 됩니까?",
      opts: ["아무 문제 없다", "문법 오류가 난다",
             "그 포트가 무시된다", "경고만 난다"], ans: 1 },
    { q: "architecture 안에서 세 줄의 <b>순서를 바꾸면</b> synthesis 결과는?",
      opts: ["완전히 달라진다", "같다 — 동시에 존재하는 회로이기 때문에",
             "위에 쓴 줄이 우선권을 가진다", "컴파일되지 않는다"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 VHDL 파일의 구조를 확인하고, <b>게이트 여섯 개의 출력을 미리 손으로 적어</b> 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "yand",  label: "y_and",  len: 1, ph: "0" },
        { key: "yxor",  label: "y_xor",  len: 1, ph: "0" },
        { key: "ynand", label: "y_nand", len: 1, ph: "0" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (a, b) => ({ a, b, given: `a = ${a},  b = ${b}` });
        const first = nx() % 4;
        const second = (first + 1 + (nx() % 3)) % 4;     // 반드시 다른 조합
        const of = (k) => mk((k >> 1) & 1, k & 1);
        return [of(first), of(second)];
      },
      model: (c) => ({ yand: String(c.a & c.b), yxor: String(c.a ^ c.b),
                       ynand: String(1 - (c.a & c.b)) }),
    },
    reading: {
      question: "<code>y_not &lt;= not a;</code> 에는 <code>b</code> 가 나오지 않습니다. " +
                "그렇다면 <code>b</code> 가 바뀔 때 <code>y_not</code> 은 어떻게 됩니까? " +
                "그리고 포트 선언에서 <code>a, b : in std_logic</code> 처럼 쉼표로 묶어 쓴 것은 무슨 뜻입니까?",
      ph: "예) y_not 은 a 만 보는 전선이므로 b 가 바뀌어도 …",
      askPh: "예) entity 와 architecture 를 왜 따로 쓰는지 잘 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }, { t: "note", html: "<b>AI 는 개념 공부에만</b> 씁니다. 문항은 먼저 혼자 풀고, 채점한 뒤 틀린 개념을 AI 에게 물어보세요. AI 설명이 슬라이드와 다르면 질문 칸에 적어 오세요. 이번 주 실습·과제 코드는 AI 없이 씁니다." }] },
      { no: 2, title: "출력 미리 적어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "아래 두 경우의 출력을 <b>손으로 적으세요</b>. 학번마다 조합이 다르고, " +
          "<b>정답은 지금 보여 주지 않습니다</b> — 수업 중에 직접 돌려 맞춰 봅니다." },
        { t: "note", html: "<b>어떻게 푸나.</b> <code>nand</code> 는 <code>and</code> 의 결과를 뒤집은 것입니다. " +
          "먼저 <code>and</code> 를 구하고 0 과 1 을 바꾸면 됩니다. " +
          "<code>xor</code> 는 두 값이 <b>다를 때</b> 1 입니다." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>gates.vhd</code> 의 architecture 입니다." },
        { t: "code", key: "read", name: "", text:
`architecture dataflow of gates is
begin
  y_and  <= a and b;
  y_or   <= a or b;
  y_xor  <= a xor b;
  y_nand <= a nand b;
  y_nor  <= a nor b;
  y_not  <= not a;
end architecture dataflow;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 기본 게이트 여섯 개",
    sub: "한 entity 안에 여섯 줄을 쓰면 게이트 여섯 개가 만들어집니다. 직접 입력해 돌리고 보드에 올립니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) nand 를 and 와 같다고 보고 뒤집는 것을 잊었다." },
    practice: { file: "gates.vhd", checkNote: "입력 4가지 × 출력 6개 = 24가지를 전부 확인합니다.",
                sigs: "a, b, y_and … y_not", 
                localCmd: "ghdl -a --std=08 gates.vhd grader/w02/tb_gates_check.vhd && " +
                          "ghdl -r --std=08 tb_gates_check --ieee-asserts=disable" },
    wave: {
      vcd: "vcd/w02.vcd", step: 40,
      sigs: [
        { path: "a",      width: 1, label: "a" },
        { path: "b",      width: 1, label: "b" },
        { path: "y_and",  width: 1, label: "y_and" },
        { path: "y_or",   width: 1, label: "y_or" },
        { path: "y_xor",  width: 1, label: "y_xor" },
        { path: "y_nand", width: 1, label: "y_nand" },
        { path: "y_nor",  width: 1, label: "y_nor" },
        { path: "y_not",  width: 1, label: "y_not" },
      ],
    },
    quiz: [
      { type: "bit",   path: "y_xor",  label: "y_xor",
        hint: "a 와 b 가 다를 때만 1 입니다." },
      { type: "bit",   path: "y_nand", label: "y_nand",
        hint: "y_and 를 먼저 보고 뒤집으면 됩니다." },
      { type: "count", path: "y_or",   label: "y_or",
        hint: "전체 구간을 훑으며 y_or 이 1 인 구간을 세어 보세요." },
      { type: "count", path: "y_not",  label: "y_not",
        hint: "y_not 은 a 만 봅니다. a 가 0 인 구간이 몇 개입니까?" },
    ],
    design: {
      file: "gates7.vhd",
      localCmd: "ghdl -a --std=08 gates7.vhd grader/w02/tb_gates7_check.vhd && " +
                "ghdl -r --std=08 tb_gates7_check --ieee-asserts=disable",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;

entity gates7 is
  port (
    a, b   : in  std_logic;
    y_and  : out std_logic;
    y_or   : out std_logic;
    y_xor  : out std_logic;
    y_nand : out std_logic;
    y_nor  : out std_logic;
    y_not  : out std_logic

    -- ① 포트 하나를 더하시오. 이름은 y_xnor, 방향은 out, 타입은 std_logic.
    --    바로 윗줄 끝에 세미콜론이 필요한지 생각해 볼 것.

  );
end entity gates7;

architecture dataflow of gates7 is
begin
  y_and  <= a and b;
  y_or   <= a or b;
  y_xor  <= a xor b;
  y_nand <= a nand b;
  y_nor  <= a nor b;
  y_not  <= not a;

  -- ② y_xnor 를 한 줄로 쓰시오.


end architecture dataflow;`,
    },
    quartus: { pins: 8, registers: 0, pinmap: PINMAP.lab01, regNote: "combinational circuit 이므로 0이 맞습니다" },
    board: {
      photoLabel: "보드 대표 사진 — SW[1:0] 위치와 켜진 LEDR 이 함께 보이게 두 장",
      fields: [
        { key: "l0", label: "LEDR[0] (and)",  ph: "0 또는 1" },
        { key: "l2", label: "LEDR[2] (xor)",  ph: "0 또는 1" },
        { key: "l3", label: "LEDR[3] (nand)", ph: "0 또는 1" },
        { key: "l5", label: "LEDR[5] (not)",  ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (k) => { const a = (k >> 1) & 1, b = k & 1;
          return { a, b, label: `SW[1]=${a}, SW[0]=${b}`,
                   sw: `SW[1]=${a} · SW[0]=${b}` }; };
        const first = u % 4;
        return [mk(first), mk((first + 1 + ((u >>> 7) % 3)) % 4)];
      },
      // 보드 TOP 은 LEDR(0)=SW(1) and SW(0) … LEDR(5)=not SW(0)
      expect: (c) => ({ l0: String(c.a & c.b), l2: String(c.a ^ c.b),
                        l3: String(1 - (c.a & c.b)), l5: String(1 - c.b) }),
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "entity 하나에 출력 여섯 개를 달고, architecture 에 여섯 줄을 씁니다. " +
          "각 줄이 게이트 하나가 됩니다. 줄 사이에는 순서가 없습니다 — 여섯 개가 동시에 존재합니다." },
        { t: "fig", src: "figs/w02-gates.png", cap: "그림 1. gates — 한 entity 에서 여섯 가지 출력",
          alt: "SW[1:0] 가 gates 블록으로 들어가고 y_and, y_or, y_xor, y_nand, y_nor, y_not 여섯 출력이 LEDR[0]~LEDR[5] 로 나가는 block diagram." },
        { t: "table", cls: "tt", caption: "여섯 게이트의 truth table — 한 장에 모아 둔 것",
          head: ["a","b","and","or","xor","nand","nor","not a"],
          rows: [["0","0","0","0","0","1","1","1"],
                 ["0","1","0","1","1","1","0","1"],
                 ["1","0","0","1","1","1","0","0"],
                 ["1","1","1","1","0","0","0","0"]],
          hl: [[3,2],[0,5],[0,6]] },
        { t: "code", key: "lab", name: "gates.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;

entity gates is
  port (
    a, b   : in  std_logic;
    y_and  : out std_logic;
    y_or   : out std_logic;
    y_xor  : out std_logic;
    y_nand : out std_logic;
    y_nor  : out std_logic;
    y_not  : out std_logic
  );
end entity gates;

architecture dataflow of gates is
begin
  y_and  <= a and b;
  y_or   <= a or b;
  y_xor  <= a xor b;
  y_nand <= a nand b;
  y_nor  <= a nor b;
  y_not  <= not a;
end architecture dataflow;` },
        { t: "note", html: "<b>마지막 포트 뒤에는 세미콜론을 찍지 않습니다.</b> " +
          "<code>y_not : out std_logic</code> 다음에 바로 <code>);</code> 가 옵니다. " +
          "가장 자주 나오는 문법 오류입니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "포트 목록의 세미콜론 자리와 <code>end entity</code> / <code>end architecture</code> 를 " +
          "손으로 쳐 보는 것이 이 단계의 목적입니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "네 가지 입력 조합을 40 ns 씩 넣은 결과입니다. 커서를 옮기며 여섯 출력을 한꺼번에 보세요." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 것.</b> <code>y_and</code> 와 <code>y_nand</code> 는 " +
          "언제나 서로 반대입니다. <code>y_or</code> 와 <code>y_nor</code> 도 마찬가지입니다. " +
          "waveform 에서 두 줄이 위아래로 뒤집힌 모양인지 확인해 보세요." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "설계 사양 — 게이트 하나 더하기", blocks: [
        { t: "p", html: "실습의 <code>gates</code> 에 <b>XNOR 하나</b>를 더합니다. " +
          "entity 에 포트를 늘리고 architecture 에 줄을 하나 더하는 것이 전부인데, " +
          "<b>포트를 늘릴 때 세미콜론 자리</b>가 바로 여기서 문제가 됩니다." },
        { t: "table", caption: "포트 사양 — 실습의 gates 에 맨 아래 한 줄이 늘었습니다",
          head: ["포트", "방향", "뜻"],
          rows: [["a, b", "in", "두 입력"],
                 ["y_and · y_or · y_xor", "out", "실습 그대로"],
                 ["y_nand · y_nor · y_not", "out", "실습 그대로"],
                 ["<b>y_xnor</b>", "out", "<b>새로 더하는 것</b>"]],
          hl: [[3,0]] },
        { t: "table", cls: "tt", caption: "XNOR truth table — XOR 를 뒤집은 것입니다",
          head: ["a", "b", "xor", "<b>xnor</b>"],
          rows: [["0","0","0","1"],["0","1","1","0"],["1","0","1","0"],["1","1","0","1"]],
          hl: [[0,3],[3,3]] },
        { t: "note", html: "<b>\"같다\" 를 알려 주는 게이트입니다.</b> XNOR 는 두 입력이 " +
          "<b>서로 같을 때</b> 1 이 됩니다. 그래서 비교기(comparator)의 기본 부품이고, " +
          "5주차에 adder-subtractor 의 overflow 판정에서 다시 만나게 됩니다." },
        { t: "note", html: "<b>보드에도 올려 확인하세요.</b> 교안의 과제는 " +
          "<code>y_xnor</code> 를 <b>LEDR[6]</b> 에 잇고 보드에서 값을 읽어 " +
          "truth table 의 xnor 열을 채우는 것까지입니다. TOP 에 줄 하나를 더하고 " +
          "<code>.qsf</code> 에 LEDR[6] 핀을 더하면 됩니다." },
      ] },
      { no: 6, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② 를 채우고 <b>GHDL 로 실행</b>을 누르면 입력 4가지 × 출력 7개 = " +
          "28가지를 전부 확인한 결과가 돌아옵니다. " +
          "<b>세미콜론에서 막히면</b> 2주차 슬라이드의 \"마지막 포트 뒤에는 세미콜론을 찍지 않는다\" 를 " +
          "다시 보세요 — 포트를 더했으니 이제 세미콜론이 필요한 자리가 바뀌었습니다." },
        { t: "note", html: "<b>처음 눌렀을 때 나오는 메시지</b>는 " +
          "<code>signal \"y_xnor\" is not an interface name</code> 입니다. " +
          "\"채점기가 <code>y_xnor</code> 포트에 선을 연결하려는데 그런 포트가 없다\" 는 뜻입니다 — " +
          "곧 ① 을 아직 하지 않았다는 신호입니다. 포트를 더하면 이 메시지가 사라집니다." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 1 은 SW 2 + LEDR 6 = <b>8핀</b> 입니다. 이번 주 TOP 은 " +
          "<code>lab01_gates</code> 로, 게이트 여섯 줄을 한 파일에 직접 쓴 판입니다. " +
          "부품을 불러 쓰는 방법은 다음 주에 배웁니다." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "보드에 다운로드하고 <b>본인 학번으로 지정된 두 조합</b>으로 SW[1:0] 을 맞춘 뒤, " +
          "LEDR 을 읽어 적고 사진을 찍으세요." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 게이트 하나를 더한다는 것",
    sub: "synthesis 결과를 확인하고, XNOR 가 무엇을 알려 주는 게이트인지 설명한 뒤 토의에 답합니다.",
    rtl: { after: "RTL Viewer 에서 게이트가 여섯 개에서 일곱 개로 늘었는지 보세요. " +
                  "synthesis 기가 XNOR 를 XOR + NOT 으로 풀었을 수도 있습니다 — 그렇다면 왜 그런지 생각해 보세요." },
    explain: {
      ph: "예) a=1, b=1 에서 y_xor 는 0 인데 y_xnor 는 1 이었다. 두 입력이 같은지를 알려 주는 게이트라서 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>a, b, y_xor, y_xnor</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "같다/다르다", words: ["같", "다르", "일치", "비교"] },
        { label: "xor 의 반대", words: ["반대", "뒤집", "not", "xor"] },
        { label: "구체적 입력", words: ["a=", "b="] },
        { label: "쓰임",       words: ["비교", "comparator", "overflow", "검출"] },
        { label: "근거 시각",   words: ["ns"] },
      ],
      model: "<span class='mono'>a=1, b=1</span> 인 구간을 보자. " +
        "<span class='mono'>y_xor = 0</span> 인데 <span class='mono'>y_xnor = 1</span> 이다. " +
        "XOR 는 두 입력이 <b>다를 때</b> 1 이고, XNOR 는 그 결과를 뒤집은 것이므로 " +
        "<b>같을 때</b> 1 이 된다. 네 가지 입력 가운데 a=b 인 두 경우(00, 11)에서 y_xnor 가 1 이고 " +
        "나머지 두 경우에서 0 인 것을 waveform 에서 확인할 수 있다. " +
        "그래서 XNOR 는 \"두 값이 같은가\" 를 한 게이트로 알려 주는 셈이고, " +
        "비트를 여러 개 비교할 때는 XNOR 를 비트마다 놓고 AND 로 묶으면 비교기가 된다. " +
        "회로에서 더해진 것은 게이트 하나와 출력선 하나뿐이다.",
      rubric: [
        "입력 조합을 하나 특정하고 그때의 y_xor 와 y_xnor 를 적었다",
        "XNOR 가 XOR 의 반대라는 점을 설명했다",
        "두 입력이 같을 때 1 이 된다는 뜻으로 정리했다",
        "어디에 쓰이는 게이트인지 한 줄로 적었다",
      ],
    },
    discuss: { ph: "4비트 두 수가 같은지 보려면 …" },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → RTL Viewer</b> 를 열어 " +
          "게이트가 하나 늘었는지 확인하세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "XNOR 를 더한 회로를 돌리고, <b>XOR 와 XNOR 가 갈리는 구간</b>을 하나 골라 " +
          "무엇을 알려 주는 게이트인지 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "<b>4비트 두 수가 같은지</b>를 보려면 XNOR 를 몇 개 쓰고 " +
          "그 결과를 어떻게 묶어야 합니까? 회로를 말로 적어 보세요. " +
          "그리고 같은 일을 <code>if a = b then</code> 한 줄로 썼다면 " +
          "synthesis 기는 결국 무엇을 만들어 낼지도 생각해 보세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
