/* ------------------------------------------------------------------
   wave.js — SVG 파형 뷰어 (커서로 값 읽기)
------------------------------------------------------------------ */
import { pad, bin2u, bin2s } from "./vcd.js";

const NS = "http://www.w3.org/2000/svg";
const el = (n, a = {}) => {
  const e = document.createElementNS(NS, n);
  for (const k in a) e.setAttribute(k, a[k]);
  return e;
};

export class WaveView {
  /**
   * @param {HTMLElement} host
   * @param {object} vcd   parseVCD 결과
   * @param {Array}  sigs  [{path, width, label, radix}]
   */
  constructor(host, vcd, sigs, opts = {}) {
    this.host = host; this.vcd = vcd; this.sigs = sigs;
    this.labelW = opts.labelW || 92;
    this.rowH = opts.rowH || 34;
    this.padT = 26; this.padB = 24;
    this.cursorNs = opts.cursorNs ?? 10;
    this.onCursor = opts.onCursor || (() => {});
    this.render();
    window.addEventListener("resize", () => this.render());
  }

  setCursor(ns) {
    const max = this.vcd.endNs();
    this.cursorNs = Math.max(0, Math.min(max, ns));
    this.render();
    this.onCursor(this.cursorNs);
  }

  valueAt(sig, ns) {
    return pad(this.vcd.valueAtNs(sig.path, ns), sig.width);
  }

  fmt(sig, b) {
    if (b == null) return "–";
    if (sig.width === 1) return b;
    const u = bin2u(b);
    if (u === null) return b;
    if (sig.radix === "signed") return `${b} (${bin2s(b)})`;
    return `${b} (${u})`;
  }

  render() {
    const minW = this.labelW + (this.vcd.endNs() / 20) * 56 + 14;
    const W = Math.max(320, this.host.clientWidth || 640, minW);
    const H = this.padT + this.sigs.length * this.rowH + this.padB;
    const plotX = this.labelW, plotW = W - this.labelW - 14;
    const endNs = this.vcd.endNs() || 1;
    const x = (ns) => plotX + (ns / endNs) * plotW;

    this.host.innerHTML = "";
    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: "wv" });
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "시뮬레이션 파형");

    // --- 눈금 ---
    const stepNs = endNs <= 60 ? 10 : endNs <= 200 ? 20 : 40;
    for (let ns = 0; ns <= endNs + 0.001; ns += stepNs) {
      svg.appendChild(el("line", {
        x1: x(ns), y1: this.padT - 8, x2: x(ns), y2: H - this.padB + 4,
        class: "wv-grid",
      }));
      const tx = el("text", { x: x(ns), y: this.padT - 13, class: "wv-tick" });
      tx.textContent = ns;
      svg.appendChild(tx);
    }
    const unit = el("text", { x: W - 8, y: this.padT - 13, class: "wv-tick", "text-anchor": "end" });
    unit.textContent = "ns";
    svg.appendChild(unit);

    // --- 신호 ---
    this.sigs.forEach((sig, i) => {
      const yTop = this.padT + i * this.rowH + 5;
      const hgt = this.rowH - 14;
      const yHi = yTop, yLo = yTop + hgt, yMid = yTop + hgt / 2;

      const lb = el("text", { x: this.labelW - 10, y: yMid + 4, class: "wv-label", "text-anchor": "end" });
      lb.textContent = sig.label || sig.path;
      svg.appendChild(lb);

      // 변화 시점 수집
      const id = this.vcd.byPath[sig.path];
      const raw = id !== undefined ? this.vcd.changes[id] : [];
      const pts = [];
      for (const [t, v] of raw) {
        const ns = this.vcd.tToNs(t);
        if (ns > endNs) break;
        pts.push([ns, pad(v, sig.width)]);
      }
      if (!pts.length || pts[0][0] > 0) pts.unshift([0, pad(this.vcd.valueAtNs(sig.path, 0), sig.width)]);

      for (let k = 0; k < pts.length; k++) {
        const ns0 = pts[k][0], v = pts[k][1];
        const ns1 = k + 1 < pts.length ? pts[k + 1][0] : endNs;
        const x0 = x(ns0), x1 = x(ns1);
        if (x1 - x0 < 0.4) continue;

        if (sig.width === 1) {
          const yv = v === "1" ? yHi : v === "0" ? yLo : yMid;
          const cls = /[01]/.test(v) ? "wv-line" : "wv-line wv-x";
          svg.appendChild(el("line", { x1: x0, y1: yv, x2: x1, y2: yv, class: cls }));
          if (k > 0) {
            const prev = pts[k - 1][1];
            const yp = prev === "1" ? yHi : prev === "0" ? yLo : yMid;
            if (yp !== yv) svg.appendChild(el("line", { x1: x0, y1: yp, x2: x0, y2: yv, class: "wv-line" }));
          }
        } else {
          const bev = 4;
          const d = `M${x0} ${yMid} L${x0 + bev} ${yHi} L${x1 - bev} ${yHi} L${x1} ${yMid}
                     L${x1 - bev} ${yLo} L${x0 + bev} ${yLo} Z`;
          svg.appendChild(el("path", { d, class: "wv-bus" }));
          const u = bin2u(v);
          const label = u === null ? v : (sig.radix === "signed" ? `${u} (${bin2s(v)})` : `${v}`);
          if (x1 - x0 > 42) {
            const t = el("text", { x: (x0 + x1) / 2, y: yMid + 4, class: "wv-busval" });
            t.textContent = label;
            svg.appendChild(t);
          }
        }
      }
    });

    // --- 커서 ---
    const cx = x(this.cursorNs);
    svg.appendChild(el("line", { x1: cx, y1: this.padT - 10, x2: cx, y2: H - this.padB + 2, class: "wv-cursor" }));
    const cb = el("rect", { x: cx - 24, y: H - this.padB + 4, width: 48, height: 15, rx: 3, class: "wv-cbox" });
    svg.appendChild(cb);
    const ct = el("text", { x: cx, y: H - this.padB + 15, class: "wv-ctext" });
    ct.textContent = `${Math.round(this.cursorNs)} ns`;
    svg.appendChild(ct);

    // --- 클릭/드래그로 커서 이동 ---
    const toNs = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const sx = px * (W / r.width);
      return ((sx - plotX) / plotW) * endNs;
    };
    let drag = false;
    const down = (ev) => { drag = true; this.setCursor(toNs(ev)); ev.preventDefault(); };
    const move = (ev) => { if (drag) { this.setCursor(toNs(ev)); ev.preventDefault(); } };
    const up = () => { drag = false; };
    svg.addEventListener("mousedown", down);
    svg.addEventListener("touchstart", down, { passive: false });
    window.addEventListener("mousemove", move);
    svg.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", up);
    svg.addEventListener("touchend", up);

    this.host.appendChild(svg);
  }
}
