--------------------------------------------------------------------
-- 실습 자동 확인 : adder4 를 512가지 입력으로 전수 검사한다.
--   a 16 x b 16 x cin 2 = 512
--   보고서 문자열은 ASCII 만 쓴다 (GHDL 이 한글 문자열을 거부한다).
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_adder4_check is
end entity tb_adder4_check;

architecture sim of tb_adder4_check is

  signal a, b, s : std_logic_vector(3 downto 0);
  signal cin, cout : std_logic;

  constant MAX_SHOW : integer := 8;

  function img(v : std_logic_vector) return string is
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

  dut : entity work.adder4
    port map ( a => a, b => b, cin => cin, s => s, cout => cout );

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable sum   : integer;
    variable es    : integer;
    variable ec    : integer;
    variable ln    : line;
  begin
    for ia in 0 to 15 loop
      for ib in 0 to 15 loop
        for ic in 0 to 1 loop

          a   <= std_logic_vector(to_unsigned(ia, 4));
          b   <= std_logic_vector(to_unsigned(ib, 4));
          if ic = 1 then cin <= '1'; else cin <= '0'; end if;
          wait for 10 ns;

          sum := ia + ib + ic;
          es  := sum mod 16;
          if sum > 15 then ec := 1; else ec := 0; end if;

          if to_integer(unsigned(s)) /= es then
            bad := bad + 1;
            if shown < MAX_SHOW then
              shown := shown + 1;
              write(ln, string'("s  (sum)   : cin=") & integer'image(ic)
                      & string'("  a=") & integer'image(ia) & string'("(") & img(a) & string'(")")
                      & string'("  b=") & integer'image(ib) & string'("(") & img(b) & string'(")")
                      & string'("  -> got ") & integer'image(to_integer(unsigned(s)))
                      & string'(", expected ") & integer'image(es));
              writeline(output, ln);
            end if;
          elsif (cout = '1' and ec = 0) or (cout = '0' and ec = 1) then
            bad := bad + 1;
            if shown < MAX_SHOW then
              shown := shown + 1;
              write(ln, string'("cout (carry) : cin=") & integer'image(ic)
                      & string'("  a=") & integer'image(ia)
                      & string'("  b=") & integer'image(ib)
                      & string'("  -> expected ") & integer'image(ec));
              writeline(output, ln);
            end if;
          end if;

        end loop;
      end loop;
    end loop;

    write(ln, string'(""));
    writeline(output, ln);
    if bad = 0 then
      write(ln, string'("RESULT PASS : all 512 cases correct"));
      writeline(output, ln);
    else
      write(ln, string'("RESULT FAIL : ") & integer'image(bad) & string'(" of 512 cases wrong"));
      writeline(output, ln);
      assert false report "adder4 check failed" severity failure;
    end if;
    wait;
  end process check;

end architecture sim;
