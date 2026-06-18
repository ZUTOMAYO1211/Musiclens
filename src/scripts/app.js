

let currentLang = 'ko';
const genreById = id => GENRES.find(g => g.id === id);
const t = (ko, en, ja) => {
  if (currentLang === 'ko') return ko;
  if (currentLang === 'ja') return ja || en;
  return en;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===================== ALBUM ART CACHE & FETCHER ===================== */
const albumArtCache = JSON.parse(localStorage.getItem('ml_album_art_cache') || '{}');
const audioPreviewCache = JSON.parse(localStorage.getItem('ml_audio_preview_cache') || '{}');
let currentAudio = null;

function saveAlbumArtCache() {
  localStorage.setItem('ml_album_art_cache', JSON.stringify(albumArtCache));
}

const pendingArtRequests = {};
const artFetchQueue = [];
let isFetchingArt = false;
const playIntents = {}; // Track if a user explicitly clicked play

function processArtQueue() {
  if (isFetchingArt || artFetchQueue.length === 0) return;
  isFetchingArt = true;
  const task = artFetchQueue.shift();
  task().finally(() => {
    setTimeout(() => {
      isFetchingArt = false;
      processArtQueue();
    }, 50); // Reduced delay to 50ms (20 req/sec) for faster loading
  });
}

function fetchAndCacheAlbumArt(song, playImmediately = false) {
  if (albumArtCache[song.id] && audioPreviewCache[song.id]) {
    if (playImmediately) {
      playAudio(audioPreviewCache[song.id]);
    }
    return;
  }
  
  if (playImmediately) {
    playIntents[song.id] = true;
  }

  if (pendingArtRequests[song.id]) return;
  pendingArtRequests[song.id] = true;
  
  artFetchQueue.push(() => {
    const query = encodeURIComponent(`${song.artist} ${song.title}`);
    return fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const url = result.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg');
          albumArtCache[song.id] = url;
          saveAlbumArtCache();
          updateArtworkElements(song.id, url);
          
          if (result.previewUrl) {
            audioPreviewCache[song.id] = result.previewUrl;
            localStorage.setItem('ml_audio_preview_cache', JSON.stringify(audioPreviewCache));
            // Check playIntents to see if the user clicked play while it was in queue
            if ((playImmediately || playIntents[song.id]) && npState.song && npState.song.id === song.id && npState.playing) {
              playAudio(result.previewUrl);
            }
          }
        }
      })
      .catch(err => console.error(`Failed to fetch album art/preview for ${song.title}:`, err))
      .finally(() => {
        delete pendingArtRequests[song.id];
        delete playIntents[song.id];
      });
  });
  
  processArtQueue();
}

function updateArtworkElements(songId, url) {
  document.querySelectorAll(`.art-thumb[data-art-song-id="${songId}"]`).forEach(el => {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    const span = el.querySelector('span');
    if (span) span.style.display = 'none';
  });
  document.querySelectorAll(`.va-art-wrap[data-art-song-id="${songId}"]`).forEach(el => {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    const span = el.querySelector('span');
    if (span) span.style.display = 'none';
  });
}

function fmtListeners(n){
  if(n >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,'') + 'B';
  if(n >= 1e6) return (n/1e6).toFixed(0) + 'M';
  return n.toLocaleString();
}
function durToSec(d){const [m,s]=d.split(':').map(Number);return m*60+s;}
function secToDur(sec){const m=Math.floor(sec/60);const s=Math.floor(sec%60);return m+':'+String(s).padStart(2,'0');}

/* gradient placeholder — swappable with real album art later */
function artGradient(genreId){
  const g = genreById(genreId);
  if(!g) return 'linear-gradient(135deg,#333,#555)';
  return `linear-gradient(135deg,${g.color},${g.colorSecondary})`;
}
function artHTML(song, extraClass=''){
  const g = genreById(song.genre);
  const cachedUrl = albumArtCache[song.id];
  const styleAttr = cachedUrl 
    ? `background-image: url('${cachedUrl}'); background-size: cover; background-position: center;` 
    : `background: ${artGradient(song.genre)};`;
  
  if (!cachedUrl) {
    fetchAndCacheAlbumArt(song);
  }
  
  return `<div class="art-thumb ${extraClass}" data-art-song-id="${song.id}" style="${styleAttr}">
    <span style="opacity:.55; ${cachedUrl ? 'display:none;' : ''}">${g?g.emoji:'●'}</span>
  </div>`;
}
function genreTagHTML(genreId){
  const g = genreById(genreId);
  if(!g) return '';
  return `<span class="genre-tag"><span class="gt-dot" style="background:${g.color}"></span>${t(g.nameKo,g.name)}</span>`;
}
const initials = name => name.split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
function avatarColor(name){
  let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
  return `hsl(0,0%,${25 + Math.abs(h)%35}%)`;
}

/* ===================== SVG ICONS ===================== */
const ICON = {
  home:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  chart:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  genres:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  timeline:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  search:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  taste:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/></svg>',
  play:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  prev:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
  next:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-10.5 12l8.5-6-8.5-6z"/></svg>',
  volume:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  close:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};

/* ===================== ROUTER ===================== */
const routes = {
  '#home': renderHome, '#genres': renderGenres,
  '#search': renderSearch, '#timeline': renderTimeline, '#taste': renderTaste,
};
function handleRoute(){
  const hash = location.hash || '#home';
  if (hash !== '#search' && typeof searchQuery !== 'undefined') {
    searchQuery = '';
  }
  const root = document.getElementById('view-root');
  root.scrollTop = 0;
  document.getElementById('main-content').scrollTop = 0;
  let view = hash;
  if(hash.startsWith('#genre/')){
    renderGenreDetail(hash.replace('#genre/',''));
    view = '#genres';
  } else if(hash.startsWith('#artist/')){
    renderArtistDetail(decodeURIComponent(hash.replace('#artist/','')));
    view = '';
  } else {
    (routes[hash] || renderHome)();
  }
  updateActiveNav(view);
}
window.addEventListener('hashchange', handleRoute);

/* ===================== NAV ===================== */
const NAV_ITEMS = [
  {hash:'#genres',ko:'장르 탐색',en:'Genres',ja:'ジャンル探索',ic:'genres'},
  {hash:'#timeline',ko:'시대별 역사',en:'Timeline',ja:'年代別の歴史',ic:'timeline'},
  {hash:'#taste',ko:'취향 DNA',en:'Taste DNA',ja:'好みDNA',ic:'taste'},
  {hash:'#search',ko:'바이브 검색',en:'Vibe Search',ja:'バイブ検索',ic:'search'},
];
function renderNav(){
  document.getElementById('header-nav').innerHTML = NAV_ITEMS.map(n =>
    `<a class="nav-link" href="${n.hash}" data-hash="${n.hash}">
      <span class="nav-ic">${ICON[n.ic]}</span>
      <span data-ko="${n.ko}" data-en="${n.en}" data-ja="${n.ja}">${t(n.ko, n.en, n.ja)}</span>
    </a>`).join('');
  document.getElementById('mobile-nav').innerHTML = NAV_ITEMS.map(n =>
    `<a href="${n.hash}" data-hash="${n.hash}">${ICON[n.ic]}<span data-ko="${n.ko}" data-en="${n.en}" data-ja="${n.ja}">${t(n.ko, n.en, n.ja)}</span></a>`).join('');
}
function updateActiveNav(hash){
  document.querySelectorAll('.nav-link, .mobile-nav a').forEach(el => {
    el.classList.toggle('active', el.dataset.hash === hash);
  });
}

/* ===================== LANGUAGE ===================== */
function setLanguage(lang){
  currentLang = lang;
  document.getElementById('lang-ko').classList.toggle('active', lang==='ko');
  document.getElementById('lang-en').classList.toggle('active', lang==='en');
  document.getElementById('lang-ja').classList.toggle('active', lang==='ja');
  document.documentElement.lang = lang;
  applyLang();
  handleRoute();
}
function applyLang(){
  document.querySelectorAll('[data-ko]').forEach(el => {
    if (currentLang === 'ko') {
      el.textContent = el.dataset.ko;
    } else if (currentLang === 'ja') {
      el.textContent = el.dataset.ja || el.dataset.en;
    } else {
      el.textContent = el.dataset.en;
    }
  });
}

/* ===================== RENDER: HOME ===================== */
function songCardHTML(song){
  return `<div class="song-card" onclick="playSong(${song.id})">
    ${artHTML(song)}
    <div class="sc-play"><button class="btn-play sm" onclick="event.stopPropagation();playSong(${song.id})">${ICON.play}</button></div>
    <div class="sc-title">${esc(song.title)}</div>
    <div class="sc-artist"><a href="#artist/${encodeURIComponent(song.artist)}" onclick="event.stopPropagation()" style="color:inherit; text-decoration:none; cursor:pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(song.artist)}</a></div>
    <div class="sc-meta">${genreTagHTML(song.genre)}</div>
  </div>`;
}
function featuredGenreCardHTML(g){
  return `<a class="genre-card" href="#genre/${g.id}" style="background:linear-gradient(150deg,${g.color},${g.colorSecondary})">
    <div class="gc-emoji">${g.emoji}</div>
    <div>
      <div class="gc-name">${t(g.nameKo,g.name,g.nameJa)}<small>${g.id==='rnb'?'R&B / Soul':esc(g.name)}</small></div>
      <div class="gc-artists">${g.topArtists.slice(0,3).map(esc).join(' · ')}</div>
    </div>
    <div class="gc-foot">
      <div class="listeners-bar">
        <div class="lb-label">${fmtListeners(g.listeners)} ${t('청취자','listeners','リスナー')}</div>
      </div>
      <span class="gc-go">${t('탐색','Explore','探索')} →</span>
    </div>
  </a>`;
}
function renderHome(){
  const trending = [...SONGS].sort((a,b)=>b.popularity-a.popularity).slice(0,8);
  const featured = ['pop','hiphop','rock','electronic','kpop','jazz'].map(genreById);
  // Dynamically select a genre daily for Weekly Discovery
  const discoverySeed = (new Date().getDate() + new Date().getMonth()) % GENRES.length;
  const popG = GENRES[discoverySeed] || GENRES[0];
  const eras = [ERAS[ERAS.length-1], ERAS[4]];
  const html = `<div class="view">
    <section class="hero">
      <div class="hero-bg"><div class="hero-blob b1"></div><div class="hero-blob b2"></div><div class="hero-blob b3"></div></div>
      <h1 data-ko="음악의 모든 장르를 탐험하다" data-en="Explore Every Genre" data-ja="音楽のすべてのジャンルを探索する">${t('음악의 모든 장르를 탐험하다','Explore Every Genre','音楽のすべてのジャンルを探索する')}</h1>
      <p data-ko="음악의 모든 장르를 탐험하다 · 당신의 취향을 발견하세요" data-en="Explore Every Genre · Discover Your Taste" data-ja="すべてのジャンルを探索 · あなたの好みの発見">${t('음악의 모든 장르를 탐험하다 · 당신의 취향을 발견하세요','Explore Every Genre · Discover Your Taste','すべてのジャンルを探索 · あなたの好みの発見')}</p>
      <a class="btn-primary" href="#genres">${t('장르 탐색 시작','Start Exploring','ジャンル探索を始める')} →</a>
    </section>
 
    <section class="section">
      <div class="section-head"><div><div class="section-title">${t('지금 트렌딩','Trending Now','今トレンド')}</div><div class="section-subtitle">${t('가장 뜨거운 곡들','The hottest tracks right now','今最もホットな楽曲')}</div></div><a class="see-all" href="#genres">${t('전체 보기','See all','すべて見る')}</a></div>
      <div class="horizontal-scroll">${trending.map(songCardHTML).join('')}</div>
    </section>
 
    <section class="section">
      <div class="section-head"><div><div class="section-title">${t('장르 쇼케이스','Featured Genres','注目のジャンル')}</div><div class="section-subtitle">${t('탐험할 준비가 된 사운드',"Sounds ready to explore",'探索する準備ができたサウンド')}</div></div><a class="see-all" href="#genres">${t('전체 보기','See all','すべて見る')}</a></div>
      <div class="grid-3">${featured.map(featuredGenreCardHTML).join('')}</div>
    </section>
 
    <section class="section">
      <div class="section-head"><div><div class="section-title">${t('이번 주 발견','Weekly Discovery','今週의 발견')}</div><div class="section-subtitle">${t('이 장르 듣는 사람이 듣는 다른 장르','What fans of this genre also enjoy','このジャンルのファンが好む他のジャンル')}</div></div></div>
      <div class="ai-result">
        <div class="ai-q">${t('팝을 좋아한다면','If you love Pop','ポップが好きなら')} ${popG.emoji}</div>
        <div class="ai-a">${t('이런 장르도 좋아할 거예요','You might also love','こんなジャンルもおすすめです')} → ${popG.alsoListenTo.map(id=>{const g=genreById(id);return g?`<a href="#genre/${g.id}" style="color:${g.color};font-weight:700">${t(g.nameKo,g.name,g.nameJa)}</a>`:''}).filter(Boolean).join(', ')}</div>
      </div>
    </section>
 
    <section class="section">
      <div class="section-head"><div><div class="section-title">${t('시대별 스냅샷','Era Snapshot','年代別スナップショット')}</div><div class="section-subtitle">${t('음악의 시간을 거슬러','Travel back through music history','音楽の時間をさかのぼる')}</div></div><a class="see-all" href="#timeline">${t('타임라인','Timeline','タイムライン')}</a></div>
      <div class="grid-2">${eras.map(homeEraCardHTML).join('')}</div>
    </section>
  </div>`;
  document.getElementById('view-root').innerHTML = html;
  applyLang();
}

/* ===================== RENDER: GENRES ===================== */
let genreSort = 'all';
function renderGenres(){
  let list = [...GENRES];
  if(genreSort==='era') list.sort((a,b)=>parseInt(a.eraOrigin)-parseInt(b.eraOrigin));
  else if(genreSort==='popular') list.sort((a,b)=>b.listeners-a.listeners);
  else if(genreSort==='alpha') list.sort((a,b)=>a.name.localeCompare(b.name));
  const filters = [['all','전체','All','すべて'],['era','시대순','By era','年代順'],['popular','인기순','Popular','人気順'],['alpha','알파벳순','A-Z','アルファベット順']];
  const html = `<div class="view">
    <div class="section-head" style="margin-bottom:var(--space-5)"><div><div class="section-title">${t('장르 탐색','Explore Genres','ジャンル探索')}</div><div class="section-subtitle">${t('16개 장르, 무한한 발견','16 genres, infinite discovery','16のジャンル、無限の発見')}</div></div></div>
    <div class="filter-bar">${filters.map(([k,ko,en,ja])=>`<button class="btn-outlined ${genreSort===k?'active':''}" onclick="window.setGenreSort('${k}');renderGenres()">${t(ko,en,ja)}</button>`).join('')}</div>
    <div class="grid-3">${list.map(genreGridCardHTML).join('')}</div>
  </div>`;
  document.getElementById('view-root').innerHTML = html;
  applyLang();
}
function genreGridCardHTML(g){
  const maxL = 2800000000;
  const pct = Math.round(g.listeners/maxL*100);
  return `<a class="genre-card" href="#genre/${g.id}" style="background:linear-gradient(150deg,${g.color},${g.colorSecondary})">
    <div>
      <div class="gc-emoji">${g.emoji}</div>
      <div class="gc-name" style="margin-top:8px">${t(g.nameKo,g.name,g.nameJa)}<small>${g.id==='rnb'?'R&B / Soul':esc(g.name)}</small></div>
    </div>
    <div class="gc-sub">${g.subGenres.slice(0,4).map(s=>s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())).join(' · ')}</div>
    <div class="gc-foot">
      <div class="listeners-bar">
        <div class="lb-track"><div class="lb-fill" style="width:${pct}%"></div></div>
        <div class="lb-label">${fmtListeners(g.listeners)} ${t('청취자','listeners','リスナー')}</div>
      </div>
      <span class="gc-go">${t('탐색하기','Explore','探索する')} →</span>
    </div>
  </a>`;
}

/* ===================== RENDER: GENRE DETAIL ===================== */
function renderGenreDetail(id){
  const g = genreById(id);
  if(!g){ renderGenres(); return; }
  const songs = SONGS.filter(s=>s.genre===id).sort((a,b)=>b.popularity-a.popularity).slice(0,10);
  const related = (g.alsoListenTo||g.relatedGenres).map(genreById).filter(Boolean);
  const eraHistory = ERAS.filter(e=>e.dominantGenres.includes(id));
  const songRows = songs.length ? songs.map((s,i)=>`
    <div class="chart-row gd" onclick="playSong(${s.id})">
      <div class="cr-rankcell"><span class="cr-rank">${i+1}</span><button class="btn-play sm cr-playbtn" onclick="event.stopPropagation();playSong(${s.id})">${ICON.play}</button></div>
      <div class="cr-song">${artHTML(s)}<div style="min-width:0"><div class="cr-title">${esc(s.title)}</div><div class="cr-artist"><a href="#artist/${encodeURIComponent(s.artist)}" onclick="event.stopPropagation()" style="color:inherit; text-decoration:none; cursor:pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(s.artist)}</a></div></div></div>
      <div class="cr-num cr-year">${s.year}</div>
      <div class="cr-num">${fmtListeners(s.streamCount)}</div>
      <div class="cr-num">${s.duration}</div>
    </div>`).join('')
    : `<div class="empty-state"><div class="es-emoji">■</div>${t('이 장르의 차트 곡은 준비 중이에요','Chart tracks for this genre are coming soon','このジャンルのチャート曲は準備中です')}</div>`;

  const html = `<div class="view">
    <section class="genre-hero">
      <div class="gh-content">
        <div class="era-badge" style="width:fit-content;margin-bottom:12px;background:rgba(0,0,0,.4);color:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.2)">${t('탄생','Origin','誕生')}: ${g.eraOrigin}</div>
        <h1>${t(g.nameKo,g.name,g.nameJa)}</h1>
        <div class="gh-desc">${t(g.descriptionKo,g.description,g.descriptionJa)}</div>
        <div class="char-pills">${g.characteristics.map(c=>`<span class="genre-tag" style="background:rgba(0,0,0,.3)">${esc(c)}</span>`).join('')}</div>
      </div>
      <div class="gh-graphic">
        <div class="gh-emoji">${g.emoji}</div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><div class="section-title">${t('인기 곡','Top Songs','人気曲')}</div></div>
      <div class="chart-head gd"><div style="text-align:center">#</div><div>${t('곡','Song','曲')}</div><div class="cr-year" style="text-align:right">${t('연도','Year','年')}</div><div style="text-align:right">${t('스트림','Streams','再生回数')}</div><div style="text-align:right">${t('길이','Length','時間')}</div></div>
      <div style="margin-top:8px">${songRows}</div>
    </section>

    <section class="section">
      <div class="section-head"><div class="section-title">${t('서브장르','Sub-Genres','サブジャンル')}</div></div>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">${g.subGenres.map(s=>`<span class="pill-tag">${s.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>`).join('')}</div>
    </section>

    <section class="section">
      <div class="section-head"><div><div class="section-title">${t('이 장르를 듣는 사람은 이것도 들어요','Also listen to','このジャンルを聴く人はこちらも聴いています')}</div><div class="section-subtitle">${t('연결된 사운드 탐험','Explore connected sounds','関連するサウンドの探索')}</div></div></div>
      <div class="grid-3">${related.map(r=>`
        <a class="related-card" href="#genre/${r.id}">
          <div class="rc-art" style="background:${artGradient(r.id)};display:grid;place-items:center;font-size:24px">${r.emoji}</div>
          <div><div class="rc-name">${t(r.nameKo,r.name,r.nameJa)}<small>${fmtListeners(r.listeners)} ${t('청취자','listeners','リスナー')}</small></div></div>
        </a>`).join('')}</div>
    </section>

    <section class="section">
      <div class="artist-grid">${g.topArtists.map(a=>`
        <a class="artist-cell" href="#artist/${encodeURIComponent(a)}" style="text-decoration:none; color:inherit;" onclick="event.stopPropagation()">
          <div class="artist-avatar" style="background:${avatarColor(a)}">${initials(a)}</div>
          <div class="an">${esc(a)}</div>
        </a>`).join('')}</div>
    </section>

    ${eraHistory.length?`<section class="section">
      <div class="section-head"><div><div class="section-title">${t('시대별 역사','In History','歴史の中での記述')}</div><div class="section-subtitle">${t('이 장르가 빛난 시대','Eras where this genre shaped music','このジャンルが音楽を形作った時代')}</div></div></div>
      <div class="horizontal-scroll">${eraHistory.map(e=>`
        <a href="#timeline" class="song-card" style="width:220px;background:${e.gradient};text-decoration:none">
          <div style="font-size:30px;font-weight:700">${e.decade}</div>
          <div style="font-size:13px;font-weight:600;margin-top:6px;text-shadow:0 1px 4px rgba(0,0,0,.4)">${t(e.title,e.titleEn,e.titleJa)}</div>
        </a>`).join('')}</div>
    </section>`:''}
  </div>`;
  document.getElementById('view-root').innerHTML = html;
  applyLang();
}

/* ===================== RENDER: TIMELINE ===================== */
function homeEraCardHTML(e){
  return `<a class="era-card" href="#timeline" style="text-decoration:none; display:block;">
    <div class="ec-top" style="background:#2a2a2a; color:#fff; border-bottom:1px solid rgba(255,255,255,0.05); min-height:150px;">
      <div class="ec-decade" style="text-shadow:none; color:#fff;">${e.decade}</div>
      <div class="ec-title" style="text-shadow:none; color:#ccc;">${t(e.title,e.titleEn,e.titleJa)}</div>
    </div>
  </a>`;
}

function eraCardHTML(e){
  return `<div class="era-card" onclick="this.classList.toggle('open')">
    <div class="ec-top" style="background:#2a2a2a; color:#fff; border-bottom:1px solid rgba(255,255,255,0.05);">
      <div class="ec-decade" style="text-shadow:none; color:#fff;">${e.decade}</div>
      <div class="ec-title" style="text-shadow:none; color:#ccc;">${t(e.title,e.titleEn,e.titleJa)}</div>
    </div>
    <div class="ec-body">
      <p>${t(e.description,e.descriptionEn,e.descriptionJa)}</p>
      <div class="ec-label">${t('지배 장르','Dominant genres','主要ジャンル')}</div>
      <div class="ec-genres">${e.dominantGenres.map(id=>{const g=genreById(id);return g?`<a class="genre-tag" href="#genre/${g.id}" onclick="event.stopPropagation()" style="background:${g.color}22;color:${g.color}"><span class="gt-dot" style="background:${g.color}"></span>${t(g.nameKo,g.name,g.nameJa)}</a>`:''}).filter(Boolean).join('')}</div>
      <div class="ec-label">${t('주요 아티스트','Key artists','主なアーティスト')}</div>
      <div class="ec-genres">${e.keyArtists.map(a=>`<a class="pill-tag" href="#artist/${encodeURIComponent(a)}" style="font-size:11px;padding:6px 12px;text-decoration:none;" onclick="event.stopPropagation()">${esc(a)}</a>`).join('')}</div>
      <div class="ec-context">${esc(e.culturalContext)}</div>
    </div>
  </div>`;
}
const BIRTH_TRANS = {
  "로큰롤 탄생 ▲": { ko: "로큰롤 탄생 ▲", en: "Birth of Rock & Roll ▲", ja: "ロックンロール誕生 ▲" },
  "레게 태동 ≋": { ko: "레게 태동 ≋", en: "Emergence of Reggae ≋", ja: "レゲエの胎動 ≋" },
  "힙합 탄생 ■": { ko: "힙합 탄생 ■", en: "Birth of Hip-Hop ■", ja: "ヒップホップ誕生 ■" },
  "인디 등장 ⬚": { ko: "인디 등장 ⬚", en: "Emergence of Indie ⬚", ja: "インディー登場 ⬚" },
  "K-Pop 태동 ○": { ko: "K-Pop 태동 ○", en: "Emergence of K-Pop ○", ja: "K-POPの胎動 ○" },
  "디지털 스트리밍 ◆": { ko: "디지털 스트리밍 ◆", en: "Digital Streaming ◆", ja: "デジタルストリーミング ◆" },
  "트랩 지배 ●": { ko: "트랩 지배 ●", en: "Trap Dominance ●", ja: "トラップの支配 ●" }
};
function renderTimeline(){
  const html = `<div class="view">
    <div class="section-head" style="margin-bottom:var(--space-5)"><div><div class="section-title">${t('시대별 역사','Timeline','年代別の歴史')}</div><div class="section-subtitle">${t('카드를 눌러 시대를 펼쳐보세요 · 1950s → 2020s','Tap a card to expand · 1950s → 2020s','カードをタップして年代を展開 · 1950s → 2020s')}</div></div></div>
    <div class="timeline">${ERAS.map((e,i)=>`
      ${eraCardHTML(e)}
      ${i<ERAS.length-1 && ERAS[i].birth ? `<div style="align-self:center;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text-secondary);margin:12px 0">
        <svg width="20" height="40" viewBox="0 0 20 40" fill="none"><path d="M10 2v32m0 0l-5-6m5 6l5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:800;white-space:nowrap;letter-spacing:0.5px">${(BIRTH_TRANS[ERAS[i].birth] ? t(BIRTH_TRANS[ERAS[i].birth].ko, BIRTH_TRANS[ERAS[i].birth].en, BIRTH_TRANS[ERAS[i].birth].ja) : ERAS[i].birth)}</span>
      </div>`:''}
    `).join('')}</div>
  </div>`;
  document.getElementById('view-root').innerHTML = html;
  applyLang();
}

/* ===================== RENDER: ARTIST DETAIL & DYNAMIC SONGS ===================== */
function registerDynamicSong(iTunesSong) {
  const existing = SONGS.find(s => 
    s.title.toLowerCase() === iTunesSong.trackName.toLowerCase() && 
    s.artist.toLowerCase() === iTunesSong.artistName.toLowerCase()
  );
  if (existing) return existing;
  
  const newId = SONGS.length > 0 ? Math.max(...SONGS.map(s => s.id)) + 1 : 1;
  const newSong = {
    id: newId,
    rank: SONGS.length + 1,
    title: iTunesSong.trackName,
    artist: iTunesSong.artistName,
    genre: (iTunesSong.primaryGenreName || 'Pop').toLowerCase().replace(/[^a-z]/g, ''),
    year: iTunesSong.releaseDate ? new Date(iTunesSong.releaseDate).getFullYear() : 2020,
    popularity: 85,
    duration: secToDur(iTunesSong.trackTimeMillis / 1000),
    streamCount: 50000000 + (iTunesSong.trackId % 200000000),
    rankChange: 0,
    isDynamic: true,
    previewUrl: iTunesSong.previewUrl
  };
  
  albumArtCache[newSong.id] = iTunesSong.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg');
  saveAlbumArtCache();
  
  SONGS.push(newSong);
  return newSong;
}

function fetchArtistSongsFromITunes(artistName) {
  const query = encodeURIComponent(artistName);
  fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=10`)
    .then(res => res.json())
    .then(data => {
      const listDiv = document.getElementById('artist-songs-list');
      if (!listDiv) return;
      
      if (data.results && data.results.length > 0) {
        const registeredSongs = data.results.map(registerDynamicSong);
        const songRowsHTML = registeredSongs.map((s, i) => `
          <div class="chart-row gd" onclick="playSong(${s.id})">
            <div class="cr-rankcell"><span class="cr-rank">${i+1}</span><button class="btn-play sm cr-playbtn" onclick="event.stopPropagation();playSong(${s.id})">${ICON.play}</button></div>
            <div class="cr-song">${artHTML(s)}<div style="min-width:0"><div class="cr-title">${esc(s.title)}</div><div class="cr-artist">${esc(s.artist)}</div></div></div>
            <div class="cr-num cr-year">${s.year}</div>
            <div class="cr-num">${fmtListeners(s.streamCount)}</div>
            <div class="cr-num">${s.duration}</div>
          </div>
        `).join('');
        
        listDiv.innerHTML = songRowsHTML;
      } else {
        listDiv.innerHTML = `<div class="empty-state"><div class="es-emoji">●</div>${t('곡을 찾지 못했습니다.','No tracks found.','曲が見つかりませんでした。')}</div>`;
      }
      applyLang();
    })
    .catch(err => {
      console.error("iTunes artist search failed:", err);
      const listDiv = document.getElementById('artist-songs-list');
      if (listDiv) {
        listDiv.innerHTML = `<div class="empty-state"><div class="es-emoji">✖</div>${t('곡 정보를 불러오는 데 실패했습니다.','Failed to load songs.','曲情報の読み込みに失敗しました。')}</div>`;
      }
      applyLang();
    });
}

function renderArtistDetail(artistName) {
  const root = document.getElementById('view-root');
  const localSongs = SONGS.filter(s => 
    s.artist.toLowerCase() === artistName.toLowerCase() || 
    s.artist.toLowerCase().includes(artistName.toLowerCase())
  );
  
  const avatarBg = avatarColor(artistName);
  const initialsText = initials(artistName);
  
  let songRowsHTML = '';
  if (localSongs.length > 0) {
    songRowsHTML = localSongs.map((s, i) => `
      <div class="chart-row gd" onclick="playSong(${s.id})">
        <div class="cr-rankcell"><span class="cr-rank">${i+1}</span><button class="btn-play sm cr-playbtn" onclick="event.stopPropagation();playSong(${s.id})">${ICON.play}</button></div>
        <div class="cr-song">${artHTML(s)}<div style="min-width:0"><div class="cr-title">${esc(s.title)}</div><div class="cr-artist">${esc(s.artist)}</div></div></div>
        <div class="cr-num cr-year">${s.year}</div>
        <div class="cr-num">${fmtListeners(s.streamCount)}</div>
        <div class="cr-num">${s.duration}</div>
      </div>
    `).join('');
  }
  
  const backBtnHTML = `<a class="btn-outlined" href="#timeline" style="width:fit-content; margin-bottom:var(--space-4); text-decoration:none; display:inline-flex; align-items:center; gap:8px;">← ${t('타임라인','Timeline','タイムライン')}</a>`;
  
  root.innerHTML = `
    <div class="view">
      ${backBtnHTML}
      <section class="genre-hero" style="background:linear-gradient(160deg,#222,#111 65%,#07050f)">
        <div class="artist-avatar" style="width:100px; height:100px; font-size:30px; border-radius:50%; background:${avatarBg}; margin-bottom:var(--space-3); border:1px solid var(--border-subtle); display:grid; place-items:center; font-weight:bold; color:#fff;">
          ${initialsText}
        </div>
        <h1>${esc(artistName)}</h1>
        <div class="gh-desc" style="opacity:0.7">${t('시대별 역사에 등록된 주요 아티스트','Key artist featured in the timeline','年代記タイムラインに掲載された主要アーティスト')}</div>
      </section>
      
      <section class="section" id="artist-songs-section">
        <div class="section-head"><div class="section-title">${t('주요 곡','Top Songs','主な楽曲')}</div></div>
        <div class="chart-head gd"><div style="text-align:center">#</div><div>${t('곡','Song','曲')}</div><div class="cr-year" style="text-align:right">${t('연도','Year','年')}</div><div style="text-align:right">${t('스트림','Streams','再生回수')}</div><div style="text-align:right">${t('길이','Length','時間')}</div></div>
        <div style="margin-top:8px" id="artist-songs-list">
          ${songRowsHTML ? songRowsHTML : `<div class="empty-state" id="artist-loading-state" style="opacity:0.8;">${t('아티스트의 주요 곡들을 가져오는 중...','Fetching artist tracks from iTunes...','アーティストの主要曲を読み込み中...')}</div>`}
        </div>
      </section>
    </div>
  `;
  
  applyLang();
  
  if (localSongs.length === 0) {
    fetchArtistSongsFromITunes(artistName);
  }
}

/* ===================== RENDER: SEARCH ===================== */
let searchQuery = '';
const AI_RULES = [
  {keys:['빠르','시끄','기타','fast','loud','guitar','速','激','うるさ','ギター'],genres:['rock','metal','punk'],ko:'빠르고 강렬한 기타 사운드네요',en:'Sounds like fast, intense guitar music',ja:'速くて強烈なギターサウンドですね'},
  {keys:['느리','감성','슬프','slow','emotional','sad','mellow','遅','感性','悲し','メロウ','エ모'],genres:['indie','jazz','rnb'],ko:'느리고 감성적인 분위기예요',en:'A slow, emotional mood',ja:'静かでエモーショナルな雰囲気です'},
  {keys:['반복','비트','전자','신스','repetitive','beat','electronic','synth','反復','ビート','電子','シンセ'],genres:['electronic','hiphop'],ko:'반복적인 비트 기반 사운드네요',en:'Repetitive, beat-driven sound',ja:'反復的なビートベースのサウンドですね'},
  {keys:['퍼포먼스','군무','아이돌','choreo','performance','idol','パフォーマンス','アイドル','ダンス'],genres:['kpop'],ko:'완벽한 퍼포먼스의 음악이네요',en:'Music built around perfect performance',ja:'完璧なパフォーマンスの音楽ですね'},
];
function runAISuggest(q){
  const lower = q.toLowerCase();
  for(const r of AI_RULES){ if(r.keys.some(k=>lower.includes(k))) return r; }
  return null;
}
function renderSearch(){
  const q = searchQuery.trim();
  let results = [], ai = null;
  if(q){
    const lower = q.toLowerCase();
    results = SONGS.filter(s=>s.title.toLowerCase().includes(lower)||s.artist.toLowerCase().includes(lower));
    ai = runAISuggest(q);
  }
  const examples = t(
    ['빠르고 시끄러운 기타','느리고 감성적인','반복적인 비트','완벽한 퍼포먼스'],
    ['fast loud guitar','slow emotional','repetitive beat','perfect performance'],
    ['速くて激しいギター','静かでエモーショナル','反復的なビート','完璧なパフォーマンス']
  );
  let body;
  if(!q){
    const suggestedVibes = t(
      ['드라이브할 때', '비 오는 날 카페', '공부할 때 집중', '빠르고 시끄러운 기타', '몽환적인 새벽 감성', '힙한 리듬 비트'],
      ['Driving Vibe', 'Rainy Day Cafe', 'Deep Focus Study', 'Powerful Rock Guitars', 'Dreamy Midnight', 'Groovy Hip-Hop Beat'],
      ['ドライブの時', '雨の日のカフェ', '勉強に集中', 'パワフルなロック', '幻想的な深夜の感性', 'ヒップなリズムビート']
    );
    // Pick 3 random songs from top 12 popular songs
    const topPopular = [...SONGS].sort((a,b) => b.popularity - a.popularity).slice(0, 12);
    const trendingList = [...topPopular].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    body = `
      <div style="margin-top:var(--space-6); animation: fadeIn 0.3s ease;">
        <div class="ec-label">${t('인기 바이브 검색어','Suggested Vibes','人気のバイブキーワード')}</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; margin-bottom:var(--space-6)">
          ${suggestedVibes.map(v => `<button class="pill-tag" onclick="quickSearch('${v}')">${v}</button>`).join('')}
        </div>

        <div class="ec-label">${t('현재 트렌딩 추천 곡','Trending Music Recommendations','現在トレンドのおすすめ曲')}</div>
        <div class="grid-3" style="margin-top:8px">
          ${trendingList.map(s => `
            <div class="related-card" onclick="playSong(${s.id})">
              <div class="rc-art" style="background:${artGradient(s.genre)};display:grid;place-items:center;font-size:18px">${genreById(s.genre).emoji}</div>
              <div style="min-width:0">
                <div class="rc-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.title)}
                  <small style="display:block; margin-top:2px; font-size:10px; color:var(--text-secondary)">${esc(s.artist)}</small>
                </div>
                <div style="margin-top:6px">${genreTagHTML(s.genre)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    const aiHTML = ai ? `<div class="ai-result">
      <div class="ai-q">[SYSTEM] ${t('AI 장르 식별','AI genre detection','AIジャンル識別')}: "${esc(q)}"</div>
      <div class="ai-a">${t(ai.ko,ai.en,ai.ja)} → ${ai.genres.map(id=>{const g=genreById(id);return `<a href="#genre/${g.id}" style="color:${g.color};font-weight:700">${t(g.nameKo,g.name,g.nameJa)}</a>`}).join(', ')}</div>
    </div>` : '';
    const resHTML = results.length ? `<div class="section-head"><div class="section-title">${t('검색 결과','Results','検索結果')} (${results.length})</div></div>
      <div class="grid-3">${results.map(s=>`
        <div class="related-card" onclick="playSong(${s.id})">
          <div class="rc-art" style="background:${artGradient(s.genre)};display:grid;place-items:center;font-size:18px">${genreById(s.genre).emoji}</div>
          <div style="min-width:0"><div class="rc-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.title)}<small><a href="#artist/${encodeURIComponent(s.artist)}" onclick="event.stopPropagation()" style="color:inherit; text-decoration:none; cursor:pointer;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${esc(s.artist)}</a> · ${s.year}</small></div><div style="margin-top:6px">${genreTagHTML(s.genre)}</div></div>
        </div>`).join('')}</div>`
      : (ai ? '' : `<div class="empty-state"><div class="es-emoji">◆</div>${t('일치하는 곡이 없어요. 느낌을 설명해볼까요?','No matching songs. Try describing a vibe instead.','一致する曲がありません。雰囲気を説明してみますか？')}</div>`);
    body = aiHTML + resHTML;
  }
  const html = `<div class="view">
    <div class="section-head" style="margin-bottom:var(--space-5)"><div><div class="section-title">${t('장르 검색','Search','ジャンル検索')}</div><div class="section-subtitle">${t('곡·아티스트 검색 또는 느낌으로 장르 찾기','Find by track, artist, or vibe','曲・アーティストの検索、または雰囲気からジャンルを探す')}</div></div></div>
    <div class="search-box">
      ${ICON.search}
      <input class="search-input" id="search-input" value="${esc(searchQuery)}" placeholder="${t('곡명, 아티스트, 또는 느낌…','Song, artist, or a vibe…','曲名、アーティスト、または雰囲気…')}" oninput="onSearchInput(this.value)" autocomplete="off">
      ${q ? `<button onclick="quickSearch('')" style="background:none;border:none;color:inherit;cursor:pointer;display:flex;padding:4px;opacity:0.6;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">${ICON.close}</button>` : ''}
    </div>
    <div class="ai-suggest">${examples.map(e=>`<button class="pill-tag" onclick="quickSearch('${e}')">${e}</button>`).join('')}</div>
    ${body}
  </div>`;
  document.getElementById('view-root').innerHTML = html;
  applyLang();
  const inp = document.getElementById('search-input');
  if(inp && q){ inp.focus(); inp.setSelectionRange(inp.value.length,inp.value.length); }
}
let searchTimer;
function onSearchInput(v){
  searchQuery = v;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(renderSearch, 220);
}
function quickSearch(v){ searchQuery = v; renderSearch(); }

/* ===================== RENDER: TASTE DNA ===================== */
let tasteState = { step: 1, genres: [], vibe: '', era: '', soundFocus: '', habitat: '' };

function renderTaste(){
  const root = document.getElementById('view-root');
  if (tasteState.step === 'result') {
    renderTasteResult(root);
    return;
  }
  
  let content = '';
  if (tasteState.step === 1) {
    const genreButtons = GENRES.map(g => {
      const isSelected = tasteState.genres.includes(g.id);
      // Use subtle colored dots or symbols. Muted gray for monochrome, gold for afrobeats
      const symbolColor = isSelected ? '#000000' : (g.id === 'afrobeats' ? '#cca625' : '#8a8a8a');
      return `<button class="taste-option-btn ${isSelected?'selected':''}" onclick="toggleTasteGenre('${g.id}')">
        <span style="color: ${symbolColor}; margin-right: 4px; font-weight: bold;">${g.emoji}</span>
        <span>${t(g.nameKo, g.name, g.nameJa)}</span>
      </button>`;
    }).join('');
    
    content = `
      <div class="taste-step">
        <div class="taste-step-title">Step 1. ${t('최애 장르 선택 (최대 3개)','Select Favorite Genres (Max 3)','お気に入りジャンルの選択 (最大3つ)')}</div>
        <div class="taste-step-desc">${t('당신의 가슴을 뛰게 만드는 장르들을 골라보세요.','Choose the genres that make your heart beat.','あなたの心を躍らせるジャンルを選んでください。')}</div>
        <div class="taste-grid-toggle">${genreButtons}</div>
      </div>
    `;
  } else if (tasteState.step === 2) {
    const vibes = [
      {id: 'hype', ko: '신나고 파워풀한 비트', en: 'Hype & Powerful Beats', ja: 'エキサイティングでパワフルな비트', emoji: '◈', color: '#cca625'},
      {id: 'chill', ko: '차분하고 몽환적인 감성', en: 'Calm & Dreamy Vibes', ja: '穏やかで幻想的な感性', emoji: '◇', color: '#5a97a8'},
      {id: 'emotional', ko: '서정적이고 아련한 멜로디', en: 'Melodic & Emotional', ja: '叙情的で切ないメロディー', emoji: '♥', color: '#be5a74'},
      {id: 'intense', ko: '어둡고 묵직한 날것의 에너지', en: 'Dark & Intense Raw Energy', ja: 'ダークで重々しい生のエネルギー', emoji: '✦', color: '#825abf'}
    ];
    
    const vibeButtons = vibes.map(v => {
      const isSelected = tasteState.vibe === v.id;
      return `<button class="taste-option-btn ${isSelected?'selected':''}" onclick="selectTasteVibe('${v.id}')">
        <span style="color: ${isSelected ? '#000000' : v.color}; margin-right: 4px; font-weight: bold;">${v.emoji}</span>
        <span>${t(v.ko, v.en, v.ja)}</span>
      </button>`;
    }).join('');
 
    content = `
      <div class="taste-step">
        <div class="taste-step-title">Step 2. ${t('선호하는 음악 분위기','Preferred Music Vibe','好みの音楽の雰囲気')}</div>
        <div class="taste-step-desc">${t('지금 끌리는 음악적 색깔은 무엇인가요?','What musical colors are you drawn to right now?','今惹かれている音楽の色は何ですか？')}</div>
        <div class="taste-grid-toggle" style="grid-template-columns: 1fr;">${vibeButtons}</div>
      </div>
    `;
  } else if (tasteState.step === 3) {
    const eras = [
      {id: 'retro', ko: '클래식 레트로 (1950s - 1970s)', en: 'Classic Retro (1950s - 1970s)', ja: 'クラシックレトロ (1950s - 1970s)', emoji: '◀', color: '#a8815a'},
      {id: 'millennium', ko: '골든 밀레니엄 (1980s - 2000s)', en: 'Golden Millennium (1980s - 2000s)', ja: 'ゴールデンミレニアム (1980s - 2000s)', emoji: '〓', color: '#5aa88c'},
      {id: 'modern', ko: '트렌디 디지털 (2010s - 2020s)', en: 'Trendy Digital (2010s - 2020s)', ja: 'トレンディデジタル (2010s - 2020s)', emoji: '▶', color: '#5a82a8'}
    ];
    
    const eraButtons = eras.map(e => {
      const isSelected = tasteState.era === e.id;
      return `<button class="taste-option-btn ${isSelected?'selected':''}" onclick="selectTasteEra('${e.id}')">
        <span style="color: ${isSelected ? '#000000' : e.color}; margin-right: 4px; font-weight: bold;">${e.emoji}</span>
        <span>${t(e.ko, e.en, e.ja)}</span>
      </button>`;
    }).join('');
 
    content = `
      <div class="taste-step">
        <div class="taste-step-title">Step 3. ${t('선호하는 시대 감성','Preferred Music Era','好みの年代の感성')}</div>
        <div class="taste-step-desc">${t('당신의 감성이 머무는 시간대를 선택해 주세요.','Select the era where your sentiment belongs.','あなたの感性が惹かれる年代を選択してください。')}</div>
        <div class="taste-grid-toggle" style="grid-template-columns: 1fr;">${eraButtons}</div>
      </div>
    `;
  } else if (tasteState.step === 4) {
    const soundFocuses = [
      {id: 'vocal', ko: '보컬 & 가사 (멜로디와 이야기)', en: 'Vocals & Lyrics (Deep Story)', ja: 'ボーカル＆歌詞 (深いストーリー)', emoji: '♬', color: '#a55abf'},
      {id: 'beat', ko: '드럼 & 베이스 (비트와 리듬감)', en: 'Heavy Drums & Bass (Beat Focus)', ja: '胸を打つドラム＆ベース (ビートフォーカス)', emoji: '♩', color: '#bf5a5a'},
      {id: 'synth', ko: '신디사이저 & 키보드 (미래적이고 화려한 사운드)', en: 'Sparkling Synths & Keyboards', ja: '華やかで未来的なシンセサイザー', emoji: '♪', color: '#5a6ebf'},
      {id: 'acoustic', ko: '기타 & 피아노 (어쿠스틱 현악 및 타건)', en: 'Acoustic Strings & Piano', ja: '温かみのあるアコースティックギター＆ピアノ', emoji: '♫', color: '#80bf5a'}
    ];
    
    const soundFocusButtons = soundFocuses.map(s => {
      const isSelected = tasteState.soundFocus === s.id;
      return `<button class="taste-option-btn ${isSelected?'selected':''}" onclick="selectTasteSoundFocus('${s.id}')">
        <span style="color: ${isSelected ? '#000000' : s.color}; margin-right: 4px; font-weight: bold;">${s.emoji}</span>
        <span>${t(s.ko, s.en, s.ja)}</span>
      </button>`;
    }).join('');
 
    content = `
      <div class="taste-step">
        <div class="taste-step-title">Step 4. ${t('선호하는 사운드 포커스','Preferred Sound Focus','好みのサウンドフォーカス')}</div>
        <div class="taste-step-desc">${t('귀에 가장 먼저 꽂히는 음악적 핵심 요소는 무엇인가요?','Which core musical element catches your ears first?','耳に真っ先に飛び込んでくる音楽の核心要素は何ですか？')}</div>
        <div class="taste-grid-toggle" style="grid-template-columns: 1fr;">${soundFocusButtons}</div>
      </div>
    `;
  } else if (tasteState.step === 5) {
    const habitats = [
      {id: 'night', ko: '어두운 밤, 나만의 조용한 방 안에서', en: 'Late Night in My Room', ja: '静かな夜、自分だけの部屋で', emoji: '☽', color: '#bfa85a'},
      {id: 'street', ko: '헤드폰을 쓰고 도시나 공원을 걸을 때', en: 'Walking Outside with Headphones', ja: 'ヘッドホンをつけて街を散歩しながら', emoji: '⧟', color: '#7a8c9e'},
      {id: 'study', ko: '독서나 업무, 공부 등 고도의 몰입이 필요할 때', en: 'Deep Concentration (Work & Study)', ja: '勉強や作業に深く集中しているとき', emoji: '✎', color: '#7ebf7a'},
      {id: 'energy', ko: '기분 전환, 활기찬 파티나 신나는 드라이브 중에', en: 'Vibe Boost, Driving or Party', ja: '気分転換、ドライブ、またはパーティーのとき', emoji: '☼', color: '#bf805a'}
    ];
    
    const habitatButtons = habitats.map(h => {
      const isSelected = tasteState.habitat === h.id;
      return `<button class="taste-option-btn ${isSelected?'selected':''}" onclick="selectTasteHabitat('${h.id}')">
        <span style="color: ${isSelected ? '#000000' : h.color}; margin-right: 4px; font-weight: bold;">${h.emoji}</span>
        <span>${t(h.ko, h.en, h.ja)}</span>
      </button>`;
    }).join('');
 
    content = `
      <div class="taste-step">
        <div class="taste-step-title">Step 5. ${t('가장 자주 음악을 듣는 공간','Primary Listening Habitat','最も頻繁に音楽を聴く空間')}</div>
        <div class="taste-step-desc">${t('어떤 순간에 당신의 일상에 음악이 가장 필요해지나요?','In which moments does your life need music the most?','どのような瞬間に、あなたの日常に最も音楽が必要になりますか？')}</div>
        <div class="taste-grid-toggle" style="grid-template-columns: 1fr;">${habitatButtons}</div>
      </div>
    `;
  }
  
  const stepDots = [1, 2, 3, 4, 5].map(s => 
    `<div class="tpd-dot ${tasteState.step===s?'active':''}"></div>`
  ).join('');
 
  const nextBtn = tasteState.step === 5 
    ? `<button class="btn-primary" onclick="calculateTasteDNA()">${t('DNA 분석하기','Analyze DNA','DNA分析する')}</button>`
    : `<button class="btn-secondary" onclick="nextTasteStep()">${t('다음 단계','Next','次のステップ')} →</button>`;
    
  const prevBtn = tasteState.step > 1 
    ? `<button class="btn-outlined" onclick="prevTasteStep()">← ${t('이전','Prev','戻る')}</button>`
    : `<div></div>`;
 
  const html = `
    <div class="view">
      <div class="section-head" style="margin-bottom:var(--space-6)">
        <div>
          <div class="section-title">${t('취향 DNA 분석기','Taste DNA Profiler','好みDNAプロファイラー')}</div>
          <div class="section-subtitle">${t('선택을 통해 나만의 음악적 자아를 발견해 보세요','Discover your musical ego through steps','選択を通じて自分だけの音楽的アイデンティティを発見しましょう')}</div>
        </div>
      </div>
      
      <div class="taste-container">
        ${content}
        
        <div class="taste-progress">
          ${prevBtn}
          <div class="taste-progress-dots">${stepDots}</div>
          ${nextBtn}
        </div>
      </div>
    </div>
  `;
  root.innerHTML = html;
  applyLang();
}

function toggleTasteGenre(id){
  const idx = tasteState.genres.indexOf(id);
  if (idx > -1) {
    tasteState.genres.splice(idx, 1);
  } else {
    if (tasteState.genres.length < 3) {
      tasteState.genres.push(id);
    }
  }
  renderTaste();
}

function selectTasteVibe(id){
  tasteState.vibe = id;
  renderTaste();
}

function selectTasteEra(id){
  tasteState.era = id;
  renderTaste();
}

function selectTasteSoundFocus(id){
  tasteState.soundFocus = id;
  renderTaste();
}

function selectTasteHabitat(id){
  tasteState.habitat = id;
  renderTaste();
}

function nextTasteStep(){
  if (tasteState.step === 1 && tasteState.genres.length === 0) {
    alert(t('최소 1개의 장르를 선택해 주세요!','Please select at least 1 genre!','最低1つのジャンルを選択してください！'));
    return;
  }
  if (tasteState.step === 2 && !tasteState.vibe) {
    alert(t('음악 분위기를 선택해 주세요!','Please select a music vibe!','音楽の雰囲気を選択してください！'));
    return;
  }
  if (tasteState.step === 3 && !tasteState.era) {
    alert(t('선호하는 시대를 선택해 주세요!','Please select a preferred era!','好みの年代を選択してください！'));
    return;
  }
  if (tasteState.step === 4 && !tasteState.soundFocus) {
    alert(t('사운드 포커스를 선택해 주세요!','Please select a sound focus!','サウンドフォーカスを選択してください！'));
    return;
  }
  tasteState.step++;
  renderTaste();
}

function prevTasteStep(){
  tasteState.step--;
  renderTaste();
}

function calculateTasteDNA(){
  if (tasteState.step === 5 && !tasteState.habitat) {
    alert(t('음악을 듣는 공간을 선택해 주세요!','Please select a listening habitat!','음악을 듣는 공간을 선택해 주세요!'));
    return;
  }
  tasteState.step = 'result';
  renderTaste();
}

function resetTaste(){
  tasteState = { step: 1, genres: [], vibe: '', era: '', soundFocus: '', habitat: '' };
  renderTaste();
}

function renderTasteResult(root){
  const gs = tasteState.genres;
  const vb = tasteState.vibe;
  const er = tasteState.era;
  const sf = tasteState.soundFocus;
  const hb = tasteState.habitat;
  
  // Determine Profile
  let profileKo = '자유로운 사운드 탐험가';
  let profileEn = 'Eclectic Sound Explorer';
  let profileJa = '自由なサウンド探検家';
  let descKo = '당신은 특정 장르나 스타일에 얽매이지 않고 소리의 다채로움을 즐기는 탐험가입니다. 다양한 음악적 스펙트럼과 하이브리드 감성을 지녔습니다.';
  let descEn = 'You are an explorer who enjoys the colorful textures of sound, unbound by strict styles. You embrace a wide musical spectrum and hybrid sentiments.';
  let descJa = 'あなたは特定のジャンルやスタイルにとらわれず、音の多彩さを楽しむ探検家です。幅広い音楽的スペックトルとハイブリッドな感性を持っています。';
  let badge = 'EXPLORER';
  
  if ((gs.includes('rock') || gs.includes('metal') || gs.includes('punk')) && (vb === 'intense' || sf === 'acoustic')) {
    profileKo = '강철 같은 에너지 리프 추적자';
    profileEn = 'Heavy Metal Iron Riffer';
    profileJa = '鋼鉄のエナジーリ프 추적자';
    descKo = '거친 일렉 기타의 포효와 가슴을 때리는 비트에 본능적으로 끌리는군요. 파워풀하고 정제되지 않은 진정성을 소중히 여깁니다.';
    descEn = 'You are drawn to raw electric guitars and thunderous beats. You value heavy energy and unpolished musical authenticity.';
    descJa = '歪んだエレキギターの咆哮と、胸を打つビートに本能的に惹かれているようです。パワフルで加工されていない本物のエネルギーを大切にしています。';
    badge = 'RAW POWER';
  } else if ((gs.includes('jazz') || gs.includes('blues') || gs.includes('rnb')) && (vb === 'chill' || sf === 'beat')) {
    profileKo = '미드나잇 소울 메이트';
    profileEn = 'Midnight Soul Cruiser';
    profileJa = 'ミッドナイト・ソウルメイト';
    descKo = '차분하고 그루브한 베이스와 재즈틱한 화음 속에서 가장 편안함을 느낍니다. 낭만적이고 사색적인 밤에 어울리는 감성의 소유자입니다.';
    descEn = 'You find peace in warm, groovy basslines and jazz chords. A true romantic who belongs in the quiet hours of a rainy evening.';
    descJa = '穏やかでグルーヴィーなベースと、ジャジーなコード進行の中で最も安らぎを感じます。ロマンチックで思索的な夜にぴったりの感性の持ち主です。';
    badge = 'GROOVE & SOUL';
  } else if ((gs.includes('pop') || gs.includes('kpop') || gs.includes('electronic')) && (vb === 'hype' || sf === 'synth')) {
    profileKo = '짜릿한 스파클링 리듬 체이서';
    profileEn = 'Sparkling Rhythm Chaser';
    profileJa = '刺激的なスパークリングリズムチェイサー';
    descKo = '캐치한 훅 멜로디와 어깨를 들썩이게 만드는 화려한 일렉트로닉 비트에 열광합니다. 트렌디한 감각과 에너제틱한 삶의 태도를 가지고 있습니다.';
    descEn = 'You thrive on catchy hooks and neon synth beats. You have a trendy ear and a dynamic, high-energy outlook on life.';
    descJa = 'キャッチーなフックメロディーと、肩을 흔드는 화려한 일렉트로닉 비트에 열광합니다. 트렌디한 감각과 에너제틱한 삶의 태도를 가지고 있습니다.';
    badge = 'SPARKLING HYPE';
  } else if ((gs.includes('classical') || gs.includes('jazz')) && (hb === 'study' || hb === 'night')) {
    profileKo = '도심 속 클래식 수집가';
    profileEn = 'Urban Neo-Classicist';
    profileJa = '都会のネオ・クラシック収集家';
    descKo = '오케스트라의 풍부한 울림이나 재즈의 정교한 화성 등 클래식하고 변하지 않는 가치에 끌립니다. 고요한 시간 속에 깊숙이 몰입하는 사색가입니다.';
    descEn = 'You appreciate timeless orchestral scales, grand piano strings, and complex jazz voicings. A deep thinker who enjoys acoustic focus.';
    descJa = 'オーケストラの豊かな響きや、ジャズの精巧な和音など、クラシックで不変の価値に惹かれます。静寂の時間の中で深く没頭する思索家です。';
    badge = 'NEO-CLASSICIST';
  } else if (gs.includes('electronic') && er === 'modern' && sf === 'synth') {
    profileKo = '네온 빛 노이즈 미래주의자';
    profileEn = 'Neon Noise Futurist';
    profileJa = 'ネオン光ノイズ未来主義者';
    descKo = '전통적인 경계를 뛰어넘어 초현대적이고 실험적인 사운드를 모험합니다. 강한 신스 웨이브와 인공적인 질감의 하이테크 비트를 선호합니다.';
    descEn = 'You push traditional boundaries to explore ultra-modern synthetic textures. You live for sparkling high-BPM synth drops and digital noise.';
    descJa = '伝統的な境界を越え、超現代的で実験的なサウンドを冒険します。強力なシンセウェーブや人工的な質感のハイテクビートを好みます。';
    badge = 'FUTURIST';
  } else if ((gs.includes('hiphop') || gs.includes('rnb')) && sf === 'beat' && (hb === 'street' || hb === 'energy')) {
    profileKo = '거리 위의 감성 비트 시인';
    profileEn = 'Street Beat Poet';
    profileJa = '街角のビート詩人';
    descKo = '리드미컬한 비트와 랩, 그리고 깊은 서브 베이스의 타격감이 당신의 발걸음을 만듭니다. 도시의 일상과 현실적인 멜로디에 깊이 공감합니다.';
    descEn = 'Your strides are driven by rhythmic drum flows, punchy verses, and heavy sub-bass lines. You vibe with urban realism and street poetry.';
    descJa = 'リズムカルなビートとラップ、そして深いサブベースの打撃感があなたの足取りを作ります. 都市の日常と現実적인 멜로디에 깊이 공감합니다.';
    badge = 'STREET POET';
  } else if ((gs.includes('country') || gs.includes('indie') || gs.includes('folk')) && er === 'retro' && sf === 'acoustic') {
    profileKo = '따뜻한 캠프파이어 방랑자';
    profileEn = 'Campfire Wanderer';
    profileJa = '暖かいたき火の放浪者';
    descKo = '어쿠스틱 기타 한 대와 보컬 본연의 목소리, 소박한 자연의 울림 속에서 평온함을 찾습니다. 아날로그 악기의 따뜻한 울림을 지극히 사랑합니다.';
    descEn = 'You find comfort in the simple resonance of acoustic guitars, raw vocal intimacy, and folk tales. You cherish the organic warmth of pure wooden sounds.';
    descJa = 'アコースティックギター一本とボーカル本来の声、素朴な自然の響きの中で平穏を見出します。アナログ楽器の温かい響きをこよなく愛しています。';
    badge = 'WANDERER';
  } else if (gs.includes('indie') || vb === 'emotional') {
    profileKo = '아날로그 다이어리 몽상가';
    profileEn = 'Analog Diary Dreamer';
    profileJa = 'アナログ日記の夢想家';
    descKo = '세련됨보다는 가사 한 줄에 스며든 진정성 있는 멜로디에 감동받습니다. 몽환적이거나 아련한 어쿠스틱 사운드를 탐색하는 섬세한 취향을 지녔습니다.';
    descEn = 'You prefer authentic lyricism and genuine emotions over commercial polish. You possess a delicate ear for dreamy, reflective sounds.';
    descJa = '洗練された商業音楽よりも、歌詞の一行に染み込んだ真実味のあるメロディーに感動します。幻想的で哀愁漂うアコースティックサウンドを好む、繊細な感性を持っています。';
    badge = 'MELODIC DREAM';
  }
  
  // Calculate Scores
  let melody = 30 + (vb === 'emotional' ? 30 : 0) + (sf === 'vocal' ? 25 : 0) + (gs.includes('pop') || gs.includes('rnb') ? 10 : 0) + (gs.includes('classical') ? 10 : 0);
  let rhythm = 30 + (vb === 'hype' ? 30 : 0) + (sf === 'beat' ? 25 : 0) + (gs.includes('hiphop') || gs.includes('electronic') ? 10 : 0) + (gs.includes('latin') ? 10 : 0);
  let acoustic = 30 + (er === 'retro' ? 25 : 0) + (sf === 'acoustic' ? 25 : 0) + (gs.includes('jazz') || gs.includes('classical') || gs.includes('country') ? 10 : 0) + (hb === 'night' ? 10 : 0);
  let electronic = 20 + (er === 'modern' ? 20 : 0) + (sf === 'synth' ? 25 : 0) + (gs.includes('electronic') || gs.includes('metal') ? 20 : 0) + (hb === 'energy' ? 15 : 0);
  let spaceDepth = 25 + (vb === 'chill' ? 25 : 0) + (hb === 'night' || hb === 'study' ? 20 : 0) + (gs.includes('indie') || gs.includes('classical') ? 15 : 0) + (sf === 'synth' ? 15 : 0);
  
  // Cap at 98%
  melody = Math.min(98, melody);
  rhythm = Math.min(98, rhythm);
  acoustic = Math.min(98, acoustic);
  electronic = Math.min(98, electronic);
  spaceDepth = Math.min(98, spaceDepth);
  
  // Generate DNA Tags
  const tags = [];
  gs.forEach(g => {
    const genreObj = genreById(g);
    if(genreObj) tags.push(genreObj.name.replace(/\s+/g, ''));
  });
  
  if (vb === 'hype') tags.push(t('하이텐션','HighEnergy','ハイテンション'));
  else if (vb === 'chill') tags.push(t('칠링','ChilledOut','チリング'));
  else if (vb === 'emotional') tags.push(t('감성충전','Emotional','エモーショナル'));
  else if (vb === 'intense') tags.push(t('강렬함','RawEnergy','強烈'));
  
  if (er === 'retro') tags.push('RetroRetro');
  else if (er === 'millennium') tags.push('Y2KMillennium');
  else if (er === 'modern') tags.push('FutureDigital');
  
  if (sf === 'vocal') tags.push(t('보컬중심','VocalsFocus','ボーカル中心'));
  else if (sf === 'beat') tags.push(t('리듬비트','RhythmBeat','リズム・ビート'));
  else if (sf === 'synth') tags.push(t('신디사운드','SynthHeavy','シンセサウンド'));
  else if (sf === 'acoustic') tags.push(t('어쿠스틱','AcousticVibe','アコースティック'));
  
  if (hb === 'night') tags.push(t('새벽감성','LateNightRoom','深夜の感性'));
  else if (hb === 'street') tags.push(t('도심산책','StreetWalk','都会の散歩'));
  else if (hb === 'study') tags.push(t('몰입','DeepFocus','集中モード'));
  else if (hb === 'energy') tags.push(t('에너지부스트','VibeBoost','エナジーブースト'));

  // Recommend songs based on DNA (randomized subset of matching tracks)
  const matchingSongs = SONGS.filter(s => gs.includes(s.genre));
  const shuffledMatching = [...matchingSongs].sort(() => 0.5 - Math.random());
  const finalRecSongs = shuffledMatching.length ? shuffledMatching.slice(0, 3) : SONGS.slice(0, 3);
  
  // Recommend related genres (randomized subset of related genres)
  const allRelatedGIds = gs.map(genreById).filter(Boolean).flatMap(g => g.relatedGenres).filter((v, i, self) => self.indexOf(v) === i && !gs.includes(v));
  const shuffledRelatedGIds = [...allRelatedGIds].sort(() => 0.5 - Math.random());
  const relatedG = shuffledRelatedGIds.slice(0, 3).map(genreById).filter(Boolean);
  const finalRelatedG = relatedG.length ? relatedG : [genreById('indie'), genreById('rnb')];
  
  const html = `
    <div class="view td-result">
      <div class="section-head" style="margin-bottom:var(--space-5)">
        <div>
          <div class="section-title">${t('나의 음악 취향 DNA','My Music Taste DNA','私の音楽好みDNA')}</div>
          <div class="section-subtitle">${t('당신의 음악적 자아가 지닌 특성을 분석한 결과입니다.','The analytical profile of your musical ego.','あなたの音楽的アイデンティティの特性を分析した結果です。')}</div>
        </div>
      </div>
      
      <div class="taste-container">
        <span class="td-badge">${badge}</span>
        <div class="td-dna-name">${t(profileKo, profileEn, profileJa)}</div>
        <div class="td-dna-desc">${t(descKo, descEn, descJa)}</div>
        
        <div class="td-dna-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:var(--space-5)">
          ${tags.map(tag => `<span style="font-family:var(--font-mono); font-size:11px; background:#111; color:var(--text-secondary); border:1px solid var(--border-subtle); padding:4px 8px;">#${tag}</span>`).join('')}
        </div>
        
        <div class="td-visual-row">
          <div class="td-chart">
            <div class="ec-label">${t('음악적 5대 성향','Five Musical Core Values','音楽の5大コア特性')}</div>
            <div class="td-chart-item">
              <div class="td-chart-label"><span>${t('멜로디 감수성 (Melody Focus)','Melody Sensitivity','メロディー感受性')}</span><span>${melody}%</span></div>
              <div class="td-chart-bar"><div class="td-chart-fill" style="width:${melody}%"></div></div>
            </div>
            <div class="td-chart-item">
              <div class="td-chart-label"><span>${t('리듬 & 비트 타격감 (Rhythm & Beat)','Rhythm & Beat Impact','リズム＆ビート打撃感')}</span><span>${rhythm}%</span></div>
              <div class="td-chart-bar"><div class="td-chart-fill" style="width:${rhythm}%"></div></div>
            </div>
            <div class="td-chart-item">
              <div class="td-chart-label"><span>${t('아날로그 감성 온도 (Acoustic Warmth)','Acoustic Sentiment','アナログ感性温度')}</span><span>${acoustic}%</span></div>
              <div class="td-chart-bar"><div class="td-chart-fill" style="width:${acoustic}%"></div></div>
            </div>
            <div class="td-chart-item">
              <div class="td-chart-label"><span>${t('일렉트로닉 에너지 (Electronic Energy)','Electronic Energy','エレクトロニックエネルギー')}</span><span>${electronic}%</span></div>
              <div class="td-chart-bar"><div class="td-chart-fill" style="width:${electronic}%"></div></div>
            </div>
            <div class="td-chart-item">
              <div class="td-chart-label"><span>${t('공간감과 몰입도 (Ambient Space & Depth)','Ambient Space & Depth','空間感と没入度')}</span><span>${spaceDepth}%</span></div>
              <div class="td-chart-bar"><div class="td-chart-fill" style="width:${spaceDepth}%"></div></div>
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:var(--space-4)">
            <div class="ec-label">${t('연결된 새로운 장르 추천','Connected Genres For You','あなたにおすすめの関連ジャンル')}</div>
            <div style="display:flex; flex-direction:column; gap:8px">
              ${finalRelatedG.map(g => `
                <a class="related-card" href="#genre/${g.id}" style="padding:10px">
                  <div class="rc-art" style="background:${artGradient(g.id)};width:36px;height:36px;display:grid;place-items:center;font-size:16px">${g.emoji}</div>
                  <div><div class="rc-name" style="font-size:13px">${t(g.nameKo,g.name,g.nameJa)}</div></div>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="section" style="margin-bottom: var(--space-5);">
          <div class="ec-label">${t('당신의 DNA에 매칭되는 숨겨진 명곡','Tracks Matching Your DNA','あなたのDNAにマッチする隠れた名曲')}</div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top:8px">
            ${finalRecSongs.map(s => `
              <div class="song-card" style="width:100%" onclick="playSong(${s.id})">
                ${artHTML(s)}
                <div class="sc-title" style="font-size:12px">${esc(s.title)}</div>
                <div class="sc-artist" style="font-size:10px">${esc(s.artist)}</div>
                <div class="sc-meta">${genreTagHTML(s.genre)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="display:flex; justify-content:flex-end; margin-top:var(--space-4)">
          <button class="btn-outlined" onclick="resetTaste()">${t('다시 분석하기','Retake Test','もう一度分析する')}</button>
        </div>
      </div>
    </div>
  `;
  root.innerHTML = html;
  applyLang();
}/* ===================== NOW PLAYING / VIBE ANALYZER ===================== */
let npState = { song:null, playing:false, elapsed:0, total:0, timer:null, volume:0.2 };

function getVibeData(song) {
  const hash = (song.id * 17) % 100;
  let tempo = 120;
  let energy = 70 + (hash % 25);
  let mood = 50 + (hash % 41) - 20;
  let organic = 15 + (hash % 70);
  
  if (song.genre === 'pop') {
    tempo = 100 + (hash % 30);
    organic = Math.max(10, organic - 20);
  } else if (song.genre === 'hiphop') {
    tempo = 80 + (hash % 20);
    energy = Math.max(70, energy);
    organic = Math.max(15, organic - 15);
  } else if (song.genre === 'rock') {
    tempo = 115 + (hash % 30);
    energy = Math.max(75, energy);
    organic = Math.max(30, organic + 10);
  } else if (song.genre === 'metal') {
    tempo = 135 + (hash % 40);
    energy = Math.max(85, energy + 10);
    organic = Math.min(25, organic / 2);
  } else if (song.genre === 'electronic') {
    tempo = 120 + (hash % 20);
    organic = Math.min(20, organic / 3);
  } else if (song.genre === 'rnb') {
    tempo = 70 + (hash % 30);
    organic = Math.max(40, organic + 15);
    energy = Math.min(75, energy);
  } else if (song.genre === 'jazz') {
    tempo = 60 + (hash % 50);
    organic = Math.max(70, organic + 30);
    energy = Math.min(60, energy - 10);
  } else if (song.genre === 'classical') {
    tempo = 50 + (hash % 80);
    organic = 95;
    energy = Math.min(50, energy - 20);
  } else if (song.genre === 'kpop') {
    tempo = 110 + (hash % 30);
    organic = Math.max(10, organic - 20);
    energy = Math.max(80, energy);
  } else if (song.genre === 'indie') {
    tempo = 90 + (hash % 40);
    organic = Math.max(45, organic + 15);
  } else if (song.genre === 'jpop') {
    tempo = 115 + (hash % 35);
    organic = Math.max(25, organic + 5);
    energy = Math.max(70, energy);
  }
  
  tempo = Math.round(tempo);
  energy = Math.min(100, Math.max(0, Math.round(energy)));
  mood = Math.min(100, Math.max(0, Math.round(mood)));
  organic = Math.min(100, Math.max(0, Math.round(organic)));

  const g = genreById(song.genre);
  const genreName = g ? t(g.nameKo, g.name, g.nameJa) : song.genre;
  
  let analysisKo = `이 곡은 ${song.year}년에 발표된 ${song.artist}의 작품으로, ${genreName} 장르 특유의 예술적 기법과 고유한 사운드가 돋보입니다. 템포는 ${tempo} BPM으로 안정적이면서도 리드미컬한 긴장감을 유지하며, ${energy}%의 높은 에너지 레벨을 바탕으로 곡의 테마를 힘 있게 전달합니다. 특히 전자 악기와 어쿠스틱 사운드의 비율이 적절히 조화를 이루어, 이 장르를 선호하는 이들의 취향에 아주 잘 부합하는 명곡입니다.`;
  let analysisEn = `Released in ${song.year} by ${song.artist}, this track is a stellar representation of the ${song.genre.toUpperCase()} genre. Clocking in at ${tempo} BPM, it strikes an elegant balance between rhythm and emotional depth. With an energy rating of ${energy}%, it drives its musical theme forward with absolute confidence. The mix showcases a ${organic}% acoustic texture blended with genre-defining elements, offering a rich soundscape for curious ears.`;
  let analysisJa = `この曲は${song.year}年にリリースされた${song.artist}の作品で、${genreName}ジャンル特有の芸術的な手法と独自のサウンドが際立っています。テンポは${tempo} BPMで、安定しながらもリズミカルな緊張感を維持し、${energy}%の高いエネルギーレベルをベースに曲의テーマを力強く表現しています。特に電子楽器とアコースティックサウンドのバランスが絶妙に調和しており、このジャンルを好むリスナーの感性に完璧にフィットする名曲です。`;

  return { tempo, energy, mood, organic, analysisKo, analysisEn, analysisJa };
}

function closeVibeAnalyzer(){
  document.getElementById('vibe-analyzer').classList.remove('open');
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.remove('vibe-open');
  }
}

function renderVibeAnalyzer(){
  const drawer = document.getElementById('vibe-analyzer');
  if(!npState.song){
    drawer.innerHTML = '';
    drawer.classList.remove('open');
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.classList.remove('vibe-open');
    }
    return;
  }
  const s = npState.song;
  const v = getVibeData(s);
  
  const cachedUrl = albumArtCache[s.id];
  const artStyleAttr = cachedUrl 
    ? `background-image: url('${cachedUrl}'); background-size: cover; background-position: center;` 
    : `background: ${artGradient(s.genre)};`;
  
  if (!cachedUrl) {
    fetchAndCacheAlbumArt(s);
  }
  
  let waveBars = '';
  const barCount = 25;
  for (let i = 0; i < barCount; i++) {
    const h = 8 + Math.round(Math.abs(Math.sin((i / barCount) * Math.PI * 2) * 16)) + (s.id * i % 6);
    waveBars += `<rect class="va-bar va-bar-${i}" x="${i * 7 + 2}" y="${16 - h/2}" width="4.5" height="${h}" rx="1.5"/>`;
  }

  drawer.innerHTML = `
    <div class="va-head">
      <h2>${t('바이브 분석기','Vibe Analyzer','バイブ分析器')}</h2>
      <button class="va-close" onclick="closeVibeAnalyzer()">${ICON.close}</button>
    </div>
    <div class="va-body">
      <div class="va-song-show">
        <div class="va-art-wrap" data-art-song-id="${s.id}" style="${artStyleAttr}">
          <div class="va-wave-glow"></div>
          <span style="opacity:0.8; ${cachedUrl ? 'display:none;' : ''}">${genreById(s.genre)?.emoji || '●'}</span>
        </div>
        <div class="va-title">${esc(s.title)}</div>
        <div class="va-artist"><a href="#artist/${encodeURIComponent(s.artist)}" onclick="closeVibeAnalyzer()" style="color:inherit; text-decoration:none; border-bottom:1px dashed var(--text-secondary); cursor:pointer;">${esc(s.artist)}</a></div>
        <div style="margin-top:6px">${genreTagHTML(s.genre)}</div>
      </div>
      
      <div class="va-player-ctrl">
        <div class="vap-row">
          <span class="vap-time" id="va-elapsed">0:00</span>
          <svg class="va-wave-svg" id="va-wave" onclick="seekWave(event)" viewBox="0 0 180 32">
            ${waveBars}
          </svg>
          <span class="vap-time">${s.duration}</span>
        </div>
        
        <div class="player-btns-row">
          <button class="player-btn ${isShuffle?'active':''}" id="va-shuffle-btn" onclick="toggleShuffle()" title="${t('셔플','Shuffle','シャッフル')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          </button>
          <button class="player-btn" onclick="prevSong()" title="${t('이전 곡','Previous','前の曲')}">${ICON.prev}</button>
          <button class="player-btn play-toggle" onclick="togglePlay()" id="va-play-btn" title="${t('재생/일시정지','Play/Pause','再生/一時停止')}">
            ${npState.playing?ICON.pause:ICON.play}
          </button>
          <button class="player-btn" onclick="nextSong()" title="${t('다음 곡','Next','次の曲')}">${ICON.next}</button>
          <button class="player-btn ${isRepeat?'active':''}" id="va-repeat-btn" onclick="toggleRepeat()" title="${t('반복','Repeat','リピート')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </button>
        </div>
        
        <div class="vap-volume-row" style="display:flex; align-items:center; gap:8px; width:100%; margin-top:4px; justify-content:center;">
          <span style="opacity:0.6; display:flex; align-items:center;">${ICON.volume}</span>
          <input type="range" class="vol-slider" min="0" max="100" value="${Math.round(npState.volume*100)}" oninput="changeVolume(this.value)" title="${t('볼륨','Volume','音量')}">
        </div>
      </div>
 
      <div class="va-meta-info" style="display:flex; justify-content:space-around; gap:16px; width:100%; border-bottom:1px solid var(--border-subtle); padding-bottom:var(--space-3); margin-bottom:-8px; font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">
        <div>${t('발매일','Released','リリース')}: <strong>${s.year}</strong></div>
        <div>${t('누적 재생','Streams','再生回数')}: <strong>${fmtListeners(s.streamCount)}</strong></div>
      </div>
 
      <div class="va-stats">
        <div class="va-stat-row">
          <div class="va-stat-lbl"><span>${t('에너지 (Energy)','Energy','エネルギー (Energy)')}</span><span>${v.energy}%</span></div>
          <div class="va-stat-track"><div class="va-stat-fill" style="width:${v.energy}%"></div></div>
        </div>
        <div class="va-stat-row">
          <div class="va-stat-lbl"><span>${t('템포 (Tempo)','Tempo','テンポ (Tempo)')}</span><span>${v.tempo} BPM</span></div>
          <div class="va-stat-track"><div class="va-stat-fill" style="width:${(v.tempo - 40) / 140 * 100}%"></div></div>
        </div>
        <div class="va-stat-row">
          <div class="va-stat-lbl"><span>${t('어쿠스틱 감성 (Acoustic)','Acoustic Warmth','アコースティック感性 (Acoustic)')}</span><span>${v.organic}%</span></div>
          <div class="va-stat-track"><div class="va-stat-fill" style="width:${v.organic}%"></div></div>
        </div>
        <div class="va-stat-row">
          <div class="va-stat-lbl"><span>${t('감정 온도 (Mood)','Emotional Mood','感情のムード (Mood)')}</span><span>${v.mood > 60 ? t('쾌활함/밝음','Bright/Happy','明るい/エネルギッシュ') : t('차분함/어두움','Calm/Moody','穏やか/メランコリー')} (${v.mood}%)</span></div>
          <div class="va-stat-track"><div class="va-stat-fill" style="width:${v.mood}%"></div></div>
        </div>
      </div>
 
      <div class="va-anal-text">
        ${t(v.analysisKo, v.analysisEn, v.analysisJa)}
      </div>
 
      <div class="va-lyrics-card" style="background:#0a0a0a; border:1px solid var(--border-subtle); padding:var(--space-4); border-radius:0px; display:flex; flex-direction:column; gap:8px;">
        <div style="font-family:var(--font-mono); font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${t('실시간 가사 (지원 예정)','Lyrics (Coming Soon)','リアルタイム歌詞 (対応予定)')}</div>
        <div style="font-size:12px; line-height:1.6; color:var(--text-secondary); opacity:0.65; white-space:pre-line;">
          ${t('이 장르의 대표 명곡 가사 및 분석 서비스가 준비 중입니다.','Lyrics and real-time synchronized vocals are coming soon for this track.','このジャンルの名曲の歌詞および分析サービスを準備中です。')}
        </div>
      </div>
    </div>`;
  
  drawer.classList.add('open');
  const appContainer = document.querySelector('.app-container');
  if (appContainer) {
    appContainer.classList.add('vibe-open');
  }
  updateProgress();
}

function playAudio(url) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentAudio = new Audio(url);
  currentAudio.volume = npState.volume;
  currentAudio.play().catch(err => {
    console.log("Audio playback failed (interaction required or invalid URL):", err);
  });
  
  currentAudio.addEventListener('timeupdate', () => {
    if (currentAudio && npState.playing && npState.song) {
      npState.elapsed = currentAudio.currentTime;
      npState.total = currentAudio.duration || durToSec(npState.song.duration);
      updateProgress();
    }
  });
  
  currentAudio.addEventListener('ended', () => {
    nextSong();
  });
}

function playSong(id){
  const song = SONGS.find(s=>s.id===id);
  if(!song) return;
  
  if (isShuffle) {
    if (shuffleQueue.length === 0) {
      initShuffleQueue();
    }
    const sIdx = shuffleQueue.findIndex(s => s.id === id);
    if (sIdx > -1) {
      shuffleIndex = sIdx;
    }
  }
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  npState.song = song;
  npState.total = durToSec(song.duration);
  npState.elapsed = 0;
  npState.playing = true;
  renderVibeAnalyzer();
  startTimer();
  
  const previewUrl = song.previewUrl || audioPreviewCache[song.id];
  if (previewUrl) {
    playAudio(previewUrl);
  } else {
    fetchAndCacheAlbumArt(song, true);
  }
}

let visualizerInterval = null;
let isShuffle = false;
let isRepeat = false;
let shuffleQueue = [];
let shuffleIndex = -1;

function initShuffleQueue() {
  shuffleQueue = [...SONGS].sort(() => 0.5 - Math.random());
  if (npState.song) {
    shuffleIndex = shuffleQueue.findIndex(s => s.id === npState.song.id);
  } else {
    shuffleIndex = 0;
  }
}

function startVisualizer() {
  stopVisualizer();
  if (!npState.playing || !npState.song) return;
  
  const barCount = 25;
  const s = npState.song;
  
  visualizerInterval = setInterval(() => {
    const wave = document.getElementById('va-wave');
    if (!wave) return;
    for (let i = 0; i < barCount; i++) {
      const bar = wave.querySelector(`.va-bar-${i}`);
      if (bar) {
        const baseH = 8 + Math.round(Math.abs(Math.sin((i / barCount) * Math.PI * 2) * 16)) + (s.id * i % 6);
        const randOffset = Math.sin(Date.now() / 150 + i) * 6 * Math.random();
        const h = Math.max(4, Math.min(32, baseH + randOffset));
        bar.setAttribute('height', h);
        bar.setAttribute('y', 16 - h / 2);
      }
    }
  }, 75);
}

function stopVisualizer() {
  if (visualizerInterval) {
    clearInterval(visualizerInterval);
    visualizerInterval = null;
  }
  const wave = document.getElementById('va-wave');
  if (wave && npState.song) {
    const barCount = 25;
    const s = npState.song;
    for (let i = 0; i < barCount; i++) {
      const bar = wave.querySelector(`.va-bar-${i}`);
      if (bar) {
        const h = 8 + Math.round(Math.abs(Math.sin((i / barCount) * Math.PI * 2) * 16)) + (s.id * i % 6);
        bar.setAttribute('height', h);
        bar.setAttribute('y', 16 - h / 2);
      }
    }
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById('va-shuffle-btn');
  if (btn) btn.classList.toggle('active', isShuffle);
  if (isShuffle) {
    initShuffleQueue();
  }
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  const btn = document.getElementById('va-repeat-btn');
  if (btn) btn.classList.toggle('active', isRepeat);
}

function changeVolume(val) {
  npState.volume = val / 100;
  if (currentAudio) {
    currentAudio.volume = npState.volume;
  }
}

function togglePlay(){
  if(!npState.song) return;
  npState.playing = !npState.playing;
  
  if(npState.playing) {
    if (currentAudio) {
      currentAudio.play().catch(err => console.log("Audio play failed:", err));
    } else {
      const previewUrl = npState.song.previewUrl || audioPreviewCache[npState.song.id];
      if (previewUrl) {
        playAudio(previewUrl);
      } else {
        fetchAndCacheAlbumArt(npState.song, true);
      }
    }
    startTimer();
  } else {
    if (currentAudio) {
      currentAudio.pause();
    }
    stopTimer();
  }
  
  const btn = document.getElementById('va-play-btn');
  if(btn) btn.innerHTML = npState.playing ? ICON.pause : ICON.play;
}

function startTimer(){
  stopTimer();
  npState.timer = setInterval(()=>{
    if (currentAudio) {
      if (currentAudio.ended) {
        nextSong();
      }
      return;
    }
    if(npState.elapsed >= npState.total){ nextSong(); return; }
    npState.elapsed++;
    updateProgress();
  }, 1000);
  startVisualizer();
}

function stopTimer(){ 
  if(npState.timer){ clearInterval(npState.timer); npState.timer=null; } 
  stopVisualizer();
}

function stepSong(dir){
  if(!npState.song) return;
  if(isRepeat && dir > 0) {
    playSong(npState.song.id);
    return;
  }
  if(isShuffle) {
    if (shuffleQueue.length === 0) {
      initShuffleQueue();
    }
    shuffleIndex = (shuffleIndex + dir + shuffleQueue.length) % shuffleQueue.length;
    const nextS = shuffleQueue[shuffleIndex];
    if (nextS) {
      playSong(nextS.id);
    }
    return;
  }
  const idx = SONGS.findIndex(s=>s.id===npState.song.id);
  const next = SONGS[(idx + dir + SONGS.length) % SONGS.length];
  playSong(next.id);
}
function nextSong(){ stepSong(1); }
function prevSong(){
  if(npState.elapsed > 3){ 
    npState.elapsed=0; 
    if (currentAudio) {
      currentAudio.currentTime = 0;
    }
    updateProgress(); 
    return; 
  }
  stepSong(-1);
}

function updateProgress(){
  const el = document.getElementById('va-elapsed');
  if(el) el.textContent = secToDur(npState.elapsed);
  
  const wave = document.getElementById('va-wave');
  if(wave){
    const pct = npState.elapsed / npState.total;
    const barCount = 25;
    const activeIndex = Math.floor(pct * barCount);
    for (let i = 0; i < barCount; i++) {
      const bar = wave.querySelector(`.va-bar-${i}`);
      if(bar){
        if (i <= activeIndex) {
          bar.setAttribute('fill', 'var(--accent-cyan)');
        } else {
          bar.setAttribute('fill', 'rgba(255, 255, 255, 0.15)');
        }
      }
    }
  }
}

function seekWave(e){
  const r = document.getElementById('va-wave').getBoundingClientRect();
  const targetSec = Math.round((e.clientX-r.left)/r.width*npState.total);
  npState.elapsed = targetSec;
  if (currentAudio) {
    currentAudio.currentTime = targetSec;
  }
  updateProgress();
}

/* ===================== INIT ===================== */
document.getElementById('nav-back').onclick = ()=>history.back();
document.getElementById('nav-fwd').onclick = ()=>history.forward();
document.getElementById('main-content').addEventListener('scroll', e=>{
  document.getElementById('global-header').classList.toggle('scrolled', e.target.scrollTop > 12);
});
renderNav();
applyLang();
handleRoute();

// Expose functions and setters to window for inline HTML handlers
window.setGenreSort = (val) => { genreSort = val; };
Object.assign(window, { saveAlbumArtCache, fetchAndCacheAlbumArt, updateArtworkElements, fmtListeners, durToSec, secToDur, artGradient, artHTML, genreTagHTML, avatarColor, handleRoute, renderNav, updateActiveNav, setLanguage, applyLang, songCardHTML, featuredGenreCardHTML, renderHome, renderGenres, genreGridCardHTML, renderGenreDetail, homeEraCardHTML, eraCardHTML, renderTimeline, registerDynamicSong, fetchArtistSongsFromITunes, renderArtistDetail, runAISuggest, renderSearch, onSearchInput, quickSearch, renderTaste, toggleTasteGenre, selectTasteVibe, selectTasteEra, selectTasteSoundFocus, selectTasteHabitat, nextTasteStep, prevTasteStep, calculateTasteDNA, resetTaste, renderTasteResult, getVibeData, closeVibeAnalyzer, renderVibeAnalyzer, playAudio, playSong, initShuffleQueue, startVisualizer, stopVisualizer, toggleShuffle, toggleRepeat, changeVolume, togglePlay, startTimer, stopTimer, stepSong, nextSong, prevSong, updateProgress, seekWave });
