# MusicLens — 음악 & 장르 탐색 웹사이트 기획서
> **Sonnet 기획 → Opus 제작용 완전 명세서**  
> 기술 스택: HTML + CSS + Vanilla JS (단일 파일)  
> 언어: 한/영 병행 (KO 우선, EN 병기)  
> 데이터: Mock JSON (Spotify API 연동 구조로 설계)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 사이트명 | **MusicLens** / 뮤직렌즈 |
| 슬로건 | "음악의 모든 장르를 탐험하다 · Explore Every Genre" |
| 핵심 기능 | 장르 탐색 + 추천 (Priority 1), 차트 100, 시대별 역사, 현재 재생 |
| 디자인 기준 | Spotify Design System (Spotify.md 전체 준수) |
| 파일 구조 | 단일 `index.html` — CSS/JS 모두 인라인 |
| 라우팅 | Hash-based SPA (`#home`, `#chart`, `#genres`, `#genre/:id`, `#timeline`, `#search`) |

---

## 2. 사이트맵

```
MusicLens
├── #home          홈 — 히어로, 지금 트렌딩, 추천 장르 카드
├── #chart         차트 100 — TOP 100 순위, 장르/시대 필터
├── #genres        장르 탐색 — 전체 장르 그리드 (15개 장르)
├── #genre/:id     장르 상세 — 곡 목록, 서브장르, 연관 장르, 교차청취
├── #timeline      시대별 역사 — 1950s~2020s 타임라인
└── #search        장르 검색 — 곡명/아티스트 → 장르 식별
```

---

## 3. 레이아웃 구조

```
┌────────────────────────────────────────────┐
│  SIDEBAR (fixed, 240px)  │   MAIN CONTENT  │
│  - Logo (MusicLens)      │   (scroll area) │
│  - Nav Links             │                 │
│  - Genre Quick List      │                 │
│                          │                 │
├──────────────────────────┴─────────────────┤
│  NOW PLAYING BAR (fixed bottom, 90px)      │
└────────────────────────────────────────────┘

Mobile (<768px):
- Sidebar → 숨김
- Bottom Nav 표시 (Home / Chart / Genres / Search)
- Now Playing Bar 유지 (축소형)
```

---

## 4. 디자인 토큰 (Spotify.md 기준)

```css
/* Backgrounds */
--bg-base: #121212;
--bg-surface: #181818;
--bg-elevated: #1f1f1f;
--bg-card: #252525;

/* Text */
--text-primary: #ffffff;
--text-secondary: #b3b3b3;
--text-muted: #7c7c7c;

/* Accent */
--accent: #1ed760;
--accent-dark: #1db954;

/* Semantic */
--color-error: #f3727f;
--color-warning: #ffa42b;
--color-info: #539df5;

/* Border */
--border-subtle: #4d4d4d;
--border-muted: #2a2a2a;

/* Shadows */
--shadow-heavy: rgba(0,0,0,0.5) 0px 8px 24px;
--shadow-medium: rgba(0,0,0,0.3) 0px 8px 8px;
--shadow-inset: rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset;

/* Radius */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-pill: 9999px;
--radius-large-pill: 500px;
--radius-circle: 50%;

/* Font */
--font-ui: 'CircularSp', 'Helvetica Neue', helvetica, arial, sans-serif;
/* 실제 구현: Google Fonts에서 가장 가까운 대체 → DM Sans 또는 Inter 사용 */
/* <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap"> */

/* Spacing (8px 기반) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

---

## 5. 장르 데이터 정의 (15개 장르, Mock)

각 장르는 고유 색상 아이덴티티를 가짐. 장르 카드 배경 = 해당 색상의 그라디언트.

```javascript
const GENRES = [
  {
    id: "pop",
    name: "Pop",
    nameKo: "팝",
    color: "#FF6B9D",
    colorSecondary: "#FF9CC7",
    emoji: "✨",
    description: "Universally appealing melodies with polished production",
    descriptionKo: "누구나 즐길 수 있는 세련된 대중음악. 귀에 쏙 들어오는 훅과 완성도 높은 프로덕션이 특징.",
    eraOrigin: "1950s",
    subGenres: ["synth-pop", "indie-pop", "k-pop", "dream-pop", "art-pop"],
    relatedGenres: ["r&b", "electronic", "indie"],
    alsoListenTo: ["indie", "r&b", "k-pop", "electronic"],
    characteristics: ["Catchy hooks", "Verse-chorus structure", "Polished production", "Wide vocal range"],
    topArtists: ["Taylor Swift", "The Weeknd", "Dua Lipa", "Harry Styles", "Olivia Rodrigo"],
    listeners: 2800000000
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    nameKo: "힙합",
    color: "#F7C948",
    colorSecondary: "#FFE082",
    emoji: "🎤",
    description: "Rhythmic poetry over beats — born in the Bronx, shaped the world",
    descriptionKo: "브롱크스에서 태어난 리듬과 라임의 예술. 세계 문화를 재편한 장르.",
    eraOrigin: "1970s",
    subGenres: ["trap", "gangsta-rap", "conscious-rap", "boom-bap", "drill", "mumble-rap"],
    relatedGenres: ["r&b", "pop", "electronic"],
    alsoListenTo: ["r&b", "trap", "pop", "lo-fi"],
    characteristics: ["Rhythmic flow", "Sampling", "Storytelling", "Social commentary", "Beat-driven"],
    topArtists: ["Kendrick Lamar", "Drake", "Travis Scott", "J. Cole", "Kanye West"],
    listeners: 2100000000
  },
  {
    id: "rock",
    name: "Rock",
    nameKo: "록",
    color: "#FF4444",
    colorSecondary: "#FF7777",
    emoji: "🎸",
    description: "Electric guitars, raw energy, rebellion — the backbone of modern music",
    descriptionKo: "일렉 기타의 포효. 반항의 에너지. 현대 음악의 척추.",
    eraOrigin: "1950s",
    subGenres: ["classic-rock", "alternative", "grunge", "punk", "indie-rock", "post-rock"],
    relatedGenres: ["metal", "indie", "punk"],
    alsoListenTo: ["metal", "alternative", "indie", "punk"],
    characteristics: ["Electric guitar", "Strong rhythm section", "Powerful vocals", "4/4 time"],
    topArtists: ["Led Zeppelin", "The Beatles", "Nirvana", "Radiohead", "Red Hot Chili Peppers"],
    listeners: 1900000000
  },
  {
    id: "metal",
    name: "Metal",
    nameKo: "메탈",
    color: "#9B59B6",
    colorSecondary: "#C39BD3",
    emoji: "🤘",
    description: "Crushing riffs, blast beats, and extreme intensity",
    descriptionKo: "파괴적인 리프, 폭발적인 비트, 극한의 강도. 강철 같은 음악.",
    eraOrigin: "1970s",
    subGenres: ["heavy-metal", "death-metal", "black-metal", "thrash-metal", "prog-metal", "doom-metal"],
    relatedGenres: ["rock", "punk", "electronic"],
    alsoListenTo: ["rock", "classical", "progressive"],
    characteristics: ["Down-tuned guitars", "Double bass drum", "Screaming/growling vocals", "Complex time signatures"],
    topArtists: ["Metallica", "Black Sabbath", "Slayer", "Iron Maiden", "Tool"],
    listeners: 820000000
  },
  {
    id: "electronic",
    name: "Electronic",
    nameKo: "일렉트로닉",
    color: "#00D4FF",
    colorSecondary: "#80EAFF",
    emoji: "🎛️",
    description: "Synthesizers, drum machines, and the art of sonic architecture",
    descriptionKo: "신디사이저와 드럼 머신으로 쌓아올린 소리의 건축. 클럽부터 헤드폰까지.",
    eraOrigin: "1970s",
    subGenres: ["house", "techno", "drum-n-bass", "ambient", "edm", "lo-fi", "synthwave"],
    relatedGenres: ["pop", "hiphop", "r&b"],
    alsoListenTo: ["lo-fi", "ambient", "hiphop", "pop"],
    characteristics: ["Synthesized sounds", "4-on-the-floor beat", "Build and drop", "BPM-driven"],
    topArtists: ["Daft Punk", "Aphex Twin", "The Chemical Brothers", "Caribou", "Four Tet"],
    listeners: 1600000000
  },
  {
    id: "rnb",
    name: "R&B / Soul",
    nameKo: "알앤비 / 소울",
    color: "#E74C3C",
    colorSecondary: "#F1948A",
    emoji: "🎵",
    description: "Silky grooves, emotional depth, rooted in gospel and blues",
    descriptionKo: "복음과 블루스에서 태어난 감성. 부드러운 그루브와 깊은 감정.",
    eraOrigin: "1940s",
    subGenres: ["neo-soul", "contemporary-r&b", "gospel", "funk", "new-jack-swing"],
    relatedGenres: ["pop", "hiphop", "jazz"],
    alsoListenTo: ["hiphop", "jazz", "pop", "soul"],
    characteristics: ["Melismatic vocals", "Groove-based", "Call and response", "Emotional storytelling"],
    topArtists: ["Beyoncé", "Frank Ocean", "SZA", "D'Angelo", "Erykah Badu"],
    listeners: 1400000000
  },
  {
    id: "jazz",
    name: "Jazz",
    nameKo: "재즈",
    color: "#F39C12",
    colorSecondary: "#F8C471",
    emoji: "🎺",
    description: "Improvisation, complex harmony, and the sound of freedom",
    descriptionKo: "즉흥과 자유의 언어. 복잡한 화성과 끝없는 대화.",
    eraOrigin: "1900s",
    subGenres: ["bebop", "cool-jazz", "fusion", "free-jazz", "acid-jazz", "nu-jazz"],
    relatedGenres: ["blues", "r&b", "classical"],
    alsoListenTo: ["blues", "classical", "r&b", "lo-fi"],
    characteristics: ["Improvisation", "Swing feel", "Complex chords", "Call and response"],
    topArtists: ["Miles Davis", "John Coltrane", "Bill Evans", "Thelonious Monk", "Herbie Hancock"],
    listeners: 580000000
  },
  {
    id: "classical",
    name: "Classical",
    nameKo: "클래식",
    color: "#8B7355",
    colorSecondary: "#BDA98C",
    emoji: "🎻",
    description: "Centuries of orchestral mastery — from baroque to contemporary",
    descriptionKo: "수백 년의 오케스트라 유산. 바로크부터 현대까지.",
    eraOrigin: "1600s",
    subGenres: ["baroque", "romantic", "contemporary-classical", "minimalist", "opera", "chamber"],
    relatedGenres: ["jazz", "metal", "ambient"],
    alsoListenTo: ["jazz", "ambient", "film-score"],
    characteristics: ["Orchestral arrangement", "Dynamic range", "Formal structure", "No percussion focus"],
    topArtists: ["Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Frédéric Chopin", "Max Richter"],
    listeners: 450000000
  },
  {
    id: "kpop",
    name: "K-Pop",
    nameKo: "케이팝",
    color: "#FF69B4",
    colorSecondary: "#FFB3D9",
    emoji: "🌸",
    description: "Korean pop phenomenon — perfect choreography meets global production",
    descriptionKo: "완벽한 퍼포먼스와 글로벌 프로덕션이 만난 한국발 팝 혁명.",
    eraOrigin: "1990s",
    subGenres: ["idol-pop", "k-r&b", "k-hip-hop", "k-indie", "bg", "gg"],
    relatedGenres: ["pop", "r&b", "electronic"],
    alsoListenTo: ["pop", "j-pop", "r&b", "electronic"],
    characteristics: ["Group formations", "Synchronized choreo", "Multilingual lyrics", "High production value"],
    topArtists: ["BTS", "BLACKPINK", "aespa", "NewJeans", "SEVENTEEN"],
    listeners: 920000000
  },
  {
    id: "indie",
    name: "Indie",
    nameKo: "인디",
    color: "#95E1D3",
    colorSecondary: "#C8F0EA",
    emoji: "🌿",
    description: "Independent spirit, lo-fi aesthetic, authentic over polished",
    descriptionKo: "독립 정신. 세련됨보다 진정성. 주류가 아닌 자신만의 길.",
    eraOrigin: "1980s",
    subGenres: ["indie-rock", "indie-pop", "dream-pop", "shoegaze", "folk-indie", "bedroom-pop"],
    relatedGenres: ["rock", "pop", "folk"],
    alsoListenTo: ["folk", "alternative", "lo-fi", "rock"],
    characteristics: ["DIY aesthetic", "Introspective lyrics", "Unconventional structure", "Authenticity"],
    topArtists: ["Arctic Monkeys", "Tame Impala", "Sufjan Stevens", "Bon Iver", "Phoebe Bridgers"],
    listeners: 1100000000
  },
  {
    id: "latin",
    name: "Latin",
    nameKo: "라틴",
    color: "#FF6B35",
    colorSecondary: "#FFA07A",
    emoji: "💃",
    description: "Infectious rhythms from salsa to reggaeton — Latin America's gift",
    descriptionKo: "살사부터 레게톤까지. 라틴 아메리카가 세계에 선물한 리듬.",
    eraOrigin: "1950s",
    subGenres: ["reggaeton", "salsa", "bachata", "cumbia", "latin-pop", "trap-latino"],
    relatedGenres: ["pop", "r&b", "electronic"],
    alsoListenTo: ["pop", "r&b", "hiphop"],
    characteristics: ["Clave rhythm", "Call and response", "Dance-focused", "Polyrhythm"],
    topArtists: ["Bad Bunny", "J Balvin", "Rosalía", "Shakira", "Daddy Yankee"],
    listeners: 1300000000
  },
  {
    id: "punk",
    name: "Punk",
    nameKo: "펑크",
    color: "#FF0055",
    colorSecondary: "#FF668A",
    emoji: "⚡",
    description: "Fast, loud, political — 3 chords and the truth",
    descriptionKo: "빠르고 시끄럽고 정치적. 3개의 코드와 진실.",
    eraOrigin: "1970s",
    subGenres: ["hardcore", "pop-punk", "post-punk", "ska-punk", "emo", "anarcho-punk"],
    relatedGenres: ["rock", "metal", "indie"],
    alsoListenTo: ["metal", "rock", "indie", "alternative"],
    characteristics: ["Fast tempo", "Short songs", "Raw production", "Anti-establishment lyrics"],
    topArtists: ["The Clash", "Sex Pistols", "Ramones", "Green Day", "Black Flag"],
    listeners: 480000000
  },
  {
    id: "reggae",
    name: "Reggae",
    nameKo: "레게",
    color: "#27AE60",
    colorSecondary: "#82E0AA",
    emoji: "🌊",
    description: "Jamaican rhythms of peace, love, and resistance",
    descriptionKo: "자메이카에서 온 평화, 사랑, 저항의 리듬.",
    eraOrigin: "1960s",
    subGenres: ["roots-reggae", "dancehall", "dub", "ska", "rocksteady"],
    relatedGenres: ["latin", "r&b", "electronic"],
    alsoListenTo: ["r&b", "latin", "electronic"],
    characteristics: ["Offbeat rhythm", "Bass-heavy", "Positive lyrics", "Ska influence"],
    topArtists: ["Bob Marley", "Peter Tosh", "Damian Marley", "Sean Paul", "Protoje"],
    listeners: 340000000
  },
  {
    id: "blues",
    name: "Blues",
    nameKo: "블루스",
    color: "#3498DB",
    colorSecondary: "#85C1E9",
    emoji: "🎙️",
    description: "The root of all modern music — twelve bars of pure feeling",
    descriptionKo: "모든 현대 음악의 뿌리. 12마디 안에 담긴 순수한 감정.",
    eraOrigin: "1900s",
    subGenres: ["delta-blues", "chicago-blues", "electric-blues", "rhythm-and-blues", "soul-blues"],
    relatedGenres: ["jazz", "rock", "r&b"],
    alsoListenTo: ["jazz", "rock", "r&b", "soul"],
    characteristics: ["12-bar structure", "Blue notes", "Call and response", "Guitar-centric"],
    topArtists: ["B.B. King", "Robert Johnson", "Muddy Waters", "Howlin Wolf", "John Lee Hooker"],
    listeners: 280000000
  },
  {
    id: "country",
    name: "Country",
    nameKo: "컨트리",
    color: "#D4A017",
    colorSecondary: "#F0C040",
    emoji: "🤠",
    description: "Stories of heartbreak, highways, and home — from Nashville to the world",
    descriptionKo: "이별, 도로, 고향. 내슈빌에서 세계로 뻗은 이야기 음악.",
    eraOrigin: "1920s",
    subGenres: ["classic-country", "outlaw-country", "country-pop", "bluegrass", "country-rock", "americana"],
    relatedGenres: ["folk", "rock", "blues"],
    alsoListenTo: ["folk", "indie", "rock", "blues"],
    characteristics: ["Storytelling lyrics", "Acoustic guitar", "Twang", "Steel guitar", "Narrative structure"],
    topArtists: ["Johnny Cash", "Dolly Parton", "Hank Williams", "Morgan Wallen", "Zach Bryan"],
    listeners: 760000000
  }
];
```

---

## 6. 곡 데이터 정의 (Top 30 Mock Songs)

```javascript
const SONGS = [
  { id: 1, rank: 1, title: "Flowers", artist: "Miley Cyrus", genre: "pop", year: 2023, popularity: 98, duration: "3:21", streamCount: 2100000000, rankChange: 0 },
  { id: 2, rank: 2, title: "As It Was", artist: "Harry Styles", genre: "pop", year: 2022, popularity: 97, duration: "2:37", streamCount: 2800000000, rankChange: -1 },
  { id: 3, rank: 3, title: "Blinding Lights", artist: "The Weeknd", genre: "pop", year: 2019, popularity: 96, duration: "3:20", streamCount: 3800000000, rankChange: 1 },
  { id: 4, rank: 4, title: "HUMBLE.", artist: "Kendrick Lamar", genre: "hiphop", year: 2017, popularity: 95, duration: "2:57", streamCount: 1900000000, rankChange: 2 },
  { id: 5, rank: 5, title: "God's Plan", artist: "Drake", genre: "hiphop", year: 2018, popularity: 94, duration: "3:19", streamCount: 2200000000, rankChange: -1 },
  { id: 6, rank: 6, title: "STAY", artist: "The Kid LAROI & Justin Bieber", genre: "pop", year: 2021, popularity: 93, duration: "2:21", streamCount: 2500000000, rankChange: 3 },
  { id: 7, rank: 7, title: "Dynamite", artist: "BTS", genre: "kpop", year: 2020, popularity: 92, duration: "3:19", streamCount: 1700000000, rankChange: 0 },
  { id: 8, rank: 8, title: "drivers license", artist: "Olivia Rodrigo", genre: "pop", year: 2021, popularity: 91, duration: "4:02", streamCount: 1600000000, rankChange: -2 },
  { id: 9, rank: 9, title: "Levitating", artist: "Dua Lipa", genre: "pop", year: 2020, popularity: 90, duration: "3:23", streamCount: 1800000000, rankChange: 1 },
  { id: 10, rank: 10, title: "SICKO MODE", artist: "Travis Scott", genre: "hiphop", year: 2018, popularity: 89, duration: "5:12", streamCount: 1500000000, rankChange: 0 },
  { id: 11, rank: 11, title: "Bohemian Rhapsody", artist: "Queen", genre: "rock", year: 1975, popularity: 95, duration: "5:55", streamCount: 2400000000, rankChange: 0 },
  { id: 12, rank: 12, title: "Hotel California", artist: "Eagles", genre: "rock", year: 1977, popularity: 94, duration: "6:30", streamCount: 1300000000, rankChange: 1 },
  { id: 13, rank: 13, title: "Enter Sandman", artist: "Metallica", genre: "metal", year: 1991, popularity: 92, duration: "5:31", streamCount: 900000000, rankChange: -1 },
  { id: 14, rank: 14, title: "One More Time", artist: "Daft Punk", genre: "electronic", year: 2000, popularity: 90, duration: "5:20", streamCount: 1200000000, rankChange: 2 },
  { id: 15, rank: 15, title: "Lose Yourself", artist: "Eminem", genre: "hiphop", year: 2002, popularity: 93, duration: "5:26", streamCount: 1800000000, rankChange: 0 },
  { id: 16, rank: 16, title: "Pink + White", artist: "Frank Ocean", genre: "rnb", year: 2016, popularity: 89, duration: "3:05", streamCount: 800000000, rankChange: 3 },
  { id: 17, rank: 17, title: "All of Me", artist: "John Legend", genre: "rnb", year: 2013, popularity: 91, duration: "4:29", streamCount: 2100000000, rankChange: 0 },
  { id: 18, rank: 18, title: "Take Five", artist: "Dave Brubeck", genre: "jazz", year: 1959, popularity: 88, duration: "5:24", streamCount: 400000000, rankChange: 1 },
  { id: 19, rank: 19, title: "Beethoven - Moonlight Sonata", artist: "Ludwig van Beethoven", genre: "classical", year: 1801, popularity: 87, duration: "15:00", streamCount: 350000000, rankChange: 0 },
  { id: 20, rank: 20, title: "Butter", artist: "BTS", genre: "kpop", year: 2021, popularity: 90, duration: "2:44", streamCount: 1400000000, rankChange: -2 },
  { id: 21, rank: 21, title: "Espresso", artist: "Sabrina Carpenter", genre: "pop", year: 2024, popularity: 96, duration: "2:55", streamCount: 1600000000, rankChange: 5 },
  { id: 22, rank: 22, title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", genre: "pop", year: 2024, popularity: 95, duration: "4:11", streamCount: 1500000000, rankChange: 4 },
  { id: 23, rank: 23, title: "APT.", artist: "ROSÉ & Bruno Mars", genre: "kpop", year: 2024, popularity: 94, duration: "2:51", streamCount: 1300000000, rankChange: 6 },
  { id: 24, rank: 24, title: "Like Crazy", artist: "Jimin", genre: "kpop", year: 2023, popularity: 88, duration: "3:27", streamCount: 900000000, rankChange: -1 },
  { id: 25, rank: 25, title: "Vampire", artist: "Olivia Rodrigo", genre: "pop", year: 2023, popularity: 91, duration: "3:39", streamCount: 1200000000, rankChange: 0 },
  { id: 26, rank: 26, title: "Rich Flex", artist: "Drake & 21 Savage", genre: "hiphop", year: 2022, popularity: 89, duration: "3:58", streamCount: 1100000000, rankChange: -3 },
  { id: 27, rank: 27, title: "Numb / Encore", artist: "Jay-Z & Linkin Park", genre: "rock", year: 2004, popularity: 87, duration: "3:24", streamCount: 750000000, rankChange: 1 },
  { id: 28, rank: 28, title: "Smells Like Teen Spirit", artist: "Nirvana", genre: "rock", year: 1991, popularity: 96, duration: "5:01", streamCount: 1500000000, rankChange: 0 },
  { id: 29, rank: 29, title: "Con Calma", artist: "Daddy Yankee & Snow", genre: "latin", year: 2019, popularity: 88, duration: "3:15", streamCount: 1900000000, rankChange: -2 },
  { id: 30, rank: 30, title: "Tití Me Preguntó", artist: "Bad Bunny", genre: "latin", year: 2022, popularity: 90, duration: "3:57", streamCount: 1000000000, rankChange: 2 }
];
```

---

## 7. 시대별 데이터 (Era Timeline)

```javascript
const ERAS = [
  {
    decade: "1950s",
    title: "Rock & Roll 혁명",
    titleEn: "The Rock & Roll Revolution",
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD700, #FF8C00)",
    dominantGenres: ["rock", "blues", "country", "jazz"],
    keyArtists: ["Elvis Presley", "Chuck Berry", "Little Richard", "Ray Charles", "Buddy Holly"],
    description: "로큰롤이 블루스와 컨트리의 혼합으로 탄생. 젊은 세대의 반란이 음악을 영원히 바꿨다.",
    descriptionEn: "Rock and roll emerged from the fusion of blues and country. Youth rebellion changed music forever.",
    culturalContext: "Post-WWII, baby boom, television era"
  },
  {
    decade: "1960s",
    title: "사이키델릭 & 무브먼트",
    titleEn: "Psychedelic Era & Social Movement",
    color: "#FF6B9D",
    gradient: "linear-gradient(135deg, #FF6B9D, #9B59B6)",
    dominantGenres: ["rock", "pop", "blues", "folk"],
    keyArtists: ["The Beatles", "The Rolling Stones", "Jimi Hendrix", "Bob Dylan", "Janis Joplin"],
    description: "영국 인베이전, 히피 운동, 반전 운동. 음악이 사회 변혁의 언어가 됐다.",
    descriptionEn: "British Invasion, hippie movement, anti-war protests. Music became the language of social change.",
    culturalContext: "Vietnam War, civil rights movement, moon landing"
  },
  {
    decade: "1970s",
    title: "장르의 폭발",
    titleEn: "Genre Explosion",
    color: "#FF8C00",
    gradient: "linear-gradient(135deg, #FF8C00, #FF4444)",
    dominantGenres: ["rock", "metal", "punk", "disco", "r&b", "reggae", "hiphop"],
    keyArtists: ["Led Zeppelin", "Black Sabbath", "The Clash", "Donna Summer", "Bob Marley", "DJ Kool Herc"],
    description: "헤비메탈, 펑크, 디스코, 힙합의 탄생. 하나의 '음악'이 수십 개의 문화권으로 분화.",
    descriptionEn: "Birth of heavy metal, punk, disco, hip-hop. Music fractured into dozens of distinct cultures.",
    culturalContext: "Oil crisis, counterculture, NYC urban decline, Bronx block parties"
  },
  {
    decade: "1980s",
    title: "신스팝 & MTV 시대",
    titleEn: "Synth Revolution & MTV Era",
    color: "#9B59B6",
    gradient: "linear-gradient(135deg, #9B59B6, #3498DB)",
    dominantGenres: ["pop", "rock", "metal", "electronic", "hiphop"],
    keyArtists: ["Michael Jackson", "Madonna", "Prince", "Metallica", "Run-DMC", "Depeche Mode"],
    description: "MTV의 등장으로 시각 아이덴티티가 필수가 됐다. 신디사이저가 음악을 재정의했고, 힙합이 뿌리를 내렸다.",
    descriptionEn: "MTV made visual identity essential. Synthesizers redefined sound, hip-hop took root.",
    culturalContext: "Cold War, Reagan era, crack epidemic, AIDS crisis"
  },
  {
    decade: "1990s",
    title: "그런지 & 황금기",
    titleEn: "Grunge, Golden Ages",
    color: "#27AE60",
    gradient: "linear-gradient(135deg, #27AE60, #F39C12)",
    dominantGenres: ["rock", "hiphop", "r&b", "pop", "electronic"],
    keyArtists: ["Nirvana", "Tupac", "Biggie", "Mariah Carey", "Radiohead", "Daft Punk"],
    description: "그런지가 헤어밴드를 몰아냈고, 힙합 황금기가 열렸다. R&B는 최고의 정점을 맞았다.",
    descriptionEn: "Grunge killed hair metal, hip-hop's golden age arrived. R&B reached its commercial peak.",
    culturalContext: "Internet birth, globalization, cassette → CD transition"
  },
  {
    decade: "2000s",
    title: "디지털 혁명",
    titleEn: "Digital Revolution",
    color: "#3498DB",
    gradient: "linear-gradient(135deg, #3498DB, #00D4FF)",
    dominantGenres: ["pop", "hiphop", "rock", "electronic", "rnb"],
    keyArtists: ["Eminem", "Beyoncé", "Linkin Park", "Kanye West", "Amy Winehouse", "The Strokes"],
    description: "냅스터와 아이팟이 음악 산업을 뒤집었다. 팝펑크와 이모가 10대를 사로잡았다.",
    descriptionEn: "Napster and iPod disrupted the industry. Pop-punk and emo captured a generation.",
    culturalContext: "9/11, Iraq War, social media birth, piracy crisis"
  },
  {
    decade: "2010s",
    title: "스트리밍 & K-Pop 글로벌화",
    titleEn: "Streaming Era & K-Pop Goes Global",
    color: "#FF69B4",
    gradient: "linear-gradient(135deg, #FF69B4, #F7C948)",
    dominantGenres: ["pop", "hiphop", "electronic", "kpop", "indie"],
    keyArtists: ["Drake", "Taylor Swift", "BTS", "Kendrick Lamar", "Adele", "Frank Ocean"],
    description: "스포티파이가 음악 소비를 바꿨다. K-Pop이 글로벌 현상이 됐다. 트랩이 힙합을 접수했다.",
    descriptionEn: "Spotify transformed consumption. K-Pop became a global phenomenon. Trap took over hip-hop.",
    culturalContext: "Smartphone dominance, social media virality, streaming wars"
  },
  {
    decade: "2020s",
    title: "하이퍼팝 & 장르의 해체",
    titleEn: "Hyperpop & Genre Dissolution",
    color: "#95E1D3",
    gradient: "linear-gradient(135deg, #95E1D3, #9B59B6)",
    dominantGenres: ["pop", "hiphop", "kpop", "electronic", "indie"],
    keyArtists: ["Olivia Rodrigo", "Bad Bunny", "Doja Cat", "Tyler the Creator", "NewJeans", "Sabrina Carpenter"],
    description: "장르 경계가 무너졌다. 아프로비츠, 하이퍼팝, 베드룸팝이 부상. TikTok이 새로운 차트가 됐다.",
    descriptionEn: "Genre boundaries dissolved. Afrobeats, hyperpop, bedroom pop rose. TikTok became the new chart.",
    culturalContext: "COVID-19, home studios, TikTok virality, global music democratization"
  }
];
```

---

## 8. 페이지별 기능 명세

### 8.1 홈 (#home)

**섹션 구성:**
1. **Hero Banner**
   - 배경: `#121212` + 장르 색상 gradient blur (animated)
   - 헤드카피: "음악의 모든 장르를 탐험하다"
   - 서브카피: "Explore Every Genre · Discover Your Taste"
   - CTA 버튼: "장르 탐색 시작 →" (Spotify Green, pill)

2. **지금 트렌딩 (Trending Now)**
   - 상위 5곡을 가로 스크롤 카드로 표시
   - 각 카드: 앨범아트(placeholder gradient) + 곡명 + 아티스트 + 장르 태그 + 재생 버튼

3. **장르 쇼케이스 (Featured Genres)**
   - 6개 장르 그리드 (2열 × 3행)
   - 각 카드: 장르 색상 그라디언트 배경 + 이름 + 이모지 + 대표 아티스트 3명

4. **이번 주 발견 (Weekly Discovery)**
   - "이 장르 듣는 사람이 듣는 다른 장르" 교차 추천
   - e.g. "팝을 좋아한다면 → 인디, 알앤비, K-Pop"

5. **시대별 스냅샷 (Era Snapshot)**
   - 현재 연도 기준 가장 가까운 2개 시대 카드
   - "2020s 지금의 음악" + "1990s 90년대 황금기"

---

### 8.2 장르 탐색 (#genres)

**레이아웃:**
- 상단 필터 바: 전체 / 시대순 / 인기순 / 알파벳순
- 3열 그리드 (모바일: 2열)

**장르 카드 (GenreCard):**
```
┌─────────────────────────────────┐
│  [장르 색상 그라디언트 배경]      │
│  🎸  Rock / 록                  │
│                                  │
│  Classic rock · Alternative ·   │
│  Grunge · Punk                  │
│                                  │
│  ████████████░░░░  1.9B 청취자  │
│         [탐색하기 →]             │
└─────────────────────────────────┘
```

- Hover: 카드 살짝 위로 (translateY -4px), 그림자 강화
- Click: `#genre/:id` 로 이동

---

### 8.3 장르 상세 (#genre/:id)

**섹션 구성:**

1. **Hero Section**
   - 전체 너비, 높이 300px
   - 배경: 장르 색상 → `#121212` 그라디언트
   - 장르명 (대형, 40px)
   - 설명 (한/영)
   - 특징 태그들 (Characteristics pills)
   - "탄생 시대: 1970s" 배지

2. **Top Songs in Genre**
   - 테이블 형식 (rank, 제목, 아티스트, 연도, 재생 수, 재생 버튼)
   - 상위 10곡

3. **서브장르 (Sub-Genres)**
   - 가로 스크롤 pill 태그들
   - 클릭 시 해당 서브장르 필터

4. **"이 장르를 듣는 사람은 이것도 들어요"**
   - 연관 장르 3-4개를 카드로 표시
   - 화살표 아이콘과 함께 "Also listen to:"

5. **대표 아티스트**
   - 원형 아바타(이니셜 placeholder) + 이름 그리드

6. **시대별 역사 (In History)**
   - 이 장르가 각 시대에 어떻게 발전했는지 타임라인 미니 버전

---

### 8.4 차트 100 (#chart)

**레이아웃:**
- 상단: 필터 바 (All / 장르별 / 연도별)
- 정렬: 현재 순위 기준
- 표시 항목: 순위 | 순위 변동 | 앨범아트 | 제목 + 아티스트 | 장르 태그 | 연도 | 재생 수 | 재생 버튼

**순위 변동 표시:**
- ▲ 녹색 + 숫자: 상승
- ▼ 빨간 + 숫자: 하락
- — 회색: 변동 없음
- NEW 배지: 신규 진입

**차트 행 (ChartRow):**
```
#01  ▲2  [🎵]  Blinding Lights - The Weeknd    [pop]  2019  3.8B  ▶
```

---

### 8.5 시대별 역사 (#timeline)

**레이아웃:**
- 수평 스크롤 타임라인 (데스크톱)
- 수직 스크롤 (모바일)

**각 시대 카드:**
- 10년 단위, 고유 그라디언트 색상
- 클릭 시 확장 (accordion 효과)
- 확장 시: 지배 장르 태그, 주요 아티스트 목록, 문화적 컨텍스트

**연결선:**
- 각 시대를 잇는 선 위에 "장르의 탄생/변형" 표시
- e.g. 1970s → 1980s 선에 "힙합 탄생 🎤"

---

### 8.6 장르 검색 (#search)

**기능:**
1. **텍스트 검색**: 곡명/아티스트명 입력 → 해당 장르 태그 표시
2. **장르 식별**: 음악 특징 설명 입력 → Mock AI 응답으로 장르 추정
3. **장르 필터**: 장르 선택 → 해당 장르 곡 목록

**검색 결과:**
- 검색어와 일치하는 곡 카드 표시
- 각 결과에 장르 배지, 연도, 아티스트 표시

**Mock AI 장르 식별 (hardcoded responses):**
```
"빠르고 시끄러운 기타" → 록, 메탈, 펑크 추천
"느리고 감성적인" → 인디, 재즈, 소울 추천
"반복적인 비트" → 일렉트로닉, 힙합 추천
"완벽한 퍼포먼스" → K-Pop 추천
```

---

## 9. Now Playing Bar

항상 하단 고정. 90px 높이.

```
┌─────────────────────────────────────────────────────────────────┐
│  [🎵]  Blinding Lights · The Weeknd    [pop]      ◀  ▶  ⏸  🔊  │
│  ──────────────████████████░░░░░░░░────────  2:14 / 3:20       │
└─────────────────────────────────────────────────────────────────┘
```

- 좌: 앨범아트 + 곡명 + 아티스트 + 장르 태그
- 중: 이전/재생·정지/다음 버튼 + 프로그레스 바 + 시간
- 우: 볼륨 (모바일에서는 중앙만 표시)

**동작:**
- 어떤 곡이든 클릭하면 Now Playing에 표시
- 프로그레스 바는 mock 타이머로 동작 (JS `setInterval`)
- 재생/정지 토글, 곡 전환 기능

---

## 10. 컴포넌트 목록 (CSS 클래스명)

```
Layout:
  .app-container       — flex, full height
  .sidebar             — fixed left, 240px
  .main-content        — flex-1, overflow-y scroll
  .now-playing-bar     — fixed bottom, 90px

Navigation:
  .nav-logo            — MusicLens 로고
  .nav-link            — 사이드바 링크
  .nav-link.active     — 활성 상태 (green)
  .mobile-nav          — 모바일 하단 바

Cards:
  .genre-card          — 장르 카드
  .song-card           — 가로형 곡 카드
  .chart-row           — 차트 행
  .era-card            — 시대 카드

Buttons:
  .btn-primary         — 초록 pill 버튼
  .btn-secondary       — 어두운 pill 버튼
  .btn-outlined        — 아웃라인 pill 버튼
  .btn-play            — 원형 재생 버튼
  .btn-icon            — 아이콘 전용 버튼

Tags:
  .genre-tag           — 장르 배지 (장르 색상)
  .era-badge           — 시대 배지
  .rank-change         — 순위 변동 표시

Sections:
  .section-title       — 섹션 제목 24px bold
  .section-subtitle    — 섹션 부제 14px #b3b3b3
  .grid-3              — 3열 그리드
  .grid-5              — 5열 그리드
  .horizontal-scroll   — 가로 스크롤 컨테이너
```

---

## 11. 애니메이션 & 인터랙션

```css
/* Hover transitions — 모든 카드/버튼 */
transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.15s ease;

/* 카드 hover */
.genre-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-heavy); }

/* 재생 버튼 hover */
.btn-play:hover { transform: scale(1.05); background: #1ed760; }

/* 페이드인 (뷰 전환) */
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.view { animation: fadeIn 0.25s ease; }

/* 스켈레톤 로딩 (옵션) */
@keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
.skeleton { animation: shimmer 1.5s ease infinite; background: #252525; }
```

---

## 12. 라우팅 구현 (Hash SPA)

```javascript
const routes = {
  '#home': renderHome,
  '#chart': renderChart,
  '#genres': renderGenres,
  '#search': renderSearch,
  '#timeline': renderTimeline,
};

// Genre 동적 라우트
function handleRoute() {
  const hash = location.hash || '#home';
  if (hash.startsWith('#genre/')) {
    const id = hash.replace('#genre/', '');
    renderGenreDetail(id);
    return;
  }
  const render = routes[hash];
  if (render) render();
  else renderHome();
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);
```

---

## 13. Spotify 디자인 적용 체크리스트 (Opus 확인 필수)

- [ ] 배경 최소 3단계 (#121212 / #181818 / #1f1f1f)
- [ ] Spotify Green(#1ed760)은 재생 버튼, 활성 네비, CTA에만 사용
- [ ] 모든 버튼은 pill(9999px) 또는 circle(50%) — 사각형 버튼 없음
- [ ] 버튼 텍스트: uppercase + letter-spacing 1.4px~2px
- [ ] 그림자: hover/elevated 요소에 rgba(0,0,0,0.3~0.5) 8px+ blur
- [ ] 폰트: DM Sans 또는 Inter (Google Fonts, Circular 대체)
- [ ] 앨범아트 자리: 장르 색상 gradient placeholder (이미지 없음)
- [ ] 카드 radius: 8px
- [ ] 입력창: pill shape, inset border
- [ ] 텍스트: #fff (primary) / #b3b3b3 (secondary) / #7c7c7c (muted)

---

## 14. 한/영 처리 방법

```javascript
// 모든 텍스트 요소에 data-ko / data-en 속성 사용
// 기본 언어: 한국어
// 우측 상단 KO / EN 토글 버튼

let currentLang = 'ko'; // 기본 한국어

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-ko]').forEach(el => {
    el.textContent = lang === 'ko' ? el.dataset.ko : el.dataset.en;
  });
}

// HTML 예시
// <h1 data-ko="음악의 모든 장르" data-en="Explore Every Genre"></h1>
```

---

## 15. 파일 최종 구조

```
index.html (단일 파일)
├── <head>
│   ├── Google Fonts: DM Sans (400, 600, 700)
│   └── <style> — 모든 CSS (약 800~1200줄)
├── <body>
│   ├── .app-container
│   │   ├── .sidebar (Navigation)
│   │   └── .main-content (뷰 렌더 영역)
│   └── .now-playing-bar
└── <script>
    ├── GENRES 데이터
    ├── SONGS 데이터
    ├── ERAS 데이터
    ├── 라우터
    ├── 렌더 함수들 (renderHome, renderGenres, renderGenreDetail, renderChart, renderTimeline, renderSearch)
    ├── NowPlaying 컨트롤러
    └── 언어 토글
```

---

## 16. Opus 제작 지시사항

1. **위 명세를 완전히 구현**한 `index.html` 단일 파일 생성
2. **Mock 데이터는 Section 5~7 그대로 사용** — 추가/수정 자유
3. **Spotify 디자인 토큰(Section 4)을 CSS 변수로 선언**, 모든 스타일에 적용
4. **Section 13 체크리스트 100% 준수**
5. **반응형**: 768px 이하 모바일 레이아웃 (사이드바 숨김, 하단 네비)
6. **NowPlaying Bar**: setInterval로 프로그레스 바 실제로 움직이게 구현
7. **장르 상세 페이지**: 모든 15개 장르에 대해 동작 (데이터 기반 dynamic rendering)
8. **장르 색상 Gradient Placeholder**: 실제 앨범아트 대신 각 장르의 color → colorSecondary gradient 사용
9. **언어 토글**: 우측 상단 KO/EN 버튼 — 모든 명시적 텍스트 전환
10. **SVG 아이콘**: 외부 라이브러리 없이 인라인 SVG로 구현 (플레이, 정지, 이전/다음, 볼륨, 검색, 홈, 차트, 시계 등)

---

*이 문서로 Opus에게 제작을 위임하세요. 추가 질문 없이 바로 빌드 가능한 수준으로 작성되었습니다.*
