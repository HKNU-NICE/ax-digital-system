--------------------------------------------------------------------
-- 과제 자동 확인 : clock_mmss_lap
--   lap='1' 인 동안 표시는 멈추되 시계는 계속 가야 한다.
--   lap 을 내리면 그동안 흘러간 시간이 한꺼번에 나타난다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;
use work.seg_pkg.all;

entity tb_clock_mmss_lap_check is end entity tb_clock_mmss_lap_check;

architecture sim of tb_clock_mmss_lap_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal tick  : std_logic := '0';
  signal hold  : std_logic := '0';
  signal lap   : std_logic := '0';
  signal dg    : seg_array_t(3 downto 0);
  signal mm, ss : unsigned(7 downto 0);
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.clock_mmss_lap
    port map (clk => clk, reset => reset, tick => tick, hold => hold, lap => lap,
              digits => dg, mm => mm, ss => ss);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable total : integer := 0;        -- 속으로 흘러간 초
    variable shown_s : integer := 0;      -- 표시되고 있는 초
    variable prev_total : integer := 0;   -- 에지 전의 total (표시 레지스터가 받는 값)
    variable bad   : integer := 0;
    variable nshow : integer := 0;
    variable seed  : integer := 97531;
    variable tv, hv, lv, rv : integer;
    variable wss, wmm, wss_b, wmm_b : integer;
    variable l     : line;
    procedure nx (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;
  begin
    reset <= '1'; tick <= '0'; hold <= '0'; lap <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    total := 0; shown_s := 0;

    for i in 1 to 800 loop
      nx(seed); if (seed mod 2) = 0 then tv := 1; else tv := 0; end if;
      nx(seed); if (seed mod 11) = 0 then hv := 1; else hv := 0; end if;
      nx(seed); if (seed mod 4) = 0 then lv := 1; else lv := 0; end if;
      nx(seed); if (seed mod 400) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      tick  <= '0'; if tv = 1 then tick  <= '1'; end if;
      hold  <= '0'; if hv = 1 then hold  <= '1'; end if;
      lap   <= '0'; if lv = 1 then lap   <= '1'; end if;

      prev_total := total;
      wait until rising_edge(clk);
      if rv = 1 then
        total := 0; shown_s := 0;
      else
        if lv = 0 then shown_s := prev_total; end if;   -- 표시 레지스터는 에지 전 값을 받는다
        if tv = 1 and hv = 0 then total := (total + 1) mod 3600; end if;
      end if;
      wait for 1 ns;

      wss := shown_s mod 60;
      wmm := shown_s / 60;
      wss_b := (wss / 10) * 16 + (wss mod 10);
      wmm_b := (wmm / 10) * 16 + (wmm mod 10);

      if to_integer(ss) /= wss_b or to_integer(mm) /= wmm_b then
        bad := bad + 1;
        if nshow < MAX_SHOW then
          nshow := nshow + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  lap=") & integer'image(lv) &
                   string'("  inside=") & integer'image(total) &
                   string'("s  expected shown=") & integer'image(wmm) &
                   string'(":") & integer'image(wss));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 11 task : mm:ss clock with lap ==")); writeline(output, l);
    write(l, string'("cases   : 800 clocked steps"));                writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));            writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "clock_mmss_lap check failed" severity failure;
    wait;
  end process;
end architecture sim;
