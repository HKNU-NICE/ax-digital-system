--------------------------------------------------------------------
-- 실습 자동 확인 : mux4_1 을 sel 4가지 x 입력패턴 16가지 = 64가지로 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_mux4_1_we_check is end entity tb_mux4_1_we_check;

architecture sim of tb_mux4_1_we_check is
  signal sel : std_logic_vector(1 downto 0);
  signal i0, i1, i2, i3, y : std_logic_vector(3 downto 0);
  constant MAX_SHOW : integer := 8;

  function img (v : std_logic_vector) return string is
    variable r : string(1 to v'length);
    variable k : integer := 1;
  begin
    for i in v'range loop
      if v(i) = '1' then r(k) := '1'; else r(k) := '0'; end if;
      k := k + 1;
    end loop;
    return r;
  end function img;
begin
  dut : entity work.mux4_1_we
    port map (sel => sel, i0 => i0, i1 => i1, i2 => i2, i3 => i3, y => y);

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable want  : std_logic_vector(3 downto 0);
    variable l     : line;
  begin
    for k in 0 to 15 loop
      i0 <= std_logic_vector(to_unsigned(k, 4));
      i1 <= std_logic_vector(to_unsigned((k + 5) mod 16, 4));
      i2 <= std_logic_vector(to_unsigned((k + 10) mod 16, 4));
      i3 <= std_logic_vector(to_unsigned((15 - k), 4));
      for sv in 0 to 3 loop
        sel <= std_logic_vector(to_unsigned(sv, 2));
        wait for 1 ns;
        case sv is
          when 0      => want := i0;
          when 1      => want := i1;
          when 2      => want := i2;
          when others => want := i3;
        end case;
        if y /= want then
          bad := bad + 1;
          if shown < MAX_SHOW then
            shown := shown + 1;
            write(l, string'("MISMATCH sel=") & img(sel) &
                     string'("  y=") & img(y) &
                     string'("  expected=") & img(want));
            writeline(output, l);
          end if;
        end if;
      end loop;
    end loop;

    write(l, string'("== Week 03 task : 4:1 MUX with when-else ==")); writeline(output, l);
    write(l, string'("cases   : 64"));          writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad)); writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "mux4_1_we check failed" severity failure;
    wait;
  end process;
end architecture sim;
