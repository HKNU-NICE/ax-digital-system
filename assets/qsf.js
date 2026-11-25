/* ------------------------------------------------------------------
   qsf.js — Quartus .qsf 핀 배정 검사 (브라우저에서 즉시)
------------------------------------------------------------------ */

/** Lab 4 가 배정해야 하는 신호 전체 (41개) */
export function expectedSignals() {
  const out = [];
  for (let i = 0; i < 10; i++) out.push(`SW[${i}]`);
  for (let i = 0; i < 3; i++) out.push(`LEDR[${i}]`);
  for (let h = 0; h < 4; h++) for (let s = 0; s < 7; s++) out.push(`HEX${h}[${s}]`);
  return out;                                   // 10 + 3 + 28 = 41
}

/** 교안 슬라이드가 명시한 대표 핀 — 이것만은 반드시 맞아야 한다 */
export const KNOWN_PINS = {
  "SW[0]":   "PIN_AB12",
  "SW[4]":   "PIN_AD11",
  "SW[9]":   "PIN_AE12",
  "LEDR[0]": "PIN_V16",
  "LEDR[1]": "PIN_W16",
  "HEX0[0]": "PIN_AE26",
  "HEX3[0]": "PIN_AD17",
};

/** .qsf 텍스트에서 set_location_assignment 를 뽑아낸다 */
export function parseQsf(text) {
  const map = {};          // 신호 -> 핀
  const dup = [];
  const lines = String(text).split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    // set_location_assignment PIN_AB12 -to SW[0]
    const m = line.match(/set_location_assignment\s+(PIN_\w+)\s+-to\s+(\S+)/i);
    if (!m) continue;
    const pin = m[1].toUpperCase();
    const sig = m[2].replace(/"/g, "");
    if (map[sig]) dup.push(sig);
    map[sig] = pin;
  }
  return { map, dup };
}

/**
 * 채점. fullTable 이 주어지면 전체 핀까지 대조하고,
 * 없으면 구조 + 대표 핀만 본다.
 */
export function checkQsf(text, fullTable = null) {
  const { map, dup } = parseQsf(text);
  const want = expectedSignals();
  const got = Object.keys(map);

  const missing = want.filter((s) => !(s in map));
  const extra = got.filter((s) => !want.includes(s));

  // 핀 하나가 두 신호에 배정되었는지
  const byPin = {};
  const pinClash = [];
  for (const [s, pin] of Object.entries(map)) {
    if (byPin[pin]) pinClash.push(`${pin} → ${byPin[pin]} 와 ${s}`);
    byPin[pin] = s;
  }

  const table = fullTable || KNOWN_PINS;
  const wrong = [];
  for (const [sig, pin] of Object.entries(table)) {
    if (map[sig] && map[sig] !== pin) wrong.push({ sig, got: map[sig], want: pin });
  }

  const items = [
    { label: `배정 개수 ${got.length} / 41`, ok: got.length === 41 },
    { label: missing.length ? `빠진 신호 ${missing.length}개 : ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? " …" : ""}`
                            : "빠진 신호 없음", ok: missing.length === 0 },
    { label: extra.length ? `모르는 신호 ${extra.length}개 : ${extra.slice(0, 4).join(", ")}` : "엉뚱한 신호 없음",
      ok: extra.length === 0 },
    { label: dup.length ? `같은 신호에 두 번 배정 : ${[...new Set(dup)].join(", ")}` : "신호 중복 배정 없음",
      ok: dup.length === 0 },
    { label: pinClash.length ? `한 핀에 두 신호 : ${pinClash.slice(0, 3).join(" / ")}` : "핀 충돌 없음",
      ok: pinClash.length === 0 },
    { label: wrong.length ? `핀 번호 틀림 ${wrong.length}곳 : ` +
              wrong.slice(0, 3).map((w) => `${w.sig} 은 ${w.want} 인데 ${w.got}`).join(", ")
            : (fullTable ? "모든 핀 번호 일치" : "대표 핀 7개 일치"), ok: wrong.length === 0 },
  ];

  const pass = items.every((i) => i.ok);
  return { pass, items, count: got.length, missing, extra, wrong };
}

/* ---------------- 보드 시연 : 학번별 지정 조합 ---------------- */

/** 교안 Lab 4 사양대로 보드에 무엇이 보여야 하는지 계산한다 */
export function boardExpect(a, b, sub) {
  const r = ((sub ? a - b : a + b) % 16 + 16) % 16;
  const c = sub ? (a >= b ? 1 : 0) : (a + b > 15 ? 1 : 0);
  const sa = a > 7 ? a - 16 : a, sb = b > 7 ? b - 16 : b;
  const sr = sub ? sa - sb : sa + sb;
  const v = (sr > 7 || sr < -8) ? 1 : 0;
  // 덧셈이면 carry 를 5번째 비트로 붙여 0~30, 뺄셈이면 4비트 결과만
  const shown = sub ? r : (c * 16 + r);
  return {
    r, c, v, shown,
    hex10: String(shown).padStart(2, "0"),          // HEX1 HEX0
    hex16: r.toString(16).toUpperCase(),            // HEX3
  };
}

/** 학번으로 시연 조합 두 가지를 정한다 (옆자리와 다르게) */
export function boardCases(sid) {
  let h = 2166136261;
  for (const ch of String(sid)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const u = h >>> 0;
  // 하나는 덧셈(오버플로 보이게), 하나는 뺄셈
  const addA = 4 + (u % 4), addB = 4 + ((u >>> 5) % 4);        // 4~7 + 4~7 → 부호 넘침 구간
  const subA = 8 + ((u >>> 11) % 8), subB = 1 + ((u >>> 17) % 7);
  return [
    { label: "덧셈", a: addA, b: addB, sub: 0 },
    { label: "뺄셈", a: subA, b: subB, sub: 1 },
  ];
}

/* ══════════════════════════════════════════════════════════════
   주차 공통 — 그 주차의 실제 .qsf 핀 표와 통째로 대조한다.
   pinmap 은 교수님 프로젝트의 .qsf 에서 그대로 뽑은 것이다.
══════════════════════════════════════════════════════════════ */
export function checkQsfAgainst(text, pinmap) {
  const { map, dup } = parseQsf(text);
  const want = Object.keys(pinmap);
  const got = Object.keys(map);
  const missing = want.filter((s) => !(s in map));
  const extra = got.filter((s) => !want.includes(s));

  const byPin = {};
  const pinClash = [];
  for (const [s, pin] of Object.entries(map)) {
    if (byPin[pin]) pinClash.push(`${pin} → ${byPin[pin]} 와 ${s}`);
    byPin[pin] = s;
  }
  const wrong = [];
  for (const [sig, pin] of Object.entries(pinmap)) {
    if (map[sig] && map[sig] !== pin) wrong.push({ sig, got: map[sig], want: pin });
  }
  const n = want.length;
  const items = [
    { label: `배정 개수 ${got.length} / ${n}`, ok: got.length === n },
    { label: missing.length ? `빠진 신호 ${missing.length}개 : ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? " …" : ""}`
                            : "빠진 신호 없음", ok: missing.length === 0 },
    { label: extra.length ? `모르는 신호 ${extra.length}개 : ${extra.slice(0, 4).join(", ")}` : "엉뚱한 신호 없음",
      ok: extra.length === 0 },
    { label: dup.length ? `같은 신호에 두 번 배정 : ${[...new Set(dup)].join(", ")}` : "신호 중복 배정 없음",
      ok: dup.length === 0 },
    { label: pinClash.length ? `한 핀에 두 신호 : ${pinClash.slice(0, 3).join(" / ")}` : "핀 충돌 없음",
      ok: pinClash.length === 0 },
    { label: wrong.length ? `핀 번호 틀림 ${wrong.length}곳 : ` +
              wrong.slice(0, 3).map((w) => `${w.sig} 은 ${w.want} 인데 ${w.got}`).join(", ")
            : "모든 핀 번호 일치", ok: wrong.length === 0 },
  ];
  return { pass: items.every((i) => i.ok), items, count: got.length, missing, extra, wrong };
}
