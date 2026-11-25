// 주차별 과제를 설정 파일(assets/weeks/wNN.js)만 보고 검사한다.
//   ① 정답본(ref_solutions/wNN/ref_<file>) -> PASS 여야 한다
//   ② 골격(inc.design.skeleton)            -> FAIL 이어야 한다 (학생이 채울 자리가 비어 있으므로)
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SITE = import.meta.dirname;
const WEEKS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["w01","w02","w03","w04","w05","w06","w07","w09","w10","w11","w12"];

const run = (dir, cmd) => {
  try {
    const out = execSync(cmd, { cwd: dir, encoding: "utf8", stdio: ["ignore","pipe","pipe"], timeout: 180000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
};
const verdict = (r) => {
  const m = (r.out.match(/RESULT\s*:?\s*(PASS|FAIL)/) || [])[1];
  if (m) return m;
  if (/error:/.test(r.out)) return "COMPILE-ERR";
  return r.ok ? "no-result" : "RUNTIME-ERR";
};

let fails = 0;
for (const wk of WEEKS) {
  const { W } = await import(path.join(SITE, "assets/weeks", wk + ".js"));
  const d = W.inc && W.inc.design;
  if (!d || !d.file) { console.log(`${wk}  (과제 코드 없음)`); continue; }
  const ref = path.join(SITE, "ref_solutions", wk, "ref_" + d.file);
  const line = [];
  // given:true 인 주차는 과제가 아니라 "전체 코드를 주는 따라 만들기" 이므로 골격도 PASS 여야 한다
  const want2 = d.given ? "PASS" : "FAIL";
  for (const [tag, src] of [["정답본", fs.existsSync(ref) ? fs.readFileSync(ref, "utf8") : null],
                            [d.given ? "제공코드" : "골격", d.skeleton]]) {
    if (src == null) { line.push(`${tag}=없음(${path.relative(SITE, ref)})`); fails++; continue; }
    const tmp = fs.mkdtempSync(`/tmp/vt_${wk}_`);
    fs.symlinkSync(path.join(SITE, "grader"), path.join(tmp, "grader"));
    fs.writeFileSync(path.join(tmp, d.file), src);
    const v = verdict(run(tmp, d.localCmd));
    const want = tag === "정답본" ? "PASS" : want2;
    const good = want === "PASS" ? v === "PASS" : v !== "PASS" && v !== "no-result";
    if (!good) fails++;
    line.push(`${tag}=${v}${good ? "" : ` (기대: ${want})`}`);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`${wk}  ${d.file.padEnd(22)} ${line.join("   ")}`);

  // ③ AI 코드 감별 : AI 가 쓴 코드(hunt.code) 는 FAIL, 고친 정답본(ref_solutions/hunt/fixed_<practice>) 은 PASS
  const H = W.inc.hunt, P = W.inc.practice;
  if (H && P) {
    const hl = [];
    const fixed = path.join(SITE, "ref_solutions", "hunt", "fixed_" + P.file);
    for (const [tag, src, want] of [["AI코드", H.code, "FAIL"],
                                    ["고친본", fs.existsSync(fixed) ? fs.readFileSync(fixed, "utf8") : null, "PASS"]]) {
      if (src == null) { hl.push(`${tag}=없음`); fails++; continue; }
      const tmp = fs.mkdtempSync(`/tmp/vh_${wk}_`);
      fs.symlinkSync(path.join(SITE, "grader"), path.join(tmp, "grader"));
      fs.writeFileSync(path.join(tmp, P.file), src);
      const v = verdict(run(tmp, P.localCmd));
      const good = want === "PASS" ? v === "PASS" : v !== "PASS" && v !== "no-result";
      if (!good) fails++;
      hl.push(`${tag}=${v}${good ? "" : ` (기대: ${want})`}`);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    console.log(`${wk}  감별 ${P.file.padEnd(17)} ${hl.join("   ")}`);
  }
}
console.log(fails === 0 ? "\n모두 정상" : `\n문제 ${fails} 건`);
process.exit(fails ? 1 : 0);
