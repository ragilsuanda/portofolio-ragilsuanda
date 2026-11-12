/**
 * main.js — Portfolio
 * Navbar scroll · Hamburger menu · Entrance animation
 */
(function () {
  'use strict';

  // ── Paksa scroll ke paling atas saat halaman load ───────
  // Mencegah browser restore scroll position lama
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  // ── Navbar: tambah class .scrolled saat scroll ──────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  // ── Hamburger menu ──────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  navMenu?.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // ── Active nav link saat scroll ─────────────────────────
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 80;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navMenu?.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });

  // ── Entrance animation hero ──────────────────────────────
  const fadeItems = document.querySelectorAll(
    '.hero-eyebrow, .hero-title, .hero-subtitle, .hero-desc, .hero-buttons'
  );

  fadeItems.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = `opacity 0.7s ease ${i * 0.12 + 0.1}s, transform 0.7s ease ${i * 0.12 + 0.1}s`;
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    fadeItems.forEach(el => {
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    });
  }));

  // ── Border radius about: hilang saat sudah full cover ──
  const aboutEl      = document.querySelector('.about');
  const heroTitle    = document.querySelector('.hero-title');
  const heroName     = document.querySelector('.hero-name');
  const heroRole     = document.querySelector('.hero-role');

  // Hitam → biru #1B2CC1
  const colorFrom = { r: 10,  g: 10,  b: 10  };
  const colorTo   = { r: 27,  g: 44,  b: 193 };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(from, to, t) {
    return `rgb(${Math.round(lerp(from.r,to.r,t))}, ${Math.round(lerp(from.g,to.g,t))}, ${Math.round(lerp(from.b,to.b,t))})`;
  }
  function lerpAlpha(baseAlpha, t) {
    // alpha juga naik sedikit saat berubah ke biru
    return baseAlpha + (1 - baseAlpha) * t * 0.6;
  }

  if (aboutEl) {
    window.addEventListener('scroll', () => {
      const rect = aboutEl.getBoundingClientRect();

      // Border radius hilang saat full cover
      aboutEl.style.borderRadius = rect.top <= 0 ? '0' : '40px 40px 0 0';

      // Progress 0→1: mulai saat about masuk viewport, selesai saat setengah layar
      const start = window.innerHeight;
      const end   = window.innerHeight * 0.4;
      let t = 0;
      if (rect.top <= start) {
        t = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
      }

      // Judul — hitam ke biru penuh
      if (heroTitle) heroTitle.style.color = lerpColor(colorFrom, colorTo, t);

      // Nama — hitam ke biru
      if (heroName)  heroName.style.color  = lerpColor(colorFrom, colorTo, t);

      // Role — abu ke biru muda
      if (heroRole)  heroRole.style.color  = `rgba(${Math.round(lerp(10,27,t))}, ${Math.round(lerp(10,44,t))}, ${Math.round(lerp(10,193,t))}, ${lerpAlpha(0.55, t).toFixed(2)})`;

    }, { passive: true });
  }
  // ── Sidebar invert saat section 2 menutupi ─────────────
  const sidebar = document.getElementById('socialSidebar');
  if (aboutEl && sidebar) {
    window.addEventListener('scroll', () => {
      const rect = aboutEl.getBoundingClientRect();
      sidebar.classList.toggle('inverted', rect.top < window.innerHeight * 0.5);
    }, { passive: true });
  }

  const aboutItems = document.querySelectorAll('.about-badge, .about-title, .about-desc, .about-stats');
  const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        itemObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  aboutItems.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(28px)';
    el.style.transition = `opacity 0.65s ease ${i * 0.12 + 0.15}s, transform 0.65s ease ${i * 0.12 + 0.15}s`;
    itemObserver.observe(el);
  });

  // ── CAROUSEL MY JOURNEY ──────────────────────────────────
  const carouselTrack = document.querySelector('.carousel-track');
  const carouselSlides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.carousel-btn-prev');
  const nextBtn = document.querySelector('.carousel-btn-next');
  const dots = document.querySelectorAll('.carousel-dot');

  if (carouselTrack && carouselSlides.length > 0) {
    let currentIndex = 0;
    const totalSlides = carouselSlides.length;

    // Fungsi update posisi carousel
    function updateCarousel() {
      const offset = -currentIndex * 100;
      carouselTrack.style.transform = `translateX(${offset}%)`;

      // Update dots
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
    }

    // Next slide
    function nextSlide() {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateCarousel();
    }

    // Previous slide
    function prevSlide() {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateCarousel();
    }

    // Event listeners untuk tombol
    nextBtn?.addEventListener('click', nextSlide);
    prevBtn?.addEventListener('click', prevSlide);

    // Event listeners untuk dots
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
      });
    });

    // Auto play carousel (opsional - setiap 5 detik)
    let autoplayInterval = setInterval(nextSlide, 5000);

    // Pause autoplay saat hover
    const carouselContainer = document.querySelector('.journey-carousel');
    carouselContainer?.addEventListener('mouseenter', () => {
      clearInterval(autoplayInterval);
    });

    carouselContainer?.addEventListener('mouseleave', () => {
      autoplayInterval = setInterval(nextSlide, 5000);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    // Touch/swipe support untuk mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack?.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselTrack?.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          nextSlide(); // Swipe left
        } else {
          prevSlide(); // Swipe right
        }
      }
    }
  }

})();
