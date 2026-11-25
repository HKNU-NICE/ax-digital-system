--------------------------------------------------------------------
-- 과제 자동 확인 : counter_mod (generic 으로 모듈러스를 바꾸는 카운터)
--   같은 부품을 MODULUS=10 과 MODULUS=6 두 벌로 놓고 동시에 검사한다.
--   carry 는 "en=1 이고 마지막 값일 때" 1 이어야 한다 (조합 출력).
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_counter_mod_check is end entity tb_counter_mod_check;

architecture sim of tb_counter_mod_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal en    : std_logic := '0';
  signal q10   : unsigned(3 downto 0);
  signal q6    : unsigned(2 downto 0);
  signal c10, c6 : std_logic;
  constant MAX_SHOW : integer := 8;
begin
  d10 : entity work.counter_mod
    generic map (MODULUS => 10, WIDTH => 4)
    port map (clk => clk, reset => reset, en => en, q => q10, carry => c10);

  d6 : entity work.counter_mod
    generic map (MODULUS => 6, WIDTH => 3)
    port map (clk => clk, reset => reset, en => en, q => q6, carry => c6);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable w10, w6 : integer := 0;
    variable seed  : integer := 31415;
    variable ev, rv : integer;
    variable x10, x6 : std_logic;
    variable l     : line;
    procedure nxt (x : inout integer) is
    begin
      x := (x * 75 + 74) mod 65537;
    end procedure;
  begin
    reset <= '1'; en <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    w10 := 0; w6 := 0;

    for i in 1 to 150 loop
      nxt(seed); if (seed mod 5) = 0 then ev := 0; else ev := 1; end if;
      nxt(seed); if (seed mod 40) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      en    <= '0'; if ev = 1 then en    <= '1'; end if;
      wait for 1 ns;

      -- carry 는 에지 전에 이미 조합으로 정해져 있어야 한다
      if ev = 1 and w10 = 9 then x10 := '1'; else x10 := '0'; end if;
      if ev = 1 and w6  = 5 then x6  := '1'; else x6  := '0'; end if;
      if rv = 0 and (c10 /= x10 or c6 /= x6) then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH carry step ") & integer'image(i) &
                   string'("  q10=") & integer'image(w10) &
                   string'(" en=") & integer'image(ev) &
                   string'("  carry10=") & std_logic'image(c10) &
                   string'(" expected=") & std_logic'image(x10));
          writeline(output, l);
        end if;
      end if;

      wait until rising_edge(clk);
      if rv = 1 then
        w10 := 0; w6 := 0;
      elsif ev = 1 then
        w10 := (w10 + 1) mod 10;
        w6  := (w6  + 1) mod 6;
      end if;
      wait for 1 ns;

      if to_integer(q10) /= w10 or to_integer(q6) /= w6 then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  q10=") & integer'image(to_integer(q10)) &
                   string'(" expected=") & integer'image(w10) &
                   string'("   q6=") & integer'image(to_integer(q6)) &
                   string'(" expected=") & integer'image(w6));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 07 task : modulo counter (generic) ==")); writeline(output, l);
    write(l, string'("cases   : 150 steps x 2 instances (MODULUS 10, 6)")); writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));                writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "counter_mod check failed" severity failure;
    wait;
  end process;
end architecture sim;
