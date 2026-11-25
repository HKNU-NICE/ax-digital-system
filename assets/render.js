/* ══════════════════════════════════════════════════════════════
   render.js — 주차 설정의 "블록"을 HTML 로 바꾼다.
   주차마다 글·그림·표·코드가 다르므로 내용은 설정 파일에만 두고,
   그리는 방법은 이 파일 하나에 모은다.
══════════════════════════════════════════════════════════════ */

export const $ = (id) => document.getElementById(id);

export const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 표 한 장. hl 로 특정 칸을 강조한다. hl = [[행,칸], ...] (0부터) */
function table(b) {
  const hl = new Set((b.hl || []).map(([r, c]) => `${r},${c}`));
  const head = `<thead><tr>${b.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
  const body = b.rows.map((row, ri) =>
    `<tr>${row.map((cell, ci) =>
      `<td${hl.has(`${ri},${ci}`) ? ' class="hl"' : ""}>${cell}</td>`).join("")}</tr>`).join("");
  return `<table class="spec ${b.cls || ""}">${head}<tbody>${body}</tbody></table>`;
}

/** 코드 상자. copy 가 참이면 복사 단추를 붙인다. */
function code(b, i) {
  const cid = `code-${b.key || i}`;
  const tag = b.tag ? `<span class="codetag ${b.ok ? "ok" : ""}">${b.tag}</span>` : "";
  const btn = b.copy ? `<button class="btn" data-copy="${cid}" type="button">코드 복사</button>` : "";
  return `<div class="codehead"><span class="codename">${b.name || ""} ${tag}</span>${btn}</div>
          <pre id="${cid}"${b.hidden ? " hidden" : ""}>${esc(b.text)}</pre>`;
}

export function blockHTML(b, i) {
  switch (b.t) {
    case "p":     return `<p class="lead">${b.html}</p>`;
    case "hint":  return `<p class="q-hint" style="margin-top:1rem">${b.html}</p>`;
    case "note":  return `<div class="note">${b.html}</div>`;
    case "table": return (b.caption ? `<p class="q-hint" style="margin-top:1rem">${b.caption}</p>` : "") + table(b);
    case "code":  return code(b, i);
    case "fig":   return `<div class="figwrap">
        <img src="${b.src}" alt="${esc(b.alt || "")}" loading="lazy">
        ${b.cap ? `<div class="figcap">${b.cap}</div>` : ""}</div>`;
    case "html":  return b.html;
    default:      return "";
  }
}

export function renderBlocks(host, blocks) {
  if (!host || !blocks) return;
  host.insertAdjacentHTML("beforeend", blocks.map(blockHTML).join("\n"));
}

/** 블록 안의 코드 복사 단추를 모두 연결한다. */
export function wireCopy(root = document) {
  root.querySelectorAll("[data-copy]").forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = "1";
    btn.addEventListener("click", async () => {
      const pre = $(btn.dataset.copy);
      if (!pre) return;
      try {
        await navigator.clipboard.writeText(pre.innerText);
        btn.textContent = "복사했습니다";
      } catch (_) {
        const r = document.createRange();
        r.selectNodeContents(pre);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        btn.textContent = "코드를 선택했습니다 — 직접 복사하세요";
      }
      setTimeout(() => { btn.textContent = "코드 복사"; }, 2500);
    });
  });
}

/** 한 단계(step) 상자를 만들고 내부 블록을 채운 뒤 본문 영역을 돌려준다. */
export function stepBox(host, s, cls = "") {
  const sec = document.createElement("section");
  sec.className = "step";
  const pts = s.pts ? ` <span class="pts">${s.pts}</span>` : "";
  sec.innerHTML = `<div class="step-head">
      <span class="step-no ${cls}">${s.no}</span><h2>${s.title}${pts}</h2></div>`;
  host.appendChild(sec);
  renderBlocks(sec, s.blocks);
  return sec;
}

/** 체크리스트 */
export function listTo(el, items) {
  if (!el) return;
  el.hidden = false;
  el.innerHTML = items.map((i) => `<li class="${i.ok ? "" : "no"}">${i.label}</li>`).join("");
}

/** 파일 고르는 칸 하나 */
export function dropHTML(id, label, opt = {}) {
  const accept = opt.accept || "image/*";
  return `<div class="drop" id="drop-${id}">
      <input type="file" id="file-${id}" accept="${accept}"${opt.multiple ? " multiple" : ""}
             style="display:block;margin:0 auto">
      <div id="name-${id}" class="q-hint" style="margin-top:.5rem">${label}</div>
    </div>`;
}

/** 2진 문자열 */
export const bin = (v, w) => (v >>> 0).toString(2).padStart(w, "0");
