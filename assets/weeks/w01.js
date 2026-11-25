/* ══════════════════════════════════════════════════════════════
   Week 01 — 디지털 시스템과 FPGA : 스위치를 LED 에 올린다   (Lab 0)
   실습 lab00_sw_led (전체 코드 제공) · 과제 lab00_or_nand (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

const lo8 = (v) => bin(v & 0xff, 8);
const sw8 = (v) => (v >> 8) & 1, sw9 = (v) => (v >> 9) & 1;

export const W = {
  id: "w01", no: 1, lab: "lab00", labTitle: "첫 프로젝트 — SW 를 LED 로",
  topic: "디지털 시스템과 FPGA",
  h1: "스위치를 LED 에 올린다",
  lead: "이 과목의 한 바퀴를 첫 주에 전부 돌아 봅니다. <b>수업 전</b>에 설계 흐름과 보드를 익히고, " +
        "<b>수업 중</b>에 코드를 써서 보드에 다운로드하고, <b>수업 후</b>에 게이트 조합 하나를 스스로 설계합니다.",
  chips: ["FPGA · LUT", "설계 흐름 5단계", "DE1-SoC", "pin assignment"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w01", count: 36, pad: 2, per: 8, title: "W01 디지털시스템과 FPGA", narration: "w01" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w01.vcd</span>)를 그대로 읽어 그린 것입니다.",

  concepts: [
    { q: "FPGA 가 아무 회로나 될 수 있는 까닭은 무엇입니까?",
      opts: ["칩 안에 CPU 가 들어 있어서 프로그램을 실행하기 때문에",
             "LUT 가 truth table 을 통째로 저장하고, 그 내용을 바꿔 쓸 수 있기 때문에",
             "게이트를 그때그때 새로 만들어 내기 때문에",
             "소프트웨어로 회로를 흉내 내기 때문에"], ans: 1 },
    { q: "ASIC 과 FPGA 의 차이로 바른 것은?",
      opts: ["ASIC 은 몇 초 만에 다시 쓸 수 있고 FPGA 는 못 바꾼다",
             "ASIC 은 한 번 만들면 못 바꾸고 초기 비용이 크며, FPGA 는 다시 써 넣을 수 있다",
             "둘 다 같은 것인데 이름만 다르다",
             "FPGA 가 대량 생산에 더 싸다"], ans: 1 },
    { q: "DE1-SoC 보드의 <code>KEY</code> 푸시버튼은 누르면 어떤 값이 됩니까?",
      opts: ["누르면 1", "누르면 0", "누를 때마다 번갈아 바뀐다", "값이 정해져 있지 않다"], ans: 1 },
    { q: "코드에서 보드까지 가는 다섯 단계의 순서로 바른 것은?",
      opts: ["설계 입력 → simulation → synthesis → place & route → 다운로드",
             "설계 입력 → synthesis → simulation → 다운로드 → place & route",
             "simulation → 설계 입력 → 다운로드 → synthesis → place & route",
             "synthesis → 설계 입력 → place & route → simulation → 다운로드"], ans: 0 },
    { q: "pin assignment(.qsf)을 하지 않고 보드에 다운로드하면 어떻게 됩니까?",
      opts: ["Quartus 가 알아서 올바른 핀을 찾아 준다",
             "신호가 엉뚱한 핀으로 나가 스위치와 LED 가 맞지 않는다",
             "컴파일 자체가 되지 않는다",
             "simulation 결과도 함께 틀려진다"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 FPGA 와 설계 흐름을 확인하고, <b>Lab 0 회로의 출력을 미리 손으로 적어</b> 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "lo",   label: "LEDR[7:0] (8비트)", len: 8, ph: "00000000" },
        { key: "led8", label: "LEDR[8]",           len: 1, ph: "0" },
        { key: "led9", label: "LEDR[9]",           len: 1, ph: "0" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (hi) => {
          const v = (hi << 8) | (nx() % 256);
          return { v, given: `SW[9:0] = ${bin(v, 10)}` };
        };
        return [mk(1 + (nx() % 2)), mk(3)];   // 하나는 SW9,SW8 중 하나만, 하나는 둘 다 1
      },
      model: (c) => ({ lo: lo8(c.v), led8: String(sw8(c.v) & sw9(c.v)),
                       led9: String(sw8(c.v) ^ sw9(c.v)) }),
    },
    reading: {
      question: "<code>LEDR(7 downto 0) &lt;= SW(7 downto 0);</code> 은 전선 여덟 가닥을 잇는 것입니다. " +
                "그렇다면 이 줄과 아래 두 줄의 <b>순서를 바꾸면</b> 회로가 달라집니까? 왜 그렇습니까?",
      ph: "예) VHDL 의 줄은 차례로 실행되는 것이 아니라 …",
      askPh: "예) '<=' 가 왜 대입이 아니라 전선이라고 하는지 잘 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }, { t: "note", html: "<b>AI 는 개념 공부에만</b> 씁니다. 문항은 먼저 혼자 풀고, 채점한 뒤 틀린 개념을 AI 에게 물어보세요. AI 설명이 슬라이드와 다르면 질문 칸에 적어 오세요. 이번 주 실습·과제 코드는 AI 없이 씁니다." }] },
      { no: 2, title: "출력 미리 적어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "Lab 0 의 회로는 세 갈래입니다. 아래 두 경우의 LEDR 을 <b>손으로 적으세요</b>. " +
          "학번마다 값이 다르고, <b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w01-lab0.png", cap: "그림 1. Lab 0 — SW 가 세 갈래로 갈려 LEDR 로 간다",
          alt: "SW[9:0] 에서 세 갈래가 나와 각각 그대로 통과, AND, XOR 를 지나 LEDR[9:0] 으로 들어가는 block diagram." },
        { t: "note", html: "<b>어떻게 푸나.</b> 아래 여덟 줄은 그냥 이어진 전선입니다 — SW 값이 그대로 나옵니다. " +
          "위의 두 줄만 게이트를 지납니다. <code>LEDR(8)</code> 은 SW8 과 SW9 의 AND, " +
          "<code>LEDR(9)</code> 는 XOR 입니다." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>lab00_sw_led.vhd</code> 의 architecture 입니다." },
        { t: "code", key: "read", name: "", text:
`architecture rtl of lab00_sw_led is
begin
  LEDR(7 downto 0) <= SW(7 downto 0);          -- 그대로 통과
  LEDR(8)          <= SW(8) and SW(9);         -- AND 게이트 하나
  LEDR(9)          <= SW(8) xor SW(9);         -- XOR 게이트 하나
end architecture rtl;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — SW 를 LED 로",
    sub: "코드를 직접 입력해 돌리고, 예습 때 적은 값과 맞춰 봅니다. " +
         "그다음 Quartus 로 synthesis 하고 핀을 배정해 보드에 다운로드합니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) 아래 여덟 줄은 맞았는데 LEDR[9] 를 AND 로 잘못 봤다." },
    practice: { file: "lab00_sw_led.vhd", checkNote: "1024가지 SW 값을 전부 넣어 확인합니다.", sigs: "SW, LEDR", 
                localCmd: "ghdl -a --std=08 lab00_sw_led.vhd grader/w01/tb_lab00_check.vhd && " +
                          "ghdl -r --std=08 tb_lab00_check --ieee-asserts=disable" },
    wave: {
      vcd: "vcd/w01.vcd", step: 20,
      sigs: [
        { path: "sw",   width: 10, label: "SW" },
        { path: "ledr", width: 10, label: "LEDR" },
        { path: "led8", width: 1,  label: "LEDR[8] = AND" },
        { path: "led9", width: 1,  label: "LEDR[9] = XOR" },
      ],
    },
    quiz: [
      { type: "vector",  path: "ledr", width: 10, label: "LEDR",
        hint: "waveform 의 LEDR 칸을 그대로 옮겨 적습니다. 10비트 전부." },
      { type: "vector",  path: "sw",   width: 10, label: "SW",
        hint: "입력 쪽입니다. 출력과 어디가 같고 어디가 다른지 보세요." },
      { type: "count",   path: "led8", label: "LEDR[8] (AND)",
        hint: "SW8 과 SW9 가 둘 다 1 인 구간이 몇 개인지 세는 것과 같습니다." },
      { type: "decimal", path: "ledr", width: 10, label: "LEDR", signed: false,
        hint: "부호 없는 10비트로 읽습니다. 0 ~ 1023." },
    ],
    design: {
      file: "lab00_or_nand.vhd",
      localCmd: "ghdl -a --std=08 lab00_or_nand.vhd grader/w01/tb_lab00_or_nand_check.vhd && " +
                "ghdl -r --std=08 tb_lab00_or_nand_check --ieee-asserts=disable",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;

entity lab00_or_nand is
  port (
    SW   : in  std_logic_vector(9 downto 0);
    LEDR : out std_logic_vector(9 downto 0)
  );
end entity lab00_or_nand;

architecture rtl of lab00_or_nand is
begin
  LEDR(7 downto 0) <= SW(7 downto 0);          -- 이 줄은 그대로 둔다

  -- ① LEDR(8) 을 SW(8) 과 SW(9) 의 OR 로 바꾸시오. (원래는 and)


  -- ② LEDR(9) 를 SW(8) 과 SW(9) 의 NAND 로 바꾸시오. (원래는 xor)


end architecture rtl;`,
    },
    quartus: { pins: 20, registers: 0, pinmap: PINMAP.lab00, regNote: "combinational circuit 이므로 0이 맞습니다" },
    board: {
      photoLabel: "보드 대표 사진 — SW 위치와 켜진 LED 가 함께 보이게 두 장",
      fields: [
        { key: "lo",   label: "LEDR[7:0] (8비트)", ph: "00000000" },
        { key: "led8", label: "LEDR[8]",           ph: "0 또는 1" },
        { key: "led9", label: "LEDR[9]",           ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (v, label) => ({ v, label: `${label} — SW = ${bin(v, 10)}`,
          sw: `SW[9]=${sw9(v)} · SW[8]=${sw8(v)} · SW[7:0]=${lo8(v)}` });
        return [
          mk((3 << 8) | (u % 256), "둘 다 올림"),
          mk((1 << 8) | ((u >>> 9) % 256), "하나만 올림"),
        ];
      },
      expect: (c) => ({ lo: lo8(c.v), led8: String(sw8(c.v) & sw9(c.v)),
                        led9: String(sw8(c.v) ^ sw9(c.v)) }),
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "오늘 만드는 것은 <b>combinational circuit</b> 하나입니다. 스위치를 올리면 그 즉시 LED 가 따라옵니다 — " +
          "기억하는 것도, 기다리는 것도 없습니다. 아래 여덟 줄은 전선을 그냥 이은 것이고, " +
          "위의 두 줄에만 게이트가 하나씩 들어갑니다." },
        { t: "fig", src: "figs/w01-lab0.png", cap: "그림 1. Lab 0 — SW 가 세 갈래로 갈려 LEDR 로 간다",
          alt: "SW[9:0] 에서 세 갈래가 나와 각각 그대로 통과, AND, XOR 를 지나 LEDR[9:0] 으로 들어가는 block diagram." },
        { t: "table", cls: "tt", caption: "위 두 줄의 truth table",
          head: ["SW[9]", "SW[8]", "LEDR[8] (AND)", "LEDR[9] (XOR)"],
          rows: [["0","0","0","0"],["0","1","0","1"],["1","0","0","1"],["1","1","1","0"]],
          hl: [[3,2]] },
        { t: "code", key: "lab", name: "lab00_sw_led.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;

entity lab00_sw_led is
  port (
    SW   : in  std_logic_vector(9 downto 0);
    LEDR : out std_logic_vector(9 downto 0)
  );
end entity lab00_sw_led;

architecture rtl of lab00_sw_led is
begin
  LEDR(7 downto 0) <= SW(7 downto 0);          -- 그대로 통과
  LEDR(8)          <= SW(8) and SW(9);         -- AND 게이트 하나
  LEDR(9)          <= SW(8) xor SW(9);         -- XOR 게이트 하나
end architecture rtl;` },
        { t: "note", html: "<b>파일 이름은 entity 이름과 같게.</b> <code>lab00_sw_led.vhd</code> 입니다. " +
          "이것은 VHDL 의 규칙은 아니지만 Quartus 와 사람이 모두 그렇게 기대합니다. " +
          "이 과목에서는 끝까지 이 규칙을 지킵니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "복사해 붙여도 돌아가지만, 타이핑하면서 <code>downto</code> 의 방향과 세미콜론 자리에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다 — 이것이 실습을 실제로 했다는 증거입니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "GHDL simulation 결과입니다. waveform 을 <b>클릭하거나 드래그</b>해 커서를 옮기면 " +
          "그 시각의 값이 아래에 나옵니다. 보드가 없어도 회로가 맞는지 여기서 먼저 압니다." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> SW 와 LEDR 의 아래 여덟 비트는 언제나 같습니다. " +
          "<b>맨 위 두 비트만</b> 다릅니다. simulation 에서 이 두 비트가 truth table 과 맞는지 확인하는 것이 " +
          "오늘 할 일의 전부입니다." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "설계 사양 — 게이트 두 개를 바꿔 보기", blocks: [
        { t: "p", html: "실습에서 만든 회로에서 <b>게이트 두 개만</b> 바꿉니다. " +
          "아래 여덟 줄은 손대지 않고, 위의 두 줄만 고치면 됩니다. " +
          "바꾸고 나서 <b>보드에서 무엇이 달라 보이는지</b>를 직접 확인하는 것이 이 과제의 목적입니다." },
        { t: "table", caption: "무엇을 어떻게 바꾸나",
          head: ["줄", "실습 (원래)", "과제 (바꾼 뒤)"],
          rows: [["LEDR(7 downto 0)", "SW(7 downto 0)", "그대로"],
                 ["LEDR(8)", "SW(8) <b>and</b> SW(9)", "SW(8) <b>or</b> SW(9)"],
                 ["LEDR(9)", "SW(8) <b>xor</b> SW(9)", "SW(8) <b>nand</b> SW(9)"]],
          hl: [[1,2],[2,2]] },
        { t: "table", cls: "tt", caption: "truth table — 네 가지를 모두 맞혀야 합니다",
          head: ["SW[9]", "SW[8]", "LEDR[8] (or)", "LEDR[9] (nand)"],
          rows: [["0","0","0","1"],["0","1","1","1"],["1","0","1","1"],["1","1","1","0"]],
          hl: [[0,3],[3,3]] },
        { t: "note", html: "<b>NAND 를 눈여겨보세요.</b> 네 경우 가운데 <b>세 번</b>이 1 입니다 — " +
          "보드에 올리면 LEDR[9] 가 거의 늘 켜져 있고 스위치를 둘 다 올렸을 때만 꺼집니다. " +
          "AND 와 정확히 반대로 보이는데, 그 까닭을 수업 후 설명 칸에 적게 됩니다." },
      ] },
      { no: 6, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② 를 채우고 <b>GHDL 로 실행</b>을 누르면 SW 값 1024가지를 전부 넣어 본 결과가 " +
          "1~2분 안에 돌아옵니다. 고치는 곳은 두 줄뿐이지만, <b>아래 여덟 줄도 그대로 있어야</b> " +
          "통과합니다 — 통째로 지우고 두 줄만 쓰면 떨어집니다." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 0 은 SW 10 + LEDR 10 = <b>20핀</b> 입니다. " +
          "핀 번호를 손으로 외울 필요는 없습니다 — 보드 설명서의 표를 <code>.qsf</code> 에 옮기면 됩니다. " +
          "여기 올리면 그 표와 통째로 대조해 드립니다." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "보드에 다운로드하고 <b>본인 학번으로 지정된 두 조합</b>으로 스위치를 맞춘 뒤, " +
          "켜진 LED 를 읽어 적고 사진을 찍으세요. 조합은 학생마다 다릅니다." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다 — " +
          "실행 로그 · 예측 대조표 · waveform · 컴파일 결과 · 보드 사진이 한 장에 들어갑니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 바꾼 두 줄이 만든 차이",
    sub: "synthesis 결과를 확인하고, 게이트를 바꾸니 무엇이 달라졌는지 말로 설명한 뒤 토의에 답합니다.",
    rtl: { after: "실습 판과 과제 판을 <b>둘 다 synthesis 해</b> RTL Viewer 로 견주어 보세요. " +
                  "게이트 기호 두 개만 바뀌어 있어야 합니다." },
    explain: {
      ph: "예) SW[9]=0, SW[8]=0 으로 두었더니 LEDR[8] 은 꺼지고 LEDR[9] 는 켜졌다. and 는 둘 다 1 이어야 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>SW, LEDR</span> 이 모두 나와야 합니다",
      concepts: [
        { label: "or / nand",   words: ["or", "nand", "OR", "NAND"] },
        { label: "몇 번 켜지나", words: ["세 번", "3번", "한 번", "1번", "개수"] },
        { label: "반대로 보임",  words: ["반대", "뒤집", "거꾸로", "not"] },
        { label: "구체적 입력",  words: ["SW[9]", "SW[8]", "SW9", "SW8"] },
        { label: "근거 시각",    words: ["ns"] },
      ],
      model: "<span class='mono'>SW[9]=0, SW[8]=0</span> 으로 두면 LEDR[8] 은 꺼지고 LEDR[9] 는 켜진다. " +
        "OR 는 둘 중 하나만 1 이어도 1 이므로 네 경우 가운데 <b>세 번</b> 켜지고, " +
        "AND 였을 때는 한 번만 켜졌다. " +
        "NAND 는 AND 의 결과를 뒤집은 것이라 네 경우 가운데 <b>세 번</b> 켜지고, " +
        "둘 다 올렸을 때만 꺼진다 — 보드에서 보면 AND 와 정확히 반대로 움직인다. " +
        "XOR 였을 때는 두 스위치가 서로 다를 때만 켜졌으니, 켜지는 횟수가 두 번에서 세 번으로 늘었다. " +
        "회로에서 바뀐 것은 게이트 기호 두 개뿐이고 배선은 그대로다.",
      rubric: [
        "스위치 조합을 하나 특정하고 그때의 LEDR 두 개를 적었다",
        "OR 가 AND 와 어떻게 다른지 켜지는 횟수로 설명했다",
        "NAND 가 AND 와 반대로 보이는 까닭을 밝혔다",
        "실습 판과 과제 판에서 바뀐 곳이 두 줄뿐임을 확인했다",
      ],
    },
    discuss: { ph: "NAND 만으로 …" },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → RTL Viewer</b> 를 열면 synthesis 기가 " +
          "내 코드를 어떤 회로로 읽었는지 보입니다. 게이트 두 개가 바뀐 것 말고 " +
          "달라진 곳이 있는지 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "바꾼 회로를 ModelSim 또는 GHDL 로 돌리고, " +
          "<b>실습 판과 견주어 무엇이 달라졌는지</b> 스위치 조합을 하나 골라 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "<b>NAND 하나만 있으면 다른 게이트를 모두 만들 수 있다</b>고 합니다. " +
          "NAND 로 NOT 을, 그리고 NOT 과 NAND 로 AND 를 어떻게 만들지 적어 보세요. " +
          "실제 반도체 공정에서 NAND 가 특히 많이 쓰이는 까닭도 함께 생각해 보세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
