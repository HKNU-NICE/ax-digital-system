#!/usr/bin/env python3
"""1~4주차 블록도.

규칙 : 진행 화살표는 블록과 겹치지 않는다. 가로·세로로만 꺾고,
비어 있는 통로를 지나며, 끝점은 블록 면에 정확히 닿는다.
"""
import os
from figlib import Fig, NAVY, INK, MUTED, ORANGE, TINT, LINE, GREEN

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figs")
os.makedirs(OUT, exist_ok=True)


# ══════════════════════════════════════════════════════════════
# W01 ① Lab 0 — SW 가 세 갈래로 갈려 LEDR 로 간다
# ══════════════════════════════════════════════════════════════
def w01_lab0():
    f = Fig(7.1, 2.9)
    sw = f.box(0.30, 0.35, 1.05, 2.20, "SW\n[9:0]", fill="white", bold=True, fs=9)
    led = f.box(5.45, 0.35, 1.25, 2.20, "LEDR\n[9:0]", fill="white", bold=True, fs=9)

    lanes = [
        (0.70, "그대로 통과", "SW[7:0]", "LEDR[7:0]", TINT),
        (1.45, "AND", "SW[8] · SW[9]", "LEDR[8]", TINT),
        (2.20, "XOR", "SW[8] ⊕ SW[9]", "LEDR[9]", TINT),
    ]
    for y, name, lin, lout, fill in lanes:
        b = f.box(2.35, y - 0.32, 2.05, 0.64, name, fill=fill, fs=9, bold=True)
        f.arrow([(1.35, y), (2.35, y)], label=lin, loff=(0, -0.17), fs=7)
        f.arrow([(4.40, y), (5.45, y)], label=lout, loff=(0, -0.17), fs=7)

    f.text(3.55, 2.78, "여덟 줄은 그냥 잇고, 위의 두 줄에만 게이트가 하나씩 들어간다",
           7.2, MUTED)
    return f.save(os.path.join(OUT, "w01-lab0.png"))


# ══════════════════════════════════════════════════════════════
# W01 ② 과제 — 3입력 다수결
# ══════════════════════════════════════════════════════════════
def w01_major3():
    f = Fig(6.2, 3.1)
    # 입력 : 왼쪽 통로 x = 0.62 / 0.84 / 1.06 (블록은 x >= 1.45 부터)
    ins = [("a", 0.62, 0.45), ("b", 0.84, 1.50), ("c", 1.06, 2.55)]
    for nm, x, y in ins:
        f.text(0.26, y, nm, 10, NAVY, bold=True, mono=True)
        f.dot(x, y, 0.028)
        f.line([(0.40, y), (x, y)])

    ands = [
        (0.25, "a · b", [("a", 0.45), ("b", 0.65)]),
        (1.25, "b · c", [("b", 1.45), ("c", 1.65)]),
        (2.25, "a · c", [("a", 2.45), ("c", 2.65)]),
    ]
    xa = {"a": 0.62, "b": 0.84, "c": 1.06}
    ytrunk = {"a": [0.45], "b": [1.50], "c": [2.55]}
    for by, label, feeds in ands:
        f.box(1.45, by, 1.35, 0.60, label, fs=9, bold=True, mono=True)
        for nm, yy in feeds:
            ytrunk[nm].append(yy)
            f.arrow([(xa[nm], yy), (1.45, yy)], lw=1.0, head=0.07)
    # 세로 간선 — 블록 왼쪽 빈 통로만 지난다
    for nm, x, _ in ins:
        ys = ytrunk[nm]
        f.line([(x, min(ys)), (x, max(ys))])

    # OR 게이트
    oy, oh = 0.45, 1.95
    out = f.gate("OR", 3.55, oy, 0.95, oh, "OR")
    for by, _, _ in ands:
        y = min(max(by + 0.30, oy + 0.08), oy + oh - 0.08)
        gx = f.gate_in_x(3.55, oy, 0.95, oh, y, "OR")
        f.arrow([(2.80, by + 0.30), (gx - 0.02, by + 0.30), (gx - 0.02, y), (gx, y)],
                lw=1.0, head=0.07)
    f.arrow([out, (5.55, out[1])], lw=1.1, head=0.08)
    f.text(5.70, out[1], "y", 10, NAVY, bold=True, ha="left", mono=True)

    f.text(3.1, 2.95, "둘 이상이 1 이면 1 — 세 쌍의 AND 를 OR 로 묶는다", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w01-major3.png"))


# ══════════════════════════════════════════════════════════════
# W02 ① gates — 한 entity 에서 여섯 가지 출력
# ══════════════════════════════════════════════════════════════
def w02_gates():
    f = Fig(6.6, 3.2)
    f.box(0.30, 1.15, 1.05, 0.90, "SW[1:0]", fill="white", bold=True, fs=9)
    f.box(2.20, 0.30, 1.85, 2.60, "", fill=TINT)
    f.text(3.12, 0.52, "gates", 10, NAVY, bold=True, mono=True)

    rows = [("y_and", "a and b", 0.95), ("y_or", "a or b", 1.33),
            ("y_xor", "a xor b", 1.71), ("y_nand", "a nand b", 2.09),
            ("y_nor", "a nor b", 2.47), ("y_not", "not a", 2.78)]
    for i, (nm, expr, y) in enumerate(rows):
        f.text(2.42, y, expr, 7.4, INK, ha="left", mono=True)
        f.arrow([(4.05, y), (4.85, y)], lw=1.0, head=0.07)
        f.text(4.95, y, "LEDR[%d]" % i, 7.6, NAVY, ha="left", mono=True)

    f.arrow([(1.35, 1.60), (2.20, 1.60)], label="a, b", loff=(0, -0.17), fs=7.5)
    f.text(3.3, 3.10, "줄 여섯 개가 곧 게이트 여섯 개 — 순서를 바꿔도 회로는 같다", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w02-gates.png"))


# ══════════════════════════════════════════════════════════════
# W02 ② 과제 — 자동차 경고 회로
# ══════════════════════════════════════════════════════════════
def w02_warn():
    f = Fig(6.6, 2.9)
    for nm, y in [("ign", 0.45), ("door", 1.45), ("belt", 2.35)]:
        f.text(0.30, y, nm, 9.5, NAVY, bold=True, mono=True)

    n1 = f.box(1.25, 1.18, 0.95, 0.54, "not", fs=9, mono=True)
    n2 = f.box(1.25, 2.08, 0.95, 0.54, "not", fs=9, mono=True)
    f.arrow([(0.72, 1.45), (1.25, 1.45)], lw=1.0, head=0.07)
    f.arrow([(0.72, 2.35), (1.25, 2.35)], lw=1.0, head=0.07)

    oy, oh = 1.20, 1.45
    oout = f.gate("OR", 2.75, oy, 0.90, oh, "OR")
    for ysrc in (1.45, 2.35):
        yy = min(max(ysrc, oy + 0.10), oy + oh - 0.10)
        gx = f.gate_in_x(2.75, oy, 0.90, oh, yy, "OR")
        f.arrow([(2.20, ysrc), (gx - 0.02, ysrc), (gx - 0.02, yy), (gx, yy)],
                lw=1.0, head=0.07)
    f.text(3.20, 2.80, "열렸거나 안 맸거나", 7.0, MUTED)

    an = f.box(4.45, 0.90, 1.05, 0.72, "and", fs=9, mono=True)
    # ign 은 위쪽 빈 통로(y=0.45)로 멀리 가서 내려온다 — 블록을 지나지 않는다
    f.arrow([(0.72, 0.45), (4.05, 0.45), (4.05, 1.08), (4.45, 1.08)], lw=1.0, head=0.07)
    f.arrow([(3.65, oout[1]), (4.18, oout[1]), (4.18, 1.44), (4.45, 1.44)], lw=1.0, head=0.07)
    f.arrow([(5.50, 1.26), (6.05, 1.26)], lw=1.1, head=0.08)
    f.text(6.18, 1.26, "w", 10, NAVY, bold=True, ha="left", mono=True)

    f.text(3.3, 0.14, "w = ign and ((not door) or (not belt))", 8.0, ORANGE, mono=True)
    return f.save(os.path.join(OUT, "w02-warn.png"))


# ══════════════════════════════════════════════════════════════
# W03 ① 4:1 MUX
# ══════════════════════════════════════════════════════════════
def w03_mux():
    f = Fig(6.0, 3.5)
    f.box(2.15, 0.30, 1.75, 2.30, "", fill=TINT)
    f.text(3.02, 0.52, "mux4_1", 10, NAVY, bold=True, mono=True)

    rows = [("i0", 0.95, '"00"'), ("i1", 1.38, '"01"'),
            ("i2", 1.81, '"10"'), ("i3", 2.24, "others")]
    for nm, y, when in rows:
        f.text(0.55, y, nm + " [3:0]", 8.2, NAVY, ha="left", mono=True)
        f.arrow([(1.55, y), (2.15, y)], lw=1.0, head=0.07)
        f.text(2.33, y, "sel = %-7s→ %s" % (when, nm), 7.4, INK, ha="left", mono=True)

    f.arrow([(3.90, 1.45), (4.95, 1.45)], lw=1.2, head=0.08)
    f.text(5.08, 1.45, "y [3:0]", 9, NAVY, ha="left", bold=True, mono=True)

    # sel 은 아래쪽 통로에서 올라온다
    f.text(3.02, 3.20, "sel [1:0]", 9, NAVY, bold=True, mono=True)
    f.arrow([(3.02, 3.00), (3.02, 2.60)], lw=1.2, head=0.08)

    f.text(3.0, 0.12, "네 다발 중 한 다발을 통째로 고른다 — 폭이 서로 맞아야 한다", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w03-mux.png"))


# ══════════════════════════════════════════════════════════════
# W03 ② 과제 — 4:2 우선순위 인코더
# ══════════════════════════════════════════════════════════════
def w03_enc():
    f = Fig(6.4, 3.2)
    f.box(0.30, 1.15, 1.15, 0.90, "r [3:0]", fill="white", bold=True, fs=9, mono=True)
    f.box(2.35, 0.30, 2.05, 2.45, "", fill=TINT)
    f.text(3.37, 0.52, "enc4to2", 10, NAVY, bold=True, mono=True)

    rows = [("r(3) = '1'", '"11"', 0.98), ("r(2) = '1'", '"10"', 1.42),
            ("r(1) = '1'", '"01"', 1.86), ("그 외", '"00"', 2.30)]
    for cond, val, y in rows:
        f.text(2.52, y, "%-11s → %s" % (cond, val), 7.6, INK, ha="left", mono=True)

    f.arrow([(1.45, 1.60), (2.35, 1.60)], lw=1.1, head=0.08)

    # 우선순위 세로 화살표 — r 상자와 enc 상자 사이 빈 통로 (x = 1.95)
    f.arrow([(1.95, 0.60), (1.95, 2.50)], color=ORANGE, lw=1.1, head=0.08)
    f.text(1.78, 1.55, "위에서부터 검사", 7.0, ORANGE, rot=90)

    f.arrow([(4.40, 1.05), (5.20, 1.05)], lw=1.1, head=0.08)
    f.text(5.32, 1.05, "code [1:0]", 8.6, NAVY, ha="left", bold=True, mono=True)
    f.arrow([(4.40, 2.05), (5.20, 2.05)], lw=1.1, head=0.08)
    f.text(5.32, 2.05, "valid", 8.6, NAVY, ha="left", bold=True, mono=True)

    f.text(3.2, 3.05, "when-else 는 위에 쓴 조건이 먼저 — 우선순위가 코드에 그대로 보인다",
           7.2, MUTED)
    return f.save(os.path.join(OUT, "w03-enc.png"))


# ══════════════════════════════════════════════════════════════
# W04 ① process 안의 순서 — 기본값 → if → case
# ══════════════════════════════════════════════════════════════
def w04_process():
    f = Fig(5.9, 3.7)
    bx, bw = 0.45, 3.35
    b1 = f.box(bx, 0.35, bw, 0.62, 'seg <= "1111111"', fill=TINT, fs=9, mono=True,
               sub="① 기본값 먼저 — 래치를 막는다", subfs=6.8)
    b2 = f.box(bx, 1.35, bw, 0.62, "if blank = '0' then", fill=TINT, fs=9, mono=True,
               sub="② 끌지 말지 먼저 가른다", subfs=6.8)
    b3 = f.box(bx, 2.35, bw, 0.62, "case d is  …  16가지", fill=TINT, fs=9, mono=True,
               sub="③ 경우마다 덮어쓴다", subfs=6.8)
    b4 = f.box(bx, 3.30, bw, 0.30, "seg 확정", fill="white", fs=8.5)

    cx = bx + bw / 2
    for y0, y1 in [(0.97, 1.35), (1.97, 2.35), (2.97, 3.30)]:
        f.arrow([(cx, y0), (cx, y1)], lw=1.1, head=0.075)

    # blank='1' 우회로 — 오른쪽 빈 통로 x = 4.25
    f.arrow([(bx + bw, 1.66), (4.25, 1.66), (4.25, 3.45), (bx + bw, 3.45)],
            color=ORANGE, lw=1.1, head=0.075)
    f.text(4.60, 2.55, "blank='1' 이면 기본값 그대로", 7.0, ORANGE, rot=-90)

    f.text(2.1, 0.14, "아래 줄이 위 줄을 덮어쓴다 — 이것이 기본값 기법의 핵심", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w04-process.png"))


# ══════════════════════════════════════════════════════════════
# W04 ② 7-세그먼트 이름과 비트 순서
# ══════════════════════════════════════════════════════════════
def w04_seg():
    from matplotlib.patches import Rectangle
    f = Fig(5.8, 3.0)
    T, G = 0.16, 0.035          # 세그먼트 두께 · 사이 틈
    x0, y0, w, h = 1.15, 0.50, 1.10, 1.95
    xm, ym = x0 + w / 2, y0 + h / 2

    def bar(x, y, ww, hh):
        f.ax.add_patch(Rectangle((x, y), ww, hh, fc=TINT, ec=NAVY, lw=1.0, zorder=3))

    hx, hw = x0 + T + G, w - 2 * (T + G)
    bar(hx, y0, hw, T)                                  # a
    bar(hx, ym - T / 2, hw, T)                          # g
    bar(hx, y0 + h - T, hw, T)                          # d
    vy1, vh1 = y0 + T + G, (h / 2 - T / 2) - T - 2 * G
    vy2 = ym + T / 2 + G
    bar(x0 + w - T, vy1, T, vh1)                        # b
    bar(x0 + w - T, vy2, T, vh1)                        # c
    bar(x0, vy1, T, vh1)                                # f
    bar(x0, vy2, T, vh1)                                # e

    lab = lambda x, y, s_, ha="center": f.text(x, y, s_, 9, NAVY, bold=True,
                                               ha=ha, mono=True)
    lab(xm, y0 - 0.20, "a")
    lab(x0 + w + 0.18, vy1 + vh1 / 2, "b", "left")
    lab(x0 + w + 0.18, vy2 + vh1 / 2, "c", "left")
    lab(xm, y0 + h + 0.21, "d")
    lab(x0 - 0.18, vy2 + vh1 / 2, "e", "right")
    lab(x0 - 0.18, vy1 + vh1 / 2, "f", "right")
    lab(xm, ym - T / 2 - 0.26, "g")

    f.text(3.50, 0.66, "seg(6 downto 0)", 9.5, NAVY, bold=True, ha="left", mono=True)
    f.text(3.50, 0.98, "=  g  f  e  d  c  b  a", 9.5, INK, ha="left", mono=True)
    f.text(3.50, 1.48, "'0' 이면 켜짐 (active-low)", 8.2, ORANGE, ha="left")
    f.text(3.50, 1.84, '"0000000" → 일곱 개 전부 켜짐 = 8', 7.6, MUTED, ha="left")
    f.text(3.50, 2.12, '"1111111" → 전부 꺼짐 (blank)', 7.6, MUTED, ha="left")
    f.text(3.50, 2.40, '"1000000" → g 만 꺼짐 = 0', 7.6, MUTED, ha="left")
    f.text(2.9, 2.88, "DE1-SoC 의 HEX 는 0 일 때 켜진다 — 표가 거꾸로 보이는 이유", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w04-seg.png"))


if __name__ == "__main__":
    w01_lab0(); w01_major3()
    w02_gates(); w02_warn()
    w03_mux(); w03_enc()
    w04_process(); w04_seg()
