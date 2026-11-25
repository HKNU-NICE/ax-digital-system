--------------------------------------------------------------------
-- 실습 자동 확인 : counter4 (동기 리셋 · 인에이블 · 15 에서 0 으로 되돌아감)
--   무작위 en / reset 으로 120 클록을 돌리고 max 출력까지 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_counter4_down_check is end entity tb_counter4_down_check;

architecture sim of tb_counter4_down_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal en    : std_logic := '0';
  signal q     : std_logic_vector(3 downto 0);
  signal min   : std_logic;
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.counter4_down
    port map (clk => clk, reset => reset, en => en, q => q, min => min);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable want  : integer := 0;
    variable seed  : integer := 777;
    variable ev, rv : integer;
    variable wmin  : std_logic;
    variable l     : line;
    procedure nxt (x : inout integer) is
    begin
      x := (x * 75 + 74) mod 65537;
    end procedure;
  begin
    reset <= '1'; en <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    want := 0;

    for i in 1 to 120 loop
      nxt(seed); if (seed mod 4) = 0 then ev := 0; else ev := 1; end if;
      nxt(seed); if (seed mod 20) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      en    <= '0'; if ev = 1 then en    <= '1'; end if;

      wait until rising_edge(clk);
      if rv = 1 then want := 0;
      elsif ev = 1 then want := (want + 15) mod 16;   -- -1 과 같다
      end if;
      wait for 1 ns;

      if want = 0 then wmin := '1'; else wmin := '0'; end if;

      if to_integer(unsigned(q)) /= want or min /= wmin then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  reset=") & integer'image(rv) &
                   string'(" en=") & integer'image(ev) &
                   string'("  q=") & integer'image(to_integer(unsigned(q))) &
                   string'(" min=") & std_logic'image(min) &
                   string'("  expected q=") & integer'image(want) &
                   string'(" min=") & std_logic'image(wmin));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 07 task : 4-bit down counter =="));  writeline(output, l);
    write(l, string'("cases   : 120 clocked steps"));      writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));  writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "counter4_down check failed" severity failure;
    wait;
  end process;
end architecture sim;
