#!/usr/bin/env python3
"""6~7주차 블록도. 진행 화살표는 블록과 겹치지 않는다."""
import os
from figlib import Fig, NAVY, INK, MUTED, ORANGE, TINT, LINE, GREEN

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figs")


def w06_reg():
    """en 이 왜 '유지' 가 되는가 — 되먹임 MUX 로 보여 준다."""
    f = Fig(6.4, 3.0)
    for nm, y in [("d[7:0]", 0.85), ("en", 2.05), ("clk", 2.45)]:
        f.text(0.30, y, nm, 9, NAVY, bold=True, ha="left", mono=True)

    mx = f.box(2.05, 0.55, 0.85, 1.05, "MUX", fs=8.5, mono=True)
    ff = f.box(3.50, 0.55, 1.30, 1.05, "D FF x8", fs=9, mono=True,
               sub="상승 에지에서만", subfs=6.8)

    f.arrow([(1.15, 0.85), (2.05, 0.85)], lw=1.0, head=0.07)      # d -> MUX
    f.text(2.00, 0.72, "1", 7, MUTED, ha="right")
    f.text(2.00, 1.46, "0", 7, MUTED, ha="right")
    f.arrow([(2.90, 1.08), (3.50, 1.08)], lw=1.0, head=0.07)      # MUX -> FF
    f.arrow([(4.80, 1.08), (5.55, 1.08)], lw=1.2, head=0.08)      # FF -> q
    f.text(5.68, 1.08, "q[7:0]", 9, NAVY, bold=True, ha="left", mono=True)

    # 되먹임 — 위쪽 빈 통로(y=0.25)로 돌아온다
    f.dot(5.15, 1.08)
    f.arrow([(5.15, 1.08), (5.15, 0.25), (1.78, 0.25), (1.78, 1.40), (2.05, 1.40)],
            color=ORANGE, lw=1.0, head=0.07)
    f.text(3.45, 0.13, "en = 0 이면 자기 값이 다시 들어온다 — 이것이 \"유지\"", 7.2, ORANGE)

    # en 과 clk 은 아래쪽에서 올라온다
    f.arrow([(0.85, 2.05), (2.47, 2.05), (2.47, 1.60)], lw=1.0, head=0.07)
    f.arrow([(0.85, 2.45), (4.15, 2.45), (4.15, 1.60)], lw=1.0, head=0.07)
    f.text(3.2, 2.88, "순차회로에서는 \"유지\" 가 공짜다 — 플립플롭이 이미 값을 붙잡고 있다",
           7.2, MUTED)
    return f.save(os.path.join(OUT, "w06-reg.png"))


def w06_shift():
    """왼쪽 시프트 : sin 이 LSB 로 들어오고 MSB 가 버려진다."""
    f = Fig(6.9, 2.5)
    w, g, y, h = 0.52, 0.26, 0.85, 0.62
    x0 = 0.70
    xs = []
    for k in range(8):
        bit = 7 - k
        x = x0 + k * (w + g)
        xs.append(x)
        f.box(x, y, w, h, "r%d" % bit, fs=8.5, mono=True)

    # 오른쪽(LSB) 에서 왼쪽(MSB) 으로 한 칸씩
    for k in range(7):
        a = xs[k + 1]
        b = xs[k] + w
        f.arrow([(a, y + h / 2), (b, y + h / 2)], lw=1.0, head=0.07)

    f.arrow([(xs[7] + w + 0.55, y + h / 2), (xs[7] + w, y + h / 2)], lw=1.2, head=0.08)
    f.text(xs[7] + w + 0.70, y + h / 2, "sin", 9, NAVY, bold=True, ha="left", mono=True)
    f.arrow([(xs[0], y + h / 2), (xs[0] - 0.55, y + h / 2)], lw=1.2, head=0.08, color=MUTED)
    f.text(xs[0] - 0.62, y + h / 2, "버림", 8, MUTED, ha="right")

    f.text(3.45, 0.55, 'mode = "01"  (왼쪽 시프트)', 9, NAVY, bold=True)
    f.text(3.45, 1.92, 'r <= r(6 downto 0) & sin;', 9.5, ORANGE, mono=True)
    f.text(3.45, 2.28, '오른쪽 시프트는  r <= sin & r(7 downto 1);  로 방향만 바뀐다',
           7.2, MUTED)
    return f.save(os.path.join(OUT, "w06-shift.png"))


def w07_counter():
    """카운터 = 레지스터 + 되먹임 +1. max 는 조합 출력."""
    f = Fig(6.4, 3.0)
    inc = f.box(1.05, 0.60, 0.85, 0.80, "+1", fs=10, mono=True, bold=True)
    reg = f.box(2.70, 0.60, 1.85, 0.80, "cnt  (4비트)", fs=9, mono=True,
                sub="상승 에지 · reset · en", subfs=6.8)

    f.arrow([(1.90, 1.00), (2.70, 1.00)], lw=1.0, head=0.07)
    f.arrow([(4.55, 1.00), (5.25, 1.00)], lw=1.2, head=0.08)
    f.text(5.38, 1.00, "q[3:0]", 9, NAVY, bold=True, ha="left", mono=True)

    # 되먹임 — 위쪽 빈 통로
    f.dot(4.90, 1.00)
    f.arrow([(4.90, 1.00), (4.90, 0.28), (0.72, 0.28), (0.72, 1.00), (1.05, 1.00)],
            color=ORANGE, lw=1.0, head=0.07)
    f.text(2.8, 0.15, "자기 값을 다시 읽어 1 을 더한다 — 이것이 되먹임", 7.2, ORANGE)

    # max 는 아래로
    cmp_ = f.box(2.70, 1.85, 1.20, 0.55, "= 15 ?", fs=9, mono=True)
    f.arrow([(3.30, 1.40), (3.30, 1.85)], lw=1.0, head=0.07)
    f.arrow([(3.90, 2.12), (5.25, 2.12)], lw=1.0, head=0.07)
    f.text(5.38, 2.12, "max", 9, NAVY, bold=True, ha="left", mono=True)
    f.text(2.60, 2.62, "max 는 레지스터가 아니라 조합 출력 — 다음 자리의 en 으로 쓴다",
           7.2, MUTED, ha="left")
    return f.save(os.path.join(OUT, "w07-counter.png"))


def w07_tick():
    """1초는 분주가 아니라 '한 클록 폭 인에이블' 로 만든다."""
    f = Fig(6.6, 3.1)
    f.text(0.30, 0.80, "CLOCK_50", 9, NAVY, bold=True, ha="left", mono=True)
    tg = f.box(1.80, 0.50, 1.65, 0.62, "tick_gen", fs=9.5, mono=True,
               sub="N 클록마다 한 번", subfs=6.8)
    f.arrow([(1.28, 0.81), (1.80, 0.81)], lw=1.0, head=0.07)
    f.arrow([(3.45, 0.81), (4.05, 0.81)], lw=1.0, head=0.07)
    f.text(3.75, 0.62, "tick", 7.4, MUTED)
    an = f.box(4.05, 0.50, 0.65, 0.62, "and", fs=8.5, mono=True)
    f.text(4.38, 1.42, "run (SW0)", 7.6, MUTED)
    f.arrow([(4.38, 1.30), (4.38, 1.12)], lw=1.0, head=0.07)
    cnt = f.box(5.05, 0.50, 1.25, 0.62, "counter4", fs=9, mono=True,
                sub="en", subfs=6.8)
    f.arrow([(4.70, 0.81), (5.05, 0.81)], lw=1.0, head=0.07)

    # 아래 : 타이밍 스케치
    yb, amp = 2.35, 0.30
    f.text(0.30, 1.95, "클록 50 MHz", 7.6, MUTED, ha="left")
    xs = 1.80
    pts = []
    for k in range(18):
        x = xs + k * 0.26
        pts += [(x, yb), (x, yb - amp), (x + 0.13, yb - amp), (x + 0.13, yb)]
    f.line(pts, color=LINE, lw=0.9)
    f.text(0.30, 2.60, "tick", 7.6, MUTED, ha="left")
    ty = 2.92
    f.line([(1.80, ty), (3.88, ty), (3.88, ty - 0.26), (4.14, ty - 0.26),
            (4.14, ty), (6.30, ty)], color=ORANGE, lw=1.1)
    f.text(4.60, 2.74, "딱 한 클록 폭", 7.2, ORANGE, ha="left")
    f.text(3.3, 1.62, "클록을 느리게 만드는 것이 아니라, 빠른 클록을 그대로 쓰면서 "
                      "셀 때만 en 을 올린다", 7.2, MUTED)
    return f.save(os.path.join(OUT, "w07-tick.png"))


if __name__ == "__main__":
    w06_reg(); w06_shift(); w07_counter(); w07_tick()
