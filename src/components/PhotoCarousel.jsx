import { useEffect, useRef, useState, useCallback } from 'react';
import './PhotoCarousel.css';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function PhotoCarousel({ items = [] }) {
  const trackRef   = useRef(null);
  const rafRef     = useRef(null);
  const drag       = useRef({ active: false, startX: 0, startOffset: 0, vx: 0, lastX: 0, lastT: 0 });
  const offsetRef  = useRef(0);          // current scroll offset (px)
  const targetRef  = useRef(0);          // target offset we're easing toward
  const [, forceRender] = useState(0);   // trigger re-render for transform updates

  // Photo size config
  const ITEM_W   = 320;   // width of each item
  const ITEM_H   = 420;   // height
  const GAP      = 24;    // gap between items
  const STRIDE   = ITEM_W + GAP;
  const COUNT    = items.length;

  /* ── Infinite clone list: 3 copies ─────────────── */
  const cloned = [...items, ...items, ...items];
  const totalW = COUNT * STRIDE;

  /* ── Normalise offset to middle copy ─────────────── */
  const normalise = useCallback((offset) => {
    let o = offset;
    while (o > totalW)  o -= totalW;
    while (o < 0)       o += totalW;
    return o;
  }, [totalW]);

  /* ── RAF animation loop ─────────────── */
  useEffect(() => {
    // Start in the middle copy
    offsetRef.current  = totalW;
    targetRef.current  = totalW;

    const tick = () => {
      const diff = targetRef.current - offsetRef.current;
      if (Math.abs(diff) < 0.1) {
        offsetRef.current = targetRef.current;
      } else {
        offsetRef.current += diff * 0.08;   // easing factor
      }
      applyTransforms();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [items]);

  /* ── Apply transforms to each card ─────────────── */
  const applyTransforms = () => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll('.pc-item');
    const centerX = track.parentElement.offsetWidth / 2;

    cards.forEach((card, i) => {
      const itemCenter = i * STRIDE + ITEM_W / 2 - offsetRef.current;
      const dist       = itemCenter - centerX;
      const absDist    = Math.abs(dist);
      const maxDist    = STRIDE * 2;
      const t          = clamp(absDist / maxDist, 0, 1);

      const scale   = 1.08 - t * 0.28;   // 1.08 center → 0.80 far
      const opacity = 1 - t * 0.45;      // 1.0 → 0.55
      const ty      = t * 20;            // slight vertical drop

      card.style.transform = `translateX(${i * STRIDE - offsetRef.current}px) scale(${scale.toFixed(4)}) translateY(${ty.toFixed(2)}px)`;
      card.style.opacity   = opacity.toFixed(3);
      card.style.zIndex    = Math.round((1 - t) * 10);
      card.style.boxShadow = t < 0.15
        ? '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12)'
        : '0 8px 24px rgba(0,0,0,0.25)';
    });

    // normalise silently to keep in middle copy
    const raw = offsetRef.current;
    if (raw > totalW * 1.9) { offsetRef.current -= totalW; targetRef.current -= totalW; }
    if (raw < totalW * 0.1) { offsetRef.current += totalW; targetRef.current += totalW; }
  };

  /* ── Snap to nearest ─────────────── */
  const snap = () => {
    const centerX = trackRef.current?.parentElement.offsetWidth / 2 ?? 0;
    // find offset that places nearest item center at centerX
    const raw   = offsetRef.current;
    const idx   = Math.round((raw + centerX - ITEM_W / 2) / STRIDE);
    targetRef.current = idx * STRIDE - centerX + ITEM_W / 2;
  };

  /* ── Pointer events ─────────────── */
  const onPointerDown = (e) => {
    drag.current = { active: true, startX: e.clientX, startOffset: offsetRef.current, vx: 0, lastX: e.clientX, lastT: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const now = performance.now();
    const dt  = Math.max(now - drag.current.lastT, 8);
    drag.current.vx = (e.clientX - drag.current.lastX) / dt * 16;
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
    const dx  = e.clientX - drag.current.startX;
    targetRef.current = drag.current.startOffset - dx;
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    targetRef.current -= drag.current.vx * 6;  // momentum
    setTimeout(snap, 80);
  };

  /* ── Arrow nav ─────────────── */
  const go = (dir) => {
    targetRef.current += dir * STRIDE;
    setTimeout(snap, 10);
  };

  return (
    <div className="pc-root">
      {/* Track */}
      <div
        className="pc-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={trackRef} className="pc-track">
          {cloned.map((item, i) => (
            <div key={i} className="pc-item" style={{ width: ITEM_W, height: ITEM_H }}>
              {item.src
                ? <img src={item.src} alt={item.label || ''} draggable={false} />
                : <div className="pc-placeholder"><span>{item.label || '📷'}</span></div>
              }
              {item.label && (
                <div className="pc-label">
                  <span>{item.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button className="pc-arrow pc-arrow--left"  onClick={() => go(-1)} aria-label="Previous">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button className="pc-arrow pc-arrow--right" onClick={() => go(1)}  aria-label="Next">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  );
}
