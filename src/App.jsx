import { useEffect, useRef, useState } from 'react';
import Lanyard from './components/Lanyard';
import TechText from './components/TechText';
import Folder from './components/Folder';
import TiltedCard, { TiltedCardLayer } from './components/TiltedCard';
import DockNav from './components/DockNav';
import BubbleMenu from './components/BubbleMenu';
import LogoLoop from './components/LogoLoop';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiNodedotjs, SiGit, SiJavascript, SiHtml5, SiCss, SiFigma, SiLaravel } from 'react-icons/si';
import './App.css';
import Myjourney from './components/Myjourney';
import Contact from './components/Contact';



const TABS = [
  {
    id: 'projek',
    label: 'Projek',
    color: '#C8F31D',
    paperColor: '#ffffff',
    items: [
      { title: 'Landing Page' },
      { title: 'Dashboard UI' },
      { title: 'Mobile App' },
      { title: 'E-Commerce' },
      { title: 'API Integration' },
      { title: 'React Portfolio' },
    ],
  },
  {
    id: 'sertifikat',
    label: 'Sertifikat',
    color: '#C8F31D',
    paperColor: '#ffffff',
    items: [
      { title: 'Web Development' },
      { title: 'UI/UX Design' },
      { title: 'React Course' },
      { title: 'Node.js Bootcamp' },
      { title: 'Figma Mastery' },
      { title: 'Git & GitHub' },
    ],
  },
];

function ProjectFolder() {
  const [active, setActive] = useState('projek');
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('left');

  const handleTab = (id) => {
    if (id === active || animating) return;
    setDirection(id === 'sertifikat' ? 'left' : 'right');
    setAnimating(true);
    setTimeout(() => {
      setActive(id);
      setAnimating(false);
    }, 300);
  };

  const tab = TABS.find(t => t.id === active);

  return (
    <div className="folder-tabs-wrap">
      {/* Tab switcher */}
      <div className="folder-tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`folder-tab-btn${active === t.id ? ' active' : ''}`}
            onClick={() => handleTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        {/* Sliding indicator */}
        <span
          className="folder-tab-indicator"
          style={{ transform: `translateX(${active === 'projek' ? '0%' : '100%'})` }}
        />
      </div>

      {/* Folder dengan animasi slide */}
      <div className={`folder-slide-wrap${animating ? ` slide-out-${direction}` : ''}`}>
        <Folder
          label={tab.label}
          items={tab.items}
          mode="flap"
          variant="solid"
          color={tab.color}
          paperColor={tab.paperColor}
          tabPosition="right"
          openOn="click"
          size={1.3}
          bounce={0.4}
          peek intro draggable zoomOnClick
          theme="dark"
        />
      </div>
    </div>
  );
}

export default function App() {
  const aboutRef   = useRef(null);
  const titleRef   = useRef(null);
  const nameRef    = useRef(null);
  const roleRef    = useRef(null);
  const sidebarRef = useRef(null);
  const section3Ref = useRef(null);
  const pathRef     = useRef(null);
  const [inSection2, setInSection2] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // Scroll to top on load
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const navbar  = document.getElementById('navbar');
    const about   = aboutRef.current;
    const title   = titleRef.current;
    const nameEl  = nameRef.current;
    const roleEl  = roleRef.current;
    const sidebar = sidebarRef.current;

    // Color interpolation
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpAlpha = (base, t) => base + (1 - base) * t * 0.6;
    const colorFrom = { r: 10, g: 10, b: 10 };
    const colorTo   = { r: 27, g: 44, b: 193 };
    const lerpColor = (from, to, t) =>
      `rgb(${Math.round(lerp(from.r,to.r,t))},${Math.round(lerp(from.g,to.g,t))},${Math.round(lerp(from.b,to.b,t))})`;

    // ── Walk path — static, no animation yet ──────────────

    const onScroll = () => {
      if (!about) return;
      const rect = about.getBoundingClientRect();

      // Navbar scrolled
      navbar?.classList.toggle('scrolled', window.scrollY > 30);

      // Deteksi masuk section 2 → ganti nav ke BubbleMenu
      const aboutTop = aboutRef.current?.offsetTop ?? 0;
      setInSection2(window.scrollY >= aboutTop - 80);

      // Border radius
      about.style.borderRadius = rect.top <= 0 ? '0' : '40px 40px 0 0';

      // Color interpolation
      const start = window.innerHeight, end = window.innerHeight * 0.4;
      let t = 0;
      if (rect.top <= start) t = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

      if (nameEl) nameEl.style.color = lerpColor(colorFrom, colorTo, t);
      if (roleEl) roleEl.style.color = `rgba(${Math.round(lerp(10,27,t))},${Math.round(lerp(10,44,t))},${Math.round(lerp(10,193,t))},${lerpAlpha(0.55,t).toFixed(2)})`;

      // Sidebar invert
      sidebar?.classList.toggle('inverted', rect.top < window.innerHeight * 0.5);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // ── One-time path drawing Section 3 ──
    const initPath = () => {
      const path = pathRef.current;
      if (!path) return;
      try {
        const len = path.getTotalLength();
        path.style.strokeDasharray  = `${len}`;
        path.style.strokeDashoffset = `${len}`;
        path.dataset.len = `${len}`;
      } catch(e) {}
    };
    requestAnimationFrame(initPath);

    let hasAnimated = false;
    let rafId = null;

    const runAnimation = () => {
      if (hasAnimated) return;
      hasAnimated = true;

      const path = pathRef.current;
      if (!path) return;
      const len = parseFloat(path.dataset.len) || 0;
      if (!len) return;

      const duration = 2200; // ms — sesuaikan kecepatan
      const start = performance.now();

      const tick = (now) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-in-out cubic
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        path.style.strokeDashoffset = `${len * (1 - eased)}`;

        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          path.style.strokeDashoffset = '0'; // pastikan selesai penuh
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // Trigger saat section 3 masuk viewport
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          runAnimation();
        }
      },
      { threshold: 0.05 }
    );

    if (section3Ref.current) observer.observe(section3Ref.current);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* ── NAVBAR: DockNav section 1, BubbleMenu section 2+ ── */}
      {!inSection2 ? (
        <DockNav />
      ) : (
        <BubbleMenu
          useFixedPosition
          menuBg="#ffffff"
          menuContentColor="#111111"
          menuAriaLabel="Toggle navigation"
          animationEase="back.out(1.5)"
          animationDuration={0.5}
          staggerDelay={0.12}
          items={[
            { label: 'home',       href: '#home',       ariaLabel: 'Home',       rotation: -8, hoverStyles: { bgColor: '#1B2CC1', textColor: '#ffffff' } },
            { label: 'about',      href: '#about',      ariaLabel: 'About',      rotation:  8, hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' } },
            { label: 'project',    href: '#project',    ariaLabel: 'Project',    rotation:  8, hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' } },
            { label: 'my journey', href: '#myjourney',  ariaLabel: 'My Journey', rotation: -8, hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' } },
            { label: 'Contackt', href: '#Contact',  ariaLabel: 'Contact', rotation: -8, hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' } },
          ]}
        />
      )}

      {/* ── SECTION 1: HERO (fixed) ── */}
      <section className="hero" id="home">
        <div className="hero-bg"></div>
        <div className="hero-grid"></div>

        {/* Social sidebar — hanya di section 1 */}
        <aside className="social-sidebar" ref={sidebarRef}>
          <a href="https://www.instagram.com/ragil.suanda?mdxt=MXhhaHNuYXZlendweQ==" className="social-item" aria-label="Instagram" data-tooltip="Instagram">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://www.tiktok.com/@wkkwkwkwwkwkw?_r=1&_t=ZS-9BL2BWUEyzR" className="social-item" aria-label="TikTok" data-tooltip="TikTok">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>
          </a>
          <a href="https://github.com/ragilsuanda" className="social-item" aria-label="GitHub" data-tooltip="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/ragil-suanda-8a460829b?utm_source=share_via&utm_content=profile&utm_medium=member_android" className="social-item" aria-label="LinkedIn" data-tooltip="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </aside>

        <div className="hero-content">
          <div className="hero-layout">
            <div className="hero-title-wrapper">
              <div className="hero-title-canvas" ref={titleRef}>
                <TechText
                  text="Portofolio"
                  fontFamily="'Bagel Fat One', cursive"
                  fontWeight={400}
                  fontSize={160}
                  letterSpacing={-0.01}
                  color="#1B2CC1"
                  accentColor="#0a0a0a"
                  align="center"
                  reach={180}
                  softness={0.6}
                  reveal="letter"
                  specks={12}
                  selection
                  draggable
                  clickKick
                  bounce={0.5}
                  sweep
                  speed={0.8}
                  intro="assemble"
                  introDuration={1.8}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
            <div className="hero-bottom-row">
              <div className="hero-text">
                <div className="hero-identity">
                  <span className="hero-name" ref={nameRef}>Ragil Suanda</span>
                  <span className="hero-role" ref={roleRef}>/ Life In Tech</span>
                </div>
              </div>
              <div className="spotify-card">
                <div className="spotify-header">
                  <svg className="spotify-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.316a.75.75 0 01-1.032.244c-2.827-1.727-6.39-2.118-10.586-1.161a.75.75 0 01-.334-1.462c4.588-1.048 8.523-.597 11.708 1.347a.75.75 0 01.244 1.032zm1.472-3.276a.937.937 0 01-1.288.308c-3.236-1.988-8.168-2.565-11.996-1.403a.937.937 0 01-.546-1.793c4.374-1.33 9.811-.686 13.522 1.6a.937.937 0 01.308 1.288zm.127-3.41C15.32 8.39 9.26 8.188 5.7 9.266a1.124 1.124 0 11-.652-2.151c4.124-1.25 10.983-1.008 15.313 1.596a1.124 1.124 0 01-1.246 1.87z"/>
                  </svg>
                  <span className="spotify-label">Now Playing</span>
                </div>
                <iframe
                  src="https://open.spotify.com/embed/playlist/2rCfsysNgzpsQItkCGV2rL?utm_source=generator&theme=0"
                  width="100%" height="152" frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: '14px', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="hero-spacer"></div>

      {/* ── SECTION 2: ABOUT + LANYARD ── */}
      <section className="about" id="about" ref={aboutRef}>

        {/* Dekorasi dua bulatan kanan atas */}
        <div className="about-deco">
          <div className="about-deco-circle circle-1"></div>
          <div className="about-deco-circle circle-2"></div>
        </div>

        {/* Lanyard — position fixed, bebas nimpa ke mana saja */}
        <div className="lanyard-col">
         <Lanyard
  frontImage="/images/1.jpeg"
  cardColor="#ffffff"
  strapColor="#C8F31D"
  strapText="-RAGIL SUANDA-"
  strapTextColor="#1B2CC1"
  strapWidth={0.6}
  finish="glossy"
  orientation="portrait"
  cornerRadius={0.3}
  size={0.55}
  anchor="center"
  strapLength={0.6}
  metal="silver"
  gravity={1}
  damping={0.5}
  elasticity={0.5}
  breeze={0.4}
  interactive
  intro
/>
        </div>

        {/* Konten about — di kanan, tidak terpengaruh lanyard */}
        <div className="about-container">
        <h2 className="about-title">About <span className="about-title-white">Me</span></h2>
          <p className="about-desc">
           Hi, I'm Ragil Suanda. I have a strong interest in technology, especially web development, programming, graphic design, computer networking, and other areas of the digital world.

I enjoy learning new things, exploring creative ideas, and turning them into something useful. I'm passionate about building websites that are visually appealing, responsive, and easy to use. For me, every project is an opportunity to gain experience, improve my skills, and keep growing.
          </p>
          <a href="images/cvragilsuanda.pdf" download className="btn-download-cv">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download CV
          </a>
          </div>

      </section>

      <section className="logoloop-section" id="techstack">
        <div className="logoloop-wrapper">
          <div className="logoloop-container">
            <LogoLoop
              logos={[
                { node: <SiReact style={{color:'#C8F31D'}} />,       title: 'React',        hoverColor: '#C8F31D' },
                { node: <SiJavascript style={{color:'#C8F31D'}} />,  title: 'JavaScript',   hoverColor: '#C8F31D' },
                { node: <SiTypescript style={{color:'#C8F31D'}} />,  title: 'TypeScript',   hoverColor: '#C8F31D' },
                { node: <SiNextdotjs style={{color:'#C8F31D'}} />,   title: 'Next.js',      hoverColor: '#C8F31D' },
                { node: <SiNodedotjs style={{color:'#C8F31D'}} />,   title: 'Node.js',      hoverColor: '#C8F31D' },
                { node: <SiTailwindcss style={{color:'#C8F31D'}} />, title: 'Tailwind CSS', hoverColor: '#C8F31D' },
                { node: <SiHtml5 style={{color:'#C8F31D'}} />,       title: 'HTML5',        hoverColor: '#C8F31D' },
                { node: <SiCss style={{color:'#C8F31D'}} />,         title: 'CSS3',         hoverColor: '#C8F31D' },
                { node: <SiGit style={{color:'#C8F31D'}} />,         title: 'Git',          hoverColor: '#C8F31D' },
                { node: <SiFigma style={{color:'#C8F31D'}} />,       title: 'Figma',        hoverColor: '#C8F31D' },
                { node: <SiLaravel style={{color:'#C8F31D'}} />,     title: 'Laravel',      hoverColor: '#C8F31D' },
              ]}
              speed={80}
              direction="left"
              logoHeight={40}
              gap={64}
              hoverSpeed={0}
              scaleOnHover
              fadeOut={false}
              labels="hover"
              intro
              ariaLabel="Tech stack"
            />
          </div>
          <h2 className="logoloop-label">Tech Stack </h2>
        </div>
      </section>


      <section className="sectionp" id="project">
        <div className="sectionp-wrapper">
          <div className="sectionp-container">
            {/* Projects & Certificates Content */}
            <div className="projects-certificates-content">
              {/* Kolom Kiri */}
              <div className="left-column">
                {/* Title (tanpa container) */}
                <h2 className="projects-main-title">
                  MY<br />
                  <span className='colornameprojek'>PROJECTS</span><br />
                  GALLERY
                </h2>

              {/* Certificate Placeholder dengan Folder */}
                <div className="certificate-placeholder">
                  <Folder
  label="Certificates"
  items={[
  { title: 'Invest festival',  subtitle: 'invest • 2022', image: '/images/certs/2.jpg',  link: 'https://drive.google.com/file/d/1dcbzZGrz4FXrV_nFQXh3yM_0URPMl58a/view?usp=sharing' },
  { title: 'Web Development',     subtitle: 'Haktiv 5 • 2023', image: '/images/certs/aktif.jpg',     link: 'https://drive.google.com/file/d/1YZ_CqgyrBKex78NoclRnByuzx-fH1jjC/view?usp=sharing' },
  { title: 'Kader Dakwah Mahasiswa',     subtitle: 'LAIK UMRI • 2022', image: '/images/certs/3.jpg',    link: 'https://drive.google.com/file/d/1SgtmIGmdbxFNMCrwI-doRc4mYnkpkv2L/view?usp=sharing', linkLabel: 'Verifikasi' },
  { title: 'System Analyst', subtitle: 'BNSP • 2025', image: '/images/certs/4.jpg', link: 'https://drive.google.com/file/d/1SaXxFr56Q89HbY19YGOUpMX4XduIrJ--/view?usp=sharing' },
  { title: 'TOEFL',    subtitle: 'TOEFL • 2026', image: '/images/certs/5.jpg',   link: 'https://drive.google.com/file/d/1IwkeGhBpiDf-p5YFRW1x94jCOI14bpL3/view?usp=sharing' },
]}
  mode="flap"
  variant="solid"
  color="#C8F31D"
  paperColor="#ffffff"
  tabPosition="right"
  openOn="click"
  size={1.1}
  bounce={0.4}
  peek
  intro
  draggable={!isMobile}
  zoomOnClick
  theme="light"
/>
                </div>
              </div>

              {/* Kolom Kanan - Project Grid 2x2 (4 cards) + See More */}
              <div className="right-column">
                <div className="project-grid-2x2">
                  {[
                    {
                      img: '/images/projek/1.png',
                      title: 'Workshop-Inventory-System',
                      desc: 'A web-based system designed to manage workshop activities and inventory, including product stock monitoring, item management, transaction recording, and workshop operational management.',
                      liveUrl: 'https://worksoperza.fwh.is/',
                      codeUrl: 'https://github.com/ragilsuanda/Workshop-Inventory-System',
                    },
                    {
                      img: '/images/projek/2.png',
                      title: 'Serunai – Batik Website',
                      desc: 'A modern, responsive e-commerce website showcasing Indonesia’s traditional batik collections',
                      liveUrl: 'https://serunai.wasmer.app/',
                      codeUrl: 'https://github.com/ragilsuanda/marketplace-batik',
                    },
                    {
                      img:'/images/projek/3.png',
                      title: 'Website-Anti-Bullying-Awareness-Platform',
                      desc: 'A web-based platform designed to raise awareness about bullying, provide educational information, share prevention tips, and offer resources to help victims understand and address bullying.',
                      liveUrl: 'https://besafe.freepage.cc/',
                      codeUrl: 'https://github.com/ragilsuanda/Website-Anti-Bullying-Awareness-Platform',
                    },
                    {
                      img: '/images/projek/4.png',
                      title: 'Goods Delivery Note System',
                      desc: 'A web-based application designed to manage, track, and generate goods delivery letters efficiently. It provides an organized dashboard, delivery reports, and digital document management.',
                      liveUrl: 'https://#',
                      codeUrl: 'https://github.com/ragilsuanda/Goods-Delivery-Note-System.git',
                    },
                  ].map((item, i) => (
                    <div key={i} className="project-card-tilt-wrap">
                      <TiltedCard
                        imageSrc={item.img || undefined}
                        altText={item.title}
                        captionText={item.title}
                        containerWidth="100%"
                        containerHeight="100%"
                        imageWidth="100%"
                        imageHeight="100%"
                        rotateAmplitude={10}
                        scaleOnHover={1.04}
                        glare={0.3}
                        shadow={0.3}
                        radius={12}
                        parallax={0.8}
                        showTooltip={false}
                        flipOnClick
                        intro
                        backContent={
                          <div className="tc-back-content">
                            <span className="tc-back-icon">{item.icon}</span>
                            <h4 className="tc-back-title">{item.title}</h4>
                            <p className="tc-back-desc">{item.desc}</p>
                            {/* Tombol Live & Code */}
                            <div className="tc-back-actions">
                              <a
                                href={item.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tc-btn tc-btn-live"
                                onClick={e => e.stopPropagation()}
                                aria-label={`Live demo ${item.title}`}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                                </svg>
                                Live
                              </a>
                              <a
                                href={item.codeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tc-btn tc-btn-code"
                                onClick={e => e.stopPropagation()}
                                aria-label={`Source code ${item.title}`}
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                </svg>
                                Code
                              </a>
                            </div>
                          </div>
                        }
                      >
                        {/* Front: foto + overlay judul */}
                        <TiltedCardLayer depth={0}>
                          <div className="tc-front-bg">
                            {item.img
                              ? <img src={item.img} alt={item.title} className="tc-front-img" />
                              : <div className="tc-front-placeholder">
                                  <span className="tc-front-icon">{item.icon}</span>
                                </div>
                            }
                            <div className="tc-front-overlay">
                              <span className="tc-front-title">{item.title}</span>
                            </div>
                          </div>
                        </TiltedCardLayer>
                      </TiltedCard>
                    </div>
                  ))}
                </div>

                {/* See More button */}
                <div className="project-see-more-wrap">
                  <a
                    href="#"
                    className="btn-see-more"
                    onClick={e => e.preventDefault()}
                    aria-label="See more projects"
                  >
                    <span>See More Projects</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

<section className='Myjourney' id="myjourney">
  <Myjourney />   {/* ganti section my journey yang lama dengan ini */}
</section>
<section id='Contackt'>
 <Contact />
</section>

    </>
  );
}
