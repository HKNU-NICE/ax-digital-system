/* ══════════════════════════════════════════════════════════════
   week.js — 주차 공통 엔진
   ──────────────────────────────────────────────────────────────
   한 주차 페이지의 모든 동작이 여기 들어 있다. 주차마다 다른 것은
   assets/weeks/wNN.js 의 설정 하나뿐이다.

        ① 수업 전 pre   30점   개념확인 · waveform 예측 · 코드 읽기
        ② 수업 중 in    40점   따라 만들기 · 예측 대조 · 자가점검
                               설계 · synthesis · 핀배정 · 보드 시연
        ③ 수업 후 post  30점   RTL View · 동작 설명 · 토의

   단계마다 따로 제출하고 단계마다 보고서 PDF 가 생성된다.
══════════════════════════════════════════════════════════════ */
import { parseVCD, pad } from "./vcd.js";
import { WaveView } from "./wave.js";
import { conceptCheck, submit, downloadSubmission, fileToBase64,
         saveLocal, loadLocal, runAndWait, seedFrom,
         pickTimes, qVector, qBit, qCount, qDecimal } from "./lab.js";
import { SlideDeck } from "./slides.js";
import { checkQsfAgainst } from "./qsf.js";
import { shuffleOpts } from "./phases.js";
import { $, esc, renderBlocks, wireCopy, stepBox, listTo, dropHTML, bin } from "./render.js";
import { CONFIG } from "../config.js";

/* ---------- 공통 상태 ---------- */
const S = {
  vcd: null, view: null,
  cQuiz: [], cScore: 0, cGraded: false,
  pRun: null, pLog: "", practiceFile: null,
  cmp: null,
  qs: [], graded: false,
  lastRun: null, lastLog: "",
  qsfText: null, qsfOk: false, quartusOk: false,
  boardOk: false, bCases: [],
  capFile: null, rtlFile: null, waveFile: null, boardFiles: [],
  picked: [], pickedPost: [],
  skeleton: "",
  huntRun: null, huntLog: "",
  texts: {}, files: {},          // 실습이 없는 주차에서 쓰는 자유 입력칸과 파일칸
};
let W = null;
const has = (k) => !!(W && W[k]);
const PH = { pre: "예습", in: "실습", post: "과제" };

/* ══════════════════════════════════════════════════════════════
   1. 페이지 뼈대 만들기
══════════════════════════════════════════════════════════════ */
function shell() {
  const facts = [
    ["① 수업 전", (W.points?.pre ?? 30) + "점"],
    ["② 수업 중", (W.points?.in ?? 40) + "점"],
    ["③ 수업 후", (W.points?.post ?? 30) + "점"],
    ["보고서", "단계마다 자동 생성"],
  ];
  document.body.insertAdjacentHTML("afterbegin", `
<header class="topbar"><div class="wrap">
  <div class="brand">AX 디지털시스템<small>한경국립대학교 · ICT로봇공학전공</small></div>
  <div class="spacer"></div>
  <a class="btn" href="ai.html">AI 학습법</a>
  <a class="btn" href="index.html">주차 목록</a>
  <button class="btn" id="theme" type="button">테마</button>
</div></header>

<section class="hero"><div class="wrap">
  <div class="eyebrow">Week ${String(W.no).padStart(2, "0")} · ${W.topic}</div>
  <h1>${W.h1}</h1>
  <p>${W.lead}</p>
  <div class="chips">${(W.chips || []).map((c) => `<span class="chip">${c}</span>`).join("")}</div>
  <dl class="facts" style="margin-top:1rem">
    ${facts.map(([k, v]) => `<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
  </dl>
</div></section>

<main>
  <div class="wrap"><section class="step">
    <div class="idbar">
      <label for="sid">학번</label>
      <input type="text" id="sid" inputmode="numeric" placeholder="20261234" autocomplete="off" style="width:10rem">
      <input type="text" id="sname" placeholder="이름" autocomplete="off" style="width:7rem">
      <button class="btn btn-primary" id="start" type="button">시작</button>
      <span class="q-hint" id="idmsg">학번을 넣으면 본인 문항과 예측 문제가 만들어집니다.</span>
    </div>
  </section></div>

  <div class="band band-lec"><div class="wrap">
    <div class="band-head"><span class="band-tag">① 수업 전 · pre-class</span>
      <h2>${W.pre.head}</h2><p>${W.pre.sub} <span class="pts">${W.points?.pre ?? 30}점</span></p></div>
    <div id="sec-pre"></div>
  </div></div>

  <div class="band band-lab"><div class="wrap">
    <div class="band-head"><span class="band-tag">② 수업 중 · in-class</span>
      <h2>${W.inc.head}</h2><p>${W.inc.sub} <span class="pts">${W.points?.in ?? 40}점</span></p></div>
    <div id="sec-in"></div>
  </div></div>

  <div class="band band-task"><div class="wrap">
    <div class="band-head"><span class="band-tag task">③ 수업 후 · post-class</span>
      <h2>${W.post.head}</h2><p>${W.post.sub} <span class="pts">${W.points?.post ?? 30}점</span></p></div>
    <div id="sec-post"></div>
  </div></div>
</main>

<footer><div class="wrap">
  한경국립대학교 ICT로봇공학전공 · AX 디지털시스템 · Week ${String(W.no).padStart(2, "0")}<br>
  ${W.footnote || ""}
</div></footer>`);

  $("theme").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : cur === "light" ? "dark"
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("vhdl-theme", next); } catch (_) {}
    if (S.view) S.view.render();
  });
  try {
    const t = localStorage.getItem("vhdl-theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (_) {}
}

/* ══════════════════════════════════════════════════════════════
   2. 위젯 — step 안에 들어가는 상호작용 부분
══════════════════════════════════════════════════════════════ */
const WIDGET = {

  /* ---------- 강의 슬라이드 ---------- */
  deck(sec) {
    sec.insertAdjacentHTML("beforeend",
      `<div id="deck"></div>
       <p class="q-hint" style="margin-top:.6rem">슬라이드는 수업에서 쓰는 자료와 같습니다.
       본 데까지 자동으로 기억되니 중간에 닫아도 이어서 볼 수 있습니다.</p>`);
  },

  /* ---------- 개념 확인 (5문항) ---------- */
  concept(sec) {
    const max = W.concepts.length * 3;
    sec.insertAdjacentHTML("beforeend", `
      <div id="concept"><p class="q-hint">학번을 넣고 <b>시작</b>을 누르면 문항이 나타납니다.</p></div>
      <div class="tally" id="c-tally" hidden>
        <div><div class="q-hint">점수</div><div class="big"><span id="c-score">0</span> / ${max}</div></div>
        <div class="spacer"></div>
        <button class="btn btn-primary" id="c-grade" type="button">채점</button>
      </div>`);
    $("c-grade").addEventListener("click", gradeConcept);
  },

  /* ---------- waveform 미리 그려 보기 ---------- */
  predict(sec) {
    sec.insertAdjacentHTML("beforeend",
      `<div id="predict"><p class="q-hint">학번을 넣고 <b>시작</b>을 누르세요.</p></div>`);
  },

  /* ---------- 코드 읽기 ---------- */
  reading(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <p class="lead"><b>질문.</b> ${W.pre.reading.question}</p>
      <textarea id="pre-read" placeholder="${esc(W.pre.reading.ph)}"></textarea>
      <p class="q-hint" style="margin-top:.9rem"><b>막힌 곳이 있으면 적어 주세요.</b>
         수업 시작할 때 많이 나온 질문부터 다룹니다.</p>
      <textarea id="pre-ask" placeholder="${esc(W.pre.reading.askPh)}" style="min-height:4.5rem"></textarea>`);
  },

  /* ---------- 예습 제출 ---------- */
  submitPre(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <ul class="checklist" id="ready-pre"></ul>
      <div class="q-row" style="margin-top:.9rem">
        <button class="btn btn-primary" id="submit-pre" type="button">예습 제출</button>
        <button class="btn" id="download-pre" type="button">파일로 저장</button>
      </div>
      <div class="status" id="status-pre"></div>`);
  },

  /* ---------- 따라 만들기 : 직접 입력해 실행 ---------- */
  practice(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <div class="codehead">
        <span class="codename">${W.inc.practice.file} <span class="codetag">직접 입력</span></span>
        <button class="btn" id="p-clear" type="button">비우기</button>
      </div>
      <textarea id="p-code" class="editor" spellcheck="false" autocapitalize="off" autocorrect="off"
        placeholder="앞 단계의 코드를 보고 직접 입력하세요."></textarea>
      <div class="q-row">
        <button class="btn btn-primary" id="p-run" type="button">GHDL 로 실행</button>
        <span class="verdict" id="p-badge" hidden></span>
        <span class="q-hint" id="p-hint">${W.inc.practice.checkNote}</span>
      </div>
      <pre id="p-console" class="console" hidden></pre>
      <div class="note" style="margin-top:.9rem"><b>본인 ModelSim 화면도 한 장.</b>
        같은 설계를 ModelSim 에서도 돌리고 <code>${W.inc.practice.sigs}</code> 가 보이는
        waveform 을 캡처해 올리세요. 보고서의 실습 부분이 됩니다.</div>
      ${dropHTML("practice", "실습 waveform 캡처 — ModelSim Wave 창")}`);

    $("p-clear").addEventListener("click", () => { $("p-code").value = ""; persist(); ready(); });
    $("p-code").addEventListener("input", () => { persist(); ready(); });
    $("p-run").addEventListener("click", runPractice);
  },

  /* ---------- waveform 보기 ---------- */
  wave(sec) {
    const step = W.inc.wave.step || 20;
    sec.insertAdjacentHTML("beforeend", `
      <div class="scope">
        <div class="scope-top">
          <span class="t" id="scope-range">0 – ? ns</span>
          <span class="t" id="scope-seg">각 ${step} ns</span>
          <div class="spacer"></div>
          <button class="btn" id="prev" type="button">◀ 이전</button>
          <button class="btn" id="next" type="button">다음 ▶</button>
        </div>
        <div class="wavebox" id="wave"></div>
        <dl class="readout" id="readout"></dl>
      </div>`);
    $("prev").addEventListener("click", () => segJump(-1));
    $("next").addEventListener("click", () => segJump(1));
  },

  /* ---------- 예측 대조 ---------- */
  compare(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <div class="codehead" style="margin-top:1.3rem">
        <span class="codename">예습 때 적은 예측과 맞춰 보기</span>
        <button class="btn" id="cmp-run" type="button">대조하기</button></div>
      <div id="compare"><p class="q-hint">학번을 넣고 <b>시작</b>을 누르면 예습 때 적은 값이 올라옵니다.
        예습을 안 냈으면 이 칸은 비어 있고 점수를 받지 못합니다.</p></div>
      <div id="cmp-wrong" hidden>
        <p class="lead" style="margin-top:1rem">틀린 것이 있군요. <b>왜 틀렸는지</b> 한두 줄로 적으세요.
          이 칸이 이 단계의 알맹이입니다.</p>
        <textarea id="cmp-why" placeholder="${esc(W.inc.compare?.whyPh || "예) 생각한 것과 달랐던 까닭은 …")}"></textarea>
      </div>`);
    $("cmp-run").addEventListener("click", runCompare);
  },

  /* ---------- 자가점검 (waveform 읽기) ---------- */
  quiz(sec) {
    const n = W.inc.quiz.length;
    const max = W.inc.quizPoints ?? 12;
    sec.insertAdjacentHTML("beforeend", `
      <div id="quiz"><p class="q-hint">학번을 넣고 <b>시작</b>을 누르면 문항이 나타납니다.</p></div>
      <div class="tally" id="tally" hidden>
        <div><div class="q-hint">점수</div><div class="big"><span id="auto-score">0</span> / ${max}</div></div>
        <div><div class="q-hint">맞힌 문항</div><div class="big"><span id="auto-n">0</span> / ${n}</div></div>
        <div class="spacer"></div>
        <button class="btn btn-primary" id="grade" type="button">채점</button>
      </div>`);
    $("grade").addEventListener("click", gradeQuiz);
  },

  /* ---------- 설계 코드 작성 ---------- */
  editor(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <div class="codehead">
        <span class="codename">${W.inc.design.file} <span class="codetag">골격 — 빈 곳을 채우시오</span> <span class="noai">AI 없이</span></span>
        <button class="btn" id="reset-code" type="button">골격으로 되돌리기</button>
      </div>
      <textarea id="code" class="editor" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>
      <div class="q-row">
        <button class="btn btn-primary" id="run" type="button">GHDL 로 실행</button>
        <span class="verdict" id="run-badge" hidden></span>
        <span class="q-hint" id="run-hint">실행은 GitHub Actions 에서 GHDL 6.0.0 으로 돌아갑니다.</span>
      </div>
      <p class="q-hint" id="preview-note">※ Claude 미리보기에서는 외부 연결이 차단되어 실행 버튼이 동작하지 않습니다.
        GitHub Pages 에 올린 주소에서 확인하세요.</p>
      <pre id="console" class="console" hidden></pre>`);

    if (!/claude\.ai|claudeusercontent|localhost|127\.0\.0\.1/.test(location.hostname)) {
      const n = $("preview-note"); if (n) n.hidden = true;
    }
    $("reset-code").addEventListener("click", () => {
      if (!$("code").value.trim() || confirmReset()) { $("code").value = S.skeleton; persist(); }
    });
    $("code").addEventListener("input", () => { persist(); ready(); });
    $("run").addEventListener("click", runDesign);
  },

  /* ---------- AI 코드 감별 : AI 가 쓴 코드에서 버그 찾기 (AI 없이) ---------- */
  aiHunt(sec) {
    const H = W.inc.hunt;
    sec.insertAdjacentHTML("beforeend", `
      <div class="ai-role"><span class="ai-badge">AI 코드 감별</span>
        <b>AI 가 같은 사양으로 쓴 코드입니다. 버그가 ${H.bugs}개 들어 있습니다.</b>
        <span class="noai">AI 없이</span></div>
      <p class="q-hint">${H.hint || ""}</p>
      <div class="codehead"><span class="codename">${esc(W.inc.practice.file)} <span class="codetag">AI 가 쓴 코드 — 고쳐서 실행</span></span>
        <button class="btn" id="hunt-reset" type="button">원래 AI 코드로</button></div>
      <textarea id="tx-hunt_code" class="editor" spellcheck="false" autocapitalize="off" autocorrect="off"></textarea>
      <div class="q-row">
        <button class="btn btn-primary" id="hunt-run" type="button">GHDL 로 실행</button>
        <span class="verdict" id="hunt-badge" hidden></span>
        <span class="q-hint" id="hunt-hint">실습과 같은 채점기로 검사합니다.</span>
      </div>
      <pre id="hunt-console" class="console" hidden></pre>
      <div class="ai-check"><div><b>찾은 버그</b>
        <span class="q-hint">줄 · 무엇이 틀렸나 · 무엇으로 알았나 (채점기 메시지, waveform, 과목 규약)</span></div></div>
      ${Array.from({ length: H.bugs }, (_, i) => `<label class="ai-lab" for="tx-hunt_b${i}"><b>버그 ${i + 1}</b></label>
        <textarea id="tx-hunt_b${i}" style="min-height:4.2rem"></textarea>`).join("")}
      <label class="ai-lab" for="tx-hunt_lesson"><b>다음에 AI 에게 시킨다면</b>
        <span class="q-hint">이런 버그를 막으려면 사양이나 프롬프트에 무엇을 더 적겠습니까 (30자 이상)</span></label>
      <textarea id="tx-hunt_lesson"></textarea>`);
    $("tx-hunt_b0").placeholder = "예) 12줄 — ○○ 가 사양과 다르다. 근거: 채점기 MISMATCH 메시지 / waveform 몇 ns / 과목 규약 몇 번";
    $("tx-hunt_lesson").placeholder = "예) 경계 조건과 우선순위를 사양 문장으로 못박고, 과목 규약을 프롬프트에 함께 준다.";
    const cd = $("tx-hunt_code");
    if (!S.texts.hunt_code) { cd.value = H.code; S.texts.hunt_code = H.code; }
    const keys = ["hunt_code", "hunt_lesson", ...Array.from({ length: H.bugs }, (_, i) => "hunt_b" + i)];
    keys.forEach((k) => $("tx-" + k).addEventListener("input", (e) => { S.texts[k] = e.target.value; persist(); ready(); }));
    $("hunt-reset").addEventListener("click", () => {
      const b = $("hunt-reset");
      if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "한 번 더 누르면 되돌립니다";
        setTimeout(() => { b.dataset.armed = ""; b.textContent = "원래 AI 코드로"; }, 4000); return; }
      b.dataset.armed = ""; b.textContent = "원래 AI 코드로";
      cd.value = H.code; S.texts.hunt_code = H.code; persist(); ready();
    });
    $("hunt-run").addEventListener("click", runHunt);
  },

  /* ---------- AI 리뷰 판정 : AI 없이 쓴 과제를 AI 에게 리뷰받고, 그 지적을 판정 ---------- */
  aiReview(sec) {
    const R = W.post.review;
    const n = R.n || 3;
    const links = [["ChatGPT", "https://chatgpt.com/"], ["Gemini", "https://gemini.google.com/"],
                   ["Claude", "https://claude.ai/new"]]
      .map(([nm, u]) => `<a class="btn" href="${u}" target="_blank" rel="noopener">${nm} 열기</a>`).join(" ");
    const sel = (id, opts) => `<select id="${id}"><option value="">고르세요</option>${opts.map((o) =>
      `<option>${o}</option>`).join("")}</select>`;
    sec.insertAdjacentHTML("beforeend", `
      <div class="ai-role"><span class="ai-badge">AI 리뷰 판정</span>
        <b>과제 코드는 내가 썼고, AI 는 리뷰만 합니다.</b>
        <span class="q-hint">— 고친 코드를 달라고 하지 않습니다. 지적이 맞는지 판정하는 것이 이 단계의 알맹이입니다.</span></div>
      <div class="codehead"><span class="codename">① 리뷰 요청 프롬프트 <span class="codetag ok">아래에 내 코드를 붙여 보내기</span></span>
        <button class="btn" id="rv-copy" type="button">프롬프트 + 내 코드 복사</button></div>
      <textarea id="tx-rv_prompt" class="editor ai-prompt" spellcheck="false"></textarea>
      <div class="q-row ai-links">${links}
        <span class="q-hint">학번·이름·비밀번호는 넣지 않습니다.</span></div>
      <label class="ai-lab" for="tx-rv_answer"><b>② AI 리뷰 답 붙여넣기</b></label>
      <textarea id="tx-rv_answer" style="min-height:8rem"></textarea>
      <div class="ai-check"><div><b>③ 지적 ${n}개 판정</b>
        <span class="q-hint">AI 지적을 골라 한 줄로 옮기고, 맞는지 내 근거로 판정합니다. 하나 이상은 GHDL 이나 waveform 으로 직접 확인하세요.</span></div></div>
      ${Array.from({ length: n }, (_, i) => `
        <div class="rv-item">
          <label class="ai-lab" for="tx-rv_c${i}"><b>지적 ${i + 1}</b></label>
          <textarea id="tx-rv_c${i}" style="min-height:3rem"></textarea>
          <div class="q-row">판정 ${sel("rv-v" + i, ["맞음", "틀림", "확인 못 함"])}</div>
          <textarea id="tx-rv_e${i}" style="min-height:3.6rem"></textarea>
        </div>`).join("")}
      <div class="q-row" style="margin-top:.8rem"><b>④ 리뷰를 보고 내 코드를 고쳤나요?</b>
        ${sel("rv-changed", ["고쳤다", "고치지 않았다"])}</div>
      <textarea id="tx-rv_change" style="min-height:4rem"></textarea>`);
    $("tx-rv_answer").placeholder = "AI 답 전체를 붙여넣습니다.";
    for (let i = 0; i < n; i++) {
      $("tx-rv_c" + i).placeholder = "예) AI: \"state 를 asynchronous reset 으로 바꾸라\"";
      $("tx-rv_e" + i).placeholder = "근거) 사양이 synchronous reset 이라 틀린 지적. 채점기도 synchronous reset 으로 검사한다.";
    }
    $("tx-rv_change").placeholder = "고쳤다면 무엇을 왜, 고치지 않았다면 왜 그대로 두었는지 적습니다.";
    const pr = $("tx-rv_prompt");
    if (!S.texts.rv_prompt) { pr.value = R.prompt; S.texts.rv_prompt = R.prompt; }
    const keys = ["rv_prompt", "rv_answer", "rv_change",
      ...Array.from({ length: n }, (_, i) => ["rv_c" + i, "rv_e" + i]).flat()];
    keys.forEach((k) => $("tx-" + k).addEventListener("input", (e) => { S.texts[k] = e.target.value; persist(); ready(); }));
    [...Array.from({ length: n }, (_, i) => "rv-v" + i), "rv-changed"].forEach((id) =>
      $(id).addEventListener("change", (e) => { S.texts[id.replace("-", "_")] = e.target.value; persist(); ready(); }));
    $("rv-copy").addEventListener("click", async () => {
      const text = pr.value + "\n\n```vhdl\n" + ($("code")?.value || "(과제 코드를 여기에)") + "\n```\n";
      try { await navigator.clipboard.writeText(text); $("rv-copy").textContent = "복사됨"; }
      catch (_) { pr.select(); $("rv-copy").textContent = "Ctrl+C 로 복사"; }
      setTimeout(() => ($("rv-copy").textContent = "프롬프트 + 내 코드 복사"), 1500);
    });
  },

  /* ---------- Quartus · pin assignment ---------- */
  quartus(sec) {
    const q = W.inc.quartus;
    sec.insertAdjacentHTML("beforeend", `
      <div class="codehead"><span class="codename">① ${W.lab}.qsf 올리기</span></div>
      <div class="drop" id="drop-qsf">
        <input type="file" id="file-qsf" accept=".qsf,.txt" style="display:block;margin:0 auto">
        <div id="qsf-name" class="q-hint" style="margin-top:.5rem">Quartus 프로젝트 폴더의
          <span class="mono">.qsf</span> 파일을 고르세요 — 고르는 즉시 검사합니다</div>
      </div>
      <ul class="checklist" id="qsf-result" hidden></ul>

      <div class="codehead" style="margin-top:1.3rem"><span class="codename">② 컴파일 결과 수치</span></div>
      <p class="q-hint">Compilation Report 에서 읽어 그대로 적으세요. 캡처도 함께 올립니다.</p>
      <div class="numgrid">
        <label>Errors<input type="number" id="q-err" min="0" placeholder="0"></label>
        <label>Latch 경고<input type="number" id="q-latch" min="0" placeholder="0"></label>
        <label>Total registers<input type="number" id="q-reg" min="0" placeholder="${q.registers}"></label>
        <label>Total pins<input type="number" id="q-pin" min="0" placeholder="${q.pins}"></label>
      </div>
      <div class="q-row">
        <button class="btn" id="check-quartus" type="button">수치 확인</button>
        <span class="verdict" id="q-badge" hidden></span>
      </div>
      <ul class="checklist" id="q-result" hidden></ul>
      ${dropHTML("cap", "Compilation Report 캡처 (Flow Summary 가 보이게)", { accept: "image/*,.pdf" })}`);

    $("file-qsf").addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      S.qsfText = await f.text();
      $("qsf-name").textContent = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
      $("drop-qsf").classList.add("has");
      const r = checkQsfAgainst(S.qsfText, W.inc.quartus.pinmap);
      S.qsfOk = r.pass;
      listTo($("qsf-result"), r.items);
      persist(); ready();
    });
    $("check-quartus").addEventListener("click", checkQuartus);
  },

  /* ---------- 보드 시연 ---------- */
  board(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <div id="board-cases"><p class="q-hint">학번을 넣고 <b>시작</b>을 누르면 지정 조합이 나타납니다.</p></div>
      <div class="q-row">
        <button class="btn" id="check-board" type="button">읽은 값 확인</button>
        <span class="verdict" id="b-badge" hidden></span>
      </div>
      <ul class="checklist" id="b-result" hidden></ul>
      ${dropHTML("board", W.inc.board.photoLabel, { multiple: true })}`);
    $("check-board").addEventListener("click", checkBoard);
  },

  /* ---------- 실습 제출 ---------- */
  submitIn(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <ul class="checklist" id="ready-in"></ul>
      <div class="drop" id="drop">
        <input type="file" id="files" multiple accept=".vhd,.pdf,.zip,.png,.jpg" style="display:block;margin:0 auto">
        <div id="filelist" class="q-hint" style="margin-top:.5rem">추가로 낼 것이 있으면 여기에 (선택) · 한 파일당 8 MB 까지</div>
      </div>
      <div class="q-row" style="margin-top:.9rem">
        <button class="btn btn-primary" id="submit-in" type="button">실습 제출</button>
        <button class="btn" id="download-in" type="button">파일로 저장</button>
      </div>
      <div class="status" id="status-in"></div>`);
  },

  /* ---------- RTL View ---------- */
  rtl(sec) {
    sec.insertAdjacentHTML("beforeend",
      dropHTML("rtl", "RTL Viewer 캡처 — 블록 이름이 읽히게") +
      `<p class="q-hint" style="margin-top:.8rem">${W.post.rtl.after}</p>`);
  },

  /* ---------- 동작 설명 + 모범답안 ---------- */
  explain(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <textarea id="explain" placeholder="${esc(W.post.explain.ph)}"></textarea>
      <div class="checks" id="checks"></div>
      <p class="q-hint">위 표시는 점수가 아니라 빠진 개념을 알려 주는 것입니다. 단어만 넣는다고 점수가 오르지 않습니다.</p>
      <div class="codehead" style="margin-top:1.1rem">
        <span class="codename">근거 waveform — 본인이 돌린 ModelSim 화면</span></div>
      ${dropHTML("wave", W.post.explain.waveLabel)}
      <div class="q-row" style="margin-top:.9rem">
        <button class="btn" id="showmodel" type="button">작성 완료 — 모범답안과 대조하기</button></div>
      <div id="modelwrap" hidden>
        <div class="model"><h4>모범답안</h4><p>${W.post.explain.model}</p></div>
        <div class="rubric" id="rubric"></div>
      </div>`);

    $("explain").addEventListener("input", () => { renderChecks(); persist(); ready(); });
    $("showmodel").addEventListener("click", showModel);
  },

  /* ---------- 토의 ---------- */
  discuss(sec) {
    sec.insertAdjacentHTML("beforeend",
      `<textarea id="discuss" placeholder="${esc(W.post.discuss.ph)}"></textarea>`);
    $("discuss").addEventListener("input", () => { persist(); ready(); });
  },

  /* ---------- 자유 서술 칸 (실습이 없는 주차) ---------- */
  textArea(sec, st) {
    const a = st.area;
    sec.insertAdjacentHTML("beforeend",
      `<textarea id="tx-${a.id}" placeholder="${esc(a.ph || "")}"` +
      (a.tall ? ' style="min-height:9rem"' : "") + `></textarea>`);
    const el = $("tx-" + a.id);
    el.addEventListener("input", () => { S.texts[a.id] = el.value; ready(); persist(); });
  },

  /* ---------- 파일 제출 칸 (실습이 없는 주차) ---------- */
  upload(sec, st) {
    const u = st.up;
    sec.insertAdjacentHTML("beforeend",
      dropHTML(u.id, u.label, { accept: u.accept || ".pdf,.png,.jpg,.zip,.vhd", multiple: !!u.multiple }));
    const inp = $("file-" + u.id);
    inp.addEventListener("change", (e) => {
      const fs = [...e.target.files];
      S.files[u.id] = u.multiple ? fs : (fs[0] || null);
      $("name-" + u.id).textContent = fs.length
        ? fs.map((f) => `${f.name} (${(f.size / 1024).toFixed(0)} KB)`).join(" · ") : u.label;
      $("drop-" + u.id).classList.toggle("has", fs.length > 0);
      ready(); persist();
    });
  },

  /* ---------- 과제 제출 ---------- */
  submitPost(sec) {
    sec.insertAdjacentHTML("beforeend", `
      <ul class="checklist" id="ready-post"></ul>
      <div class="drop" id="drop-post">
        <input type="file" id="files-post" multiple accept=".vhd,.pdf,.zip,.png,.jpg" style="display:block;margin:0 auto">
        <div id="filelist-post" class="q-hint" style="margin-top:.5rem">추가로 낼 것이 있으면 여기에 (선택) · 한 파일당 8 MB 까지</div>
      </div>
      <div class="q-row" style="margin-top:.9rem">
        <button class="btn btn-primary" id="submit-post" type="button">과제 제출</button>
        <button class="btn" id="download-post" type="button">파일로 저장</button>
      </div>
      <div class="status" id="status-post"></div>`);
  },
};

/* ══════════════════════════════════════════════════════════════
   3. 단계별 동작
══════════════════════════════════════════════════════════════ */

/* ---------- 개념 확인 ---------- */
function renderConcept(sid) {
  const seed = seedFrom(sid);
  S.cQuiz = W.concepts.map((c, i) => {
    const { opts, ans } = shuffleOpts(c.opts, c.ans, seed, i);
    return { q: c.q, opts, ans };
  });
  const box = $("concept"); box.innerHTML = "";
  S.cQuiz.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "q";
    d.innerHTML = `<div class="q-top"><b>${i + 1}.</b> <span>${c.q}</span>
        <span class="verdict" id="cv-${i}" hidden></span></div>` +
      c.opts.map((o, k) =>
        `<label style="display:block;margin:.3rem 0 .3rem .9rem">
           <input type="radio" name="cq-${i}" value="${k}"> ${o}</label>`).join("");
    box.appendChild(d);
  });
  $("c-tally").hidden = false;
}

function gradeConcept() {
  let n = 0;
  S.cQuiz.forEach((c, i) => {
    const sel = document.querySelector(`input[name="cq-${i}"]:checked`);
    const ok = sel && Number(sel.value) === c.ans;
    const v = $(`cv-${i}`); v.hidden = false;
    v.className = "verdict " + (ok ? "v-pass" : "v-fail");
    v.textContent = ok ? "정답" : (sel ? "다시" : "미응답");
    if (ok) n++;
  });
  S.cScore = n * 3; S.cGraded = true;
  $("c-score").textContent = S.cScore;
  persist(); ready();
}

const conceptAnswers = () => S.cQuiz.map((_, i) => {
  const sel = document.querySelector(`input[name="cq-${i}"]:checked`);
  return sel ? Number(sel.value) : null;
});

/* ---------- waveform 예측 ---------- */
function renderPredict(sid) {
  const P = W.pre.predict;
  const cases = P.cases(seedFrom(sid));
  const box = $("predict"); box.innerHTML = "";
  cases.forEach((c, k) => {
    const d = document.createElement("div");
    d.className = "q";
    d.innerHTML = `
      <div class="q-top"><b>경우 ${k + 1}</b><span class="mono">${c.given}</span></div>
      <div class="numgrid" style="margin-top:.5rem">
        ${P.fields.map((f) => `<label>${f.label}
          <input type="text" id="pd${k}-${f.key}" maxlength="${f.len}" placeholder="${f.ph}" class="mono"></label>`).join("")}
      </div>`;
    box.appendChild(d);
  });
  cases.forEach((_, k) => P.fields.forEach((f) => {
    const el = $(`pd${k}-${f.key}`);
    if (el) el.addEventListener("input", () => { persist(); ready(); });
  }));
}

function predictAnswers() {
  const P = W.pre.predict;
  if (!P) return [];                 // 실습이 없는 주차에는 예측 문항이 없다
  const n = P.count || 2;
  return Array.from({ length: n }, (_, k) => {
    const o = {};
    P.fields.forEach((f) => { o[f.key] = ($(`pd${k}-${f.key}`)?.value || "").trim(); });
    return o;
  });
}
const predictFilled = () => {
  const P = W.pre.predict;
  if (!P) return true;
  return predictAnswers().every((p) => P.fields.every((f) => (p[f.key] || "").length === f.len));
};

/* ---------- 예측 ↔ 실제 대조 ---------- */
function comparePrediction(pred, seed) {
  const P = W.pre.predict;
  if (!P) return { rows: [], right: 0, total: 0 };
  const cases = P.cases(seed);
  const rows = [];
  let right = 0, total = 0;
  cases.forEach((cse, k) => {
    const want = P.model(cse);
    const got = (pred && pred[k]) || {};
    P.fields.forEach((f) => {
      const mine = (got[f.key] || "").trim();
      const ok = mine !== "" && mine === want[f.key];
      if (ok) right++;
      total++;
      rows.push({ case: k + 1, given: cse.given, label: f.label,
                  mine: mine || "(빈칸)", want: want[f.key], ok });
    });
  });
  return { rows, right, total };
}

function runCompare() {
  const sid = $("sid").value.trim();
  if (!/^\d{6,10}$/.test(sid)) { setStatus.in("err", "먼저 학번을 넣어 주세요."); return; }
  const saved = loadLocal(W.id + "-pre");
  const pred = saved?.predict || predictAnswers();
  S.cmp = comparePrediction(pred, seedFrom(sid));
  const rows = S.cmp.rows.map((r) => `
    <tr class="${r.ok ? "" : "bad"}">
      <td>${r.case}</td><td class="mono">${r.given}</td>
      <td>${r.label}</td><td class="mono">${r.mine}</td><td class="mono">${r.want}</td>
      <td>${r.ok ? "○" : "✗"}</td></tr>`).join("");
  $("compare").innerHTML = `
    <table class="spec"><thead><tr>
      <th>경우</th><th>입력</th><th>항목</th><th>내 예측</th><th>실제</th><th></th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p class="q-hint" style="margin-top:.6rem">맞힌 것 <b>${S.cmp.right} / ${S.cmp.total}</b></p>`;
  $("cmp-wrong").hidden = S.cmp.right === S.cmp.total;
  persist(); ready();
}

function cmpScore() {
  if (!S.cmp) return 0;
  const pts = W.inc.compare?.points ?? 8;
  const base = Math.round((S.cmp.right / S.cmp.total) * (pts - 3));
  const why = ($("cmp-why")?.value || "").trim();
  const bonus = S.cmp.right === S.cmp.total ? 3 : (why.length >= 20 ? 3 : 0);
  return base + bonus;
}

/* ---------- 자가점검 ---------- */
function makeQuestions(sid) {
  const specs = W.inc.quiz;
  const { times } = pickTimes(S.vcd, sid, specs.length, W.inc.wave.step || 20);
  return specs.map((q, i) => {
    const ns = times[i];
    switch (q.type) {
      case "vector":  return qVector(S.vcd, "q" + (i + 1), q.path, q.width, ns, q.label, q.hint);
      case "bit":     return qBit(S.vcd, "q" + (i + 1), q.path, ns, q.label, q.hint);
      case "count":   return qCount(S.vcd, "q" + (i + 1), q.path, q.label, q.hint, W.inc.wave.step || 20);
      case "decimal": return qDecimal(S.vcd, "q" + (i + 1), q.path, q.width, ns, q.label, !!q.signed, q.hint);
      default:        return qBit(S.vcd, "q" + (i + 1), q.path, ns, q.label, q.hint);
    }
  });
}

function renderQuiz() {
  const each = (W.inc.quizPoints ?? 12) / W.inc.quiz.length;
  const box = $("quiz"); box.innerHTML = "";
  S.qs.forEach((q, i) => {
    const d = document.createElement("div"); d.className = "q";
    d.innerHTML = `<div class="q-ask"><b>문 ${i + 1}.</b> ${q.ask}</div>
      <div class="q-row">
        <input type="text" id="in-${q.id}" placeholder="${q.placeholder}" autocomplete="off">
        <span class="verdict" id="v-${q.id}" hidden></span>
        <span class="q-hint">${each}점</span>
      </div>
      <div class="q-hint">${q.hint}</div>`;
    box.appendChild(d);
  });
  $("tally").hidden = false;
}

function gradeQuiz() {
  const each = (W.inc.quizPoints ?? 12) / W.inc.quiz.length;
  let score = 0, n = 0;
  for (const q of S.qs) {
    const v = ($(`in-${q.id}`).value || "").trim();
    const ok = v !== "" && q.check(v);
    const badge = $(`v-${q.id}`);
    badge.hidden = false;
    badge.className = "verdict " + (ok ? "v-pass" : "v-fail");
    badge.textContent = ok ? "정답" : (v === "" ? "미입력" : "다시");
    if (ok) { score += each; n++; }
  }
  $("auto-score").textContent = score;
  $("auto-n").textContent = n;
  S.graded = true;
  persist(); ready();
}

/* ---------- waveform 읽기 표시 ---------- */
function readout(ns) {
  const box = $("readout"); if (!box) return;
  box.innerHTML = "";
  const add = (k, v) => {
    const d = document.createElement("div"); d.className = "ro";
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    d.append(dt, dd); box.appendChild(d);
  };
  add("커서", `${Math.round(ns)} ns`);
  for (const s of W.inc.wave.sigs) {
    const b = pad(S.vcd.valueAtNs(s.path, ns), s.width);
    if (b == null) { add(s.label, "–"); continue; }
    add(s.label, s.width === 1 ? b : `${b} (${parseInt(b, 2)})`);
  }
}

function segJump(dir) {
  const step = W.inc.wave.step || 20, mid = step / 2;
  const idx = Math.floor(S.view.cursorNs / step);
  const next = Math.max(0, Math.min(Math.floor(S.vcd.endNs() / step) - 1, idx + dir));
  S.view.setCursor(next * step + mid);
}

/* ---------- GHDL 실행 (따라 만들기 / 설계) ---------- */
function conLine(id, text, cls) {
  const c = $(id);
  c.hidden = false;
  const span = document.createElement("span");
  if (cls) span.className = cls;
  span.textContent = text + "\n";
  c.appendChild(span);
  c.scrollTop = c.scrollHeight;
}

function runFail(conId, r, extra) {
  if (r.error === "no-endpoint") {
    conLine(conId, "실행 서버가 아직 설정되지 않았습니다.", "no");
    conLine(conId, "config.js 의 ENDPOINT 를 채우면 동작합니다 (README 3절).");
  } else if (/Failed to fetch|NetworkError|TypeError/.test(String(r.error))) {
    conLine(conId, "실행 서버에 닿지 못했습니다.", "no");
    conLine(conId, "Claude 미리보기 안에서는 외부 연결이 차단되어 있습니다.");
    conLine(conId, "GitHub Pages 에 올린 뒤 그 주소에서 확인해 주세요.");
  } else {
    conLine(conId, "실행하지 못했습니다: " + (r.error || "알 수 없는 오류"), "no");
  }
  if (extra) { conLine(conId, ""); extra.forEach((l) => conLine(conId, l)); }
}

async function runPractice() {
  const sid = $("sid").value.trim();
  if (!/^\d{6,10}$/.test(sid)) { setStatus.in("err", "먼저 학번을 넣어 주세요."); return; }
  const code = $("p-code").value;
  if (!code.trim()) { setStatus.in("err", "앞 단계의 코드를 입력해 주세요."); return; }

  $("p-run").disabled = true; $("p-badge").hidden = true;
  $("p-console").hidden = false; $("p-console").textContent = "";
  conLine("p-console", "GHDL 실행을 요청했습니다…");
  $("p-hint").innerHTML = '<span class="spin"></span> 실행 중 — 보통 1~2분 걸립니다';

  const r = await runAndWait(CONFIG.ENDPOINT, CONFIG.SECRET,
    { sid, lab: W.lab + "p", code },
    (sec) => { $("p-hint").innerHTML = `<span class="spin"></span> 실행 중 ${sec}초…`; });

  $("p-run").disabled = false;
  $("p-hint").textContent = W.inc.practice.checkNote;
  if (!r.ok) return runFail("p-console", r,
    W.inc.practice.localCmd ? ["내 PC 에서 같은 검사를 돌리려면:", "  " + W.inc.practice.localCmd] : null);

  S.pRun = r.status; S.pLog = r.log || "";
  const b = $("p-badge"); b.hidden = false;
  if (r.status === "pass") {
    b.className = "verdict v-pass"; b.textContent = "PASS";
    conLine("p-console", "exhaustive test 를 모두 통과했습니다. 코드를 정확히 입력했습니다.", "ok");
  } else if (r.status === "compile_error") {
    b.className = "verdict v-fail"; b.textContent = "컴파일 오류";
    conLine("p-console", "타이핑에 오타가 있습니다. 아래 줄 번호를 보세요.", "no");
  } else {
    b.className = "verdict v-fail"; b.textContent = "FAIL";
    conLine("p-console", "컴파일은 되지만 동작이 다릅니다. 앞 단계 코드와 한 줄씩 맞춰 보세요.", "no");
  }
  if (r.log) { conLine("p-console", ""); conLine("p-console", r.log); }
  persist(); ready();
}

async function runDesign() {
  const sid = $("sid").value.trim();
  if (!/^\d{6,10}$/.test(sid)) { setStatus.in("err", "먼저 학번을 넣어 주세요."); return; }
  const code = $("code").value;
  if (!code.trim()) { setStatus.in("err", "코드를 작성해 주세요."); return; }

  $("run").disabled = true; $("run-badge").hidden = true;
  $("console").hidden = false; $("console").textContent = "";
  conLine("console", "GHDL 실행을 요청했습니다…");
  $("run-hint").innerHTML = '<span class="spin"></span> 실행 중 — 보통 1~2분 걸립니다';

  const r = await runAndWait(CONFIG.ENDPOINT, CONFIG.SECRET,
    { sid, lab: W.lab, code },
    (sec) => { $("run-hint").innerHTML = `<span class="spin"></span> 실행 중 ${sec}초…`; });

  $("run").disabled = false;
  $("run-hint").textContent = "실행은 GitHub Actions 에서 GHDL 6.0.0 으로 돌아갑니다.";
  if (!r.ok) return runFail("console", r, ["내 PC 에서 같은 검사를 돌리려면:", "  " + W.inc.design.localCmd]);

  S.lastRun = r.status; S.lastLog = r.log || "";
  const badge = $("run-badge"); badge.hidden = false;
  if (r.status === "pass") {
    badge.className = "verdict v-pass"; badge.textContent = "PASS";
    conLine("console", "exhaustive test 를 모두 통과했고, synthesis 점검도 지났습니다.", "ok");
  } else if (r.status === "compile_error") {
    badge.className = "verdict v-fail"; badge.textContent = "컴파일 오류";
    conLine("console", "컴파일되지 않았습니다. 아래 줄 번호를 보고 고치세요.", "no");
  } else if (r.status === "synth_error") {
    badge.className = "verdict v-fail"; badge.textContent = "synthesis 불가";
    conLine("console", "simulation 은 될지 몰라도 synthesis 가 안 됩니다. Quartus 에서도 같은 문제가 납니다.", "no");
  } else {
    badge.className = "verdict v-fail"; badge.textContent = "FAIL";
    conLine("console", "컴파일은 되었지만 동작이 틀립니다. 어떤 입력에서 틀렸는지 아래에 있습니다.", "no");
  }
  if (r.log) { conLine("console", ""); conLine("console", r.log); }
  persist(); ready();
}

async function runHunt() {
  const sid = $("sid").value.trim();
  if (!/^\d{6,10}$/.test(sid)) { setStatus.in("err", "먼저 학번을 넣어 주세요."); return; }
  const code = $("tx-hunt_code").value;
  $("hunt-run").disabled = true; $("hunt-badge").hidden = true;
  $("hunt-console").hidden = false; $("hunt-console").textContent = "";
  conLine("hunt-console", "GHDL 실행을 요청했습니다…");
  $("hunt-hint").innerHTML = '<span class="spin"></span> 실행 중 — 보통 1~2분 걸립니다';
  const r = await runAndWait(CONFIG.ENDPOINT, CONFIG.SECRET,
    { sid, lab: W.lab + "p", code },
    (sec) => { $("hunt-hint").innerHTML = `<span class="spin"></span> 실행 중 ${sec}초…`; });
  $("hunt-run").disabled = false;
  $("hunt-hint").textContent = "실습과 같은 채점기로 검사합니다.";
  if (!r.ok) return runFail("hunt-console", r);
  S.huntRun = r.status; S.huntLog = r.log || "";
  S.texts.hunt_run = r.status;
  const b = $("hunt-badge"); b.hidden = false;
  if (r.status === "pass") {
    b.className = "verdict v-pass"; b.textContent = "PASS";
    conLine("hunt-console", "채점기를 통과했습니다. 그런데 채점기가 못 잡는 버그가 남아 있을 수도 있습니다 — 개수를 세어 보세요.", "ok");
  } else {
    b.className = "verdict v-fail";
    b.textContent = r.status === "compile_error" ? "컴파일 오류" : r.status === "synth_error" ? "synthesis 불가" : "FAIL";
    conLine("hunt-console", "아직 버그가 남았습니다. 아래 메시지가 첫 단서입니다.", "no");
  }
  if (r.log) { conLine("hunt-console", ""); conLine("hunt-console", r.log); }
  persist(); ready();
}

function confirmReset() {
  const btn = $("reset-code");
  if (btn.dataset.armed === "1") { btn.dataset.armed = ""; btn.textContent = "골격으로 되돌리기"; return true; }
  btn.dataset.armed = "1";
  btn.textContent = "한 번 더 누르면 지워집니다";
  setTimeout(() => { btn.dataset.armed = ""; btn.textContent = "골격으로 되돌리기"; }, 4000);
  return false;
}

/* ---------- Quartus 수치 ---------- */
function checkQuartus() {
  const q = W.inc.quartus;
  const n = (id) => { const v = $(id).value; return v === "" ? null : Number(v); };
  const err = n("q-err"), latch = n("q-latch"), reg = n("q-reg"), pin = n("q-pin");
  if ([err, latch, reg, pin].some((v) => v === null)) {
    setStatus.in("err", "네 칸을 모두 채워 주세요."); return;
  }
  const regOk = reg === q.registers;
  const items = [
    { label: `Errors = ${err}`, ok: err === 0 },
    { label: `Latch 경고 = ${latch}` + (latch > 0 ? " — process 에 기본값이 빠졌는지 보세요" : ""), ok: latch === 0 },
    { label: `Total registers = ${reg}` + (regOk ? ` (${q.regNote})` : ` — 이 설계는 ${q.registers} 이어야 합니다. ${q.regNote}`), ok: regOk },
    { label: `Total pins = ${pin}` + (pin !== q.pins ? ` — 이 주차는 ${q.pins}핀입니다` : ""), ok: pin === q.pins },
  ];
  S.quartusOk = items.every((i) => i.ok);
  listTo($("q-result"), items);
  const bd = $("q-badge"); bd.hidden = false;
  bd.className = "verdict " + (S.quartusOk ? "v-pass" : "v-fail");
  bd.textContent = S.quartusOk ? "정상" : "확인 필요";
  persist(); ready();
}

/* ---------- 보드 ---------- */
function renderBoard(sid) {
  const B = W.inc.board;
  S.bCases = B.cases(seedFrom(sid));
  $("board-cases").innerHTML = S.bCases.map((c, k) => `
    <div class="bcase">
      <h4>${k + 1}. ${c.label}</h4>
      <span class="sw">${c.sw}</span>
      <div class="bgrid">
        ${B.fields.map((f) => `<label>${f.label}
          <input type="text" id="b${k}-${f.key}" placeholder="${f.ph}" autocomplete="off"></label>`).join("")}
      </div></div>`).join("");
}

function checkBoard() {
  const B = W.inc.board;
  if (!S.bCases.length) { setStatus.in("err", "먼저 학번을 넣고 시작을 눌러 주세요."); return; }
  const items = [];
  S.bCases.forEach((c, k) => {
    const want = B.expect(c);
    B.fields.forEach((f) => {
      const got = ($(`b${k}-${f.key}`)?.value || "").trim().toUpperCase();
      const norm = f.dec ? got.replace(/^0+(?=\d)/, "") : got;
      const ok = norm === String(want[f.key]).toUpperCase();
      items.push({ label: `${k + 1}. ${c.label} — ${f.label} : ${got || "(빈칸)"}`, ok });
    });
  });
  S.boardOk = items.every((i) => i.ok);
  listTo($("b-result"), items);
  const bd = $("b-badge"); bd.hidden = false;
  bd.className = "verdict " + (S.boardOk ? "v-pass" : "v-fail");
  bd.textContent = S.boardOk ? "일치" : "다시 확인";
  persist(); ready();
}

/* ---------- 서술 개념 체크 · 모범답안 ---------- */
function renderChecks() {
  if (!$("explain")) return;
  const r = conceptCheck($("explain").value, W.post.explain?.concepts || []);
  $("checks").innerHTML = r.map((c) =>
    `<span class="ck${c.hit ? " on" : ""}">${c.hit ? "✓" : "·"} ${c.label}</span>`).join("");
}

function showModel() {
  if (($("explain").value || "").trim().length < 30) {
    setStatus.post("err", "먼저 설명을 30자 이상 작성해 주세요. 모범답안은 작성 후에 열립니다.");
    return;
  }
  $("modelwrap").hidden = false;
  $("showmodel").disabled = true;
  if (!$("rubric").children.length) {
    $("rubric").innerHTML = `<div class="q-hint" style="margin-bottom:.2rem">
      모범답안과 견주어 스스로 채점하세요. 이 자기채점 결과도 함께 제출됩니다.</div>` +
      W.post.explain.rubric.map((t, i) =>
        `<label><input type="checkbox" id="rb-${i}"><span>${t}</span></label>`).join("");
    $("rubric").addEventListener("change", persist);
  }
  persist();
}

/* ══════════════════════════════════════════════════════════════
   4. 파일 칸 · 체크리스트 · 제출
══════════════════════════════════════════════════════════════ */
function slot(id, setter, label) {
  const inp = $("file-" + id); if (!inp) return;
  inp.addEventListener("change", (e) => {
    const f = e.target.files[0] || null;
    setter(f);
    $("name-" + id).textContent = f ? `${f.name} (${(f.size / 1024).toFixed(0)} KB)` : label;
    $("drop-" + id).classList.toggle("has", !!f);
    persist(); ready();
  });
}

function multiSlot(id, setter, label) {
  const inp = $("file-" + id); if (!inp) return;
  inp.addEventListener("change", (e) => {
    const fs = [...e.target.files];
    setter(fs);
    $("name-" + id).textContent = fs.length ? fs.map((f) => f.name).join(" · ") : label;
    $("drop-" + id).classList.toggle("has", fs.length > 0);
    persist(); ready();
  });
}

function extraFiles(inputId, dropId, listId, set) {
  const el = $(inputId); if (!el) return;
  el.addEventListener("change", (e) => {
    const fs = [...e.target.files];
    set(fs);
    $(dropId).classList.toggle("has", fs.length > 0);
    $(listId).textContent = fs.length
      ? fs.map((f) => `${f.name} (${(f.size / 1024).toFixed(0)} KB)`).join(" · ")
      : "아직 고른 파일이 없습니다 · 한 파일당 8 MB 까지";
  });
}

const setStatus = {};
["pre", "in", "post"].forEach((p) => {
  setStatus[p] = (kind, msg) => {
    const s = $("status-" + p); if (!s) return;
    s.className = `status show ${kind}`; s.textContent = msg;
  };
});

/* 설정이 제 체크리스트를 주면 그것을 쓴다 (실습이 없는 주차) */
const txt = (id) => (S.texts[id] || "").trim();
const hasFile = (id) => {
  const f = S.files[id];
  return Array.isArray(f) ? f.length > 0 : !!f;
};

// wNN.js 의 ready 항목이 쓸 수 있는 도우미 (네 번째 인자로 넘어간다)
const HELP = {
  predictFilled: () => predictFilled(),
  dom: (id) => ($(id)?.value || "").trim(),
};

function ready() {
  if (W.ready) {
    ["pre", "in", "post"].forEach((p) => listTo($("ready-" + p),
      (W.ready[p] || []).map((i) => ({ label: i.label, ok: i.ok(txt, hasFile, S, HELP) }))));
    return;
  }
  const r = {
    pre: [
      { label: "개념 확인 채점", ok: S.cGraded },
      { label: "waveform 예측 모두 입력", ok: predictFilled() },
      { label: "코드 읽기 답", ok: ($("pre-read")?.value || "").trim().length >= 20 },
    ],
    in: [
      { label: `${W.inc.practice.file} 직접 입력해 실행 (PASS)`, ok: S.pRun === "pass" },
      { label: "예측 대조", ok: !!S.cmp },
      { label: "자가점검 채점", ok: S.graded },
      { label: "실습 waveform 캡처", ok: !!S.practiceFile },
      ...(W.inc.hunt ? [
        { label: "AI 코드 감별 — 고친 코드 PASS", ok: (S.huntRun || S.texts.hunt_run) === "pass" },
        { label: `찾은 버그 ${W.inc.hunt.bugs}개 기록`, ok: Array.from({ length: W.inc.hunt.bugs }, (_, i) => txt("hunt_b" + i).length >= 10).every(Boolean) },
        { label: "다음 프롬프트에 더할 것 (30자 이상)", ok: txt("hunt_lesson").length >= 30 },
      ] : []),
      { label: `${W.inc.design.file} exhaustive test (PASS · AI 없이)`, ok: S.lastRun === "pass" },
      { label: ".qsf pin assignment", ok: S.qsfOk },
      { label: "컴파일 결과 캡처", ok: !!S.capFile },
      { label: "보드 사진", ok: S.boardFiles.length > 0 },
    ],
    post: [
      { label: "RTL Viewer 캡처", ok: !!S.rtlFile },
      { label: "simulation waveform 캡처", ok: !!S.waveFile },
      { label: "동작 설명 (30자 이상)", ok: ($("explain")?.value || "").trim().length >= 30 },
      { label: "토의 (20자 이상)", ok: ($("discuss")?.value || "").trim().length >= 20 },
      ...(W.post.review ? [
        { label: "AI 리뷰 답 붙여넣기", ok: txt("rv_answer").length >= 30 },
        { label: `지적 ${W.post.review.n || 3}개 판정과 근거`, ok: Array.from({ length: W.post.review.n || 3 },
          (_, i) => txt("rv_c" + i).length >= 5 && !!txt("rv_v" + i) && txt("rv_e" + i).length >= 10).every(Boolean) },
        { label: "코드 수정 여부", ok: !!txt("rv_changed") && txt("rv_change").length >= 10 },
      ] : []),
    ],
  };
  ["pre", "in", "post"].forEach((p) => listTo($("ready-" + p), r[p]));
}

/* ---------- 제출 꾸러미 ---------- */
const base = (phase) => ({
  secret: CONFIG.SECRET, course: CONFIG.COURSE, term: CONFIG.TERM,
  lab: W.lab, week: W.no, labTitle: W.labTitle, phase,
  designFile: W.inc?.design?.file || "", practiceFile: W.inc?.practice?.file || "",
  sid: $("sid").value.trim(), name: $("sname").value.trim(),
  submittedAt: new Date().toISOString(),
  texts: Object.fromEntries(Object.entries(S.texts).map(([k, v]) => [k, String(v || "").trim()])),
  textLabels: textLabels(),
});

// 자유 서술칸의 제목과 단계 — 보고서가 "어느 단계에서 무엇을 쓴 칸인지" 알 수 있게
function textLabels() {
  const out = {};
  [["pre", W.pre], ["in", W.inc], ["post", W.post]].forEach(([ph, band]) =>
    (band?.steps || []).forEach((st) => { if (st.area) out[st.area.id] = { title: st.title, phase: ph }; }));
  return out;
}

function collectPre() {
  return Object.assign(base("pre"), {
    concept: { score: S.cScore, max: W.concepts.length * 3, graded: S.cGraded, answers: conceptAnswers() },
    predict: predictAnswers(),
    reading: ($("pre-read")?.value || "").trim(),
    question: ($("pre-ask")?.value || "").trim(),
  });
}

function collectIn() {
  const answers = {};
  for (const q of S.qs) answers[q.id] = ($(`in-${q.id}`)?.value || "").trim();
  return Object.assign(base("in"), {
    practice: { file: W.inc.practice?.file || "", code: $("p-code")?.value || "",
                runStatus: S.pRun || "", runLog: S.pLog.slice(0, 6000) },
    compare: S.cmp ? { rows: S.cmp.rows, right: S.cmp.right, total: S.cmp.total,
                       why: ($("cmp-why")?.value || "").trim(), score: cmpScore() } : null,
    auto: { score: Number($("auto-score")?.textContent || 0), max: W.inc.quizPoints ?? 12,
            graded: S.graded, answers },
    hunt: W.inc.hunt ? {
      code: S.texts.hunt_code || "", runStatus: S.huntRun || S.texts.hunt_run || "",
      runLog: (S.huntLog || "").slice(0, 6000), bugCount: W.inc.hunt.bugs,
      found: Array.from({ length: W.inc.hunt.bugs }, (_, i) => S.texts["hunt_b" + i] || ""),
      lesson: S.texts.hunt_lesson || "" } : null,
    code: $("code")?.value || "",
    runStatus: S.lastRun || "",
    runLog: S.lastLog.slice(0, 8000),
    qsf: S.qsfText ? { ok: S.qsfOk, text: S.qsfText.slice(0, 8000) } : null,
    quartus: { ok: S.quartusOk, errors: $("q-err")?.value, latch: $("q-latch")?.value,
               registers: $("q-reg")?.value, pins: $("q-pin")?.value },
    board: { ok: S.boardOk, cases: S.bCases.map((c, k) => ({
      ...c, read: Object.fromEntries((W.inc.board?.fields || []).map((f) =>
        [f.key, $(`b${k}-${f.key}`)?.value || ""])) })) },
  });
}

function collectPost() {
  const rub = W.post.explain?.rubric || [];
  const self = rub.map((_, i) => !!$(`rb-${i}`)?.checked);
  return Object.assign(base("post"), {
    code: $("code")?.value || "",
    runStatus: S.lastRun || "",
    explain: ($("explain")?.value || "").trim(),
    discuss: ($("discuss")?.value || "").trim(),
    selfScore: { items: rub, checked: self, count: self.filter(Boolean).length },
    review: W.post.review ? {
      prompt: S.texts.rv_prompt || "", answer: S.texts.rv_answer || "",
      items: Array.from({ length: W.post.review.n || 3 }, (_, i) => ({
        comment: S.texts["rv_c" + i] || "", verdict: S.texts["rv_v" + i] || "", evidence: S.texts["rv_e" + i] || "" })),
      changed: S.texts.rv_changed || "", change: S.texts.rv_change || "" } : null,
  });
}

function reportLinkAt(afterId, url, label) {
  const host = $(afterId); if (!host) return;
  let a = host.parentElement.querySelector(".rpt");
  if (!a) {
    a = document.createElement("a");
    a.className = "btn rpt"; a.target = "_blank"; a.rel = "noopener";
    a.style.marginTop = ".7rem"; a.style.display = "inline-block";
    host.after(a);
  }
  a.href = url; a.textContent = label;
}

async function sendPhase(payload, picks, phase) {
  const label = PH[phase];
  payload.files = [];
  for (const [role, f] of picks) {
    if (!f || f.size > 8 * 1024 * 1024) continue;
    payload.files.push({ role, name: f.name, size: f.size, mime: f.type || "",
                         b64: await fileToBase64(f) });
  }
  const r = await submit(CONFIG.ENDPOINT, payload);
  const fn = `${payload.sid}_${W.id}_${phase}.json`;
  if (r.ok) {
    if (r.report && /^https?:/.test(r.report)) reportLinkAt("status-" + phase, r.report, `${label} 보고서 PDF 열기`);
    setStatus[phase]("ok", `${label} 제출되었습니다. ${payload.sid} ${payload.name} · 첨부 ${payload.files.length}개`);
  } else if (r.reason === "no-endpoint") {
    downloadSubmission(payload, fn);
    setStatus[phase]("info", "이 환경에서는 서버 전송이 꺼져 있어 파일로 저장했습니다.");
  } else {
    downloadSubmission(payload, fn);
    setStatus[phase]("err", "전송에 실패해 파일로 저장했습니다. 이 파일을 학습관리시스템에 올려 주세요.");
  }
}

const idOk = (p) => /^\d{6,10}$/.test(p.sid) && !!p.name;

/** 자유 파일칸에 담긴 것을 역할 이름과 함께 꺼낸다 */
function extraUploads() {
  const out = [];
  for (const [role, v] of Object.entries(S.files)) {
    if (Array.isArray(v)) v.slice(0, 3).forEach((f) => out.push([role, f]));
    else if (v) out.push([role, v]);
  }
  return out;
}

function wireSubmits() {
  const b = (id) => $(id);
  if (b("submit-pre")) b("submit-pre").addEventListener("click", async () => {
    const p = collectPre();
    if (!idOk(p)) return setStatus.pre("err", "학번과 이름을 넣어 주세요.");
    if ($("concept") && !S.cGraded) return setStatus.pre("err", "먼저 개념 확인을 채점해 주세요.");
    if ($("predict") && !predictFilled()) return setStatus.pre("err", "waveform 예측을 모두 채워 주세요.");
    b("submit-pre").disabled = true;
    setStatus.pre("info", "제출하는 중…");
    try { saveLocal(W.id + "-pre", p); await sendPhase(p, [], "pre"); }
    finally { b("submit-pre").disabled = false; }
  });

  if (b("submit-in")) b("submit-in").addEventListener("click", async () => {
    const p = collectIn();
    if (!idOk(p)) return setStatus.in("err", "학번과 이름을 넣어 주세요.");
    if ($("quiz") && !S.graded) return setStatus.in("err", "먼저 자가점검을 채점해 주세요.");
    b("submit-in").disabled = true;
    setStatus.in("info", "제출하는 중…");
    try {
      await sendPhase(p, [["practice", S.practiceFile], ["cap", S.capFile],
                          ...S.boardFiles.slice(0, 3).map((f) => ["board", f]),
                          ...extraUploads(), ...S.picked.slice(0, 3).map((f) => ["etc", f])], "in");
    } finally { b("submit-in").disabled = false; }
  });

  if (b("submit-post")) b("submit-post").addEventListener("click", async () => {
    const p = collectPost();
    if (!idOk(p)) return setStatus.post("err", "학번과 이름을 넣어 주세요.");
    if ($("explain") && p.explain.length < 30) return setStatus.post("err", "동작 설명을 30자 이상 작성해 주세요.");
    if ($("discuss") && p.discuss.length < 20) return setStatus.post("err", "토의를 작성해 주세요.");
    b("submit-post").disabled = true;
    setStatus.post("info", "제출하는 중…");
    try {
      await sendPhase(p, [["rtl", S.rtlFile], ["wave", S.waveFile],
                          ...extraUploads(), ...S.pickedPost.slice(0, 3).map((f) => ["etc", f])], "post");
    } finally { b("submit-post").disabled = false; }
  });

  const dl = (id, fn, who) => { if ($(id)) $(id).addEventListener("click",
    () => downloadSubmission(fn(), `${$("sid").value || "학번"}_${W.id}_${who}.json`)); };
  dl("download-pre", collectPre, "예습");
  dl("download-in", collectIn, "실습");
  dl("download-post", collectPost, "과제");
}

/* ---------- 저장 / 되살리기 ---------- */
function persist() {
  try {
    saveLocal(W.id + "-pre", collectPre());
    saveLocal(W.id + "-in", collectIn());
    saveLocal(W.id + "-post", collectPost());
  } catch (_) {}
}

function restore() {
  const sp = loadLocal(W.id + "-pre"), si = loadLocal(W.id + "-in"), spo = loadLocal(W.id + "-post");
  if (sp) {
    (sp.concept?.answers || []).forEach((v, i) => {
      if (v === null || v === undefined) return;
      const el = document.querySelector(`input[name="cq-${i}"][value="${v}"]`);
      if (el) el.checked = true;
    });
    if (sp.concept?.graded) {
      S.cScore = sp.concept.score || 0; S.cGraded = true;
      if ($("c-score")) $("c-score").textContent = S.cScore;
      if ($("c-tally")) $("c-tally").hidden = false;
    }
    (sp.predict || []).forEach((v, k) => (W.pre.predict?.fields || []).forEach((f) => {
      const el = $(`pd${k}-${f.key}`); if (el) el.value = v[f.key] || "";
    }));
    if ($("pre-read")) $("pre-read").value = sp.reading || "";
    if ($("pre-ask")) $("pre-ask").value = sp.question || "";
  }
  for (const src of [sp, si, spo]) {
    if (!src?.texts) continue;
    for (const [k, v] of Object.entries(src.texts)) {
      S.texts[k] = v;
      const el = $("tx-" + k);
      if (el && v) el.value = v;
    }
  }
  if (W.inc?.hunt && S.texts.hunt_run && $("hunt-badge")) {
    S.huntRun = S.texts.hunt_run;
    const b = $("hunt-badge"); b.hidden = false;
    b.className = "verdict " + (S.huntRun === "pass" ? "v-pass" : "v-fail");
    b.textContent = S.huntRun === "pass" ? "PASS" : "이전 실행: " + S.huntRun;
  }
  if (W.post?.review) {
    [...Array.from({ length: W.post.review.n || 3 }, (_, i) => "rv_v" + i), "rv_changed"].forEach((k) => {
      const el = $(k.replace("_", "-")); if (el && S.texts[k]) el.value = S.texts[k];
    });
  }
  if (si?.compare) {
    S.cmp = { rows: si.compare.rows, right: si.compare.right, total: si.compare.total };
    if ($("cmp-why")) $("cmp-why").value = si.compare.why || "";
  }
}

/* ══════════════════════════════════════════════════════════════
   5. 시작
══════════════════════════════════════════════════════════════ */
function buildSections() {
  W.pre.steps.forEach((s) => {
    const sec = stepBox($("sec-pre"), s);
    if (s.widget && WIDGET[s.widget]) WIDGET[s.widget](sec, s);
  });
  W.inc.steps.forEach((s) => {
    const sec = stepBox($("sec-in"), s);
    if (s.widget && WIDGET[s.widget]) WIDGET[s.widget](sec, s);
  });
  W.post.steps.forEach((s) => {
    const sec = stepBox($("sec-post"), s, "task");
    if (s.widget && WIDGET[s.widget]) WIDGET[s.widget](sec, s);
  });
  wireCopy();
}

function onStart() {
  const sid = $("sid").value.trim();
  if (!/^\d{6,10}$/.test(sid)) { $("idmsg").textContent = "학번을 숫자로 정확히 넣어 주세요."; return; }
  if (S.vcd) { S.qs = makeQuestions(sid); renderQuiz(); }
  if ($("board-cases")) renderBoard(sid);
  if ($("concept")) renderConcept(sid);
  if ($("predict")) renderPredict(sid);
  restore();
  ready();
  $("idmsg").textContent = `${sid} 님의 개념 문항 · 예측 문제 · 자가점검 · 보드 조합이 준비되었습니다.`;
  persist();
}

export async function startWeek(cfg) {
  W = cfg;
  document.title = `Week ${String(W.no).padStart(2, "0")} ${W.topic}`;
  shell();
  buildSections();

  /* 파일 칸 연결 */
  slot("practice", (f) => (S.practiceFile = f), "실습 waveform 캡처 — ModelSim Wave 창");
  slot("cap", (f) => (S.capFile = f), "Compilation Report 캡처 (Flow Summary 가 보이게)");
  slot("rtl", (f) => (S.rtlFile = f), "RTL Viewer 캡처 — 블록 이름이 읽히게");
  slot("wave", (f) => (S.waveFile = f), W.post.explain?.waveLabel || "waveform 캡처");
  multiSlot("board", (fs) => (S.boardFiles = fs), W.inc.board?.photoLabel || "사진");
  extraFiles("files", "drop", "filelist", (fs) => (S.picked = fs));
  extraFiles("files-post", "drop-post", "filelist-post", (fs) => (S.pickedPost = fs));
  wireSubmits();
  ["pre-read", "pre-ask", "cmp-why"].forEach((id) => {
    const el = $(id); if (el) el.addEventListener("input", () => { ready(); persist(); });
  });
  $("start").addEventListener("click", onStart);

  /* 슬라이드 */
  if ($("deck")) new SlideDeck($("deck"), W.deck);

  /* 골격 코드 */
  if ($("code")) {
    S.skeleton = W.inc.design.skeleton;
    $("code").value = S.skeleton;
  }

  /* waveform */
  if ($("wave") && W.inc.wave.vcd) {
    try {
      const txt = await fetch(W.inc.wave.vcd).then((r) => r.text());
      S.vcd = parseVCD(txt);
      $("scope-range").textContent = `0 – ${Math.round(S.vcd.endNs())} ns`;
      const step = W.inc.wave.step || 20;
      $("scope-seg").textContent = `${Math.round(S.vcd.endNs() / step)}개 구간 · 각 ${step} ns`;
      S.view = new WaveView($("wave"), S.vcd, W.inc.wave.sigs,
                            { cursorNs: step / 2, onCursor: readout });
      readout(step / 2);
    } catch (e) {
      $("wave").innerHTML = `<p class="q-hint">waveform 파일(${W.inc.wave.vcd})을 읽지 못했습니다.</p>`;
    }
  }

  /* 이어서 하기 */
  const sp = loadLocal(W.id + "-pre"), si = loadLocal(W.id + "-in"), spo = loadLocal(W.id + "-post");
  const sid = sp?.sid || si?.sid || spo?.sid || "";
  if (sid) { $("sid").value = sid; $("sname").value = sp?.name || si?.name || spo?.name || ""; }
  if (si) {
    if ($("code")) $("code").value = si.code || S.skeleton;
    S.lastRun = si.runStatus || null;
    if (si.practice && $("p-code")) {
      $("p-code").value = si.practice.code || "";
      S.pRun = si.practice.runStatus || null;
      S.pLog = si.practice.runLog || "";
    }
  }
  if (spo) {
    if ($("explain")) $("explain").value = spo.explain || "";
    if ($("discuss")) $("discuss").value = spo.discuss || "";
  }
  renderChecks();

  if (sid) {
    if (S.vcd) { S.qs = makeQuestions(sid); renderQuiz();
      for (const q of S.qs) { const i = $(`in-${q.id}`); if (i) i.value = si?.auto?.answers?.[q.id] || ""; } }
    if ($("board-cases")) renderBoard(sid);
    if ($("concept")) renderConcept(sid);
    if ($("predict")) renderPredict(sid);
    restore();
    $("idmsg").textContent = `${sid} 님의 내용을 이어서 합니다.`;
  }
  ready();
}
