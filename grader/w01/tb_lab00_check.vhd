--------------------------------------------------------------------
-- 실습 자동 확인 : lab00_sw_led 를 1024가지 SW 값으로 전수 검사한다.
--   LEDR(7..0) = SW(7..0),  LEDR(8) = SW(8) and SW(9),
--   LEDR(9)    = SW(8) xor SW(9)
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_lab00_check is end entity tb_lab00_check;

architecture sim of tb_lab00_check is
  signal sw   : std_logic_vector(9 downto 0);
  signal ledr : std_logic_vector(9 downto 0);
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
  dut : entity work.lab00_sw_led port map (SW => sw, LEDR => ledr);

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable want  : std_logic_vector(9 downto 0);
    variable l     : line;
  begin
    for v in 0 to 1023 loop
      sw <= std_logic_vector(to_unsigned(v, 10));
      wait for 1 ns;
      want(7 downto 0) := sw(7 downto 0);
      want(8)          := sw(8) and sw(9);
      want(9)          := sw(8) xor sw(9);
      if ledr /= want then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH SW=") & img(sw) &
                   string'("  LEDR=") & img(ledr) &
                   string'("  expected=") & img(want));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Lab 0 : SW -> LEDR =="));           writeline(output, l);
    write(l, string'("cases   : 1024"));                      writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));      writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "lab00_sw_led check failed" severity failure;
    wait;
  end process;
end architecture sim;
