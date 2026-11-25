-- seg_pkg.vhd : 7-세그먼트 관련 타입·상수·함수를 한 곳에 (package)
--  다른 파일에서 use work.seg_pkg.all; 로 가져다 쓴다
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

package seg_pkg is
  subtype seg_t is std_logic_vector(6 downto 0);          -- (g f e d c b a), active-low (DE1-SoC)
  type seg_array_t is array (natural range <>) of seg_t;   -- 여러 자리 묶음
  constant SEG_OFF : seg_t := "1111111";

  function hex2seg(d : std_logic_vector(3 downto 0)) return seg_t;   -- 0..F -> 세그먼트
  function digit2seg(d : unsigned(3 downto 0)) return seg_t;        -- unsigned 판
end package seg_pkg;

package body seg_pkg is
  function hex2seg(d : std_logic_vector(3 downto 0)) return seg_t is
  begin
    case d is
      when x"0" => return "1000000"; when x"1" => return "1111001";
      when x"2" => return "0100100"; when x"3" => return "0110000";
      when x"4" => return "0011001"; when x"5" => return "0010010";
      when x"6" => return "0000010"; when x"7" => return "1111000";
      when x"8" => return "0000000"; when x"9" => return "0010000";
      when x"A" => return "0001000"; when x"B" => return "0000011";
      when x"C" => return "1000110"; when x"D" => return "0100001";
      when x"E" => return "0000110"; when others => return "0001110";
    end case;
  end function;

  function digit2seg(d : unsigned(3 downto 0)) return seg_t is
  begin
    return hex2seg(std_logic_vector(d));
  end function;
end package body seg_pkg;
