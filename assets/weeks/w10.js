/* ══════════════════════════════════════════════════════════════
   Week 10 — FSM ② timer 가 붙은 FSM : 신호등   (Lab 8)
   실습 traffic_light (전체 코드 제공) · 과제 traffic_night — 야간 점멸 (교안 지정)
══════════════════════════════════════════════════════════════ */
import { PINMAP } from "../pinmaps.js";
import { bin } from "../render.js";

const T = { G: 6, Y: 2, R: 4 };
const NAME = ["GREEN", "YELLOW", "", "RED"];
const LIGHT = ["001", "010", "000", "100"];
const CODE = ["00", "01", "11", "10"];

/** walk 없이 reset(RED) 에서 n 틱 뒤의 상태 — 예습 채점과 검증에 같이 쓴다 */
export function runTicks(n) {
  let st = 3, cnt = 0;              // RED 에서 시작
  for (let i = 0; i < n; i++) {
    const lim = st === 0 ? T.G : st === 1 ? T.Y : T.R;
    if (cnt === lim - 1) { st = st === 0 ? 1 : st === 1 ? 3 : 0; cnt = 0; }
    else cnt++;
  }
  return { st, cnt };
}

export const W = {
  id: "w10", no: 10, lab: "lab08", labTitle: "신호등 제어기 (timer FSM)",
  topic: "FSM ② timer",
  h1: "상태마다 머무는 시간이 다르다",
  lead: "state diagram 에 <b>시간 조건</b>이 붙습니다. 7주차의 counter 를 FSM 안에 넣어 \"몇 초 뒤에 넘어간다\" 를 만듭니다. " +
        "<b>수업 전</b>에 초마다 상태를 적어 보고, <b>수업 중</b>에 직접 돌려 맞춘 뒤 보드에 올리고, " +
        "<b>수업 후</b>에 전적색 안전 시간을 끼워 넣습니다.",
  chips: ["timer FSM", "expire", "보행 요청 기억", "generic 시간"],
  points: { pre: 30, in: 40, post: 30 },
  deck: { dir: "slides/w10", count: 38, pad: 2, per: 8, title: "W10 FSM ② timer", narration: "w10" },
  footnote: "waveform 은 GHDL simulation 결과(<span class='mono'>w10.vcd</span>)를 그대로 읽어 그린 것입니다. " +
            "한 구간(20 ns)이 한 tick, 곧 1초입니다.",

  concepts: [
    { q: "timer 가 붙은 FSM 에서 <code>cnt</code> 는 언제 올라갑니까?",
      opts: ["clock 마다", "tick 이 1 인 clock 에만",
             "상태가 바뀔 때마다", "walk 를 누를 때마다"], ans: 1 },
    { q: "<code>if cnt = T_GREEN - 1 then expire &lt;= '1'</code> 에서 왜 <b>−1</b> 입니까?",
      opts: ["0 부터 세기 때문에 T번째 틱이 cnt = T−1 에 해당해서",
             "한 틱을 여유로 두려고",
             "synthesis 오류를 피하려고",
             "T 가 0 일 수도 있어서"], ans: 0 },
    { q: "보행 버튼을 <code>walk_rq</code> flag 로 기억해 두는 까닭은?",
      opts: ["버튼이 눌린 그 순간에만 신호를 바꾸면 놓치는 사람이 생기므로",
             "flag 가 없으면 synthesis 가 안 되므로",
             "버튼이 두 번 눌리는 것을 막으려고",
             "timer 를 멈추려고"], ans: 0 },
    { q: "이 설계에서 <b>출력(light)</b> 은 무엇으로 정해집니까?",
      opts: ["상태와 tick", "상태만 — Moore",
             "상태와 walk", "cnt 값"], ans: 1 },
    { q: "시연할 때 1초 대신 0.2초로 빠르게 돌리려면 어디를 바꿉니까?",
      opts: ["FSM 의 상태 수", "tick_gen 의 generic N",
             "clock 주파수", "T_GREEN 값"], ans: 1 },
  ],

  pre: {
    head: "수업 전에 할 일",
    sub: "슬라이드로 timer FSM 의 구조를 확인하고, <b>초마다 상태가 어떻게 되는지</b> 미리 적어 둡니다.",
    predict: {
      count: 2,
      fields: [
        { key: "code",  label: "state_code (2비트)", len: 2, ph: "00" },
        { key: "secs",  label: "그때의 secs (4비트)", len: 4, ph: "0000" },
        { key: "light", label: "light (R Y G)",      len: 3, ph: "000" },
      ],
      cases(seed) {
        let x = (seed >>> 0) || 1;
        const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
        const mk = (lo, hi) => {
          const n = lo + (nx() % (hi - lo + 1));
          return { n, given: `reset 직후(RED, secs=0)에서 tick 을 ${n} 번 받았을 때 (walk 는 누르지 않음)` };
        };
        return [mk(3, 9), mk(10, 20)];
      },
      model(c) {
        const { st, cnt } = runTicks(c.n);
        return { code: CODE[st], secs: bin(cnt, 4), light: LIGHT[st] };
      },
    },
    reading: {
      question: "<code>expire</code> 는 <code>process (all)</code> 안에서 만들어지는 조합 신호입니다. " +
                "이것을 상태 register process 안에서 <code>if cnt = T_GREEN - 1 then</code> 처럼 " +
                "직접 검사하지 않고 따로 뺀 까닭은 무엇일까요?",
      ph: "예) 상태마다 조건이 다르므로 다음 상태를 정하는 곳에 함께 두면 …",
      askPh: "예) cnt 가 언제 0 으로 돌아가는지 헷갈립니다.",
    },
    steps: [
      { no: "★", title: "강의 슬라이드", widget: "deck" },
      { no: 1, title: "개념 확인", pts: "15점 · 자동채점", widget: "concept",
        blocks: [{ t: "p", html: "슬라이드를 본 뒤 풀어 보세요. 한 문항 3점입니다." }] },
      { no: 2, title: "초마다 상태 적어 보기", pts: "10점", widget: "predict", blocks: [
        { t: "p", html: "reset 하면 <b>RED</b> 에서 시작합니다. tick 을 몇 번 받은 뒤의 상태를 적으세요. " +
          "학번마다 횟수가 다르고, <b>정답은 지금 보여 주지 않습니다</b>." },
        { t: "fig", src: "figs/w10-traffic.png", cap: "그림 1. 신호등 state diagram — 화살표마다 시간 조건이 붙는다",
          alt: "GREEN, YELLOW, RED 세 상태가 삼각형으로 놓이고 각 화살표에 cnt 조건이 적힌 state diagram. 오른쪽에 점선으로 ALL RED 상태를 끼워 넣을 자리가 표시되어 있다." },
        { t: "table", cls: "tt", caption: "시간 설정 (generic)",
          head: ["상태", "머무는 시간", "light (R Y G)", "state_code"],
          rows: [["GREEN", "6초", "001", '"00"'],
                 ["YELLOW", "2초", "010", '"01"'],
                 ["RED", "4초", "100", '"10"']] },
        { t: "note", html: "<b>어떻게 푸나.</b> RED 에서 0초부터 세어 3초가 되는 틱에 GREEN 으로 넘어갑니다(4초 머묾). " +
          "<code>secs</code> 는 <b>그 상태에 들어온 뒤 지난 틱 수</b>이고, 상태가 바뀌면 0 으로 돌아갑니다. " +
          "종이에 \"틱 번호 / 상태 / secs\" 세 칸을 그려 한 줄씩 내려가는 편이 빠릅니다." },
      ] },
      { no: 3, title: "코드 읽기", pts: "5점", widget: "reading", blocks: [
        { t: "p", html: "실습에서 쓸 <code>traffic_light.vhd</code> 의 상태 register 부분입니다." },
        { t: "code", key: "read", name: "", text:
`  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then
        st <= RED; cnt <= (others => '0'); walk_rq <= '0';
      else
        if walk = '1' then walk_rq <= '1'; end if;   -- 요청 기억
        if tick = '1' then
          if expire = '1' then
            st  <= nx; cnt <= (others => '0');
            if st = GREEN then walk_rq <= '0'; end if;
          else
            cnt <= cnt + 1;
          end if;
        end if;
      end if;
    end if;
  end process;` },
      ] },
      { no: 4, title: "예습 제출", widget: "submitPre",
        blocks: [{ t: "p", html: "제출하면 <b>예습 보고서 PDF</b> 가 만들어집니다. 수업 전까지 내세요." }] },
    ],
  },

  inc: {
    head: "따라 만들기 — 신호등 제어기",
    sub: "FSM 안에 timer 를 넣습니다. 직접 입력해 돌리고, 보드에서 실제로 신호가 바뀌는 것을 봅니다.",
    quizPoints: 12,
    compare: { points: 8, whyPh: "예) 상태가 바뀔 때 secs 가 1 부터 시작한다고 보았는데 0 이었다." },
    practice: { file: "traffic_light.vhd", checkNote: "무작위 tick/walk 600clock 으로 상태·timer·등·요청 flag 를 확인합니다.",
                sigs: "clk, tick, walk, light, state_code, secs", 
                localCmd: "ghdl -a --std=08 traffic_light.vhd grader/w10/tb_traffic_light_check.vhd && " +
                          "ghdl -r --std=08 tb_traffic_light_check --ieee-asserts=disable --stop-time=60us" },
    wave: {
      vcd: "vcd/w10.vcd", step: 20,
      sigs: [
        { path: "tick",  width: 1, label: "tick (1초)" },
        { path: "walk",  width: 1, label: "walk" },
        { path: "stc",   width: 2, label: "state_code" },
        { path: "secs",  width: 4, label: "secs" },
        { path: "light", width: 3, label: "light (R Y G)" },
        { path: "wrq",   width: 1, label: "walk_rq" },
      ],
    },
    quiz: [
      { type: "vector",  path: "light", width: 3, label: "light",
        hint: "왼쪽부터 R Y G 입니다. 한 비트만 1 입니다." },
      { type: "vector",  path: "stc",   width: 2, label: "state_code",
        hint: "00=GREEN, 01=YELLOW, 10=RED 입니다." },
      { type: "decimal", path: "secs",  width: 4, label: "secs", signed: false,
        hint: "그 상태에 들어온 뒤 지난 초 수입니다." },
      { type: "count",   path: "wrq",   label: "walk_rq",
        hint: "보행 요청이 걸려 있는 구간이 몇 개인지 세어 보세요." },
    ],
    design: {
      file: "traffic_night.vhd",
      localCmd: "ghdl -a --std=08 traffic_night.vhd grader/w10/tb_traffic_night_check.vhd && " +
                "ghdl -r --std=08 tb_traffic_night_check --ieee-asserts=disable --stop-time=80us",
      skeleton: `library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity traffic_night is
  generic (
    T_GREEN  : natural := 6;
    T_YELLOW : natural := 2;
    T_RED    : natural := 4;
    T_MIN    : natural := 2;
    T_BLINK  : natural := 1       -- 깜박임 한 칸의 길이 (tick)
  );
  port (
    clk, reset : in  std_logic;
    tick       : in  std_logic;
    walk       : in  std_logic;
    night      : in  std_logic;                     -- SW : 야간 모드
    light      : out std_logic_vector(2 downto 0);
    state_code : out std_logic_vector(1 downto 0);
    secs       : out std_logic_vector(3 downto 0);
    walk_rq_o  : out std_logic
  );
end entity traffic_night;

architecture rtl of traffic_night is
  -- ① 상태 목록에 BLINK_ON, BLINK_OFF 를 더하시오.
  type state_t is (GREEN, YELLOW, RED);

  signal st, nx  : state_t;
  signal cnt     : unsigned(3 downto 0) := (others => '0');
  signal walk_rq : std_logic;
  signal expire  : std_logic;
begin
  -- 상태 register + timer : 실습과 완전히 같다 (고칠 곳 없음)
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then
        st <= RED; cnt <= (others => '0'); walk_rq <= '0';
      else
        if walk = '1' then walk_rq <= '1'; end if;
        if tick = '1' then
          if expire = '1' then
            st  <= nx; cnt <= (others => '0');
            if st = GREEN then walk_rq <= '0'; end if;
          else
            cnt <= cnt + 1;
          end if;
        end if;
      end if;
    end if;
  end process;

  process (all) begin
    nx <= st; expire <= '0';
    case st is
      when GREEN  => nx <= YELLOW;
                     if cnt = T_GREEN - 1 or (walk_rq = '1' and cnt >= T_MIN - 1) then expire <= '1'; end if;
      when YELLOW => nx <= RED;
                     if cnt = T_YELLOW - 1 then expire <= '1'; end if;

      -- ② RED 가 끝날 때 night='1' 이면 BLINK_ON 으로 가게 고치시오.
      when RED    => nx <= GREEN;
                     if cnt = T_RED - 1 then expire <= '1'; end if;

      -- ③ 두 깜박임 상태를 추가하시오. 각각 T_BLINK 만큼 머물고,
      --    night='1' 이면 서로 번갈아 가고, night='0' 이면 RED 로 나간다.

    end case;
  end process;

  -- ④ 두 깜박임 상태의 출력을 추가하시오.
  --    BLINK_ON : 황색만 켜짐, BLINK_OFF : 세 등 모두 꺼짐. state_code 는 둘 다 "11".
  with st select light <=
    "001" when GREEN,
    "010" when YELLOW,
    "100" when RED;
  with st select state_code <=
    "00" when GREEN, "01" when YELLOW, "10" when RED;

  secs      <= std_logic_vector(cnt);
  walk_rq_o <= walk_rq;
end architecture rtl;`,
    },
    quartus: { pins: 28, registers: 8, pinmap: PINMAP.lab08,
               regNote: "상태 + 4비트 timer + flag 에 tick_gen 둘과 debounce 가 더해집니다" },
    board: {
      photoLabel: "보드 대표 사진 — LEDR[2:0] (신호등) 과 HEX1 (초) 가 함께 보이게 두 장",
      fields: [
        { key: "hex0",  label: "HEX0 (상태 번호)",  ph: "0 / 1 / 2" },
        { key: "hex1",  label: "HEX1 (secs)",      ph: "예: 3" },
        { key: "light", label: "LEDR[2:0] (R Y G)", ph: "예: 100" },
      ],
      cases(seed) {
        const u = seed >>> 0;
        const mk = (n, label) => ({ n, label: `${label} — tick ${n} 번 뒤`,
          sw: `KEY[0] 으로 reset 하고 SW[0]=1 (빠른 모드) 로 둔 뒤 ${n} 번째 깜박임에서 읽는다` });
        return [mk(4 + (u % 6), "첫째"), mk(12 + ((u >>> 9) % 9), "둘째")];
      },
      expect(c) {
        const { st, cnt } = runTicks(c.n);
        return { hex0: String(st === 3 ? 2 : st), hex1: String(cnt), light: LIGHT[st] };
      },
    },
    steps: [
      { no: 1, title: "회로 구조", blocks: [
        { t: "p", html: "9주차의 FSM 에 <b>timer 하나</b>를 붙인 것이 전부입니다. " +
          "다른 점은 상태를 바꾸는 계기가 입력이 아니라 <b>시간</b> 이라는 것뿐입니다. " +
          "timer 는 7주차에 만든 그 counter 이고, tick 이 올 때만 올라갑니다." },
        { t: "fig", src: "figs/w10-traffic.png", cap: "그림 1. 신호등 state diagram — 화살표마다 시간 조건이 붙는다",
          alt: "GREEN, YELLOW, RED 세 상태가 삼각형으로 놓이고 각 화살표에 cnt 조건이 적힌 state diagram. 오른쪽에 점선으로 ALL RED 상태를 끼워 넣을 자리가 표시되어 있다." },
        { t: "table", caption: "한 틱 동안 일어나는 일", head: ["tick", "expire", "상태", "cnt"],
          rows: [["0", "—", "그대로", "그대로 (아무 일도 안 일어난다)"],
                 ["1", "0", "그대로", "+1"],
                 ["1", "1", "다음 상태로", "0 으로"]],
          hl: [[2,2],[2,3]] },
        { t: "code", key: "lab", name: "traffic_light.vhd", tag: "전체 코드 — 그대로 입력해 보세요",
          ok: true, copy: true, text:
`library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity traffic_light is
  generic (
    T_GREEN  : natural := 6;
    T_YELLOW : natural := 2;
    T_RED    : natural := 4;
    T_MIN    : natural := 2
  );
  port (
    clk, reset : in  std_logic;
    tick       : in  std_logic;
    walk       : in  std_logic;
    light      : out std_logic_vector(2 downto 0);
    state_code : out std_logic_vector(1 downto 0);
    secs       : out std_logic_vector(3 downto 0);
    walk_rq_o  : out std_logic
  );
end entity traffic_light;

architecture rtl of traffic_light is
  type state_t is (GREEN, YELLOW, RED);
  signal st, nx  : state_t;
  signal cnt     : unsigned(3 downto 0) := (others => '0');
  signal walk_rq : std_logic;
  signal expire  : std_logic;
begin
  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then
        st <= RED; cnt <= (others => '0'); walk_rq <= '0';
      else
        if walk = '1' then walk_rq <= '1'; end if;
        if tick = '1' then
          if expire = '1' then
            st  <= nx; cnt <= (others => '0');
            if st = GREEN then walk_rq <= '0'; end if;
          else
            cnt <= cnt + 1;
          end if;
        end if;
      end if;
    end if;
  end process;

  process (all) begin
    nx <= st; expire <= '0';
    case st is
      when GREEN  => nx <= YELLOW;
                     if cnt = T_GREEN - 1 or (walk_rq = '1' and cnt >= T_MIN - 1) then expire <= '1'; end if;
      when YELLOW => nx <= RED;
                     if cnt = T_YELLOW - 1 then expire <= '1'; end if;
      when RED    => nx <= GREEN;
                     if cnt = T_RED - 1 then expire <= '1'; end if;
    end case;
  end process;

  with st select light <=
    "001" when GREEN,
    "010" when YELLOW,
    "100" when RED;
  with st select state_code <=
    "00" when GREEN, "01" when YELLOW, "10" when RED;

  secs      <= std_logic_vector(cnt);
  walk_rq_o <= walk_rq;
end architecture rtl;` },
        { t: "note", html: "<b>GREEN 의 화살표에는 조건이 둘 붙어 있습니다.</b> " +
          "\"6초가 다 됐거나\" <b>또는</b> \"보행 요청이 있고 최소 2초는 지났거나\" — " +
          "state diagram 의 화살표 하나에 조건 두 개를 <code>or</code> 로 묶은 것뿐입니다. " +
          "최소 시간 <code>T_MIN</code> 이 없으면 버튼을 누르는 순간 신호가 바뀌어 위험합니다." },
      ] },
      { no: 2, title: "직접 돌려 보기", pts: "4점 · 자동채점", widget: "practice", blocks: [
        { t: "p", html: "위 코드를 <b>보고 직접 타이핑</b>해서 아래에 넣고 실행하세요. " +
          "상태 register 안에 timer 가 함께 들어가는 모양에 손이 익습니다. " +
          "실행하면 학번과 시각이 교수님 쪽에 기록됩니다." },
      ] },
      { no: 3, title: "waveform 으로 확인 — 예습과 맞춰 보기", pts: "8점", widget: "wave", blocks: [
        { t: "p", html: "한 구간(20 ns)이 1초입니다. reset 뒤 RED 에서 시작해 두 바퀴를 돌고, " +
          "도중에 보행 버튼을 한 번 누릅니다." },
      ] },
      { no: "", title: "", widget: "compare", blocks: [
        { t: "note", html: "<b>눈여겨볼 구간.</b> <code>walk</code> 가 1 이 된 구간과 " +
          "실제로 GREEN 이 끝나는 구간은 다릅니다. 그 사이 동안 <code>walk_rq</code> 가 " +
          "요청을 붙잡고 있습니다 — 그리고 GREEN 을 떠나는 그 틱에 0 으로 돌아갑니다." },
      ] },
      { no: 4, title: "자가점검", pts: "12점 · 자동채점", widget: "quiz", blocks: [
        { t: "p", html: "정답은 이 페이지에 없습니다. waveform 을 읽어야만 답할 수 있고, 학번마다 묻는 시각이 다릅니다." },
      ] },
      { no: 5, title: "설계 사양 — 야간 점멸 모드", blocks: [
        { t: "p", html: "밤에 차가 거의 없는 교차로는 신호를 돌리지 않고 <b>황색만 깜박입니다</b>. " +
          "스위치 <code>night</code> 를 올리면 그 모드로 들어가게 만드는 것이 이번 과제입니다. " +
          "깜박이려면 <b>켠 상태와 끈 상태가 둘 다</b> 필요합니다 — 그래서 상태가 두 개 늘어납니다." },
        { t: "table", caption: "더해지는 상태", head: ["상태","light","state_code","머무는 시간","다음"],
          rows: [["BLINK_ON",  '"010" (황색만)', '"11"', "T_BLINK", "night=1 → BLINK_OFF · night=0 → RED"],
                 ["BLINK_OFF", '"000" (모두 꺼짐)', '"11"', "T_BLINK", "night=1 → BLINK_ON · night=0 → RED"]] },
        { t: "note", html: "<b>들어가는 곳과 나오는 곳을 사양으로 못박습니다.</b> " +
          "들어갈 때는 <b>RED 가 끝나는 순간</b>에만 BLINK_ON 으로 갑니다. " +
          "나올 때는 깜박임 상태가 끝나는 순간에 <b>RED</b> 로 갑니다. " +
          "채점기가 이 두 가지를 그대로 검사하므로 다른 방식으로 만들면 틀립니다 — " +
          "<b>왜 이렇게 정했는지</b>는 아래 토의에서 생각해 봅니다." },
        { t: "note", html: "<b>초록 한가운데서 갑자기 들어가지 않습니다.</b> night 은 스위치라 아무 때나 올라갑니다. " +
          "하지만 그때마다 바로 바꾸면 달리던 차 앞에서 초록이 사라집니다. " +
          "그래서 \"지금 상태의 시간은 지키고, 안전한 자리에서 바꾼다\" 로 정했습니다 — " +
          "<code>walk</code> 에 <code>T_MIN</code> 을 두었던 것과 같은 생각입니다." },
        { t: "note", html: "<b>고칠 곳은 네 군데입니다.</b> 상태 목록 · RED 의 다음 상태 · " +
          "두 깜박임 상태의 case · 출력 표. 상태 register process 는 <b>한 글자도 건드리지 않습니다</b> — " +
          "상태가 몇 개든 \"expire 면 넘어가고 아니면 센다\" 는 규칙은 같기 때문입니다. " +
          "이것이 FSM 을 세 덩어리로 나눠 쓰는 이유입니다." },
      ] },
      { no: 6, title: "코드 작성과 실행", pts: "6점 · 자동채점", widget: "editor", blocks: [
        { t: "p", html: "① ~ ④ 를 고치고 <b>GHDL 로 실행</b>을 누르면 night 스위치를 " +
          "여러 번 올렸다 내리며 무작위 800clock 을 돌려, 다섯 상태의 차례와 시간, " +
          "깜박임, 보행 요청까지 모두 확인합니다." },
      ] },
      { no: 7, title: "Quartus 컴파일과 pin assignment", pts: "5점 · 자동채점", widget: "quartus", blocks: [
        { t: "p", html: "Lab 8 TOP 은 CLOCK_50 · KEY 2 · SW 1 · LEDR 10 · HEX0~1 (14) = <b>28핀</b> 입니다. " +
          "<code>SW[0]</code> 을 올리면 1초 대신 0.2초로 돌아가 시연이 빨라집니다 — " +
          "tick_gen 을 두 벌 두고 고르는 구조입니다." },
      ] },
      { no: 8, title: "보드 시연", pts: "5점", widget: "board", blocks: [
        { t: "p", html: "KEY[0] 으로 reset 하면 RED 에서 시작합니다. SW[0] 을 올려 빠른 모드로 두고 " +
          "<b>본인 학번으로 지정된 틱 수</b>에서 LEDR 과 HEX 를 읽어 적으세요. " +
          "KEY[1] (보행 버튼) 은 이때 누르지 않습니다." },
      ] },
      { no: 9, title: "실습 제출", widget: "submitIn", blocks: [
        { t: "p", html: "실습실을 나가기 전에 제출하세요. <b>실습 보고서 PDF</b> 가 만들어집니다." },
      ] },
    ],
  },

  post: {
    head: "정리 — 모드를 하나 더 넣는다는 것",
    sub: "synthesis 결과를 확인하고, 보행 요청이 어떻게 기억되는지 설명한 뒤 토의에 답합니다.",
    rtl: { after: "State Machine Viewer 에서 상태가 다섯으로 늘어난 것을 확인하고, " +
                  "상태 register 의 비트 수가 어떻게 바뀌었는지도 보세요." },
    explain: {
      ph: "예) walk 를 GREEN 2초째에 눌렀더니 바로 바뀌지 않고 … 구간에서 walk_rq 가 1 로 남아 있다가 …",
      waveLabel: "위에서 설명한 구간이 보이게 캡처하세요 — <span class='mono'>tick, walk, walk_rq, state_code, secs</span> 가 모두 나와야 합니다",
      concepts: [
        { label: "요청 기억",   words: ["기억", "flag", "walk_rq", "붙잡"] },
        { label: "최소 시간",   words: ["최소", "T_MIN", "2초", "안전"] },
        { label: "요청 소진",   words: ["0으로", "0 으로", "지운", "소진", "내려"] },
        { label: "구체적 시각", words: ["secs", "초"] },
        { label: "근거 시각",   words: ["ns"] },
      ],
      model: "GREEN 에 들어온 지 2초째에 walk 를 눌렀다고 하자. " +
        "그 clock 에 <span class='mono'>walk_rq</span> 가 1 이 되어 요청이 <b>기억</b>된다 — " +
        "버튼은 금방 떼지만 flag 는 남는다. " +
        "다음 틱에서 <code>expire</code> 를 계산할 때 " +
        "<span class='mono'>walk_rq='1' and cnt &gt;= T_MIN-1</span> 이 참이 되므로 " +
        "6초를 다 기다리지 않고 YELLOW 로 넘어간다. " +
        "그리고 GREEN 을 떠나는 바로 그 clock 에 <span class='mono'>walk_rq</span> 가 0 으로 돌아간다 — " +
        "요청이 쓰였으므로 소진된 것이다. 이것이 없으면 다음 바퀴에도 GREEN 이 일찍 끝나 버린다. " +
        "<code>T_MIN</code> 이 있는 까닭은, 버튼을 누르는 순간 신호가 바뀌면 " +
        "방금 진입한 차가 급정거해야 하기 때문이다.",
      rubric: [
        "walk 를 누른 시각과 실제로 상태가 바뀐 시각을 모두 적었다",
        "walk_rq flag 가 그 사이를 어떻게 메우는지 설명했다",
        "GREEN 을 떠날 때 flag 가 0 이 되는 까닭을 밝혔다",
        "T_MIN (최소 유지 시간) 이 왜 필요한지 적었다",
      ],
    },
    discuss: { ph: "night 을 초록 한가운데서 올리면 …" },
    review: {
      n: 3,
      prompt: "너는 VHDL 코드 리뷰어다. 아래는 내가 AI 없이 직접 쓴 traffic_night.vhd 이다.\n\n[사양] 실습의 신호등에 야간 점멸 모드를 더한 것. night=1 이면 RED 가 끝나는 순간에만 BLINK_ON 으로 들어가고, BLINK_ON 과 BLINK_OFF 를 T_BLINK 마다 번갈아 간다 (light \"010\" / \"000\", state_code \"11\"). night=0 이 되면 깜박임 상태가 끝나는 순간 RED 로 돌아간다.\n[과목 규약] VHDL-2008, ieee.numeric_std 만 사용, rising_edge, synchronous reset, synthesis 가능한 코드.\n\n[요청]\n1. 고친 전체 코드는 주지 마라. 지적만 해라.\n2. 지적은 많아야 5개. 각각 (줄 번호) (무엇이 문제인지) (왜 문제인지) (어떤 입력이나 waveform 으로 확인할 수 있는지) 를 적어라.\n3. 사양의 경계에서 틀리기 쉬운 테스트 입력 3개를 제안해라.\n4. 확신이 없는 지적에는 '불확실' 이라고 표시해라.",
    },
    steps: [
      { no: 1, title: "RTL View 읽기", pts: "5점", widget: "rtl", blocks: [
        { t: "p", html: "Quartus 의 <b>Tools → Netlist Viewers → State Machine Viewer</b> 를 열어 " +
          "다섯 상태가 제대로 이어졌는지, 두 깜박임 상태 사이에 화살표가 양쪽으로 있는지 " +
          "<b>그림 1</b> 과 견주어 보세요." },
      ] },
      { no: 2, title: "simulation 동작 설명", pts: "10점", widget: "explain", blocks: [
        { t: "p", html: "본인이 설계한 <code>traffic_night</code> 를 돌리고, " +
          "<b>보행 버튼이 어떻게 기억되고 언제 소진되는지</b> 구간 하나를 골라 설명하시오." },
      ] },
      { no: 3, title: "AI 리뷰 판정 — 내 코드를 AI 에게 검토받기", pts: "6점", widget: "aiReview", blocks: [{ t: "p", html: "과제 코드는 AI 없이 다 썼습니다. 이제 AI 에게 <b>리뷰만</b> 받습니다. AI 지적은 맞을 때도 있고 그럴듯하게 틀릴 때도 있습니다. <b>지적 세 개를 골라 맞는지 판정</b>하고 근거를 적으세요." }, { t: "note", html: "판정 근거는 사양 문장, 채점기 결과, waveform 중 하나여야 합니다. \"AI 가 그렇다고 해서\" 는 근거가 아닙니다. 틀린 지적을 하나라도 찾아내면 잘한 것입니다." }] },
      { no: 4, title: "토의", pts: "9점", widget: "discuss", blocks: [
        { t: "p", html: "사양은 <b>RED 가 끝나는 순간</b>에만 야간 모드로 들어가게 했습니다. " +
          "만약 night 이 올라간 <b>그 clock 에 곧바로</b> 들어가게 만들면 어떤 일이 생깁니까? " +
          "<code>night</code> 을 초록 한가운데서 올린 경우를 예로 들어 적어 보세요. " +
          "그리고 상태를 둘 더 두는 대신 <b>상태는 그대로 두고 출력만 깜박이게</b> 하는 방법도 있습니다 — " +
          "그렇게 하면 무엇이 쉬워지고 무엇이 어려워집니까?" },
      ] },
      { no: 5, title: "과제 제출", widget: "submitPost", blocks: [
        { t: "p", html: "위에서 올린 것이 그대로 보고서가 됩니다. <b>따로 작성할 보고서 문서는 없습니다.</b>" },
      ] },
    ],
  },
};
