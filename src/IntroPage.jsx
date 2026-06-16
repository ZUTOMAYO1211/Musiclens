import { useState, useEffect, useRef } from 'react';
import Dither from './Dither';
import './intro.css';

const CONTENT = {
  ko: {
    badge: 'MusicLens 프롤로그',
    title: '음악의 새로운 차원을\n발견하다',
    desc: '뮤직렌즈(MusicLens)는 모든 음악 장르와 연대기를 탐험하고,\n곡 고유의 사운드 바이브를 시각 분석하여\n당신만의 특별한 음악 취향을 찾아내는 공간입니다.',
    feat1Title: '16+ 장르 탐색',
    feat1Sub: '역사 및 교차 분석',
    feat2Title: '연대기 타임라인',
    feat2Sub: '1950s - 2020s 여정',
    feat3Title: '사운드 바이브',
    feat3Sub: '실시간 특성 분석',
    cta: '탐험 시작하기',
    techText: 'HTML5 · CSS3 · React · ThreeJS'
  },
  en: {
    badge: 'MusicLens Prologue',
    title: 'Discover a New\nDimension of Music',
    desc: 'MusicLens is an interactive platform designed to help you\nexplore music genres, trace historical timelines, and analyze track vibes\nto decode your unique musical taste.',
    feat1Title: '16+ Genres',
    feat1Sub: 'History & cross-reads',
    feat2Title: 'Decades Journey',
    feat2Sub: '1950s to 2020s',
    feat3Title: 'Vibe Analyzer',
    feat3Sub: 'Visual sound stats',
    cta: 'Start Exploring',
    techText: 'HTML5 · CSS3 · React · ThreeJS'
  },
  ja: {
    badge: 'MusicLens プロローグ',
    title: '音楽の新しい次元を\n発見する',
    desc: 'MusicLens（ミュージックレンズ）は、すべての音楽ジャンルと年代記を探索し、\n曲独自のサウンドバイブを視覚的に分析して、\nあなただけの特別な音楽の好みを見つけ出す空間です。',
    feat1Title: '16+ ジャンル探索',
    feat1Sub: '歴史と相互分析',
    feat2Title: '年代記タイムライン',
    feat2Sub: '1950s - 2020s の旅',
    feat3Title: 'サウンドバイブ',
    feat3Sub: 'リアルタイム特性分析',
    cta: '探索を始める',
    techText: 'HTML5 · CSS3 · React · ThreeJS'
  }
};

export default function IntroPage() {
  const [lang, setLang] = useState('ko');
  const [isDragging, setIsDragging] = useState(false);
  const t = CONTENT[lang];

  // Helper to format line breaks with desktop-only tags
  const formatText = (text) => {
    return text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br className="desktop-only-br" />}
      </span>
    ));
  };

  // Ref positions for smooth physics tracking
  const cardRef = useRef(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const animFrameId = useRef(null);

  // Easing/physics animation loop
  const updatePhysics = () => {
    const lerpFactor = 0.08; // Lower = more fluid inertia / slide duration
    const dx = targetPos.current.x - currentPos.current.x;
    const dy = targetPos.current.y - currentPos.current.y;

    // Snapping threshold
    if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
      currentPos.current = { ...targetPos.current };
      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
      }
      animFrameId.current = null;
      return;
    }

    currentPos.current.x += dx * lerpFactor;
    currentPos.current.y += dy * lerpFactor;

    if (cardRef.current) {
      cardRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`;
    }

    animFrameId.current = requestAnimationFrame(updatePhysics);
  };

  const handleMove = (clientX, clientY) => {
    targetPos.current = {
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y
    };

    if (!animFrameId.current) {
      animFrameId.current = requestAnimationFrame(updatePhysics);
    }
  };

  // Prevent right-click context menu globally
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Handle global mouse/touch movement when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleDragStart = (clientX, clientY, target) => {
    // Prevent dragging when clicking interactive elements
    if (
      target.closest('.cta-button') ||
      target.closest('.lang-switch') ||
      target.closest('.intro-logo') ||
      target.closest('.lang-btn')
    ) {
      return;
    }
    setIsDragging(true);
    dragStart.current = {
      x: clientX - targetPos.current.x,
      y: clientY - targetPos.current.y
    };
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Only drag with left click
    handleDragStart(e.clientX, e.clientY, e.target);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  };

  return (
    <div className="intro-container">
      {/* Interactive Dither Wave Background */}
      <div className="dither-bg-wrapper">
        <Dither
          waveColor={[0.1176, 0.8431, 0.3765]} // Spotify Green: #1ed760
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.35}
          colorNum={4}
          waveAmplitude={0.25}
          waveFrequency={2.5}
          waveSpeed={0.04}
          pixelSize={2}
        />
      </div>

      {/* Foreground UI Layer */}
      <div className="intro-ui-layer">
        
        {/* Header */}
        <header className="intro-header">
          <a href="#" className="intro-logo interactive" onClick={(e) => e.preventDefault()}>
            <div className="logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <span className="logo-text">MusicLens</span>
          </a>

          {/* Bilingual Switcher */}
          <div className="lang-switch interactive">
            <button 
              className={`lang-btn ${lang === 'ko' ? 'active' : ''}`} 
              onClick={() => setLang('ko')}
            >
              KO
            </button>
            <button 
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`} 
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${lang === 'ja' ? 'active' : ''}`} 
              onClick={() => setLang('ja')}
            >
              JA
            </button>
          </div>
        </header>

        {/* Hero Welcome Card */}
        <main className="intro-hero-wrapper">
          <div 
            ref={cardRef}
            className={`intro-card interactive ${isDragging ? 'dragging' : ''}`}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={{ transform: `translate(${currentPos.current.x}px, ${currentPos.current.y}px)` }}
          >
            <div className="badge">
              <span className="badge-pulse"></span>
              {t.badge}
            </div>

            <h1 className="intro-title">{formatText(t.title)}</h1>
            <p className="intro-desc">{formatText(t.desc)}</p>

            {/* Features Preview Grid */}
            <div className="features-grid">
              <div className="feature-item">
                <span className="feat-emoji" style={{ color: "#a55abf" }}>♬</span>
                <div>
                  <div className="feat-title">{t.feat1Title}</div>
                  <div className="feat-sub">{t.feat1Sub}</div>
                </div>
              </div>
              <div className="feature-item">
                <span className="feat-emoji" style={{ color: "#d1a153" }}>⧗</span>
                <div>
                  <div className="feat-title">{t.feat2Title}</div>
                  <div className="feat-sub">{t.feat2Sub}</div>
                </div>
              </div>
              <div className="feature-item">
                <span className="feat-emoji" style={{ color: "#56a38b" }}>▰</span>
                <div>
                  <div className="feat-title">{t.feat3Title}</div>
                  <div className="feat-sub">{t.feat3Sub}</div>
                </div>
              </div>
            </div>

            {/* CTA Enter Button */}
            <a href="index.html" className="cta-button">
              {t.cta}
              <svg className="cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="intro-footer">
          <div>{t.techText}</div>
          <div className="footer-links">
            <span className="footer-copyright">© {new Date().getFullYear()} MusicLens.</span>
          </div>
        </footer>
        
      </div>
    </div>
  );
}
