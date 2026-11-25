--------------------------------------------------------------------
-- 실습 자동 확인 : clock_mmss (counter_mod 네 벌 + package)
--   무작위 tick / hold 로 800클록을 돌리며 mm:ss 를 BCD 로 검사한다.
--   59:59 다음이 00:00 인지까지 보려면 긴 구간이 필요하므로 tick 을 자주 준다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;
use work.seg_pkg.all;

entity tb_clock_mmss_check is end entity tb_clock_mmss_check;

architecture sim of tb_clock_mmss_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal tick  : std_logic := '0';
  signal hold  : std_logic := '0';
  signal dg    : seg_array_t(3 downto 0);
  signal mm, ss : unsigned(7 downto 0);
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.clock_mmss
    port map (clk => clk, reset => reset, tick => tick, hold => hold,
              digits => dg, mm => mm, ss => ss);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable total : integer := 0;           -- 흘러간 초
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable seed  : integer := 8642;
    variable tv, hv, rv : integer;
    variable wss, wmm   : integer;
    variable wss_b, wmm_b : integer;         -- BCD 로 바꾼 값
    variable l     : line;
    procedure nx (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;
  begin
    reset <= '1'; tick <= '0'; hold <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    total := 0;

    for i in 1 to 800 loop
      nx(seed); if (seed mod 2) = 0 then tv := 1; else tv := 0; end if;
      nx(seed); if (seed mod 9) = 0 then hv := 1; else hv := 0; end if;
      nx(seed); if (seed mod 400) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      tick  <= '0'; if tv = 1 then tick  <= '1'; end if;
      hold  <= '0'; if hv = 1 then hold  <= '1'; end if;

      wait until rising_edge(clk);
      if rv = 1 then total := 0;
      elsif tv = 1 and hv = 0 then total := (total + 1) mod 3600;
      end if;
      wait for 1 ns;

      wss := total mod 60;
      wmm := total / 60;
      wss_b := (wss / 10) * 16 + (wss mod 10);
      wmm_b := (wmm / 10) * 16 + (wmm mod 10);

      if to_integer(ss) /= wss_b or to_integer(mm) /= wmm_b then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  elapsed=") & integer'image(total) &
                   string'("s  expected mm:ss=") & integer'image(wmm) &
                   string'(":") & integer'image(wss) &
                   string'("   got ss=0x") & integer'image(to_integer(ss)));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Lab 9 : mm:ss clock (hierarchy) ==")); writeline(output, l);
    write(l, string'("cases   : 800 clocked steps"));           writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));       writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "clock_mmss check failed" severity failure;
    wait;
  end process;
end architecture sim;
