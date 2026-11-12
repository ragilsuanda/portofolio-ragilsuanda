import { useState, useRef, useLayoutEffect, useEffect } from 'react';

/*
  Ganti `src` dengan foto kamu sendiri.
  `ratio` = lebar / tinggi foto asli (contoh: 1200x800 -> 3/2, 800x1000 -> 4/5)
  supaya bentuk asli setiap foto tetap terjaga (tidak dipaksa jadi kotak).
*/
const PHOTOS = [
  { src: '/images/foto/1.jpeg', alt: 'Foto 1', ratio: 1384 / 1040 },
  { src: '/images/foto/2.jpeg', alt: 'Foto 2', ratio: 960  / 1280 },
  { src: '/images/foto/3.jpeg', alt: 'Foto 3', ratio: 1488 / 992  },
  { src: '/images/foto/4.jpeg', alt: 'Foto 4', ratio: 1200 / 1600 },
  { src: '/images/foto/5.jpeg', alt: 'Foto 5', ratio: 1600 / 1200 },
  { src: '/images/foto/6.jpeg', alt: 'Foto 6', ratio: 1440 / 1440 },
  { src: '/images/foto/7.jpeg', alt: 'Foto 7', ratio: 1053 / 1600 },
];

const N = PHOTOS.length;
// 3 salinan foto -> efek infinite loop (lompat diam-diam ke salinan tengah)
const LOOP = [...PHOTOS, ...PHOTOS, ...PHOTOS];
const SWIPE_THRESHOLD = 60;

function Myjourney() {
  const [idx, setIdx] = useState(N);          // mulai di salinan tengah
  const [x, setX] = useState(0);              // posisi track
  const [drag, setDrag] = useState(0);        // offset saat drag
  const [dragging, setDragging] = useState(false);
  const [animate, setAnimate] = useState(false);

  const viewportRef = useRef(null);
  const itemRefs = useRef([]);
  const startX = useRef(0);
  const moved = useRef(false);

  /* Hitung posisi supaya foto aktif tepat di tengah */
  useLayoutEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const el = itemRefs.current[idx];
      if (!vp || !el) return;
      setX(vp.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [idx]);

  /* Aktifkan kembali animasi setelah lompatan loop / render awal */
  useEffect(() => {
    if (animate) return;
    let r2;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [animate]);

  const go = (d) =>
    setIdx((i) => Math.min(Math.max(i + d, 0), LOOP.length - 1));

  /* Setelah transisi selesai: jika keluar dari salinan tengah, lompat tanpa animasi */
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (idx < N || idx >= 2 * N) {
      setAnimate(false);
      setIdx((((idx % N) + N) % N) + N);
    }
  };

  /* Drag mouse / swipe touch */
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if (!moved.current && Math.abs(dx) > 5) {
      moved.current = true;
      viewportRef.current?.setPointerCapture(e.pointerId);
    }
    if (moved.current) setDrag(dx);
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    const dx = drag;
    setDrag(0);
    if (dx < -SWIPE_THRESHOLD) go(1);
    else if (dx > SWIPE_THRESHOLD) go(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  const activeDot = ((idx % N) + N) % N;

  return (
    <section className="Myjourney" id="myjourney">
      <div className="Myjourney-wrapper">
        <div className="Myjourney-container">
          <div className="Myjourney-header">
            <h2 className="Myjourney-title">Moments that shaped the path.</h2>
          </div>

          <div
            className={`Myjourney-carousel ${animate ? '' : 'no-anim'} ${dragging ? 'is-dragging' : ''}`}
            tabIndex={0}
            onKeyDown={onKeyDown}
          >
            <div
              className="Myjourney-viewport"
              ref={viewportRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div
                className="Myjourney-track"
                style={{ transform: `translate3d(${x + drag}px, 0, 0)` }}
                onTransitionEnd={handleTransitionEnd}
              >
                {LOOP.map((p, i) => {
                  const d = Math.abs(i - idx);
                  const scale = d === 0 ? 1.1 : d === 1 ? 0.9 : 0.8;
                  const opacity = d === 0 ? 1 : d === 1 ? 0.6 : 0.3;
                  return (
                    <div
                      key={i}
                      ref={(el) => (itemRefs.current[i] = el)}
                      className={`Myjourney-item ${d === 0 ? 'is-active' : ''}`}
                      data-i={i}
                      style={{ aspectRatio: p.ratio, '--s': scale, '--o': opacity }}
                      onClick={() => i !== idx && setIdx(i)}
                    >
                      <img src={p.src} alt={p.alt} draggable={false} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="Myjourney-controls">
            <button className="Myjourney-btn" onClick={() => go(-1)} aria-label="Foto sebelumnya">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>

            <div className="Myjourney-dots">
              {PHOTOS.map((_, k) => (
                <button
                  key={k}
                  className={`Myjourney-dot ${k === activeDot ? 'is-active' : ''}`}
                  onClick={() => setIdx(idx + (k - activeDot))}
                  aria-label={`Ke foto ${k + 1}`}
                />
              ))}
            </div>

            <button className="Myjourney-btn" onClick={() => go(1)} aria-label="Foto berikutnya">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Myjourney;
