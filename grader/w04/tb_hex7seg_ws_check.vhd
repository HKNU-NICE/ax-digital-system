--------------------------------------------------------------------
-- 실습 자동 확인 : hex7seg_case 를 32가지(d 16 x blank 2)로 전수 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;
use work.seg_ref.all;

entity tb_hex7seg_ws_check is end entity tb_hex7seg_ws_check;

architecture sim of tb_hex7seg_ws_check is
  signal d     : std_logic_vector(3 downto 0);
  signal blank : std_logic;
  signal seg   : std_logic_vector(6 downto 0);
  constant V : std_logic_vector(0 to 1) := "01";

  function img (x : std_logic_vector) return string is
    variable s : string(1 to x'length);
    variable k : integer := 1;
  begin
    for i in x'range loop
      if x(i) = '1' then s(k) := '1'; else s(k) := '0'; end if;
      k := k + 1;
    end loop;
    return s;
  end function img;
begin
  dut : entity work.hex7seg_ws port map (d => d, blank => blank, seg => seg);

  check : process
    variable bad  : integer := 0;
    variable want : std_logic_vector(6 downto 0);
    variable l    : line;
  begin
    for bi in 0 to 1 loop
      for dv in 0 to 15 loop
        d <= std_logic_vector(to_unsigned(dv, 4));
        blank <= V(bi);
        wait for 1 ns;
        if bi = 1 then want := "1111111"; else want := seg_of(d); end if;
        if seg /= want then
          bad := bad + 1;
          write(l, string'("MISMATCH d=") & img(d) &
                   string'(" blank=") & integer'image(bi) &
                   string'("  seg=") & img(seg) &
                   string'("  expected=") & img(want));
          writeline(output, l);
        end if;
      end loop;
    end loop;

    write(l, string'("== Week 04 task : same decoder with with-select ==")); writeline(output, l);
    write(l, string'("cases   : 32"));                                    writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));                  writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "hex7seg_ws check failed" severity failure;
    wait;
  end process;
end architecture sim;
