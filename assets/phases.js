/* ══════════════════════════════════════════════════════════════
   pre / in / post 세 단계에 쓰는 것들
   ────────────────────────────────────────────────────────────
   · 개념 확인 문항
   · 학번에서 뽑은 예측 문제와 손계산 정답
   · 예측 ↔ 실제 대조
══════════════════════════════════════════════════════════════ */

/* ---------- 개념 확인 (5문항 × 3점) ---------- */
export const CONCEPTS = [
  { q: "반가산기의 합 <code>s</code> 와 자리올림 <code>c</code> 를 바르게 적은 것은?",
    opts: ["s = a xor b,  c = a and b",
           "s = a and b,  c = a xor b",
           "s = a or b,   c = a and b",
           "s = a xor b,  c = a or b"], ans: 0 },
  { q: "전가산기 하나는 무엇으로 만들 수 있습니까?",
    opts: ["반가산기 1개 + OR 1개",
           "반가산기 2개 + OR 1개",
           "반가산기 2개 + AND 1개",
           "반가산기 4개"], ans: 1 },
  { q: "<code>sub='1'</code> 일 때 뺄셈이 되게 하려면 b 를 어떻게 합니까?",
    opts: ["b 를 XOR 로 반전만 하면 된다",
           "b 를 XOR 로 반전하고, 사슬 맨 아래 자리올림 입력에 1 을 넣는다",
           "b 를 AND 로 0 으로 만든다",
           "a 와 b 를 서로 바꾼다"], ans: 1 },
  { q: "<code>C</code> 와 <code>V</code> 는 무엇이 다릅니까?",
    opts: ["C 는 덧셈, V 는 뺄셈에서만 쓴다",
           "C 는 부호 없는 수로 볼 때, V 는 부호 있는 수로 볼 때 넘쳤는지를 말한다",
           "둘은 같은 신호의 다른 이름이다",
           "C 는 하드웨어, V 는 소프트웨어가 만든다"], ans: 1 },
  { q: "리플 캐리 가산기가 비트 수가 늘수록 느려지는 까닭은?",
    opts: ["게이트가 많아져서",
           "자리올림이 아래 자리에서 위 자리로 차례로 번져 가기 때문에",
           "클록이 느려서",
           "XOR 가 AND 보다 느려서"], ans: 1 },
];

/* ---------- 학번으로 섞기 (같은 문항, 다른 보기 순서) ---------- */
export function shuffleOpts(opts, ansIdx, seed, qi) {
  const n = opts.length;
  const order = [...Array(n).keys()];
  let x = (seed ^ (qi * 2654435761)) >>> 0;
  for (let i = n - 1; i > 0; i--) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { opts: order.map((k) => opts[k]), ans: order.indexOf(ansIdx) };
}

/* ---------- 예측 문제 : 학번에서 a, b, cin 을 뽑는다 ---------- */
export function predictCases(seed) {
  // 자리올림이 실제로 번져 가는 경우가 나오도록 고른다 (a, b 가 1 이상이고 두 경우가 서로 다르게)
  let x = (seed >>> 0) || 1;
  const nx = () => (x = (x * 1664525 + 1013904223) >>> 0);
  const pick = () => 1 + (nx() % 15);            // 1 ~ 15
  const c1 = { a: pick(), b: pick(), cin: 0 };
  let c2 = { a: pick(), b: pick(), cin: 1 };
  let guard = 0;
  while ((c2.a === c1.a && c2.b === c1.b) && guard++ < 8) c2 = { a: pick(), b: pick(), cin: 1 };
  return [c1, c2];
}

/* ---------- 리플 캐리를 손으로 더하듯 그대로 계산 ---------- */
export function rippleAdd(a, b, cin) {
  const c = [cin];                       // c(0) .. c(4)
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const ai = (a >> i) & 1, bi = (b >> i) & 1, ci = c[i];
    s |= (ai ^ bi ^ ci) << i;
    c.push((ai & bi) | (ci & (ai ^ bi)));
  }
  return {
    s:     s.toString(2).padStart(4, "0"),
    cout:  String(c[4]),
    chain: c.slice().reverse().join(""),   // c(4) c(3) c(2) c(1) c(0)
  };
}

export const bin = (v, w) => (v >>> 0).toString(2).padStart(w, "0");

/* ---------- 예측과 실제를 맞춰 본다 ---------- */
export function comparePrediction(pred, seed) {
  const cases = predictCases(seed);
  const rows = [];
  let right = 0, total = 0;
  cases.forEach((cse, k) => {
    const want = rippleAdd(cse.a, cse.b, cse.cin);
    const got  = (pred && pred[k]) || { s: "", cout: "", chain: "" };
    [["s", "합 s"], ["cout", "자리올림 cout"], ["chain", "사슬 c(4..0)"]].forEach(([key, label]) => {
      const mine = (got[key] || "").trim();
      const ok = mine !== "" && mine === want[key];
      if (ok) right++;
      total++;
      rows.push({ case: k + 1, a: cse.a, b: cse.b, cin: cse.cin,
                  label, mine: mine || "(빈칸)", want: want[key], ok });
    });
  });
  return { rows, right, total };
}
