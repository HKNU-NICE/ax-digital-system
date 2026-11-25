/* ══════════════════════════════════════════════════════════════
   Week 12 — datapath 와 메모리   (Lab 10)
   실습 reg_file + ram_sp (둘 다 전체 코드 제공) · 과제 프로젝트 block diagram 초안 (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

export const W = {
  id: "w12", no: 12, lab: "lab10", labTitle: "register file 과 메모리",
  topic: "datapath 와 메모리",
  h1: "제어와 데이터를 나눈다",
  lead: "최종 프로젝트의 <b>datapath 를 미리 만들어</b> 봅니다. " +
        "<b>수업 전</b>에 register file 을 손으로 따라가 보고, <b>수업 중</b>에 직접 돌려 맞춘 뒤 보드에 올리고, " +
        "<b>수업 후</b>에 팀 프로젝트 block diagram 초안을 그립니다.",
  chips: ["register file", "동기 쓰기 · 조합 읽기", "블록 RAM", "read-old-data"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w12", count: 35, pad: 2, per: 8, title: "W12 datapath 와 메모리", narration: "w12" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w12.vcd</span>)를 그대로 읽어 그린 것입니다. " +
            "한 구간(20 ns)이 한 clock 입니다.",

  // 수업 후 묶음이 업로드·서술형이므로 체크리스트를 직접 지정한다
  ready: {
    pre: [
      { label: "개념 확인 채점", ok: (t, f, S) => S.cGraded },
      { label: "waveform 예측 모두 입력", ok: (t, f, S, H) => H.predictFilled() },
      { label: "코드 읽기 답 (20자 이상)", ok: (t, f, S, H) => H.dom("pre-read").length >= 20 },
    ],
    in: [
      { label: "reg_file.vhd 직접 입력해 실행 (PASS)", ok: (t, f, S) => S.pRun === "pass" },
      { label: "예측 대조", ok: (t, f, S) => !!S.cmp },
      { label: "자가점검 채점", ok: (t, f, S) => S.graded },
      { label: "실습 waveform 캡처", ok: (t, f, S) => !!S.practiceFile },
      { label: "ram_sp.vhd 직접 입력해 실행 (PASS)", ok: (t, f, S) => S.lastRun === "pass" },
      { label: ".qsf pin assignment", ok: (t, f, S) => S.qsfOk },
      { label: "컴파일 결과 캡처", ok: (t, f, S) => !!S.capFile },
      { label: "보드 사진", ok: (t, f, S) => S.boardFiles.length > 0 },
    ],
    post: [
      { label: "block diagram 초안 올리기", ok: (t, f) => f("bd") },
      { label: "블록 설명 (80자 이상)", ok: (t) => t("bdwhy").length >= 80 },
      { label: "토의 (20자 이상)", ok: (t, f, S, H) => H.dom("discuss").length >= 20 },
    ],
  },

  concepts: [
    { q: "datapath 와 제어부를 나누는 까닭으로 가장 알맞은 것은?",
      opts: ["코드가 짧아져서",
             "데이터가 흐르는 길과 \"언제 무엇을 할지\" 를 따로 설계·검증할 수 있어서",
             "synthesis 가 빨라져서",
             "핀이 줄어서"], ans: 1 },
    { q: "register file 의 <b>읽기</b>가 조합(비동기)이면 무엇이 좋습니까?",
      opts: ["주소를 준 그 clock 에 값이 나와 바로 ALU 로 보낼 수 있다",
             "전력이 적게 든다",
             "면적이 작다",
             "clock 이 빨라진다"], ans: 0 },
    { q: "블록 RAM 의 읽기가 <b>동기</b>라는 말의 뜻은?",
      opts: ["주소를 준 그 clock 에 값이 나온다",
             "주소를 준 다음 clock 에 값이 나온다",
             "쓰기와 읽기를 같이 못 한다",
             "clock 이 두 개 필요하다"], ans: 1 },
    { q: "같은 주소에 쓰면서 동시에 읽으면 <code>ram_sp</code> 는 무엇을 내보냅니까?",
      opts: ["새로 쓴 값", "쓰기 전의 옛 값 (read-old-data)",
             "둘의 중간값", "정해지지 않는다"], ans: 1 },
    { q: "<code>reg_file</code> 에서 읽기 포트가 두 개인 까닭은?",
      opts: ["속도를 높이려고",
             "ALU 가 한 번에 피연산자 두 개를 받아야 하므로",
             "쓰기와 짝을 맞추려고",
             "주소를 두 벌 쓰려고"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 datapath 의 구조를 확인하고, <b>register file 을 손으로 따라가</b> 봅니다.",
    predict: {
      count: 2,
      fields: [
        { key: "r1",  label: "rdata1 (4비트)",               len: 4, ph: "0000" },
        { key: "r2",  label: "rdata2 (4비트)",               len: 4, ph: "0000" },
        { key: "nowe", label: "we=0 으로 둔 채 wdata 만 바꾸면 rdata1", len: 4, ph: "0000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = () => {
          const v = [nx() % 16, nx() % 16, nx() % 16, nx() % 16];
          const a = nx() % 4;
          let b = nx() % 4;
          if (b === a) b = (b + 1) % 4;
          return { v, a, b,
            given: `R0..R3 에 차례로 ${v.map((k) => bin(k, 4)).join(", ")} 를 쓴 뒤  ` +
                   `raddr1 = ${bin(a, 2)}, raddr2 = ${bin(b, 2)}` };
        };
        return [mk(), mk()];
      },
      model: (c) => ({ r1: bin(c.v[c.a], 4), r2: bin(c.v[c.b], 4), nowe: bin(c.v[c.a], 4) }),
    },
    reading: {
      question: "쓰기는 <code>process (clk)</code> 안에 있고 읽기는 밖에 있습니다. " +
                "읽기까지 process 안으로 넣으면 회로가 어떻게 달라집니까? " +
                "그러면 ALU 로 값을 보내는 데 무엇이 문제가 됩니까?",
      ph: "예) 읽기가 register 가 되면 주소를 준 다음 clock 에야 값이 나오므로 …",
      askPh: "예) 조합 읽기가 synthesis 되면 실제로 어떤 회로가 되는지 모르겠습니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "register file 손으로 따라가 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "네 칸에 차례로 값을 쓴 뒤 두 주소를 읽습니다. 학번마다 값이 다르고, " +
          "<b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w12-datapath.png", cap: "그림 1. 제어부와 datapath 를 나눈다",
          alt: "reg_file 에서 op1, op2 가 ALU 로 들어가고 결과가 표시 장치로 가며 위쪽 통로로 다시 register 로 돌아가는 block diagram. 아래에 제어부 FSM 이 we, 주소, f 를 내보낸다." },
        { t: "note", html: "<b>세 번째 칸이 핵심입니다.</b> <code>we</code> 를 0 으로 둔 채 " +
          "<code>wdata</code> 만 이리저리 바꾸면 <code>rdata1</code> 은 어떻게 됩니까? " +
          "쓰기는 <b>we 가 1 이고 rising edge 가 올 때만</b> 일어납니다 — " +
          "wdata 는 그 전까지 아무 일도 하지 않는 전선일 뿐입니다." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>reg_file.vhd</code> 의 핵심 부분입니다." },
        { t: "code", key: "read", name: "", text:
`  -- 쓰기 : 동기
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then
        regs <= (others => (others => '0'));
      elsif we = '1' then
        regs(to_integer(unsigned(waddr))) <= wdata;
      end if;
    end if;
  end process;

  -- 읽기 : 조합 (주소가 바뀌면 즉시). synthesis 하면 MUX 트리
  rdata1 <= regs(to_integer(unsigned(raddr1)));
  rdata2 <= regs(to_integer(unsigned(raddr2)));` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — register file",
    sub: "프로젝트의 A0~A3 / B0~B3 와 MUX 를 하나로 일반화한 부품입니다. 13주차에 그대로 씁니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) 쓰는 그 clock 에 새 값이 보일 줄 알았는데 옛 값이었다." },
    practice: { file: "reg_file.vhd", checkNote: "무작위 300clock 으로 쓰기·읽기·reset 을 확인합니다.",
                sigs: "clk, we, waddr, wdata, raddr1, rdata1", 
                localCmd: "ghdl -a --std=08 reg_file.vhd grader/w12/tb_reg_file_check.vhd && " +
                          "ghdl -r --std=08 tb_reg_file_check --ieee-asserts=disable --stop-time=40us" },
    wave: {
      vcd: "vcd/w12.vcd", step: 20,
      sigs: [
        { path: "we",     width: 1, label: "we" },
        { path: "waddr",  width: 2, label: "waddr" },
        { path: "wdata",  width: 4, label: "wdata" },
        { path: "raddr1", width: 2, label: "raddr1" },
        { path: "rdata1", width: 4, label: "rdata1" },
        { path: "raddr2", width: 2, label: "raddr2" },
        { path: "rdata2", width: 4, label: "rdata2" },
      ],
    },
    quiz: [
      { type: "vector",  path: "rdata1", width: 4, label: "rdata1",
        hint: "그 시각의 raddr1 이 가리키는 칸의 값입니다." },
      { type: "vector",  path: "rdata2", width: 4, label: "rdata2",
        hint: "읽기 포트가 둘이라 서로 다른 칸을 동시에 볼 수 있습니다." },
      { type: "count",   path: "we",     label: "we",
        hint: "쓰기가 일어난 구간이 몇 개인지 세어 보세요." },
      { type: "decimal", path: "rdata1", width: 4, label: "rdata1", signed: false,
        hint: "부호 없는 수로 읽습니다. 0 ~ 15." },
    ],
    design: {
      file: "ram_sp.vhd",
      given: true,            // 과제가 아니라 두 번째 따라 만들기 — 전체 코드를 준다

      localCmd: "ghdl -a --std=08 ram_sp.vhd grader/w12/tb_ram_sp_check.vhd && " +
                "ghdl -r --std=08 tb_ram_sp_check --ieee-asserts=disable --stop-time=40us",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity ram_sp is
  generic (AW : positive := 4; DW : positive := 8);     -- 16 x 8
  port (
    clk  : in  std_logic;
    we   : in  std_logic;
    addr : in  std_logic_vector(AW-1 downto 0);
    din  : in  std_logic_vector(DW-1 downto 0);
    dout : out std_logic_vector(DW-1 downto 0)
  );
end entity ram_sp;

architecture rtl of ram_sp is
  -- 칸 수는 2**AW, 한 칸의 폭은 DW. 초기값은 FPGA 비트스트림에 실린다.
  type mem_t is array (0 to 2**AW-1) of std_logic_vector(DW-1 downto 0);
  signal mem : mem_t := (others => (others => '0'));
begin
  process (clk) begin
    if rising_edge(clk) then
      if we = '1' then
        mem(to_integer(unsigned(addr))) <= din;          -- 쓰기 : 동기
      end if;
      -- 읽기도 process 안이므로 register 가 된다 (동기 읽기).
      -- 쓰기보다 뒤에 적었지만 신호 대입이라 같은 clock 에는 "옛 값" 이 나온다.
      dout <= mem(to_integer(unsigned(addr)));
    end if;
  end process;
end architecture rtl;`,
    },
    quartus: { pins: 67, registers: 16, pinmap: PINMAP.lab10,
               regNote: "register file 두 벌과 표시용 register 가 더해집니다 — RAM 은 M10K 블록으로 빠져 별도로 셉니다" },
    board: {
      photoLabel: "보드 대표 사진 — HEX 와 SW 위치가 함께 보이게 두 장",
      fields: [
        { key: "r1", label: "읽은 값 1 (16진 한 글자)", ph: "예: A" },
        { key: "r2", label: "읽은 값 2 (16진 한 글자)", ph: "예: 3" },
        { key: "wa", label: "마지막으로 쓴 주소",        ph: "0 ~ 3" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (label) => {
          const v = [nx() % 16, nx() % 16, nx() % 16, nx() % 16];
          const a = nx() % 4;
          let b = nx() % 4;
          if (b === a) b = (b + 1) % 4;
          return { v, a, b, label: `${label} — R0..R3 = ${v.join(", ")}`,
            sw: `네 칸에 차례로 쓰고 raddr1=${a}, raddr2=${b} 로 읽는다` };
        };
        return [mk("첫째"), mk("둘째")];
      },
      expect: (c) => ({ r1: c.v[c.a].toString(16).toUpperCase(),
                        r2: c.v[c.b].toString(16).toUpperCase(), wa: "3" }),
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "지금까지는 회로 하나가 한 가지 일을 했습니다. " +
          "프로젝트처럼 <b>여러 일을 차례로</b> 하는 회로는 둘로 나눠 생각합니다 — " +
          "<b>datapath</b>(값이 흐르는 길)와 <b>제어부</b>(언제 무엇을 할지). " +
          "오늘은 datapath 를 만들고, 제어부 FSM 은 13주차에 붙입니다." },
        { t: "fig", src: "figs/w12-datapath.png", cap: "그림 1. 제어와 데이터를 나눈다",
          alt: "reg_file 에서 op1, op2 가 ALU 로 들어가고 결과가 표시 장치로 가며 위쪽 통로로 다시 register 로 돌아가는 block diagram. 아래에 제어부 FSM 이 we, 주소, f 를 내보낸다." },
        { t: "table", caption: "쓰기와 읽기가 왜 다른가",
          head: ["", "쓰기", "읽기"],
          rows: [["언제", "clock 의 rising edge 에", "주소가 바뀌면 곧바로"],
                 ["회로", "flip-flop", "MUX 트리 (조합)"],
                 ["포트 수", "1개", "2개 — ALU 가 피연산자 둘을 받으므로"],
                 ["값이 바뀌는 때", "rising edge", "edge 가 지나면 곧바로 새 값이 보인다"]],
          hl: [[3,2]] },
        { t: "code", key: "lab", name: "reg_file.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity reg_file is
  generic (
    NREG  : positive := 4;
    WIDTH : positive := 4;
    AW    : positive := 2
  );
  port (
    clk, reset : in  std_logic;
    we         : in  std_logic;
    waddr      : in  std_logic_vector(AW-1 downto 0);
    wdata      : in  std_logic_vector(WIDTH-1 downto 0);
    raddr1     : in  std_logic_vector(AW-1 downto 0);
    rdata1     : out std_logic_vector(WIDTH-1 downto 0);
    raddr2     : in  std_logic_vector(AW-1 downto 0);
    rdata2     : out std_logic_vector(WIDTH-1 downto 0)
  );
end entity reg_file;

architecture rtl of reg_file is
  type reg_array is array (0 to NREG-1) of std_logic_vector(WIDTH-1 downto 0);
  signal regs : reg_array;
begin
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then
        regs <= (others => (others => '0'));
      elsif we = '1' then
        regs(to_integer(unsigned(waddr))) <= wdata;
      end if;
    end if;
  end process;

  rdata1 <= regs(to_integer(unsigned(raddr1)));
  rdata2 <= regs(to_integer(unsigned(raddr2)));
end architecture rtl;` },
        { t: "note", html: "<b>배열 타입을 처음 씁니다.</b> <code>type reg_array is array (0 to NREG-1) of …</code> — " +
          "register 네 개를 이름 네 개가 아니라 <b>주소로</b> 다루게 됩니다. " +
          "프로젝트의 A0~A3 와 A_DEC, 그리고 MUX 가 이 한 부품 안에 모두 들어 있습니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "<code>to_integer(unsigned(…))</code> 로 주소를 인덱스로 바꾸는 꼴에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "네 칸에 차례로 쓰고 읽기 주소를 옮겨 가며 두 포트를 동시에 읽습니다." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>we=1</code> 이고 <code>waddr = raddr1</code> 인 구간을 " +
          "찾아보세요. 커서가 가리키는 구간 가운데는 이미 rising edge 가 지난 뒤이므로 " +
          "<code>rdata1</code> 에 <b>새 값</b>이 보입니다 — 쓰기는 edge 에서 끝났고 읽기는 조합이기 때문입니다. " +
          "edge <b>직전</b>이라면 아직 옛 값입니다. 과제의 RAM 은 이와 달라서, " +
          "같은 주소를 쓰면서 읽으면 <b>다음 clock 까지도</b> 옛 값이 나옵니다." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "따라 만들기 2 — 단일 포트 동기 RAM", blocks: [
        { t: "p", html: "register file 은 칸이 몇 개 안 될 때 쓰는 방식입니다. " +
          "칸이 수백·수천 개가 되면 FPGA 안의 <b>블록 RAM</b>(M10K) 을 써야 합니다. " +
          "쓰는 법은 거의 같지만 <b>읽기가 동기</b>라는 점이 결정적으로 다릅니다. " +
          "이 코드도 <b>전체를 드립니다</b> — 읽고, 직접 쳐 넣고, 돌려서 확인하는 것이 오늘의 일입니다." },
        { t: "table", caption: "두 저장소의 차이", head: ["", "reg_file", "ram_sp (블록 RAM)"],
          rows: [["칸 수", "몇 개 ~ 수십 개", "수백 ~ 수천 개"],
                 ["읽기", "조합 — 그 clock 에 나온다", "동기 — <b>다음</b> clock 에 나온다"],
                 ["읽기 포트", "2개도 쉽다", "보통 1개 (2포트는 따로 만들어야)"],
                 ["synthesis 결과", "flip-flop + MUX", "M10K 블록 하나"]],
          hl: [[1,2]] },
        { t: "table", cls: "tt", caption: "read-old-data — 같은 주소를 쓰면서 읽을 때",
          head: ["clock", "we", "addr", "din", "edge 뒤의 dout"],
          rows: [["1", "1", "5", "0xAA", "5번 칸의 <b>옛</b> 값"],
                 ["2", "0", "5", "—", "0xAA (이제 새 값)"]],
          hl: [[0,4]] },
        { t: "note", html: "<b>왜 옛 값인가.</b> process 안에서 쓰기와 읽기가 모두 신호 대입이라, " +
          "같은 edge 에서 <code>dout</code> 이 받는 것은 <b>이 edge 에 쓰이기 전의</b> mem 값입니다. " +
          "이것은 실수가 아니라 블록 RAM 하드웨어의 성질이고, " +
          "Quartus 가 M10K 로 추론하게 하려면 이 모양 그대로 써야 합니다." },
        { t: "note", html: "<b>13주차에 이 두 부품을 그대로 씁니다.</b> " +
          "register file 과 RAM 은 최종 프로젝트 datapath 의 저장소가 됩니다. " +
          "읽기가 한 clock 늦다는 사실은 <b>제어 FSM 의 상태 수</b>를 바꾸므로, " +
          "오늘 이것을 눈으로 확인해 두는 것이 다음 주 설계를 좌우합니다." },
      ] },
      { no: 6, title: "직접 입력해 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "위 코드를 <b>보고 베끼지 말고 읽으면서</b> 쳐 넣은 뒤 " +
          "<b>GHDL 로 실행</b>을 누르면 열여섯 칸을 모두 채운 뒤 " +
          "400번 무작위로 접근하며 <b>동기 읽기</b>와 <b>read-old-data</b> 를 확인합니다. " +
          "<code>dout &lt;=</code> 줄을 <code>process</code> <b>밖으로</b> 옮기면 어떻게 되는지도 " +
          "한 번 해 보세요 — 읽기가 조합이 되어 그 자리에서 틀립니다." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 10 TOP 은 핀이 많습니다 — <b>67핀</b>. " +
          "Compilation Report 에서 <b>Total block memory bits</b> 를 함께 보세요. " +
          "0 이 아니면 RAM 이 M10K 블록으로 제대로 추론된 것입니다." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "<b>본인 학번으로 지정된 네 값</b>을 R0~R3 에 차례로 쓰고, " +
          "지정된 두 주소를 읽어 HEX 에 보이는 값을 적으세요." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "수업 후 — 프로젝트 block diagram 초안",
    sub: "오늘 만든 datapath 위에 <b>제어 FSM 상자 하나</b>를 얹어 팀의 block diagram 초안을 그립니다.",
    discuss: { ph: "RAM 에서 피연산자를 가져오면 상태가 …" },
    steps: [
      { no: 1, title: "block diagram 초안 올리기", pts: "15점", widget: "upload",
        up: { id: "bd", label: "block diagram 초안 (PDF · PNG · JPG)", accept: ".pdf,.png,.jpg,.jpeg" },
        blocks: [
          { t: "p", html: "손으로 그려 사진을 찍어도 됩니다. <b>그리는 것 자체</b>가 목적이지 " +
            "도구가 목적이 아닙니다. 13주차에 이 그림을 들고 와서 확정합니다." },
          { t: "table", caption: "block diagram 에 들어갈 것", head: ["", "내용"],
            rows: [["1", "<b>저장소</b> — register file 또는 RAM, 몇 칸 × 몇 비트인지 적을 것"],
                   ["2", "<b>연산기</b> — ALU 등. 입력이 어디서 오고 결과가 어디로 가는지"],
                   ["3", "<b>제어 FSM 상자</b> — 아직 상태를 다 몰라도 상자와 나가는 제어선만"],
                   ["4", "<b>입출력</b> — SW · KEY · HEX · LEDR 중 쓸 것"],
                   ["5", "<b>신호 이름과 폭</b> — 선마다 이름과 비트 수"]] },
          { t: "note", html: "<b>제어선과 데이터선을 구분해 그리세요.</b> " +
            "데이터는 굵은 선(버스), 제어는 얇은 선으로 그리면 " +
            "\"무엇이 datapath 이고 무엇이 제어부인지\" 가 그림만 보고 드러납니다 — " +
            "오늘 수업의 요점이 그것입니다." },
          { t: "note", html: "<b>화살표가 상자와 겹치지 않게</b> 그리세요. " +
            "겹친 그림은 13주차에 다시 그리게 됩니다." },
        ] },
      { no: 2, title: "블록마다 한 줄 설명", pts: "10점", widget: "textArea",
        area: { id: "bdwhy", tall: true,
                ph: "예) reg_file(8칸 × 8비트) — 피연산자 두 개를 동시에 읽어야 해서 읽기 포트를 2개로 했다. / ALU — 7주차 … / 제어 FSM — 상태는 IDLE, LOAD, EXEC, STORE 넷으로 보고 있다." },
        blocks: [{ t: "p", html: "그림의 상자마다 <b>한 줄씩</b> 적으세요. " +
          "이름 · 크기(칸 수와 폭) · <b>왜 그렇게 정했는지</b>를 포함합니다. " +
          "저장소를 register file 로 할지 RAM 으로 할지 아직 못 정했다면 " +
          "<b>둘 다 적고 무엇을 보고 정할지</b> 쓰면 됩니다." }, { t: "note", html: "<b>프로젝트부터 AI 를 리뷰 파트너로 씁니다.</b> block diagram 과 설명을 <b>팀이 먼저</b> 다 쓴 뒤, AI 에게 \"빠진 신호나 모순이 있는지\" 만 물어볼 수 있습니다. 받아들인 지적은 줄 끝에 <b>(AI)</b> 라고 표시합니다." }] },
      { no: 3, title: "토의", pts: "5점", widget: "discuss", blocks: [
        { t: "p", html: "ALU 의 피연산자를 register file 대신 <b>RAM</b> 에서 가져온다면 " +
          "제어 FSM 에 상태가 몇 개 더 필요합니까? " +
          "읽기가 한 clock 늦다는 것이 state diagram 에 어떻게 나타나는지 적어 보세요." },
      ] },
      { no: 4, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "<b>팀원 각자</b> 제출하세요 (같은 그림을 올려도 됩니다). " +
          "제출하면 <b>과제 보고서 PDF</b> 가 만들어집니다. 따로 작성할 문서는 없습니다." },
      ] },
    ],
  },
};
