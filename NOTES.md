# 기린마을 — 프로젝트 노트

새 Claude 세션이 이 파일 하나로 프로젝트 맥락 이어받도록 정리한 문서. 결정 배경·현재 상태·다음 후보를 담음.

---

## 서비스 개요

- **이름**: 기린마을 (kirinmaeul)
- **한 줄 소개**: 발달장애인이 편하게 이용할 수 있는 식당·카페·여가 장소를 보호자들이 함께 기록·공유하는 지도 서비스
- **대상 사용자**: 발달장애인의 보호자 (본인이 아니라 보호자가 등록·검색)
- **현 상태**: BETA 오픈. 라이브 사이트 존재, 실제 사용자 유입 전
- **어조·톤**: 차분함·신뢰감·따뜻함. 홍보 톤 X, 담담한 커뮤니티 톤

## 기술 스택

- **단일 파일 웹앱**: `index.html` 하나에 모든 HTML/CSS/JS
- **DB·인증**: Supabase (이메일+비밀번호)
- **지도**: 카카오맵 SDK v2 + `libraries=services` (장소 검색)
- **길찾기**: 카카오맵 딥링크(`kakaomap://route`) + 웹 URL 폴백
- **호스팅**: GitHub Pages + 커스텀 도메인
- **PWA**: manifest.json + 최소 서비스 워커, 홈 화면 앱 추가 가능

## 접속 정보 (전부 사용자 소유)

- **라이브 URL**: https://kirinmaeul.com
- **GitHub 저장소**: `git@github.com:rogdam0715/disablemap.git` (public, main 브랜치)
- **Supabase 프로젝트**: `https://eqpmxsikzluywowsxcut.supabase.co`
  - anon 키는 `index.html` 안에 하드코딩 (공개용이라 안전)
  - service_role 키는 코드 안에 없음. **절대 커밋 금지**
- **카카오맵 JS 키**: `94ff6d2587c3aabe02fa182e51e04cd2` (`index.html`의 script src에)
  - 콘솔에 `kirinmaeul.com` / `www.kirinmaeul.com` / `rogdam0715.github.io` 등록됨
- **도메인 등록**: 가비아, DNS 이미 세팅 완료 (A 4개 + www CNAME)
- **문의 이메일**: `kirinmaeul@naver.com` (개인 이메일 아님)

## 데이터 모델 (Supabase)

- `places` (공유 자산)
  - id·name·category(`restaurant`/`cafe`/`leisure`)·address·lat/lng·tags(text[])·note·photos(text[])
  - `created_by`(auth.uid) + `created_by_nickname`(비정규화된 캐시)
  - RLS: 보기=누구나, 쓰기=로그인, 수정·삭제=본인만
- `reactions`
  - place_id × user_id 유니크. type: `like` / `dislike`. `reason`은 dislike일 때만
  - `place_id`는 ON DELETE CASCADE
  - **좋아요=즐겨찾기** (별도 테이블 없이 좋아요한 장소가 즐겨찾기)
- `place-photos` (Storage 버킷, public)
  - 사용자별 폴더 (`{userId}/xxx.jpg`)
  - 업로드 시 브라우저에서 자동 리사이즈(canvas, 1280px, JPEG 0.85)

## 확정된 제품 결정 (수정 시 팀 논의)

- **좋아요/싫어요**만 있음. 별점·자유 리뷰 없음
- **싫어요 누를 때만** 사유 텍스트 입력 (선택). 다른 사람들 참고용
- **좋아요=즐겨찾기** (별도 즐겨찾기 개념 없음)
- **접근성 태그**는 장소 등록 시 1회만. 방문자별 후기 X (단순화)
- **8종 고정 태그 + 이모지 매핑**:
  ♿ 휠체어 접근 가능 · 🤫 조용한 공간 · 🖼️ 그림·사진 메뉴판 · 🤗 직원이 친절해요 · 🚶 넓고 단순한 동선 · 🌙 자극이 적은 조명 · 🚻 장애인 화장실 · 🚗 주차 편리
- **장소 이름·주소·위치는 검색으로만** 자동 입력. 새 등록 시 readonly (수정 모드에선 풀림)
- **카테고리 3종**: 식당·카페·여가/놀이

## 디자인 결정

- **컬러**: 흰/검 미니멀 + **청록 액센트 `#0F8A72`** (변수 `--accent`, `--accent-dark`, `--accent-soft`)
- **삭제·위험 액션**만 빨강(`--danger: #c0392b`)
- **폰트**: Noto Sans KR
- **로고**: `logo.png` (128px) + `logo-512.png` (540px, PWA 큰 아이콘)
- **핀**: `pin.png` 64×70, 표시 44×48, 앵커 바닥 중앙(22,48), 드롭 섀도 CSS
- **BETA 배지**: 헤더 제목 옆 청록 작은 라벨
- **모바일**: 목록만 표시 → 장소 탭 시 지도+상세로 화면 전환 (모달 아님)
- **필터 칩**: 검색창과 같은 10px 라운드. `전체 / 카테고리 ▾ / 좋아요 / 내가 등록` + 왼쪽 끝에 `📍 내 주변`
- **로그아웃 게이트**: 상위 2개 항목 선명·나머지 블러 + 하단 그라데이션 오버레이 + "가입하고 함께하기" 버튼

## 주요 흐름·주의사항 (개발 시)

- **카카오 SDK가 lazy load**라 지도 초기화는 `kakao.maps.load(() => { ... })` 안에서. 인증·데이터 init은 SDK 로드와 **분리**해서 지도 안 떠도 리스트는 정상 동작
- **`renderMarkers`**는 `if (!map) return;` 가드. SDK 준비 후 `renderList()` 한 번 더 호출로 마커 그림
- **미리보기 localhost는 카카오 도메인 미등록**이라 지도 안 뜸. 실제 검증은 라이브에서
- **길찾기 `openDirections`**: 모바일은 geolocation 얻어 `kakaomap://route?sp=..&ep=..&by=PUBLICTRANSIT`로 앱 자동 열기 + 1.5초 폴백으로 웹 URL. PC는 웹 URL 새 탭
- **Supabase Confirm email OFF 상태**: 스팸 방지 위해 언젠가 켜야 함. 켜면 우리 코드가 이미 "이메일 인증 안내" 처리함
- **`.claude/launch.json`**은 미리보기 서버 정의(파이썬 http.server 5050). 새 컴퓨터에선 파일 클론 시 함께 옴

## 개발·배포 워크플로우

1. `python3 -m http.server 5050` 로 로컬 미리보기 (Claude Code가 자동으로 함)
2. `index.html` 편집
3. `git commit + git push origin main`
4. GitHub Pages 자동 배포. 보통 30~60초 안에 라이브 반영
5. 라이브에서 확인 (Cmd+Shift+R로 강제 새로고침)

## SSH 키

- 이 저장소는 로컬 config로 전용 SSH 키 사용:
  ```
  git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_rogdam0715 -o IdentitiesOnly=yes"
  ```
- 사용자의 다른 GitHub 계정(backrogdam0715)과 분리하기 위함
- 새 컴퓨터로 옮길 땐 그 컴퓨터에서 새로 SSH 키 만들어 rogdam0715 계정에 등록하는 게 안전

## 지금까지 배포 이력 요약

- 초기 프로토타입 (localStorage) → Supabase 이식 → 카카오맵 이식 → BETA 오픈 준비
- 최근 커밋들:
  - PWA 셋업 (manifest·sw)
  - 푸터·헤더 다듬기 (인스타·블로그 아이콘, 정책 링크)
  - 베타 오픈 준비: 정책·OG·첫방문자 게이트·파비콘·BETA 배지
  - 핀 이미지·색상(청록)·로고 교체

## 다음 후보 (베타 오픈 초기 개선)

체크리스트 순서는 우선순위:

1. **🚩 신고 기능** (아직 미구현)
   - `reports` 테이블 (place_id, user_id, reason type, memo)
   - 다른 사람 장소의 ⋯ 메뉴에 "🚩 신고" 항목 추가
   - 신고 사유는 정해진 4개 라디오 (잘못된 정보 / 부적절 / 스팸 / 기타) + 자유 메모
2. **이메일 인증 켜기** (Supabase 대시보드에서 토글만 켜면 됨)
3. **시드 데이터 채우기** — 최소 실제 장소 10~20개
4. **관리자 도구** — 지금은 Supabase 대시보드에서 수동
5. **분석** — Plausible/Umami 같은 프라이버시 친화 도구
6. **접근성 개선** — aria-label, 키보드 탐색, 색 대비 검증

## 언젠가 (진짜 앱 필요 시)

- **Capacitor로 앱 스토어 진출**: 코드 그대로 쓰면서 iOS/Android 앱화. 실작업 3~5일, 대기 1~2주. Apple $99/년 + Google $25 일회성. 지금은 PWA로 충분

## 안 할 것들 (명시적으로 결정)

- 다크 모드 (본질 아님)
- 다국어 (지금은 한국어만)
- React Native 재작성 (오버스펙)
- 별점·자유 리뷰 (좋아요/싫어요로 대체)
- 여러 개 즐겨찾기 폴더 (즐겨찾기 하나만, 좋아요=즐겨찾기)

## 파일 구조

```
disablemap/
├─ index.html         # 모든 코드
├─ manifest.json      # PWA
├─ sw.js              # 최소 서비스 워커
├─ logo.png           # 128×128, 파비콘·헤더 로고
├─ logo-512.png       # 540×540, PWA 큰 아이콘
├─ pin.png            # 64×70, 지도 마커
├─ insta.png          # 512×512, 인스타 아이콘 (푸터)
├─ blog.png           # 24×24, 블로그 아이콘 (푸터)
├─ CNAME              # kirinmaeul.com (GitHub Pages)
├─ .gitignore         # .claude, .DS_Store 제외
├─ .claude/launch.json # 미리보기 서버 설정 (python3 -m http.server 5050)
└─ NOTES.md           # 이 파일
```

---

최종 갱신: 2026-07-01
