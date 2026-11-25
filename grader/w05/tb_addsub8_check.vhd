--------------------------------------------------------------------
-- 과제 자동 확인 : addsub8 을 전수 검사한다.
--   a 256 x b 256 x sub 2 = 131,072 가지.
--   "몇 가지를 검사해야 전수가 되는가" 가 과제의 질문이므로, 채점기는 전수로 돈다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_addsub8_check is end entity tb_addsub8_check;

architecture sim of tb_addsub8_check is
  signal a, b, r : std_logic_vector(7 downto 0);
  signal sub, c, v : std_logic;
  constant MAX_SHOW : integer := 8;

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
  dut : entity work.addsub8
    port map (a => a, b => b, sub => sub, r => r, c => c, v => v);

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable wr    : integer;
    variable wc, wv : std_logic;
    variable sa, sb, sr : integer;
    variable l     : line;
  begin
    for su in 0 to 1 loop
      if su = 0 then sub <= '0'; else sub <= '1'; end if;
      for av in 0 to 255 loop
        a <= std_logic_vector(to_unsigned(av, 8));
        for bv in 0 to 255 loop
          b <= std_logic_vector(to_unsigned(bv, 8));
          wait for 1 ns;

          if su = 0 then
            wr := (av + bv) mod 256;
            if av + bv > 255 then wc := '1'; else wc := '0'; end if;
          else
            wr := (av - bv + 256) mod 256;
            if av >= bv then wc := '1'; else wc := '0'; end if;
          end if;

          if av > 127 then sa := av - 256; else sa := av; end if;
          if bv > 127 then sb := bv - 256; else sb := bv; end if;
          if su = 0 then sr := sa + sb; else sr := sa - sb; end if;
          if sr > 127 or sr < -128 then wv := '1'; else wv := '0'; end if;

          if to_integer(unsigned(r)) /= wr or c /= wc or v /= wv then
            bad := bad + 1;
            if shown < MAX_SHOW then
              shown := shown + 1;
              write(l, string'("MISMATCH sub=") & integer'image(su) &
                       string'(" a=") & img(a) & string'(" b=") & img(b) &
                       string'("  r=") & img(r) &
                       string'(" c=") & std_logic'image(c) &
                       string'(" v=") & std_logic'image(v) &
                       string'("   expected r=") & integer'image(wr) &
                       string'(" c=") & std_logic'image(wc) &
                       string'(" v=") & std_logic'image(wv));
              writeline(output, l);
            end if;
          end if;
        end loop;
      end loop;
    end loop;

    write(l, string'("== Week 05 task : 8-bit adder/subtractor ==")); writeline(output, l);
    write(l, string'("cases   : 131072  (256 x 256 x 2)"));           writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));             writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "addsub8 check failed" severity failure;
    wait;
  end process;
end architecture sim;
