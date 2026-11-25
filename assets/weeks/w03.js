/* ══════════════════════════════════════════════════════════════
   Week 03 — 벡터와 선택 구문 : MUX · decoder · encoder   (Lab 2)
   실습 mux4_1 (전체 코드 제공) · 과제 mux4_1_we — when-else 판 (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

const HEXCH = "0123456789ABCDEF";

export const W = {
  id: "w03", no: 3, lab: "lab02", labTitle: "MUX · decoder · encoder",
  topic: "벡터와 선택 구문",
  h1: "여러 비트를 한 덩어리로",
  lead: "신호 네 가닥을 이름 하나로 묶고, 값에 따라 골라내는 회로를 씁니다. " +
        "<b>수업 전</b>에 MUX 의 출력을 미리 적어 두고, <b>수업 중</b>에 부품을 불러 써서 보드에 올리고, " +
        "<b>수업 후</b>에 우선순위 encoder 를 스스로 설계합니다.",
  chips: ["std_logic_vector", "when-else", "with-select", "entity work.이름"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w03", count: 45, pad: 2, per: 8, title: "W03 벡터와 선택 구문", narration: "w03" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w03.vcd</span>)를 그대로 읽어 그린 것입니다.",

  concepts: [
    { q: "<code>when-else</code> 와 <code>with-select</code> 의 가장 큰 차이는?",
      opts: ["when-else 는 우선순위가 있고, with-select 는 값마다 하나씩 정해진다",
             "with-select 가 더 빠른 회로가 된다",
             "when-else 는 process 안에서만 쓸 수 있다",
             "둘은 완전히 같고 취향 문제다"], ans: 0 },
    { q: "<code>with sel select</code> 에서 <code>when others</code> 를 반드시 써야 하는 까닭은?",
      opts: ["문법이 그렇게 생겨서 외워야 한다",
             "std_logic 은 값이 9가지라 \"00\"~\"11\" 네 개만 적으면 나머지가 남기 때문에",
             "simulation 속도를 올리기 위해",
             "others 가 없으면 우선순위가 생기기 때문에"], ans: 1 },
    { q: "<code>when-else</code> 에서 마지막 <code>else</code> 를 빠뜨리면 어떤 일이 생깁니까?",
      opts: ["아무 일도 없다",
             "어떤 조건에도 안 맞는 경우에 값을 유지해야 해서 latch 가 만들어진다",
             "첫 조건만 적용된다",
             "출력이 0 으로 고정된다"], ans: 1 },
    { q: "<code>y &lt;= i2</code> 처럼 폭이 다른 신호를 대입하면?",
      opts: ["남는 비트는 0 으로 채워진다", "폭이 다르면 오류가 난다",
             "앞의 비트가 잘린다", "경고만 나고 돌아간다"], ans: 1 },
    { q: "다른 파일에 있는 부품을 가져다 쓸 때 이 과목에서 쓰는 방법은?",
      opts: ["<code>#include</code> 로 파일을 불러온다",
             "<code>u1 : entity work.부품이름 port map (…)</code> 로 바로 놓는다",
             "복사해서 같은 파일에 붙여 넣는다",
             "Quartus 가 자동으로 연결해 준다"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 벡터와 선택 구문을 확인하고, <b>MUX 의 출력을 sel 세 가지에 대해</b> 미리 적어 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "y",  label: "y (현재 sel, 4비트)",  len: 4, ph: "0000" },
        { key: "yp", label: "sel 이 1 커지면",       len: 4, ph: "0000" },
        { key: "ym", label: "sel 이 1 작아지면",     len: 4, ph: "0000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = () => {
          const i = [nx() % 16, nx() % 16, nx() % 16, nx() % 16];
          const sel = nx() % 4;
          return { i, sel,
            given: `sel=${bin(sel, 2)} · i0=${bin(i[0],4)} i1=${bin(i[1],4)} ` +
                   `i2=${bin(i[2],4)} i3=${bin(i[3],4)}` };
        };
        return [mk(), mk()];
      },
      model: (c) => ({
        y:  bin(c.i[c.sel], 4),
        yp: bin(c.i[(c.sel + 1) % 4], 4),
        ym: bin(c.i[(c.sel + 3) % 4], 4),
      }),
    },
    reading: {
      question: "<code>i3 when others</code> 는 왜 <code>i3 when \"11\"</code> 이 아닙니까? " +
                "그리고 <code>sel</code> 이 <code>\"1X\"</code> 같은 값이 되면 <code>y</code> 는 어떻게 됩니까?",
      ph: "예) std_logic 은 0 과 1 말고도 …",
      askPh: "예) downto 와 to 가 어떻게 다른지 잘 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }, { t: "note", html: "<b>AI 는 개념 공부에만</b> 씁니다. 문항은 먼저 혼자 풀고, 채점한 뒤 틀린 개념을 AI 에게 물어보세요. AI 설명이 슬라이드와 다르면 질문 칸에 적어 오세요. 이번 주 실습·과제 코드는 AI 없이 씁니다." }] },
      { no: 2, title: "출력 미리 적어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "아래 두 경우에 대해 <b>지금 sel</b>, <b>sel 이 1 커졌을 때</b>, " +
          "<b>1 작아졌을 때</b> 의 y 를 각각 적으세요. 학번마다 값이 다르고, " +
          "<b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w03-mux.png", cap: "그림 1. 4:1 MUX — sel 이 네 다발 중 하나를 고른다",
          alt: "i0~i3 네 개의 4비트 입력이 mux4_1 블록으로 들어가고, 아래에서 sel[1:0] 이 올라오며 오른쪽으로 y[3:0] 이 나가는 block diagram." },
        { t: "note", html: "<b>어떻게 푸나.</b> sel 이 \"00\" 이면 i0, \"01\" 이면 i1, \"10\" 이면 i2, " +
          "나머지는 i3 입니다. sel 이 \"11\" 일 때 1 을 더하면 \"00\" 으로 돌아갑니다(순환)." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>mux4_1.vhd</code> 의 architecture 입니다." },
        { t: "code", key: "read", name: "", text:
`architecture rtl of mux4_1 is
begin
  with sel select y <=
    i0 when "00",
    i1 when "01",
    i2 when "10",
    i3 when others;
end architecture rtl;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 4:1 MUX",
    sub: "네 다발 중 한 다발을 통째로 고르는 회로를 <code>with-select</code> 로 씁니다. " +
         "그다음 부품 네 개를 불러 TOP 을 만들어 보드에 올립니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) sel=\"11\" 에서 1 을 더하면 \"00\" 으로 돌아가는 것을 놓쳤다." },
    practice: { file: "mux4_1.vhd", checkNote: "sel 4가지 × 입력 패턴 16가지 = 64가지를 확인합니다.",
                sigs: "sel, i0~i3, y", 
                localCmd: "ghdl -a --std=08 mux4_1.vhd grader/w03/tb_mux4_1_check.vhd && " +
                          "ghdl -r --std=08 tb_mux4_1_check --ieee-asserts=disable" },
    wave: {
      vcd: "vcd/w03.vcd", step: 20,
      sigs: [
        { path: "sel", width: 2, label: "sel" },
        { path: "i0",  width: 4, label: "i0" },
        { path: "i1",  width: 4, label: "i1" },
        { path: "i2",  width: 4, label: "i2" },
        { path: "i3",  width: 4, label: "i3" },
        { path: "y",   width: 4, label: "y" },
      ],
    },
    quiz: [
      { type: "vector",  path: "y",   width: 4, label: "y",
        hint: "그 시각의 sel 을 먼저 보고, 해당하는 i 를 찾으면 됩니다." },
      { type: "vector",  path: "sel", width: 2, label: "sel",
        hint: "2비트입니다. waveform 의 sel 칸을 그대로 옮겨 적으세요." },
      { type: "count",   path: "y3",  label: "y 의 최상위 비트 y(3)",
        hint: "y 가 8 이상인 구간이 몇 개인지 세는 것과 같습니다." },
      { type: "decimal", path: "y",   width: 4, label: "y", signed: false,
        hint: "부호 없는 수로 읽습니다. 0 ~ 15." },
    ],
    design: {
      file: "mux4_1_we.vhd",
      localCmd: "ghdl -a --std=08 mux4_1_we.vhd grader/w03/tb_mux4_1_we_check.vhd && " +
                "ghdl -r --std=08 tb_mux4_1_we_check --ieee-asserts=disable",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;

entity mux4_1_we is                                   -- we = when-else
  port (
    sel : in  std_logic_vector(1 downto 0);
    i0, i1, i2, i3 : in std_logic_vector(3 downto 0);
    y   : out std_logic_vector(3 downto 0)
  );
end entity mux4_1_we;

architecture rtl of mux4_1_we is
begin

  -- ① 같은 4:1 MUX 를 when-else 로 쓰시오.
  --    sel = "00" 이면 i0, "01" 이면 i1, "10" 이면 i2, 그 밖에는 i3.
  --    조건을 계단처럼 이어 쓰고, 마지막 else 를 빠뜨리지 말 것.
  --    (마지막 else 가 없으면 어떤 경우에 값이 안 정해져 latch 가 생긴다)


end architecture rtl;`,
    },
    quartus: { pins: 41, registers: 0, pinmap: PINMAP.lab02, regNote: "combinational circuit 이므로 0이 맞습니다" },
    board: {
      photoLabel: "보드 대표 사진 — SW 위치와 HEX0·HEX1·HEX2 가 함께 보이게 두 장",
      fields: [
        { key: "h0", label: "HEX0 (16진 한 글자)", ph: "예: A" },
        { key: "h1", label: "HEX1 (16진 한 글자)", ph: "예: 3" },
        { key: "h2", label: "HEX2 (MUX 결과)",     ph: "예: 5" },
        { key: "l2", label: "LEDR[2] (xor)",       ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (lo, hi, sel, label) => ({ lo, hi, sel,
          label: `${label} — SW[9:8]=${bin(sel,2)}`,
          sw: `SW[3:0]=${bin(lo,4)} · SW[7:4]=${bin(hi,4)} · SW[9:8]=${bin(sel,2)}` });
        return [
          mk(u % 16, (u >>> 5) % 16, (u >>> 11) % 2, "i0 또는 i1 고르기"),
          mk((u >>> 13) % 16, (u >>> 17) % 16, 2 + ((u >>> 21) % 2), "고정값 고르기"),
        ];
      },
      // TOP : HEX0 <- SW(3..0), HEX1 <- SW(7..4), HEX2 <- mux(i0=SW(3..0), i1=SW(7..4), i2="1010", i3="0101")
      expect(c) {
        const m = [c.lo, c.hi, 0b1010, 0b0101][c.sel];
        return { h0: HEXCH[c.lo], h1: HEXCH[c.hi], h2: HEXCH[m],
                 l2: String(((c.lo >> 1) & 1) ^ (c.lo & 1)) };
      },
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "4:1 MUX 는 <b>네 다발 중 한 다발을 통째로</b> 고릅니다. " +
          "입력도 출력도 4비트짜리 벡터라 폭이 서로 맞아야 합니다. " +
          "경우가 sel 값 하나로 갈리므로 <code>with-select</code> 가 딱 맞습니다." },
        { t: "fig", src: "figs/w03-mux.png", cap: "그림 1. 4:1 MUX — sel 이 네 다발 중 하나를 고른다",
          alt: "i0~i3 네 개의 4비트 입력이 mux4_1 블록으로 들어가고, 아래에서 sel[1:0] 이 올라오며 오른쪽으로 y[3:0] 이 나가는 block diagram." },
        { t: "table", cls: "tt", caption: "선택표", head: ["sel", "y 로 나가는 것"],
          rows: [['"00"', "i0"], ['"01"', "i1"], ['"10"', "i2"], ["others", "i3"]] },
        { t: "code", key: "lab", name: "mux4_1.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;

entity mux4_1 is
  port (
    sel : in  std_logic_vector(1 downto 0);
    i0, i1, i2, i3 : in std_logic_vector(3 downto 0);
    y   : out std_logic_vector(3 downto 0)
  );
end entity mux4_1;

architecture rtl of mux4_1 is
begin
  with sel select y <=
    i0 when "00",
    i1 when "01",
    i2 when "10",
    i3 when others;
end architecture rtl;` },
        { t: "note", html: "<b>\"11\" 이 아니라 others 입니다.</b> std_logic 은 0 과 1 말고도 " +
          "'X'(충돌) · 'U'(미초기화) · 'Z'(고임피던스) 같은 값이 있어 모두 아홉 가지입니다. " +
          "네 가지만 적으면 나머지가 남아 latch 가 생깁니다. <code>others</code> 가 그 나머지를 전부 덮습니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "<code>with … select</code> 의 쉼표와 마지막 세미콜론 자리에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "sel 과 네 입력을 12가지로 바꾼 결과입니다. " +
          "커서를 옮기며 <b>y 가 어느 입력을 따라가는지</b> 눈으로 좇아 보세요." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> 앞의 네 구간은 i0~i3 를 고정해 두고 sel 만 바꿉니다. " +
          "y 가 네 입력을 차례로 따라가는 것이 보입니다. " +
          "입력은 그대로인데 출력만 바뀌는 — MUX 가 하는 일이 바로 이것입니다." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "설계 사양 — 같은 MUX 를 when-else 로", blocks: [
        { t: "p", html: "실습에서 <code>with-select</code> 로 쓴 바로 그 회로를 " +
          "<code>when-else</code> 로 다시 씁니다. <b>동작도 synthesis 결과도 같아야</b> 합니다 — " +
          "달라지는 것은 적는 방식뿐입니다. 그 \"같음\" 을 직접 확인하는 것이 이 과제의 목적입니다." },
        { t: "table", caption: "포트 사양 — 실습의 mux4_1 과 완전히 같습니다 (이름만 다름)",
          head: ["포트","방향","폭","뜻"],
          rows: [["sel","in","2","넷 중 하나를 고르는 신호"],
                 ["i0, i1, i2, i3","in","각 4","고를 대상 네 다발"],
                 ["y","out","4","고른 결과"]] },
        { t: "table", cls: "tt", caption: "두 방식 비교 — 같은 표를 다르게 적은 것",
          head: ["", "with-select (실습)", "when-else (과제)"],
          rows: [["쓰는 꼴", '<code>i0 when "00",</code>', '<code>i0 when sel = "00" else</code>'],
                 ["우선순위", "없음 — 값마다 하나씩", "있음 — 위에서부터 검사"],
                 ["마지막 줄", "<code>when others</code>", "조건 없는 <code>else</code>"],
                 ["synthesis 결과", "같은 MUX", "같은 MUX"]],
          hl: [[3,1],[3,2]] },
        { t: "note", html: "<b>우선순위가 있는데 왜 결과가 같습니까?</b> " +
          "sel 은 한 번에 한 값만 가지므로 조건이 서로 겹치지 않습니다. " +
          "겹치지 않는 조건이면 우선순위가 있어도 결과가 달라질 일이 없습니다 — " +
          "이것이 이 과제에서 확인할 핵심입니다." },
        { t: "note", html: "<b>제출물에 RTL Viewer 그림 두 장이 들어갑니다.</b> " +
          "실습의 <code>mux4_1</code> 과 과제의 <code>mux4_1_we</code> 를 " +
          "<b>각각 synthesis 해</b> 두 그림을 나란히 붙이고, 같은지 다른지 적으세요." },
      ] },
      { no: 6, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "①을 채우고 <b>GHDL 로 실행</b>을 누르면 실습과 <b>똑같은 64가지</b>로 검사합니다 — " +
          "채점기가 같으니 통과했다면 두 판의 동작이 같다는 뜻입니다. " +
          "<code>with-select</code> 로 쓰면 이름만 바꾼 것이 되니, 반드시 <code>when-else</code> 로 쓰세요." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 2 TOP 은 부품 네 개를 불러 씁니다 — <code>gates</code> 하나, " +
          "<code>hex7seg</code> 셋, <code>mux4_1</code> 하나. SW 10 + LEDR 10 + HEX0~2 (21) = <b>41핀</b> 입니다. " +
          "<code>component</code> 선언 없이 <code>entity work.이름</code> 으로 바로 놓는 것이 이 과목의 방식입니다." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "보드에 다운로드하고 <b>본인 학번으로 지정된 두 조합</b>을 맞춘 뒤, " +
          "HEX 세 자리에 보이는 16진 글자와 LEDR[2] 를 적고 사진을 찍으세요. " +
          "SW[9:8] 이 \"10\" 또는 \"11\" 이면 HEX2 에 고정값이 나옵니다 — 코드에서 무엇인지 확인해 두세요." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 같은 회로, 두 가지 쓰기",
    sub: "두 판의 RTL 을 견주고, 우선순위가 있는데도 왜 결과가 같은지 설명한 뒤 토의에 답합니다.",
    rtl: { after: "<b>실습의 mux4_1 과 과제의 mux4_1_we 를 둘 다 synthesis 해</b> RTL Viewer 그림을 " +
                  "나란히 붙이세요. Total logic elements 수치도 함께 적으면 좋습니다." },
    explain: {
      ph: "예) sel=\"10\" 인 경우를 돌려 보았다. when-else 는 위에서부터 검사하지만 sel 은 한 번에 한 값이라 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>sel, i0~i3, y</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "조건이 겹치지 않음", words: ["겹치지", "겹침", "한 번에", "한번에", "배타"] },
        { label: "우선순위",         words: ["우선", "위에서부터", "순서"] },
        { label: "synthesis 결과 같음",    words: ["같", "동일", "차이가 없"] },
        { label: "구체적 sel",       words: ["sel"] },
        { label: "근거 시각",         words: ["ns"] },
      ],
      model: "<span class='mono'>sel=\"10\"</span> 인 구간을 보자. " +
        "<code>when-else</code> 는 위에서부터 조건을 검사하므로 먼저 " +
        "<span class='mono'>sel = \"00\"</span> 인지 보고, 아니면 <span class='mono'>\"01\"</span>, " +
        "그다음 <span class='mono'>\"10\"</span> 에서 걸려 i2 를 내보낸다. " +
        "<code>with-select</code> 판은 우선순위 없이 곧바로 i2 를 고른다. " +
        "그런데 <b>sel 은 한 번에 한 값만 가지므로 네 조건이 서로 겹치지 않는다</b>. " +
        "겹치지 않으면 어느 것을 먼저 보든 결과가 같으므로 두 판의 동작이 완전히 같고, " +
        "synthesis 기도 같은 MUX 를 만들어 낸다. " +
        "조건이 겹치는 회로였다면 이야기가 달라진다 — 우선순위 encoder 가 그 경우이고, " +
        "거기서는 <code>when-else</code> 를 써야만 한다.",
      rubric: [
        "sel 값을 하나 특정하고 두 판의 y 가 같음을 보였다",
        "when-else 가 위에서부터 검사한다는 점을 적었다",
        "그래도 결과가 같은 까닭을 \"조건이 겹치지 않음\" 으로 설명했다",
        "RTL Viewer 두 그림을 견주어 같은지 다른지 밝혔다",
      ],
    },
    discuss: { ph: "조건이 겹치는 회로라면 …" },
    steps: [
      { no: 1, title: "RTL View 읽기 — 두 판 견주기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "실습의 <code>mux4_1</code>(with-select)과 과제의 " +
          "<code>mux4_1_we</code>(when-else)를 각각 synthesis 해 RTL Viewer 로 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 <code>mux4_1_we</code> 를 돌리고, " +
          "<b>우선순위가 있는데도 왜 결과가 같은지</b> sel 값을 하나 골라 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "조건이 <b>겹치는</b> 회로에서는 두 방식의 결과가 달라집니다. " +
          "어떤 회로가 그렇습니까? 예를 하나 들고, 그때 <code>with-select</code> 로 쓰면 " +
          "무엇이 곤란해지는지 적어 보세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
