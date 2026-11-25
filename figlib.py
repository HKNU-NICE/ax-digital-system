import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon, Rectangle
from matplotlib import font_manager

KRPATH = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
font_manager.fontManager.addfont(KRPATH)
KR = font_manager.FontProperties(fname=KRPATH).get_name()
MONO = "DejaVu Sans Mono"

NAVY, INK, MUTED, ORANGE = "#1F3A93", "#1A1A1A", "#6B6B6B", "#E06C1F"
TINT, LINE, GREEN, RED = "#E8EEF9", "#B9C4D8", "#1E7A46", "#C0392B"


class Fig:
    """inch 단위, y 는 아래로 증가 (화면 좌표계)."""

    def __init__(self, w, h, dpi=220):
        self.W, self.H = w, h
        self.fig = plt.figure(figsize=(w, h), dpi=dpi)
        self.ax = self.fig.add_axes([0, 0, 1, 1])
        self.ax.set_xlim(0, w)
        self.ax.set_ylim(h, 0)
        self.ax.axis("off")

    def text(self, x, y, s, fs=9, color=INK, ha="center", va="center",
             bold=False, mono=False, rot=0):
        self.ax.text(x, y, s, fontsize=fs, color=color, ha=ha, va=va,
                     rotation=rot, zorder=5,
                     fontfamily=(MONO if (mono and s.isascii()) else KR),
                     fontweight=("bold" if bold else "normal"))

    def box(self, x, y, w, h, text="", fill=TINT, edge=NAVY, fs=9, color=INK,
            bold=False, lw=1.2, rounded=0.06, mono=False, sub=None, subfs=7.0):
        self.ax.add_patch(FancyBboxPatch(
            (x + rounded, y + rounded), w - 2 * rounded, h - 2 * rounded,
            boxstyle=f"round,pad={rounded}", fc=fill, ec=edge, lw=lw, zorder=2))
        if text:
            dy = -0.09 if sub else 0.0
            self.text(x + w / 2, y + h / 2 + dy, text, fs, color, bold=bold, mono=mono)
        if sub:
            self.text(x + w / 2, y + h / 2 + 0.11, sub, subfs, MUTED, mono=mono)
        return (x, y, w, h)

    def line(self, pts, color=NAVY, lw=1.2, dashed=False):
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        self.ax.plot(xs, ys, color=color, lw=lw, zorder=3,
                     linestyle=("--" if dashed else "-"),
                     solid_capstyle="round")

    def arrow(self, pts, color=NAVY, lw=1.2, label=None, lpos=0.5, loff=(0, -0.12),
              fs=7.5, head=0.08, lcolor=None, mono=False):
        self.line(pts, color, lw)
        (x0, y0), (x1, y1) = pts[-2], pts[-1]
        dx, dy = x1 - x0, y1 - y0
        n = (dx * dx + dy * dy) ** 0.5 or 1
        ux, uy = dx / n, dy / n
        px, py = -uy, ux
        self.ax.add_patch(Polygon(
            [(x1, y1), (x1 - head * ux + head * 0.45 * px, y1 - head * uy + head * 0.45 * py),
             (x1 - head * ux - head * 0.45 * px, y1 - head * uy - head * 0.45 * py)],
            closed=True, fc=color, ec=color, zorder=4))
        if label:
            (ax_, ay_), (bx_, by_) = pts[0], pts[-1]
            lx = ax_ + (bx_ - ax_) * lpos + loff[0]
            ly = ay_ + (by_ - ay_) * lpos + loff[1]
            self.text(lx, ly, label, fs, lcolor or MUTED, mono=mono)

    def dot(self, x, y, r=0.032, color=NAVY):
        self.ax.add_patch(plt.Circle((x, y), r, fc=color, ec=color, zorder=5))

    # ---- OR / XOR 게이트 : 뒤쪽 오목호 + 뾰족한 앞코 ----
    OR_B = 0.15          # 뒤쪽 호의 깊이

    def _or_outline(self, x, y, w, h, n=40):
        back, front = [], []
        for i in range(n + 1):
            t = i / n
            yy = y + h * t
            k = abs(2 * t - 1)
            back.append((x + self.OR_B * (1 - k * k), yy))
            front.append((x + w * (1 - k) ** 0.62, yy))
        return back, front

    def gate(self, kind, x, y, w, h, label=None, fs=6.5):
        """kind: 'OR' | 'XOR'. (x,y) 는 왼쪽 위, 출력은 (x+w, y+h/2)."""
        back, front = self._or_outline(x, y, w, h)
        poly = back + list(reversed(front))
        self.ax.add_patch(Polygon(poly, closed=True, fc="white", ec=NAVY,
                                  lw=1.1, zorder=3))
        if kind == "XOR":
            b2 = [(px - 0.10, py) for px, py in back]
            self.ax.plot([p[0] for p in b2], [p[1] for p in b2],
                         color=NAVY, lw=1.1, zorder=3)
        if label:
            self.text(x + w * 0.58, y + h / 2, label, fs, MUTED)
        return (x + w, y + h / 2)

    def gate_in_x(self, x, y, w, h, yi, kind="OR"):
        """게이트 입력선이 정확히 닿는 x 좌표."""
        t = (yi - y) / h
        k = abs(2 * t - 1)
        bx = x + self.OR_B * (1 - k * k)
        return bx - (0.10 if kind == "XOR" else 0.0)

    def save(self, path):
        self.fig.savefig(path, dpi=220, facecolor="white",
                         bbox_inches="tight", pad_inches=0.04)
        plt.close(self.fig)
        print(path)
        return path
