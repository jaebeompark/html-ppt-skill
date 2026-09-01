# vc-ai-lecture · 벤처캐피털의 AI 활용

한국어 강의용 24장 덱입니다. **레이아웃을 고르기 위한 덱**이기도 해서,
`templates/single-page/`의 33종 중 **21종**을 한 장씩 실제 내용으로 채워 넣었습니다.
넘겨 보면서 쓸 것과 뺄 것을 정하시면 됩니다.

```bash
open examples/vc-ai-lecture/index.html
```

발표장에서는 `S`로 발표자 창을 띄우고 그 창을 노트북에, 덱은 빔프로젝터에 둡니다.
매 슬라이드에 150~300자 대본과 `[리허설: …]` 시간 배분 메모가 들어 있습니다.

| 키 | 동작 |
|---|---|
| `←` `→` | 페이지 이동 |
| `S` | 발표자 창 (현재 / 다음 / 대본 / 타이머) |
| `T` | 테마 순환 — pitch-deck-vc · corporate-clean · swiss-grid · academic-paper · editorial-serif · minimal-white |
| `O` | 전체 슬라이드 개요 |
| `F` · `N` · `Esc` | 전체화면 · 노트 서랍 · 닫기 |

## 24장 구성과 레이아웃 대응

각 슬라이드 하단 왼쪽에 `layout · <이름>` 이 찍혀 있습니다. 이 표와 같은 값입니다.

| # | 슬라이드 | 레이아웃 (`templates/single-page/`) | 배정 |
|---|---|---|---|
| 1 | 표지 | `cover` | 2분 |
| 2 | 목차 | `toc` | 1.5분 |
| 3 | 01 왜 지금인가 | `section-divider` | 1분 |
| 4 | 핵심 숫자 하나 | `stat-highlight` | 3분 |
| 5 | 지표 4종 | `kpi-grid` | 4분 |
| 6 | 업무 영역별 도입률 | `chart-bar` (Chart.js) | 5분 |
| 7 | 강의의 전제 | `big-quote` | 2분 |
| 8 | 02 딜 소싱 | `section-divider` | 40초 |
| 9 | 소싱 파이프라인 5단계 | `flow-diagram` | 5분 |
| 10 | 스코어링 구조 | `two-column` | 6분 |
| 11 | 스크리닝 전후 | `comparison` | 5분 |
| 12 | 시스템 3계층 | `arch-diagram` | 6분 |
| 13 | 03 실사·투자심의 | `section-divider` | 1분 |
| 14 | 실사에 쓰이는 세 가지 | `three-column` | 6분 |
| 15 | 도구 유형 비교 | `table` | 6분 |
| 16 | 자체 구축 vs 외부 도입 | `chart-radar` (Chart.js) | 5분 |
| 17 | 실사 체크리스트 8항 | `todo-checklist` | 6분 |
| 18 | 장점과 한계 | `pros-cons` | 5분 |
| 19 | 04 도입 로드맵 | `section-divider` | 40초 |
| 20 | 도입 4단계 | `process-steps` | 6분 |
| 21 | 우선순위 | `roadmap` | 5분 |
| 22 | 12개월 타임라인 | `timeline` | 4분 |
| 23 | 이번 주에 할 것 | `cta` | 3분 |
| 24 | 감사합니다 | `thanks` | Q&A 10분 |

본문 합계 약 90분(Q&A 포함)입니다.

### 아직 안 쓴 레이아웃 12종

바꿔 끼우고 싶으시면 이쪽에서 고르세요 — `bullets`, `code`, `diff`, `terminal`,
`mindmap`, `gantt`, `chart-line`, `chart-pie`, `image-hero`, `image-grid`,
`practice-prompt`, `downloads`.
슬라이드 교체는 해당 파일의 `<section class="slide">…</section>` 블록을 복사해
내용만 갈아끼우면 됩니다. 레이아웃 CSS는 `assets/layouts.css`가 이미 들고 있어서
따로 가져올 게 없습니다. 단 `code`는 highlight.js, `chart-*`는 Chart.js CDN
`<script>`를 `<head>`에 같이 넣어야 합니다.

## 실제 강의에 쓰기 전에 손볼 것

1. **숫자를 전부 바꾸세요.** `예시 데이터` 배지가 붙은 슬라이드(4·5·6·15·16)의
   수치는 구조를 보여주기 위한 자리표시자입니다. 실제 출처 있는 값으로 교체하고
   배지를 지우세요. 배지 제거는 한 줄입니다.

   ```bash
   perl -i -pe 's{<span class="demo">[^<]*</span>}{}g' examples/vc-ai-lecture/index.html
   ```

2. **레이아웃 이름표를 지우세요.** 레이아웃 고르기가 끝나면 하단 왼쪽의
   `layout · …` 표시는 청중에게 보일 이유가 없습니다.

   ```bash
   perl -i -pe 's{<span class="lay">[^<]*</span>}{<span class="dim2"></span>}g' examples/vc-ai-lecture/index.html
   ```

3. **발표자 정보**를 채우세요. 1·23·24번의 `발표자 이름 · 소속 · 이메일 · 자료 공유 링크`.

4. **대본을 다시 쓰세요.** `<aside class="notes">`의 대본은 흐름을 보여주는
   예시입니다. 세 가지만 지키면 됩니다 — 읽는 글이 아니라 **신호**로 쓸 것
   (핵심어 `<strong>`, 전환 문장은 문단 분리), **한 장에 150~300자**,
   그리고 **입말로** ("따라서"보다 "그래서").

5. **테마를 정하세요.** `T`로 여섯 개를 돌려 보고 하나로 확정한 뒤,
   `<link id="theme-link">`의 경로를 그 테마로 고정하면 됩니다.

## 한글 조판

`style.css`가 처리하는 건 사실상 두 가지입니다.

- **`word-break: keep-all`** — 브라우저 기본값은 한글을 아무 글자에서나 끊습니다.
  큰 제목에서 "벤처캐피털이"가 "벤처캐피 / 털이"로 갈리면 읽는 리듬이 무너집니다.
  어절 단위로 넘어가게 했고, `pre`·`code`·표의 숫자에서는 다시 껐습니다.
- **넉넉한 행간** — 제목 1.22, 본문 1.75. 한글은 라틴보다 글자가 빽빽해서
  같은 `line-height`면 답답해 보입니다.

폰트는 Pretendard입니다(`assets/fonts.css`가 이미 불러옵니다). 라틴과 한글을
한 벌이 덮어서 `45분 → 8분` 같은 숫자·기호 혼용 줄에서 베이스라인이 어긋나지
않습니다. 여섯 테마 모두 한글이 깨지지 않는 것으로 `scripts/smoke.sh`에서 확인됩니다.

## 내용에 대한 주의

이 덱의 논지 — AI는 깔때기의 입구를 넓히지 출구를 넓히지 않는다, 도입 순서는
"어디가 편해지나"가 아니라 "어디가 틀려도 되나"로 정한다, 기준표 없이 도구를
사면 AI가 자기 기준으로 답한다 — 는 강의 뼈대로 쓸 수 있는 형태로 써 뒀지만,
**수치는 전부 예시**입니다. 실제 강의에서는 여러분 조합의 데이터나 출처를 밝힌
공개 자료로 바꾸신 뒤 쓰세요.
