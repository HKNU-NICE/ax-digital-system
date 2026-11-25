--------------------------------------------------------------------
-- 채점용 자체검사 테스트벤치  (학생 배포 금지)
--   가산 256 + 감산 256 = 512 가지 전수 검사.
--   틀린 경우 "어떤 입력에서" 틀렸는지 함께 알려 준다.
--   틀린 사례가 MAX_SHOW 개를 넘으면 더 찍지 않고 세기만 한다.
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity tb_addsub4_check is end entity;

architecture check of tb_addsub4_check is
  constant MAX_SHOW : integer := 8;

  signal sub   : std_logic := '0';
  signal a, b, r : std_logic_vector(3 downto 0) := (others => '0');
  signal c, v  : std_logic;

  function b4 (v : std_logic_vector) return string is
    variable r : string(1 to 4);
  begin
    for k in 0 to 3 loop
      if v(3 - k) = '1' then r(k + 1) := '1';
      elsif v(3 - k) = '0' then r(k + 1) := '0';
      else r(k + 1) := 'U'; end if;
    end loop;
    return r;
  end function;

  function sl (s : std_logic) return string is
  begin
    if s = '1' then return "1"; elsif s = '0' then return "0"; else return "U"; end if;
  end function;
begin
  dut : entity work.addsub4
    port map (a => a, b => b, sub => sub, r => r, c => c, v => v);

  process
    variable errs, shown : integer := 0;
    variable exp_sum, sa, sb, sr : integer;
    variable exp_c, exp_v : std_logic;

    procedure fail (what : string; got, want : string; i, j, m : integer) is
    begin
      errs := errs + 1;
      if shown < MAX_SHOW then
        shown := shown + 1;
        report what & " : " &
               "sub=" & integer'image(m) &
               "  a=" & integer'image(i) & "(" & b4(std_logic_vector(to_unsigned(i,4))) & ")" &
               "  b=" & integer'image(j) & "(" & b4(std_logic_vector(to_unsigned(j,4))) & ")" &
               "  -> got " & got & ", expected " & want
          severity note;
      end if;
    end procedure;
  begin
    for m in 0 to 1 loop
      for i in 0 to 15 loop
        for j in 0 to 15 loop
          if m = 0 then sub <= '0'; else sub <= '1'; end if;
          a <= std_logic_vector(to_unsigned(i, 4));
          b <= std_logic_vector(to_unsigned(j, 4));
          wait for 5 ns;

          if m = 0 then exp_sum := (i + j) mod 16; else exp_sum := (i - j) mod 16; end if;
          if r /= std_logic_vector(to_unsigned(exp_sum, 4)) then
            fail("R  (result)", b4(r), b4(std_logic_vector(to_unsigned(exp_sum,4))), i, j, m);
          end if;

          if m = 0 then
            if (i + j) > 15 then exp_c := '1'; else exp_c := '0'; end if;
          else
            if i < j then exp_c := '0'; else exp_c := '1'; end if;
          end if;
          if c /= exp_c then
            fail("C  (carry)", sl(c), sl(exp_c), i, j, m);
          end if;

          sa := i; if sa > 7 then sa := sa - 16; end if;
          sb := j; if sb > 7 then sb := sb - 16; end if;
          if m = 0 then sr := sa + sb; else sr := sa - sb; end if;
          if (sr > 7) or (sr < -8) then exp_v := '1'; else exp_v := '0'; end if;
          if v /= exp_v then
            fail("V  (overflow)", sl(v), sl(exp_v), i, j, m);
          end if;
        end loop;
      end loop;
    end loop;

    if errs = 0 then
      report "RESULT PASS : all 512 cases correct" severity note;
    else
      report "RESULT FAIL : " & integer'image(errs) & " of 1536 checks wrong" severity note;
      report "grading failed" severity failure;
    end if;
    wait;
  end process;
end architecture;
