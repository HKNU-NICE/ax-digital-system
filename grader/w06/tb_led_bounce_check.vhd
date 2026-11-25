-- 과제 6 채점기 : led_bounce 를 무작위 en 300클록으로 모델과 비교
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_led_bounce_check is end;
architecture t of tb_led_bounce_check is
  signal clk, reset, en, dir : std_logic := '0';
  signal q : std_logic_vector(9 downto 0);
  signal done : boolean := false;
begin
  clk <= not clk after 10 ns when not done else '0';
  dut : entity work.led_bounce port map (clk => clk, reset => reset, en => en, q => q, dir => dir);
  process
    variable pos : integer := 0; variable dr : integer := 0;      -- 모델
    variable seed : unsigned(15 downto 0) := x"ACE1";
    variable errs : natural := 0;
    variable exp : std_logic_vector(9 downto 0);
    procedure check (step : integer) is
    begin
      exp := (others => '0'); exp(pos) := '1';
      if q /= exp or dir /= std_logic(to_unsigned(dr, 1)(0)) then
        errs := errs + 1;
        if errs <= 5 then
          report "MISMATCH step " & integer'image(step) & "  reset=" & std_logic'image(reset)(2) &
                 " en=" & std_logic'image(en)(2) & "  q=" & to_string(q) & " dir=" & std_logic'image(dir)(2) &
                 "  expected q=" & to_string(exp) & " dir=" & integer'image(dr) severity error;
        end if;
      end if;
    end procedure;
  begin
    reset <= '1'; wait until falling_edge(clk); wait until falling_edge(clk);
    pos := 0; dr := 0; check(0);
    for i in 1 to 300 loop
      seed := seed(14 downto 0) & (seed(15) xor seed(13) xor seed(12) xor seed(10));
      reset <= '1' when (i = 150) else '0';
      en <= seed(0) or seed(3);
      wait until falling_edge(clk);
      if reset = '1' then pos := 0; dr := 0;
      elsif en = '1' then
        if dr = 0 then if pos = 9 then dr := 1; pos := 8; else pos := pos + 1; end if;
        else           if pos = 0 then dr := 0; pos := 1; else pos := pos - 1; end if;
        end if;
      end if;
      check(i);
    end loop;
    report "mismatch: " & integer'image(errs);
    if errs = 0 then report "RESULT  : PASS"; else report "RESULT  : FAIL" severity error; end if;
    done <= true; wait;
  end process;
end architecture;
