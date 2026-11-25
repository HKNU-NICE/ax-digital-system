/* ------------------------------------------------------------------
   vcd.js — VCD 파서 + SVG 파형 렌더러  (외부 라이브러리 없음)
   GHDL 이 만든 .vcd 를 그대로 읽어 브라우저에서 파형을 그린다.
------------------------------------------------------------------ */
export function parseVCD(text) {
  const vars = {};          // id -> {name, width, path}
  const byPath = {};        // "dut.sum" -> id
  const changes = {};       // id -> [[t, value], ...]
  let scope = [];
  let tsFs = 1;             // 1 time unit = tsFs femtoseconds
  let t = 0;
  let endTime = 0;

  const UNIT = { s: 1e15, ms: 1e12, us: 1e9, ns: 1e6, ps: 1e3, fs: 1 };

  const lines = text.split(/\r?\n/);
  let inDefs = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (inDefs) {
      if (line.startsWith("$timescale")) {
        // "$timescale 1 fs $end"  또는 다음 줄에 값
        let body = line.replace("$timescale", "").replace("$end", "").trim();
        if (!body) body = (lines[++i] || "").trim();
        const m = body.match(/([\d.]+)\s*([a-z]+)/i);
        if (m) tsFs = parseFloat(m[1]) * (UNIT[m[2].toLowerCase()] || 1);
        continue;
      }
      if (line.startsWith("$scope")) {
        const p = line.split(/\s+/);
        scope.push(p[2]);
        continue;
      }
      if (line.startsWith("$upscope")) { scope.pop(); continue; }
      if (line.startsWith("$var")) {
        // $var reg 4 " a[3:0] $end
        const p = line.split(/\s+/);
        const width = parseInt(p[2], 10);
        const id = p[3];
        let name = p[4];
        const base = name.replace(/\[.*$/, "");
        const path = scope.slice(1).concat(base).join(".");   // 최상위 스코프 생략
        vars[id] = { name: base, width, path, raw: name };
        if (!(path in byPath)) byPath[path] = id;
        changes[id] = [];
        continue;
      }
      if (line.startsWith("$enddefinitions")) { inDefs = false; continue; }
      continue;
    }

    // ---- 값 변화 구간 ----
    if (line[0] === "#") { t = parseInt(line.slice(1), 10); if (t > endTime) endTime = t; continue; }

    if (line[0] === "b" || line[0] === "B") {
      const sp = line.indexOf(" ");
      const val = line.slice(1, sp);
      const id = line.slice(sp + 1).trim();
      if (changes[id]) changes[id].push([t, val]);
    } else if (line[0] === "r" || line[0] === "R") {
      const sp = line.indexOf(" ");
      const id = line.slice(sp + 1).trim();
      if (changes[id]) changes[id].push([t, line.slice(1, sp)]);
    } else {
      const val = line[0];
      const id = line.slice(1).trim();
      if (changes[id]) changes[id].push([t, val]);
    }
  }

  return {
    tsFs, endTime, vars, byPath, changes,
    /** 신호 경로의 t(시간단위) 시점 값을 돌려준다. */
    valueAt(path, tq) {
      const id = byPath[path];
      if (id === undefined) return null;
      const arr = changes[id];
      let v = null;
      for (const [ct, cv] of arr) { if (ct <= tq) v = cv; else break; }
      return v;
    },
    /** ns 단위로 질의 */
    valueAtNs(path, ns) { return this.valueAt(path, Math.round(ns * 1e6 / tsFs)); },
    nsToT(ns) { return Math.round(ns * 1e6 / tsFs); },
    tToNs(tv) { return tv * tsFs / 1e6; },
    endNs() { return this.tToNs(endTime); },
    paths() { return Object.keys(byPath); },
  };
}

/** 2진 문자열 -> 부호 없는 10진 */
export function bin2u(b) {
  if (b == null) return null;
  if (/[^01]/.test(b)) return null;
  return parseInt(b, 2);
}
/** 2진 문자열 -> 2의 보수 10진 */
export function bin2s(b) {
  const u = bin2u(b);
  if (u === null) return null;
  const n = b.length;
  return u >= (1 << (n - 1)) ? u - (1 << n) : u;
}
/** 폭을 맞춰 0 채우기 (VCD 는 앞 0 을 생략한다) */
export function pad(b, w) {
  if (b == null) return null;
  if (b.length >= w) return b.slice(-w);
  const f = /[01]/.test(b[0]) ? "0" : b[0];
  return f.repeat(w - b.length) + b;
}
