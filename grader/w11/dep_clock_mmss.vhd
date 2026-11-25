-- clock_mmss.vhd : 분:초 시계 코어. counter_mod 4개를 generic map 으로 (10, 6, 10, 6)
--  tick(1 Hz) 마다 초가 +1. 59:59 다음은 00:00. hold=1 이면 멈춤. 4자리 세그먼트 출력은 generate 로
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.seg_pkg.all;

entity clock_mmss is
  port (
    clk, reset : in  std_logic;
    tick       : in  std_logic;          -- 1클록 펄스 (1 Hz)
    hold       : in  std_logic;          -- 1 이면 정지
    digits     : out seg_array_t(3 downto 0);   -- 3:분십 2:분일 1:초십 0:초일
    mm, ss     : out unsigned(7 downto 0)       -- BCD (십 & 일) : 테스트벤치 검사용
  );
end entity clock_mmss;

architecture rtl of clock_mmss is
  type int_array is array (0 to 3) of positive;
  constant MODS : int_array := (10, 6, 10, 6);      -- 자리별 modulus
  type u4_array is array (0 to 3) of unsigned(3 downto 0);
  signal d  : u4_array;                       -- 자리 값
  signal en : std_logic_vector(0 to 4);       -- en(0)=tick, en(i+1)=carry(i)
begin
  en(0) <= tick and not hold;

  -- 자리 4개를 같은 부품으로 : generic 만 다르다
  g_digit : for i in 0 to 3 generate
    u : entity work.counter_mod
      generic map (MODULUS => MODS(i), WIDTH => 4)
      port map (clk => clk, reset => reset, en => en(i), q => d(i), carry => en(i+1));
    digits(i) <= digit2seg(d(i));            -- package 함수 : 자리마다 디코더
  end generate;

  ss <= d(1) & d(0);
  mm <= d(3) & d(2);
end architecture rtl;
