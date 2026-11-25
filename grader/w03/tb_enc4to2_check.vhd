--------------------------------------------------------------------
-- 과제 자동 확인 : enc4to2 를 16가지 요청 조합으로 전수 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_enc4to2_check is end entity tb_enc4to2_check;

architecture sim of tb_enc4to2_check is
  signal r     : std_logic_vector(3 downto 0);
  signal code  : std_logic_vector(1 downto 0);
  signal valid : std_logic;

  function img (v : std_logic_vector) return string is
    variable s : string(1 to v'length);
    variable k : integer := 1;
  begin
    for i in v'range loop
      if v(i) = '1' then s(k) := '1'; else s(k) := '0'; end if;
      k := k + 1;
    end loop;
    return s;
  end function img;
begin
  dut : entity work.enc4to2 port map (r => r, code => code, valid => valid);

  check : process
    variable bad   : integer := 0;
    variable wcode : std_logic_vector(1 downto 0);
    variable wval  : std_logic;
    variable l     : line;
  begin
    for v in 0 to 15 loop
      r <= std_logic_vector(to_unsigned(v, 4));
      wait for 1 ns;
      if    r(3) = '1' then wcode := "11";
      elsif r(2) = '1' then wcode := "10";
      elsif r(1) = '1' then wcode := "01";
      else                  wcode := "00";
      end if;
      wval := r(3) or r(2) or r(1) or r(0);
      if code /= wcode or valid /= wval then
        bad := bad + 1;
        write(l, string'("MISMATCH r=") & img(r) &
                 string'("  code=") & img(code) & string'(" valid=") & std_logic'image(valid) &
                 string'("  expected code=") & img(wcode) &
                 string'(" valid=") & std_logic'image(wval));
        writeline(output, l);
      end if;
    end loop;

    write(l, string'("== Week 03 task : 4:2 priority encoder ==")); writeline(output, l);
    write(l, string'("cases   : 16"));                              writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));            writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "enc4to2 check failed" severity failure;
    wait;
  end process;
end architecture sim;
