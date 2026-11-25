--------------------------------------------------------------------
-- Week 11 task check : clock_hhmmss (six counter_mod + package)
--   phase 1 : random tick / hold / reset for 1500 clocks
--   phase 2 : tick on every clock through a full day, so 23:59:59 -> 00:00:00
--             is actually exercised (86400 seconds)
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;
use work.seg_pkg.all;

entity tb_clock_hhmmss_check is end entity tb_clock_hhmmss_check;

architecture sim of tb_clock_hhmmss_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal tick  : std_logic := '0';
  signal hold  : std_logic := '0';
  signal dg    : seg_array_t(5 downto 0);
  signal hh, mm, ss : unsigned(7 downto 0);
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.clock_hhmmss
    port map (clk => clk, reset => reset, tick => tick, hold => hold,
              digits => dg, hh => hh, mm => mm, ss => ss);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable total : integer := 0;           -- seconds since midnight
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable seed  : integer := 1731;
    variable tv, hv, rv : integer;
    variable wss, wmm, whh : integer;
    variable bss, bmm, bhh : integer;
    variable l     : line;
    procedure nx (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;
    procedure note (i : integer; tag : string) is
    begin
      bad := bad + 1;
      if shown < MAX_SHOW then
        shown := shown + 1;
        write(l, string'("MISMATCH ") & tag & string'(" step ") & integer'image(i) &
                 string'("  expected ") & integer'image(whh / 16) & integer'image(whh mod 16) &
                 string'(":") & integer'image(wmm / 16) & integer'image(wmm mod 16) &
                 string'(":") & integer'image(wss / 16) & integer'image(wss mod 16) &
                 string'("   got ") & integer'image(to_integer(hh) / 16) & integer'image(to_integer(hh) mod 16) &
                 string'(":") & integer'image(to_integer(mm) / 16) & integer'image(to_integer(mm) mod 16) &
                 string'(":") & integer'image(to_integer(ss) / 16) & integer'image(to_integer(ss) mod 16));
        writeline(output, l);
      end if;
    end procedure;
  begin
    reset <= '1'; tick <= '0'; hold <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    total := 0;

    -- phase 1 : random
    for i in 1 to 1500 loop
      nx(seed); if (seed mod 2) = 0 then tv := 1; else tv := 0; end if;
      nx(seed); if (seed mod 9) = 0 then hv := 1; else hv := 0; end if;
      nx(seed); if (seed mod 500) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      tick  <= '0'; if tv = 1 then tick  <= '1'; end if;
      hold  <= '0'; if hv = 1 then hold  <= '1'; end if;

      wait until rising_edge(clk);
      if rv = 1 then total := 0;
      elsif tv = 1 and hv = 0 then total := (total + 1) mod 86400;
      end if;
      wait for 1 ns;

      wss := total mod 60;             wmm := (total / 60) mod 60;  whh := total / 3600;
      bss := (wss / 10) * 16 + wss mod 10;
      bmm := (wmm / 10) * 16 + wmm mod 10;
      bhh := (whh / 10) * 16 + whh mod 10;
      whh := bhh; wmm := bmm; wss := bss;    -- for the message
      if to_integer(ss) /= bss or to_integer(mm) /= bmm or to_integer(hh) /= bhh then
        note(i, "rnd");
      end if;
    end loop;

    -- phase 2 : one full day, tick every clock
    reset <= '1'; tick <= '0'; hold <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    total := 0;
    reset <= '0'; tick <= '1';

    for i in 1 to 86401 loop
      wait until rising_edge(clk);
      total := (total + 1) mod 86400;
      wait for 1 ns;
      wss := total mod 60;             wmm := (total / 60) mod 60;  whh := total / 3600;
      bss := (wss / 10) * 16 + wss mod 10;
      bmm := (wmm / 10) * 16 + wmm mod 10;
      bhh := (whh / 10) * 16 + whh mod 10;
      whh := bhh; wmm := bmm; wss := bss;
      if to_integer(ss) /= bss or to_integer(mm) /= bmm or to_integer(hh) /= bhh then
        note(i, "day");
      end if;
      -- the six segment outputs must follow the six digits
      if dg(0) /= digit2seg(to_unsigned(total mod 10, 4)) or
         dg(1) /= digit2seg(to_unsigned((total mod 60) / 10, 4)) or
         dg(2) /= digit2seg(to_unsigned((total / 60) mod 10, 4)) or
         dg(3) /= digit2seg(to_unsigned(((total / 60) mod 60) / 10, 4)) or
         dg(4) /= digit2seg(to_unsigned((total / 3600) mod 10, 4)) or
         dg(5) /= digit2seg(to_unsigned((total / 3600) / 10, 4)) then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH seg step ") & integer'image(i) &
                   string'("  : digits does not match the digit values (use digit2seg per digit)"));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 11 task : hh:mm:ss clock =="));            writeline(output, l);
    write(l, string'("cases   : 1500 random + 86401 one-day steps"));    writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));                writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "clock_hhmmss check failed" severity failure;
    wait;
  end process;
end architecture sim;
