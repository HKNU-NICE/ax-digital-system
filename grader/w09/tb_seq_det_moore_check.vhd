--------------------------------------------------------------------
-- 실습 자동 확인 : seq_det_moore ("1011" 검출, 겹침 허용)
--   무작위 비트열 400개를 넣고 det 와 state_code 를 매 클록 검사한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_seq_det_moore_check is end entity tb_seq_det_moore_check;

architecture sim of tb_seq_det_moore_check is
  signal clk   : std_logic := '0';
  signal reset : std_logic := '0';
  signal en    : std_logic := '0';
  signal x     : std_logic := '0';
  signal det   : std_logic;
  signal stc   : std_logic_vector(2 downto 0);
  constant MAX_SHOW : integer := 8;
begin
  dut : entity work.seq_det_moore
    port map (clk => clk, reset => reset, en => en, x => x,
              det => det, state_code => stc);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    -- 상태 : 0=S0 1=S1 2=S10 3=S101 4=S1011
    variable st    : integer := 0;
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable seed  : integer := 54321;
    variable xv, ev, rv : integer;
    variable l     : line;
    procedure nxt (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;

    function step (s : integer; b : integer) return integer is
    begin
      case s is
        when 0 => if b = 1 then return 1; else return 0; end if;
        when 1 => if b = 1 then return 1; else return 2; end if;
        when 2 => if b = 1 then return 3; else return 0; end if;
        when 3 => if b = 1 then return 4; else return 2; end if;
        when others => if b = 1 then return 1; else return 2; end if;
      end case;
    end function;
  begin
    reset <= '1'; en <= '0'; x <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    st := 0;

    for i in 1 to 400 loop
      nxt(seed); xv := seed mod 2;
      nxt(seed); if (seed mod 6) = 0 then ev := 0; else ev := 1; end if;
      nxt(seed); if (seed mod 60) = 0 then rv := 1; else rv := 0; end if;

      reset <= '0'; if rv = 1 then reset <= '1'; end if;
      en    <= '0'; if ev = 1 then en    <= '1'; end if;
      x     <= '0'; if xv = 1 then x     <= '1'; end if;

      wait until rising_edge(clk);
      if rv = 1 then st := 0;
      elsif ev = 1 then st := step(st, xv);
      end if;
      wait for 1 ns;

      if (det = '1') /= (st = 4) then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH det step ") & integer'image(i) &
                   string'("  expected state=") & integer'image(st) &
                   string'("  det=") & std_logic'image(det));
          writeline(output, l);
        end if;
      end if;

      if to_integer(unsigned(stc)) /= st then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH state_code step ") & integer'image(i) &
                   string'("  expected=") & integer'image(st));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Lab 7 : 1011 sequence detector (Moore) ==")); writeline(output, l);
    write(l, string'("cases   : 400 clocked steps"));                   writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));               writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "seq_det_moore check failed" severity failure;
    wait;
  end process;
end architecture sim;
