--------------------------------------------------------------------
-- 실습 자동 확인 : reg_file (동기 쓰기 1포트 + 조합 읽기 2포트)
--   무작위 300클록으로 쓰기·읽기·리셋을 검사한다.
--   읽기는 조합이므로 "주소를 준 그 순간" 값이 나와야 한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_reg_file_check is end entity tb_reg_file_check;

architecture sim of tb_reg_file_check is
  signal clk    : std_logic := '0';
  signal reset  : std_logic := '0';
  signal we     : std_logic := '0';
  signal waddr, raddr1, raddr2 : std_logic_vector(1 downto 0) := "00";
  signal wdata  : std_logic_vector(3 downto 0) := "0000";
  signal rdata1, rdata2 : std_logic_vector(3 downto 0);
  constant MAX_SHOW : integer := 8;

  type mem_t is array (0 to 3) of integer;
begin
  dut : entity work.reg_file
    generic map (NREG => 4, WIDTH => 4, AW => 2)
    port map (clk => clk, reset => reset, we => we,
              waddr => waddr, wdata => wdata,
              raddr1 => raddr1, rdata1 => rdata1,
              raddr2 => raddr2, rdata2 => rdata2);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable m     : mem_t := (others => 0);
    variable bad   : integer := 0;
    variable shown : integer := 0;
    variable seed  : integer := 13579;
    variable wev, wa, wd, r1, r2, rv : integer;
    variable l     : line;
    procedure nx (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;
  begin
    reset <= '1'; we <= '0';
    wait until rising_edge(clk); wait for 1 ns;
    m := (others => 0);

    for i in 1 to 300 loop
      nx(seed); if (seed mod 3) = 0 then wev := 0; else wev := 1; end if;
      nx(seed); wa := seed mod 4;
      nx(seed); wd := seed mod 16;
      nx(seed); r1 := seed mod 4;
      nx(seed); r2 := seed mod 4;
      nx(seed); if (seed mod 50) = 0 then rv := 1; else rv := 0; end if;

      reset  <= '0'; if rv = 1 then reset <= '1'; end if;
      we     <= '0'; if wev = 1 then we   <= '1'; end if;
      waddr  <= std_logic_vector(to_unsigned(wa, 2));
      wdata  <= std_logic_vector(to_unsigned(wd, 4));
      raddr1 <= std_logic_vector(to_unsigned(r1, 2));
      raddr2 <= std_logic_vector(to_unsigned(r2, 2));
      wait for 1 ns;

      -- 에지 전 : 읽기는 조합이므로 지금 값이 나와야 한다
      if to_integer(unsigned(rdata1)) /= m(r1) or
         to_integer(unsigned(rdata2)) /= m(r2) then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH read step ") & integer'image(i) &
                   string'("  raddr1=") & integer'image(r1) &
                   string'(" rdata1=") & integer'image(to_integer(unsigned(rdata1))) &
                   string'(" expected=") & integer'image(m(r1)));
          writeline(output, l);
        end if;
      end if;

      wait until rising_edge(clk);
      if rv = 1 then m := (others => 0);
      elsif wev = 1 then m(wa) := wd;
      end if;
      wait for 1 ns;
    end loop;

    write(l, string'("== Lab 10 : register file ==")); writeline(output, l);
    write(l, string'("cases   : 300 clocked steps"));  writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad)); writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "reg_file check failed" severity failure;
    wait;
  end process;
end architecture sim;
