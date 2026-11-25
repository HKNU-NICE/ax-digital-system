--------------------------------------------------------------------
-- 실습 자동 확인 : gates 를 4가지 입력으로 전수 검사한다 (출력 6개).
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use std.textio.all;

entity tb_gates7_check is end entity tb_gates7_check;

architecture sim of tb_gates7_check is
  signal a, b : std_logic;
  signal y_and, y_or, y_xor, y_nand, y_nor, y_not, y_xnor : std_logic;
  constant V : std_logic_vector(0 to 1) := "01";
begin
  dut : entity work.gates7
    port map (a => a, b => b, y_and => y_and, y_or => y_or, y_xor => y_xor,
              y_nand => y_nand, y_nor => y_nor, y_not => y_not, y_xnor => y_xnor);

  check : process
    variable bad : integer := 0;
    variable l   : line;
    procedure one (name : string; got, want : std_logic;
                   ia, ib : integer; nbad : inout integer) is
      variable ll : line;
    begin
      if got /= want then
        nbad := nbad + 1;
        write(ll, string'("MISMATCH ") & name &
                  string'(" a=") & integer'image(ia) &
                  string'(" b=") & integer'image(ib) &
                  string'("  got=") & std_logic'image(got) &
                  string'("  expected=") & std_logic'image(want));
        writeline(output, ll);
      end if;
    end procedure;
  begin
    for ia in 0 to 1 loop
      for ib in 0 to 1 loop
        a <= V(ia); b <= V(ib);
        wait for 1 ns;
        one("y_and",  y_and,  V(ia) and  V(ib), ia, ib, bad);
        one("y_or",   y_or,   V(ia) or   V(ib), ia, ib, bad);
        one("y_xor",  y_xor,  V(ia) xor  V(ib), ia, ib, bad);
        one("y_nand", y_nand, V(ia) nand V(ib), ia, ib, bad);
        one("y_nor",  y_nor,  V(ia) nor  V(ib), ia, ib, bad);
        one("y_not",  y_not,  not V(ia),        ia, ib, bad);
        one("y_xnor", y_xnor, V(ia) xnor V(ib), ia, ib, bad);
      end loop;
    end loop;

    write(l, string'("== Week 02 task : seven gates (xnor added) ==")); writeline(output, l);
    write(l, string'("cases   : 4 x 7 outputs = 28"));  writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad)); writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "gates7 check failed" severity failure;
    wait;
  end process;
end architecture sim;
