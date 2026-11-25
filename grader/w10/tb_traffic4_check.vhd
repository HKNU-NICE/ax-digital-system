--------------------------------------------------------------------
-- 자동 확인 : traffic4
--   무작위 tick / walk 로 600클록을 돌리며 상태·타이머·등·요청플래그를
--   테스트벤치 안의 모델과 매 클록 대조한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_traffic4_check is end entity tb_traffic4_check;

architecture sim of tb_traffic4_check is
  constant T_G  : integer := 6;
  constant T_Y  : integer := 2;
  constant T_AR : integer := 1;
  constant T_R  : integer := 4;
  constant T_M  : integer := 2;
  constant NST  : integer := 4;          -- 상태 개수 (3 또는 4)

  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal tick  : std_logic := '0';
  signal walk  : std_logic := '0';
  signal light : std_logic_vector(2 downto 0);
  signal stc   : std_logic_vector(1 downto 0);
  signal secs  : std_logic_vector(3 downto 0);
  signal wrq   : std_logic;
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.traffic4
    generic map (T_GREEN => 6, T_YELLOW => 2, T_ALLRED => 1, T_RED => 4, T_MIN => 2)
    port map (clk => clk, reset => reset, tick => tick, walk => walk,
              light => light, state_code => stc, secs => secs, walk_rq_o => wrq);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    -- 모델 상태 : 0=GREEN 1=YELLOW 2=ALLRED 3=RED   (NST=3 이면 2 를 건너뛴다)
    variable st, cnt : integer := 0;
    variable mwrq    : integer := 0;
    variable bad     : integer := 0;
    variable shown   : integer := 0;
    variable seed    : integer := 1357;
    variable tv, wv, rv : integer;
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
    reset <= '1'; tick <= '0'; walk <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    st := 3; cnt := 0; mwrq := 0;          -- 리셋은 RED 에서 시작

    for i in 1 to 600 loop
      nx(seed); if (seed mod 3) = 0 then tv := 1; else tv := 0; end if;
      nx(seed); if (seed mod 25) = 0 then wv := 1; else wv := 0; end if;
      nx(seed); if (seed mod 120) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      tick  <= '0'; if tv = 1 then tick  <= '1'; end if;
      walk  <= '0'; if wv = 1 then walk  <= '1'; end if;

      wait until rising_edge(clk);
      if rv = 1 then
        st := 3; cnt := 0; mwrq := 0;
      else
        -- expire 는 조합 신호라 "에지 전의" walk_rq 로 정해진다 (walk 는 아직 반영 전)
        oldw   := mwrq;
        was_g  := (st = 0);
        expire := false;
        nxt_st := st;
        if tv = 1 then
          case st is
            when 0 => nxt_st := 1;
                      if cnt = T_G - 1 or (oldw = 1 and cnt >= T_M - 1) then expire := true; end if;
            when 1 => if NST = 4 then nxt_st := 2; else nxt_st := 3; end if;
                      if cnt = T_Y - 1 then expire := true; end if;
            when 2 => nxt_st := 3;
                      if cnt = T_AR - 1 then expire := true; end if;
            when others => nxt_st := 0;
                      if cnt = T_R - 1 then expire := true; end if;
          end case;
          if expire then st := nxt_st; cnt := 0;
          else           cnt := cnt + 1;
          end if;
        end if;
        -- walk_rq : walk 가 올리고, GREEN 을 떠나는 그 클록이면 다시 0 (뒤에 쓴 쪽이 이긴다)
        mwrq := oldw;
        if wv = 1 then mwrq := 1; end if;
        if tv = 1 and expire and was_g then mwrq := 0; end if;
      end if;
      wait for 1 ns;

      case st is
        when 0      => wlight := "001"; wstc := "00";
        when 1      => wlight := "010"; wstc := "01";
        when 2      => wlight := "000"; wstc := "11";
        when others => wlight := "100"; wstc := "10";
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
                   string'("  expected state=") & integer'image(st) &
                   string'(" secs=") & integer'image(cnt) &
                   string'(" walk_rq=") & integer'image(mwrq) &
                   string'("   got secs=") & integer'image(to_integer(unsigned(secs))));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 10 task : traffic light with all-red =="));                       writeline(output, l);
    write(l, string'("cases   : 600 clocked steps"));     writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad)); writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "traffic4 check failed" severity failure;
    wait;
  end process;
end architecture sim;
