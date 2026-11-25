/* ------------------------------------------------------------------
   slides.js — 강의 슬라이드 뷰어 (이미지, 외부 라이브러리 없음)
------------------------------------------------------------------ */
export class SlideDeck {
  /** @param {HTMLElement} host  @param {object} o {dir, count, pad, title, narration} */
  constructor(host, o) {
    this.host = host; this.o = o; this.i = 0;
    this.narr = null; this.audio = null; this.playing = false;
    this.key = "slide-" + (o.dir || "deck");
    try { const v = Number(localStorage.getItem(this.key)); if (v >= 0 && v < o.count) this.i = v; } catch (_) {}
    this.build();
  }

  src(n) {
    if (this.o.per) return `${this.o.dir}/p-${Math.floor(n / this.o.per) + 1}.jpg`;
    const num = String(n + 1).padStart(this.o.pad || 2, "0");
    return `${this.o.dir}/s-${num}.jpg`;
  }

  build() {
    const h = this.host;
    h.innerHTML = `
      <div class="deck">
        <div class="deck-stage">
          ${this.o.per ? `<div class="deck-clip"><img id="deck-img" alt="" decoding="async"></div>` : `<img id="deck-img" alt="" decoding="async">`}
          <button class="deck-nav prev" type="button" aria-label="이전 장">‹</button>
          <button class="deck-nav next" type="button" aria-label="다음 장">›</button>
        </div>
        <div class="deck-bar">
          <button class="btn" data-go="-1" type="button">◀ 이전</button>
          <span class="deck-count"><span id="deck-i">1</span> / ${this.o.count}</span>
          <input type="range" id="deck-range" min="1" max="${this.o.count}" value="1" aria-label="슬라이드 이동">
          <button class="btn" data-go="1" type="button">다음 ▶</button>
        </div>
        <div class="deck-narr" id="deck-narr" hidden>
          <div class="nrow">
            <button class="btn primary" id="n-play" type="button">▶ 나레이션</button>
            <select id="n-voice" aria-label="목소리"></select>
            <label class="nchk"><input type="checkbox" id="n-auto"> 끝나면 다음 장</label>
            <button class="btn" id="n-text" type="button">대본 보기</button>
            <span class="nsrc" id="n-src"></span>
          </div>
          <div class="nscript" id="n-script" hidden></div>
        </div>
      </div>`;
    this.img = h.querySelector("#deck-img");
    this.range = h.querySelector("#deck-range");
    this.label = h.querySelector("#deck-i");

    h.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => this.go(this.i + Number(b.dataset.go))));
    h.querySelector(".prev").addEventListener("click", () => this.go(this.i - 1));
    h.querySelector(".next").addEventListener("click", () => this.go(this.i + 1));
    this.range.addEventListener("input", () => this.go(Number(this.range.value) - 1));
    this.img.addEventListener("click", () => this.go(this.i + 1));

    // 뷰어에 포커스가 있을 때만 좌우 키를 받는다
    h.tabIndex = 0;
    h.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { this.go(this.i - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { this.go(this.i + 1); e.preventDefault(); }
    });

    this.go(this.i);
    if (this.o.narration) this.initNarration();
  }

  /* ---------- 나레이션 ----------
     녹음한 mp3 가 있으면 그것을 틀고, 없으면 브라우저의 한국어 음성으로 읽는다.
     브라우저 음성은 PC 에 설치된 목소리를 쓰므로 환경마다 다르다. */
  async initNarration() {
    try {
      const m = await import(`./narration/${this.o.narration}.js`);
      this.narr = m.NARRATION || null;   // 대본 (교수용 판에만 있음)
      this.voice = m.AUDIO || null;   // 교수 음성 (주차별 mp3 한 개 + 장별 구간)
    } catch (_) { return; }
    const box = this.host.querySelector("#deck-narr");
    if (!box || (!this.narr && !this.voice)) return;
    box.hidden = false;

    this.btn = box.querySelector("#n-play");
    this.sel = box.querySelector("#n-voice");
    this.chk = box.querySelector("#n-auto");
    this.srcLabel = box.querySelector("#n-src");
    this.scriptBox = box.querySelector("#n-script");

    if (this.voice) {
      // 교수 음성이 있으면 브라우저 음성 선택은 숨긴다
      this.sel.style.display = "none";
      this.srcLabel.textContent = "교수 음성";
      this.va = new Audio();
      this.va.preload = "metadata";
      this.va.src = this.voice.src;
      this.va.addEventListener("timeupdate", () => this.checkEnd());
      this.va.addEventListener("ended", () => this.segDone());
    } else {
      this.fillVoices();
      if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => this.fillVoices();
    }

    this.btn.addEventListener("click", () => (this.playing ? this.stop() : this.play()));
    const tb = box.querySelector("#n-text");
    if (!this.narr) tb.style.display = "none";   // 학생용: 대본 없음
    tb.addEventListener("click", () => {
      this.scriptBox.hidden = !this.scriptBox.hidden;
      this.showScript();
    });
    this.showScript();
  }

  fillVoices() {
    if (!this.sel || !window.speechSynthesis) return;
    const ko = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang));
    const keep = this.sel.value;
    // 남성 목소리를 먼저 올린다 (이름에 남성·Male·InJoon 등이 들어간 것)
    const male = (v) => /male|injoon|남성|남자|gook|hyun|min(?!ji)/i.test(v.name) && !/female/i.test(v.name);
    ko.sort((a, b) => (male(b) ? 1 : 0) - (male(a) ? 1 : 0));
    this.sel.innerHTML = ko.length
      ? ko.map((v) => `<option value="${v.name}">${v.name}${male(v) ? " (남성)" : ""}</option>`).join("")
      : `<option value="">설치된 한국어 음성 없음</option>`;
    if (keep && ko.some((v) => v.name === keep)) this.sel.value = keep;
    this.sel.disabled = ko.length === 0;
  }

  showScript() {
    if (!this.narr) return;
    if (!this.scriptBox || this.scriptBox.hidden) return;
    const n = this.narr[this.i];
    this.scriptBox.textContent = n ? n.read : "(이 장의 대본이 없습니다)";
  }

  mp3(n) {
    const num = String(n + 1).padStart(this.o.pad || 2, "0");
    return `narration/${this.o.narration}/s-${num}.mp3`;
  }

  play() {
    const n = this.narr && this.narr[this.i];
    if (!n && !(this.voice && this.voice.seg[this.i])) return;
    this.playing = true;
    this.btn.textContent = "■ 정지";
    const done = () => { if (this.playing) { this.playing = false; this.btn.textContent = "▶ 나레이션"; this.advance(); } };

    // ⓪ 교수 음성 — 주차 mp3 에서 이 장의 구간만 재생
    if (this.voice && this.va && this.voice.seg[this.i]) {
      const [st, en] = this.voice.seg[this.i];
      this.segEnd = en; this.segCb = done;
      const go = () => {
        this.va.currentTime = st;
        this.va.play().catch(() => { this.segCb = null; if (n) this.speak(n.tts, done); else this.stop(); });
      };
      if (this.va.readyState >= 1) go();
      else this.va.addEventListener("loadedmetadata", go, { once: true });
      this.srcLabel.textContent = "교수 음성";
      return;
    }

    // ① 녹음 파일이 있으면 그쪽을 쓴다
    const a = new Audio(this.mp3(this.i));
    this.audio = a;
    a.addEventListener("ended", done);
    a.addEventListener("error", () => { this.audio = null; this.speak(n.tts, done); });
    a.play().then(() => { if (this.srcLabel) this.srcLabel.textContent = "녹음 음성"; })
            .catch(() => { this.audio = null; this.speak(n.tts, done); });
  }

  speak(text, done) {
    if (!window.speechSynthesis) {
      if (this.srcLabel) this.srcLabel.textContent = "이 브라우저는 음성 합성을 지원하지 않습니다";
      this.playing = false; this.btn.textContent = "▶ 나레이션"; return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const v = speechSynthesis.getVoices().find((x) => x.name === this.sel.value);
    if (v) u.voice = v;
    u.lang = (v && v.lang) || "ko-KR";
    u.rate = 1.0; u.pitch = 1.0;
    u.onend = done;
    u.onerror = done;
    if (this.srcLabel) this.srcLabel.textContent = "브라우저 음성 (녹음 파일 없음)";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  checkEnd() {
    if (this.segCb && this.va.currentTime >= this.segEnd) this.segDone();
  }

  segDone() {
    if (!this.segCb) return;
    const cb = this.segCb; this.segCb = null;
    this.va.pause();
    cb();
  }

  stop() {
    this.segCb = null;
    if (this.va) this.va.pause();
    this.playing = false;
    this.btn.textContent = "▶ 나레이션";
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  advance() {
    if (this.chk && this.chk.checked && this.i + 1 < this.o.count) {
      this.go(this.i + 1);
      setTimeout(() => this.play(), 250);
    }
  }

  go(n) {
    this.i = Math.max(0, Math.min(this.o.count - 1, n));
    const u = this.src(this.i);
    if (!this.img.src.endsWith(u)) this.img.src = u;
    if (this.o.per) this.img.style.top = `${-(this.i % this.o.per) * 100}%`;
    this.img.alt = `${this.o.title || "슬라이드"} ${this.i + 1}장`;
    this.label.textContent = this.i + 1;
    this.range.value = this.i + 1;
    if (this.narr || this.voice) { if (this.playing) this.stop(); this.showScript(); }
    try { localStorage.setItem(this.key, String(this.i)); } catch (_) {}
    // 다음 장 미리 받아 두기
    if (this.i + 1 < this.o.count && this.src(this.i + 1) !== u) new Image().src = this.src(this.i + 1);
  }
}
