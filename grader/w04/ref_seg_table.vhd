--------------------------------------------------------------------
-- Week 04 공통 : 7-세그먼트 정답표 (채점기에서만 쓴다)
--   DE1-SoC 의 HEX 는 active-low. seg(6..0) = g f e d c b a
--------------------------------------------------------------------
library ieee;
use ieee.std_logic_1164.all;

package seg_ref is
  function seg_of (d : std_logic_vector(3 downto 0)) return std_logic_vector;
end package seg_ref;

package body seg_ref is
  function seg_of (d : std_logic_vector(3 downto 0)) return std_logic_vector is
  begin
    case d is
      when "0000" => return "1000000";
      when "0001" => return "1111001";
      when "0010" => return "0100100";
      when "0011" => return "0110000";
      when "0100" => return "0011001";
      when "0101" => return "0010010";
      when "0110" => return "0000010";
      when "0111" => return "1111000";
      when "1000" => return "0000000";
      when "1001" => return "0010000";
      when "1010" => return "0001000";
      when "1011" => return "0000011";
      when "1100" => return "1000110";
      when "1101" => return "0100001";
      when "1110" => return "0000110";
      when others => return "0001110";
    end case;
  end function seg_of;
end package body seg_ref;
