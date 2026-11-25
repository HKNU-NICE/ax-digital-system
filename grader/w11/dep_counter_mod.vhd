-- counter_mod.vhd : 0 .. MODULUS-1 을 도는 카운터 (generic). 마지막 값에서 en 이 오면 0 으로 돌아가며 carry=1
--  시계의 초 일의자리(MODULUS=10), 초 십의자리(6), 분 … 을 이 하나로 만든다
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity counter_mod is
  generic (
    MODULUS : positive := 10;
    WIDTH   : positive := 4          -- 2**WIDTH >= MODULUS
  );
  port (
    clk, reset : in  std_logic;
    en         : in  std_logic;                            -- 1클록 펄스마다 +1
    q          : out unsigned(WIDTH-1 downto 0);
    carry      : out std_logic                             -- en=1 이고 q=MODULUS-1 일 때 1 (조합) -> 다음 자리의 en
  );
end entity counter_mod;

architecture rtl of counter_mod is
  signal cnt : unsigned(WIDTH-1 downto 0) := (others => '0');
  signal last : std_logic;
begin
  assert 2**WIDTH >= MODULUS report "counter_mod: WIDTH too small for MODULUS" severity failure;

  last  <= '1' when cnt = MODULUS - 1 else '0';
  carry <= en and last;                                   -- 리플: 다음 자리는 이 carry 를 en 으로 받는다

  process (clk) begin
    if rising_edge(clk) then
      if reset = '1' then
        cnt <= (others => '0');
      elsif en = '1' then
        if last = '1' then cnt <= (others => '0');
        else               cnt <= cnt + 1;
        end if;
      end if;
    end if;
  end process;
  q <= cnt;
end architecture rtl;
