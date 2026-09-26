"use client";

import { useEffect, useRef } from "react";

const ECG_PATH =
  "M0 60 H180 L200 60 L215 46 L230 60 H260 L275 66 L290 6 L305 108 L320 60 H350 L370 50 L390 60 H640 L660 60 L675 46 L690 60 H720 L735 66 L750 6 L765 108 L780 60 H810 L830 50 L850 60 H1200";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hub: boolean;
}

/**
 * Hero background for the dark hero: drifting colour glows, a cursor-following spotlight, a
 * living "care network" (drifting nodes joined by lines that reach toward the pointer) and a
 * heartbeat line. The network is drawn on a canvas that pauses when scrolled out of view and is
 * drawn once, statically, for users who prefer reduced motion. The pointer position is published
 * as CSS variables on the parent <section> so the 3D hero visual can react to it too.
 */
export function HeroBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section") as HTMLElement | null;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !section || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const LINK = 132;
    const REACH = 180;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let raf = 0;
    let onScreen = true;
    let pending = false;
    const pointer = { x: -9999, y: -9999, active: false };

    function build() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(95, Math.max(26, (w * h) / 15000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.3 + 0.7,
        hub: Math.random() < 0.13,
      }));
    }

    function draw(move: boolean) {
      const c = ctx!;
      c.clearRect(0, 0, w, h);
      if (move) {
        for (const n of nodes) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -10) n.x = w + 10;
          else if (n.x > w + 10) n.x = -10;
          if (n.y < -10) n.y = h + 10;
          else if (n.y > h + 10) n.y = -10;
        }
      }

      c.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const alpha = (1 - Math.sqrt(d2) / LINK) * 0.34;
          c.strokeStyle = `rgba(94, 224, 238, ${alpha})`;
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
        if (pointer.active) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < REACH) {
            c.strokeStyle = `rgba(190, 250, 255, ${(1 - d / REACH) * 0.7})`;
            c.beginPath();
            c.moveTo(a.x, a.y);
            c.lineTo(pointer.x, pointer.y);
            c.stroke();
          }
        }
      }

      for (const n of nodes) {
        c.fillStyle = n.hub ? "rgba(190, 250, 255, 0.95)" : "rgba(255, 255, 255, 0.55)";
        c.beginPath();
        c.arc(n.x, n.y, n.hub ? n.r + 1.1 : n.r, 0, Math.PI * 2);
        c.fill();
        if (n.hub) {
          c.strokeStyle = "rgba(94, 224, 238, 0.35)";
          c.beginPath();
          c.arc(n.x, n.y, n.r + 5, 0, Math.PI * 2);
          c.stroke();
        }
      }
    }

    function tick() {
      if (onScreen) draw(true);
      raf = requestAnimationFrame(tick);
    }

    build();
    draw(false);

    const resizeObserver = new ResizeObserver(() => {
      build();
      draw(false);
    });
    resizeObserver.observe(canvas);

    let intersection: IntersectionObserver | undefined;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const r = section.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
        section.style.setProperty("--mx", `${x}px`);
        section.style.setProperty("--my", `${y}px`);
        section.style.setProperty("--px", String((x / r.width - 0.5) * 2));
        section.style.setProperty("--py", String((y / r.height - 0.5) * 2));
      });
    };
    const onLeave = () => {
      pointer.active = false;
      section.style.setProperty("--px", "0");
      section.style.setProperty("--py", "0");
    };

    if (!reduce) {
      raf = requestAnimationFrame(tick);
      intersection = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
      });
      intersection.observe(section);
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection?.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="hero-orb hero-orb-c" />
      <div className="hero-orb hero-orb-a" />
      <div className="hero-orb hero-orb-b" />
      <div className="hero-grid" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="hero-spot" />
      <svg
        className="hero-ecg absolute inset-x-0 bottom-12 h-24 w-full sm:bottom-14"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path className="hero-ecg-base" d={ECG_PATH} pathLength={1000} />
        <path className="hero-ecg-pulse" d={ECG_PATH} pathLength={1000} />
      </svg>
    </div>
  );
}
