--------------------------------------------------------------------
-- 과제 자동 확인 : warn 을 8가지 입력으로 전수 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use std.textio.all;

entity tb_warn_check is end entity tb_warn_check;

architecture sim of tb_warn_check is
  signal ign, door, belt, w : std_logic;
  constant V : std_logic_vector(0 to 1) := "01";
begin
  dut : entity work.warn port map (ign => ign, door => door, belt => belt, w => w);

  check : process
    variable bad  : integer := 0;
    variable want : std_logic;
    variable l    : line;
  begin
    for i in 0 to 1 loop
      for d in 0 to 1 loop
        for b in 0 to 1 loop
          ign <= V(i); door <= V(d); belt <= V(b);
          wait for 1 ns;
          want := V(i) and ((not V(d)) or (not V(b)));
          if w /= want then
            bad := bad + 1;
            write(l, string'("MISMATCH ign=") & integer'image(i) &
                     string'(" door=") & integer'image(d) &
                     string'(" belt=") & integer'image(b) &
                     string'("  got=") & std_logic'image(w) &
                     string'("  expected=") & std_logic'image(want));
            writeline(output, l);
          end if;
        end loop;
      end loop;
    end loop;

    write(l, string'("== Week 02 task : car warning ==")); writeline(output, l);
    write(l, string'("cases   : 8"));                      writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));   writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "warn check failed" severity failure;
    wait;
  end process;
end architecture sim;
