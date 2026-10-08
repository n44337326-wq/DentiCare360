"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/** Wraps a doctor card: 3D pointer tilt plus a cursor-following spotlight, driven by CSS variables. */
export function DoctorCardFx({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  function move(e: PointerEvent<HTMLElement>) {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
  }

  function leave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <article ref={ref} className="dpn-card" onPointerMove={move} onPointerLeave={leave}>
      {children}
    </article>
  );
}
