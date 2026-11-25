/* ------------------------------------------------------------------
   lab.js — 자가점검 문항 생성 · 채점 · 제출
   ★ 정답은 페이지에 들어 있지 않다. 매번 VCD 에서 계산한다.
------------------------------------------------------------------ */
import { pad, bin2u, bin2s } from "./vcd.js";

/** 학번에서 재현 가능한 시드를 만든다 (같은 학번 → 같은 문항) */
export function seedFrom(sid) {
  let h = 2166136261;
  for (const ch of String(sid).trim()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}
const rnd = (seed, n) => Math.abs(seed >>> 0) % n;   // 반드시 부호 없는 값으로

/** 구간(각 20ns)의 중간 시각 목록 */
export const segMid = (vcd, step = 20) => {
  const out = [];
  for (let ns = step / 2; ns < vcd.endNs(); ns += step) out.push(Math.round(ns));
  return out;
};

/** 학번 시드로 서로 다른 시각 n 개를 고른다 */
export function pickTimes(vcd, sid, n, step = 20) {
  const s = seedFrom(sid);
  const mids = segMid(vcd, step);
  const out = [];
  for (let k = 0; k < n; k++) out.push(mids[rnd(s >>> (k * 4), mids.length)]);
  return { times: out, mids };
}

/* ----------------------------------------------------------------
   문항 만들기 — 정답은 전부 VCD 에서 계산한다 (페이지에 없음)
   주차마다 아래 조립 함수로 네 문항을 구성한다.
---------------------------------------------------------------- */
const get = (vcd, path, w, ns) => pad(vcd.valueAtNs(path, ns), w);

/** 벡터 신호를 2진으로 읽는 문항 */
export function qVector(vcd, id, path, w, ns, label, hint) {
  return {
    id, points: 10,
    ask: `<b>${ns} ns</b> 에서 <code>${label}</code> 를 2진 ${w}비트로 적으시오.`,
    hint, placeholder: "예: " + "0".repeat(w - 1) + "1",
    answer: () => get(vcd, path, w, ns),
    check: (v) => v.replace(/\s/g, "") === get(vcd, path, w, ns),
  };
}

/** 1비트 신호를 읽는 문항 */
export function qBit(vcd, id, path, ns, label, hint) {
  return {
    id, points: 10,
    ask: `<b>${ns} ns</b> 에서 <code>${label}</code> 은 0 인가 1 인가?`,
    hint, placeholder: "0 또는 1",
    answer: () => get(vcd, path, 1, ns),
    check: (v) => v.trim() === get(vcd, path, 1, ns),
  };
}

/** 특정 1비트 신호가 1인 구간 수를 세는 문항 */
export function qCount(vcd, id, path, label, hint, step = 20) {
  const mids = segMid(vcd, step);
  const n = mids.filter((ns) => get(vcd, path, 1, ns) === "1").length;
  return {
    id, points: 10,
    ask: `전체 <b>${mids.length}</b>개 구간 중 <code>${label}</code> 이 <b>1</b> 인 구간은 모두 몇 개인가?`,
    hint, placeholder: "예: 3",
    answer: () => String(n),
    check: (v) => parseInt(v, 10) === n,
  };
}

/** 벡터를 10진수로 해석하는 문항 (signed / unsigned) */
export function qDecimal(vcd, id, path, w, ns, label, signed, hint) {
  const val = () => String(signed ? bin2s(get(vcd, path, w, ns)) : bin2u(get(vcd, path, w, ns)));
  return {
    id, points: 10,
    ask: `<b>${ns} ns</b> 에서 <code>${label}</code> 를 <b>${signed ? "부호 있는 수(2의 보수)" : "부호 없는 수"}</b>로 읽으면 몇인가?`,
    hint, placeholder: signed ? "예: -2" : "예: 12",
    answer: val,
    check: (v) => parseInt(v, 10) === parseInt(val(), 10),
  };
}

/** 서술 답안의 개념 포함 여부 — 점수가 아니라 '다시 쓰게 하는' 피드백용 */
export function conceptCheck(text, concepts) {
  const t = (text || "").replace(/\s/g, "");
  return concepts.map((c) => ({
    label: c.label,
    hit: c.words.some((w) => t.includes(w.replace(/\s/g, ""))),
  }));
}

/* ---------------- 제출 ---------------- */

export async function submit(endpoint, payload) {
  if (!endpoint) return { ok: false, reason: "no-endpoint" };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const txt = await res.text();
    let j = null; try { j = JSON.parse(txt); } catch (_) {}
    return { ok: res.ok && (!j || j.ok !== false), body: j || txt };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

/** 전송이 안 되는 환경(미리보기·오프라인)에서는 파일로 내려받게 한다 */
export function downloadSubmission(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** 파일 -> base64 (보고서 PDF 업로드용) */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/* ---------------- GHDL 실행 (Actions 경유) ---------------- */

/** 실행 요청 → jobId */
export async function runCode(endpoint, payload) {
  return postJSON(endpoint, Object.assign({ action: "run" }, payload));
}
/** 상태 조회 */
export async function runStatus(endpoint, secret, jobId) {
  return postJSON(endpoint, { action: "status", secret, jobId });
}
async function postJSON(endpoint, body) {
  if (!endpoint) return { ok: false, error: "no-endpoint" };
  try {
    const r = await fetch(endpoint, {
      method: "POST", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    const t = await r.text();
    try { return JSON.parse(t); } catch (_) { return { ok: false, error: t.slice(0, 200) }; }
  } catch (e) { return { ok: false, error: String(e) }; }
}

/**
 * 실행을 요청하고 끝날 때까지 기다린다.
 * onTick(초) 으로 경과를 알려 준다.
 */
export async function runAndWait(endpoint, secret, payload, onTick, maxSec = 180) {
  const started = await runCode(endpoint, Object.assign({ secret }, payload));
  if (!started.ok) return started;
  const t0 = Date.now();
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    const el = Math.round((Date.now() - t0) / 1000);
    if (onTick) onTick(el);
    const st = await runStatus(endpoint, secret, started.jobId);
    if (st.ok && st.status && st.status !== "queued" && st.status !== "unknown") return st;
    if (el > maxSec) return { ok: false, error: "시간이 초과되었습니다. 잠시 뒤 다시 시도하세요." };
  }
}

/* ---------------- 진행 상태 보관 (브라우저) ---------------- */
const KEY = (lab) => `vhdl-lab-${lab}`;
export function saveLocal(lab, data) {
  try { localStorage.setItem(KEY(lab), JSON.stringify(data)); } catch (_) {}
}
export function loadLocal(lab) {
  try { return JSON.parse(localStorage.getItem(KEY(lab)) || "null"); } catch (_) { return null; }
}
