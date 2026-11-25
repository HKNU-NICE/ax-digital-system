/* ══════════════════════════════════════════════════════════════
   Week 07 — counter 와 버튼 : 1초를 만드는 법   (Lab 6)
   실습 counter4 (전체 코드 제공) · 과제 counter4_down — 다운 counter (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

const HEXCH = "0123456789ABCDEF";

export const W = {
  id: "w07", no: 7, lab: "lab06", labTitle: "counter 와 버튼",
  topic: "counter 와 버튼",
  h1: "50 MHz 로 1초를 세는 법",
  lead: "clock 을 느리게 만드는 것이 아니라, 빠른 clock 을 그대로 쓰면서 <b>셀 때만 en 을 올립니다</b>. " +
        "<b>수업 전</b>에 counter 값을 미리 적어 두고, <b>수업 중</b>에 직접 돌려 맞춘 뒤 보드에서 버튼으로 세어 보고, " +
        "<b>수업 후</b>에 모듈러스를 generic 으로 받는 counter 를 설계합니다.",
  chips: ["되먹임", "clock enable", "generic", "debounce"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w07", count: 42, pad: 2, per: 8, title: "W07 counter 와 버튼", narration: "w07" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w07.vcd</span>)를 그대로 읽어 그린 것입니다. " +
            "한 구간(20 ns)이 한 clock 입니다.",

  concepts: [
    { q: "50 MHz 에서 1초에 한 번 세려면 어떻게 합니까?",
      opts: ["clock 을 5천만으로 나눈 새 clock 을 만들어 쓴다",
             "5천만 clock 을 세고 그때 한 clock 폭의 en pulse 를 올린다",
             "counter 를 5천만까지 센다",
             "process 안에서 wait 를 쓴다"], ans: 1 },
    { q: "파생 clock(나눈 clock)을 만들면 안 되는 까닭에 가장 가까운 것은?",
      opts: ["문법 오류가 나서",
             "clock 이 여러 개가 되어 timing 분석이 어려워지고 설계가 불안정해져서",
             "느려져서",
             "FPGA 가 clock 을 하나만 받을 수 있어서"], ans: 1 },
    { q: "<code>max &lt;= '1' when cnt = 15 else '0';</code> 이 줄이 만드는 것은?",
      opts: ["flip-flop 하나", "combinational circuit — register 가 아니다",
             "새 clock", "counter 의 reset"], ans: 1 },
    { q: "버튼을 debounce 하지 않고 바로 counter 의 en 에 넣으면?",
      opts: ["아무 문제 없다",
             "한 번 눌렀는데 여러 번 세어진다",
             "counter 가 멈춘다",
             "눌러도 반응하지 않는다"], ans: 1 },
    { q: "counter 가 <code>cnt &lt;= cnt + 1;</code> 로 자기 값을 읽을 수 있으려면?",
      opts: ["out 포트를 그대로 읽으면 된다",
             "내부 signal 을 두고 마지막에 출력 포트로 내보낸다",
             "buffer 포트를 쓴다 (이 과목의 방식)",
             "variable 을 쓴다"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 되먹임과 clock enable 을 확인하고, <b>counter 값을 미리 세어</b> 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "q",   label: "q (4비트)",            len: 4, ph: "0000" },
        { key: "max", label: "그때의 max",            len: 1, ph: "0" },
        { key: "qn",  label: "한 clock 더 가면 q",      len: 4, ph: "0000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (lo, hi) => {
          const k = lo + (nx() % (hi - lo + 1));
          return { k, given: `reset 을 푼 뒤 en = 1 로 ${k} clock 을 보냈을 때` };
        };
        return [mk(10, 16), mk(17, 34)];
      },
      model: (c) => ({ q: bin(c.k % 16, 4), max: (c.k % 16) === 15 ? "1" : "0",
                       qn: bin((c.k + 1) % 16, 4) }),
    },
    reading: {
      question: "<code>cnt</code> 는 내부 signal 이고 <code>q</code> 는 출력 포트입니다. " +
                "왜 <code>q &lt;= q + 1;</code> 이라고 쓰지 못합니까? " +
                "그리고 <code>max</code> 는 왜 process 안이 아니라 <b>밖</b>에 쓰여 있습니까?",
      ph: "예) out 포트는 읽을 수 없으므로 …",
      askPh: "예) 15 다음에 왜 자동으로 0 이 되는지 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "counter 값 미리 세어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "0 에서 시작해 <code>en=1</code> 로 몇 clock 을 보냈을 때의 값을 적으세요. " +
          "학번마다 clock 수가 다르고, <b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w07-counter.png", cap: "그림 1. counter = register + 되먹임 +1",
          alt: "cnt register 의 출력이 위쪽 통로로 되돌아와 +1 블록을 지나 다시 register 로 들어가고, 아래쪽에서 = 15 ? 비교기가 max 를 만드는 block diagram." },
        { t: "note", html: "<b>어떻게 푸나.</b> 4비트이므로 15 다음은 0 입니다 — 16 으로 나눈 나머지라고 보면 됩니다. " +
          "<code>max</code> 는 값이 15 <b>일 때만</b> 1 입니다. 더하는 순간이 아니라 " +
          "<b>그 시각의 값</b>을 보고 정해진다는 점에 주의하세요." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>counter4.vhd</code> 의 architecture 입니다." },
        { t: "code", key: "read", name: "", text:
`architecture rtl of counter4 is
  signal cnt : unsigned(3 downto 0) := (others => '0');
begin
  process (clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        cnt <= (others => '0');
      elsif en = '1' then
        cnt <= cnt + 1;
      end if;
    end if;
  end process;

  q   <= std_logic_vector(cnt);
  max <= '1' when cnt = 15 else '0';
end architecture rtl;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 4비트 업 counter",
    sub: "register 에 되먹임 하나를 붙이면 counter 가 됩니다. 직접 입력해 돌리고, 보드에서 1초 counter 와 버튼 counter 를 나란히 봅니다.",
    quizPoints: 8,
    compare: { points: 8, whyPh: "예) 15 에서 멈출 줄 알았는데 0 으로 돌아갔다." },
    practice: { file: "counter4.vhd", checkNote: "무작위 120clock 으로 세기·멈춤·되돌아감과 max 를 확인합니다.",
                sigs: "clk, reset, en, q, max", 
                localCmd: "ghdl -a --std=08 counter4.vhd grader/w07/tb_counter4_check.vhd && " +
                          "ghdl -r --std=08 tb_counter4_check --ieee-asserts=disable --stop-time=20us" },
    wave: {
      vcd: "vcd/w07.vcd", step: 20,
      sigs: [
        { path: "clk",   width: 1, label: "clk" },
        { path: "reset", width: 1, label: "reset" },
        { path: "en",    width: 1, label: "en" },
        { path: "q",     width: 4, label: "q" },
        { path: "max",   width: 1, label: "max" },
      ],
    },
    quiz: [
      { type: "vector",  path: "q", width: 4, label: "q",
        hint: "그 시각의 q 를 2진 4비트로 적습니다." },
      { type: "decimal", path: "q", width: 4, label: "q", signed: false,
        hint: "부호 없는 수로 읽습니다. 0 ~ 15." },
      { type: "count",   path: "max", label: "max",
        hint: "q 가 15 인 구간이 몇 개인지 세는 것과 같습니다." },
      { type: "count",   path: "en",  label: "en",
        hint: "en 이 0 인 구간에서는 q 가 멈춰 있습니다." },
    ],
    hunt: {
      bugs: 2,
      hint: "채점기 MISMATCH 의 step 번호를 waveform 에서 찾아가, 그 clock 에서 무슨 일이 있었는지 보세요.",
      code: "-- counter4.vhd : 4비트 업 counter + max 출력 (AI 가 쓴 코드)\nlibrary ieee;\nuse ieee.std_logic_1164.all;\nuse ieee.numeric_std.all;\n\nentity counter4 is\n  port (clk, reset, en : in std_logic;\n        q   : out std_logic_vector(3 downto 0);\n        max : out std_logic);\nend entity counter4;\n\narchitecture rtl of counter4 is\n  signal cnt : unsigned(3 downto 0) := (others => '0');\nbegin\n  process (clk)\n  begin\n    if rising_edge(clk) then\n      if en = '1' then\n        if reset = '1' then\n          cnt <= (others => '0');\n        else\n          cnt <= cnt + 1;\n        end if;\n      end if;\n      if cnt = 15 then                           -- 15 일 때 max\n        max <= '1';\n      else\n        max <= '0';\n      end if;\n    end if;\n  end process;\n\n  q <= std_logic_vector(cnt);\nend architecture rtl;\n",
    },
    design: {
      file: "counter4_down.vhd",
      localCmd: "ghdl -a --std=08 counter4_down.vhd grader/w07/tb_counter4_down_check.vhd && " +
                "ghdl -r --std=08 tb_counter4_down_check --ieee-asserts=disable --stop-time=20us",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter4_down is
  port (clk, reset, en : in  std_logic;
        q   : out std_logic_vector(3 downto 0);
        min : out std_logic);                 -- cnt = 0 일 때 1
end entity counter4_down;

architecture rtl of counter4_down is
  signal cnt : unsigned(3 downto 0) := (others => '0');
begin
  process (clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        cnt <= (others => '0');
      elsif en = '1' then

        -- ① 1 을 더하는 대신 1 을 빼시오. 0 에서 한 번 더 빼면
        --    0000 - 1 = 1111 이 되어 저절로 15 로 돌아간다.

      end if;
    end if;
  end process;

  q <= std_logic_vector(cnt);

  -- ② min 을 쓰시오. 실습의 max 와 견주어 비교 대상만 바뀐다.
  --    process 밖에 쓰는 조합 출력이다.

end architecture rtl;`,
    },
    quartus: { pins: 42, registers: 16, pinmap: PINMAP.lab06,
               regNote: "counter 네 개(4비트씩)만 세어도 16개이고, tick_gen 과 debounce 가 더해져 이보다 많습니다" },
    board: {
      photoLabel: "보드 대표 사진 — HEX3 HEX2 (버튼 counter) 와 HEX1 HEX0 (1초 counter) 이 함께 보이게 두 장",
      fields: [
        { key: "h3", label: "HEX3 (16진 한 글자)", ph: "예: 1" },
        { key: "h2", label: "HEX2 (16진 한 글자)", ph: "예: 3" },
        { key: "l9", label: "LEDR[9]",            ph: "0 또는 1" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (n, run, label) => ({ n, run,
          label: `${label} — KEY[1] 을 ${n} 번`,
          sw: `KEY[0] 으로 reset 한 뒤 SW[0]=${run} 로 두고 KEY[1] 을 ${n} 번 누른다` });
        return [mk(17 + (u % 14), 0, "첫째"), mk(33 + ((u >>> 9) % 14), 1, "둘째")];
      },
      expect: (c) => ({ h3: HEXCH[(c.n >> 4) & 0xf], h2: HEXCH[c.n & 0xf], l9: String(c.run) }),
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "counter 는 새 부품이 아닙니다. 지난주 register 에 <b>되먹임</b> 하나를 붙인 것입니다 — " +
          "자기 값을 다시 읽어 1 을 더해 넣습니다. " +
          "4비트이므로 15 다음은 자연스럽게 0 이 됩니다(올림이 버려집니다)." },
        { t: "fig", src: "figs/w07-counter.png", cap: "그림 1. counter = register + 되먹임 +1",
          alt: "cnt register 의 출력이 위쪽 통로로 되돌아와 +1 블록을 지나 다시 register 로 들어가고, 아래쪽에서 = 15 ? 비교기가 max 를 만드는 block diagram." },
        { t: "table", cls: "tt", caption: "되돌아가는 자리", head: ["지금 q", "en", "edge 뒤의 q", "max"],
          rows: [["1110 (14)", "1", "1111 (15)", "0 → 1 로 바뀐다"],
                 ["1111 (15)", "1", "0000 (0)", "1 → 0"],
                 ["1111 (15)", "0", "1111 (15)", "1 그대로"]],
          hl: [[1,2]] },
        { t: "code", key: "lab", name: "counter4.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter4 is
  port (clk, reset, en : in std_logic;
        q   : out std_logic_vector(3 downto 0);
        max : out std_logic);
end entity counter4;

architecture rtl of counter4 is
  signal cnt : unsigned(3 downto 0) := (others => '0');
begin
  process (clk)
  begin
    if rising_edge(clk) then
      if reset = '1' then
        cnt <= (others => '0');
      elsif en = '1' then
        cnt <= cnt + 1;                          -- 1111 + 1 = 0000
      end if;
    end if;
  end process;

  q   <= std_logic_vector(cnt);
  max <= '1' when cnt = 15 else '0';             -- 조합 출력 : register 아님
end architecture rtl;` },
        { t: "note", html: "<b>세 줄에 세 가지가 들어 있습니다.</b> " +
          "<code>numeric_std</code> 를 쓰고 내부는 <code>unsigned</code> 로 둡니다 — 더하기를 하려면 필요합니다. " +
          "<code>cnt</code> 를 따로 둔 것은 <b>출력 포트는 읽을 수 없기</b> 때문입니다. " +
          "그리고 <code>max</code> 는 process 밖에 있으므로 register 가 아니라 조합 출력입니다 — " +
          "다음 자리의 <code>en</code> 으로 그대로 쓸 수 있습니다." },
        { t: "fig", src: "figs/w07-tick.png", cap: "그림 2. 1초는 분주가 아니라 \"한 clock 폭 enable\" 로 만든다",
          alt: "CLOCK_50 이 tick_gen 으로 들어가 tick 이 나오고, run 과 AND 를 거쳐 counter4 의 en 으로 들어가는 block diagram. 아래에 50 MHz clock 과 한 clock 폭의 tick pulse 를 그린 timing 도." },
        { t: "note", html: "<b>clock 은 하나만 씁니다.</b> 느리게 세고 싶다고 clock 을 나눠 새 clock 을 만들면 " +
          "설계 안에 clock 이 여러 개가 되어 timing 분석이 어려워집니다. " +
          "대신 50 MHz 를 그대로 쓰면서 <b>셀 때만 en 을 한 clock 올립니다</b>. " +
          "<code>tick_gen</code> 이 하는 일이 그것이고, 이 방식이 앞으로 계속 나옵니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "2점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "<code>unsigned</code> 와 <code>std_logic_vector</code> 를 오가는 변환 " +
          "(<code>std_logic_vector(cnt)</code>) 에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "한 구간(20 ns)이 한 clock 입니다. en 을 중간에 내린 구간과 " +
          "15 에서 0 으로 되돌아가는 구간이 모두 들어 있습니다." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>max</code> 가 1 인 구간은 딱 한 clock 입니다 — " +
          "q 가 15 인 동안만입니다. 이 한 clock 짜리 신호를 다음 자리 counter 의 en 으로 넣으면 " +
          "<b>두 자리 counter</b>가 됩니다. 보드의 HEX1 HEX0 이 그렇게 만들어져 있습니다." },
      ] },
      { no: 4, title: "자가점검", pts: "8점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "AI 코드 감별 — 버그 찾기", pts: "6점", widget: "aiHunt", blocks: [{ t: "p", html: "방금 만든 회로를 AI 에게 같은 사양으로 시켰더니 아래 코드가 나왔습니다. 그럴듯해 보이지만 <b>버그가 있습니다</b>. AI 없이, 채점기와 waveform 과 과목 규약만으로 찾아 고치세요." }, { t: "note", html: "AI 가 자주 내는 실수를 알아보는 눈을 기르는 단계입니다. 고친 코드가 PASS 해야 하고, 찾은 버그마다 <b>어느 줄, 무엇이, 무엇으로 알았는지</b>를 적습니다." }] },
      { no: 6, title: "설계 사양 — 거꾸로 세는 counter", blocks: [
        { t: "p", html: "실습의 <code>counter4</code> 는 0 → 15 로 올라가며 15 에서 <code>max=1</code> 을 냅니다. " +
          "이번 과제는 <b>거꾸로</b> 세는 <code>counter4_down</code> 입니다 — " +
          "15 → 0 으로 내려가며 <b>0 에서 <code>min=1</code></b> 을 냅니다. " +
          "실습 코드에서 <b>바뀌는 곳은 두 군데</b>뿐입니다." },
        { t: "table", caption: "포트", head: ["이름","종류","뜻"],
          rows: [["clk, reset, en","in","실습의 counter4 와 같다"],
                 ["q","out","<code>std_logic_vector(3 downto 0)</code>"],
                 ["min","out","cnt 가 0 일 때 1 — 다음 단으로 넘기는 <b>빌림</b>"]] },
        { t: "table", cls: "tt", caption: "en='1' 일 때",
          head: ["지금 q","edge 뒤의 q","지금 min"],
          rows: [["0010","0001","0"], ["0001","0000","0"],
                 ["0000","<b>1111</b>","<b>1</b>"], ["1111","1110","0"]],
          hl: [[2,1],[2,2]] },
        { t: "note", html: "<b>0 에서 1 을 빼면 15 가 됩니다.</b> <code>unsigned</code> 의 덧셈·뺄셈은 " +
          "폭이 넘치면 그냥 잘려 나가므로, <code>if cnt = 0 then cnt &lt;= \"1111\"</code> 같은 " +
          "특별 처리를 <b>따로 쓰지 않아도</b> 저절로 돌아갑니다. " +
          "올림 counter 에서 15 다음이 0 이 되던 것과 똑같은 일입니다." },
        { t: "note", html: "<b>min 은 조합 출력입니다.</b> <code>max</code> 와 마찬가지로 " +
          "process 밖에 쓰며, 비교 대상만 15 에서 0 으로 바뀝니다. " +
          "process 안에 넣어 register 로 만들면 한 clock 늦게 나와 다음 단이 틀린 시각에 움직입니다." },
        { t: "note", html: "<b>이것이 왜 쓸모가 있나.</b> 내려 세는 counter 는 " +
          "\"몇 개 남았는가\" 를 그대로 보여 주므로 timer·대기열에 쓰이고, " +
          "<code>min</code> 은 뺄셈 회로의 <b>빌림(borrow)</b> 과 같은 자리를 맡습니다." },
      ] },
      { no: 7, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ② 를 채우고 <b>GHDL 로 실행</b>을 누르면 채점기가 reset·정지·" +
          "<b>0 에서 15 로 넘어가는 자리</b>를 포함한 120 clock 을 한 단계씩 맞춰 봅니다. " +
          "실습의 올림 counter 를 그대로 내면 첫 몇 단계에서 바로 걸립니다." },
      ] },
      { no: 8, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 6 TOP 은 CLOCK_50 · KEY 2 · SW 1 · LEDR 10 · HEX0~3 (28) = <b>42핀</b> 입니다. " +
          "Total registers 가 꽤 큽니다 — counter 네 개에 tick_gen 의 큰 counter 와 debounce 가 더해지기 때문입니다." },
      ] },
      { no: 9, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "KEY[0] 으로 reset 한 뒤 <b>본인 학번으로 지정된 횟수</b>만큼 KEY[1] 을 누르고 " +
          "HEX3 HEX2 를 읽어 적으세요. 16 번째에서 아랫자리가 한 바퀴를 돌아 윗자리가 올라가는 것을 " +
          "직접 보게 됩니다. <b>한 번 눌렀는데 두 번 세어진다면</b> debounce 가 동작하지 않는 것입니다." },
      ] },
      { no: 10, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 거꾸로 세는 회로",
    sub: "synthesis 결과를 확인하고, 0 에서 15 로 되돌아가는 자리를 설명한 뒤 토의에 답합니다.",
    rtl: { after: "RTL Viewer 에서 되먹임 고리와 비교기가 보입니다. " +
                  "올림 counter 의 덧셈기가 <b>뺄셈기</b>로 바뀌었는지, " +
                  "비교기의 상대가 15 가 아니라 0 인지도 확인해 보세요." },
    explain: {
      ph: "예) 1,230 ns 구간에서 q 가 0000 이고 min 이 1 이었다. 다음 rising edge 에서 q 는 1111 이 되었는데, 이는 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>clk, en, q, min</span> 이 모두 나와야 합니다",
      concepts: [
        { label: "되돌아감",   words: ["1111", "15", "되돌", "돌아", "래핑", "wrap"] },
        { label: "자리 overflow",  words: ["overflow", "overflow", "언더플로", "잘려", "자리"] },
        { label: "조합 출력",  words: ["조합", "register 가아니", "register 가 아니"] },
        { label: "en 과 정지", words: ["en"] },
        { label: "근거 시각",  words: ["ns"] },
      ],
      model: "q 가 <span class='mono'>0000</span> 인 구간을 보자. 그 구간에서 " +
        "<span class='mono'>min=1</span> 이고, en 이 1 인 다음 rising edge 에서 q 는 " +
        "<span class='mono'>1111</span> 이 된다. 코드에 \"0 이면 15 로\" 라는 문장이 " +
        "<b>없는데도</b> 그렇게 되는 까닭은, 4비트 <span class='mono'>unsigned</span> 에서 " +
        "0 - 1 의 참값 -1 을 네 비트에 담을 수 없어 <b>넘치는 자리가 잘려 나가고</b> " +
        "1111 만 남기 때문이다. 올림 counter 에서 1111 + 1 이 0000 이 되던 것과 같은 일이다. " +
        "min 은 process 밖에 쓴 조합 출력이므로 q 가 0 이 되는 것과 <b>같은 구간</b>에 1 이 된다 — " +
        "process 안에 넣었다면 한 clock 늦게 나왔을 것이다. " +
        "en 이 0 인 구간에서는 edge 가 와도 q 가 그대로인 것도 waveform 에서 확인할 수 있다.",
      rubric: [
        "구간을 하나 특정하고 그 시각의 q 와 min 을 적었다",
        "0 다음이 15 가 되는 까닭을 네 비트에 담기지 않아서라고 설명했다",
        "min 이 조합 출력이라는 점과 그 이유를 적었다",
        "en 이 0 인 구간에서 q 가 멈춰 있는 것을 확인했다",
      ],
    },
    discuss: { ph: "1초를 만드는 N 을 바꾸면 …" },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → RTL Viewer</b> 를 열어 " +
          "되먹임 고리와 비교기를 찾아보세요. <b>그림 1</b> 과 견주어 봅니다." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "13점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 <code>counter4_down</code> 를 돌리고, " +
          "<b>0 다음이 왜 15 가 되는지</b> 구간 하나를 골라 설명하시오." },
      ] },
      { no: 3, title: "토의", pts: "12점", widget: "discuss", blocks: [
        { t: "p", html: "<code>tick_gen</code> 의 <code>N</code> 을 simulation 에서는 작게, 보드에서는 5천만으로 " +
          "두는 까닭은 무엇입니까? generic 이 없었다면 어떻게 해야 했을지 적어 보세요. " +
          "그리고 1 Hz 가 아니라 <b>0.5초마다</b> 세게 하려면 N 을 얼마로 해야 합니까?" },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
