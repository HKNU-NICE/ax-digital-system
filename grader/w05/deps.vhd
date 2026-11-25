--------------------------------------------------------------------
-- 5주차 강의에서 만드는 기본 부품 (반가산기 · 전가산기)
--   반가산기 : XOR 1 + AND 1
--   전가산기 : 반가산기 2 + OR 1
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;

entity half_adder is
  port ( a, b : in  std_logic;
         s, c : out std_logic );
end entity half_adder;

architecture rtl of half_adder is
begin
  s <= a xor b;
  c <= a and b;
end architecture rtl;

--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;

entity full_adder is
  port ( a, b, cin : in  std_logic;
         s, cout   : out std_logic );
end entity full_adder;

architecture rtl of full_adder is
  signal s1, c1, c2 : std_logic;
begin
  ha1 : entity work.half_adder port map (a => a,  b => b,   s => s1, c => c1);
  ha2 : entity work.half_adder port map (a => s1, b => cin, s => s,  c => c2);
  cout <= c1 or c2;
end architecture rtl;
