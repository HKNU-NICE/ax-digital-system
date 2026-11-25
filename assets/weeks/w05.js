/* ══════════════════════════════════════════════════════════════
   Week 05 — 산술회로 : adder 에서 adder-subtractor 로   (Lab 4)
   실습 adder4 (전체 코드 제공) · 과제 addsub8 — 8비트로 넓히기 (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

/* ---------- ripple-carry 를 손으로 더하듯 그대로 계산 ---------- */
function ripple(a, b, cin) {
  const c = [cin];
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const ai = (a >> i) & 1, bi = (b >> i) & 1, ci = c[i];
    s |= (ai ^ bi ^ ci) << i;
    c.push((ai & bi) | (ci & (ai ^ bi)));
  }
  return { s: bin(s, 4), cout: String(c[4]), chain: c.slice().reverse().join("") };
}

export const W = {
  id: "w05", no: 5, lab: "lab04", labTitle: "4비트 adder-subtractor 설계",
  topic: "산술회로",
  h1: "adder 에서 adder-subtractor 로",
  lead: "세 단계로 진행합니다. <b>수업 전</b>에 슬라이드를 보고 waveform 을 미리 예측해 두고, " +
        "<b>수업 중</b>에 직접 돌려 예측과 맞춰 본 뒤 보드에 올리고, <b>수업 후</b>에 adder-subtractor 를 스스로 설계합니다.",
  chips: ["full_adder", "ripple carry", "2's complement", "carry vs overflow"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w05", count: 49, pad: 2, per: 8, title: "W05 산술회로", narration: "w05" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>adder4.vcd</span>)를 그대로 읽어 그린 것입니다.",

  /* ---------- 개념 확인 ---------- */
  concepts: [
    { q: "half adder 의 합 <code>s</code> 와 carry <code>c</code> 를 바르게 적은 것은?",
      opts: ["s = a xor b,  c = a and b", "s = a and b,  c = a xor b",
             "s = a or b,   c = a and b", "s = a xor b,  c = a or b"], ans: 0 },
    { q: "full adder 하나는 무엇으로 만들 수 있습니까?",
      opts: ["half adder 1개 + OR 1개", "half adder 2개 + OR 1개",
             "half adder 2개 + AND 1개", "half adder 4개"], ans: 1 },
    { q: "<code>sub='1'</code> 일 때 뺄셈이 되게 하려면 b 를 어떻게 합니까?",
      opts: ["b 를 XOR 로 반전만 하면 된다",
             "b 를 XOR 로 반전하고, 사슬 맨 아래 carry 입력에 1 을 넣는다",
             "b 를 AND 로 0 으로 만든다", "a 와 b 를 서로 바꾼다"], ans: 1 },
    { q: "<code>C</code> 와 <code>V</code> 는 무엇이 다릅니까?",
      opts: ["C 는 덧셈, V 는 뺄셈에서만 쓴다",
             "C 는 부호 없는 수로 볼 때, V 는 부호 있는 수로 볼 때 넘쳤는지를 말한다",
             "둘은 같은 신호의 다른 이름이다", "C 는 하드웨어, V 는 소프트웨어가 만든다"], ans: 1 },
    { q: "ripple-carry adder 가 비트 수가 늘수록 느려지는 까닭은?",
      opts: ["게이트가 많아져서", "carry 가 아래 자리에서 위 자리로 차례로 번져 가기 때문에",
             "clock 이 느려서", "XOR 가 AND 보다 느려서"], ans: 1 },
  ],

  /* ---------- ① 수업 전 ---------- */
  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드를 보고 개념을 확인하고, <b>waveform 을 미리 손으로 계산해</b> 적어 둡니다. " +
         "수업 중에 직접 돌려 맞춰 봅니다.",
    predict: {
      count: 2,
      fields: [
        { key: "s",     label: "합 s (4비트)",          len: 4, ph: "0000" },
        { key: "cout",  label: "carry cout",          len: 1, ph: "0" },
        { key: "chain", label: "사슬 c(4..0) (5비트)",   len: 5, ph: "00000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const pick = () => 1 + (nx() % 15);
        const mk = (cin) => { const a = pick(), b = pick(); return { a, b, cin,
          given: `a = ${bin(a,4)} (${a}),  b = ${bin(b,4)} (${b}),  cin = ${cin}` }; };
        const c1 = mk(0);
        let c2 = mk(1), guard = 0;
        while (c2.a === c1.a && c2.b === c1.b && guard++ < 8) c2 = mk(1);
        return [c1, c2];
      },
      model: (c) => ripple(c.a, c.b, c.cin),
    },
    reading: {
      question: "<code>c(0) &lt;= cin;</code> 한 줄을 지우면 무엇이 어떻게 달라집니까? " +
                "그리고 <code>cout =&gt; c(i+1)</code> 의 <code>i+1</code> 을 <code>i</code> 로 바꾸면 어떻게 됩니까?",
      ph: "예) c(0) 을 안 이으면 맨 아랫자리의 carry 입력이 정해지지 않아 …",
      askPh: "예) generate 안에서 i 가 어떻게 늘어나는지 잘 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "waveform 미리 그려 보기", pts: "10점", widget: "predict",
        blocks: [
          { t: "p", html: "아래 두 경우를 <b>손으로 계산해</b> 적으세요. 학번마다 값이 다릅니다. " +
                          "<b>정답은 지금 보여 주지 않습니다</b> — 수업 중에 직접 돌려 맞춰 봅니다." },
          { t: "note", html: "<b>어떻게 푸나.</b> full adder 네 개가 사슬로 이어져 있습니다. " +
            "맨 아랫자리부터 <code>cin</code> 을 받아 한 자리씩 더해 올라가면서, " +
            "각 자리의 합과 위로 넘기는 carry 를 적으면 됩니다. 종이에 자리별로 쓰는 편이 빠릅니다." },
        ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading",
        blocks: [
          { t: "p", html: "실습에서 쓸 <code>adder4.vhd</code> 의 이 줄을 보세요." },
          { t: "code", key: "read", name: "", text:
`  c(0) <= cin;

  g : for i in 0 to 3 generate
    fa : entity work.full_adder
      port map ( a => a(i), b => b(i), cin => c(i),
                 s => s(i), cout => c(i+1) );
  end generate;` },
        ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  /* ---------- ② 수업 중 ---------- */
  inc: {
    head: "따라 만들기 — 4비트 adder",
    sub: "코드를 직접 입력해 돌리고, <b>예습 때 적은 예측과 맞춰 봅니다.</b> " +
         "그다음 Quartus 로 synthesis 해 보드에 올립니다 — 보드는 실습실에만 있습니다.",
    quizPoints: 8,
    compare: { points: 8, whyPh: "예) carry 가 2번 자리에서 멈출 줄 알았는데, p 가 1 이라 위로 계속 넘어갔다." },
    practice: {
      file: "adder4.vhd",
      checkNote: "512가지 exhaustive test 로 맞게 입력했는지 확인합니다.",
      sigs: "a, b, cin, s, cout",
    
                localCmd: "ghdl -a --std=08 grader/w05/deps.vhd adder4.vhd grader/w05/tb_adder4_check.vhd && " +
                          "ghdl -r --std=08 tb_adder4_check --ieee-asserts=disable" },
    wave: {
      vcd: "vcd/w05.vcd", step: 20,
      sigs: [
        { path: "cin",   width: 1, label: "cin" },
        { path: "a",     width: 4, label: "a" },
        { path: "b",     width: 4, label: "b" },
        { path: "dut.c", width: 5, label: "c 사슬" },
        { path: "s",     width: 4, label: "s" },
        { path: "cout",  width: 1, label: "cout" },
      ],
    },
    quiz: [
      { type: "vector",  path: "s",     width: 4, label: "s",
        hint: "waveform 의 s 칸에 적힌 값을 그대로 옮겨 적습니다." },
      { type: "vector",  path: "dut.c", width: 5, label: "c (carry chain, 5비트)",
        hint: "c(0) 은 cin, c(4) 는 cout 입니다. 가운데 세 비트가 자리마다 넘어간 carry." },
      { type: "count",   path: "cout",  label: "cout",
        hint: "waveform 전체를 훑으며 cout 이 올라간 구간을 세어 보세요." },
      { type: "decimal", path: "s",     width: 4, label: "s", signed: false,
        hint: "adder 이므로 부호 없는 수로 읽습니다. 0 ~ 15." },
    ],
    hunt: {
      bugs: 3,
      hint: "컴파일부터 안 됩니다. 컴파일 오류를 고치면 다음 버그가 보이고, 그것을 고치면 또 하나가 보입니다.",
      code: "-- adder4.vhd : 4비트 ripple-carry adder (AI 가 쓴 코드)\nlibrary ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.std_logic_unsigned.all;\n\nentity adder4 is\n  port ( a, b : in  std_logic_vector(3 downto 0);\n         cin  : in  std_logic;\n         s    : out std_logic_vector(3 downto 0);\n         cout : out std_logic );\nend entity adder4;\n\narchitecture rtl of adder4 is\n  signal c : std_logic_vector(4 downto 0);     -- carry chain\nbegin\n\n  c(0) <= '0';                                 -- 첫 carry\n\n  g : for i in 0 to 3 generate\n    fa : entity work.full_adder\n      port map ( a => a(i), b => b(i), cin => c(i),\n                 s => s(i), cout => c(i+1) );\n  end generate;\n\n  cout <= c(3);\n\nend architecture rtl;\n",
    },
    design: {
      file: "addsub8.vhd",
      localCmd: "ghdl -a --std=08 addsub8.vhd grader/w05/tb_addsub8_check.vhd && " +
                "ghdl -r --std=08 tb_addsub8_check --ieee-asserts=disable --stop-time=300us",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity addsub8 is
  port ( a, b : in  std_logic_vector(7 downto 0);   -- 4비트에서 8비트로
         sub  : in  std_logic;
         r    : out std_logic_vector(7 downto 0);
         c    : out std_logic;
         v    : out std_logic );
end entity addsub8;

architecture rtl of addsub8 is
  signal bx   : std_logic_vector(7 downto 0);
  signal sum9 : unsigned(8 downto 0);               -- 한 비트 더 크게
begin

  -- ① sub 가 '1' 이면 b 의 여덟 비트를 모두 뒤집으시오.
  --    강의의 (3 downto 0 => sub) 를 폭에 맞게 고치면 된다.


  -- ② a, bx, sub 를 9비트로 더하시오. carry 가 9번째 비트에 남는다.


  -- ③ r, c, v 를 뽑으시오.
  --    v 의 비트 번호가 3 에서 몇으로 바뀌어야 하는지 생각할 것.


end architecture rtl;`,
    },
    quartus: {
      pins: 41, registers: 0, pinmap: PINMAP.lab04,
      regNote: "combinational circuit 이므로 0이 맞습니다",
    },
    board: {
      photoLabel: "보드 대표 사진 — HEX 표시와 SW 위치가 함께 보이게 두 장",
      fields: [
        { key: "dec", label: "HEX1 HEX0 (10진)", ph: "예: 12", dec: true },
        { key: "hex", label: "HEX3 (16진)", ph: "예: C" },
        { key: "c",   label: "C LED (LEDR0)", ph: "0 또는 1" },
        { key: "v",   label: "V LED (LEDR1)", ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (a, b, sub, label) => ({ a, b, sub, label: `${label} — a=${a}, b=${b}`,
          sw: `SW[3:0]=${bin(a,4)} · SW[7:4]=${bin(b,4)} · SW[9]=${sub}` });
        return [
          mk(4 + (u % 4), 4 + ((u >>> 5) % 4), 0, "덧셈"),
          mk(8 + ((u >>> 11) % 8), 1 + ((u >>> 17) % 7), 1, "뺄셈"),
        ];
      },
      expect(c) {
        const { a, b, sub } = c;
        const r = ((sub ? a - b : a + b) % 16 + 16) % 16;
        const cy = sub ? (a >= b ? 1 : 0) : (a + b > 15 ? 1 : 0);
        const sa = a > 7 ? a - 16 : a, sb = b > 7 ? b - 16 : b;
        const sr = sub ? sa - sb : sa + sb;
        const v = (sr > 7 || sr < -8) ? 1 : 0;
        const shown = sub ? r : (cy * 16 + r);
        return { dec: String(shown), hex: r.toString(16).toUpperCase(), c: String(cy), v: String(v) };
      },
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "오늘 강의에서 본 <code>full_adder</code> 네 개를 carry 로 잇습니다. " +
          "아랫자리의 <code>cout</code> 이 윗자리의 <code>cin</code> 으로 들어가는 것이 전부입니다. " +
          "이 사슬 때문에 \"ripple(물결) carry\" 라고 부릅니다. 네 벌을 손으로 쓰지 않고 " +
          "<code>for ... generate</code> 로 복사합니다." },
        { t: "fig", src: "figs/adder4_block.png", cap: "그림 1. 4비트 adder — 입출력 신호와 carry chain",
          alt: "4비트 ripple-carry adder block diagram. full_adder 네 개가 carry 로 연결되고 cin 이 최하위로 들어가며 최상위에서 cout 이 나온다." },
        { t: "table", cls: "tt", caption: "쓰이는 부품 <code>full_adder</code> 의 truth table 입니다. 오늘 강의에서 half adder 2개 + OR 1개로 만든 그것입니다.",
          head: ["cin", "a", "b", "cout", "s"],
          rows: [["0","0","0","0","0"],["0","0","1","0","1"],["0","1","0","0","1"],["0","1","1","1","0"],
                 ["1","0","0","0","1"],["1","0","1","1","0"],["1","1","0","1","0"],["1","1","1","1","1"]] },
        { t: "code", key: "lab", name: "adder4.vhd", tag: "전체 코드 — 그대로 입력해 보세요", ok: true, copy: true,
          text: `library ieee;
use ieee.std_logic_1164.all;

entity adder4 is
  port ( a, b : in  std_logic_vector(3 downto 0);
         cin  : in  std_logic;
         s    : out std_logic_vector(3 downto 0);
         cout : out std_logic );
end entity adder4;

architecture rtl of adder4 is
  signal c : std_logic_vector(4 downto 0);     -- carry chain
begin

  c(0) <= cin;

  g : for i in 0 to 3 generate
    fa : entity work.full_adder
      port map ( a => a(i), b => b(i), cin => c(i),
                 s => s(i), cout => c(i+1) );
  end generate;

  cout <= c(4);

end architecture rtl;` },
        { t: "note", html: "<b>두 가지를 눈여겨보세요.</b> 첫째, <code>component</code> 선언이 없습니다. " +
          "3주차부터 써 온 <code>entity work.이름</code> 직접 instance 화 그대로입니다. " +
          "둘째, <code>c</code> 는 출력 포트가 아닌데도 waveform 에 나옵니다 — 내부 신호도 시뮬레이터는 전부 볼 수 있고, " +
          "설계를 추적할 때 가장 먼저 보는 것이 이 내부 신호입니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "2점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 1단계의 <code>adder4.vhd</code> 를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "복사해 붙여도 돌아가지만, 타이핑하면서 <code>generate</code> 의 괄호와 <code>=&gt;</code> 방향에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다 — 이것이 실습을 실제로 했다는 증거입니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습 예측과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "GHDL simulation 결과입니다. waveform 을 <b>클릭하거나 드래그</b>해 커서를 옮기면 " +
          "그 시각의 값이 아래에 나옵니다. 좁은 화면에서는 옆으로 밀어 보세요." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>a=15, b=1</code> 인 구간에서 <code>c</code> 사슬이 " +
          "어떻게 변하는지 보세요. 맨 아랫자리의 carry 하나가 위로 네 칸 전부 번져 갑니다. " +
          "이것이 ripple carry 의 느린 이유입니다." },
      ] },
      { no: 4, title: "자가점검", pts: "8점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "AI 코드 감별 — 버그 찾기", pts: "6점", widget: "aiHunt", blocks: [{ t: "p", html: "방금 만든 회로를 AI 에게 같은 사양으로 시켰더니 아래 코드가 나왔습니다. 그럴듯해 보이지만 <b>버그가 있습니다</b>. AI 없이, 채점기와 waveform 과 과목 규약만으로 찾아 고치세요." }, { t: "note", html: "AI 가 자주 내는 실수를 알아보는 눈을 기르는 단계입니다. 고친 코드가 PASS 해야 하고, 찾은 버그마다 <b>어느 줄, 무엇이, 무엇으로 알았는지</b>를 적습니다." }] },
      { no: 6, title: "설계 사양 — 8비트로 넓히기", blocks: [
        { t: "p", html: "강의에서 만든 4비트 adder-subtractor 를 <b>8비트로</b> 넓힙니다. " +
          "회로의 생각은 그대로이고 <b>폭만</b> 바뀌는데, 폭이 바뀌면서 " +
          "<b>같이 따라가야 하는 곳</b>이 몇 군데 있습니다. 거기를 찾는 것이 이 과제입니다." },
        { t: "table", caption: "4비트에서 8비트로 — 따라가야 하는 곳",
          head: ["", "4비트 (강의)", "8비트 (과제)"],
          rows: [["a, b, r", "<code>(3 downto 0)</code>", "<code>(7 downto 0)</code>"],
                 ["내부 합", "<code>unsigned(4 downto 0)</code>", "<code>unsigned(8 downto 0)</code>"],
                 ["b 뒤집기", "<code>(3 downto 0 =&gt; sub)</code>", "<code>(7 downto 0 =&gt; sub)</code>"],
                 ["carry c", "<code>sum5(4)</code>", "<code>sum9(8)</code>"],
                 ["overflow v", "<code>a(3)</code>, <code>sum5(3)</code>", "<code>a(7)</code>, <code>sum9(7)</code>"]],
          hl: [[4,2]] },
        { t: "table", cls: "tt", caption: "반드시 맞아야 하는 경계 — 손으로 먼저 확인해 보세요",
          head: ["sub","a","b","r","c","v","설명"],
          rows: [["0","0111 1111 (127)","0000 0001 (1)","1000 0000","0","<b>1</b>","부호 있는 수의 최대에서 overflow"],
                 ["0","1111 1111 (255)","0000 0001 (1)","0000 0000","<b>1</b>","0","부호 없는 수의 carry"],
                 ["1","1000 0000 (−128)","0000 0001 (1)","0111 1111","1","<b>1</b>","부호 있는 수의 최소에서 overflow"],
                 ["1","0000 0001 (1)","0000 0010 (2)","1111 1111","<b>0</b>","0","빌림 발생"]],
          hl: [[0,5],[1,4],[2,5],[3,4]] },
        { t: "note", html: "<b>과제의 두 번째 질문.</b> 4비트일 때는 512가지가 전수였습니다. " +
          "8비트는 몇 가지입니까? 그리고 <b>그 전부를 돌리는 것이 맞습니까?</b> " +
          "돌리지 않아도 된다면 <b>어떤 입력들만</b> 골라야 충분한지, " +
          "그 근거를 수업 후 토의 칸에 적으세요. 채점기는 전수로 돕니다." },
      ] },
      { no: 7, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② ③ 을 채우고 <b>GHDL 로 실행</b>을 누르면 " +
          "<b>131,072가지</b>(256 × 256 × 2) exhaustive test 결과가 돌아옵니다. " +
          "강의의 네 줄을 폭만 고쳐 옮기면 되는데, <b>v 의 비트 번호</b>를 안 고치고 그냥 두면 " +
          "덧셈은 맞고 overflow 만 틀리는 결과가 나옵니다." },
      ] },
      { no: 8, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "설계가 simulation 을 통과했으면 Quartus 에서 synthesis 하고 핀을 배정합니다. " +
          "Lab 4 는 SW 10 + LEDR 3 + HEX0~3 (28) = <b>41핀</b> 입니다." },
      ] },
      { no: 9, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "보드에 올리고 <b>본인 학번으로 지정된 두 조합</b>을 맞춘 뒤, HEX 에 보이는 값과 " +
          "LED 상태를 적고 사진을 찍으세요. 조합은 학생마다 다릅니다." },
      ] },
      { no: 10, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다 — " +
          "실행 로그 · 예측 대조표 · waveform · 컴파일 결과 · 보드 사진이 한 장에 들어갑니다." },
      ] },
    ],
  },

  /* ---------- ③ 수업 후 ---------- */
  post: {
    head: "정리 — 폭이 바뀌면 무엇이 따라가나",
    sub: "8비트 판을 synthesis 결과와 waveform 으로 들여다보고, c 와 v 가 왜 다른지 설명한 뒤 " +
         "\"몇 가지를 검사해야 충분한가\" 에 답합니다.",
    rtl: { after: "그림 2 와 다른 곳이 있으면 어디가 왜 다른지 아래 동작 설명에 함께 적으세요." },
    explain: {
      ph: "예) a=0111, b=1001, sub='1' 인 경우를 돌려 보았다. 부호 없는 수로 보면 7−9 이므로 빌림이 생겨 c=0 이지만 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>a, b, sub, r, c, v</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "carry/빌림", words: ["carry", "carry", "carry", "빌림", "borrow"] },
        { label: "2's complement",      words: ["2의보수", "2's complement", "보수", "complement"] },
        { label: "부호 범위",     words: ["부호", "범위", "−8", "-8", "+7", "7까지"] },
        { label: "overflow",    words: ["overflow", "overflow", "overflow", "ovf"] },
        { label: "근거 시각",     words: ["ns"] },
      ],
      model: "<span class='mono'>a=0111(7), b=1001(9), sub='1'</span> 인 경우를 보자. " +
        "부호 없는 수로 보면 7 − 9 이므로 빌림이 발생해 <span class='mono'>c=0</span> 이 된다. " +
        "그런데 부호 있는 수로 읽으면 b=1001 은 −7 이므로 이 연산은 7 − (−7) = 14 가 되어 " +
        "4비트 표현 범위 −8~+7 을 벗어난다. 그래서 <span class='mono'>v=1</span> 이다. " +
        "같은 비트 패턴이라도 부호 없는 수로 보느냐 부호 있는 수로 보느냐에 따라 \"넘쳤다\"의 의미가 달라지며, " +
        "c 와 v 가 그 두 관점을 각각 담당한다. 회로에서 v 는 <span class='mono'>cc(4) xor cc(3)</span>, " +
        "즉 최상위 비트로 들어온 carry 와 나간 carry 가 다를 때 1 이 된다.",
      rubric: [
        "구간을 하나 특정하고 그 시각의 a, b, sub 값을 적었다",
        "cout 이 그 값이 되는 이유를 부호 없는 수 관점에서 설명했다",
        "ovf 가 그 값이 되는 이유를 부호 있는 수 관점에서 설명했다",
        "cout 과 ovf 가 왜 서로 다른지 한 문장으로 정리했다",
      ],
    },
    discuss: { ph: "8비트 전수는 131,072가지인데 …" },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → RTL Viewer</b> 를 열면 synthesis 기가 " +
          "내 코드를 어떤 회로로 읽었는지 보입니다. full adder 4개가 사슬로 이어지고 XOR 가 b 쪽에 붙은 모습이 " +
          "<b>그림 2</b> 와 같은지 견주어 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 회로를 ModelSim 또는 GHDL 로 돌리고, " +
          "<b>c 와 v 가 서로 다르게 동작하는 구간</b>을 하나 골라 왜 그런지 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "8비트 전수는 <b>131,072가지</b>입니다. 64비트라면 돌릴 수 없는 수가 됩니다. " +
          "<b>전부 돌리지 않고도 충분하다고 말하려면 어떤 입력들을 골라야 합니까?</b> " +
          "고른 근거를 적으세요. 그리고 비트 수가 늘어날 때 ripple carry 사슬이 " +
          "어떤 문제를 일으키는지도 함께 적어 보세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다 — <b>실습 실행 · 코드 · simulation 결과 · waveform · " +
          "RTL View · 컴파일 결과 · pin assignment · 보드 사진 · 설명 · 토의</b>. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
