--------------------------------------------------------------------
-- 과제 자동 확인 : major3 를 8가지 입력으로 전수 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use std.textio.all;

entity tb_major3_check is end entity tb_major3_check;

architecture sim of tb_major3_check is
  signal a, b, c, y : std_logic;
  constant V : std_logic_vector(0 to 1) := "01";
begin
  dut : entity work.major3 port map (a => a, b => b, c => c, y => y);

  check : process
    variable bad  : integer := 0;
    variable n    : integer;
    variable want : std_logic;
    variable l    : line;
  begin
    for ia in 0 to 1 loop
      for ib in 0 to 1 loop
        for ic in 0 to 1 loop
          a <= V(ia); b <= V(ib); c <= V(ic);
          wait for 1 ns;
          n := ia + ib + ic;
          if n >= 2 then want := '1'; else want := '0'; end if;
          if y /= want then
            bad := bad + 1;
            write(l, string'("MISMATCH a=") & integer'image(ia) &
                     string'(" b=") & integer'image(ib) &
                     string'(" c=") & integer'image(ic) &
                     string'("  expected y=") & std_logic'image(want));
            writeline(output, l);
          end if;
        end loop;
      end loop;
    end loop;

    write(l, string'("== Week 01 task : 3-input majority ==")); writeline(output, l);
    write(l, string'("cases   : 8"));                           writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));        writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "major3 check failed" severity failure;
    wait;
  end process;
end architecture sim;
