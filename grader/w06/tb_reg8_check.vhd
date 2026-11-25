--------------------------------------------------------------------
-- 실습 자동 확인 : reg8 (동기 리셋 + 클록 인에이블)
--   64가지 무작위 자극으로 "유지 / 로드 / 리셋" 세 동작을 모두 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_reg8_check is end entity tb_reg8_check;

architecture sim of tb_reg8_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal en    : std_logic := '0';
  signal d, q  : std_logic_vector(7 downto 0) := (others => '0');
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
  dut : entity work.reg8 port map (clk => clk, reset => reset, en => en, d => d, q => q);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable want  : integer := 0;
    variable seed  : integer := 1234;
    variable dv, rv, ev : integer;
    variable l     : line;

    procedure nxt (x : inout integer) is
    begin
      x := (x * 75 + 74) mod 65537;      -- 넘침 없는 작은 난수기
    end procedure;
  begin
    reset <= '1'; en <= '0'; d <= (others => '0');
    wait until rising_edge(clk); wait for 1 ns;
    want := 0;

    for i in 1 to 64 loop
      nxt(seed); dv := seed mod 256;
      nxt(seed); ev := seed mod 2;
      nxt(seed); if (seed mod 8) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      en    <= '0'; if ev = 1 then en    <= '1'; end if;
      d     <= std_logic_vector(to_unsigned(dv, 8));

      wait until rising_edge(clk);
      if rv = 1 then want := 0;
      elsif ev = 1 then want := dv;
      end if;                                -- 그 외에는 유지
      wait for 1 ns;

      if to_integer(unsigned(q)) /= want then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  reset=") & integer'image(rv) &
                   string'(" en=") & integer'image(ev) &
                   string'(" d=") & img(d) &
                   string'("  q=") & img(q) &
                   string'("  expected=") & integer'image(want));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Lab 5 : 8-bit register with enable =="));  writeline(output, l);
    write(l, string'("cases   : 64 clocked steps"));                 writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));            writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "reg8 check failed" severity failure;
    wait;
  end process;
end architecture sim;
