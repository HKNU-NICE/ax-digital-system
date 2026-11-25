// assets/weeks/*.js 의 localCmd 만 보고 Actions 채점 표를 다시 만든다 (표가 설정과 어긋나지 않게)
import fs from "node:fs";
import path from "node:path";
const SITE = import.meta.dirname;
const WEEKS = ["w01","w02","w03","w04","w05","w06","w07","w09","w10","w11","w12"];
const LAB = { w01:"lab00", w02:"lab01", w03:"lab02", w04:"lab03", w05:"lab04", w06:"lab05",
              w07:"lab06", w09:"lab07", w10:"lab08", w11:"lab09", w12:"lab10" };

function parse(cmd, file) {
  const run = cmd.match(/ghdl -r --std=08 (\S+)([^&]*)$/);
  if (!run) throw new Error("ghdl -r 를 못 찾음: " + cmd);
  const tb = run[1];
  const runargs = run[2].trim();
  const ana = cmd.slice(0, cmd.indexOf("&&"));
  const files = ana.replace(/ghdl -a --std=08/, "").trim().split(/\s+/).filter(Boolean);
  const deps = files.filter((f) => f !== file && !f.endsWith(`${tb}.vhd`));
  return { top: file.replace(/\.vhd$/, ""), tb, deps: deps.join(" "), runargs };
}

const rows = [];
for (const wk of WEEKS) {
  const { W } = await import(path.join(SITE, "assets/weeks", wk + ".js"));
  for (const [suffix, c] of [["p", W.inc?.practice], ["", W.inc?.design]]) {
    if (!c || !c.file || !c.localCmd) continue;
    const p = parse(c.localCmd, c.file);
    rows.push({ lab: LAB[wk] + suffix, wk, ...p });
  }
}
const w = (k, n) => rows.reduce((m, r) => Math.max(m, String(r[k]).length), n);
const table = rows.map((r) =>
  `            ${(r.lab + ")").padEnd(w("lab", 6) + 1)} WK=${r.wk}; ` +
  `TOP=${(r.top + ";").padEnd(w("top", 6) + 1)} TB=${(r.tb + ";").padEnd(w("tb", 6) + 1)} ` +
  `DEPS="${r.deps}"; RUNARGS="${r.runargs}" ;;`).join("\n");

const p = path.join(SITE, ".github/workflows/run-vhdl.yml");
let y = fs.readFileSync(p, "utf8");
const a = y.indexOf('          case "$LAB" in\n') + '          case "$LAB" in\n'.length;
const b = y.indexOf('            *) echo "모르는 실습 이름', a);
y = y.slice(0, a) + table + "\n" + y.slice(b);
y = y.replace(/            echo "DEPS=\$DEPS"\n/, '            echo "DEPS=$DEPS"\n            echo "RUNARGS=$RUNARGS"\n');
y = y.replace(/ {17}--stop-time=10us >> out\.log 2>&1 ; then/,
              '                 $RUNARGS >> out.log 2>&1 ; then');
fs.writeFileSync(p, y);
console.log(table);
console.log(`\n${rows.length} 줄`);
