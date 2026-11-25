#!/usr/bin/env python3
"""9~12주차 그림. 화살표는 블록·원과 겹치지 않는다."""
import os, math
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch
from figlib import Fig, NAVY, INK, MUTED, ORANGE, TINT, LINE, GREEN, RED

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figs")
R = 0.34          # 상태 원 반지름


def node(f, x, y, label, fill=TINT, double=False):
    f.ax.add_patch(Circle((x, y), R, fc=fill, ec=NAVY, lw=1.2, zorder=3))
    if double:
        f.ax.add_patch(Circle((x, y), R - 0.06, fc="none", ec=NAVY, lw=1.0, zorder=4))
    f.text(x, y, label, 8, INK, bold=True, mono=True)


def arc(f, x1, y1, x2, y2, rad, label, lx=None, ly=None, color=NAVY, fs=7.2):
    """두 원의 '가장자리' 를 잇는 곡선 — 원 안을 지나지 않는다."""
    d = math.hypot(x2 - x1, y2 - y1)
    ux, uy = (x2 - x1) / d, (y2 - y1) / d
    # 곡선이 휘는 쪽을 고려해 출발/도착점을 살짝 돌려 준다
    a = math.atan2(uy, ux) + rad * 0.5
    sx, sy = x1 + R * math.cos(a), y1 + R * math.sin(a)
    b = math.atan2(-uy, -ux) - rad * 0.5
    ex, ey = x2 + R * math.cos(b), y2 + R * math.sin(b)
    f.ax.add_patch(FancyArrowPatch((sx, sy), (ex, ey),
                                   connectionstyle=f"arc3,rad={rad}",
                                   arrowstyle="-|>", mutation_scale=9,
                                   lw=1.0, color=color, zorder=2))
    if label:
        mx, my = (sx + ex) / 2, (sy + ey) / 2
        px, py = -(ey - sy), (ex - sx)
        n = math.hypot(px, py) or 1
        off = rad * 0.55
        f.text(lx if lx is not None else mx + px / n * off * -1,
               ly if ly is not None else my + py / n * off * -1,
               label, fs, color, mono=True)


def selfloop(f, x, y, label, up=True):
    dy = -R - 0.30 if up else R + 0.30
    f.ax.add_patch(FancyArrowPatch((x - 0.16, y + (-R if up else R)),
                                   (x + 0.16, y + (-R if up else R)),
                                   connectionstyle="arc3,rad=" + ("1.6" if up else "-1.6"),
                                   arrowstyle="-|>", mutation_scale=9,
                                   lw=1.0, color=NAVY, zorder=2))
    f.text(x, y + dy - (0.06 if up else -0.06), label, 7.2, NAVY, mono=True)


# ══════════════════════════════════════════════════════════════
def w09_state():
    """1011 검출기 (Moore) 상태도 — 앞으로 가는 길은 위, 되돌아가는 길은 아래"""
    f = Fig(7.2, 3.3)
    names = ["S0", "S1", "S10", "S101", "S1011"]
    xs = [0.80 + i * 1.45 for i in range(5)]
    y = 1.55

    def edge(x1, x2, rad, label, loff=0.22):
        """두 원의 가장자리를 잇고, 라벨은 실제 곡선의 가운데 바깥쪽에 둔다."""
        a = math.atan2(0, x2 - x1) + rad * 0.55
        sx, sy = x1 + R * math.cos(a), y + R * math.sin(a)
        b = math.atan2(0, x1 - x2) - rad * 0.55
        ex, ey = x2 + R * math.cos(b), y + R * math.sin(b)
        f.ax.add_patch(FancyArrowPatch((sx, sy), (ex, ey),
                                       connectionstyle=f"arc3,rad={rad}",
                                       arrowstyle="-|>", mutation_scale=9,
                                       lw=1.0, color=NAVY, zorder=2))
        # arc3 의 제어점은 M + rad*(dy, -dx) 이므로 곡선 가운데는 M + rad*(dy,-dx)/2
        dx, dy = ex - sx, ey - sy
        bx, by = -rad * dy / 2.0, rad * dx / 2.0   # y축이 뒤집힌 좌표계라 부호 반대
        mx, my = (sx + ex) / 2 + bx, (sy + ey) / 2 + by
        u = math.hypot(bx, by)
        if u < 1e-6:
            f.text(mx, my + loff, label, 7.4, NAVY, mono=True)
        else:
            f.text(mx + bx / u * abs(loff), my + by / u * abs(loff),
                   label, 7.4, NAVY, mono=True)

    def loop(x, label):
        a1, a2 = math.radians(235), math.radians(305)
        p1 = (x + R * math.cos(a1), y + R * math.sin(a1))
        p2 = (x + R * math.cos(a2), y + R * math.sin(a2))
        f.ax.add_patch(FancyArrowPatch(p1, p2, connectionstyle="arc3,rad=-1.9",
                                       arrowstyle="-|>", mutation_scale=9,
                                       lw=1.0, color=NAVY, zorder=5))
        f.text(x, y - R - 0.42, label, 7.4, NAVY, mono=True)

    for i, (x, nm) in enumerate(zip(xs, names)):
        node(f, x, y, nm, fill="#CFE8D8" if i == 4 else TINT, double=(i == 4))
    f.text(xs[4], y + R + 0.34, "det = 1", 8, "#1E7A46", bold=True, mono=True)

    # 앞으로 (오른쪽) — 직선, 라벨은 선 위
    for i, lab in enumerate(["1", "0", "1", "1"]):
        edge(xs[i], xs[i + 1], 0.0, lab, -0.20)

    # 제자리 (0 을 계속 받으면 S0, 1 을 계속 받으면 S1)
    loop(xs[0], "0")
    loop(xs[1], "1")

    # 되돌아가기 — 전부 아래쪽으로 내려 서로 겹치지 않게 깊이를 달리한다
    edge(xs[3], xs[2], -0.45, "0")
    edge(xs[2], xs[0], -0.32, "0")
    edge(xs[4], xs[2], -0.30, "0")
    edge(xs[4], xs[1], -0.46, "1")

    f.text(3.6, 3.18, "겹침 허용 — 1011 을 찾은 뒤에도 마지막 비트들을 버리지 않는다",
           7.2, MUTED)
    return f.save(os.path.join(OUT, "w09-state.png"))


def w09_moore_mealy():
    """같은 입력, 다른 출력 시점"""
    f = Fig(6.8, 3.0)
    bits = "1011"
    x0, dx = 1.60, 0.95
    f.text(0.30, 0.55, "x", 9, NAVY, bold=True, ha="left", mono=True)
    for i, b in enumerate(bits):
        f.text(x0 + i * dx + dx / 2, 0.55, b, 10, INK, bold=True, mono=True)
        f.line([(x0 + i * dx, 0.30), (x0 + i * dx, 2.70)], color=LINE, lw=0.7)
    f.line([(x0 + 4 * dx, 0.30), (x0 + 4 * dx, 2.70)], color=LINE, lw=0.7)

    f.text(0.30, 1.45, "Mealy det", 8.6, ORANGE, bold=True, ha="left", mono=True)
    yb = 1.70
    f.line([(x0, yb), (x0 + 3 * dx, yb), (x0 + 3 * dx, yb - 0.32),
            (x0 + 4 * dx, yb - 0.32), (x0 + 4 * dx, yb), (6.55, yb)],
           color=ORANGE, lw=1.2)

    f.text(0.30, 2.25, "Moore det", 8.6, NAVY, bold=True, ha="left", mono=True)
    yc = 2.55
    f.line([(x0, yc), (x0 + 4 * dx, yc), (x0 + 4 * dx, yc - 0.32),
            (x0 + 5 * dx, yc - 0.32), (x0 + 5 * dx, yc), (6.55, yc)],
           color=NAVY, lw=1.2)

    f.text(3.4, 0.14, "같은 1011 인데 출력이 올라가는 클록이 하나 다르다", 7.4, MUTED)
    f.text(6.0, 1.28, "마지막 1 이\n들어오는 그 클록", 6.8, ORANGE)
    f.text(6.0, 2.98, "한 클록 뒤", 6.8, NAVY)
    return f.save(os.path.join(OUT, "w09-moore-mealy.png"))


def w10_traffic():
    """신호등 상태도 — 과제의 ALL_RED 는 점선으로 끼워 넣을 자리를 보여 준다"""
    f = Fig(6.4, 3.4)
    g = (1.30, 1.00); yl = (4.00, 1.00); rd = (2.65, 2.60)
    node(f, *g, "GREEN", fill="#E4F3E8")
    node(f, *yl, "YELLOW", fill="#FBF2DC")
    node(f, *rd, "RED", fill="#FBE4E2")
    f.text(g[0], g[1] - R - 0.26, "6초", 7.6, MUTED)
    f.text(yl[0], yl[1] - R - 0.26, "2초", 7.6, MUTED)
    f.text(rd[0], rd[1] + R + 0.28, "4초", 7.6, MUTED)

    arc(f, *g, *yl, 0.0, "cnt = 5", lx=(g[0] + yl[0]) / 2, ly=0.82)
    arc(f, *yl, *rd, 0.0, "cnt = 1", lx=3.55, ly=1.95)
    arc(f, *rd, *g, 0.0, "cnt = 3", lx=1.72, ly=1.95)

    f.text(2.65, 0.42, "walk 가 눌려 있으면 GREEN 은 2초만 지나도 끝난다", 7.2, ORANGE)
    f.ax.add_patch(Circle((5.55, 2.70), R, fc="white", ec=MUTED, lw=1.1,
                          linestyle="--", zorder=3))
    f.text(5.55, 2.70, "ALL\nRED", 7, MUTED, bold=True, mono=True)
    f.text(5.55, 3.28, "과제 : 여기에 한 상태를 끼운다", 7.0, MUTED)
    f.arrow([(4.38, 1.30), (5.55, 2.26)], color=MUTED, lw=0.9, head=0.07)
    f.arrow([(5.20, 2.86), (3.10, 2.72)], color=MUTED, lw=0.9, head=0.07)
    return f.save(os.path.join(OUT, "w10-traffic.png"))


def w11_hier():
    """계층 구조 — 같은 부품 네 벌 + package"""
    f = Fig(6.6, 3.1)
    top = f.box(2.20, 0.30, 2.20, 0.62, "clock_mmss", fs=9.5, mono=True, bold=True)
    xs = [0.45, 1.75, 3.05, 4.35]
    mods = ["10", "6", "10", "6"]
    for x, m in zip(xs, mods):
        f.box(x, 1.60, 1.15, 0.62, "counter_mod", fs=7.6, mono=True,
              sub="MODULUS=" + m, subfs=6.6)
        # 세로 통로로만 내려간다 (블록 사이 빈 곳)
        f.arrow([(3.30, 0.92), (3.30, 1.26), (x + 0.57, 1.26), (x + 0.57, 1.60)],
                lw=0.9, head=0.065)
    f.box(5.05, 0.30, 1.30, 0.62, "seg_pkg", fs=9, mono=True,
          sub="타입 · 함수", subfs=6.6)
    f.arrow([(5.05, 0.61), (4.40, 0.61)], lw=0.9, head=0.065, color=ORANGE)
    f.text(4.72, 0.42, "use", 6.8, ORANGE, mono=True)

    f.text(3.3, 2.56, "같은 부품 네 벌 — 다른 것은 generic 하나뿐", 7.6, MUTED)
    f.text(3.3, 2.88, "g_digit : for i in 0 to 3 generate", 8.2, ORANGE, mono=True)
    return f.save(os.path.join(OUT, "w11-hier.png"))


def w12_datapath():
    """제어부와 데이터패스를 나눈다"""
    f = Fig(6.8, 3.2)
    rf = f.box(0.45, 1.05, 1.55, 1.00, "reg_file", fs=9.5, mono=True,
               sub="쓰기 1 · 읽기 2", subfs=6.8)
    alu = f.box(2.85, 1.05, 1.30, 1.00, "ALU", fs=10, mono=True, bold=True)
    out = f.box(5.00, 1.05, 1.35, 1.00, "HEX / LEDR", fs=8.6, mono=True)

    f.arrow([(2.00, 1.35), (2.85, 1.35)], lw=1.0, head=0.07, label="op1",
            loff=(0, -0.14), fs=7)
    f.arrow([(2.00, 1.78), (2.85, 1.78)], lw=1.0, head=0.07, label="op2",
            loff=(0, -0.14), fs=7)
    f.arrow([(4.15, 1.55), (5.00, 1.55)], lw=1.0, head=0.07)

    # 되쓰기 — 아래쪽 빈 통로
    f.dot(4.60, 1.55)
    f.arrow([(4.60, 1.55), (4.60, 2.62), (1.22, 2.62), (1.22, 2.05)],
            color=ORANGE, lw=1.0, head=0.07)
    f.text(2.9, 2.80, "결과를 다시 레지스터로 — 데이터가 도는 길", 7.2, ORANGE)

    ctrl = f.box(2.45, 0.22, 2.10, 0.52, "제어부 (FSM)", fs=9, bold=True,
                 fill="#FBF2DC")
    for x, lab in [(1.22, "we / 주소"), (3.50, "f")]:
        f.arrow([(x if x < 2.45 else x, 0.74), (x, 1.05)], lw=0.9, head=0.065)
        f.text(x + 0.42, 0.90, lab, 6.8, MUTED, mono=True)
    f.line([(2.45, 0.48), (1.22, 0.48)], color=NAVY, lw=0.9)
    f.line([(1.22, 0.48), (1.22, 0.74)], color=NAVY, lw=0.9)

    f.text(3.4, 3.08, "13주차에는 이 데이터패스에 FSM 을 연결하기만 하면 된다", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w12-datapath.png"))


if __name__ == "__main__":
    w09_state(); w09_moore_mealy(); w10_traffic(); w11_hier(); w12_datapath()
