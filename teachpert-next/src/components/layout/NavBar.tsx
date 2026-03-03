"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const NAV_LINKS = [
  { href: "#theorie",    label: "Theorie" },
  { href: "#demo",       label: "Demo" },
  { href: "#oefening1",  label: "Oefening 1" },
  { href: "#oefening2",  label: "Oefening 2" },
  { href: "#oefening3",  label: "Oefening 3" },
  { href: "#oefening4",  label: "Oefening 4" },
  { href: "#oefening5",  label: "Oefening 5" },
  { href: "#playground", label: "Playground" },
];

export function NavBar() {
  const [active, setActive] = useState("theorie");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.slice(1));
    const visible = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible.set(e.target.id, e.intersectionRatio);
        });
        let best = "";
        let bestRatio = -1;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        });
        if (best) setActive(best);
      },
      { threshold: [0, 0.1, 0.25, 0.5] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#030203",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        boxShadow: "0 2px 14px rgba(0,0,0,.3)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".6rem",
          fontSize: "1.25rem",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "4px",
          padding: "0.85rem 1.25rem 0.85rem 0",
          borderRight: "1px solid rgba(255,255,255,.2)",
          marginRight: "0.5rem",
          whiteSpace: "nowrap",
          flexShrink: 0,
          fontFamily: "var(--font-raleway), Arial, sans-serif",
        }}
      >
        <Image
          src="/pxl-logo-64.png"
          alt="Hogeschool PXL"
          width={28}
          height={28}
          style={{ borderRadius: "50%" }}
        />
        PERT
      </div>

      {NAV_LINKS.map((link) => {
        const id = link.href.slice(1);
        const isActive = active === id;
        return (
          <a
            key={link.href}
            href={link.href}
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,.6)",
              textDecoration: "none",
              padding: "0.85rem 0.8rem",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              borderBottom: isActive ? "2px solid #AE9A64" : "2px solid transparent",
              transition: "color .15s",
              flexShrink: 0,
            }}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
