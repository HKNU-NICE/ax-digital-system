#!/usr/bin/env python3
"""주차 페이지(wNN.html)와 index.html 을 만든다.

내용은 assets/weeks/wNN.js 한 곳에만 있고, 이 스크립트는 그것을 불러
쓰는 껍데기만 찍어 낸다. 주차를 늘릴 때는 WEEKS 에 한 줄 더하면 된다.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))

# (주차, 제목, 한 줄 설명, 페이지 유무)
WEEKS = [
    (1,  "디지털 시스템과 FPGA",      "설계 흐름 · Quartus 첫 프로젝트 · Lab 0",      True),
    (2,  "VHDL 기본 구조 ①",         "entity · architecture · std_logic · Lab 1",   True),
    (3,  "벡터와 선택 구문",           "MUX · 디코더 · 인코더 · Lab 2",               True),
    (4,  "process 와 7-세그먼트",     "case · 래치 방지 · assert 첫걸음 · Lab 3",     True),
    (5,  "산술회로 — 가감산기",         "2의 보수 · 오버플로우 · Lab 4",               True),
    (6,  "클록과 레지스터",            "플립플롭 · 시프트 레지스터 · Lab 5",            True),
    (7,  "카운터와 버튼",             "분주 · 디바운스 · Lab 6",                     True),
    (8,  "중간 정리와 프로젝트 시작",     "중간고사 · 팀 편성",                         True),
    (9,  "FSM ① 상태도에서 코드까지",   "순서 검출기 · Lab 7",                        True),
    (10, "FSM ② 타이머",            "신호등 제어기 · Lab 8",                       True),
    (11, "계층 설계",                "분:초 시계 · Lab 9",                         True),
    (12, "데이터패스와 메모리",         "레지스터 파일 · RAM · Lab 10",                True),
    (13, "프로젝트 ① 설계",           "ALU + 제어 FSM 설계서",                      True),
    (14, "프로젝트 ② 검증",           "테스트벤치 · 보드 시연 준비",                   True),
    (15, "발표 · 시연 · 마무리",       "팀 발표 · 한 학기 정리",                      True),
]

HEAD = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="claude:viewport-fit-sides" content="cover">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<script type="module">
  import {{ W }} from "./assets/weeks/{wid}.js";
  import {{ startWeek }} from "./assets/week.js";
  startWeek(W);
</script>
</body>
</html>
"""


def week_pages():
    made = []
    for no, title, sub, live in WEEKS:
        wid = "w%02d" % no
        cfg = os.path.join(HERE, "assets", "weeks", wid + ".js")
        if not os.path.exists(cfg):
            continue
        html = HEAD.format(title="Week %02d %s" % (no, title), wid=wid)
        with open(os.path.join(HERE, wid + ".html"), "w", encoding="utf-8") as f:
            f.write(html)
        made.append(wid)
    return made


def index(made):
    rows = []
    for no, title, sub, live in WEEKS:
        wid = "w%02d" % no
        href = wid + ".html" if wid in made else None
        rows.append('    [%d,"%s","%s",%s],'
                    % (no, title, sub, '"%s"' % href if href else "null"))
    src = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
    body = "  const WEEKS = [\n" + "\n".join(rows) + "\n  ];"
    src = re.sub(r"  const WEEKS = \[.*?\n  \];", body, src, flags=re.S)
    open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(src)
    return len(made)


if __name__ == "__main__":
    made = week_pages()
    index(made)
    print("주차 페이지 %d개 :" % len(made), " ".join(made))
