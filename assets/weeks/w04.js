/* ══════════════════════════════════════════════════════════════
   Week 04 — combinational circuit ① : process · case · 7-segment   (Lab 3)
   실습 hex7seg_case (전체 코드 제공) · 과제 hex7seg_ws (골격)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

const HEXCH = "0123456789ABCDEF";
/* seg(6..0) = g f e d c b a, active-low */
const SEG = ["1000000","1111001","0100100","0110000","0011001","0010010","0000010","1111000",
             "0000000","0010000","0001000","0000011","1000110","0100001","0000110","0001110"];
const litCount = (s) => s.split("").filter((c) => c === "0").length;

export const W = {
  id: "w04", no: 4, lab: "lab03", labTitle: "숫자를 7-segment 에 띄우기",
  topic: "process 와 7-segment",
  h1: "경우가 많으면 process 로",
  lead: "열여섯 가지를 한 상자 안에 정리하고, 숫자를 7-segment 에 띄웁니다. " +
        "<b>수업 전</b>에 segment 패턴을 미리 적어 두고, <b>수업 중</b>에 process 로 써서 보드에 올리고, " +
        "<b>수업 후</b>에 같은 회로를 <code>with-select</code> 로 다시 씁니다.",
  chips: ["process", "감지 목록", "case", "기본값으로 latch 막기"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w04", count: 41, pad: 2, per: 8, title: "W04 process 와 7-segment", narration: "w04" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w04.vcd</span>)를 그대로 읽어 그린 것입니다.",

  concepts: [
    { q: "process 의 <b>감지 목록</b>에 신호를 빠뜨리면 어떤 증상이 나옵니까?",
      opts: ["컴파일이 안 된다",
             "simulation 은 이상한데 보드는 정상으로 보인다",
             "보드만 이상하고 simulation 은 정상이다",
             "latch 가 생긴다"], ans: 1 },
    { q: "process 맨 앞에서 모든 출력에 기본값을 주는 까닭은?",
      opts: ["코드를 짧게 쓰려고",
             "어떤 경우에도 값이 정해지게 해서 latch 가 생기지 않도록",
             "simulation 을 빠르게 하려고",
             "synthesis 기가 요구하는 문법이라서"], ans: 1 },
    { q: "latch 가 생겼는지 Quartus 에서 가장 쉽게 확인하는 방법은?",
      opts: ["Total pins 를 본다",
             "combinational circuit 인데 Total registers 가 0 이 아닌지 본다",
             "RTL Viewer 를 연다",
             "pin assignment 를 다시 한다"], ans: 1 },
    { q: "DE1-SoC 의 HEX 에 <code>seg = \"0000000\"</code> 을 주면 무엇이 보입니까?",
      opts: ["아무것도 안 보인다", "8 이 보인다", "0 이 보인다", "오류가 난다"], ans: 1 },
    { q: "process 안에서 같은 신호에 두 번 값을 주면 어느 것이 남습니까?",
      opts: ["먼저 쓴 줄", "나중에 쓴 줄 — 아래가 위를 덮어쓴다",
             "둘 다 남아 충돌한다", "문법 오류가 난다"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 process 와 latch 를 확인하고, <b>7-segment 패턴을 미리 적어</b> 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "seg",  label: "seg(6..0) (7비트)",   len: 7, ph: "0000000" },
        { key: "show", label: "보이는 글자",          len: 1, ph: "A" },
        { key: "lit",  label: "켜진 segment 개수",    len: 1, ph: "7" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (d) => ({ d, given: `d = ${bin(d, 4)} (${HEXCH[d]}),  blank = 0` });
        const d1 = nx() % 16;
        let d2 = nx() % 16, g = 0;
        while (d2 === d1 && g++ < 8) d2 = nx() % 16;
        return [mk(d1), mk(d2)];
      },
      model: (c) => ({ seg: SEG[c.d], show: HEXCH[c.d], lit: String(litCount(SEG[c.d])) }),
    },
    reading: {
      question: "<code>seg &lt;= \"1111111\";</code> 한 줄을 지우면 무엇이 어떻게 달라집니까? " +
                "그리고 감지 목록에서 <code>blank</code> 를 빼면 simulation 과 보드 중 어느 쪽이 이상해집니까?",
      ph: "예) 기본값을 빼면 blank='1' 일 때 seg 가 정해지지 않아 …",
      askPh: "예) 왜 latch 가 나쁜 것인지 잘 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "segment 패턴 미리 적어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "아래 두 경우(둘 다 <code>blank='0'</code>)의 <code>seg</code> 패턴과 " +
          "보이는 글자, 켜진 segment 개수를 적으세요. 학번마다 값이 다르고, " +
          "<b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w04-seg.png", cap: "그림 1. 7-segment 의 이름과 비트 순서",
          alt: "일곱 개 막대로 그린 7-segment 숫자. 위 가로가 a, 오른쪽 위가 b, 오른쪽 아래가 c, 아래 가로가 d, 왼쪽 아래가 e, 왼쪽 위가 f, 가운데 가로가 g 로 표시되어 있다." },
        { t: "note", html: "<b>어떻게 푸나.</b> 먼저 그 숫자를 7-segment 에 어떻게 그리는지 종이에 그려 보세요. " +
          "켤 segment 를 정한 다음, <b>켜는 것을 0</b> 으로 바꿔 적습니다(active-low). " +
          "비트 순서는 <code>g f e d c b a</code> 로, 맨 왼쪽이 g 입니다." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>hex7seg_case.vhd</code> 의 앞부분입니다." },
        { t: "code", key: "read", name: "", text:
`  process (d, blank)                  -- 감지 목록 : 읽는 신호를 모두 적는다
  begin
    seg <= "1111111";                 -- 기본값 먼저 (latch 방지)
    if blank = '0' then
      case d is
        when "0000" => seg <= "1000000";   -- 0
        when "0001" => seg <= "1111001";   -- 1
        …
        when others => seg <= "0001110";   -- F
      end case;
    end if;
  end process;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 16진 한 자리 표시기",
    sub: "<code>기본값 → if → case</code> 세 겹으로 씁니다. 이 순서가 latch 를 막는 방법 그 자체입니다.",
    quizPoints: 8,
    compare: { points: 8, whyPh: "예) active-low 를 잊고 켜는 segment 를 1 로 적었다." },
    practice: { file: "hex7seg_case.vhd", checkNote: "d 16가지 × blank 2가지 = 32가지를 전부 확인합니다.",
                sigs: "d, blank, seg", 
                localCmd: "ghdl -a --std=08 grader/w04/ref_seg_table.vhd hex7seg_case.vhd grader/w04/tb_hex7seg_case_check.vhd && " +
                          "ghdl -r --std=08 tb_hex7seg_case_check --ieee-asserts=disable" },
    wave: {
      vcd: "vcd/w04.vcd", step: 20,
      sigs: [
        { path: "d",     width: 4, label: "d" },
        { path: "blank", width: 1, label: "blank" },
        { path: "seg",   width: 7, label: "seg (g f e d c b a)" },
        { path: "seg_g", width: 1, label: "seg(6) = g" },
      ],
    },
    quiz: [
      { type: "vector",  path: "seg", width: 7, label: "seg",
        hint: "7비트입니다. 맨 왼쪽이 g, 맨 오른쪽이 a 입니다." },
      { type: "vector",  path: "d",   width: 4, label: "d",
        hint: "입력 쪽입니다. 같은 d 라도 blank 가 1 이면 seg 가 달라지는 것에 주의하세요." },
      { type: "count",   path: "blank", label: "blank",
        hint: "waveform 전체에서 blank 가 1 인 구간을 세어 보세요." },
      { type: "count",   path: "seg_g", label: "g segment 가 <b>꺼져 있는</b>",
        hint: "active-low 이므로 g 가 '1' 인 구간이 꺼져 있는 구간입니다." },
    ],
    hunt: {
      bugs: 3,
      hint: "버그 하나는 채점기가 PASS 를 줘도 남아 있습니다. 채점기만 믿지 말고 과목 규약(sensitivity list, 기본값, 극성)과 한 줄씩 대조하세요.",
      code: "-- hex7seg_case.vhd : 4비트 값을 7-segment 한 자리로 (AI 가 쓴 코드)\nlibrary ieee;\nuse ieee.std_logic_1164.all;\n\nentity hex7seg_case is\n  port (\n    d     : in  std_logic_vector(3 downto 0);\n    blank : in  std_logic;                      -- '1' 이면 전부 끈다\n    seg   : out std_logic_vector(6 downto 0)    -- (g f e d c b a)\n  );\nend entity hex7seg_case;\n\narchitecture rtl of hex7seg_case is\nbegin\n  process (d)\n  begin\n    seg <= \"0000000\";                           -- 기본값 : 모두 끔\n    if blank = '0' then\n      case d is\n        when \"0000\" => seg <= \"1000000\";        -- 0\n        when \"0001\" => seg <= \"1111001\";        -- 1\n        when \"0010\" => seg <= \"0100100\";        -- 2\n        when \"0011\" => seg <= \"0110000\";        -- 3\n        when \"0100\" => seg <= \"0011001\";        -- 4\n        when \"0101\" => seg <= \"0010010\";        -- 5\n        when \"0110\" => seg <= \"0000010\";        -- 6\n        when \"0111\" => seg <= \"1111000\";        -- 7\n        when \"1000\" => seg <= \"0000000\";        -- 8\n        when \"1001\" => seg <= \"0010000\";        -- 9\n        when \"1010\" => seg <= \"0001000\";        -- A\n        when \"1011\" => seg <= \"0100001\";        -- b\n        when \"1100\" => seg <= \"1000110\";        -- C\n        when \"1101\" => seg <= \"0000011\";        -- d\n        when \"1110\" => seg <= \"0000110\";        -- E\n        when others => seg <= \"0001110\";        -- F\n      end case;\n    end if;\n  end process;\nend architecture rtl;\n",
    },
    design: {
      file: "hex7seg_ws.vhd",
      localCmd: "ghdl -a --std=08 grader/w04/ref_seg_table.vhd hex7seg_ws.vhd " +
                "grader/w04/tb_hex7seg_ws_check.vhd && ghdl -r --std=08 tb_hex7seg_ws_check --ieee-asserts=disable",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;

entity hex7seg_ws is
  port ( d     : in  std_logic_vector(3 downto 0);
         blank : in  std_logic;                     -- '1' 이면 전부 끈다
         seg   : out std_logic_vector(6 downto 0) );
end entity hex7seg_ws;

architecture rtl of hex7seg_ws is
  signal bd : std_logic_vector(4 downto 0);         -- blank 와 d 를 하나로 묶는다
begin

  -- ① blank 와 d 를 이어 붙여 5비트 하나로 만드시오.
  --    & 가 이어 붙이기(concatenation) 연산자다.


  -- ② with bd select seg <= … 로 쓰시오.
  --    blank='0' 인 16가지("00000"~"01111")에 각각의 패턴을 주고,
  --    나머지는 when others 로 "1111111"(전부 꺼짐) 을 준다.
  --    process 를 쓰지 않고 concurrent statement 한 덩어리로 쓰는 것이 이번 과제의 목적이다.


end architecture rtl;`,
    },
    quartus: { pins: 34, registers: 0, pinmap: PINMAP.lab03,
               regNote: "combinational circuit 이므로 0이 맞습니다 — 0이 아니면 latch 입니다" },
    board: {
      photoLabel: "보드 대표 사진 — SW 위치와 HEX0·HEX1 이 함께 보이게 두 장",
      fields: [
        { key: "h0", label: "HEX0 에 보이는 글자", ph: "예: A (꺼졌으면 -)" },
        { key: "h1", label: "HEX1 에 보이는 글자", ph: "예: 3 (꺼졌으면 -)" },
        { key: "l9", label: "LEDR[9]",            ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (lo, hi, bl, label) => ({ lo, hi, bl, label,
          sw: `SW[3:0]=${bin(lo,4)} · SW[7:4]=${bin(hi,4)} · SW[9]=${bl}` });
        return [
          mk(u % 16, (u >>> 5) % 16, 0, "켠 상태"),
          mk((u >>> 11) % 16, (u >>> 15) % 16, 1, "blank 올린 상태"),
        ];
      },
      expect: (c) => ({ h0: c.bl ? "-" : HEXCH[c.lo], h1: c.bl ? "-" : HEXCH[c.hi],
                        l9: String(c.bl) }),
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "조건이 두 겹입니다 — <b>끌지 말지</b> 를 먼저 가르고, 끄지 않을 때만 " +
          "<b>열여섯 가지</b> 중에 고릅니다. <code>with-select</code> 하나로는 깔끔하지 않아 " +
          "<code>process</code> 를 씁니다." },
        { t: "fig", src: "figs/w04-process.png", cap: "그림 2. process 안의 순서 — 기본값 → if → case",
          alt: "기본값 대입, if blank='0', case d 세 상자가 위에서 아래로 이어지고, 오른쪽 통로로 blank='1' 일 때 기본값이 그대로 남는 우회 경로가 그려진 흐름도." },
        { t: "fig", src: "figs/w04-seg.png", cap: "그림 1. 7-segment 의 이름과 비트 순서",
          alt: "일곱 개 막대로 그린 7-segment 숫자. 위 가로가 a, 오른쪽 위가 b, 오른쪽 아래가 c, 아래 가로가 d, 왼쪽 아래가 e, 왼쪽 위가 f, 가운데 가로가 g 로 표시되어 있다." },
        { t: "table", cls: "tt", caption: "자주 틀리는 네 가지만 — 나머지 열두 가지는 코드에 있습니다",
          head: ["d","글자","seg (g f e d c b a)","켜지는 것"],
          rows: [["0000","0","1000000","g 빼고 전부"],
                 ["0001","1","1111001","b, c 둘만"],
                 ["1000","8","0000000","일곱 개 전부"],
                 ["1011","b","0000011","a, b 빼고"]],
          hl: [[2,2]] },
        { t: "code", key: "lab", name: "hex7seg_case.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;

entity hex7seg_case is
  port (
    d     : in  std_logic_vector(3 downto 0);
    blank : in  std_logic;                      -- '1' 이면 전부 끈다
    seg   : out std_logic_vector(6 downto 0)
  );
end entity hex7seg_case;

architecture rtl of hex7seg_case is
begin
  process (d, blank)                            -- 감지 목록 : 읽는 신호를 모두 적는다
  begin
    seg <= "1111111";                           -- 기본값 먼저 (latch 방지)
    if blank = '0' then
      case d is
        when "0000" => seg <= "1000000";        -- 0
        when "0001" => seg <= "1111001";        -- 1
        when "0010" => seg <= "0100100";        -- 2
        when "0011" => seg <= "0110000";        -- 3
        when "0100" => seg <= "0011001";        -- 4
        when "0101" => seg <= "0010010";        -- 5
        when "0110" => seg <= "0000010";        -- 6
        when "0111" => seg <= "1111000";        -- 7
        when "1000" => seg <= "0000000";        -- 8
        when "1001" => seg <= "0010000";        -- 9
        when "1010" => seg <= "0001000";        -- A
        when "1011" => seg <= "0000011";        -- b
        when "1100" => seg <= "1000110";        -- C
        when "1101" => seg <= "0100001";        -- d
        when "1110" => seg <= "0000110";        -- E
        when others => seg <= "0001110";        -- F
      end case;
    end if;
  end process;
end architecture rtl;` },
        { t: "note", html: "<b>세 가지가 한 줄씩 일을 합니다.</b> " +
          "<code>process (d, blank)</code> — 이 둘이 바뀔 때만 다시 계산한다. " +
          "<code>seg &lt;= \"1111111\";</code> — 어떤 경우에도 값이 정해지게 한다(latch 방지). " +
          "<code>when others</code> — case 가 모든 경우를 덮게 한다. 셋 중 하나만 빠져도 증상이 납니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "2점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "열여섯 줄을 치는 동안 <code>when \"xxxx\" =&gt;</code> 꼴에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "d 를 바꾸며 중간에 blank 를 두 번 올린 결과입니다. " +
          "<b>같은 d 인데 seg 가 달라지는 구간</b>을 찾아보세요." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>latch 의 증상은 이렇게 보입니다.</b> 만약 d 가 바뀌었는데 seg 가 그대로라면 " +
          "latch 가 생긴 것입니다. 지금 waveform 에서는 d 가 바뀔 때마다 seg 가 따라 바뀌어야 합니다 — " +
          "본인 코드에서 기본값 줄을 지우고 한 번 돌려 보면 차이가 바로 보입니다." },
      ] },
      { no: 4, title: "자가점검", pts: "8점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "AI 코드 감별 — 버그 찾기", pts: "6점", widget: "aiHunt", blocks: [{ t: "p", html: "방금 만든 회로를 AI 에게 같은 사양으로 시켰더니 아래 코드가 나왔습니다. 그럴듯해 보이지만 <b>버그가 있습니다</b>. AI 없이, 채점기와 waveform 과 과목 규약만으로 찾아 고치세요." }, { t: "note", html: "AI 가 자주 내는 실수를 알아보는 눈을 기르는 단계입니다. 고친 코드가 PASS 해야 하고, 찾은 버그마다 <b>어느 줄, 무엇이, 무엇으로 알았는지</b>를 적습니다." }] },
      { no: 6, title: "설계 사양 — 같은 회로를 with-select 로", blocks: [
        { t: "p", html: "같은 동작을 <b>process 없이</b> concurrent statement 한 덩어리로 씁니다. " +
          "조건이 두 겹인데 <code>with-select</code> 는 값 하나로만 가를 수 있으므로, " +
          "<b>blank 와 d 를 이어 붙여 5비트 하나로 만드는</b> 것이 요령입니다." },
        { t: "table", caption: "포트 사양 — 실습의 hex7seg_case 와 완전히 같습니다",
          head: ["포트","방향","폭","뜻"],
          rows: [["d","in","4","표시할 16진 한 자리"],
                 ["blank","in","1","'1' 이면 전부 끈다"],
                 ["seg","out","7","g f e d c b a (active-low)"]] },
        { t: "table", cls: "tt", caption: "이어 붙인 5비트 bd 의 뜻",
          head: ["bd = blank & d", "경우", "seg"],
          rows: [['"00000" ~ "01111"', "blank='0' — 16가지", "각 숫자의 패턴"],
                 ['"10000" ~ "11111"', "blank='1' — 16가지", '"1111111" (전부 꺼짐)'],
                 ["그 외", "X · U 등이 섞인 경우", "others 가 덮는다"]],
          hl: [[1,2]] },
        { t: "note", html: "<b>왜 이렇게까지 하나.</b> 같은 회로를 두 가지로 써 보면 " +
          "<b>synthesis 결과가 같다</b>는 것을 눈으로 확인할 수 있습니다. " +
          "RTL Viewer 로 둘을 견주어 보세요 — 고르는 기준은 속도나 면적이 아니라 " +
          "<b>어느 쪽이 읽기 쉬운가</b> 입니다." },
      ] },
      { no: 7, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② 를 채우고 <b>GHDL 로 실행</b>을 누르면 32가지를 전부 넣어 본 결과가 돌아옵니다. " +
          "실습의 case 표를 그대로 옮기되 <code>when \"00000\"</code> 처럼 <b>5비트</b>로 적는 것을 잊지 마세요." },
      ] },
      { no: 8, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 3 TOP 은 <code>hex7seg_case</code> 를 <b>두 개</b> 놓습니다. " +
          "SW 10 + LEDR 10 + HEX0~1 (14) = <b>34핀</b> 입니다. " +
          "<b>Total registers 가 0 이 아니면 latch 가 생긴 것</b>입니다 — 기본값 줄을 확인하세요." },
      ] },
      { no: 9, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "보드에 다운로드하고 <b>본인 학번으로 지정된 두 조합</b>을 맞춘 뒤, " +
          "HEX0 · HEX1 에 보이는 글자를 적고 사진을 찍으세요. " +
          "둘째 조합은 <code>SW[9]</code> 를 올린 상태입니다 — 꺼져 있으면 <code>-</code> 로 적으세요." },
      ] },
      { no: 10, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 같은 회로, 두 가지 쓰기",
    sub: "두 판의 synthesis 결과를 견주고, latch 를 어떻게 막았는지 말로 설명한 뒤 토의에 답합니다.",
    rtl: { after: "<b>실습의 process 판과 과제의 with-select 판을 둘 다 열어</b> 견주어 보세요. " +
                  "synthesis 결과가 같다면 그 사실을 아래 동작 설명에 적으세요." },
    explain: {
      ph: "예) d=1010, blank=0 인 구간을 보았다. 기본값 \"1111111\" 이 먼저 깔리고 case 가 그것을 덮어써서 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>d, blank, seg</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "기본값/latch",  words: ["기본값", "latch", "latch", "덮어"] },
        { label: "감지 목록",    words: ["감지", "목록", "sensitivity", "process ("] },
        { label: "active-low",  words: ["active", "low", "0이면켜", "0 이면 켜", "반대"] },
        { label: "구체적 입력",  words: ["d=", "blank="] },
        { label: "근거 시각",    words: ["ns"] },
      ],
      model: "<span class='mono'>d=\"1010\", blank='0'</span> 인 구간을 보자. " +
        "process 가 다시 계산될 때 맨 먼저 <span class='mono'>seg &lt;= \"1111111\"</span> 이 깔린다. " +
        "그다음 <code>if blank = '0'</code> 이 참이므로 case 로 들어가고, " +
        "<span class='mono'>when \"1010\"</span> 가 걸려 <span class='mono'>seg &lt;= \"0001000\"</span> 으로 덮어쓴다. " +
        "process 안에서는 아래 줄이 위 줄을 덮으므로 최종값은 뒤에 쓴 쪽이다. " +
        "이 기본값 한 줄 덕분에 <b>어떤 경우에도 seg 가 정해지므로</b> latch 가 생기지 않는다. " +
        "만약 blank='1' 이면 case 를 건너뛰어 기본값 \"1111111\" 이 그대로 남아 일곱 개가 모두 꺼진다. " +
        "HEX 가 active-low 라 '0' 이 켜짐이므로, \"0001000\" 은 g 만 꺼진 모양 — 즉 A 가 보인다.",
      rubric: [
        "구간을 하나 특정하고 그 시각의 d, blank 값을 적었다",
        "기본값이 먼저 깔리고 case 가 덮어쓰는 순서를 설명했다",
        "그래서 latch 가 생기지 않는다는 점을 밝혔다",
        "active-low 때문에 패턴이 거꾸로 보인다는 점을 적었다",
      ],
    },
    discuss: { ph: "process 판과 with-select 판을 견주어 보면 …" },
    steps: [
      { no: 1, title: "RTL View 읽기 — 두 판 견주기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "실습의 <code>hex7seg_case</code>(process 판)와 과제의 " +
          "<code>hex7seg_ws</code>(with-select 판)를 <b>각각 synthesis 해</b> RTL Viewer 로 보세요. " +
          "두 판의 Total logic elements 수치도 함께 적어 두면 좋습니다." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 <code>hex7seg_ws</code> 를 돌리고, " +
          "<b>기본값과 덮어쓰기가 어떻게 latch 를 막는지</b> 구간 하나를 골라 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "같은 동작인데 한쪽은 <code>process</code>, 한쪽은 <code>with-select</code> 입니다. " +
          "<b>synthesis 결과는 같았습니까?</b> 그렇다면 둘 중 어느 쪽을 쓸지는 무엇으로 정해야 할까요? " +
          "그리고 조건이 세 겹, 네 겹으로 늘어나면 어느 쪽이 유리할지 적어 보세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
