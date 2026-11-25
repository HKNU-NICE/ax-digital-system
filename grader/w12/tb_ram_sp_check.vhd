--------------------------------------------------------------------
-- 과제 자동 확인 : ram_sp (단일 포트 동기 RAM, 16 x 8)
--   핵심 두 가지
--     ① 읽기 데이터는 주소를 준 "다음" 클록에 나온다 (동기 읽기)
--     ② 같은 클록에 같은 주소를 쓰면서 읽으면 "옛 값" 이 나온다 (read-old-data)
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use std.textio.all;

entity tb_ram_sp_check is end entity tb_ram_sp_check;

architecture sim of tb_ram_sp_check is
  signal clk  : std_logic := '0';
  signal we   : std_logic := '0';
  signal addr : std_logic_vector(3 downto 0) := (others => '0');
  signal din  : std_logic_vector(7 downto 0) := (others => '0');
  signal dout : std_logic_vector(7 downto 0);
  constant MAX_SHOW : integer := 8;

  type mem_t is array (0 to 15) of integer;
begin
  dut : entity work.ram_sp
    generic map (AW => 4, DW => 8)
    port map (clk => clk, we => we, addr => addr, din => din, dout => dout);

  clkgen : process
  begin
    clk <= '0'; wait for 5 ns;
    loop clk <= '1'; wait for 5 ns; clk <= '0'; wait for 5 ns; end loop;
  end process;

  check : process
    variable m      : mem_t := (others => 0);
    variable expect : integer := 0;        -- 이번 에지 뒤에 dout 에 나와야 할 값
    variable bad    : integer := 0;
    variable shown  : integer := 0;
    variable seed   : integer := 2024;
    variable wev, av, dv : integer;
    variable l      : line;
    procedure nx (v : inout integer) is
    begin
      v := (v * 75 + 74) mod 65537;
    end procedure;
  begin
    -- 먼저 열여섯 칸을 모두 채운다
    for a in 0 to 15 loop
      we   <= '1';
      addr <= std_logic_vector(to_unsigned(a, 4));
      din  <= std_logic_vector(to_unsigned((a * 7 + 3) mod 256, 8));
      wait until rising_edge(clk);
      m(a) := (a * 7 + 3) mod 256;
      wait for 1 ns;
    end loop;

    for i in 1 to 400 loop
      nx(seed); if (seed mod 3) = 0 then wev := 1; else wev := 0; end if;
      nx(seed); av := seed mod 16;
      nx(seed); dv := seed mod 256;

      we   <= '0'; if wev = 1 then we <= '1'; end if;
      addr <= std_logic_vector(to_unsigned(av, 4));
      din  <= std_logic_vector(to_unsigned(dv, 8));

      expect := m(av);                      -- read-old-data : 쓰기 전의 값
      wait until rising_edge(clk);
      if wev = 1 then m(av) := dv; end if;
      wait for 1 ns;

      if to_integer(unsigned(dout)) /= expect then
        bad := bad + 1;
        if shown < MAX_SHOW then
          shown := shown + 1;
          write(l, string'("MISMATCH step ") & integer'image(i) &
                   string'("  addr=") & integer'image(av) &
                   string'(" we=") & integer'image(wev) &
                   string'("  dout=") & integer'image(to_integer(unsigned(dout))) &
                   string'("  expected=") & integer'image(expect) &
                   string'("  (read-old-data)"));
          writeline(output, l);
        end if;
      end if;
    end loop;

    write(l, string'("== Week 12 task : single-port synchronous RAM ==")); writeline(output, l);
    write(l, string'("cases   : 16 fills + 400 random accesses"));          writeline(output, l);
    write(l, string'("mismatch: ") & integer'image(bad));                   writeline(output, l);
    if bad = 0 then write(l, string'("RESULT  : PASS"));
    else            write(l, string'("RESULT  : FAIL")); end if;
    writeline(output, l);
    assert bad = 0 report "ram_sp check failed" severity failure;
    wait;
  end process;
end architecture sim;
