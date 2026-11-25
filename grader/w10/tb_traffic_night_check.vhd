--------------------------------------------------------------------
-- Week 10 task check : traffic_night (traffic_light + night blink)
--   random tick / walk / night over 800 clocks, compared against the
--   model in this testbench on every clock.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_traffic_night_check is end entity tb_traffic_night_check;

architecture sim of tb_traffic_night_check is
  constant T_G  : integer := 6;
  constant T_Y  : integer := 2;
  constant T_R  : integer := 4;
  constant T_M  : integer := 2;
  constant T_B  : integer := 1;

  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal tick  : std_logic := '0';
  signal walk  : std_logic := '0';
  signal night : std_logic := '0';
  signal light : std_logic_vector(2 downto 0);
  signal stc   : std_logic_vector(1 downto 0);
  signal secs  : std_logic_vector(3 downto 0);
  signal wrq   : std_logic;
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.traffic_night
    generic map (T_GREEN => 6, T_YELLOW => 2, T_RED => 4, T_MIN => 2, T_BLINK => 1)
    port map (clk => clk, reset => reset, tick => tick, walk => walk, night => night,
              light => light, state_code => stc, secs => secs, walk_rq_o => wrq);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    -- model states : 0=GREEN 1=YELLOW 2=RED 3=BLINK_ON 4=BLINK_OFF
    variable st, cnt : integer := 0;
    variable mwrq    : integer := 0;
    variable bad     : integer := 0;
    variable shown   : integer := 0;
    variable seed    : integer := 8642;
    variable tv, wv, rv : integer;
    variable nv      : integer := 0;
    variable nhold   : integer := 0;
    variable expire  : boolean;
    variable oldw    : integer;
    variable was_g   : boolean;
    variable nxt_st  : integer;
    variable wlight  : std_logic_vector(2 downto 0);
    variable wstc    : std_logic_vector(1 downto 0);
    variable l       : line;
    procedure nx (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;
  begin
    reset <= '1'; tick <= '0'; walk <= '0'; night <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    st := 2; cnt := 0; mwrq := 0;          -- reset starts in RED

    for i in 1 to 800 loop
      nx(seed); if (seed mod 3)   = 0 then tv := 1; else tv := 0; end if;
      nx(seed); if (seed mod 25)  = 0 then wv := 1; else wv := 0; end if;
      nx(seed); if (seed mod 200) = 0 then rv := 1; else rv := 0; end if;
      -- night is a switch : hold its level for a stretch, then flip
      if nhold = 0 then
        nx(seed); nhold := 8 + (seed mod 25);
        nx(seed); if (seed mod 2) = 0 then nv := 1; else nv := 0; end if;
      end if;
      nhold := nhold - 1;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      tick  <= '0'; if tv = 1 then tick  <= '1'; end if;
      walk  <= '0'; if wv = 1 then walk  <= '1'; end if;
      night <= '0'; if nv = 1 then night <= '1'; end if;

      wait until rising_edge(clk);
      if rv = 1 then
        st := 2; cnt := 0; mwrq := 0;
      else
        oldw   := mwrq;
        was_g  := (st = 0);
        expire := false;
        nxt_st := st;
        if tv = 1 then
          case st is
            when 0 => nxt_st := 1;
                      if cnt = T_G - 1 or (oldw = 1 and cnt >= T_M - 1) then expire := true; end if;
            when 1 => nxt_st := 2;
                      if cnt = T_Y - 1 then expire := true; end if;
            when 2 => if nv = 1 then nxt_st := 3; else nxt_st := 0; end if;
                      if cnt = T_R - 1 then expire := true; end if;
            when 3 => if nv = 1 then nxt_st := 4; else nxt_st := 2; end if;
                      if cnt = T_B - 1 then expire := true; end if;
            when others => if nv = 1 then nxt_st := 3; else nxt_st := 2; end if;
                      if cnt = T_B - 1 then expire := true; end if;
          end case;
          if expire then st := nxt_st; cnt := 0;
          else           cnt := cnt + 1;
          end if;
        end if;
        mwrq := oldw;
        if wv = 1 then mwrq := 1; end if;
        if tv = 1 and expire and was_g then mwrq := 0; end if;
      end if;
      wait for 1 ns;

      case st is
        when 0      => wlight := "001"; wstc := "00";
        when 1      => wlight := "010"; wstc := "01";
        when 2      => wlight := "100"; wstc := "10";
        when 3      => wlight := "010"; wstc := "11";
        when others => wlight := "000"; wstc := "11";
      end case;

      if light /= wlight or stc /= wstc or
         to_integer(unsigned(secs)) /= cnt or
         (wrq = '1') /= (mwrq = 1) then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  tick=") & integer'image(tv) &
                   string'(" walk=") & integer'image(wv) &
                   string'(" night=") & integer'image(nv) &
                   string'("  expected state=") & integer'image(st) &
                   string'(" light=") & string'(integer'image(to_integer(unsigned(wlight)))) &
                   string'(" secs=") & integer'image(cnt) &
                   string'("   got light=") & integer'image(to_integer(unsigned(light))) &
                   string'(" secs=") & integer'image(to_integer(unsigned(secs))));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 10 task : night blink mode ==")); writeline(output, l);
    write(l, string'("cases   : 800 clocked steps"));           writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));       writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "traffic_night check failed" severity failure;
    wait;
  end process;
end architecture sim;
