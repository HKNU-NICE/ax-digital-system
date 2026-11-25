from figlib import *
OUT = "site/figs"

# ---------------------------------------------------------------- 실습 : 4비트 가산기
def adder4_fig():
    f = Fig(6.5, 4.55)
    f.text(3.25, 0.16, "4bits Ripple-Carry Adder", 9.5, NAVY, bold=True)
    f.text(3.25, 0.38, "full_adder 4개를 자리올림으로 사슬처럼 잇는다", 7.4, MUTED)

    CX, CW, CH, PITCH = 2.55, 1.05, 0.70, 0.98
    CY = [0.72 + i * PITCH for i in range(4)]

    for i in range(4):
        cy = CY[i]
        f.box(CX, cy, CW, CH, "full_adder", fs=9, bold=True, fill="#DCE6F7", edge=NAVY)
        f.text(CX + CW / 2, cy + CH - 0.13, f"u{i}", 7, MUTED)
        ya, yb, yc = cy + 0.22, cy + 0.48, cy + 0.14

        f.text(0.10, ya, f"a({i})", 8, INK, ha="left")
        f.arrow([(0.78, ya), (CX, ya)], lw=1.0, head=0.06)
        f.text(0.10, yb, f"b({i})", 8, INK, ha="left")
        f.arrow([(0.78, yb), (CX, yb)], lw=1.0, head=0.06)

        f.arrow([(CX + CW, ya), (5.25, ya)], lw=1.0, head=0.07)
        f.text(5.33, ya, f"sum({i})", 8, INK, ha="left")

    # cin → u0
    f.text(0.10, 0.60, "cin", 8.5, ORANGE, ha="left", bold=True)
    f.line([(0.62, 0.60), (2.20, 0.60), (2.20, CY[0] + 0.14)], ORANGE, 1.2)
    f.arrow([(2.20, CY[0] + 0.14), (CX, CY[0] + 0.14)], ORANGE, 1.2, head=0.06)

    # 자리올림 사슬
    for i in range(3):
        yf, yt = CY[i] + 0.48, CY[i + 1] + 0.14
        f.line([(CX + CW, yf), (4.30, yf), (4.30, yt - 0.26), (2.28, yt - 0.26), (2.28, yt)], NAVY, 1.1)
        f.arrow([(2.28, yt), (CX, yt)], lw=1.1, head=0.06)
        f.text(4.38, yf - 0.02, f"tc({i})", 7.2, MUTED, ha="left")

    y3 = CY[3] + 0.48
    f.arrow([(CX + CW, y3), (5.25, y3)], lw=1.2, head=0.07)
    f.text(5.33, y3, "cout", 8, INK, ha="left", bold=True)
    f.text(4.38, y3 - 0.02, "tc(3)", 7.2, MUTED, ha="left")

    f.text(3.25, 4.42, "아랫자리의 co 가 윗자리의 ci 로 들어간다 — 이 사슬이 ripple carry 다", 7.2, MUTED)
    return f.save(f"{OUT}/adder4_block.png")


# ---------------------------------------------------------------- 과제 : 4비트 가감산기
def addsub4_fig():
    f = Fig(7.3, 5.75)
    f.text(3.65, 0.16, "4bits Adder / Subtractor", 9.5, NAVY, bold=True)
    f.text(3.65, 0.38, "sub = '0' 가산 (A + B)        sub = '1' 감산 (A − B)", 7.6, MUTED)

    CX, CW, CH, PITCH = 3.05, 1.05, 0.70, 1.02
    CY = [0.78 + i * PITCH for i in range(4)]
    OPX, OPY, GW, GH = 1.70, 0.66, 0.46, 0.42

    f.text(0.10, OPY, "sub", 8.5, ORANGE, ha="left", bold=True)
    f.line([(0.68, OPY), (OPX, OPY)], ORANGE, 1.2)
    f.line([(OPX, OPY), (OPX, CY[3] + 0.40)], ORANGE, 1.2)

    for i in range(4):
        cy = CY[i]
        f.box(CX, cy, CW, CH, "full_adder", fs=9, bold=True, fill="#DCE6F7", edge=NAVY)
        f.text(CX + CW / 2, cy + CH - 0.13, f"u{i}", 7, MUTED)
        ya, yx, yc = cy + 0.22, cy + 0.50, cy + 0.14
        gx, gy = 2.02, yx - 0.21
        yb_up, yb_lo = gy + 0.11, gy + 0.31

        f.text(0.10, ya, f"a({i})", 8, INK, ha="left")
        f.arrow([(0.95, ya), (CX, ya)], lw=1.0, head=0.06)
        f.text(0.10, yb_lo, f"b({i})", 8, INK, ha="left")
        f.arrow([(0.95, yb_lo), (f.gate_in_x(gx, gy, GW, GH, yb_lo, "XOR"), yb_lo)], lw=1.0, head=0.055)
        f.arrow([(OPX, yb_up), (f.gate_in_x(gx, gy, GW, GH, yb_up, "XOR"), yb_up)], ORANGE, 1.0, head=0.055)
        f.dot(OPX, yb_up, r=0.030, color=ORANGE)
        f.gate("XOR", gx, gy, GW, GH)
        f.arrow([(gx + GW, yx), (CX, yx)], lw=1.0, head=0.06)
        f.text(gx + GW + 0.10, yx - 0.13, f"tb_x({i})", 6.6, MUTED, ha="left")

        f.arrow([(CX + CW, ya), (5.60, ya)], lw=1.0, head=0.07)
        f.text(5.68, ya, f"sum({i})", 8, INK, ha="left")

    f.line([(OPX, OPY), (2.74, OPY), (2.74, CY[0] + 0.14)], ORANGE, 1.1)
    f.arrow([(2.74, CY[0] + 0.14), (CX, CY[0] + 0.14)], ORANGE, 1.1, head=0.06)

    for i in range(3):
        yf, yt = CY[i] + 0.50, CY[i + 1] + 0.14
        f.line([(CX + CW, yf), (4.48, yf), (4.48, yt - 0.28), (2.82, yt - 0.28), (2.82, yt)], NAVY, 1.0)
        f.arrow([(2.82, yt), (CX, yt)], lw=1.0, head=0.06)
        f.text(4.56, yf - 0.02, f"tc({i})", 7.0, MUTED, ha="left")

    y3 = CY[3] + 0.50
    f.line([(CX + CW, y3), (4.76, y3)], NAVY, 1.1)
    f.arrow([(4.76, y3), (5.60, y3)], lw=1.1, head=0.07)
    f.text(5.68, y3, "cout", 8, INK, ha="left", bold=True)

    ovx, ovy = 5.12, 4.86
    y_up, y_lo = ovy + 0.11, ovy + 0.31
    y_c2 = CY[2] + 0.50
    f.dot(4.48, y_c2)
    f.line([(4.48, y_c2), (4.48, y_up)], NAVY, 1.0)
    f.arrow([(4.48, y_up), (f.gate_in_x(ovx, ovy, GW, GH, y_up, "XOR"), y_up)], lw=1.0, head=0.055)
    f.dot(4.76, y3)
    f.line([(4.76, y3), (4.76, y_lo)], NAVY, 1.0)
    f.arrow([(4.76, y_lo), (f.gate_in_x(ovx, ovy, GW, GH, y_lo, "XOR"), y_lo)], lw=1.0, head=0.055)
    f.gate("XOR", ovx, ovy, GW, GH)
    f.arrow([(ovx + GW, ovy + GH / 2), (5.60, ovy + GH / 2)], lw=1.0, head=0.07)
    f.text(5.68, ovy + GH / 2, "ovf", 8, INK, ha="left", bold=True)

    f.text(3.65, 5.62, "주황색 = sub.  XOR 4개가 B 를 반전하고, 최하위 자리올림에도 sub 가 들어가 2의 보수가 완성된다.",
           7.0, MUTED)
    return f.save(f"{OUT}/addsub4_block.png")


adder4_fig()
addsub4_fig()
