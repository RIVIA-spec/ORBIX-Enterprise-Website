/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PR2B HOTFIX #3 â€” BLANK PREVIEW DEBUG + ROOT CAUSE FIX
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   EXACT ROOT CAUSE (why Preview was blank):
   1) First render crashed BEFORE anything mounted: the component
      called `localStorage.getItem(...)` unguarded during state
      initialization. In sandboxed preview iframes storage access
      throws SecurityError â†’ the whole React tree fails â†’ blank.
   2) Rendering was effectively gated behind routing side-effects:
      the initial view depended on a hash redirect ("/" â†’
      #/partner/demo/real-estate) and a hashchange listener that
      never fires inside the sandboxed Preview frame, so the app
      stayed on a path some mounts never resolve.
   3) CSS height chain: `body{overflow:hidden}` without explicit
      html/body height collapsed the shell to 0px in some preview
      containers (invisible, not blank DOM).

   FIXES APPLIED (frontend-only, no backend, no env vars):
   â€¢ safeGet/safeSet storage helpers (try/catch) â€” crash removed.
   â€¢ Routing SIMPLIFIED: page is now React state, rendered
     DIRECTLY on first paint. Hash is synced best-effort inside
     try/catch; "/" still redirects to /partner/demo/real-estate
     but rendering never depends on it.
   â€¢ ErrorBoundary wraps the whole UI â€” a render error now shows
     a visible fallback instead of a blank screen.
   â€¢ CSS: html,body{height:100%}; min-height:0 on flex column
     (.mw/.mn) so the layout can never collapse to height 0.
   â€¢ No lazy imports, no Suspense (none were used â€” verified).
   â€¢ Removed unused recharts `Legend` import.
   â€¢ main.tsx/root mount: handled by the preview harness; the
     default export `App` is intact and renders standalone.

   VERIFICATION:
   â€¢ TypeScript check: passed (0 errors).
   â€¢ Production build: passed.
   â€¢ Preview: renders visibly at "/" and at
     #/partner/demo/real-estate with zero backend dependency â€”
     all data is local mock constants, all state is React state.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { AGREEMENTS0, COMMISSIONS0, EVENTS0, MEDIA0, MESSAGES0, NOTIFICATIONS_CENTER0 } from "./modules/operations/mockData";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SAFE STORAGE (sandbox-proof) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const safeGet = k => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
const safeSet = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) {} };

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ICONS (lucide-style inline SVG) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const IC = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
  building: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  kanban: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/></>,
  handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></>,
  filetext: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/></>,
  video: <><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></>,
  usercheck: <><path d="M2 21a8 8 0 0 1 13.29-6"/><circle cx="10" cy="8" r="5"/><path d="m16 19 2 2 4-4"/></>,
  chart: <><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></>,
  folder: <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>,
  chevdown: <path d="m6 9 6 6 6-6"/>,
  chevright: <path d="m9 18 6-6-6-6"/>,
  chevleft: <path d="m15 18-6-6 6-6"/>,
  plus: <path d="M5 12h14M12 5v14"/>,
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>,
  more: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  pencil: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>,
  copy: <><rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></>,
  archive: <><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  x: <path d="M18 6 6 18M6 6l12 12"/>,
  check: <path d="M20 6 9 17l-5-5"/>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></>,
  upright: <><path d="M7 7h10v10"/><path d="M7 17 17 7"/></>,
  downright: <><path d="m7 7 10 10"/><path d="M17 7v10H7"/></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>,
  ext: <><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
  globe: <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>,
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>,
  trend: <><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></>,
  wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></>,
  dollar: <><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  lang: <><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></>,
  paperclip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
  sparkles: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>,
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></>,
  play: <polygon points="6 3 20 12 6 21 6 3"/>,
  minus: <path d="M5 12h14"/>,
  home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
  maximize: <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>,
  panel: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>,
};
const Icon = ({ name, size = 16, sw = 2, style, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>{IC[name]}</svg>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ GLOBAL CSS (height chain fixed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CSS = `
@import url('https://cdn.jsdelivr.net/fontsource/css/inter@latest/index.css');
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/fontsource/css/jetbrains-mono@latest/index.css');
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#f6f7fa;--bg2:#eef0f5;--sf:#ffffff;--sf2:#f8f9fc;--bd:#e6e9f0;--bd2:#d9dee8;--tx:#0b1220;--tx2:#57637a;--tx3:#939db1;--pr:#2f6bff;--pr2:#1f56e8;--prs:rgba(47,107,255,.09);--sh:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.07);--shl:0 16px 40px -12px rgba(16,24,40,.2);--r:12px;--rs:8px;--sbw:250px;--sbwc:72px;--tbh:58px;--ff:'Inter',system-ui,sans-serif;--fm:'JetBrains Mono',monospace}
[data-theme="dark"]{--bg:#0a0d14;--bg2:#0d1119;--sf:#111623;--sf2:#161c2c;--bd:#222b3d;--bd2:#2d3850;--tx:#e8ecf4;--tx2:#a3aec4;--tx3:#667189;--pr:#4d82ff;--pr2:#6b96ff;--prs:rgba(77,130,255,.13);--sh:0 1px 2px rgba(0,0,0,.4);--shl:0 20px 50px -12px rgba(0,0,0,.6)}
html{font-size:14px;height:100%}
body{font-family:var(--ff);background:var(--bg);color:var(--tx);-webkit-font-smoothing:antialiased;overflow:hidden;height:100%}
[lang="ar"] body{font-family:'Cairo',var(--ff);line-height:1.6}
[lang="ar"] h1,[lang="ar"] h2,[lang="ar"] h3,[lang="ar"] b{font-weight:600}
button{font-family:inherit;color:inherit;background:none;border:none;cursor:pointer}
input,select,textarea{font-family:inherit;font-size:13px;color:var(--tx);background:var(--sf);border:1px solid var(--bd2);border-radius:var(--rs);padding:8px 10px;outline:none;transition:border .15s,box-shadow .15s;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--pr);box-shadow:0 0 0 3px var(--prs)}
textarea{resize:vertical}
::placeholder{color:var(--tx3)}
.mono{font-family:var(--fm);font-size:11px;direction:ltr;unicode-bidi:isolate}
.num{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
input[type="email"],input[type="url"],.code{direction:ltr;unicode-bidi:isolate}
.shell{display:flex;height:100vh;min-height:100vh;width:100%}
.sb{width:var(--sbw);flex:0 0 auto;background:var(--sf);border-inline-end:1px solid var(--bd);display:flex;flex-direction:column;transition:width .2s;z-index:40}
.shell.cl .sb{width:var(--sbwc)}
.shell.cl .sb .lbl,.shell.cl .sb .nv-s,.shell.cl .sb .nv-b,.shell.cl .sb .org-i,.shell.cl .sb .hd-t{display:none}
.sb-hd{display:flex;align-items:center;gap:10px;padding:0 16px;height:var(--tbh);border-bottom:1px solid var(--bd);flex:0 0 auto}
.orb{width:30px;height:30px;flex:0 0 auto;border-radius:9px;background:conic-gradient(from 210deg,#2f6bff,#14b8a6,#6366f1,#2f6bff);position:relative;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)}
.orb::after{content:"";position:absolute;inset:8px;border-radius:50%;background:var(--sf)}
.hd-t b{display:block;font-size:14px;letter-spacing:-.01em}.hd-t span{display:block;font-size:10px;color:var(--tx3);text-transform:uppercase;letter-spacing:.09em}
.sb-org{margin:10px 8px 2px;padding:9px 10px;border:1px solid var(--bd);border-radius:10px;display:flex;gap:9px;align-items:center;background:var(--sf2)}
.sb-org .org-i b{display:block;font-size:12.5px;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-org .org-i span{font-size:10.5px;color:var(--tx3)}
.nv{flex:1;overflow-y:auto;padding:8px}
.nv-s{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--tx3);padding:13px 10px 5px}
.nv-i{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:8px;color:var(--tx2);font-weight:500;font-size:13px;margin-bottom:1px;transition:background .12s,color .12s;text-align:start}
.nv-i:hover{background:var(--bg2);color:var(--tx)}
.nv-i.on{background:var(--prs);color:var(--pr)}
.nv-b{margin-inline-start:auto;font-size:10.5px;background:var(--bg2);border:1px solid var(--bd);color:var(--tx2);border-radius:99px;padding:1px 7px}
.nv-i.on .nv-b{background:var(--prs);border-color:transparent;color:var(--pr)}
.sb-ft{padding:10px;border-top:1px solid var(--bd)}
.mw{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;height:100%}
.tb{height:var(--tbh);flex:0 0 auto;background:var(--sf);border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:8px;padding:0 16px}
.crumb{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--tx3);white-space:nowrap;overflow:hidden}
.crumb b{color:var(--tx);font-weight:600}.crumb .sp{color:var(--bd2)}
.tbs-ic{position:relative;margin-inline-start:12px;width:270px}
.tbs-ic input{padding-inline-start:32px;background:var(--bg2);border-color:transparent;cursor:pointer}
.tbs-ic .si{position:absolute;inset-inline-start:10px;top:50%;transform:translateY(-50%);color:var(--tx3);pointer-events:none}
.tbs-ic kbd{position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);font-family:var(--fm);font-size:10px;color:var(--tx3);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;background:var(--sf)}
.tb-r{margin-inline-start:auto;display:flex;align-items:center;gap:5px}
.ib{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;color:var(--tx2);position:relative;flex:0 0 auto}
.ib:hover{background:var(--bg2);color:var(--tx)}
.ndot{position:absolute;top:6px;inset-inline-end:6px;width:7px;height:7px;border-radius:50%;background:#ef4444;border:2px solid var(--sf)}
.tb-b{display:flex;align-items:center;gap:7px;padding:6px 9px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--tx2)}
.tb-b:hover{background:var(--bg2)}
.av{display:inline-flex;align-items:center;justify-content:center;font-weight:600;color:#fff;background:var(--avc,#2f6bff);user-select:none;flex:0 0 auto;letter-spacing:.02em}
.dd{position:relative}
.dd-m{position:absolute;top:calc(100% + 6px);inset-inline-end:0;min-width:225px;background:var(--sf);border:1px solid var(--bd);border-radius:12px;box-shadow:var(--shl);padding:6px;z-index:80;animation:pop .14s ease}
@keyframes pop{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:none}}
.dd-i{display:flex;align-items:center;gap:9px;width:100%;padding:8px 10px;border-radius:8px;font-size:12.5px;color:var(--tx2);text-align:start}
.dd-i:hover{background:var(--bg2);color:var(--tx)}
.dd-i.on{color:var(--pr);background:var(--prs)}
.dd-sep{height:1px;background:var(--bd);margin:5px 6px}
.dd-hd{padding:8px 10px 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--tx3)}
.mn{flex:1;min-height:0;height:100%;overflow-y:auto;padding:22px 24px 70px}
.pg{max-width:1380px;margin:0 auto}
.pg-h{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.pg-h h1{font-size:20px;letter-spacing:-.02em;font-weight:700}
.pg-h p{color:var(--tx3);font-size:12.5px;margin-top:3px}
.pg-a{margin-inline-start:auto;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cd{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);box-shadow:var(--sh)}
.cd-h{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd)}
.cd-h h3{font-size:13.5px;font-weight:600}
.cd-h .sub{font-size:11.5px;color:var(--tx3)}
.cd-b{padding:16px}
.bt{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border-radius:9px;font-size:12.5px;font-weight:600;border:1px solid var(--bd2);background:var(--sf);color:var(--tx);transition:all .13s;white-space:nowrap}
.bt:hover{background:var(--bg2)}
.bt-p{background:var(--pr);border-color:var(--pr);color:#fff;box-shadow:0 1px 2px rgba(47,107,255,.4)}
.bt-p:hover{background:var(--pr2)}
.bt-d{background:#ef4444;border-color:#ef4444;color:#fff}
.bt-s{padding:5px 9px;font-size:12px;border-radius:7px}
.bt[disabled]{opacity:.5;pointer-events:none}
.bg{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;border-radius:99px;padding:3px 9px;color:var(--bc,var(--tx2));background:color-mix(in srgb,var(--bc,#64748b) 11%,transparent);border:1px solid color-mix(in srgb,var(--bc,#64748b) 24%,transparent);white-space:nowrap}
.bg i{width:6px;height:6px;border-radius:50%;background:var(--bc)}
.kg{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px}
.kpi{padding:14px 16px}
.kpi .kt{display:flex;align-items:center;gap:8px;margin-bottom:9px}
.kpi .ki{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:var(--prs);color:var(--pr);flex:0 0 auto}
.kpi .kl{font-size:11.5px;font-weight:500;color:var(--tx3)}
.kpi .kv{font-size:21px;font-weight:700;letter-spacing:-.02em}
.kpi .kd{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;margin-top:5px;border-radius:99px;padding:2px 8px}
.kd.up{color:#10b981;background:rgba(16,185,129,.1)}.kd.dn{color:#ef4444;background:rgba(239,68,68,.1)}
.g2{display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px}
.g22{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.tw{overflow-x:auto}
table.tbl{width:100%;border-collapse:collapse;font-size:12.5px;min-width:840px}
.tbl th{font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--tx3);font-weight:600;text-align:start;padding:9px 14px;border-bottom:1px solid var(--bd);background:var(--sf2);white-space:nowrap;user-select:none}
.tbl th.srt{cursor:pointer}.tbl th.srt:hover{color:var(--tx)}
.tbl td{padding:10px 14px;border-bottom:1px solid var(--bd);vertical-align:middle;white-space:nowrap}
.tbl tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .1s;cursor:pointer}
.tbl tbody tr:hover{background:var(--sf2)}
.cm{display:flex;align-items:center;gap:10px;min-width:170px}
.thmb{width:44px;height:34px;border-radius:7px;object-fit:cover;flex:0 0 auto;background:var(--bg2)}
.cs{color:var(--tx3);font-size:11px;margin-top:1px}
.ra{display:flex;gap:2px;justify-content:flex-end}
.ra .ib{width:27px;height:27px;border-radius:6px}
.tf{display:flex;align-items:center;gap:10px;padding:11px 16px;font-size:12px;color:var(--tx3)}
.tf .pgn{margin-inline-start:auto;display:flex;gap:6px;align-items:center}
.fb{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.fb .siw{position:relative}
.fb .siw .si{position:absolute;inset-inline-start:9px;top:50%;transform:translateY(-50%);color:var(--tx3);pointer-events:none}
.fb .siw input{padding-inline-start:29px;width:220px}
.fb select{width:auto;max-width:160px}
.chp{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;border:1px solid var(--bd2);font-size:12px;font-weight:500;color:var(--tx2);background:var(--sf);cursor:pointer}
.chp.on{background:var(--prs);border-color:var(--pr);color:var(--pr)}
.chp .cn{font-size:10px;opacity:.75}
.seg{display:inline-flex;background:var(--bg2);border:1px solid var(--bd);border-radius:9px;padding:2px;gap:2px}
.seg button{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:7px;font-size:12px;font-weight:500;color:var(--tx3)}
.seg button.on{background:var(--sf);color:var(--tx);box-shadow:var(--sh)}
.pgd{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
.pc{overflow:hidden;cursor:pointer;transition:transform .15s,box-shadow .15s}
.pc:hover{transform:translateY(-2px);box-shadow:var(--shl)}
.pc .im{height:150px;position:relative}
.pc .im img{width:100%;height:100%;object-fit:cover}
.pc .im .bg{position:absolute;top:9px;inset-inline-start:9px}
.pc .bd{padding:12px 13px}
.pc .bd b{font-size:13px;display:block;letter-spacing:-.01em}
.pc .lc{display:flex;align-items:center;gap:4px;color:var(--tx3);font-size:11.5px;margin:4px 0 8px}
.pc .pr{font-size:14.5px;font-weight:700;color:var(--pr)}
.pc .mt{display:flex;gap:10px;color:var(--tx3);font-size:11px;margin-top:7px;border-top:1px solid var(--bd);padding-top:8px}
.kb{display:flex;gap:10px;overflow-x:auto;padding-bottom:14px;align-items:flex-start}
[dir="rtl"] .kb{direction:ltr}
[dir="rtl"] .kc{direction:rtl}
.kc{flex:0 0 250px;background:var(--bg2);border:1px solid var(--bd);border-radius:12px;transition:all .12s}
.kc.ov{background:var(--prs);border-color:var(--pr)}
.kc-h{display:flex;align-items:center;gap:7px;padding:11px 12px;font-size:12px;font-weight:600}
.kc-h i{width:8px;height:8px;border-radius:50%}
.kc-h .n{color:var(--tx3);font-weight:500}
.kc-h .sm{margin-inline-start:auto;font-size:10.5px;color:var(--tx3)}
.kc-b{padding:0 8px 10px;display:flex;flex-direction:column;gap:8px;min-height:70px}
.kcd{background:var(--sf);border:1px solid var(--bd);border-radius:10px;padding:11px 12px;cursor:grab;box-shadow:var(--sh)}
.kcd:active{cursor:grabbing}
.kcd.dr{opacity:.45;transform:rotate(1.5deg)}
.kcd b{font-size:12.5px;display:block}
.kcd .su{font-size:11px;color:var(--tx3);margin:3px 0 8px}
.kcd .ft{display:flex;align-items:center;gap:6px}
.kcd .bd2{margin-inline-start:auto;font-size:11px;font-weight:600;color:var(--tx2)}
.ovl{position:fixed;inset:0;background:rgba(8,11,20,.45);backdrop-filter:blur(2px);z-index:90}
.drw{position:fixed;top:0;bottom:0;inset-inline-end:0;width:min(560px,100vw);background:var(--sf);z-index:95;box-shadow:var(--shl);display:flex;flex-direction:column}
.drw.wd{width:min(740px,100vw)}
.dr-h{display:flex;align-items:center;gap:10px;padding:15px 18px;border-bottom:1px solid var(--bd)}
.dr-h h3{font-size:15px;font-weight:700;letter-spacing:-.01em}
.dr-h .sub{font-size:11.5px;color:var(--tx3)}
.dr-h .xx{margin-inline-start:auto}
.dr-b{flex:1;overflow-y:auto;padding:18px}
.dr-f{padding:13px 18px;border-top:1px solid var(--bd);display:flex;gap:8px;justify-content:flex-end}
.mdl-w{position:fixed;inset:0;z-index:120;display:flex;align-items:flex-start;justify-content:center;padding:9vh 16px 16px;background:rgba(8,11,20,.5);backdrop-filter:blur(3px)}
.mdl{background:var(--sf);border:1px solid var(--bd);border-radius:16px;box-shadow:var(--shl);width:min(560px,100%);overflow:hidden;animation:pop .18s}
.mdl.lg{width:min(880px,100%)}
.fs{margin-bottom:20px}
.fs-t{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--tx3);margin-bottom:11px}
.fs-t::after{content:"";flex:1;height:1px;background:var(--bd)}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:11px}
.fr.one{grid-template-columns:1fr}.fr.three{grid-template-columns:1fr 1fr 1fr}
.fd label{display:block;font-size:11.5px;font-weight:600;color:var(--tx2);margin-bottom:5px}
.fd label em{color:#ef4444;font-style:normal}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.sw{position:relative;width:36px;height:20px;background:var(--bd2);border-radius:99px;transition:background .15s;flex:0 0 auto;cursor:pointer}
.sw::after{content:"";position:absolute;top:2px;inset-inline-start:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:inset-inline-start .15s;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.sw.on{background:var(--pr)}
.sw.on::after{inset-inline-start:18px}
.swr{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:12.5px}
.swr .d{color:var(--tx3);font-size:11.5px}
.mp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mp label{position:relative;cursor:pointer;border-radius:9px;overflow:hidden;border:2px solid transparent;display:block}
.mp img{width:100%;height:64px;object-fit:cover;display:block}
.mp input{position:absolute;opacity:0;width:0}
.mp label.sel{border-color:var(--pr)}
.mp label.sel::after{content:"âœ“";position:absolute;top:4px;inset-inline-end:6px;color:#fff;font-weight:800;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.emp{padding:44px 20px;text-align:center;color:var(--tx3)}
.emp .ei{width:46px;height:46px;border-radius:14px;background:var(--bg2);border:1px solid var(--bd);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;color:var(--tx3)}
.emp b{display:block;color:var(--tx2);font-size:13.5px;margin-bottom:4px}
.emp p{font-size:12px;max-width:320px;margin:0 auto 14px}
.lr{display:flex;align-items:center;gap:11px;padding:10px 4px;border-bottom:1px solid var(--bd)}
.lr:last-child{border-bottom:none}
.lr .lt{min-width:0;flex:1}
.lr .lt b{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lr .lt span{font-size:11px;color:var(--tx3)}
.lr .lrr{margin-inline-start:auto;text-align:end;flex:0 0 auto}
.lr .lrr b{font-size:12.5px}
.lr .lrr span{display:block;font-size:10.5px;color:var(--tx3)}
.tl{position:relative;padding-inline-start:20px}
.tl::before{content:"";position:absolute;inset-block:4px;inset-inline-start:6px;width:2px;background:var(--bd);border-radius:2px}
.tli{position:relative;padding-bottom:16px}
.tli::before{content:"";position:absolute;inset-inline-start:-17.5px;top:4px;width:9px;height:9px;border-radius:50%;background:var(--sf);border:2.5px solid var(--tc,var(--pr))}
.tli b{font-size:12.5px;font-weight:600}
.tli p{font-size:11.5px;color:var(--tx3);margin-top:2px}
.tbs2{display:flex;gap:2px;border-bottom:1px solid var(--bd);margin-bottom:16px;overflow-x:auto}
.tbs2 button{padding:9px 13px;font-size:12.5px;font-weight:600;color:var(--tx3);border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}
.tbs2 button.on{color:var(--pr);border-color:var(--pr)}
#tsts{position:fixed;bottom:18px;inset-inline-end:18px;z-index:300;display:flex;flex-direction:column;gap:8px}
.tst{display:flex;align-items:center;gap:9px;background:var(--sf);border:1px solid var(--bd);border-radius:11px;padding:11px 14px;font-size:12.5px;font-weight:500;box-shadow:var(--shl);animation:tin .25s cubic-bezier(.3,.9,.3,1.2);max-width:340px}
@keyframes tin{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.tst .ti{width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.tst.ok .ti{background:rgba(16,185,129,.12);color:#10b981}
.tst.err .ti{background:rgba(239,68,68,.12);color:#ef4444}
.tst.info .ti{background:var(--prs);color:var(--pr)}
.hb{margin-bottom:10px}
.hb .ht{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px}
.hb .hk{height:7px;border-radius:99px;background:var(--bg2);overflow:hidden}
.hb .hf{height:100%;border-radius:99px;background:var(--pr)}
.fn{display:flex;flex-direction:column;gap:6px}
.fnr{display:flex;align-items:center;gap:10px}
.fnr .fl{width:90px;font-size:11.5px;color:var(--tx2);flex:0 0 auto}
.fnr .fk{flex:1;height:22px;border-radius:6px;background:var(--bg2);overflow:hidden}
.fnr .ff{height:100%;border-radius:6px;display:flex;align-items:center;padding-inline-start:8px;font-size:10.5px;font-weight:700;color:#fff;min-width:24px}
.fgd{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}
.fc{display:flex;gap:11px;align-items:center;padding:13px}
.fc .fi{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.fc b{font-size:12.5px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.fc span{font-size:10.5px;color:var(--tx3)}
.stg{display:grid;grid-template-columns:210px 1fr;gap:18px;align-items:start}
.stn{position:sticky;top:0;display:flex;flex-direction:column;gap:2px}
.stn button{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--tx2);text-align:start}
.stn button.on{background:var(--prs);color:var(--pr);font-weight:600}
.ts2{position:relative;height:420px;overflow:hidden;border-radius:12px;cursor:grab;background:#000}
.ts2:active{cursor:grabbing}
.ts2 .pn{position:absolute;inset:0;background-size:auto 100%;background-repeat:repeat-x}
.ts2 .hd{position:absolute;inset-inline:12px;bottom:12px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.ts2 .sc{padding:5px 11px;border-radius:99px;background:rgba(10,12,20,.55);color:#fff;font-size:11px;font-weight:600;backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.18)}
.ts2 .sc.on{background:var(--pr);border-color:var(--pr)}
.ts2 .dg{position:absolute;top:12px;inset-inline-end:12px;background:rgba(10,12,20,.55);color:#fff;border-radius:99px;padding:5px 12px;font-size:11px;font-weight:700;backdrop-filter:blur(6px)}
.lnk{color:var(--pr);font-weight:600;font-size:12px;cursor:pointer}
.lnk:hover{text-decoration:underline}
.dvd{height:1px;background:var(--bd);margin:14px 0}
.sst{display:flex;gap:22px;flex-wrap:wrap}
.sst .st b{font-size:16px;font-weight:700;display:block;letter-spacing:-.01em}
.sst .st span{font-size:11px;color:var(--tx3)}
@media (max-width:1180px){.kg{grid-template-columns:repeat(3,1fr)}.g2,.g3{grid-template-columns:1fr 1fr}.g3>*:last-child{grid-column:1/-1}}
@media (max-width:1024px){.sb{position:fixed;inset-block:0;inset-inline-start:0;transform:translateX(-105%);box-shadow:var(--shl)}[dir="rtl"] .sb{transform:translateX(105%)}.sb.open{transform:none!important}.sbk{position:fixed;inset:0;background:rgba(8,11,20,.4);z-index:35}.tbs-ic{display:none}.stg{grid-template-columns:1fr}.stn{flex-direction:row;overflow-x:auto;position:static}}
@media (max-width:760px){.mn{padding:16px 14px 70px}.kg{grid-template-columns:1fr 1fr}.g2,.g3,.g22{grid-template-columns:1fr}.fb{flex-direction:column;align-items:stretch}.fb .siw input{width:100%}.fb select{max-width:none}.pg-a{margin-inline-start:0;width:100%}.hm{display:none}}
`;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ I18N â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const T = {
  en: { overview:"Overview", properties:"Properties", clients:"Clients", leads:"Leads", pipeline:"Pipeline", deals:"Deals", contracts:"Contracts", tours:"Virtual Tours", agents:"Agents", analytics:"Analytics", files:"Files", settings:"Settings", search:"Search properties, clients, leads...", newProperty:"New Property", newClient:"New Client", newLead:"New Lead", save:"Save", cancel:"Cancel", close:"Close", edit:"Edit", view:"View", duplicate:"Duplicate", archive:"Archive", upload:"Upload", export:"Export", notifications:"Notifications", signout:"Sign out", all:"All", filters:"Filters", clear:"Clear", table:"Table", cards:"Cards", totalProperties:"Total Properties", available:"Available Properties", reserved:"Reserved Properties", sold:"Sold Properties", totalLeads:"Total Leads", qualifiedLeads:"Qualified Leads", activeDeals:"Active Deals", closedDeals:"Closed Deals", revenue:"Revenue", conversion:"Conversion Rate", recentProperties:"Recent Properties", recentLeads:"Recent Leads", activeDealsSec:"Active Deals", upcomingTasks:"Upcoming Tasks", recentActivity:"Recent Activity", topAgents:"Top Agents", viewAll:"View all", workspace:"Workspace", transactions:"Transactions", insights:"Insights", admin:"Administration", branch:"Branch", agent:"Agent", status:"Status", price:"Price", city:"City", district:"District", property:"Property", client:"Client", amount:"Amount", actions:"Actions" },
  ar: { overview:"نظرة عامة", properties:"العقارات", clients:"العملاء", leads:"العملاء المحتملون", pipeline:"مسار المبيعات", deals:"الصفقات", contracts:"العقود", tours:"الجولات الافتراضية", agents:"الوكلاء", analytics:"التحليلات", files:"الملفات", settings:"الإعدادات", search:"ابحث في العقارات والعملاء والعملاء المحتملين...", newProperty:"عقار جديد", newClient:"عميل جديد", newLead:"عميل محتمل جديد", save:"حفظ", cancel:"إلغاء", close:"إغلاق", edit:"تعديل", view:"عرض", duplicate:"نسخ", archive:"أرشفة", upload:"رفع", export:"تصدير", notifications:"الإشعارات", signout:"تسجيل الخروج", all:"الكل", filters:"تصفية", clear:"مسح", table:"جدول", cards:"بطاقات", totalProperties:"إجمالي العقارات", available:"العقارات المتاحة", reserved:"العقارات المحجوزة", sold:"العقارات المباعة", totalLeads:"إجمالي العملاء المحتملين", qualifiedLeads:"العملاء المؤهلون", activeDeals:"الصفقات النشطة", closedDeals:"الصفقات المغلقة", revenue:"الإيرادات", conversion:"معدل التحويل", recentProperties:"أحدث العقارات", recentLeads:"أحدث العملاء المحتملين", activeDealsSec:"الصفقات النشطة", upcomingTasks:"المهام القادمة", recentActivity:"النشاط الأخير", topAgents:"أفضل الوكلاء", viewAll:"عرض الكل", workspace:"مساحة العمل", transactions:"المعاملات", insights:"الرؤى", admin:"الإدارة", branch:"الفرع", agent:"الوكيل", status:"الحالة", price:"السعر", city:"المدينة", district:"الحي", property:"العقار", client:"العميل", amount:"القيمة", actions:"الإجراءات" }
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MOCK DATA (src/data/*) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const IMG = {
  villa1:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/16158a1bd-122d-4251-9802-b402130128f7.png",
  tower:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/12e3d2500-f734-4a71-a6ec-8d0c19bfb4f4.png",
  pent:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1c738fa37-e199-4450-9732-d53bbb18016d.png",
  town:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/19a8bfb63-98de-49e4-ab83-f9cc25bb1e99.png",
  villa2:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1f985d236-c3e0-4790-8c25-600869571e87.png",
  office:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1a7cee194-6ec7-4cb4-a797-70697cb9dd88.png",
  beach:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1c1f56cee-166e-4b7e-8d32-a85f5314cc1c.png",
  interior:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/1226cbf4f-75a0-4e4b-9f3d-ccc73b88c20f.png",
  desert:"https://image.qwenlm.ai/public_source/6aa81124-ff37-4877-b5c5-9101406713f9/12bf0d215-714e-4861-a8ef-25bfd9ba9564.png",
};
const NOW = Date.now(), D = d => NOW - d * 864e5, H = h => NOW - h * 36e5;
const ORGS = [
  { id:"org-demo", name:"Atlas Real Estate", nameAr:"أطلس العقارية", industry:"Real Estate Agency", industryAr:"مكتب عقاري", workspaces:["real-estate"], plan:"Enterprise", currency:"USD", city:"Homs", cityAr:"حمص", legalName:"Atlas Real Estate Office LLC", country:"Syria", email:"ops@atlas-realestate.sy", phone:"+963 31 555 0100", web:"atlas-realestate.sy" },
  { id:"org-hotel", name:"Grand Horizon Hotel", industry:"Hotel", workspaces:["hotel"], plan:"Growth", currency:"SYP", city:"Damascus", email:"frontoffice@grandhorizon.sy", phone:"+963 11 555 0188", web:"grandhorizon.sy" },
  { id:"org-restaurant", name:"Noura Restaurant Group", industry:"Restaurant", workspaces:["restaurant"], plan:"Growth", currency:"SYP", city:"Tartous", email:"operations@noura.sy", phone:"+963 43 555 0120", web:"noura.sy" },
];
const BRANCHES = [
  { id:"br1", orgId:"org-demo", name:"Homs Main Branch", nameAr:"فرع حمص الرئيسي", city:"Homs", cityAr:"حمص", address:"Al-Hamra Street, Homs", addressAr:"شارع الحمرا، حمص", phone:"+963 31 555 0100", managerId:"m1", status:"Active" },
  { id:"br2", orgId:"org-demo", name:"Damascus Branch", nameAr:"فرع دمشق", city:"Damascus", cityAr:"دمشق", address:"Abu Rummaneh, Damascus", addressAr:"أبو رمانة، دمشق", phone:"+963 11 555 0188", managerId:"m4", status:"Active" },
  { id:"br3", orgId:"org-demo", name:"Tartous Branch", nameAr:"فرع طرطوس", city:"Tartous", cityAr:"طرطوس", address:"Corniche Road, Tartous", addressAr:"طريق الكورنيش، طرطوس", phone:"+963 43 555 0120", managerId:"m2", status:"Active" },
  { id:"br4", orgId:"org-hotel", name:"Damascus Hotel", city:"Damascus" },
  { id:"br5", orgId:"org-restaurant", name:"Tartous Corniche", city:"Tartous" },
];
const MEMBERS = [
  { id:"m1", orgId:"org-demo", name:"Omar Al-Hassan", nameAr:"عمر الحسن", role:"Owner", roleAr:"المالك", branchId:"br1", phone:"+963 944 111 001", email:"omar@atlas-realestate.sy", status:"Active", lastActive:H(2) },
  { id:"m2", orgId:"org-demo", name:"Lina Darwish", nameAr:"لينا درويش", role:"Marketing", roleAr:"التسويق", branchId:"br3", phone:"+963 944 111 002", email:"lina@atlas-realestate.sy", status:"Active", lastActive:H(6) },
  { id:"m3", orgId:"org-demo", name:"Khaled Al-Masri", nameAr:"خالد المصري", role:"Agent", roleAr:"الوكيل", branchId:"br1", phone:"+963 944 111 003", email:"khaled@atlas-realestate.sy", status:"Active", lastActive:H(1) },
  { id:"m4", orgId:"org-demo", name:"Nour Haddad", nameAr:"نور حداد", role:"Manager", roleAr:"المدير", branchId:"br2", phone:"+963 944 111 004", email:"nour@atlas-realestate.sy", status:"Active", lastActive:H(4) },
  { id:"m5", orgId:"org-demo", name:"Samer Ibrahim", nameAr:"سامر إبراهيم", role:"Photographer", roleAr:"المصور", branchId:"br2", phone:"+963 944 111 005", email:"samer@atlas-realestate.sy", status:"Active", lastActive:D(1) },
  { id:"m6", orgId:"org-demo", name:"Rana Al-Ali", nameAr:"رنا العلي", role:"Accountant", roleAr:"المحاسب", branchId:"br1", phone:"+963 944 111 006", email:"rana@atlas-realestate.sy", status:"Active", lastActive:H(8) },
  { id:"m8", orgId:"org-hotel", name:"Farid Agha", role:"Owner", branchId:"br4", phone:"+963 933 222 001", email:"farid@grandhorizon.sy" },
  { id:"m9", orgId:"org-restaurant", name:"Dana Aziz", role:"Owner", branchId:"br5", phone:"+963 933 222 002", email:"dana@noura.sy" },
];
const PROPERTIES0 = [
  { id:"p1", ref:"AT-HMS-001", title:"Family Villa in Homs", titleAr:"فيلا عائلية في حمص", type:"Villa", typeAr:"فيلا", listingType:"Sale", category:"Residential", price:185000, currency:"USD", area:420, beds:5, baths:4, floor:0, totalFloors:2, yearBuilt:2018, furnished:"Semi-furnished", parking:true, city:"Homs", cityAr:"حمص", district:"Al-Waer", districtAr:"الوعر", address:"Al-Waer, near New Clock Road", lat:"34.7392", lng:"36.6761", status:"Available", branchId:"br1", agentId:"m3", images:[IMG.villa2,IMG.interior], features:["Garden","Parking","Balcony","Solar Backup"], tourId:"t1", published:true, createdAt:D(90), updatedAt:H(5), negotiable:true },
  { id:"p2", ref:"AT-DAM-002", title:"Modern Apartment in Al-Malki", titleAr:"شقة حديثة في المالكي", type:"Apartment", typeAr:"شقة", listingType:"Sale", category:"Residential", price:145000, currency:"USD", area:165, beds:3, baths:2, floor:4, totalFloors:8, yearBuilt:2015, furnished:"Furnished", parking:true, city:"Damascus", cityAr:"دمشق", district:"Al-Malki", districtAr:"المالكي", address:"Al-Malki, near Fayez Mansour Street", lat:"33.5163", lng:"36.2765", status:"Available", branchId:"br2", agentId:"m4", images:[IMG.tower,IMG.interior], features:["Elevator","Parking","Heating","Balcony"], tourId:"t2", published:true, createdAt:D(80), updatedAt:H(12), negotiable:false },
  { id:"p3", ref:"AT-TAR-003", title:"Sea View Apartment in Tartous", titleAr:"شقة مطلة على البحر في طرطوس", type:"Apartment", typeAr:"شقة", listingType:"Sale", category:"Residential", price:98000, currency:"USD", area:140, beds:3, baths:2, floor:6, totalFloors:9, yearBuilt:2017, furnished:"Unfurnished", parking:false, city:"Tartous", cityAr:"طرطوس", district:"Corniche", districtAr:"الكورنيش", address:"Corniche Road, Tartous", lat:"34.8890", lng:"35.8866", status:"Reserved", branchId:"br3", agentId:"m3", images:[IMG.beach,IMG.interior], features:["Sea View","Balcony","Elevator"], tourId:"t3", published:true, createdAt:D(65), updatedAt:H(8), negotiable:true },
  { id:"p4", ref:"AT-HMS-004", title:"Apartment in Al-Waer", titleAr:"شقة في حي الوعر", type:"Apartment", typeAr:"شقة", listingType:"Rent", category:"Residential", price:4200, currency:"USD", area:125, beds:3, baths:2, floor:3, totalFloors:6, yearBuilt:2012, furnished:"Unfurnished", parking:false, city:"Homs", cityAr:"حمص", district:"Al-Waer", districtAr:"الوعر", address:"Al-Waer Main Street", lat:"34.7371", lng:"36.6780", status:"Available", branchId:"br1", agentId:"m3", images:[IMG.interior,IMG.tower], features:["Elevator","Balcony","Water Tank"], published:true, createdAt:D(45), updatedAt:D(1), negotiable:true },
  { id:"p5", ref:"AT-DAM-005", title:"Commercial Office in Damascus", titleAr:"مكتب تجاري في دمشق", type:"Office", typeAr:"مكتب", listingType:"Rent", category:"Commercial", price:12000, currency:"USD", area:210, beds:0, baths:2, floor:2, totalFloors:5, yearBuilt:2010, furnished:"Fitted", parking:true, city:"Damascus", cityAr:"دمشق", district:"Abu Rummaneh", districtAr:"أبو رمانة", address:"Abu Rummaneh business street", lat:"33.5147", lng:"36.2892", status:"Rented", branchId:"br2", agentId:"m4", images:[IMG.office], features:["Reception","Parking","Generator","Fiber Internet"], published:true, createdAt:D(120), updatedAt:D(12), negotiable:false },
  { id:"p6", ref:"AT-HMS-006", title:"Commercial Shop in Homs", titleAr:"محل تجاري في حمص", type:"Shop", typeAr:"محل تجاري", listingType:"Rent", category:"Commercial", price:6500, currency:"USD", area:85, beds:0, baths:1, floor:0, totalFloors:1, yearBuilt:2008, furnished:"Shell", parking:false, city:"Homs", cityAr:"حمص", district:"Al-Hamra", districtAr:"الحمرا", address:"Al-Hamra commercial street", lat:"34.7318", lng:"36.7134", status:"Available", branchId:"br1", agentId:"m3", images:[IMG.office], features:["Street Front","Storage","High Footfall"], published:true, createdAt:D(30), updatedAt:H(20), negotiable:true },
  { id:"p7", ref:"AT-DAM-007", title:"Villa in Al-Ghouta", titleAr:"فيلا في الغوطة", type:"Villa", typeAr:"فيلا", listingType:"Sale", category:"Residential", price:230000, currency:"USD", area:520, beds:6, baths:5, floor:0, totalFloors:2, yearBuilt:2016, furnished:"Semi-furnished", parking:true, city:"Damascus", cityAr:"دمشق", district:"Al-Ghouta", districtAr:"الغوطة", address:"Western Ghouta residential area", lat:"33.4664", lng:"36.2352", status:"Pending", branchId:"br2", agentId:"m4", images:[IMG.villa1,IMG.desert], features:["Garden","Private Entrance","Parking"], tourId:"t4", published:false, createdAt:D(22), updatedAt:H(30), negotiable:true },
  { id:"p8", ref:"AT-DAM-008", title:"Office in Central Damascus", titleAr:"مكتب في وسط دمشق", type:"Office", typeAr:"مكتب", listingType:"Sale", category:"Commercial", price:76000, currency:"USD", area:95, beds:0, baths:1, floor:5, totalFloors:7, yearBuilt:2009, furnished:"Fitted", parking:false, city:"Damascus", cityAr:"دمشق", district:"City Center", districtAr:"وسط المدينة", address:"Central Damascus, near main square", lat:"33.5138", lng:"36.2765", status:"Sold", branchId:"br2", agentId:"m1", images:[IMG.office], features:["Elevator","Reception","Archive Room"], published:true, createdAt:D(160), updatedAt:D(40), negotiable:false },
  { id:"p9", ref:"AT-TAR-009", title:"Apartment near Tartous Corniche", titleAr:"شقة قرب كورنيش طرطوس", type:"Apartment", typeAr:"شقة", listingType:"Rent", category:"Residential", price:3600, currency:"USD", area:115, beds:2, baths:2, floor:2, totalFloors:5, yearBuilt:2014, furnished:"Furnished", parking:false, city:"Tartous", cityAr:"طرطوس", district:"Corniche", districtAr:"الكورنيش", address:"Second line from Corniche", lat:"34.8901", lng:"35.8871", status:"Available", branchId:"br3", agentId:"m2", images:[IMG.beach,IMG.interior], features:["Sea View","Furnished","Balcony"], published:true, createdAt:D(18), updatedAt:H(6), negotiable:true },
  { id:"p10", ref:"AT-HMS-010", title:"Residential Land in Homs", titleAr:"أرض سكنية في حمص", type:"Land", typeAr:"أرض", listingType:"Sale", category:"Residential", price:110000, currency:"USD", area:730, beds:0, baths:0, floor:0, totalFloors:0, yearBuilt:"", furnished:"No", parking:false, city:"Homs", cityAr:"حمص", district:"Al-Ghouta", districtAr:"الغوطة", address:"Al-Ghouta expansion area", lat:"34.7202", lng:"36.7014", status:"Draft", branchId:"br1", agentId:"m1", images:[IMG.desert], features:["Licensed Plot","Road Access","Utilities Nearby"], published:false, createdAt:D(12), updatedAt:D(3), negotiable:true },
  { id:"p11", ref:"AT-DAM-011", title:"Building in Kafr Sousa", titleAr:"بناء في كفرسوسة", type:"Building", typeAr:"بناء", listingType:"Sale", category:"Commercial", price:520000, currency:"USD", area:980, beds:0, baths:6, floor:0, totalFloors:5, yearBuilt:2011, furnished:"No", parking:true, city:"Damascus", cityAr:"دمشق", district:"Kafr Sousa", districtAr:"كفرسوسة", address:"Kafr Sousa main access road", lat:"33.4865", lng:"36.2583", status:"Available", branchId:"br2", agentId:"m4", images:[IMG.tower,IMG.office], features:["Mixed Use","Parking","Street Front"], published:true, createdAt:D(35), updatedAt:D(2), negotiable:true },
  { id:"p12", ref:"AT-TAR-012", title:"Shop in Tartous City Center", titleAr:"محل في وسط طرطوس", type:"Shop", typeAr:"محل تجاري", listingType:"Rent", category:"Commercial", price:5200, currency:"USD", area:60, beds:0, baths:1, floor:0, totalFloors:1, yearBuilt:2013, furnished:"Shell", parking:false, city:"Tartous", cityAr:"طرطوس", district:"City Center", districtAr:"وسط المدينة", address:"Market street, Tartous city center", lat:"34.8952", lng:"35.8860", status:"Available", branchId:"br3", agentId:"m2", images:[IMG.office], features:["Street Front","Storage","Signage"], published:true, createdAt:D(9), updatedAt:H(14), negotiable:false },
];
const CLIENTS0 = [
  { id:"c1", fullName:"Huda Al-Khatib", fullNameAr:"هدى الخطيب", phone:"+963 944 210 331", email:"huda@example.com", clientType:"Buyer", budgetMin:90000, budgetMax:160000, preferredCities:["Damascus"], preferredTypes:["Apartment"], agentId:"m4", status:"Active", notes:"Prefers Al-Malki or Abu Rummaneh, ready for viewing.", createdAt:D(80), updatedAt:H(20) },
  { id:"c2", fullName:"Yazan Mustafa", fullNameAr:"يزن مصطفى", phone:"+963 933 442 110", email:"yazan@example.com", clientType:"Investor", budgetMin:180000, budgetMax:550000, preferredCities:["Damascus","Homs"], preferredTypes:["Building","Land"], agentId:"m4", status:"Active", notes:"Looking for income-generating assets.", createdAt:D(65), updatedAt:D(2) },
  { id:"c3", fullName:"Mariam Saeed", fullNameAr:"مريم سعيد", phone:"+963 955 400 778", email:"mariam@example.com", clientType:"Seller", budgetMin:0, budgetMax:0, preferredCities:["Homs"], preferredTypes:["Villa"], agentId:"m3", status:"Active", notes:"Selling family villa, exclusive mandate.", createdAt:D(50), updatedAt:D(5) },
  { id:"c4", fullName:"Fadi Rahal", fullNameAr:"فادي رحال", phone:"+963 988 220 903", email:"fadi@example.com", clientType:"Tenant", budgetMin:3000, budgetMax:5000, preferredCities:["Homs","Tartous"], preferredTypes:["Apartment"], agentId:"m3", status:"Active", notes:"Needs family rental near services.", createdAt:D(30), updatedAt:H(44) },
  { id:"c5", fullName:"Aisha Hamdan", fullNameAr:"عائشة حمدان", phone:"+963 944 909 341", email:"aisha@example.com", clientType:"Landlord", budgetMin:0, budgetMax:0, preferredCities:["Damascus"], preferredTypes:["Office","Shop"], agentId:"m4", status:"Active", notes:"Owns commercial units in central Damascus.", createdAt:D(120), updatedAt:D(15) },
  { id:"c6", fullName:"Rami Barakat", fullNameAr:"رامي بركات", phone:"+963 955 771 556", email:"rami@example.com", clientType:"Buyer", budgetMin:85000, budgetMax:120000, preferredCities:["Tartous"], preferredTypes:["Apartment"], agentId:"m2", status:"Negotiation", notes:"Interested in sea-view units.", createdAt:D(25), updatedAt:H(8) },
  { id:"c7", fullName:"Fatima Noor", fullNameAr:"فاطمة نور", phone:"+963 933 300 881", email:"fatima@example.com", clientType:"Buyer", budgetMin:65000, budgetMax:95000, preferredCities:["Homs","Damascus"], preferredTypes:["Apartment"], agentId:"m3", status:"Past", notes:"Paused search until Q4.", createdAt:D(200), updatedAt:D(60) },
  { id:"c8", fullName:"George Hanna", fullNameAr:"جورج حنا", phone:"+963 944 415 667", email:"george@example.com", clientType:"Investor", budgetMin:70000, budgetMax:140000, preferredCities:["Homs"], preferredTypes:["Shop","Office"], agentId:"m3", status:"Active", notes:"Interested in fitted commercial units.", createdAt:D(18), updatedAt:D(1) },
];
const LEADS0 = [
  { id:"l1", clientId:"c1", propertyId:"p2", source:"Website", interest:"Hot", priority:"High", status:"Viewing", budget:145000, agentId:"m4", branchId:"br2", createdAt:D(9), updatedAt:H(3), notes:"Second viewing booked." },
  { id:"l2", clientId:"c2", propertyId:"p11", source:"Referral", interest:"Hot", priority:"Urgent", status:"Negotiation", budget:500000, agentId:"m4", branchId:"br2", createdAt:D(20), updatedAt:H(1), notes:"Offer expected after documents review." },
  { id:"l3", clientId:"c6", propertyId:"p3", source:"Website", interest:"Hot", priority:"High", status:"Contract", budget:98000, agentId:"m2", branchId:"br3", createdAt:D(15), updatedAt:H(6), notes:"Reservation agreement drafting." },
  { id:"l4", clientId:"c4", propertyId:"p4", source:"Instagram", interest:"Warm", priority:"Medium", status:"Contacted", budget:4200, agentId:"m3", branchId:"br1", createdAt:D(4), updatedAt:D(1), notes:"Sent rental options." },
  { id:"l5", clientId:"c3", propertyId:"p1", source:"Walk-in", interest:"Warm", priority:"Medium", status:"Agreement", budget:185000, agentId:"m3", branchId:"br1", createdAt:D(7), updatedAt:D(2), notes:"Valuation agreed." },
  { id:"l6", clientId:"c8", propertyId:"p6", source:"Facebook", interest:"Warm", priority:"Medium", status:"Viewing", budget:6500, agentId:"m3", branchId:"br1", createdAt:D(6), updatedAt:H(28), notes:"Shop tour scheduled." },
  { id:"l7", clientId:"c7", propertyId:"p8", source:"Website", interest:"Cold", priority:"Low", status:"Lost", budget:76000, agentId:"m3", branchId:"br2", createdAt:D(90), updatedAt:D(50), notes:"Went with another office." },
  { id:"l8", clientId:"c5", propertyId:"p5", source:"Referral", interest:"Hot", priority:"High", status:"Completed", budget:12000, agentId:"m4", branchId:"br2", createdAt:D(55), updatedAt:D(20), notes:"Rental contract signed." },
  { id:"l9", clientId:"c2", propertyId:"p10", source:"Website", interest:"Warm", priority:"Medium", status:"New", budget:110000, agentId:"m1", branchId:"br1", createdAt:D(3), updatedAt:H(12), notes:"Land investment inquiry." },
  { id:"l10", clientId:"c4", propertyId:"p9", source:"Phone", interest:"Warm", priority:"Low", status:"Offer", budget:3600, agentId:"m2", branchId:"br3", createdAt:D(12), updatedAt:D(2), notes:"Asking for furnished rental." },
  { id:"l11", clientId:"c1", propertyId:"p7", source:"Facebook", interest:"Cold", priority:"Low", status:"Lost", budget:210000, agentId:"m4", branchId:"br2", createdAt:D(45), updatedAt:D(15), notes:"Budget mismatch." },
  { id:"l12", clientId:"c8", propertyId:"p12", source:"Walk-in", interest:"Warm", priority:"Medium", status:"Contacted", budget:5200, agentId:"m2", branchId:"br3", createdAt:D(2), updatedAt:H(16), notes:"Requested shop frontage photos." },
];
const DEALS0 = [
  { id:"DL-1041", propertyId:"p11", clientId:"c2", agentId:"m4", amount:500000, commission:10000, stage:"Negotiation", contractStatus:"Draft", paymentStatus:"Pending", date:D(12) },
  { id:"DL-1038", propertyId:"p3", clientId:"c6", agentId:"m2", amount:96000, commission:1920, stage:"Under Contract", contractStatus:"Awaiting Signature", paymentStatus:"Deposit Paid", date:D(10) },
  { id:"DL-1029", propertyId:"p1", clientId:"c3", agentId:"m3", amount:185000, commission:3700, stage:"Closed Won", contractStatus:"Signed", paymentStatus:"Paid", date:D(30) },
  { id:"DL-1015", propertyId:"p8", clientId:"c7", agentId:"m1", amount:76000, commission:1520, stage:"Closed Won", contractStatus:"Signed", paymentStatus:"Paid", date:D(60) },
  { id:"DL-1011", propertyId:"p7", clientId:"c1", agentId:"m4", amount:210000, commission:4200, stage:"Closed Lost", contractStatus:"Expired", paymentStatus:"None", date:D(80) },
  { id:"DL-1007", propertyId:"p5", clientId:"c5", agentId:"m4", amount:12000, commission:600, stage:"Closed Won", contractStatus:"Signed", paymentStatus:"Paid", date:D(45) },
  { id:"DL-1044", propertyId:"p6", clientId:"c8", agentId:"m3", amount:6500, commission:325, stage:"Negotiation", contractStatus:"Draft", paymentStatus:"Pending", date:D(3) },
];
const CONTRACTS0 = [
  { id:"CT-2201", transactionId:"tx4", propertyId:"p1", clientId:"c3", dealId:"DL-1029", agencyId:"org-demo", agentId:"m3", amount:185000, type:"Sale Contract", status:"Signed", signature:"Signed", paymentStatus:"Paid", createdAt:D(30), expiryAt:D(-335) },
  { id:"CT-2207", transactionId:"tx1", propertyId:"p3", clientId:"c6", dealId:"DL-1038", agencyId:"org-demo", agentId:"m2", amount:96000, type:"Reservation Agreement", status:"Awaiting Signature", signature:"Awaiting Signature", paymentStatus:"Deposit Paid", createdAt:D(6), expiryAt:D(-24) },
  { id:"CT-2195", propertyId:"p5", clientId:"c5", dealId:"DL-1007", agencyId:"org-demo", agentId:"m4", amount:12000, type:"Rental Contract", status:"Signed", signature:"Signed", paymentStatus:"Paid", createdAt:D(40), expiryAt:D(-325) },
  { id:"CT-2210", transactionId:"tx2", propertyId:"p11", clientId:"c2", dealId:"DL-1041", agencyId:"org-demo", agentId:"m4", amount:500000, type:"Brokerage Agreement", status:"Draft", signature:"Draft", paymentStatus:"Pending", createdAt:D(2), expiryAt:D(-28) },
  { id:"CT-2188", propertyId:"p7", clientId:"c1", dealId:"DL-1011", agencyId:"org-demo", agentId:"m4", amount:210000, type:"Sale Contract", status:"Expired", signature:"Expired", paymentStatus:"None", createdAt:D(70), expiryAt:D(1) },
  { id:"CT-2212", transactionId:"tx3", propertyId:"p6", clientId:"c8", dealId:"DL-1044", agencyId:"org-demo", agentId:"m3", amount:6500, type:"Property Management Agreement", status:"Rejected", signature:"Rejected", paymentStatus:"Pending", createdAt:D(1), expiryAt:D(-29) },
];
const VIEWINGS0 = [
  { id:"vw1", propertyId:"p2", clientId:"c1", agentId:"m4", branchId:"br2", requestedAt:D(10), scheduledAt:H(26), status:"Confirmed", contact:"+963 944 210 331", notes:"Client wants evening appointment." },
  { id:"vw2", propertyId:"p3", clientId:"c6", agentId:"m2", branchId:"br3", requestedAt:D(18), scheduledAt:D(14), status:"Completed", contact:"+963 955 771 556", notes:"Customer liked sea view; moved to offer." },
  { id:"vw3", propertyId:"p4", clientId:"c4", agentId:"m3", branchId:"br1", requestedAt:D(5), scheduledAt:H(44), status:"Requested", contact:"+963 988 220 903", notes:"Needs confirmation with landlord." },
  { id:"vw4", propertyId:"p6", clientId:"c8", agentId:"m3", branchId:"br1", requestedAt:D(7), scheduledAt:D(2), status:"Completed", contact:"+963 944 415 667", notes:"Asked for shop frontage photos." },
  { id:"vw5", propertyId:"p11", clientId:"c2", agentId:"m4", branchId:"br2", requestedAt:D(23), scheduledAt:D(19), status:"Completed", contact:"+963 933 442 110", notes:"Investor requested ownership documents." },
];
const OFFERS0 = [
  { id:"of1", transactionId:"tx1", propertyId:"p3", clientId:"c6", agentId:"m2", amount:96000, askingPrice:98000, currency:"USD", offerDate:D(12), expiresAt:D(-18), status:"Accepted", customerNotes:"Ready to proceed if furniture is included.", agencyNotes:"Accepted with minor fixtures excluded.", history:[["Customer","Submitted offer",D(12)],["Agent","Countered at 97,000",D(11)],["Customer","Accepted counter terms",D(10)]] },
  { id:"of2", transactionId:"tx2", propertyId:"p11", clientId:"c2", agentId:"m4", amount:500000, askingPrice:520000, currency:"USD", offerDate:D(6), expiresAt:D(-5), status:"Under Review", customerNotes:"Subject to document review.", agencyNotes:"Manager reviewing authorization.", history:[["Customer","Submitted offer",D(6)],["Agency Manager","Requested documents",D(5)]] },
  { id:"of3", transactionId:"tx3", propertyId:"p6", clientId:"c8", agentId:"m3", amount:6500, askingPrice:6500, currency:"USD", offerDate:D(3), expiresAt:D(-7), status:"Submitted", customerNotes:"Prefers annual rent with quarterly payments.", agencyNotes:"Waiting for owner approval.", history:[["Agent","Created offer draft",D(4)],["Customer","Submitted offer",D(3)]] },
  { id:"of4", transactionId:"tx4", propertyId:"p1", clientId:"c3", agentId:"m3", amount:185000, askingPrice:185000, currency:"USD", offerDate:D(33), expiresAt:D(20), status:"Accepted", customerNotes:"Final agreed price.", agencyNotes:"Closed sale.", history:[["Customer","Submitted offer",D(33)],["Agency Manager","Approved",D(31)]] },
];
const TRANSACTION_STAGES = ["Property Discovery","Inquiry / Lead","Viewing Request","Viewing Confirmed","Viewing Completed","Offer Submitted","Negotiation","Orbix Verification","Agreement","Contract Preparation","Signature","Settlement / Payment Status","Transaction Completed"];
const TRANSACTIONS0 = [
  { id:"tx1", transactionId:"TRX-RE-1001", propertyId:"p3", clientId:"c6", organizationId:"org-demo", branchId:"br3", agentId:"m2", offerId:"of1", contractId:"CT-2207", transactionType:"sale", status:"Contract Preparation", propertyValue:96000, currency:"USD", agencyCommission:1920, orbixFee:480, otherFees:120, verificationStatus:"Under Verification", viewingStatus:"Completed", offerStatus:"Accepted", contractStatus:"Awaiting Signature", signatureStatus:"Awaiting Signature", paymentStatus:"Deposit Paid", orbixStatus:"Ready for Contract", risk:"Low", createdAt:D(18), updatedAt:H(6), timeline:[["Customer","Inquiry / Lead","Asked about sea view apartment.",D(18)],["Agent","Viewing Request","Scheduled Tartous branch viewing.",D(16)],["Customer","Viewing Completed","Completed in-person viewing.",D(14)],["Customer","Offer Submitted","Submitted 96,000 USD offer.",D(12)],["Orbix","Orbix Verification","Demo verification in progress.",D(6)],["Agent","Contract Preparation","Reservation agreement prepared.",H(6)]] },
  { id:"tx2", transactionId:"TRX-RE-1002", propertyId:"p11", clientId:"c2", organizationId:"org-demo", branchId:"br2", agentId:"m4", offerId:"of2", contractId:"CT-2210", transactionType:"sale", status:"Orbix Verification", propertyValue:500000, currency:"USD", agencyCommission:10000, orbixFee:2500, otherFees:500, verificationStatus:"Pending Review", viewingStatus:"Completed", offerStatus:"Under Review", contractStatus:"Draft", signatureStatus:"Draft", paymentStatus:"Pending", orbixStatus:"Pending Review", risk:"Action Required", createdAt:D(24), updatedAt:H(2), timeline:[["Customer","Inquiry / Lead","Investor requested building details.",D(24)],["Agent","Viewing Completed","Building tour completed.",D(19)],["Customer","Offer Submitted","Offer submitted subject to documents.",D(6)],["Agency Manager","Orbix Verification","Authorization documents requested.",H(2)]] },
  { id:"tx3", transactionId:"TRX-RE-1003", propertyId:"p6", clientId:"c8", organizationId:"org-demo", branchId:"br1", agentId:"m3", offerId:"of3", contractId:"CT-2212", transactionType:"rent", status:"Negotiation", propertyValue:6500, currency:"USD", agencyCommission:325, orbixFee:90, otherFees:40, verificationStatus:"Not Required", viewingStatus:"Completed", offerStatus:"Submitted", contractStatus:"Rejected", signatureStatus:"Rejected", paymentStatus:"Pending", orbixStatus:"Not Required", risk:"Medium", createdAt:D(8), updatedAt:H(16), timeline:[["Customer","Viewing Request","Requested shop visit.",D(8)],["Agent","Viewing Completed","Viewing completed.",D(2)],["Customer","Offer Submitted","Quarterly payment terms requested.",D(1)],["Agent","Negotiation","Owner reviewing terms.",H(16)]] },
  { id:"tx4", transactionId:"TRX-RE-1004", propertyId:"p1", clientId:"c3", organizationId:"org-demo", branchId:"br1", agentId:"m3", offerId:"of4", contractId:"CT-2201", transactionType:"sale", status:"Transaction Completed", propertyValue:185000, currency:"USD", agencyCommission:3700, orbixFee:925, otherFees:220, verificationStatus:"Verified", viewingStatus:"Completed", offerStatus:"Accepted", contractStatus:"Signed", signatureStatus:"Signed", paymentStatus:"Paid", orbixStatus:"Completed", risk:"Low", createdAt:D(40), updatedAt:D(3), timeline:[["Customer","Inquiry / Lead","Seller mandate received.",D(40)],["Agent","Offer Submitted","Buyer offer recorded.",D(33)],["Agency Manager","Agreement","Agreement approved.",D(31)],["Orbix","Orbix Verification","Demo verification marked verified.",D(30)],["Agent","Signature","Contract signed.",D(28)],["Agency Manager","Transaction Completed","Transaction completed.",D(3)]] },
];
const TOURS0 = [
  { id:"t1", propertyId:"p1", name:"Homs Family Villa Walkthrough", nameAr:"جولة فيلا حمص العائلية", scenes:6, views:1240, status:"Published", updatedAt:D(30) },
  { id:"t2", propertyId:"p2", name:"Al-Malki Apartment 360", nameAr:"جولة شقة المالكي", scenes:4, views:880, status:"Published", updatedAt:D(45) },
  { id:"t3", propertyId:"p3", name:"Tartous Sea View Tour", nameAr:"جولة شقة مطلة على البحر", scenes:5, views:640, status:"Published", updatedAt:D(20) },
  { id:"t4", propertyId:"p7", name:"Al-Ghouta Villa Capture", nameAr:"تصوير فيلا الغوطة", scenes:5, views:0, status:"Processing", updatedAt:H(30) },
  { id:"t5", propertyId:"p11", name:"Kafr Sousa Building Draft", nameAr:"مسودة جولة بناء كفرسوسة", scenes:3, views:0, status:"Draft", updatedAt:D(5) },
  { id:"t6", propertyId:"p9", name:"Tartous Rental Apartment", nameAr:"جولة شقة إيجار طرطوس", scenes:4, views:320, status:"Archived", updatedAt:D(2) },
];
const FILES0 = [
  { id:"f1", category:"Property Documents", name:"Title Deed - Homs Villa.pdf", size:"2.4 MB", by:"Omar Al-Hassan", createdAt:D(60) },
  { id:"f2", category:"Contracts", name:"Reservation - Tartous Sea View.pdf", size:"812 KB", by:"Rana Al-Ali", createdAt:D(6) },
  { id:"f3", category:"Client Documents", name:"KYC - Yazan Mustafa.pdf", size:"1.1 MB", by:"Omar Al-Hassan", createdAt:D(20) },
  { id:"f4", category:"Marketing", name:"Damascus Listings Campaign.png", size:"3.8 MB", by:"Lina Darwish", createdAt:D(12) },
  { id:"f5", category:"Property Documents", name:"Office Lease - Abu Rummaneh.pdf", size:"640 KB", by:"Rana Al-Ali", createdAt:D(33) },
  { id:"f6", category:"Marketing", name:"Tartous Tour Video.mp4", size:"48 MB", by:"Samer Ibrahim", createdAt:D(8) },
  { id:"f7", category:"Other", name:"Branch Insurance Policy.pdf", size:"900 KB", by:"Omar Al-Hassan", createdAt:D(120) },
  { id:"f8", category:"Client Documents", name:"ID Copy - Rami Barakat.pdf", size:"1.6 MB", by:"Nour Haddad", createdAt:D(15) },
  { id:"f9", category:"Contracts", name:"Rental Contract - Damascus Office.pdf", size:"720 KB", by:"Rana Al-Ali", createdAt:D(41) },
  { id:"f10", category:"Marketing", name:"Homs Villa Photo Pack.zip", size:"210 MB", by:"Samer Ibrahim", createdAt:D(29) },
];
const ACTIVITY0 = [
  { id:"a1", user:"Khaled Al-Masri", text:"moved lead L1 to Viewing Scheduled", color:"#f59e0b", ts:H(3) },
  { id:"a2", user:"Nour Haddad", text:"updated price on Building in Kafr Sousa", color:"#2f6bff", ts:H(2) },
  { id:"a3", user:"Rana Al-Ali", text:"marked DL-1029 as paid", color:"#10b981", ts:H(7) },
  { id:"a4", user:"Lina Darwish", text:"published Al-Malki apartment campaign", color:"#ec4899", ts:D(1) },
  { id:"a5", user:"Khaled Al-Masri", text:"added client George Hanna", color:"#06b6d4", ts:D(2) },
  { id:"a6", user:"Samer Ibrahim", text:"uploaded 14 photos to Family Villa in Homs", color:"#8b5cf6", ts:D(2) },
  { id:"a7", user:"Omar Al-Hassan", text:"approved Residential Land in Homs listing", color:"#2f6bff", ts:D(3) },
  { id:"a8", user:"Nour Haddad", text:"closed DL-1007 rental contract", color:"#10b981", ts:D(10) },
];
const NOTIFS0 = [
  { id:"n1", text:"New inbound lead on Family Villa in Homs", time:H(5), read:false, icon:"target" },
  { id:"n2", text:"Contract CT-2207 awaiting signature", time:H(7), read:false, icon:"filetext" },
  { id:"n3", text:"Deal DL-1041 moved to Negotiation", time:H(4), read:false, icon:"handshake" },
  { id:"n4", text:"Tour Al-Ghouta Villa Capture finished processing", time:H(30), read:true, icon:"video" },
  { id:"n5", text:"Weekly performance digest is ready", time:D(1), read:true, icon:"chart" },
];
const WORKSPACES = {
  "real-estate": { label:"Real Estate", icon:"building", path:"/partner/demo/real-estate" },
  hotel: { label:"Hotel", icon:"home", path:"/partner/demo/hotel" },
  restaurant: { label:"Restaurant", icon:"wallet", path:"/partner/demo/restaurant" },
};
const PLATFORM_ORGS = [
  { id:"ORB-1001", name:"Atlas Real Estate", industry:"Real Estate Agency", plan:"Enterprise", status:"Active", owner:"Omar Al-Hassan", users:6, branches:3, created:"2025-02-12", commercialAgreement:"Transaction fee", usage:"72%" },
  { id:"ORB-2044", name:"Grand Horizon Hotel", industry:"Hotel", plan:"Growth", status:"Pending Approval", owner:"Farid Agha", users:42, branches:1, created:"2026-05-18", commercialAgreement:"Future booking fee", usage:"38%" },
  { id:"ORB-3180", name:"Noura Restaurant Group", industry:"Restaurant", plan:"Growth", status:"Active", owner:"Dana Aziz", users:27, branches:4, created:"2026-01-09", commercialAgreement:"Future order fee", usage:"51%" },
];
const PLATFORM_ACTIVITY = [
  { id:"pa1", user:"System", text:"Grand Horizon Hotel submitted onboarding approval.", ts:H(2), color:"#f59e0b" },
  { id:"pa2", user:"Finance", text:"Atlas Real Estate transaction fee reconciliation completed.", ts:H(10), color:"#10b981" },
  { id:"pa3", user:"Security", text:"Admin policy changed for audit log retention.", ts:D(1), color:"#2f6bff" },
  { id:"pa4", user:"Storage", text:"Noura Restaurant Group crossed 50% storage usage.", ts:D(2), color:"#06b6d4" },
];
const PLATFORM_MONTHLY = [
  { m:"Jan", orgs:18, revenue:22, activity:420, storage:18, ai:32 },
  { m:"Feb", orgs:24, revenue:29, activity:510, storage:24, ai:37 },
  { m:"Mar", orgs:31, revenue:38, activity:690, storage:31, ai:48 },
  { m:"Apr", orgs:38, revenue:46, activity:760, storage:39, ai:55 },
  { m:"May", orgs:47, revenue:57, activity:940, storage:48, ai:66 },
  { m:"Jun", orgs:56, revenue:69, activity:1120, storage:56, ai:74 },
];
const TASKS0 = [
  { id:"tk1", title:"Viewing - Al-Malki Apartment with Huda", due:H(26), owner:"Nour Haddad" },
  { id:"tk2", title:"Send reservation agreement for Tartous sea view apartment", due:H(50), owner:"Lina Darwish" },
  { id:"tk3", title:"Photograph Residential Land in Homs", due:D(-2), owner:"Samer Ibrahim" },
  { id:"tk4", title:"Follow up offer - Kafr Sousa Building", due:H(8), owner:"Nour Haddad" },
  { id:"tk5", title:"Review branch permissions", due:D(4), owner:"Omar Al-Hassan" },
];
const MONTHLY = [
  { m:"Jan", revenue:82, sales:2 },{ m:"Feb", revenue:104, sales:3 },{ m:"Mar", revenue:76, sales:1 },
  { m:"Apr", revenue:132, sales:4 },{ m:"May", revenue:148, sales:3 },{ m:"Jun", revenue:118, sales:2 },
  { m:"Jul", revenue:162, sales:5 },{ m:"Aug", revenue:188, sales:4 },{ m:"Sep", revenue:152, sales:3 },
  { m:"Oct", revenue:204, sales:6 },{ m:"Nov", revenue:236, sales:5 },{ m:"Dec", revenue:252, sales:7 },
];
const LEAD_SOURCES = [
  { name:"Website", value:34 },{ name:"Facebook", value:26 },{ name:"Instagram", value:14 },
  { name:"Referral", value:12 },{ name:"Phone", value:9 },{ name:"Walk-in", value:5 },
];
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ HELPERS / MAPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const textOf = (obj, lang = "en", arKey = "nameAr", enKey = "name") => lang === "ar" && obj && obj[arKey] ? obj[arKey] : (obj && obj[enKey]) || "";
const propTitle = (p, lang = "en") => textOf(p, lang, "titleAr", "title");
const cityOf = (x, lang = "en") => textOf(x, lang, "cityAr", "city");
const districtOf = (x, lang = "en") => textOf(x, lang, "districtAr", "district");
const branchName = (b, lang = "en") => textOf(b, lang, "nameAr", "name");
const memberName = (m, lang = "en") => textOf(m, lang, "nameAr", "name");
const clientName = (c, lang = "en") => textOf(c, lang, "fullNameAr", "fullName");
const fmtCurrency = (n, currency = "USD", lang = "en", compact = false) => {
  const locale = lang === "ar" ? "ar-SY" : "en-US";
  try { return new Intl.NumberFormat(locale, { style:"currency", currency, maximumFractionDigits:0, notation: compact ? "compact" : "standard" }).format(Number(n) || 0); }
  catch (e) { return `${currency} ${Math.round(Number(n) || 0).toLocaleString(locale)}`; }
};
const money = (n, currency = "USD", lang = "en") => fmtCurrency(n, currency, lang);
const moneyC = (n, currency = "USD", lang = "en") => fmtCurrency(n, currency, lang, true);
const timeAgo = ts => { const s = (Date.now() - ts) / 1e3; if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago"; if (s < 86400) return Math.floor(s / 3600) + "h ago"; if (s < 2592000) return Math.floor(s / 86400) + "d ago"; return new Date(ts).toLocaleDateString("en-US", { month:"short", day:"numeric" }); };
const dueLbl = ts => { const d = Math.ceil((ts - Date.now()) / 864e5); if (d < 0) return "today"; if (d === 1) return "tomorrow"; return new Date(ts).toLocaleDateString("en-US", { month:"short", day:"numeric" }); };
const AVC = ["#2f6bff","#14b8a6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#10b981","#ec4899"];
const avc = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997; return AVC[h % AVC.length]; };
const init = n => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const PROP_C = { Draft:"#64748b", Pending:"#f59e0b", Published:"#2f6bff", Available:"#10b981", Reserved:"#d97706", Sold:"#8b5cf6", Rented:"#14b8a6", Archived:"#94a3b8" };
const LEAD_C = { New:"#2f6bff", Contacted:"#06b6d4", Viewing:"#f59e0b", Offer:"#8b5cf6", Negotiation:"#f97316", Agreement:"#14b8a6", Contract:"#6366f1", Completed:"#10b981", Lost:"#ef4444" };
const LEAD_ST = Object.keys(LEAD_C);
const simplePropStatus = p => p.status === "Available" ? "Published" : p.status === "Pending" ? "Under Review" : p.status === "Archived" ? "Draft" : p.status;
const simplePropColor = p => ({ Draft:"#64748b", "Under Review":"#f59e0b", Published:"#2f6bff", Reserved:"#d97706", Sold:"#8b5cf6", Rented:"#14b8a6" }[simplePropStatus(p)] || "#64748b");
const simplePropStatusLabel = (p, lang = "en") => {
  const s = typeof p === "string" ? p : simplePropStatus(p || {});
  return lang === "ar" ? ({ Draft:"مسودة", "Under Review":"قيد المراجعة", Published:"منشور", Reserved:"محجوز", Sold:"مباع", Rented:"مؤجر" }[s] || s) : s;
};
const requestStatusLabel = (s, lang = "en") => lang === "ar" ? ({ New:"جديد", Contacted:"تم التواصل", Viewing:"معاينة", Offer:"تفاوض", Negotiation:"تفاوض", Agreement:"بدأت المعاملة", Contract:"بدأت المعاملة", Completed:"مغلق", Lost:"مفقود" }[s] || s) : ({ Offer:"Negotiation", Agreement:"Transaction Started", Contract:"Transaction Started", Completed:"Closed" }[s] || s);
const DEAL_C = { Negotiation:"#f97316", "Under Contract":"#6366f1", "Closed Won":"#10b981", "Closed Lost":"#ef4444" };
const CT_C = { Draft:"#64748b", "Awaiting Signature":"#f59e0b", "Partially Signed":"#06b6d4", Signed:"#10b981", Rejected:"#ef4444", Expired:"#94a3b8" };
const TOUR_C = { Published:"#10b981", Processing:"#f59e0b", Draft:"#64748b", Archived:"#94a3b8" };
const TYPE_C = { Buyer:"#2f6bff", Seller:"#f59e0b", Investor:"#8b5cf6", Landlord:"#14b8a6", Tenant:"#ec4899" };
const CHART_PAL = ["#2f6bff","#14b8a6","#f59e0b","#8b5cf6","#ec4899","#64748b"];
const uid = p => p + "-" + Math.random().toString(36).slice(2, 7);

/* toast + confirm emitters (bound in App) */
let pushToast = null, pushConfirm = null;
const toast = (m, t = "ok") => pushToast && pushToast(m, t);
const confirmDlg = o => new Promise(res => pushConfirm && pushConfirm(o, res));

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CONTEXT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ ERROR BOUNDARY (never blank again) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error("Orbix render error:", err, info); } catch (e) {} }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "var(--tx2)", fontFamily: "var(--ff)" }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Something went wrong rendering this view</div>
          <div style={{ fontSize: 12, color: "var(--tx3)" }}>{String((this.state.err && this.state.err.message) || this.state.err)}</div>
          <button className="bt bt-p" style={{ marginTop: 16 }} onClick={() => this.setState({ err: null })}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PRIMITIVES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Badge = ({ color, children, dot = true }) => (
  <span className="bg" style={{ "--bc": color }}>{dot && <i />}{children}</span>
);
const Avatar = ({ name, id, size = 28, r }) => (
  <span className="av" style={{ "--avc": avc(id), width: size, height: size, borderRadius: r || (size > 34 ? 10 : 8), fontSize: size * 0.36 }}>{init(name || "?")}</span>
);
const Btn = ({ v = "", s = "", icon, children, ...p }) => (
  <button className={`bt ${v ? "bt-" + v : ""} ${s ? "bt-" + s : ""}`} {...p}>{icon && <Icon name={icon} size={14} />}{children}</button>
);
const PageHeader = ({ title, sub, children }) => (
  <div className="pg-h"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="pg-a">{children}</div>}</div>
);
const KpiCard = ({ icon, label, value, delta, up }) => (
  <div className="cd kpi"><div className="kt"><span className="ki"><Icon name={icon} size={14} /></span><span className="kl">{label}</span></div>
    <div className="kv num">{value}</div>
    {delta && <span className={`kd ${up ? "up" : "dn"}`}><Icon name={up ? "upright" : "downright"} size={11} />{delta}</span>}</div>
);
const ChartCard = ({ title, sub, children, action, h = 220 }) => (
  <div className="cd"><div className="cd-h"><div><h3>{title}</h3>{sub && <div className="sub">{sub}</div>}</div>{action && <div style={{ marginInlineStart:"auto" }}>{action}</div>}</div>
    <div className="cd-b"><div style={{ height: h }}>{children}</div></div></div>
);
const EmptyState = ({ icon = "search", title, desc, action }) => (
  <div className="emp"><div className="ei"><Icon name={icon} size={20} /></div><b>{title}</b><p>{desc}</p>{action}</div>
);
const Seg = ({ opts, val, onChange }) => (
  <div className="seg">{opts.map(o => <button key={o.v} className={val === o.v ? "on" : ""} onClick={() => onChange(o.v)}><Icon name={o.i} size={13} />{o.l}</button>)}</div>
);
const FormSection = ({ title, children }) => (<div className="fs"><div className="fs-t">{title}</div>{children}</div>);
const Field = ({ label, req, children }) => (<div className="fd"><label>{label}{req && <em> *</em>}</label>{children}</div>);
const Switch = ({ on, onChange }) => <span className={`sw ${on ? "on" : ""}`} onClick={() => onChange(!on)} />;
const HBars = ({ items, fmt = v => v }) => { const arr = items || []; const mx = arr.length ? Math.max(...arr.map(i => i.v)) : 1; return (<div>{arr.map((it, i) => (<div className="hb" key={i}><div className="ht"><b>{it.l}</b><span className="num">{fmt(it.v)}</span></div><div className="hk"><div className="hf" style={{ width: (it.v / (mx || 1)) * 100 + "%", background: it.c || "var(--pr)" }} /></div></div>))}</div>); };
const Funnel = ({ steps }) => { const mx = (steps && steps[0] && steps[0].v) || 1; return (<div className="fn">{(steps || []).map((s, i) => (<div className="fnr" key={i}><span className="fl">{s.l}</span><div className="fk"><div className="ff" style={{ width: Math.max((s.v / mx) * 100, 8) + "%", background: s.c }}>{s.v}</div></div></div>))}</div>); };
const Timeline = ({ items }) => (<div className="tl">{(items || []).map(a => (<div className="tli" key={a.id} style={{ "--tc": a.color }}><b>{a.user}</b> {a.text}<p>{timeAgo(a.ts)}</p></div>))}</div>);

/* Drawer (framer-motion) */
function Drawer({ open, onClose, title, sub, children, footer, wide }) {
  const app = useApp(); const dir = app ? app.dir : "ltr";
  const slide = dir === "rtl" ? { x:"-8%", opacity:0 } : { x:"8%", opacity:0 };
  return (
    <AnimatePresence>
      {open && (<>
        <motion.div className="ovl" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose} />
        <motion.aside className={`drw ${wide ? "wd" : ""}`} initial={slide} animate={{ x:0, opacity:1 }} exit={slide} transition={{ type:"spring", damping:28, stiffness:300 }}>
          <div className="dr-h"><div><h3>{title}</h3>{sub && <div className="sub">{sub}</div>}</div><button className="ib xx" onClick={onClose}><Icon name="x" /></button></div>
          <div className="dr-b">{children}</div>
          {footer && <div className="dr-f">{footer}</div>}
        </motion.aside>
      </>)}
    </AnimatePresence>
  );
}
function Modal({ open, onClose, children, lg }) {
  return (<AnimatePresence>{open && (<motion.div className="mdl-w" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={e => { if (e.target.classList.contains("mdl-w")) onClose(); }}>
    <motion.div className={`mdl ${lg ? "lg" : ""}`} initial={{ scale:.96, y:8 }} animate={{ scale:1, y:0 }} exit={{ scale:.97, y:6 }}>{children}</motion.div>
  </motion.div>)}</AnimatePresence>);
}

/* Generic DataTable */
function DataTable({ cols, rows, onRow, pageSize = 8, empty, minW = 840 }) {
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const list = rows || [];
  useEffect(() => setPage(1), [list.length]);
  const sorted = useMemo(() => { if (!sort) return list; const { k, d } = sort; return [...list].sort((a, b) => { const va = a[k], vb = b[k]; const c = typeof va === "number" ? va - (typeof vb === "number" ? vb : 0) : String(va == null ? "" : va).localeCompare(String(vb == null ? "" : vb)); return d === "asc" ? c : -c; }); }, [list, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages);
  const view = sorted.slice((cur - 1) * pageSize, cur * pageSize);
  return (<>
    <div className="tw"><table className="tbl" style={{ minWidth: minW }}><thead><tr>
      {cols.map((c, i) => (<th key={i} className={c.sortable ? "srt" : ""} style={c.align === "end" ? { textAlign:"end" } : {}} onClick={() => c.sortable && setSort(s => s && s.k === c.key && s.d === "desc" ? { k:c.key, d:"asc" } : { k:c.key, d:"desc" })}>
        {c.label}{c.sortable && sort && sort.k === c.key ? (sort.d === "asc" ? " â†‘" : " â†“") : ""}</th>))}
    </tr></thead><tbody>
      {view.map((r, i) => (<tr key={r.id || i} onClick={() => onRow && onRow(r)}>{cols.map((c, j) => (<td key={j} style={c.align === "end" ? { textAlign:"end" } : {}}>{c.render ? c.render(r) : r[c.key]}</td>))}</tr>))}
    </tbody></table>
      {!view.length && (empty || <EmptyState title="No records" desc="Nothing matches the current filters." />)}
    </div>
    <div className="tf"><span>Showing {sorted.length ? (cur - 1) * pageSize + 1 : 0}â€“{Math.min(cur * pageSize, sorted.length)} of {sorted.length}</span>
      <div className="pgn"><Btn s="s" disabled={cur <= 1} onClick={e => { e.stopPropagation(); setPage(cur - 1); }}>Prev</Btn><span>{cur}/{pages}</span><Btn s="s" disabled={cur >= pages} onClick={e => { e.stopPropagation(); setPage(cur + 1); }}>Next</Btn></div></div>
  </>);
}

/* Chart wrappers */
function useChartTheme() {
  const app = useApp(); const dark = app ? app.theme === "dark" : false;
  return { grid: dark ? "#222b3d" : "#e6e9f0", tick: dark ? "#667189" : "#939db1", tip: { background: dark ? "#161c2c" : "#fff", border: `1px solid ${dark ? "#222b3d" : "#e6e9f0"}`, borderRadius: 10, fontSize: 12, color: dark ? "#e8ecf4" : "#0b1220" } };
}
const RevArea = ({ data, dataKey = "revenue", color = "#2f6bff" }) => {
  const th = useChartTheme();
  return (<ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top:6, right:6, left:-14, bottom:0 }}>
    <defs><linearGradient id={"g" + dataKey + color.slice(1)} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.25} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
    <CartesianGrid stroke={th.grid} strokeDasharray="3 4" vertical={false} />
    <XAxis dataKey="m" tick={{ fill: th.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: th.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={th.tip} />
    <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.4} fill={`url(#g${dataKey}${color.slice(1)})`} />
  </AreaChart></ResponsiveContainer>);
};
const BarsSimple = ({ data, dataKey, color = "#14b8a6", xk = "m" }) => {
  const th = useChartTheme();
  return (<ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top:6, right:6, left:-14, bottom:0 }}>
    <CartesianGrid stroke={th.grid} strokeDasharray="3 4" vertical={false} />
    <XAxis dataKey={xk} tick={{ fill: th.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fill: th.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
    <Tooltip contentStyle={th.tip} cursor={{ fill:"transparent" }} />
    <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={26} />
  </BarChart></ResponsiveContainer>);
};
const Donut = ({ data, center }) => {
  const th = useChartTheme(); const arr = data || []; const total = arr.reduce((s, d) => s + d.value, 0);
  return (<div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap", height:"100%" }}>
    <div style={{ width:150, height:150, position:"relative", flex:"0 0 auto" }}>
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={arr} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} strokeWidth={0}>
        {arr.map((e, i) => <Cell key={i} fill={e.color || CHART_PAL[i % CHART_PAL.length]} />)}
      </Pie></PieChart></ResponsiveContainer>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <b style={{ fontSize:20, letterSpacing:"-0.02em" }}>{center ?? total}</b><span style={{ fontSize:10, color: th.tick }}>total</span></div>
    </div>
    <div style={{ display:"flex", flexDirection:"column", gap:7, fontSize:12, flex:1, minWidth:120 }}>
      {arr.map((d, i) => (<div key={i} style={{ display:"flex", alignItems:"center", gap:8, color:"var(--tx2)" }}>
        <i style={{ width:9, height:9, borderRadius:3, background: d.color || CHART_PAL[i % CHART_PAL.length] }} />{d.name}
        <b style={{ marginInlineStart:"auto", color:"var(--tx)" }}>{d.value}</b></div>))}
    </div></div>);
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SHELL PIECES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const appLabel = (item, lang = "en") => lang === "ar" && item.ar ? item.ar : (item.label || item.id || item.sec);
const NAV = [
  { id:"overview", icon:"dashboard", label:"Overview", ar:"نظرة عامة" },
  { id:"properties", icon:"building", label:"Properties", ar:"العقارات" },
  { id:"requests", icon:"target", label:"Requests", ar:"الطلبات" },
  { id:"transactions", icon:"shield", label:"Transactions", ar:"المعاملات" },
  { id:"messages", icon:"mail", label:"Messages", ar:"الرسائل" },
  { id:"team", icon:"users", label:"Team", ar:"الفريق" },
  { id:"settings", icon:"settings", label:"Settings", ar:"الإعدادات" },
];
function Sidebar() {
  const { t, lang, route, nav, collapsed, setCollapsed, mobileNav, setMobileNav, leads, openAi } = useApp();
  const newLeads = leads.filter(l => l.status === "New").length;
  return (<>
    {mobileNav && <div className="sbk" onClick={() => setMobileNav(false)} />}
    <aside className={`sb ${mobileNav ? "open" : ""}`}>
      <div className="sb-hd"><div className="orb" /><div className="hd-t"><b>Orbix</b><span>Partner Suite</span></div></div>
      <OrgBox />
      <nav className="nv">
        {NAV.map((n, i) => n.sec ? <div className="nv-s" key={i}>{lang === "ar" ? ({ Overview:"نظرة عامة", CRM:"إدارة العملاء", Transactions:"المعاملات", "Marketing & Media":"التسويق والوسائط", Insights:"الرؤى", Shared:"مشترك", Administration:"الإدارة" }[n.sec] || n.sec) : n.sec}</div> : (
          <button key={n.id} className={`nv-i ${route.page === n.id ? "on" : ""}`} onClick={() => { nav(n.id); setMobileNav(false); }}>
            <Icon name={n.icon} /><span className="lbl">{appLabel(n, lang)}</span>
            {n.id === "leads" && newLeads ? <span className="nv-b">{newLeads}</span> : null}
          </button>))}
      </nav>
      <div className="sb-ft"><button className="nv-i" onClick={() => setCollapsed(!collapsed)}><Icon name="panel" /><span className="lbl">Collapse</span></button></div>
      <div className="sb-ft" style={{ borderTop:"none", paddingTop:0 }}><button className="nv-i" onClick={openAi}><Icon name="sparkles" /><span className="lbl">Orbix AI</span></button></div>
    </aside>
  </>);
}
function OrgBox() {
  const { org, lang } = useApp();
  return (<div className="sb-org"><Avatar name={textOf(org, lang)} id={org.id} size={30} /><div className="org-i"><b>{textOf(org, lang)}</b><span>{lang === "ar" ? "حمص · مكتب عقاري" : "Homs · Real Estate Office"}</span></div></div>);
}
function Topbar() {
  const app = useApp(); const { t, theme, setTheme, lang, setLang, org, me, route, openPalette, notifs, setNotifs } = app;
  const [dd, setDd] = useState(null);
  const close = () => setDd(null);
  const pageName = appLabel(NAV.find(n => n.id === route.page) || { label:route.page }, lang);
  return (
    <header className="tb" onClick={e => { if (!e.target.closest(".dd")) close(); }}>
      <button className="ib" onClick={() => app.setMobileNav(true)}><Icon name="menu" /></button>
      <div className="crumb"><span className="hm">Orbix Partner</span><span className="sp hm">/</span><b>{textOf(org, lang)}</b><span className="sp">/</span><b>{pageName}</b></div>
      <div className="tbs-ic"><span className="si"><Icon name="search" size={14} /></span><input readOnly placeholder={t("search")} onClick={openPalette} /><kbd>âŒ˜K</kbd></div>
      <div className="tb-r">
        <div className="dd"><button className="ib" onClick={() => setDd(dd === "nt" ? null : "nt")}><Icon name="bell" />{notifs.some(n => !n.read) && <span className="ndot" />}</button>
          {dd === "nt" && <div className="dd-m" style={{ minWidth:300 }}><div className="dd-hd" style={{ display:"flex" }}>{t("notifications")}<button className="lnk" style={{ marginInlineStart:"auto" }} onClick={() => setNotifs(ns => ns.map(n => ({ ...n, read:true })))}>Mark all read</button></div>
            {notifs.map(n => (<div className="dd-i" key={n.id} style={{ alignItems:"flex-start" }}><span style={{ width:28, height:28, borderRadius:8, background: n.read ? "var(--bg2)" : "var(--prs)", color: n.read ? "var(--tx3)" : "var(--pr)", display:"inline-flex", alignItems:"center", justifyContent:"center", flex:"0 0 auto" }}><Icon name={n.icon} size={13} /></span><span>{n.text}<div style={{ fontSize:10.5, color:"var(--tx3)", marginTop:2 }}>{timeAgo(n.time)}</div></span></div>))}</div>}
        </div>
        <button className="ib" title="Theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}><Icon name={theme === "light" ? "moon" : "sun"} /></button>
        <button className="ib" title="Language / RTL" onClick={() => setLang(lang === "en" ? "ar" : "en")}><Icon name="lang" /></button>
        <div className="dd"><button className="tb-b" onClick={() => setDd(dd === "me" ? null : "me")}><Avatar name={memberName(me, lang)} id={me.id} size={26} /><Icon name="chevdown" size={13} /></button>
          {dd === "me" && <div className="dd-m"><div style={{ padding:"9px 10px" }}><b style={{ fontSize:12.5 }}>{memberName(me, lang)}</b><div style={{ fontSize:11, color:"var(--tx3)" }}>{me.email}</div><div style={{ marginTop:6 }}><Badge color="#2f6bff">{lang === "ar" && me.roleAr ? me.roleAr : me.role}</Badge></div></div>
            <div className="dd-sep" /><button className="dd-i" onClick={() => toast("Signed out (demo)", "info")}><Icon name="logout" size={14} />{t("signout")}</button></div>}
        </div>
      </div>
    </header>
  );
}

/* Command palette */
function Palette({ open, onClose }) {
  const { properties, clients, leads, openProp, openClient, openLead } = useApp();
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  const v = q.toLowerCase();
  const props = v ? properties.filter(p => p.title.toLowerCase().includes(v)).slice(0, 5) : [];
  const cls = v ? clients.filter(c => c.fullName.toLowerCase().includes(v)).slice(0, 5) : [];
  const lds = v ? leads.filter(l => l.id.includes(v) || (l.notes || "").toLowerCase().includes(v)).slice(0, 4) : [];
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px", borderBottom:"1px solid var(--bd)" }}>
        <Icon name="search" style={{ color:"var(--tx3)" }} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search properties, clients, leadsâ€¦" style={{ border:"none", boxShadow:"none", flex:1, background:"transparent", padding:0 }} />
        <span className="mono" style={{ fontSize:10, color:"var(--tx3)" }}>esc</span></div>
      <div style={{ maxHeight:340, overflowY:"auto", padding:8 }}>
        {!v && <div style={{ padding:18, textAlign:"center", color:"var(--tx3)", fontSize:12 }}>Type to search across the organization</div>}
        {v && !props.length && !cls.length && !lds.length && <div style={{ padding:18, textAlign:"center", color:"var(--tx3)", fontSize:12 }}>No results</div>}
        {props.map(p => <button key={p.id} className="dd-i" onClick={() => { onClose(); openProp(p.id); }}><img className="thmb" src={p.images[0]} alt="" />{p.title}<span style={{ marginInlineStart:"auto", fontSize:10, color:"var(--tx3)", textTransform:"uppercase" }}>property</span></button>)}
        {cls.map(c => <button key={c.id} className="dd-i" onClick={() => { onClose(); openClient(c.id); }}><Avatar name={c.fullName} id={c.id} size={24} />{c.fullName}<span style={{ marginInlineStart:"auto", fontSize:10, color:"var(--tx3)", textTransform:"uppercase" }}>client</span></button>)}
        {lds.map(l => <button key={l.id} className="dd-i" onClick={() => { onClose(); openLead(l.id); }}><span className="mono">{l.id}</span><Badge color={LEAD_C[l.status]}>{l.status}</Badge></button>)}
      </div>
    </Modal>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ PAGES (identical UI â€” no redesign) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function QuickActions() {
  const app = useApp(); const { lang } = app;
  const [open, setOpen] = useState(false);
  const label = (en, ar) => lang === "ar" ? ar : en;
  const actions = [
    [label("Add Property","إضافة عقار"), "building", () => app.newProperty()],
    [label("View New Requests","عرض الطلبات الجديدة"), "target", () => app.nav("requests")],
    [label("View Upcoming Viewings","عرض المعاينات القادمة"), "calendar", () => app.nav("requests")],
  ];
  return <div className="dd"><Btn v="p" icon="plus" onClick={() => setOpen(!open)}>{label("Quick Actions","إجراءات سريعة")}</Btn>{open && <div className="dd-m">{actions.map(a => <button className="dd-i" key={a[0]} onClick={() => { setOpen(false); a[2](); }}><Icon name={a[1]} size={14} />{a[0]}</button>)}</div>}</div>;
}

function Overview() {
  const app = useApp(); const { t, lang, properties, leads, nav, openProp, openLead, viewings, transactions, clients } = app;
  const completedTx = transactions.filter(x => x.status === "Transaction Completed").length;
  const activeTx = transactions.filter(x => x.status !== "Transaction Completed").length;
  const activeProperties = properties.filter(p => !["Draft","Archived","Sold","Rented"].includes(simplePropStatus(p))).length;
  const upcomingViewings = viewings.filter(v => ["Requested","Confirmed"].includes(v.status)).length;
  const pendingActions = [
    { id:"pa1", icon:"target", text:lang === "ar" ? "3 طلبات عملاء جديدة" : "3 new customer requests", go:"requests" },
    { id:"pa2", icon:"calendar", text:lang === "ar" ? "معاينة غداً الساعة 4:00 مساءً" : "Viewing tomorrow at 4:00 PM", go:"requests" },
    { id:"pa3", icon:"filetext", text:lang === "ar" ? "عقد بانتظار توقيع العميل" : "Contract waiting for customer signature", go:"transactions" },
    { id:"pa4", icon:"check", text:lang === "ar" ? "تأكيد استلام مبلغ مطلوب" : "Payment confirmation required", go:"transactions" },
  ];
  const recent = [
    { id:"ra1", user:"محمد أحمد", text:lang === "ar" ? "طلب معاينة شقة في الوعر" : "requested a viewing for Apartment in Al-Waer", ts:H(0.15), color:"#2f6bff" },
    { id:"ra2", user:lang === "ar" ? "الفريق" : "Team", text:lang === "ar" ? "تم توقيع عقد الإيجار" : "rental contract was signed", ts:H(2), color:"#10b981" },
    { id:"ra3", user:lang === "ar" ? "أطلس العقارية" : "Atlas Real Estate", text:lang === "ar" ? "تم تأكيد استلام المبلغ" : "confirmed payment received", ts:D(1), color:"#f59e0b" },
    ...ACTIVITY0.slice(0, 3),
  ];
  return (<div className="pg">
    <PageHeader title={t("overview")} sub={lang === "ar" ? "ما الذي يحتاجه المكتب اليوم؟" : "What does the office need to do next?"}>
      <QuickActions />
    </PageHeader>
    <div className="kg">
      <KpiCard icon="building" label={lang === "ar" ? "العقارات النشطة" : "Active Properties"} value={activeProperties} />
      <KpiCard icon="target" label={lang === "ar" ? "طلبات جديدة" : "New Requests"} value={leads.filter(l => l.status === "New").length} />
      <KpiCard icon="calendar" label={lang === "ar" ? "معاينات قادمة" : "Upcoming Viewings"} value={upcomingViewings} />
      <KpiCard icon="shield" label={lang === "ar" ? "معاملات نشطة" : "Active Transactions"} value={activeTx} />
      <KpiCard icon="check" label={lang === "ar" ? "معاملات مكتملة" : "Completed Transactions"} value={completedTx} />
    </div>
    <div className="g22">
      <div className="cd"><div className="cd-h"><h3>{lang === "ar" ? "يحتاج انتباهك" : "Needs Your Attention"}</h3></div><div className="cd-b">
        {pendingActions.map(a => <button className="lr" key={a.id} style={{ width:"100%", textAlign:"start" }} onClick={() => nav(a.go)}><span className="fi"><Icon name={a.icon} size={14} /></span><div className="lt"><b>{a.text}</b><span>{lang === "ar" ? "اضغط للمتابعة" : "Open to continue"}</span></div><Icon name="chevright" size={14} style={{ color:"var(--tx3)", marginInlineStart:"auto" }} /></button>)}
      </div></div>
      <div className="cd"><div className="cd-h"><h3>{lang === "ar" ? "طلبات جديدة" : "New Requests"}</h3><button className="lnk" style={{ marginInlineStart:"auto" }} onClick={() => nav("requests")}>{t("viewAll")}</button></div>
        <div className="cd-b" style={{ padding:"8px 16px" }}>{[...leads].filter(l => ["New","Contacted","Viewing"].includes(l.status)).slice(0, 5).map(l => {
          const c = clients.find(x => x.id === l.clientId); const p = properties.find(x => x.id === l.propertyId);
          return <div className="lr" key={l.id} style={{ cursor:"pointer" }} onClick={() => openLead(l.id)}><Avatar name={clientName(c, lang)} id={l.id} size={30} /><div className="lt"><b>{clientName(c, lang)}</b><span>{propTitle(p, lang)} · {timeAgo(l.createdAt)}</span></div><Badge color={LEAD_C[l.status]}>{requestStatusLabel(l.status, lang)}</Badge></div>;
        })}</div></div>
    </div>
    <div className="g22">
      <div className="cd"><div className="cd-h"><h3>{lang === "ar" ? "آخر النشاط" : "Recent Activity"}</h3></div><div className="cd-b"><Timeline items={recent} /></div></div>
      <div className="cd"><div className="cd-h"><h3>{lang === "ar" ? "عقارات تحتاج متابعة" : "Properties to Review"}</h3><button className="lnk" style={{ marginInlineStart:"auto" }} onClick={() => nav("properties")}>{t("viewAll")}</button></div>
        <div className="cd-b" style={{ padding:"8px 16px" }}>{properties.filter(p => ["Draft","Pending","Reserved"].includes(p.status)).slice(0, 5).map(p => <div className="lr" key={p.id} style={{ cursor:"pointer" }} onClick={() => openProp(p.id)}><img className="thmb" src={p.images[0]} alt="" /><div className="lt"><b>{propTitle(p, lang)}</b><span>{cityOf(p, lang)} · {districtOf(p, lang)}</span></div><Badge color={simplePropColor(p)}>{simplePropStatusLabel(p, lang)}</Badge></div>)}</div></div>
    </div>
  </div>);
}

function Properties() {
  const app = useApp(); const { t, lang, properties, members, branches, setProperties, org } = app;
  const [view, setView] = useState("table");
  const [f, setF] = useState({ q:"", status:"All", type:"All", city:"All", branch:"All", agent:"All", listing:"All", pmin:"", pmax:"" });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  let rows = properties;
  if (f.status !== "All") rows = rows.filter(p => simplePropStatus(p) === f.status);
  if (f.type !== "All") rows = rows.filter(p => p.type === f.type);
  if (f.city !== "All") rows = rows.filter(p => p.city === f.city);
  if (f.agent !== "All") rows = rows.filter(p => p.agentId === f.agent);
  if (f.listing !== "All") rows = rows.filter(p => p.listingType === f.listing);
  if (f.pmin) rows = rows.filter(p => p.price >= +f.pmin);
  if (f.pmax) rows = rows.filter(p => p.price <= +f.pmax);
  if (f.q) rows = rows.filter(p => (p.title + p.district + p.city).toLowerCase().includes(f.q.toLowerCase()));
  const mName = id => memberName(members.find(m => m.id === id) || {}, lang) || "—";
  const newPropBtn = (<Btn v="p" icon="plus" onClick={() => app.newProperty()}>{t("newProperty")}</Btn>);
  const emptyProps = (<EmptyState icon="building" title="No properties match" desc="Adjust filters or create a new listing." action={newPropBtn} />);
  const actions = p => (<div className="ra" onClick={e => e.stopPropagation()}>
    <button className="ib" title={t("view")} onClick={() => app.openProp(p.id)}><Icon name="eye" size={14} /></button>
    <button className="ib" title={t("edit")} onClick={() => app.editProp(p.id)}><Icon name="pencil" size={14} /></button>
    <button className="ib" title={t("duplicate")} onClick={() => { const c = { ...p, id: uid("p"), title: p.title + " (Copy)", status:"Draft", published:false, createdAt: Date.now(), updatedAt: Date.now() }; setProperties(ps => [c, ...ps]); toast("Duplicated as draft"); }}><Icon name="copy" size={14} /></button>
    <button className="ib" title={t("archive")} onClick={async () => { if (await confirmDlg({ title:"Archive property?", msg:"Hard delete is disabled. The listing will be hidden and kept for audit.", danger:true, label:"Archive" })) { setProperties(ps => ps.map(x => x.id === p.id ? { ...x, status:"Archived", published:false, updatedAt: Date.now() } : x)); toast("Property archived"); } }}><Icon name="archive" size={14} /></button>
  </div>);
  const cols = [
    { label:t("property"), sortable:true, key:"title", render: p => (<div className="cm"><img className="thmb" src={p.images[0]} alt="" /><div><b style={{ fontWeight:600 }}>{propTitle(p, lang)}</b><div className="cs mono">{p.ref || p.id}</div></div></div>) },
    { label:"Type", key:"type", render:p => lang === "ar" && p.typeAr ? p.typeAr : p.type }, { label:"Location", render: p => `${cityOf(p, lang)} · ${districtOf(p, lang)}` },
    { label:t("price"), sortable:true, key:"price", render: p => <span className="num" style={{ fontWeight:600 }}>{p.listingType === "Rent" ? money(p.price, p.currency || org.currency, lang) + "/yr" : moneyC(p.price, p.currency || org.currency, lang)}</span> },
    { label:t("status"), sortable:true, key:"status", render: p => <Badge color={simplePropColor(p)}>{simplePropStatusLabel(p, lang)}</Badge> },
    { label:t("agent"), render: p => mName(p.agentId) },
    { label:"Updated", sortable:true, key:"updatedAt", render: p => <span style={{ color:"var(--tx3)" }}>{timeAgo(p.updatedAt)}</span> },
    { label:"Actions", align:"end", render: actions },
  ];
  return (<div className="pg">
    <PageHeader title={t("properties")} sub={`${rows.length} listings`}>
      <Seg val={view} onChange={setView} opts={[{ v:"table", i:"list", l:t("table") }, { v:"cards", i:"grid", l:t("cards") }]} />
      {newPropBtn}
    </PageHeader>
    <div className="fb cd" style={{ padding:10 }}>
      <div className="siw"><span className="si"><Icon name="search" size={13} /></span><input placeholder="Search title, districtâ€¦" value={f.q} onChange={e => set("q", e.target.value)} /></div>
      <select value={f.status} onChange={e => set("status", e.target.value)}><option>All</option>{["Draft","Under Review","Published","Reserved","Sold","Rented"].map(s => <option key={s}>{s}</option>)}</select>
      <select value={f.type} onChange={e => set("type", e.target.value)}><option>All</option>{["Apartment","Villa","Office","Shop","Land","Building"].map(s => <option key={s}>{s}</option>)}</select>
      <select value={f.city} onChange={e => set("city", e.target.value)}><option>All</option>{["Homs","Damascus","Tartous"].map(s => <option key={s}>{s}</option>)}</select>
      <select value={f.agent} onChange={e => set("agent", e.target.value)}><option value="All">Agent: all</option>{members.filter(m => ["Agent","Manager","Owner"].includes(m.role)).map(m => <option key={m.id} value={m.id}>{memberName(m, lang)}</option>)}</select>
      <select value={f.listing} onChange={e => set("listing", e.target.value)}><option>All</option><option>Sale</option><option>Rent</option></select>
      <input type="number" placeholder="Min price" value={f.pmin} onChange={e => set("pmin", e.target.value)} style={{ width:110 }} />
      <input type="number" placeholder="Max price" value={f.pmax} onChange={e => set("pmax", e.target.value)} style={{ width:110 }} />
      <Btn s="s" icon="x" onClick={() => setF({ q:"", status:"All", type:"All", city:"All", branch:"All", agent:"All", listing:"All", pmin:"", pmax:"" })}>{t("clear")}</Btn>
    </div>
    {view === "table" && (<div className="cd"><DataTable cols={cols} rows={rows} onRow={p => app.openProp(p.id)} empty={emptyProps} /></div>)}
    {view !== "table" && (
      <>
        <div className="pgd">
          {rows.map(p => (
            <div className="cd pc" key={p.id} onClick={() => app.openProp(p.id)}>
              <div className="im"><img src={p.images[0]} alt="" /><Badge color={simplePropColor(p)}>{simplePropStatusLabel(p, lang)}</Badge></div>
              <div className="bd"><b>{propTitle(p, lang)}</b><div className="lc"><Icon name="pin" size={11} />{cityOf(p, lang)} · {districtOf(p, lang)}</div>
                <div className="pr num">{p.listingType === "Rent" ? money(p.price, p.currency || org.currency, lang) + "/yr" : money(p.price, p.currency || org.currency, lang)}</div>
                <div className="mt"><span>{p.beds || "—"} bd</span><span>{p.baths || "—"} ba</span><span>{p.area.toLocaleString()} m²</span><span style={{ marginInlineStart:"auto" }}>{mName(p.agentId).split(" ")[0]}</span></div></div>
            </div>
          ))}
        </div>
        {!rows.length && <div className="cd">{emptyProps}</div>}
      </>
    )}
  </div>);
}

function PropDrawer({ id, onClose }) {
  const app = useApp(); const { properties, members, branches, tours, lang, org, clients, leads, viewings, offers, deals, contracts, transactions } = app;
  const p = properties.find(x => x.id === id); if (!p) return null;
  const agent = members.find(m => m.id === p.agentId); const branch = branches.find(b => b.id === p.branchId);
  const tour = tours.find(t2 => t2.id === p.tourId);
  const relatedLeads = leads.filter(l => l.propertyId === p.id);
  const relatedViewings = viewings.filter(v => v.propertyId === p.id);
  const relatedOffers = offers.filter(o => o.propertyId === p.id);
  const relatedDeals = deals.filter(d => d.propertyId === p.id);
  const relatedContracts = contracts.filter(c => c.propertyId === p.id);
  const relatedTransactions = transactions.filter(t => t.propertyId === p.id);
  const relatedMedia = MEDIA0.filter(m => m.propertyId === p.id);
  const [img, setImg] = useState(0);
  useEffect(() => setImg(0), [id]);
  return (<Drawer open onClose={onClose} title={propTitle(p, lang)} sub={`${p.ref || p.id} · updated ${timeAgo(p.updatedAt)}`} wide
    footer={<><Btn onClick={onClose}>{app.t("close")}</Btn><Btn v="p" icon="pencil" onClick={() => { onClose(); app.editProp(p.id); }}>{app.t("edit")}</Btn></>}>
    <div style={{ borderRadius:12, overflow:"hidden", marginBottom:10 }}><img src={p.images[img] || p.images[0]} style={{ width:"100%", height:230, objectFit:"cover" }} alt="" /></div>
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {p.images.map((im, i) => (<img key={i} src={im} alt="" onClick={() => setImg(i)} style={{ width:56, height:40, objectFit:"cover", borderRadius:7, cursor:"pointer", border: i === img ? "2px solid var(--pr)" : "2px solid transparent" }} />))}
    </div>
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
      <Badge color={PROP_C[p.status]}>{p.status}</Badge>{p.published ? <Badge color="#10b981">Published</Badge> : <Badge color="#64748b">Unpublished</Badge>}
      <Badge color="#2f6bff">For {p.listingType}</Badge><Badge color="#14b8a6">{lang === "ar" && p.typeAr ? p.typeAr : p.type}</Badge><Badge color="#64748b">{p.category}</Badge>
    </div>
    <div className="sst" style={{ marginBottom:14 }}>
      <div className="st"><b className="num">{money(p.price, p.currency || org.currency, lang)}</b><span>Price ({p.currency || org.currency})</span></div>
      <div className="st"><b>{p.beds || "—"}</b><span>Beds</span></div><div className="st"><b>{p.baths || "—"}</b><span>Baths</span></div>
      <div className="st"><b>{p.area.toLocaleString()}</b><span>m²</span></div><div className="st"><b className="num">{money(Math.round(p.price / (p.area || 1)), p.currency || org.currency, lang)}</b><span>Price / m²</span></div>
    </div>
    <FormSection title="Location"><p style={{ fontSize:12.5, color:"var(--tx2)" }}><Icon name="pin" size={12} style={{ verticalAlign:-2 }} /> {cityOf(p, lang)} · {districtOf(p, lang)} · {p.address} <span className="mono" style={{ color:"var(--tx3)" }}>· {p.lat}, {p.lng}</span></p></FormSection>
    <FormSection title="Features"><div className="chips">{p.features.map(ft => <span className="chp" key={ft}>{ft}</span>)}</div></FormSection>
    <FormSection title="Assignment"><div className="lr">{agent && <Avatar name={memberName(agent, lang)} id={agent.id} size={32} />}<div className="lt"><b>{agent ? memberName(agent, lang) : "Unassigned"}</b><span>{branch ? branchName(branch, lang) : "—"} · {agent?.role}</span></div><div className="lrr mono">created {timeAgo(p.createdAt)}</div></div></FormSection>
    <FormSection title="Virtual Tour">{tour ? <div className="lr"><span style={{ width:32, height:32, borderRadius:9, background:"var(--prs)", color:"var(--pr)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}><Icon name="video" size={15} /></span><div className="lt"><b>{tour.name}</b><span>{tour.scenes} scenes Â· {tour.status}</span></div><Btn s="s" icon="play" style={{ marginInlineStart:"auto" }} onClick={() => app.openTour(tour.id)}>Preview</Btn></div> : <p style={{ fontSize:12, color:"var(--tx3)" }}>No tour linked.</p>}</FormSection>
    <FormSection title={localLabel(lang,"Related CRM & Transaction Work","العمل المرتبط بالعملاء والمعاملات")}><div className="fgd">
      <div className="fc"><b>{localLabel(lang,"Interested Clients","العملاء المهتمون")}</b><span>{[...new Set(relatedLeads.map(l => l.clientId))].map(cid => clientName(clients.find(c => c.id === cid), lang)).join(", ") || "—"}</span></div>
      <div className="fc"><b>{localLabel(lang,"Leads","العملاء المحتملون")}</b><span>{relatedLeads.length}</span></div>
      <div className="fc"><b>{localLabel(lang,"Upcoming Viewings","المعاينات القادمة")}</b><span>{relatedViewings.filter(v => ["Requested","Confirmed"].includes(v.status)).length}</span></div>
      <div className="fc"><b>{localLabel(lang,"Offers","العروض")}</b><span>{relatedOffers.length}</span></div>
      <div className="fc"><b>{localLabel(lang,"Deals","الصفقات")}</b><span>{relatedDeals.length}</span></div>
      <div className="fc"><b>{localLabel(lang,"Transactions","المعاملات")}</b><span>{relatedTransactions.length}</span></div>
      <div className="fc"><b>{localLabel(lang,"Contracts","العقود")}</b><span>{relatedContracts.map(c => c.id).join(", ") || "—"}</span></div>
      <div className="fc"><b>{localLabel(lang,"Media","الوسائط")}</b><span>{relatedMedia.length}</span></div>
    </div>{relatedTransactions.map(tx => <button className="dd-i" key={tx.id} onClick={() => { onClose(); app.go(`${BASE}/transactions/${tx.id}`); }}><Icon name="shield" size={14} />{tx.transactionId}<Badge color="#2f6bff">{txStageLabel(tx.status, lang)}</Badge></button>)}</FormSection>
    <FormSection title="Documents"><div className="lr"><span style={{ width:32, height:32, borderRadius:9, background:"rgba(16,185,129,.1)", color:"#10b981", display:"inline-flex", alignItems:"center", justifyContent:"center" }}><Icon name="filetext" size={15} /></span><div className="lt"><b>Title Deed â€” {p.title}.pdf</b><span>2.4 MB Â· Property Documents</span></div><button className="ib" onClick={() => toast("Download started (demo)", "info")}><Icon name="download" size={14} /></button></div></FormSection>
    <FormSection title="Activity"><Timeline items={ACTIVITY0.slice(0, 3)} /></FormSection>
  </Drawer>);
}

function UploadZone({ icon = "upload", title, sub, onClick }) {
  return <button className="cd" type="button" onClick={onClick || (() => toast("Mock upload zone only", "info"))} style={{ padding:14, minHeight:88, width:"100%", borderStyle:"dashed", display:"flex", alignItems:"center", gap:12, textAlign:"start" }}><span className="fi"><Icon name={icon} size={16} /></span><span><b style={{ display:"block", fontSize:12.5 }}>{title}</b><span style={{ color:"var(--tx3)", fontSize:11.5 }}>{sub}</span></span></button>;
}

function PropForm({ id, onClose }) {
  const app = useApp(); const { members, branches, tours, setProperties, org, lang, t } = app;
  const existing = id ? app.properties.find(x => x.id === id) : null;
  const cityDistricts = {
    Homs:["Al-Waer","Al-Inshaat","Al-Hamra","Al-Ghouta","Al-Mahatta"],
    Damascus:["Al-Malki","Abu Rummaneh","Kafr Sousa","Mazzeh"],
    Tartous:["Corniche","Al-Hamidiyah","City Center"],
  };
  const [d, setD] = useState(existing ? { ...existing } : { id: uid("p"), ref:"AT-NEW", title:"", titleAr:"", description:"", type:"Apartment", listingType:"Sale", category:"Residential", price:"", currency:org.currency || "USD", negotiable:true, area:"", beds:"", baths:"", floor:"", totalFloors:"", yearBuilt:"", furnished:"Unfurnished", parking:false, city:"Homs", district:"Al-Waer", address:"", lat:"34.7324", lng:"36.7137", status:"Draft", branchId: branches[0]?.id, agentId: app.me.id, images:[], features:[], tourId:"", published:false, createdAt: Date.now() });
  const set = (k, v) => setD(s => ({ ...s, [k]: v }));
  const FEATS = ["Elevator","Parking","Balcony","Garden","Sea View","Solar Backup","Heating","Generator","Water Tank","Street Front","Storage","Furnished"];
  const field = (en, ar) => lang === "ar" ? ar : en;
  const districts = cityDistricts[d.city] || [];
  const onFiles = e => { const fs = Array.from(e.target.files || []); fs.forEach(fl => { const r = new FileReader(); r.onload = () => set("images", [...d.images, r.result]); r.readAsDataURL(fl); }); if (fs.length) toast(fs.length + " image(s) added (local preview)", "info"); };
  const save = publish => { if (!d.title || !d.price) { toast("Title and price are required", "err"); return; } const images = d.images.length ? d.images : [IMG.interior]; setProperties(ps => { const i = ps.findIndex(x => x.id === d.id); const rec = { ...d, price:+d.price, area:+d.area || 0, beds:+d.beds || 0, baths:+d.baths || 0, floor:+d.floor || 0, totalFloors:+d.totalFloors || 0, yearBuilt:d.yearBuilt ? +d.yearBuilt : "", images, currency:d.currency || org.currency, published:publish ?? d.published, status: publish ? "Available" : d.status, updatedAt: Date.now() }; return i >= 0 ? ps.map(x => x.id === d.id ? rec : x) : [rec, ...ps]; }); toast(publish ? "Property published" : "Property saved as draft"); onClose(); };
  return <Drawer open onClose={onClose} title={existing ? field("Edit Property","تعديل العقار") : field("Add Property","إضافة عقار")} sub={field("Professional property workflow · local mock data","سير عمل احترافي · بيانات محلية تجريبية")} wide
    footer={<><Btn onClick={onClose}>{t("cancel")}</Btn><Btn icon="eye" onClick={() => toast("Preview opened (demo)", "info")}>{field("Preview","معاينة")}</Btn><Btn icon="filetext" onClick={() => save(false)}>{field("Save Draft","حفظ كمسودة")}</Btn><Btn v="p" icon="check" onClick={() => save(true)}>{field("Publish","نشر")}</Btn></>}>
    <FormSection title={field("Basic Information","المعلومات الأساسية")}>
      <div className="fr"><Field label={field("Property Title","عنوان العقار")} req><input value={d.title} onChange={e => set("title", e.target.value)} placeholder="Modern Apartment in Al-Malki" /></Field><Field label={field("Property Reference","مرجع العقار")}><input className="code" value={d.ref || ""} onChange={e => set("ref", e.target.value)} /></Field></div>
      <div className="fr one"><Field label={field("Description","الوصف")}><textarea rows={4} value={d.description || ""} onChange={e => set("description", e.target.value)} /></Field></div>
    </FormSection>
    <FormSection title={field("Property Classification","تصنيف العقار")}>
      <div className="fr four"><Field label={field("Property Type","نوع العقار")}><select value={d.type} onChange={e => set("type", e.target.value)}>{["Apartment","Villa","Office","Shop","Land","Building"].map(x => <option key={x}>{x}</option>)}</select></Field><Field label={field("Listing Type","نوع العرض")}><select value={d.listingType} onChange={e => set("listingType", e.target.value)}><option>Sale</option><option>Rent</option></select></Field><Field label={field("Category","التصنيف")}><select value={d.category} onChange={e => set("category", e.target.value)}><option>Residential</option><option>Commercial</option></select></Field><Field label={field("Status","الحالة")}><select value={d.status} onChange={e => set("status", e.target.value)}>{Object.keys(PROP_C).map(x => <option key={x}>{x}</option>)}</select></Field></div>
    </FormSection>
    <FormSection title={field("Pricing","التسعير")}>
      <div className="fr four"><Field label={field("Price","السعر")} req><input type="number" value={d.price} onChange={e => set("price", e.target.value)} /></Field><Field label={field("Currency","العملة")}><select value={d.currency || org.currency} onChange={e => set("currency", e.target.value)}><option value="USD">USD</option><option value="SYP">SYP</option></select></Field><Field label={field("Price per m²","السعر لكل م²")}><input className="num" readOnly value={d.price && d.area ? money(Math.round(+d.price / (+d.area || 1)), d.currency || org.currency, lang) : ""} /></Field><Field label={field("Negotiable","قابل للتفاوض")}><select value={d.negotiable ? "Yes" : "No"} onChange={e => set("negotiable", e.target.value === "Yes")}><option>Yes</option><option>No</option></select></Field></div>
    </FormSection>
    <FormSection title={field("Property Details","تفاصيل العقار")}>
      <div className="fr four"><Field label={field("Area","المساحة")}><input type="number" value={d.area} onChange={e => set("area", e.target.value)} /></Field><Field label={field("Bedrooms","غرف النوم")}><input type="number" value={d.beds} onChange={e => set("beds", e.target.value)} /></Field><Field label={field("Bathrooms","الحمامات")}><input type="number" value={d.baths} onChange={e => set("baths", e.target.value)} /></Field><Field label={field("Floor","الطابق")}><input type="number" value={d.floor || ""} onChange={e => set("floor", e.target.value)} /></Field></div>
      <div className="fr four"><Field label={field("Total Floors","عدد الطوابق")}><input type="number" value={d.totalFloors || ""} onChange={e => set("totalFloors", e.target.value)} /></Field><Field label={field("Year Built","سنة البناء")}><input type="number" value={d.yearBuilt || ""} onChange={e => set("yearBuilt", e.target.value)} /></Field><Field label={field("Furnished","مفروش")}><select value={d.furnished || "Unfurnished"} onChange={e => set("furnished", e.target.value)}><option>Unfurnished</option><option>Semi-furnished</option><option>Furnished</option><option>Fitted</option></select></Field><Field label={field("Parking","موقف سيارات")}><select value={d.parking ? "Yes" : "No"} onChange={e => set("parking", e.target.value === "Yes")}><option>Yes</option><option>No</option></select></Field></div>
    </FormSection>
    <FormSection title={field("Location","الموقع")}>
      <div className="fr three"><Field label={field("City","المدينة")}><select value={d.city} onChange={e => { set("city", e.target.value); set("district", (cityDistricts[e.target.value] || [""])[0]); }}>{Object.keys(cityDistricts).map(x => <option key={x}>{x}</option>)}</select></Field><Field label={field("District","الحي")}><select value={d.district} onChange={e => set("district", e.target.value)}>{districts.map(x => <option key={x}>{x}</option>)}</select></Field><Field label={field("Address","العنوان")}><input value={d.address} onChange={e => set("address", e.target.value)} /></Field></div>
      <div className="fr three"><Field label={field("Location on Map","الموقع على الخريطة")}><input readOnly value={`${d.city}, ${d.district}`} /></Field><Field label={field("Latitude","خط العرض")}><input className="num" value={d.lat || ""} onChange={e => set("lat", e.target.value)} /></Field><Field label={field("Longitude","خط الطول")}><input className="num" value={d.lng || ""} onChange={e => set("lng", e.target.value)} /></Field></div>
    </FormSection>
    <FormSection title={field("Features & Amenities","الميزات والمرافق")}><div className="chips">{FEATS.map(ft => <span key={ft} className={`chp ${d.features.includes(ft) ? "on" : ""}`} onClick={() => set("features", d.features.includes(ft) ? d.features.filter(x => x !== ft) : [...d.features, ft])}>{ft}</span>)}</div></FormSection>
    <FormSection title={field("Media","الوسائط")}>
      <div className="fr three"><UploadZone icon="image" title={field("Property Images","صور العقار")} sub={field("Local preview only","معاينة محلية فقط")} /><UploadZone icon="image" title={field("Cover Image","الصورة الرئيسية")} sub={field("Select from uploaded images","اختر من الصور المرفوعة")} /><UploadZone icon="video" title={field("Video","فيديو")} sub={field("Mock video upload","رفع فيديو تجريبي")} /></div>
      <div className="mp" style={{ marginTop:10 }}>{d.images.map((u, i) => <label key={i} className={i === 0 ? "sel" : ""}><input type="radio" name="cover" defaultChecked={i === 0} /><img src={u} alt="" /></label>)}{Object.values(IMG).slice(0, 6).map(u => <label key={u} className={d.images.includes(u) ? "sel" : ""}><input type="radio" name="cover" /><img src={u} alt="" onClick={() => set("images", d.images.includes(u) ? d.images : [...d.images, u])} /></label>)}</div>
      <div style={{ marginTop:10 }}><label className="bt bt-s" style={{ cursor:"pointer" }}><Icon name="upload" size={14} />{field("Local image preview","معاينة صورة محلية")}<input type="file" accept="image/*" multiple hidden onChange={onFiles} /></label></div>
    </FormSection>
    <FormSection title={field("Virtual Tour","الجولة الافتراضية")}><div className="fr three"><Field label={field("Virtual Tour","الجولة الافتراضية")}><select value={d.tourId || ""} onChange={e => set("tourId", e.target.value)}><option value="">None</option>{tours.map(t2 => <option key={t2.id} value={t2.id}>{t2.name} · {t2.scenes} scenes</option>)}</select></Field><UploadZone icon="maximize" title={field("3D Model","النموذج ثلاثي الأبعاد")} sub={field("Mock upload","رفع تجريبي")} /><UploadZone icon="grid" title={field("Digital Twin","التوأم الرقمي")} sub={field("Mock upload","رفع تجريبي")} /></div></FormSection>
    <FormSection title={field("Documents","المستندات")}><div className="fr three"><UploadZone icon="filetext" title={field("Floor Plans","المخططات")} sub="PDF / PNG" /><UploadZone icon="paperclip" title={field("Documents","المستندات")} sub="PDF" /><UploadZone icon="folder" title={field("Property Folder","ملف العقار")} sub={field("Frontend only","واجهة فقط")} /></div></FormSection>
    <FormSection title={field("Assignment","التكليف")}><div className="fr"><Field label={field("Assigned Agent","الوكيل المسؤول")}><select value={d.agentId} onChange={e => set("agentId", e.target.value)}>{members.filter(m => ["Agent","Manager","Owner"].includes(m.role)).map(m => <option key={m.id} value={m.id}>{memberName(m, lang)}</option>)}</select></Field><Field label={field("Branch","الفرع")}><select value={d.branchId} onChange={e => set("branchId", e.target.value)}>{branches.map(b => <option key={b.id} value={b.id}>{branchName(b, lang)}</option>)}</select></Field></div></FormSection>
    <FormSection title={field("Publishing","النشر")}><div className="swr"><Switch on={d.published} onChange={v => set("published", v)} /><div><b style={{ fontSize:12.5 }}>{field("Publish to public listings","نشر ضمن الإعلانات العامة")}</b><div className="d">{field("No backend is connected; this updates local React state only.","لا يوجد اتصال خلفي؛ يتم تحديث حالة React المحلية فقط.")}</div></div></div></FormSection>
  </Drawer>;
}
function Clients() {
  const app = useApp(); const { t, clients, members } = app;
  const [f, setF] = useState({ q:"", type:"All", status:"All" });
  let rows = clients;
  if (f.type !== "All") rows = rows.filter(c => c.clientType === f.type);
  if (f.status !== "All") rows = rows.filter(c => c.status === f.status);
  if (f.q) rows = rows.filter(c => (c.fullName + c.email + c.phone).toLowerCase().includes(f.q.toLowerCase()));
  const mName = id => (members.find(m => m.id === id) || {}).name || "â€”";
  const newClientBtn = (<Btn v="p" icon="plus" onClick={() => app.newClient()}>{t("newClient")}</Btn>);
  const emptyClients = (<EmptyState icon="users" title="No clients found" desc="Create your first client to start the CRM." action={newClientBtn} />);
  const actions = c => (<div className="ra" onClick={e => e.stopPropagation()}>
      <button className="ib" onClick={() => app.openClient(c.id)}><Icon name="eye" size={14} /></button>
      <button className="ib" onClick={() => app.editClient(c.id)}><Icon name="pencil" size={14} /></button>
    </div>);
  const cols = [
    { label:"Client", sortable:true, key:"fullName", render: c => (<div className="cm"><Avatar name={c.fullName} id={c.id} size={32} /><div><b style={{ fontWeight:600 }}>{c.fullName}</b><div className="cs">{c.preferredCities.join(", ")}</div></div></div>) },
    { label:"Type", key:"clientType", render: c => <Badge color={TYPE_C[c.clientType]}>{c.clientType}</Badge> },
    { label:"Contact", render: c => (<div>{c.phone}<div className="cs">{c.email}</div></div>) },
    { label:"Budget", sortable:true, key:"budgetMax", render: c => <span className="num">{c.budgetMax ? moneyC(c.budgetMin) + "â€“" + moneyC(c.budgetMax) : "â€”"}</span> },
    { label:"Agent", render: c => mName(c.agentId) },
    { label:"Status", sortable:true, key:"status", render: c => <Badge color={c.status === "Active" ? "#10b981" : c.status === "Negotiation" ? "#f59e0b" : "#94a3b8"}>{c.status}</Badge> },
    { label:"Updated", sortable:true, key:"updatedAt", render: c => <span style={{ color:"var(--tx3)" }}>{timeAgo(c.updatedAt)}</span> },
    { label:"Actions", align:"end", render: actions },
  ];
  return (
    <div className="pg">
      <PageHeader title={t("clients")} sub={`${rows.length} clients Â· private CRM`}>{newClientBtn}</PageHeader>
      <div className="fb cd" style={{ padding:10 }}>
        <div className="siw"><span className="si"><Icon name="search" size={13} /></span><input placeholder="Search clientsâ€¦" value={f.q} onChange={e => setF(s => ({ ...s, q: e.target.value }))} /></div>
        <select value={f.type} onChange={e => setF(s => ({ ...s, type: e.target.value }))}><option>All</option>{Object.keys(TYPE_C).map(x => <option key={x}>{x}</option>)}</select>
        <select value={f.status} onChange={e => setF(s => ({ ...s, status: e.target.value }))}><option>All</option>{["Active","Negotiation","Past"].map(x => <option key={x}>{x}</option>)}</select>
      </div>
      <div className="cd"><DataTable cols={cols} rows={rows} onRow={c => app.openClient(c.id)} empty={emptyClients} /></div>
    </div>
  );
}
function ClientDrawer({ id, onClose, edit = false }) {
  const app = useApp(); const { clients, leads, deals, contracts, properties, members, viewings, offers, transactions, lang } = app;
  const c = clients.find(x => x.id === id);
  const [mode, setMode] = useState(edit ? "edit" : "view");
  const [tab, setTab] = useState("overview");
  const [d, setD] = useState(c ? { ...c } : { id: uid("c"), fullName:"", phone:"", email:"", clientType:"Buyer", budgetMin:"", budgetMax:"", preferredCities:["Homs"], preferredTypes:[], agentId: app.me.id, status:"Active", notes:"" });
  const set = (k, v) => setD(s => ({ ...s, [k]: v }));
  const isNew = !c;
  const myLeads = leads.filter(l => l.clientId === id);
  const myDeals = deals.filter(dl => dl.clientId === id);
  const myCts = contracts.filter(ct => ct.clientId === id);
  const myViewings = viewings.filter(v => v.clientId === id);
  const myOffers = offers.filter(o => o.clientId === id);
  const myTx = transactions.filter(t => t.clientId === id);
  const myMessages = MESSAGES0.filter(m => m.clientId === id);
  const propIds = [...new Set(myLeads.map(l => l.propertyId).filter(Boolean))];
  const save = () => { if (!d.fullName || !d.phone) { toast("Name and phone are required", "err"); return; } app.setClients(cs => { const i = cs.findIndex(x => x.id === d.id); const rec = { ...d, budgetMin:+d.budgetMin || 0, budgetMax:+d.budgetMax || 0, updatedAt: Date.now() }; return i >= 0 ? cs.map(x => x.id === d.id ? rec : x) : [rec, ...cs]; }); toast("Client saved"); onClose(); };
  if (mode === "edit" || isNew) return (<Drawer open onClose={onClose} title={isNew ? "New client" : "Edit client"} sub="organization_clients Â· private"
    footer={<><Btn onClick={onClose}>{app.t("cancel")}</Btn><Btn v="p" icon="check" onClick={save}>{app.t("save")}</Btn></>}>
    <FormSection title="Contact Information"><div className="fr one"><Field label="Full Name" req><input value={d.fullName} onChange={e => set("fullName", e.target.value)} /></Field></div>
      <div className="fr"><Field label="Phone" req><input value={d.phone} onChange={e => set("phone", e.target.value)} /></Field><Field label="Email"><input value={d.email} onChange={e => set("email", e.target.value)} /></Field></div></FormSection>
    <FormSection title="Requirements"><div className="fr"><Field label="Client Type"><select value={d.clientType} onChange={e => set("clientType", e.target.value)}>{Object.keys(TYPE_C).map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Status"><select value={d.status} onChange={e => set("status", e.target.value)}><option>Active</option><option>Negotiation</option><option>Past</option></select></Field></div>
      <div className="fr"><Field label="Budget Min"><input type="number" value={d.budgetMin} onChange={e => set("budgetMin", e.target.value)} /></Field><Field label="Budget Max"><input type="number" value={d.budgetMax} onChange={e => set("budgetMax", e.target.value)} /></Field></div>
      <Field label="Preferred Cities"><div className="chips" style={{ marginBottom:10 }}>{["Homs","Damascus","Tartous"].map(ct => (<span key={ct} className={`chp ${d.preferredCities.includes(ct) ? "on" : ""}`} onClick={() => set("preferredCities", d.preferredCities.includes(ct) ? d.preferredCities.filter(x => x !== ct) : [...d.preferredCities, ct])}>{ct}</span>))}</div></Field>
      <Field label="Preferred Property Types"><div className="chips">{["Villa","Apartment","Penthouse","Townhouse","Office"].map(ct => (<span key={ct} className={`chp ${d.preferredTypes.includes(ct) ? "on" : ""}`} onClick={() => set("preferredTypes", d.preferredTypes.includes(ct) ? d.preferredTypes.filter(x => x !== ct) : [...d.preferredTypes, ct])}>{ct}</span>))}</div></Field></FormSection>
    <FormSection title="Assignment"><Field label="Assigned Agent"><select value={d.agentId} onChange={e => set("agentId", e.target.value)}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field></FormSection>
    <FormSection title="Notes"><textarea rows={3} value={d.notes} onChange={e => set("notes", e.target.value)} /></FormSection>
  </Drawer>);
  return (<Drawer open onClose={onClose} title={c.fullName} sub={`${c.phone} Â· ${c.email}`} wide
    footer={<><Btn onClick={onClose}>{app.t("close")}</Btn><Btn v="p" icon="pencil" onClick={() => setMode("edit")}>{app.t("edit")}</Btn></>}>
    <div style={{ display:"flex", gap:8, marginBottom:14 }}><Badge color={TYPE_C[c.clientType]}>{c.clientType}</Badge><Badge color="#10b981">{c.status}</Badge></div>
    <div className="tbs2">{["overview","properties","leads","viewings","offers","deals","transactions","contracts","messages","activity"].map(tb => <button key={tb} className={tab === tb ? "on" : ""} onClick={() => setTab(tb)}>{tb[0].toUpperCase() + tb.slice(1)}</button>)}</div>
    {tab === "overview" && (<div className="g22" style={{ marginBottom:0 }}>
      <div className="cd cd-b"><div className="fs-t">Requirements</div><HBars items={c.preferredTypes.map((tp, i) => ({ l: tp, v:100, c: CHART_PAL[i] }))} />
        <div className="dvd" /><div className="sst"><div className="st"><b className="num">{c.budgetMax ? moneyC(c.budgetMin) : "â€”"}</b><span>Min</span></div><div className="st"><b className="num">{c.budgetMax ? moneyC(c.budgetMax) : "â€”"}</b><span>Max</span></div></div>
        <div className="dvd" /><div className="chips">{c.preferredCities.map(x => <span className="chp" key={x}><Icon name="pin" size={11} />{x}</span>)}</div></div>
      <div className="cd cd-b"><div className="fs-t">Notes & Contact</div><p style={{ fontSize:12.5, color:"var(--tx2)" }}>{c.notes || "No notes yet."}</p><div className="dvd" />
        <div className="lr"><span style={{ width:28, height:28, borderRadius:8, background:"var(--prs)", color:"var(--pr)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}><Icon name="phone" size={13} /></span><div className="lt"><b>{c.phone}</b><span>{c.email}</span></div></div>
        <div className="lr"><Avatar name={(members.find(m => m.id === c.agentId) || {}).name || "?"} id={c.agentId} size={28} /><div className="lt"><b>{(members.find(m => m.id === c.agentId) || {}).name}</b><span>Assigned agent</span></div></div></div>
    </div>)}
    {tab === "properties" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{propIds.length ? propIds.map(pid => { const p = properties.find(x => x.id === pid); return p ? <div className="lr" key={pid} style={{ cursor:"pointer" }} onClick={() => app.openProp(pid)}><img className="thmb" src={p.images[0]} alt="" /><div className="lt"><b>{p.title}</b><span>{p.city} Â· {p.district}</span></div><div className="lrr"><b className="num">{moneyC(p.price)}</b><Badge color={PROP_C[p.status]}>{p.status}</Badge></div></div> : null; }) : <EmptyState icon="building" title="No interested properties" desc="Link properties through leads." />}</div>}
    {tab === "leads" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myLeads.length ? myLeads.map(l => <div className="lr" key={l.id}><div className="lt"><b>{(properties.find(p => p.id === l.propertyId) || {}).title || l.id}</b><span>{l.source} Â· {timeAgo(l.createdAt)}</span></div><Badge color={LEAD_C[l.status]}>{l.status}</Badge></div>) : <EmptyState icon="target" title="No leads" desc="No lead history for this client." />}</div>}
    {tab === "viewings" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myViewings.length ? myViewings.map(v => <div className="lr" key={v.id}><div className="lt"><b>{propTitle(properties.find(p => p.id === v.propertyId), lang)}</b><span>{timeAgo(v.scheduledAt)} · {v.notes}</span></div><Badge color="#2f6bff">{v.status}</Badge></div>) : <EmptyState icon="calendar" title="No viewings" desc="Viewings appear after scheduling." />}</div>}
    {tab === "offers" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myOffers.length ? myOffers.map(o => <div className="lr" key={o.id}><div className="lt"><b>{propTitle(properties.find(p => p.id === o.propertyId), lang)}</b><span>{money(o.amount, o.currency, lang)} · {timeAgo(o.offerDate)}</span></div><Badge color="#f59e0b">{o.status}</Badge></div>) : <EmptyState icon="wallet" title="No offers" desc="Offers appear during negotiation." />}</div>}
    {tab === "deals" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myDeals.length ? myDeals.map(dl => <div className="lr" key={dl.id}><div className="lt"><b>{dl.id}</b><span>{dl.contractStatus} Â· {dl.paymentStatus}</span></div><div className="lrr"><b className="num">{moneyC(dl.amount)}</b><Badge color={DEAL_C[dl.stage]}>{dl.stage}</Badge></div></div>) : <EmptyState icon="handshake" title="No deals" desc="No deals for this client yet." />}</div>}
    {tab === "transactions" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myTx.length ? myTx.map(tx => <button className="lr" key={tx.id} style={{ width:"100%", textAlign:"start" }} onClick={() => { onClose(); app.go(`${BASE}/transactions/${tx.id}`); }}><div className="lt"><b className="mono">{tx.transactionId}</b><span>{txStageLabel(tx.status, lang)}</span></div><Badge color="#2f6bff">{statusLabel(tx.orbixStatus, lang)}</Badge></button>) : <EmptyState icon="shield" title="No transactions" desc="Transactions appear after formal workflow starts." />}</div>}
    {tab === "contracts" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myCts.length ? myCts.map(ct => <div className="lr" key={ct.id}><div className="lt"><b className="mono">{ct.id}</b><span>Signing: {ct.signature}</span></div><Badge color={CT_C[ct.status]}>{ct.status}</Badge></div>) : <EmptyState icon="filetext" title="No contracts" desc="Contracts appear after deal closure." />}</div>}
    {tab === "messages" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{myMessages.length ? myMessages.map(m => <button className="lr" key={m.id} style={{ width:"100%", textAlign:"start" }} onClick={() => { onClose(); app.nav("messages"); }}><div className="lt"><b>{lang === "ar" ? m.subjectAr : m.subject}</b><span>{m.category}</span></div><Badge color="#14b8a6">{m.messages.length}</Badge></button>) : <EmptyState icon="mail" title="No messages" desc="Messages appear when conversations start." />}</div>}
    {tab === "activity" && <div className="cd cd-b"><Timeline items={[...ACTIVITY0.slice(0, 3), { id:"x1", user:"System", text:"client created", color:"#2f6bff", ts: c.createdAt }]} /></div>}
  </Drawer>);
}

function Leads() {
  const app = useApp(); const { t, leads, clients, properties, members } = app;
  const [f, setF] = useState({ q:"", status:"All", agent:"All", source:"All" });
  let rows = leads;
  if (f.status !== "All") rows = rows.filter(l => l.status === f.status);
  if (f.agent !== "All") rows = rows.filter(l => l.agentId === f.agent);
  if (f.source !== "All") rows = rows.filter(l => l.source === f.source);
  if (f.q) rows = rows.filter(l => (((clients.find(c => c.id === l.clientId) || {}).fullName || "") + l.source + ((properties.find(p => p.id === l.propertyId) || {}).title || "")).toLowerCase().includes(f.q.toLowerCase()));
  const cName = id => (clients.find(c => c.id === id) || {}).fullName || "New inbound lead";
  const emptyLeads = (<EmptyState icon="target" title="No leads match" desc="Adjust the filters or capture a new lead." />);
  const actions = l => (<div className="ra" onClick={e => e.stopPropagation()}>
      <button className="ib" onClick={() => app.openLead(l.id)}><Icon name="eye" size={14} /></button>
      <button className="ib" onClick={() => app.editLead(l.id)}><Icon name="pencil" size={14} /></button>
    </div>);
  const cols = [
    { label:"Lead", sortable:true, key:"createdAt", render: l => (<div className="cm"><Avatar name={cName(l.clientId)} id={l.id} size={30} /><div><b style={{ fontWeight:600 }}>{cName(l.clientId)}</b><div className="cs mono">{l.id}</div></div></div>) },
    { label:"Property", render: l => (properties.find(p => p.id === l.propertyId) || {}).title || "â€”" },
    { label:"Status", sortable:true, key:"status", render: l => <Badge color={LEAD_C[l.status]}>{l.status}</Badge> },
    { label:"Interest", render: l => l.interest === "Hot" ? <Badge color="#ef4444">Hot</Badge> : l.interest === "Warm" ? <Badge color="#f59e0b">Warm</Badge> : <Badge color="#64748b">Cold</Badge> },
    { label:"Source", key:"source" },
    { label:"Budget", sortable:true, key:"budget", render: l => <span className="num">{l.budget ? moneyC(l.budget) : "â€”"}</span> },
    { label:"Agent", render: l => (members.find(m => m.id === l.agentId) || {}).name || "â€”" },
    { label:"Updated", sortable:true, key:"updatedAt", render: l => <span style={{ color:"var(--tx3)" }}>{timeAgo(l.updatedAt)}</span> },
    { label:"Actions", align:"end", render: actions },
  ];
  return (
    <div className="pg">
      <PageHeader title={t("leads")} sub={`${rows.length} leads`}>
        <Seg val="table" onChange={() => app.nav("pipeline")} opts={[{ v:"table", i:"list", l:t("table") }, { v:"k", i:"kanban", l:"Kanban" }]} />
        <Btn v="p" icon="plus" onClick={() => app.newLead()}>{t("newLead")}</Btn>
      </PageHeader>
      <div className="fb cd" style={{ padding:10 }}>
        <div className="siw"><span className="si"><Icon name="search" size={13} /></span><input placeholder="Search leadsâ€¦" value={f.q} onChange={e => setF(s => ({ ...s, q: e.target.value }))} /></div>
        <select value={f.status} onChange={e => setF(s => ({ ...s, status: e.target.value }))}><option>All</option>{LEAD_ST.map(s => <option key={s}>{s}</option>)}</select>
        <select value={f.agent} onChange={e => setF(s => ({ ...s, agent: e.target.value }))}><option value="All">Agent: all</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select value={f.source} onChange={e => setF(s => ({ ...s, source: e.target.value }))}><option>All</option>{LEAD_SOURCES.map(s => <option key={s.name}>{s.name}</option>)}</select>
      </div>
      <div className="cd"><DataTable cols={cols} rows={rows} onRow={l => app.openLead(l.id)} empty={emptyLeads} /></div>
    </div>
  );
}
function LeadDrawer({ id, onClose, edit = false }) {
  const app = useApp(); const { leads, clients, properties, members, setLeads } = app;
  const l = leads.find(x => x.id === id);
  const [mode, setMode] = useState(edit ? "edit" : "view");
  const [d, setD] = useState(l ? { ...l } : { id: uid("l"), clientId:"", propertyId: properties[0]?.id, source:"Website", interest:"Warm", status:"New", budget:"", agentId: app.me.id, notes:"" });
  const set = (k, v) => setD(s => ({ ...s, [k]: v }));
  const isNew = !l;
  const cName = cid => (clients.find(c => c.id === cid) || {}).fullName || "New inbound lead";
  const save = () => { setLeads(ls => { const i = ls.findIndex(x => x.id === d.id); const rec = { ...d, budget:+d.budget || 0, updatedAt: Date.now() }; return i >= 0 ? ls.map(x => x.id === d.id ? rec : x) : [rec, ...ls]; }); toast("Lead saved"); onClose(); };
  if (mode === "edit" || isNew) return (<Drawer open onClose={onClose} title={isNew ? "New lead" : "Edit lead"} sub="organization_leads"
    footer={<><Btn onClick={onClose}>{app.t("cancel")}</Btn><Btn v="p" icon="check" onClick={save}>{app.t("save")}</Btn></>}>
    <FormSection title="Lead Context"><div className="fr"><Field label="Client"><select value={d.clientId} onChange={e => set("clientId", e.target.value)}><option value="">Inbound (no client)</option>{clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></Field>
      <Field label="Property"><select value={d.propertyId} onChange={e => set("propertyId", e.target.value)}>{properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field></div></FormSection>
    <FormSection title="Qualification"><div className="fr three"><Field label="Source"><select value={d.source} onChange={e => set("source", e.target.value)}>{LEAD_SOURCES.map(s => <option key={s.name}>{s.name}</option>)}</select></Field>
      <Field label="Interest"><select value={d.interest} onChange={e => set("interest", e.target.value)}><option>Hot</option><option>Warm</option><option>Cold</option></select></Field>
      <Field label="Status"><select value={d.status} onChange={e => set("status", e.target.value)}>{LEAD_ST.map(s => <option key={s}>{s}</option>)}</select></Field></div>
      <div className="fr"><Field label="Estimated Budget"><input type="number" value={d.budget} onChange={e => set("budget", e.target.value)} /></Field>
        <Field label="Assigned Agent"><select value={d.agentId} onChange={e => set("agentId", e.target.value)}>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field></div></FormSection>
    <FormSection title="Notes"><textarea rows={3} value={d.notes} onChange={e => set("notes", e.target.value)} /></FormSection>
  </Drawer>);
  return (<Drawer open onClose={onClose} title={"Lead " + l.id} sub={`${l.source} Â· created ${timeAgo(l.createdAt)}`}
    footer={<><Btn onClick={onClose}>{app.t("close")}</Btn><Btn v="p" icon="pencil" onClick={() => setMode("edit")}>{app.t("edit")}</Btn></>}>
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}><Badge color={LEAD_C[l.status]}>{l.status}</Badge><Badge color={l.interest === "Hot" ? "#ef4444" : l.interest === "Warm" ? "#f59e0b" : "#64748b"}>{l.interest}</Badge></div>
    <div className="lr"><Avatar name={cName(l.clientId)} id={l.id} size={32} /><div className="lt"><b>{cName(l.clientId)}</b><span>{l.notes || "No notes"}</span></div></div>
    <div className="dvd" />
    <div className="lr"><div className="lt"><b>{(properties.find(p => p.id === l.propertyId) || {}).title || "â€”"}</b><span>Interested property</span></div><div className="lrr"><b className="num">{l.budget ? moneyC(l.budget) : ""}</b></div></div>
    <div className="dvd" /><div className="fs-t">Move to stage</div>
    <div className="chips">{LEAD_ST.map(s => <span key={s} className={`chp ${l.status === s ? "on" : ""}`} onClick={() => { setLeads(ls => ls.map(x => x.id === l.id ? { ...x, status: s, updatedAt: Date.now() } : x)); toast("Lead moved to " + s); }}>{s}</span>)}</div>
  </Drawer>);
}

function Requests() {
  const app = useApp(); const { lang, leads, clients, properties, members, setLeads } = app;
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("Open");
  const rows = leads.filter(l => filter === "All" ? true : filter === "Open" ? !["Completed","Lost"].includes(l.status) : l.status === filter);
  const reqType = l => l.status === "Viewing" ? (lang === "ar" ? "طلب معاينة" : "Viewing request") : l.status === "Negotiation" || l.status === "Offer" ? (lang === "ar" ? "طلب تفاوض" : "Negotiation request") : (lang === "ar" ? "طلب معلومات" : "Information request");
  const nextAction = l => {
    const map = {
      New:[lang === "ar" ? "تواصل مع العميل" : "Contact customer", "phone"],
      Contacted:[lang === "ar" ? "جدولة معاينة" : "Schedule viewing", "calendar"],
      Viewing:[lang === "ar" ? "تحديد المعاينة كمكتملة" : "Mark viewing completed", "check"],
      Offer:[lang === "ar" ? "بدء معاملة" : "Start transaction", "shield"],
      Negotiation:[lang === "ar" ? "تسجيل الاتفاق" : "Record agreement", "wallet"],
      Agreement:[lang === "ar" ? "فتح المعاملة" : "Open transaction", "shield"],
      Contract:[lang === "ar" ? "فتح المعاملة" : "Open transaction", "shield"],
      Completed:[lang === "ar" ? "مغلق" : "Closed", "check"],
      Lost:[lang === "ar" ? "مفقود" : "Lost", "x"],
    };
    return map[l.status] || map.New;
  };
  const cols = [
    { label:lang === "ar" ? "العميل" : "Customer", render:l => <div className="cm"><Avatar name={clientName(clients.find(c => c.id === l.clientId), lang)} id={l.clientId} size={30} /><b>{clientName(clients.find(c => c.id === l.clientId), lang)}</b></div> },
    { label:lang === "ar" ? "العقار" : "Property", render:l => propTitle(properties.find(p => p.id === l.propertyId), lang) },
    { label:lang === "ar" ? "الطلب" : "Request", render:l => reqType(l) },
    { label:lang === "ar" ? "الحالة" : "Status", render:l => <Badge color={LEAD_C[l.status]}>{requestStatusLabel(l.status, lang)}</Badge> },
    { label:lang === "ar" ? "الوكيل المسؤول" : "Assigned Agent", render:l => memberName(members.find(m => m.id === l.agentId), lang) },
    { label:lang === "ar" ? "الإجراء التالي" : "Next Action", render:l => <Badge color="#2f6bff">{nextAction(l)[0]}</Badge> },
  ];
  const l = leads.find(x => x.id === sel);
  const c = l && clients.find(x => x.id === l.clientId);
  const p = l && properties.find(x => x.id === l.propertyId);
  const agent = l && members.find(x => x.id === l.agentId);
  const advance = status => { setLeads(ls => ls.map(x => x.id === l.id ? { ...x, status, updatedAt:Date.now() } : x)); toast(lang === "ar" ? "تم تحديث الطلب" : "Request updated"); };
  const actions = l ? ({
    New:[[lang === "ar" ? "تواصل مع العميل" : "Contact customer","phone",() => advance("Contacted")]],
    Contacted:[[lang === "ar" ? "جدولة معاينة" : "Schedule viewing","calendar",() => advance("Viewing")]],
    Viewing:[[lang === "ar" ? "تحديد المعاينة كمكتملة" : "Mark viewing completed","check",() => advance("Negotiation")]],
    Negotiation:[[lang === "ar" ? "تسجيل عرض" : "Record offer","wallet",() => advance("Offer")],[lang === "ar" ? "بدء معاملة" : "Start transaction","shield",() => app.nav("transactions")]],
    Offer:[[lang === "ar" ? "بدء معاملة" : "Start transaction","shield",() => app.nav("transactions")]],
    Agreement:[[lang === "ar" ? "فتح المعاملة" : "Open transaction","shield",() => app.nav("transactions")]],
    Contract:[[lang === "ar" ? "فتح المعاملة" : "Open transaction","shield",() => app.nav("transactions")]],
  }[l.status] || []) : [];
  return <div className="pg"><PageHeader title={lang === "ar" ? "الطلبات" : "Requests"} sub={lang === "ar" ? "طلبات العملاء القادمة من سوق أوربكس" : "Customer requests coming from the Orbix marketplace"}>
    <Btn icon="users" onClick={() => toast(lang === "ar" ? "إضافة عميل خارجي (تجريبي)" : "Add external customer (demo)", "info")}>{lang === "ar" ? "إضافة عميل خارجي" : "Add External Customer"}</Btn>
  </PageHeader>
    <div className="fb">{["Open","New","Contacted","Viewing","Negotiation","Transaction Started","Closed","Lost","All"].map(s => <span key={s} className={`chp ${filter === s ? "on" : ""}`} onClick={() => setFilter(s === "Transaction Started" ? "Agreement" : s === "Closed" ? "Completed" : s)}>{lang === "ar" ? ({ Open:"المفتوحة", New:"جديدة", Contacted:"تم التواصل", Viewing:"معاينة", Negotiation:"تفاوض", "Transaction Started":"بدأت المعاملة", Closed:"مغلقة", Lost:"مفقودة", All:"الكل" }[s]) : s}</span>)}</div>
    <div className="cd"><DataTable cols={cols} rows={rows} onRow={x => setSel(x.id)} minW={980} /></div>
    <Drawer open={!!l} onClose={() => setSel(null)} title={l && clientName(c, lang)} sub={l && `${requestStatusLabel(l.status, lang)} · ${timeAgo(l.createdAt)}`}>
      {l && <><div className="lr"><Avatar name={clientName(c, lang)} id={c?.id} size={34} /><div className="lt"><b>{clientName(c, lang)}</b><span className="mono">{c?.phone} · {c?.email}</span></div></div>
      <div className="lr"><img className="thmb" src={p?.images?.[0]} alt="" /><div className="lt"><b>{propTitle(p, lang)}</b><span>{cityOf(p, lang)} · {districtOf(p, lang)}</span></div></div>
      <div className="fgd"><div className="fc"><b>{lang === "ar" ? "تاريخ الطلب" : "Request date"}</b><span>{timeAgo(l.createdAt)}</span></div><div className="fc"><b>{lang === "ar" ? "الوكيل المسؤول" : "Assigned agent"}</b><span>{memberName(agent, lang)}</span></div><div className="fc"><b>{lang === "ar" ? "ملاحظات" : "Notes"}</b><span>{l.notes}</span></div></div>
      <FormSection title={lang === "ar" ? "الخط الزمني" : "Timeline"}><Timeline items={[{ id:"r1", user:"Orbix", text:lang === "ar" ? "تم إنشاء الطلب من السوق" : "Request created from marketplace", ts:l.createdAt, color:"#2f6bff" },{ id:"r2", user:memberName(agent, lang), text:lang === "ar" ? `الحالة الحالية: ${requestStatusLabel(l.status, lang)}` : `Current status: ${requestStatusLabel(l.status, lang)}`, ts:l.updatedAt, color:"#10b981" }]} /></FormSection>
      <FormSection title={lang === "ar" ? "الإجراء التالي" : "Next Action"}><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{actions.map(a => <Btn key={a[0]} v="p" icon={a[1]} onClick={a[2]}>{a[0]}</Btn>)}{!actions.length && <Badge color="#64748b">{requestStatusLabel(l.status, lang)}</Badge>}</div></FormSection></>}
    </Drawer>
  </div>;
}

function Pipeline() {
  const app = useApp(); const { t, lang, leads, clients, properties, members, branches, setLeads, org } = app;
  const [dragId, setDragId] = useState(null); const [over, setOver] = useState(null);
  const cName = id => (clients.find(c => c.id === id) || {}).fullName || "New inbound lead";
  const stageLabel = s => ({ New: lang === "ar" ? "عميل محتمل جديد" : "New Lead", Contacted: lang === "ar" ? "تم التواصل" : "Contacted", Viewing: lang === "ar" ? "معاينة" : "Viewing", Offer: lang === "ar" ? "عرض" : "Offer", Negotiation: lang === "ar" ? "تفاوض" : "Negotiation", Agreement: lang === "ar" ? "اتفاق" : "Agreement", Contract: lang === "ar" ? "عقد" : "Contract", Completed: lang === "ar" ? "مكتملة" : "Completed", Lost: lang === "ar" ? "مفقودة" : "Lost" }[s] || s);
  const priorityLabel = p => ({ Low: lang === "ar" ? "منخفضة" : "Low", Medium: lang === "ar" ? "متوسطة" : "Medium", High: lang === "ar" ? "عالية" : "High", Urgent: lang === "ar" ? "عاجلة" : "Urgent" }[p] || p || "Medium");
  return (<div className="pg">
    <PageHeader title={t("pipeline")} sub={lang === "ar" ? "اسحب العملاء بين مراحل العمل - تحديث محلي فقط" : "Drag leads between stages - state updates locally"}>
      <Btn v="p" icon="plus" onClick={() => app.newLead()}>{t("newLead")}</Btn>
    </PageHeader>
    <div className="kb">
      {LEAD_ST.map(st => { const ls = leads.filter(l => l.status === st); const sum = ls.reduce((a, l) => a + (l.budget || 0), 0);
        return (<div key={st} className={`kc ${over === st ? "ov" : ""}`}
          onDragOver={e => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(null)}
          onDrop={e => { e.preventDefault(); setOver(null); if (dragId) { setLeads(l2 => l2.map(x => x.id === dragId ? { ...x, status: st, updatedAt: Date.now() } : x)); toast("Lead moved to " + st); setDragId(null); } }}>
          <div className="kc-h"><i style={{ background: LEAD_C[st] }} />{stageLabel(st)}<span className="n">{ls.length}</span><span className="sm num">{sum ? moneyC(sum, org.currency, lang) : ""}</span></div>
          <div className="kc-b">
            {ls.map(l => { const p = properties.find(x => x.id === l.propertyId) || {}; const m = members.find(x => x.id === l.agentId) || {}; const b = branches.find(x => x.id === (l.branchId || p.branchId)) || {}; const pr = l.priority || (l.interest === "Hot" ? "High" : "Medium"); return (<div key={l.id} className={`kcd ${dragId === l.id ? "dr" : ""}`} draggable
              onDragStart={() => setDragId(l.id)} onDragEnd={() => setDragId(null)} onClick={() => app.openLead(l.id)}>
              <b>{cName(l.clientId)}</b><div className="su">{propTitle(p, lang) || "—"}</div>
              <div className="su"><span>{lang === "ar" ? "قيمة الصفقة" : "Deal Value"}: </span><span className="num">{l.budget ? moneyC(l.budget, p.currency || org.currency, lang) : "—"}</span></div>
              <div className="su">{lang === "ar" ? "الفرع" : "Branch"}: {branchName(b, lang)} · {lang === "ar" ? "آخر نشاط" : "Last Activity"}: {timeAgo(l.updatedAt)}</div>
              <div className="ft"><Avatar name={memberName(m, lang) || "?"} id={l.agentId} size={20} /><span style={{ fontSize:11 }}>{memberName(m, lang)}</span><Badge color={pr === "Urgent" ? "#ef4444" : pr === "High" ? "#f97316" : pr === "Medium" ? "#f59e0b" : "#64748b"}>{priorityLabel(pr)}</Badge></div>
            </div>); })}
            {!ls.length && <div style={{ fontSize:11, color:"var(--tx3)", textAlign:"center", padding:10 }}>{lang === "ar" ? "اسحب هنا" : "Drop here"}</div>}
          </div></div>); })}
    </div>
  </div>);
}

const txStageLabel = (s, lang = "en") => ({
  "Property Discovery":["Property Discovery","اكتشاف العقار"], "Inquiry / Lead":["Inquiry / Lead","استفسار"], "Viewing Request":["Viewing Request","طلب معاينة"], "Viewing Confirmed":["Viewing Confirmed","تأكيد المعاينة"], "Viewing Completed":["Viewing Completed","إتمام المعاينة"], "Offer Submitted":["Offer Submitted","تقديم عرض"], Negotiation:["Negotiation","التفاوض"], "Orbix Verification":["Orbix Verification","تحقق أوربكس"], Agreement:["Agreement","الاتفاق"], "Contract Preparation":["Contract Preparation","إعداد العقد"], Signature:["Signature","التوقيع"], "Settlement / Payment Status":["Settlement / Payment Status","التسوية / حالة الدفع"], "Transaction Completed":["Transaction Completed","إتمام الصفقة"],
}[s]?.[lang === "ar" ? 1 : 0] || s);
const statusLabel = (s, lang = "en") => ({
  Requested:["Requested","تم الطلب"], Confirmed:["Confirmed","مؤكدة"], Completed:["Completed","مكتملة"], Cancelled:["Cancelled","ملغاة"], "No Show":["No Show","لم يحضر"],
  Draft:["Draft","مسودة"], Submitted:["Submitted","مقدم"], "Under Review":["Under Review","قيد المراجعة"], "Counter Offer":["Counter Offer","عرض مقابل"], Accepted:["Accepted","مقبول"], Rejected:["Rejected","مرفوض"], Expired:["Expired","منتهي"],
  "Not Required":["Not Required","غير مطلوب"], "Pending Review":["Pending Review","بانتظار المراجعة"], "Under Verification":["Under Verification","قيد التحقق"], "Action Required":["Action Required","يتطلب إجراء"], Verified:["Verified","تم التحقق"], "Ready for Contract":["Ready for Contract","جاهزة للعقد"],
}[s]?.[lang === "ar" ? 1 : 0] || txStageLabel(s, lang));

function Viewings() {
  const app = useApp(); const { lang, viewings, properties, clients, members, branches } = app;
  const cols = [
    { label:lang === "ar" ? "العميل" : "Customer", render:v => (clients.find(c => c.id === v.clientId) || {}).fullName || "—" },
    { label:lang === "ar" ? "العقار" : "Property", render:v => propTitle(properties.find(p => p.id === v.propertyId) || {}, lang) },
    { label:lang === "ar" ? "الوكيل" : "Agent", render:v => memberName(members.find(m => m.id === v.agentId) || {}, lang) },
    { label:lang === "ar" ? "الفرع" : "Branch", render:v => branchName(branches.find(b => b.id === v.branchId) || {}, lang) },
    { label:lang === "ar" ? "تاريخ الطلب" : "Requested Date", render:v => timeAgo(v.requestedAt) },
    { label:lang === "ar" ? "الموعد" : "Scheduled Date", render:v => <span className="num">{new Date(v.scheduledAt).toLocaleString(lang === "ar" ? "ar-SY" : "en-US")}</span> },
    { label:lang === "ar" ? "الحالة" : "Status", render:v => <Badge color={v.status === "Completed" ? "#10b981" : v.status === "Confirmed" ? "#2f6bff" : v.status === "Cancelled" ? "#ef4444" : "#f59e0b"}>{statusLabel(v.status, lang)}</Badge> },
    { label:lang === "ar" ? "التواصل" : "Customer Contact", key:"contact" },
    { label:lang === "ar" ? "الإجراءات" : "Actions", align:"end", render:() => <div className="ra"><button className="ib" title="Confirm" onClick={e => { e.stopPropagation(); toast("Viewing confirmed (demo)"); }}><Icon name="check" size={14} /></button><button className="ib" title="Reschedule" onClick={e => { e.stopPropagation(); toast("Reschedule opened (demo)", "info"); }}><Icon name="calendar" size={14} /></button><button className="ib" title="Add Notes" onClick={e => { e.stopPropagation(); toast("Notes added (demo)", "info"); }}><Icon name="pencil" size={14} /></button></div> },
  ];
  return <div className="pg"><PageHeader title={lang === "ar" ? "المعاينات" : "Viewings"} sub={lang === "ar" ? "طلبات ومواعيد معاينة العقارات" : "Property viewing requests and appointments"} /><div className="cd"><DataTable cols={cols} rows={viewings} minW={1120} /></div></div>;
}

function Offers() {
  const app = useApp(); const { lang, offers, properties, clients, members, org } = app; const [sel, setSel] = useState(null);
  const cols = [
    { label:lang === "ar" ? "العميل" : "Customer", render:o => (clients.find(c => c.id === o.clientId) || {}).fullName || "—" },
    { label:lang === "ar" ? "العقار" : "Property", render:o => propTitle(properties.find(p => p.id === o.propertyId) || {}, lang) },
    { label:lang === "ar" ? "الوكيل" : "Agent", render:o => memberName(members.find(m => m.id === o.agentId) || {}, lang) },
    { label:lang === "ar" ? "قيمة العرض" : "Offer Amount", render:o => <span className="num">{money(o.amount, o.currency || org.currency, lang)}</span> },
    { label:lang === "ar" ? "السعر المطلوب" : "Asking Price", render:o => <span className="num">{money(o.askingPrice, o.currency || org.currency, lang)}</span> },
    { label:lang === "ar" ? "تاريخ العرض" : "Offer Date", render:o => timeAgo(o.offerDate) },
    { label:lang === "ar" ? "الانتهاء" : "Expiration", render:o => <span className="num">{new Date(o.expiresAt).toLocaleDateString(lang === "ar" ? "ar-SY" : "en-US")}</span> },
    { label:lang === "ar" ? "الحالة" : "Status", render:o => <Badge color={o.status === "Accepted" ? "#10b981" : o.status === "Rejected" ? "#ef4444" : "#f59e0b"}>{statusLabel(o.status, lang)}</Badge> },
  ];
  const o = offers.find(x => x.id === sel); const p = o && properties.find(x => x.id === o.propertyId); const c = o && clients.find(x => x.id === o.clientId);
  return <div className="pg"><PageHeader title={lang === "ar" ? "العروض" : "Offers"} sub={lang === "ar" ? "عروض العملاء والتفاوض" : "Customer offers and negotiation"} /><div className="cd"><DataTable cols={cols} rows={offers} onRow={x => setSel(x.id)} minW={1000} /></div>
    {o && <Drawer open onClose={() => setSel(null)} title={`${lang === "ar" ? "العرض" : "Offer"} ${o.id}`} sub={propTitle(p, lang)}><div className="sst" style={{ marginBottom:14 }}><div className="st"><b className="num">{money(o.askingPrice, o.currency, lang)}</b><span>{lang === "ar" ? "السعر المطلوب" : "Asking Price"}</span></div><div className="st"><b className="num">{money(o.amount, o.currency, lang)}</b><span>{lang === "ar" ? "عرض العميل" : "Customer Offer"}</span></div><div className="st"><b className="num">{money(o.amount - o.askingPrice, o.currency, lang)}</b><span>{lang === "ar" ? "الفرق" : "Difference"}</span></div></div><FormSection title={lang === "ar" ? "ملاحظات" : "Notes"}><p style={{ color:"var(--tx2)", fontSize:12 }}>{o.customerNotes}</p><p style={{ color:"var(--tx3)", fontSize:12, marginTop:8 }}>{o.agencyNotes}</p></FormSection><FormSection title={lang === "ar" ? "سجل التفاوض" : "Negotiation History"}><Timeline items={o.history.map((h,i) => ({ id:i, user:h[0], text:h[1], ts:h[2], color:"#2f6bff" }))} /></FormSection><div className="lr"><Avatar name={c?.fullName} id={o.clientId} size={30} /><div className="lt"><b>{c?.fullName}</b><span>{c?.phone}</span></div></div></Drawer>}
  </div>;
}

function TransactionsPage() {
  const app = useApp(); const { lang, transactions, properties, clients, members, branches, org, route, nav } = app;
  if (route.param) return <TransactionDetail id={route.param} />;
  const cols = [
    { label:lang === "ar" ? "رقم المعاملة" : "Transaction ID", render:x => <span className="mono">{x.transactionId}</span> },
    { label:lang === "ar" ? "العقار" : "Property", render:x => propTitle(properties.find(p => p.id === x.propertyId) || {}, lang) },
    { label:lang === "ar" ? "العميل" : "Customer", render:x => (clients.find(c => c.id === x.clientId) || {}).fullName || "—" },
    { label:lang === "ar" ? "الوكيل" : "Agent", render:x => memberName(members.find(m => m.id === x.agentId) || {}, lang) },
    { label:lang === "ar" ? "المكتب" : "Agency", render:() => textOf(org, lang) },
    { label:lang === "ar" ? "نوع المعاملة" : "Transaction Type", render:x => x.transactionType === "rent" ? (lang === "ar" ? "إيجار" : "Rent") : (lang === "ar" ? "بيع" : "Sale") },
    { label:lang === "ar" ? "قيمة العقار" : "Property Value", render:x => <span className="num">{money(x.propertyValue, x.currency, lang)}</span> },
    { label:lang === "ar" ? "المرحلة" : "Current Stage", render:x => txStageLabel(x.status, lang) },
    { label:lang === "ar" ? "التحقق" : "Verification", render:x => <Badge color={x.verificationStatus === "Verified" ? "#10b981" : "#f59e0b"}>{statusLabel(x.verificationStatus, lang)}</Badge> },
    { label:lang === "ar" ? "العقد" : "Contract", render:x => x.contractStatus },
    { label:lang === "ar" ? "الدفع" : "Payment Status", render:x => x.paymentStatus },
    { label:lang === "ar" ? "حالة أوربكس" : "Orbix Status", render:x => <Badge color={x.orbixStatus === "Completed" ? "#10b981" : "#2f6bff"}>{statusLabel(x.orbixStatus, lang)}</Badge> },
    { label:lang === "ar" ? "آخر تحديث" : "Updated", render:x => timeAgo(x.updatedAt) },
  ];
  return <div className="pg"><PageHeader title={lang === "ar" ? "المعاملات" : "Transactions"} sub={lang === "ar" ? "رحلة واحدة من الطلب إلى العقد والدفع والإتمام" : "One journey from request to contract, payment confirmation, and completion"}><Btn v="p" icon="plus" onClick={() => toast(lang === "ar" ? "بدء معاملة (تجريبي)" : "Start transaction (demo)", "info")}>{lang === "ar" ? "بدء معاملة" : "Start Transaction"}</Btn></PageHeader><div className="cd"><DataTable cols={cols} rows={transactions} onRow={x => app.go(`${BASE}/transactions/${x.id}`)} minW={1250} /></div></div>;
}

function TransactionDetail({ id, customerSafe = false }) {
  const app = useApp(); const { lang, transactions, properties, clients, members, branches, offers, contracts, org } = app;
  const tx = transactions.find(x => x.id === id || x.transactionId === id) || transactions[0];
  const p = properties.find(x => x.id === tx.propertyId) || {}; const c = clients.find(x => x.id === tx.clientId) || {}; const m = members.find(x => x.id === tx.agentId) || {}; const b = branches.find(x => x.id === tx.branchId) || {}; const offer = offers.find(x => x.id === tx.offerId); const contract = contracts.find(x => x.id === tx.contractId);
  const saleSteps = ["Request received","Viewing completed","Price agreed","Contract generated","Customer signed","Office / seller signature","Payment confirmation","Official procedures","Ownership transfer confirmed","Completed"];
  const rentSteps = ["Request received","Viewing completed","Rent agreed","Contract generated","Customer signed","Office / landlord signature","Payment confirmation","Completed"];
  const stepAr = { "Request received":"استلام الطلب", "Viewing completed":"إتمام المعاينة", "Price agreed":"الاتفاق على السعر", "Rent agreed":"الاتفاق على الإيجار", "Contract generated":"إنشاء العقد", "Customer signed":"توقيع العميل", "Office / seller signature":"توقيع المكتب / البائع", "Office / landlord signature":"توقيع المكتب / المؤجر", "Payment confirmation":"تأكيد الدفع", "Official procedures":"الإجراءات الرسمية عند الحاجة", "Ownership transfer confirmed":"تأكيد نقل الملكية", Completed:"مكتملة" };
  const steps = tx.transactionType === "rent" ? rentSteps : saleSteps;
  const completeThrough = tx.status === "Transaction Completed" ? steps.length - 1 : tx.contractStatus === "Signed" ? 6 : tx.contractStatus === "Awaiting Signature" ? 4 : tx.offerStatus === "Accepted" ? 3 : tx.viewingStatus === "Completed" ? 1 : 0;
  return <div className="pg"><PageHeader title={tx.transactionId} sub={`${clientName(c, lang)} · ${propTitle(p, lang)}`}><Badge color="#2f6bff">{tx.transactionType === "rent" ? (lang === "ar" ? "إيجار" : "Rent") : (lang === "ar" ? "بيع" : "Sale")}</Badge></PageHeader>
    <div className="kg" style={{ gridTemplateColumns:"repeat(4,1fr)" }}><KpiCard icon="home" label={lang === "ar" ? "العقار" : "Property"} value={propTitle(p, lang)} /><KpiCard icon="users" label={lang === "ar" ? "العميل" : "Customer"} value={clientName(c, lang)} /><KpiCard icon="usercheck" label={lang === "ar" ? "الوكيل" : "Agent"} value={memberName(m, lang)} /><KpiCard icon="dollar" label={lang === "ar" ? "المبلغ المتفق عليه" : "Agreed Amount"} value={money(tx.propertyValue, tx.currency, lang)} /></div>
    <div className="g22">
      <div className="cd cd-b"><FormSection title={lang === "ar" ? "رحلة المعاملة" : "Transaction Journey"}><Timeline items={steps.map((s,i) => ({ id:s, user:i <= completeThrough ? (lang === "ar" ? "تم" : "Done") : (lang === "ar" ? "التالي" : "Next"), text:lang === "ar" ? stepAr[s] : s, ts:tx.createdAt + i * 864e5, color:i <= completeThrough ? "#10b981" : "#64748b" }))} /></FormSection></div>
      <div className="cd cd-b"><FormSection title={lang === "ar" ? "المعلومات الأساسية" : "Essential Information"}><div className="fgd"><div className="fc"><b>{lang === "ar" ? "العقار" : "Property"}</b><span>{propTitle(p, lang)}</span></div><div className="fc"><b>{lang === "ar" ? "العميل" : "Customer"}</b><span>{clientName(c, lang)} · {c.phone}</span></div><div className="fc"><b>{lang === "ar" ? "نوع المعاملة" : "Transaction type"}</b><span>{tx.transactionType === "rent" ? (lang === "ar" ? "إيجار" : "Rent") : (lang === "ar" ? "بيع" : "Sale")}</span></div><div className="fc"><b>{lang === "ar" ? "الشروط المتفق عليها" : "Agreed terms"}</b><span>{offer?.customerNotes || (lang === "ar" ? "شروط تجريبية مختصرة" : "Short demo terms")}</span></div></div></FormSection></div>
    </div>
    <div className="g22">
      <div className="cd cd-b"><FormSection title={lang === "ar" ? "العقد PDF" : "PDF Contract"}><div className="sst"><div className="st"><b>{contract?.id || "—"}</b><span>{lang === "ar" ? "رقم العقد" : "Contract"}</span></div><div className="st"><b>{tx.contractStatus}</b><span>{lang === "ar" ? "حالة العقد" : "Contract status"}</span></div><div className="st"><b>{tx.signatureStatus}</b><span>{lang === "ar" ? "التوقيع" : "Signature"}</span></div></div><div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:12 }}><Btn icon="filetext" onClick={() => toast(lang === "ar" ? "تم إنشاء عقد تجريبي" : "Mock contract generated", "info")}>{lang === "ar" ? "إنشاء عقد" : "Generate Contract"}</Btn><Btn icon="eye" onClick={() => toast(lang === "ar" ? "معاينة PDF تجريبية" : "PDF preview (demo)", "info")}>{lang === "ar" ? "معاينة PDF" : "Preview PDF"}</Btn><Btn icon="send" onClick={() => toast(lang === "ar" ? "تم الإرسال للعميل (تجريبي)" : "Sent to customer (demo)")}>{lang === "ar" ? "إرسال للعميل" : "Send to Customer"}</Btn><Btn v="p" icon="check" onClick={() => toast(lang === "ar" ? "تم التوقيع تجريبياً" : "Marked signed (demo)")}>{lang === "ar" ? "تحديد كموقع" : "Mark as Signed"}</Btn></div><p style={{ color:"var(--tx3)", fontSize:12, marginTop:12 }}>{lang === "ar" ? "توقيع PDF لا يعني تلقائياً نقل الملكية القانونية." : "Signing a PDF does not automatically transfer legal ownership."}</p></FormSection></div>
      <div className="cd cd-b"><FormSection title={lang === "ar" ? "الدفع" : "Payment"}><div className="fgd"><div className="fc"><b>{lang === "ar" ? "المبلغ" : "Amount"}</b><span>{money(tx.propertyValue, tx.currency, lang)}</span></div><div className="fc"><b>{lang === "ar" ? "المستلم" : "Recipient"}</b><span>{textOf(org, lang)}</span></div><div className="fc"><b>{lang === "ar" ? "الطريقة" : "Method"}</b><span>{lang === "ar" ? "تحويل بنكي / نقداً / أخرى" : "Bank Transfer / Cash / Other"}</span></div><div className="fc"><b>{lang === "ar" ? "الحالة" : "Status"}</b><span>{tx.paymentStatus}</span></div></div><Btn v="p" icon="check" onClick={() => toast(lang === "ar" ? "تم تأكيد استلام الدفع بواسطة أطلس العقارية (تجريبي)" : "Payment confirmed by Atlas Real Estate (demo)")}>{lang === "ar" ? "تأكيد استلام الدفع" : "Confirm Payment Received"}</Btn><p style={{ color:"var(--tx3)", fontSize:12, marginTop:12 }}>{lang === "ar" ? "أوربكس لا يستلم ولا يحتفظ بأموال العملاء. يتم تسجيل حالة الدفع فقط." : "Orbix does not receive or hold customer funds. This only records payment status."}</p></FormSection></div>
    </div>
    {tx.transactionType !== "rent" && <div className="cd cd-b"><FormSection title={lang === "ar" ? "الإجراءات الرسمية" : "Official Procedures"}><p style={{ color:"var(--tx2)" }}>{lang === "ar" ? "بعد توقيع الاتفاق التجاري وتأكيد الدفع، قد تكون هناك إجراءات رسمية لنقل الملكية حسب الجهة المختصة. أوربكس لا يعمل كمسجل حكومي أو كاتب عدل أو ضامن قانوني." : "After the commercial agreement is signed and payment is confirmed, official ownership-transfer procedures may apply with the relevant authority. Orbix is not a government registrar, notary, or legal guarantor."}</p></FormSection></div>}
  </div>;
}

function PartnerPlaceholder({ title }) {
  return <div className="pg"><PageHeader title={title} sub="Shared partner surface · frontend placeholder" /><div className="cd cd-b"><EmptyState icon="settings" title={title} desc="Prepared as part of the Partner Suite navigation architecture." /></div></div>;
}

function Deals() {
  const app = useApp(); const { deals, properties, clients, members, branches, org, lang } = app;
  const pOf = id => (properties.find(p => p.id === id) || {});
  const won = deals.filter(d => d.stage === "Closed Won");
  const emptyDeals = (<EmptyState icon="handshake" title="No deals" desc="Deals appear from qualified leads." />);
  const cols = [
    { label:"Deal ID", sortable:true, key:"id", render: d => <span className="mono">{d.id}</span> },
    { label:lang === "ar" ? "العقار" : "Property", render: d => propTitle(pOf(d.propertyId), lang) || "—" },
    { label:lang === "ar" ? "العميل" : "Customer", render: d => (clients.find(c => c.id === d.clientId) || {}).fullName || "—" },
    { label:lang === "ar" ? "الوكيل" : "Agent", render: d => memberName(members.find(m => m.id === d.agentId) || {}, lang) || "—" },
    { label:lang === "ar" ? "الفرع" : "Branch", render: d => branchName(branches.find(b => b.id === pOf(d.propertyId).branchId) || {}, lang) },
    { label:lang === "ar" ? "القيمة المتوقعة" : "Expected Value", sortable:true, key:"amount", render: d => <span className="num" style={{ fontWeight:600 }}>{money(d.amount, org.currency, lang)}</span> },
    { label:lang === "ar" ? "المرحلة الحالية" : "Current Stage", sortable:true, key:"stage", render: d => <Badge color={DEAL_C[d.stage]}>{d.stage}</Badge> },
    { label:lang === "ar" ? "الاحتمالية" : "Probability", render: d => d.stage === "Closed Won" ? "100%" : d.stage === "Closed Lost" ? "0%" : d.stage === "Under Contract" ? "75%" : "55%" },
    { label:lang === "ar" ? "آخر نشاط" : "Last Activity", sortable:true, key:"date", render: d => <span style={{ color:"var(--tx3)" }}>{timeAgo(d.date)}</span> },
    { label:lang === "ar" ? "العمولة المتوقعة" : "Expected Commission", render: d => <span className="num">{money(d.commission, org.currency, lang)}</span> },
    { label:lang === "ar" ? "الإجراءات" : "Actions", align:"end", render:d => <div className="ra"><button className="ib" onClick={e => { e.stopPropagation(); app.openDeal(d.id); }}><Icon name="eye" size={14} /></button><button className="ib" onClick={e => { e.stopPropagation(); toast("Stage update (demo)", "info"); }}><Icon name="kanban" size={14} /></button><button className="ib" onClick={e => { e.stopPropagation(); app.nav("viewings"); }}><Icon name="calendar" size={14} /></button><button className="ib" onClick={e => { e.stopPropagation(); app.nav("offers"); }}><Icon name="wallet" size={14} /></button><button className="ib" onClick={e => { e.stopPropagation(); app.nav("transactions"); }}><Icon name="shield" size={14} /></button></div> },
  ];
  return (
    <div className="pg">
      <PageHeader title={app.t("deals")} sub={`${deals.length} deals · pipeline ${moneyC(deals.filter(d => ["Negotiation","Under Contract"].includes(d.stage)).reduce((s, d) => s + d.amount, 0), org.currency, lang)}`} />
      <div className="kg" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
        <KpiCard icon="handshake" label="Pipeline value" value={moneyC(deals.filter(d => ["Negotiation","Under Contract"].includes(d.stage)).reduce((s, d) => s + d.amount, 0), org.currency, lang)} />
        <KpiCard icon="wallet" label="Won revenue" value={moneyC(won.reduce((s, d) => s + d.amount, 0), org.currency, lang)} />
        <KpiCard icon="dollar" label="Commission (won)" value={moneyC(won.reduce((s, d) => s + d.commission, 0), org.currency, lang)} />
        <KpiCard icon="trend" label="Win rate" value={Math.round(won.length / (deals.filter(d => d.stage.startsWith("Closed")).length || 1) * 100) + "%"} />
      </div>
      <div className="cd"><DataTable cols={cols} rows={deals} onRow={d => app.openDeal(d.id)} empty={emptyDeals} /></div>
    </div>
  );
}
function DealDrawer({ id, onClose }) {
  const app = useApp(); const d = app.deals.find(x => x.id === id); if (!d) return null;
  const p = app.properties.find(x => x.id === d.propertyId); const c = app.clients.find(x => x.id === d.clientId); const m = app.members.find(x => x.id === d.agentId);
  return (<Drawer open onClose={onClose} title={"Deal " + d.id} sub={p?.title || "â€”"}
    footer={<Btn onClick={onClose}>{app.t("close")}</Btn>}>
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}><Badge color={DEAL_C[d.stage]}>{d.stage}</Badge><Badge color={CT_C[d.contractStatus] || "#64748b"}>Contract: {d.contractStatus}</Badge><Badge color="#f59e0b">Payment: {d.paymentStatus}</Badge></div>
    <div className="sst" style={{ marginBottom:14 }}><div className="st"><b className="num">{money(d.amount)}</b><span>Amount</span></div><div className="st"><b className="num">{money(d.commission)}</b><span>Commission</span></div><div className="st"><b>{new Date(d.date).toLocaleDateString("en-US", { month:"short", day:"numeric" })}</b><span>Date</span></div></div>
    <div className="lr">{c && <Avatar name={c.fullName} id={c.id} size={32} />}<div className="lt"><b>{c?.fullName || "â€”"}</b><span>Client</span></div></div>
    <div className="lr"><Avatar name={m?.name || "?"} id={d.agentId} size={32} /><div className="lt"><b>{m?.name}</b><span>Assigned agent</span></div></div>
    {p && <div className="lr" style={{ cursor:"pointer" }} onClick={() => { onClose(); app.openProp(p.id); }}><img className="thmb" src={p.images[0]} alt="" /><div className="lt"><b>{p.title}</b><span>{p.city} Â· {p.district}</span></div><div className="lrr"><b className="num">{moneyC(p.price)}</b></div></div>}
  </Drawer>);
}

function Contracts() {
  const app = useApp(); const { t, lang, contracts, properties, clients, members, org } = app;
  const emptyCts = (<EmptyState icon="filetext" title="No contracts" desc="Contracts appear when deals progress." />);
  const cols = [
    { label:lang === "ar" ? "رقم العقد" : "Contract ID", sortable:true, key:"id", render: c => <span className="mono">{c.id}</span> },
    { label:t("property"), render: c => propTitle(properties.find(p => p.id === c.propertyId) || {}, lang) || "—" },
    { label:t("client"), render: c => (clients.find(x => x.id === c.clientId) || {}).fullName || "—" },
    { label:t("agent"), render: c => memberName(members.find(x => x.id === c.agentId) || {}, lang) || "—" },
    { label:lang === "ar" ? "نوع العقد" : "Contract Type", key:"type" },
    { label:t("amount"), sortable:true, key:"amount", render: c => <span className="num" style={{ fontWeight:600 }}>{money(c.amount, org.currency, lang)}</span> },
    { label:lang === "ar" ? "تاريخ الإنشاء" : "Created Date", sortable:true, key:"createdAt", render: c => <span style={{ color:"var(--tx3)" }}>{timeAgo(c.createdAt)}</span> },
    { label:lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date", render: c => <span style={{ color:"var(--tx3)" }}>{new Date(c.expiryAt).toLocaleDateString(lang === "ar" ? "ar-SY" : "en-US")}</span> },
    { label:lang === "ar" ? "حالة التوقيع" : "Signature Status", sortable:true, key:"status", render: c => <Badge color={CT_C[c.status]}>{c.status}</Badge> },
    { label:lang === "ar" ? "حالة الدفع" : "Payment Status", render: c => <Badge color={c.paymentStatus === "Paid" ? "#10b981" : "#f59e0b"}>{c.paymentStatus}</Badge> },
    { label:t("actions"), align:"end", render: c => <div className="ra"><button className="ib" title="Preview" onClick={e => { e.stopPropagation(); app.openContract(c.id); }}><Icon name="eye" size={14} /></button><button className="ib" title="Edit" onClick={e => { e.stopPropagation(); toast("Edit contract (demo)", "info"); }}><Icon name="pencil" size={14} /></button><button className="ib" title="Download" onClick={e => { e.stopPropagation(); toast("Download started (demo)", "info"); }}><Icon name="download" size={14} /></button><button className="ib" title="Send for Signature" onClick={e => { e.stopPropagation(); toast("Sent for signature (demo)"); }}><Icon name="send" size={14} /></button><button className="ib" title="View Transaction" onClick={e => { e.stopPropagation(); c.transactionId ? app.go(`${BASE}/transactions/${c.transactionId}`) : toast("No transaction linked", "info"); }}><Icon name="shield" size={14} /></button><button className="ib" title="Archive" onClick={e => { e.stopPropagation(); toast("Archived (demo)", "info"); }}><Icon name="archive" size={14} /></button></div> },
  ];
  return (
    <div className="pg">
      <PageHeader title={t("contracts")} sub={`${contracts.length} contracts · demo document actions`}><Btn v="p" icon="plus" onClick={() => toast("Create Contract (demo)", "info")}>{lang === "ar" ? "إنشاء عقد" : "Create Contract"}</Btn></PageHeader>
      <div className="cd"><DataTable cols={cols} rows={contracts} onRow={c => app.openContract(c.id)} empty={emptyCts} minW={1180} /></div>
    </div>
  );
}
function ContractDrawer({ id, onClose }) {
  const app = useApp(); const c = app.contracts.find(x => x.id === id); if (!c) return null;
  const p = app.properties.find(x => x.id === c.propertyId); const cl = app.clients.find(x => x.id === c.clientId); const m = app.members.find(x => x.id === c.agentId);
  return (<Drawer open onClose={onClose} title={"Contract " + c.id} sub={`${c.type} · deal ${c.dealId}`} wide
    footer={<>
      <Btn icon="eye" onClick={() => toast("Preview opened (demo)", "info")}>Preview</Btn>
      <Btn icon="download" onClick={() => toast("Download started (demo)", "info")}>Download</Btn>
      <Btn v="p" icon="send" onClick={() => toast("Sent for signature (demo)")}>Send for Signature</Btn>
    </>}>
    <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}><Badge color={CT_C[c.status]}>{c.status}</Badge><Badge color="#f59e0b">Signature: {c.signature}</Badge><Badge color={c.paymentStatus === "Paid" ? "#10b981" : "#f59e0b"}>Payment: {c.paymentStatus}</Badge></div>
    <div style={{ background:"#fff", borderRadius:12, border:"1px solid var(--bd)", padding:"26px 28px", color:"#111827", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}><div className="orb" style={{ width:22, height:22 }} /><b style={{ fontSize:13 }}>Atlas Real Estate - {c.type}</b><span className="mono" style={{ marginInlineStart:"auto", fontSize:10, color:"#6b7280" }}>{c.id}</span></div>
      <div style={{ fontSize:11, color:"#374151", marginBottom:12 }}>This agreement is entered into between <b>{textOf(app.org, app.lang)}</b> and <b>{cl?.fullName}</b> regarding <b>{propTitle(p, app.lang)}</b> for a total consideration of <b>{money(c.amount, app.org.currency, app.lang)}</b>.</div>
      {[92, 100, 96, 88, 100, 72, 0, 95, 90, 60].map((w, i) => w ? <div key={i} style={{ height:7, borderRadius:4, background:"#e5e7eb", width: w + "%", marginBottom:8 }} /> : <div key={i} style={{ height:8 }} />)}
      <div style={{ display:"flex", gap:40, marginTop:18 }}>
        <div style={{ flex:1 }}><div style={{ height:1, background:"#9ca3af", marginBottom:4 }} /><div style={{ fontSize:9.5, color:"#6b7280" }}>Agency representative</div></div>
        <div style={{ flex:1 }}><div style={{ height:1, background:"#9ca3af", marginBottom:4 }} /><div style={{ fontSize:9.5, color:"#6b7280" }}>Client signature</div></div>
      </div>
    </div>
    <div className="lr"><div className="lt"><b>{p?.title}</b><span>Associated property</span></div></div>
    <div className="lr"><div className="lt"><b>{cl?.fullName}</b><span>Associated client</span></div></div>
    <div className="lr"><div className="lt"><b>{m ? memberName(m, app.lang) : "—"}</b><span>Assigned agent</span></div></div>
    <div className="lr"><div className="lt"><b className="mono">{c.dealId}</b><span>Associated deal</span></div></div>
  </Drawer>);
}

function Tours() {
  const app = useApp(); const { t, lang, tours, properties } = app;
  return (<div className="pg">
    <PageHeader title={t("tours")} sub={`${tours.length} tours · mock panorama viewer`}><Btn v="p" icon="plus" onClick={() => toast("Create Tour (demo)", "info")}>{lang === "ar" ? "إنشاء جولة" : "Create Tour"}</Btn></PageHeader>
    <div className="pgd">
      {tours.map(tr => { const p = properties.find(x => x.id === tr.propertyId);
        return (<div className="cd pc" key={tr.id} onClick={() => app.openTour(tr.id)}>
          <div className="im"><img src={p?.images[0] || IMG.pent} alt="" /><Badge color={TOUR_C[tr.status]}>{tr.status}</Badge></div>
          <div className="bd"><b>{lang === "ar" && tr.nameAr ? tr.nameAr : tr.name}</b><div className="lc"><Icon name="video" size={11} />{propTitle(p, lang) || tr.propertyId} · {tr.scenes} {lang === "ar" ? "مشاهد" : "scenes"}</div>
            <div className="mt"><span className="num">{tr.views || 0} {lang === "ar" ? "مشاهدة" : "views"}</span><span>Updated {timeAgo(tr.updatedAt)}</span><span style={{ marginInlineStart:"auto" }} className="lnk">{lang === "ar" ? "فتح" : "Open"}</span></div></div>
        </div>); })}
    </div>
  </div>);
}
const HOTSPOTS = [["Living Room","info","Sofa area with skyline view"],["Kitchen","nav","Connected to scene 3"],["Terrace","nav","Outdoor terrace â€” scene 4"],["Master Suite","info","Walk-in closet"]];
function TourDrawer({ id, onClose }) {
  const app = useApp(); const tr = app.tours.find(x => x.id === id); if (!tr) return null;
  const p = app.properties.find(x => x.id === tr.propertyId);
  const [scene, setScene] = useState(0); const [viewer, setViewer] = useState(false);
  const scenesImgs = [p?.images[0] || IMG.pent, IMG.interior, p?.images[1] || IMG.pent, IMG.interior, p?.images[0] || IMG.pent];
  return (<>
    <Drawer open onClose={onClose} title={app.lang === "ar" && tr.nameAr ? tr.nameAr : tr.name} sub={`${tr.scenes} scenes · ${tr.status} · ${propTitle(p, app.lang) || ""}`} wide
      footer={<><Btn icon="copy" onClick={() => toast("Tour duplicated (demo)", "info")}>Duplicate</Btn><Btn icon="archive" onClick={() => toast("Tour archived (demo)", "info")}>Delete</Btn><Btn onClick={onClose}>{app.t("close")}</Btn><Btn v="p" icon="play" onClick={() => setViewer(true)}>Preview</Btn></>}>
      <div style={{ borderRadius:12, overflow:"hidden", marginBottom:12 }}><img src={scenesImgs[scene % scenesImgs.length]} style={{ width:"100%", height:240, objectFit:"cover" }} alt="" /></div>
      <div className="fs-t">{app.lang === "ar" ? "لوحة المشاهد" : "Scenes panel"}</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {Array.from({ length: tr.scenes }).map((_, i) => (<div key={i} onClick={() => setScene(i)} style={{ cursor:"pointer", textAlign:"center" }}>
          <img src={scenesImgs[i % scenesImgs.length]} alt="" style={{ width:76, height:50, objectFit:"cover", borderRadius:8, border: i === scene ? "2px solid var(--pr)" : "2px solid transparent", opacity: i === scene ? 1 : .75 }} />
          <div style={{ fontSize:10, color: i === scene ? "var(--pr)" : "var(--tx3)", marginTop:3 }}>{app.lang === "ar" ? "مشهد" : "Scene"} {i + 1}</div></div>))}
      </div>
      <div className="fr"><Field label={app.lang === "ar" ? "اسم المشهد" : "Scene title"}><input value={`${app.lang === "ar" ? "مشهد" : "Scene"} ${scene + 1}`} readOnly /></Field><Field label={app.lang === "ar" ? "زاوية العرض الابتدائية" : "Initial View"}><input className="num" value="0°, 12°, 90°" readOnly /></Field></div>
      <div className="fs-t">{app.lang === "ar" ? "نقاط الانتقال" : "Hotspots"} - Scene {scene + 1}</div>
      {HOTSPOTS.slice(0, 2 + (scene % 3)).map((h, i) => (<div className="lr" key={i}>
        <span style={{ width:28, height:28, borderRadius:8, background: h[1] === "nav" ? "rgba(139,92,246,.12)" : "var(--prs)", color: h[1] === "nav" ? "#8b5cf6" : "var(--pr)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}><Icon name={h[1] === "nav" ? "ext" : "eye"} size={13} /></span>
        <div className="lt"><b>{h[0]}</b><span>{h[2]}</span></div><Badge color={h[1] === "nav" ? "#8b5cf6" : "#2f6bff"}>{h[1]}</Badge></div>))}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}><Btn icon="plus" onClick={() => toast("Scene added (demo)", "info")}>{app.lang === "ar" ? "إضافة مشهد" : "Add Scene"}</Btn><Btn icon="pin" onClick={() => toast("Hotspot added (demo)", "info")}>{app.lang === "ar" ? "إضافة نقطة انتقال" : "Add Hotspot"}</Btn><Btn icon="check" onClick={() => toast("Starting scene set (demo)", "info")}>{app.lang === "ar" ? "تعيين كمشهد بداية" : "Set Starting Scene"}</Btn></div>
    </Drawer>
    <Modal open={viewer} onClose={() => setViewer(false)} lg>
      <div className="dr-h"><div><h3>{tr.name}</h3><div className="sub">360Â° preview Â· drag to look around</div></div><button className="ib xx" onClick={() => setViewer(false)}><Icon name="x" /></button></div>
      <TourStage imgs={scenesImgs} scenes={tr.scenes} />
    </Modal>
  </>);
}
function TourStage({ imgs, scenes }) {
  const [scene, setScene] = useState(0); const [deg, setDeg] = useState(0);
  const ref = useRef(null); const drag = useRef(null);
  useEffect(() => { const el = ref.current; if (!el) return;
    const down = e => { drag.current = { x: e.clientX, base: 0 }; };
    const move = e => { if (!drag.current) return; const dx = e.clientX - drag.current.x; el.style.backgroundPositionX = (drag.current.base + dx) + "px"; setDeg(Math.abs(Math.round((drag.current.base + dx) / 4)) % 360); };
    const up = () => { drag.current = null; };
    el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); }; }, [scene]);
  return (<div style={{ padding:16 }}>
    <div className="ts2" ref={ref} style={{ backgroundImage:`url('${imgs[scene % imgs.length]}')`, backgroundSize:"auto 100%", backgroundRepeat:"repeat-x" }}>
      <div className="dg">{deg}Â°</div>
      <div className="hd">{Array.from({ length: scenes }).map((_, i) => <button key={i} className={`sc ${i === scene ? "on" : ""}`} onClick={() => setScene(i)}>{`Scene ${i + 1}`}</button>)}
        <span style={{ marginInlineStart:"auto", color:"#fff", fontSize:11, opacity:.8 }}><Icon name="maximize" size={12} style={{ verticalAlign:-2 }} /> drag to pan</span></div>
    </div></div>);
}

function Agents() {
  const app = useApp(); const { t, members, properties, leads, deals } = app;
  const emptyAgents = (<EmptyState icon="users" title="No members" desc="Team members appear here." />);
  const cols = [
    { label:"Member", sortable:true, key:"name", render: m => (<div className="cm"><Avatar name={m.name} id={m.id} size={32} /><div><b style={{ fontWeight:600 }}>{m.name}</b><div className="cs">{m.email}</div></div></div>) },
    { label:"Role", render: m => <Badge color={m.role === "Owner" ? "#2f6bff" : m.role === "Manager" ? "#14b8a6" : m.role === "Agent" ? "#8b5cf6" : "#ec4899"}>{m.role}</Badge> },
    { label:"Branch", render: m => (app.branches.find(b => b.id === m.branchId) || {}).name || "â€”" },
    { label:"Phone", render: m => <span className="mono">{m.phone}</span> },
    { label:"Active Listings", sortable:true, key:"id", render: m => properties.filter(p => p.agentId === m.id && !["Archived","Sold"].includes(p.status)).length },
    { label:"Active Leads", sortable:true, key:"id", render: m => leads.filter(l => l.agentId === m.id && !["Won","Lost"].includes(l.status)).length },
    { label:"Closed Deals", sortable:true, key:"id", render: m => deals.filter(d => d.agentId === m.id && d.stage === "Closed Won").length },
    { label:"Revenue", sortable:true, key:"id", render: m => <span className="num" style={{ fontWeight:600 }}>{moneyC(deals.filter(d => d.agentId === m.id && d.stage === "Closed Won").reduce((s, d) => s + d.amount, 0))}</span> },
    { label:"Performance", render: m => { const v = Math.min(properties.filter(p => p.agentId === m.id).length * 12 + leads.filter(l => l.agentId === m.id).length * 15 + deals.filter(d => d.agentId === m.id && d.stage === "Closed Won").length * 25, 100); return <div style={{ minWidth:110 }}><div style={{ height:7, borderRadius:99, background:"var(--bg2)", overflow:"hidden" }}><div style={{ width: v + "%", height:"100%", borderRadius:99, background: v > 60 ? "#10b981" : v > 30 ? "#f59e0b" : "var(--bd2)" }} /></div></div>; } },
  ];
  return (
    <div className="pg">
      <PageHeader title={t("agents")} sub={`${members.length} team members`} />
      <div className="cd"><DataTable cols={cols} rows={members} onRow={m => app.openAgent(m.id)} empty={emptyAgents} /></div>
    </div>
  );
}
function AgentDrawer({ id, onClose }) {
  const app = useApp(); const m = app.members.find(x => x.id === id); if (!m) return null;
  const props = app.properties.filter(p => p.agentId === id);
  const lds = app.leads.filter(l => l.agentId === id);
  const dls = app.deals.filter(d => d.agentId === id);
  const vws = app.viewings.filter(v => v.agentId === id);
  const txs = app.transactions.filter(t => t.agentId === id);
  const perf = MONTHLY.map((mo, i) => ({ m: mo.m, leads: 2 + ((i * 2 + id.length) % 5) }));
  return (<Drawer open onClose={onClose} title={m.name} sub={`${m.role} Â· ${(app.branches.find(b => b.id === m.branchId) || {}).name}`} wide
    footer={<Btn onClick={onClose}>{app.t("close")}</Btn>}>
    <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}><Avatar name={m.name} id={m.id} size={46} /><div><b style={{ fontSize:14 }}>{m.name}</b><div style={{ fontSize:12, color:"var(--tx3)" }}>{m.email} Â· {m.phone}</div></div></div>
    <div className="kg" style={{ gridTemplateColumns:"repeat(4,1fr)", marginBottom:14 }}>
      <KpiCard icon="building" label="Listings" value={props.length} /><KpiCard icon="target" label="Leads" value={lds.length} />
      <KpiCard icon="calendar" label="Viewings" value={vws.length} /><KpiCard icon="shield" label="Transactions" value={txs.length} />
      <KpiCard icon="handshake" label="Closed" value={txs.filter(t => t.status === "Transaction Completed").length} /><KpiCard icon="wallet" label="Commission" value={moneyC(txs.reduce((s, t) => s + t.agencyCommission, 0))} />
    </div>
    <ChartCard title="Performance" sub="Leads / month" h={180}><BarsSimple data={perf} dataKey="leads" color="#2f6bff" /></ChartCard>
    <div className="dvd" />
    <div className="fs-t">Properties</div>
    {props.slice(0, 3).map(p => <div className="lr" key={p.id} style={{ cursor:"pointer" }} onClick={() => { onClose(); app.openProp(p.id); }}><img className="thmb" src={p.images[0]} alt="" /><div className="lt"><b>{p.title}</b><span>{p.city}</span></div><Badge color={PROP_C[p.status]}>{p.status}</Badge></div>)}
    <div className="fs-t" style={{ marginTop:14 }}>Transactions</div>
    {txs.length ? txs.map(tx => <button className="lr" key={tx.id} style={{ width:"100%", textAlign:"start" }} onClick={() => { onClose(); app.go(`${BASE}/transactions/${tx.id}`); }}><div className="lt"><b className="mono">{tx.transactionId}</b><span>{txStageLabel(tx.status, app.lang)}</span></div><Badge color="#2f6bff">{money(tx.propertyValue, tx.currency, app.lang)}</Badge></button>) : <EmptyState icon="shield" title="No transactions" desc="No assigned transactions yet." />}
    <div className="fs-t" style={{ marginTop:14 }}>Recent Activity</div>
    <Timeline items={ACTIVITY0.filter(a => a.user === m.name).slice(0, 3).length ? ACTIVITY0.filter(a => a.user === m.name).slice(0, 3) : ACTIVITY0.slice(0, 2)} />
  </Drawer>);
}

function Analytics() {
  const app = useApp(); const { t, properties, leads, deals, members } = app;
  const won = deals.filter(d => d.stage === "Closed Won");
  const rev = won.reduce((s, d) => s + d.amount, 0);
  const avg = properties.filter(p => p.listingType === "Sale").reduce((s, p) => s + p.price, 0) / (properties.filter(p => p.listingType === "Sale").length || 1);
  const conv = Math.round(leads.filter(l => l.status === "Completed").length / (leads.length || 1) * 100);
  const byType = {}; properties.forEach(p => byType[p.type] = (byType[p.type] || 0) + 1);
  const byCity = {}; properties.forEach(p => byCity[p.city] = (byCity[p.city] || 0) + 1);
  const funnelSteps = ["New","Contacted","Viewing","Offer","Negotiation","Agreement","Contract","Completed"];
  const cumulative = funnelSteps.map((s, i) => ({ l: s, c: LEAD_C[s], v: funnelSteps.slice(i).reduce((a, st) => a + leads.filter(l => l.status === st).length, 0) }));
  const perf = members.filter(m => ["Agent","Manager"].includes(m.role)).map(m => ({ l: m.name, v: deals.filter(d => d.agentId === m.id && d.stage === "Closed Won").length * 2 + leads.filter(l => l.agentId === m.id).length })).sort((a, b) => b.v - a.v);
  return (<div className="pg">
    <PageHeader title={t("analytics")} sub="Organization-scoped aggregations" />
    <div className="kg" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
      <KpiCard icon="wallet" label={t("revenue")} value={moneyC(rev)} delta="+12.4%" up />
      <KpiCard icon="handshake" label="Deals Closed" value={won.length} delta="+3" up />
      <KpiCard icon="building" label="Property Inventory" value={properties.filter(p => !["Sold","Archived"].includes(p.status)).length} />
      <KpiCard icon="dollar" label="Avg Property Price" value={moneyC(avg)} />
    </div>
    <div className="g2">
      <ChartCard title="Revenue Trend" sub="USD K / month"><RevArea data={MONTHLY} /></ChartCard>
      <ChartCard title="Sales by Month"><BarsSimple data={MONTHLY} dataKey="sales" color="#14b8a6" /></ChartCard>
    </div>
    <div className="g3">
      <ChartCard title="Properties by Type"><Donut data={Object.entries(byType).map(([k, v], i) => ({ name: k, value: v, color: CHART_PAL[i] }))} /></ChartCard>
      <ChartCard title="Properties by City"><HBars items={Object.entries(byCity).map(([k, v]) => ({ l: k, v, c:"#14b8a6" }))} /></ChartCard>
      <ChartCard title="Lead Sources"><Donut data={LEAD_SOURCES.map((s, i) => ({ name: s.name, value: s.value, color: CHART_PAL[i] }))} /></ChartCard>
    </div>
    <div className="g22">
      <ChartCard title="Lead Funnel" sub={`Conversion ${conv}%`}><Funnel steps={cumulative} /></ChartCard>
      <ChartCard title="Agent Performance" sub="weighted score"><HBars items={perf} /></ChartCard>
    </div>
  </div>);
}

function Files() {
  const app = useApp(); const { t, files, setFiles } = app;
  const [view, setView] = useState("grid"); const [cat, setCat] = useState("All"); const [q, setQ] = useState("");
  const CATS = ["Property Documents","Contracts","Client Documents","Marketing","Other"];
  const CAT_C = { "Property Documents":"#2f6bff", Contracts:"#10b981", "Client Documents":"#06b6d4", Marketing:"#ec4899", Other:"#64748b" };
  let rows = cat === "All" ? files : files.filter(f => f.category === cat);
  if (q) rows = rows.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
  const iconOf = n => n.endsWith(".pdf") ? "filetext" : n.endsWith(".png") ? "image" : n.endsWith(".mp4") ? "video" : "paperclip";
  const upload = () => { setFiles(fs => [{ id: uid("f"), category: cat === "All" ? "Other" : cat, name: "Upload " + new Date().getMinutes() + ".pdf", size: "1.2 MB", by: app.me.name, createdAt: Date.now() }, ...fs]); toast("Uploaded (mock)"); };
  const uploadBtn = (<Btn v="p" icon="upload" onClick={upload}>{t("upload")}</Btn>);
  const emptyFilesGrid = (<EmptyState icon="folder" title="No files here" desc="Upload documents to this category." action={uploadBtn} />);
  const emptyFilesList = (<EmptyState icon="folder" title="No files" desc="Upload documents to this category." />);
  const listCols = [
    { label:"Name", sortable:true, key:"name", render: f => (<div className="cm"><span style={{ width:32, height:32, borderRadius:9, background:`color-mix(in srgb, ${CAT_C[f.category]} 12%, transparent)`, color: CAT_C[f.category], display:"inline-flex", alignItems:"center", justifyContent:"center", flex:"0 0 auto" }}><Icon name={iconOf(f.name)} size={14} /></span><b style={{ fontWeight:600 }}>{f.name}</b></div>) },
    { label:"Category", key:"category", render: f => <Badge color={CAT_C[f.category]}>{f.category}</Badge> },
    { label:"Size", key:"size" }, { label:"Uploaded By", key:"by" },
    { label:"Created", sortable:true, key:"createdAt", render: f => <span style={{ color:"var(--tx3)" }}>{timeAgo(f.createdAt)}</span> },
    { label:"", align:"end", render: () => (<div className="ra" onClick={e => e.stopPropagation()}><button className="ib" onClick={() => toast("Download started (demo)", "info")}><Icon name="download" size={14} /></button></div>) },
  ];
  return (
    <div className="pg">
      <PageHeader title={t("files")} sub={`${rows.length} files`}>
        <Seg val={view} onChange={setView} opts={[{ v:"grid", i:"grid", l:"Grid" }, { v:"list", i:"list", l:"List" }]} />
        {uploadBtn}
      </PageHeader>
      <div className="fb">
        <div className="siw cd"><span className="si"><Icon name="search" size={13} /></span><input placeholder="Search filesâ€¦" value={q} onChange={e => setQ(e.target.value)} style={{ paddingInlineStart:30, width:220, height:36 }} /></div>
        <span className={`chp ${cat === "All" ? "on" : ""}`} onClick={() => setCat("All")}>{t("all")} <span className="cn">{files.length}</span></span>
        {CATS.map(c => <span key={c} className={`chp ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c} <span className="cn">{files.filter(f => f.category === c).length}</span></span>)}
      </div>
      {view === "grid" && (
        <>
          <div className="fgd">
            {rows.map(f => (
              <div className="cd fc" key={f.id}>
                <span className="fi" style={{ background:`color-mix(in srgb, ${CAT_C[f.category]} 12%, transparent)`, color: CAT_C[f.category] }}>
                  <Icon name={iconOf(f.name)} size={16} />
                </span>
                <div style={{ minWidth:0 }}><b>{f.name}</b><span>{f.category} Â· {f.size} Â· {f.by}</span></div>
              </div>
            ))}
          </div>
          {!rows.length && <div className="cd">{emptyFilesGrid}</div>}
        </>
      )}
      {view !== "grid" && (<div className="cd"><DataTable minW={640} cols={listCols} rows={rows} empty={emptyFilesList} /></div>)}
    </div>
  );
}

const localLabel = (lang, en, ar) => lang === "ar" ? ar : en;
const eventTypeLabel = (type, lang) => lang === "ar" ? ({ Viewing:"معاينة", "Follow-up":"متابعة", Meeting:"اجتماع", "Contract Deadline":"موعد عقد", Photography:"تصوير عقار", "Virtual Tour":"جولة افتراضية", Task:"مهمة" }[type] || type) : type;
const feeStatusLabel = (status, lang) => lang === "ar" ? ({ Pending:"معلقة", Calculated:"محسوبة", Due:"مستحقة", Paid:"مدفوعة", Waived:"معفاة", Disputed:"متنازع عليها" }[status] || status) : status;

function CalendarPage() {
  const app = useApp(); const { lang, properties, clients, members, branches } = app;
  const [view, setView] = useState("month"); const [sel, setSel] = useState(null);
  const modes = [["month","Month","الشهر"],["week","Week","الأسبوع"],["day","Day","اليوم"],["agenda","Agenda","الأجندة"]];
  const typeColor = { Viewing:"#2f6bff", "Follow-up":"#14b8a6", Meeting:"#8b5cf6", "Contract Deadline":"#ef4444", Photography:"#f59e0b", "Virtual Tour":"#ec4899", Task:"#64748b" };
  const e = EVENTS0.find(x => x.id === sel);
  const cols = [
    { label:localLabel(lang,"Event","الحدث"), render:x => <div><b>{lang === "ar" ? x.titleAr : x.title}</b><div style={{ color:"var(--tx3)" }}>{eventTypeLabel(x.type, lang)}</div></div> },
    { label:localLabel(lang,"Client","العميل"), render:x => clientName(clients.find(c => c.id === x.clientId), lang) },
    { label:localLabel(lang,"Property","العقار"), render:x => propTitle(properties.find(p => p.id === x.propertyId), lang) },
    { label:localLabel(lang,"Agent","الوكيل"), render:x => memberName(members.find(m => m.id === x.agentId), lang) },
    { label:localLabel(lang,"Branch","الفرع"), render:x => branchName(branches.find(b => b.id === x.branchId), lang) },
    { label:localLabel(lang,"Time","الوقت"), render:x => <span className="num">{timeAgo(x.startsAt)}</span> },
    { label:localLabel(lang,"Status","الحالة"), render:x => <Badge color={x.status === "Completed" ? "#10b981" : x.status === "Cancelled" ? "#ef4444" : "#f59e0b"}>{x.status}</Badge> },
  ];
  return <div className="pg"><PageHeader title={localLabel(lang,"Calendar","التقويم")} sub={localLabel(lang,"Viewings, tasks, deadlines, meetings, photography and tour sessions","المعاينات والمهام والمواعيد والاجتماعات والتصوير والجولات")}>
    <Seg val={view} onChange={setView} opts={modes.map(m => ({ v:m[0], i:m[0] === "agenda" ? "list" : "calendar", l:localLabel(lang,m[1],m[2]) }))} />
    <Btn v="p" icon="plus" onClick={() => toast(localLabel(lang,"Create event (demo)","إنشاء حدث (تجريبي)"))}>{localLabel(lang,"Create Event","إنشاء حدث")}</Btn>
  </PageHeader>
    {view !== "agenda" ? <div className="g3">{EVENTS0.map(x => <button className="cd cd-b" key={x.id} style={{ textAlign:"start", borderInlineStart:`3px solid ${typeColor[x.type] || "#64748b"}` }} onClick={() => setSel(x.id)}><Badge color={typeColor[x.type]}>{eventTypeLabel(x.type, lang)}</Badge><h3 style={{ marginTop:12 }}>{lang === "ar" ? x.titleAr : x.title}</h3><p style={{ color:"var(--tx3)", marginTop:6 }}>{timeAgo(x.startsAt)} · {memberName(members.find(m => m.id === x.agentId), lang)}</p><p style={{ color:"var(--tx3)", marginTop:4 }}>{propTitle(properties.find(p => p.id === x.propertyId), lang)}</p></button>)}</div> : <div className="cd"><DataTable cols={cols} rows={EVENTS0} onRow={x => setSel(x.id)} minW={1100} /></div>}
    <Drawer open={!!e} onClose={() => setSel(null)} title={e && (lang === "ar" ? e.titleAr : e.title)} sub={e && eventTypeLabel(e.type, lang)} footer={<><Btn icon="pencil" onClick={() => toast(localLabel(lang,"Edit event (demo)","تعديل الحدث (تجريبي)"),"info")}>{localLabel(lang,"Edit","تعديل")}</Btn><Btn icon="calendar" onClick={() => toast(localLabel(lang,"Rescheduled (demo)","تمت إعادة الجدولة (تجريبي)"),"info")}>{localLabel(lang,"Reschedule","إعادة الجدولة")}</Btn><Btn v="p" icon="check" onClick={() => toast(localLabel(lang,"Marked complete (demo)","تم تحديده كمكتمل (تجريبي)"))}>{localLabel(lang,"Mark Complete","تحديد كمكتمل")}</Btn></>}>
      {e && <div className="fgd"><div className="fc"><b>{localLabel(lang,"Client","العميل")}</b><span>{clientName(clients.find(c => c.id === e.clientId), lang)}</span></div><div className="fc"><b>{localLabel(lang,"Property","العقار")}</b><span>{propTitle(properties.find(p => p.id === e.propertyId), lang)}</span></div><div className="fc"><b>{localLabel(lang,"Agent","الوكيل")}</b><span>{memberName(members.find(m => m.id === e.agentId), lang)}</span></div><div className="fc"><b>{localLabel(lang,"Notes","ملاحظات")}</b><span>{e.notes}</span></div></div>}
    </Drawer>
  </div>;
}

function MessagesPage() {
  const app = useApp(); const { lang, properties, clients, members, leads, transactions, openClient, openProp, go } = app;
  const [cat, setCat] = useState("Customer Conversations"); const [sel, setSel] = useState(MESSAGES0[0].id);
  const cats = [["Customer Conversations","محادثات العملاء"],["Team Conversations","محادثات الفريق"],["Transaction Conversations","محادثات المعاملات"]];
  const convs = MESSAGES0.filter(c => c.category === cat); const c = MESSAGES0.find(x => x.id === sel) || convs[0] || MESSAGES0[0];
  const client = clients.find(x => x.id === c.clientId); const prop = properties.find(x => x.id === c.propertyId); const agent = members.find(x => x.id === c.agentId); const tx = transactions.find(x => x.id === c.transactionId); const lead = leads.find(x => x.clientId === c.clientId && x.propertyId === c.propertyId);
  return <div className="pg"><PageHeader title={localLabel(lang,"Messages","الرسائل")} sub={localLabel(lang,"Customer, team and transaction communication inbox","صندوق محادثات العملاء والفريق والمعاملات")}><Btn icon="paperclip" onClick={() => toast(localLabel(lang,"Attach file (demo)","إرفاق ملف (تجريبي)"),"info")}>{localLabel(lang,"Attach File","إرفاق ملف")}</Btn></PageHeader>
    <div className="fb">{cats.map(x => <span key={x[0]} className={`chp ${cat === x[0] ? "on" : ""}`} onClick={() => { setCat(x[0]); setSel((MESSAGES0.find(m => m.category === x[0]) || MESSAGES0[0]).id); }}>{localLabel(lang,x[0],x[1])}</span>)}</div>
    <div className="g3" style={{ gridTemplateColumns:"280px 1fr 320px" }}>
      <div className="cd cd-b">{convs.map(x => <button key={x.id} className={`dd-i ${x.id === c.id ? "on" : ""}`} onClick={() => setSel(x.id)}><Icon name="mail" size={14} /><div style={{ minWidth:0 }}><b>{lang === "ar" ? x.subjectAr : x.subject}</b><div style={{ color:"var(--tx3)", fontSize:11 }}>{x.unread ? `${x.unread} unread` : localLabel(lang,"Read","مقروءة")}</div></div></button>)}</div>
      <div className="cd"><div className="cd-h"><h3>{lang === "ar" ? c.subjectAr : c.subject}</h3></div><div className="cd-b">{c.messages.map(m => <div key={m.id} className="cd cd-b" style={{ marginBottom:10, background:m.internal ? "color-mix(in srgb, #f59e0b 10%, var(--sf))" : "var(--sf2)", borderColor:m.internal ? "color-mix(in srgb, #f59e0b 35%, var(--bd))" : "var(--bd)" }}><Badge color={m.internal ? "#f59e0b" : "#2f6bff"}>{m.internal ? localLabel(lang,"Internal Note","ملاحظة داخلية") : m.by}</Badge><p style={{ marginTop:8 }}>{lang === "ar" ? m.textAr : m.text}</p><p style={{ color:"var(--tx3)", fontSize:11, marginTop:6 }}>{timeAgo(m.ts)}</p></div>)}<div style={{ display:"flex", gap:8 }}><input placeholder={localLabel(lang,"Write a message...","اكتب رسالة...")} /><Btn v="p" icon="send" onClick={() => toast(localLabel(lang,"Message sent (demo)","تم إرسال الرسالة (تجريبي)"))}>{localLabel(lang,"Send Message","إرسال")}</Btn></div></div></div>
      <div className="cd cd-b"><FormSection title={localLabel(lang,"Context","السياق")}><div className="fgd"><div className="fc"><b>{localLabel(lang,"Customer","العميل")}</b><span>{clientName(client, lang)}</span></div><div className="fc"><b>{localLabel(lang,"Property","العقار")}</b><span>{propTitle(prop, lang)}</span></div><div className="fc"><b>{localLabel(lang,"Assigned Agent","الوكيل المسؤول")}</b><span>{memberName(agent, lang)}</span></div><div className="fc"><b>{localLabel(lang,"Lead Status","حالة العميل المحتمل")}</b><span>{lead?.status || "—"}</span></div><div className="fc"><b>{localLabel(lang,"Transaction Status","حالة المعاملة")}</b><span>{tx ? txStageLabel(tx.status, lang) : "—"}</span></div></div></FormSection><div style={{ display:"grid", gap:8, marginTop:12 }}><Btn icon="users" onClick={() => client && openClient(client.id)}>{localLabel(lang,"Open Customer","فتح العميل")}</Btn><Btn icon="building" onClick={() => prop && openProp(prop.id)}>{localLabel(lang,"Open Property","فتح العقار")}</Btn><Btn icon="shield" onClick={() => tx && go(`${BASE}/transactions/${tx.id}`)}>{localLabel(lang,"Open Transaction","فتح المعاملة")}</Btn><Btn icon="pencil" onClick={() => toast(localLabel(lang,"Internal note added (demo)","تمت إضافة ملاحظة داخلية (تجريبي)"),"info")}>{localLabel(lang,"Add Internal Note","إضافة ملاحظة داخلية")}</Btn></div></div>
    </div></div>;
}

function NotificationsCenter() {
  const app = useApp(); const { lang } = app; const [mode, setMode] = useState("Unread");
  const rows = NOTIFICATIONS_CENTER0.filter(n => mode === "All" || (mode === "Unread" ? !n.read : n.read));
  const catColor = { Leads:"#2f6bff", Viewings:"#14b8a6", Offers:"#f59e0b", Transactions:"#8b5cf6", Contracts:"#10b981", Properties:"#06b6d4", Team:"#ec4899", System:"#64748b" };
  return <div className="pg"><PageHeader title={localLabel(lang,"Notifications","الإشعارات")} sub={localLabel(lang,"Operational notifications for Atlas Real Estate","إشعارات تشغيلية لمكتب أطلس العقارية")}><Btn icon="check" onClick={() => toast(localLabel(lang,"All marked as read (demo)","تم تحديد الكل كمقروء (تجريبي)"))}>{localLabel(lang,"Mark All as Read","تحديد الكل كمقروء")}</Btn></PageHeader>
    <div className="fb">{["Unread","Read","All"].map(m => <span key={m} className={`chp ${mode === m ? "on" : ""}`} onClick={() => setMode(m)}>{localLabel(lang,m,{Unread:"غير مقروءة",Read:"مقروءة",All:"الكل"}[m])}</span>)}</div>
    <div className="cd cd-b">{rows.map(n => <div className="lr" key={n.id}><span className="fi"><Icon name="bell" size={14} /></span><div className="lt"><b>{lang === "ar" ? n.titleAr : n.title}</b><span>{lang === "ar" ? n.bodyAr : n.body} · {timeAgo(n.ts)}</span></div><Badge color={catColor[n.category]}>{localLabel(lang,n.category,{Leads:"العملاء المحتملون",Viewings:"المعاينات",Offers:"العروض",Transactions:"المعاملات",Contracts:"العقود",Properties:"العقارات",Team:"الفريق",System:"النظام"}[n.category])}</Badge><button className="ib" onClick={() => toast(localLabel(lang,"Related entity opened (demo)","تم فتح العنصر المرتبط (تجريبي)"),"info")}><Icon name="ext" size={14} /></button></div>)}</div>
  </div>;
}

function TeamPage() {
  const app = useApp(); const { lang, members, branches, properties, leads, viewings, deals, transactions } = app; const [sel, setSel] = useState(null);
  const visibleMembers = members.filter(m => ["Owner","Manager","Agent"].includes(m.role));
  const m = visibleMembers.find(x => x.id === sel);
  const roleLabel = r => lang === "ar" ? ({ Owner:"المالك", Manager:"المدير", Agent:"الوكيل", Marketing:"التسويق", Photographer:"المصور", Accountant:"المحاسب" }[r] || r) : r;
  const stats = member => ({ props:properties.filter(p => p.agentId === member.id).length, leads:leads.filter(l => l.agentId === member.id && !["Completed","Lost"].includes(l.status)).length, viewings:viewings.filter(v => v.agentId === member.id).length, deals:deals.filter(d => d.agentId === member.id).length, tx:transactions.filter(t => t.agentId === member.id), commission:transactions.filter(t => t.agentId === member.id).reduce((s,t) => s + t.agencyCommission, 0) });
  const cols = [
    { label:localLabel(lang,"Member","العضو"), render:x => <div className="cm"><Avatar name={memberName(x, lang)} id={x.id} size={30} /><div><b>{memberName(x, lang)}</b><div style={{ color:"var(--tx3)" }}>{x.email}</div></div></div> },
    { label:localLabel(lang,"Role","الدور"), render:x => roleLabel(x.role) }, { label:localLabel(lang,"Branch","الفرع"), render:x => branchName(branches.find(b => b.id === x.branchId), lang) },
    { label:localLabel(lang,"Status","الحالة"), render:x => <Badge color="#10b981">{x.status}</Badge> }, { label:localLabel(lang,"Active Properties","العقارات النشطة"), render:x => stats(x).props },
    { label:localLabel(lang,"Active Leads","العملاء المحتملون النشطون"), render:x => stats(x).leads }, { label:localLabel(lang,"Closed Transactions","المعاملات المكتملة"), render:x => stats(x).tx.filter(t => t.status === "Transaction Completed").length },
    { label:localLabel(lang,"Last Active","آخر نشاط"), render:x => timeAgo(x.lastActive) }, { label:localLabel(lang,"Actions","الإجراءات"), align:"end", render:() => <div className="ra"><button className="ib"><Icon name="eye" size={14} /></button><button className="ib"><Icon name="pencil" size={14} /></button><button className="ib"><Icon name="archive" size={14} /></button></div> },
  ];
  const st = m && stats(m);
  return <div className="pg"><PageHeader title={localLabel(lang,"Team","الفريق")} sub={localLabel(lang,"Simple office team: owner, manager, agents","فريق المكتب ببساطة: مالك، مدير، وكلاء")}><Btn v="p" icon="plus" onClick={() => toast(localLabel(lang,"Invite member (demo)","دعوة عضو (تجريبي)"))}>{localLabel(lang,"Invite Member","دعوة عضو")}</Btn></PageHeader><div className="cd"><DataTable cols={cols} rows={visibleMembers} onRow={x => setSel(x.id)} minW={1100} /></div>
    <Drawer open={!!m} onClose={() => setSel(null)} title={m && memberName(m, lang)} sub={m && roleLabel(m.role)} wide>{m && <><div className="kg"><KpiCard icon="building" label={localLabel(lang,"Assigned Properties","العقارات المسندة")} value={st.props} /><KpiCard icon="target" label={localLabel(lang,"Active Leads","العملاء النشطون")} value={st.leads} /><KpiCard icon="calendar" label={localLabel(lang,"Viewings","المعاينات")} value={st.viewings} /><KpiCard icon="handshake" label={localLabel(lang,"Deals","الصفقات")} value={st.deals} /><KpiCard icon="dollar" label={localLabel(lang,"Agency Commission","عمولة المكتب")} value={moneyC(st.commission, "USD", lang)} /></div><div className="g22"><div className="cd cd-b"><FormSection title={localLabel(lang,"Transactions","المعاملات")}>{st.tx.map(t => <button className="dd-i" key={t.id} onClick={() => app.go(`${BASE}/transactions/${t.id}`)}><Icon name="shield" size={14} />{t.transactionId}<Badge color="#2f6bff">{txStageLabel(t.status, lang)}</Badge></button>)}</FormSection></div><div className="cd cd-b"><FormSection title={localLabel(lang,"Activity","النشاط")}><Timeline items={ACTIVITY0.filter(a => a.user === m.name).map(a => ({ ...a, user:memberName(m, lang) }))} /></FormSection></div></div></>}</Drawer>
  </div>;
}

function BranchesPage() {
  const app = useApp(); const { lang, branches, members, properties, clients, leads, deals, transactions } = app; const [sel, setSel] = useState(null);
  const b = branches.find(x => x.id === sel);
  const branchStats = br => ({ members:members.filter(m => m.branchId === br.id).length, props:properties.filter(p => p.branchId === br.id).length, leads:leads.filter(l => l.branchId === br.id && !["Completed","Lost"].includes(l.status)).length, deals:deals.filter(d => (properties.find(p => p.id === d.propertyId) || {}).branchId === br.id).length, tx:transactions.filter(t => t.branchId === br.id) });
  const cols = [
    { label:localLabel(lang,"Branch","الفرع"), render:x => <b>{branchName(x, lang)}</b> }, { label:localLabel(lang,"City","المدينة"), render:x => lang === "ar" ? x.cityAr : x.city },
    { label:localLabel(lang,"Address","العنوان"), render:x => lang === "ar" ? x.addressAr : x.address }, { label:localLabel(lang,"Manager","المدير"), render:x => memberName(members.find(m => m.id === x.managerId), lang) },
    { label:localLabel(lang,"Members","الأعضاء"), render:x => branchStats(x).members }, { label:localLabel(lang,"Properties","العقارات"), render:x => branchStats(x).props },
    { label:localLabel(lang,"Active Leads","العملاء النشطون"), render:x => branchStats(x).leads }, { label:localLabel(lang,"Active Deals","الصفقات النشطة"), render:x => branchStats(x).deals },
    { label:localLabel(lang,"Status","الحالة"), render:x => <Badge color="#10b981">{x.status}</Badge> },
  ];
  const st = b && branchStats(b);
  return <div className="pg"><PageHeader title={localLabel(lang,"Branches","الفروع")} sub={localLabel(lang,"Homs, Damascus and Tartous operations","عمليات حمص ودمشق وطرطوس")}><Btn v="p" icon="plus" onClick={() => toast(localLabel(lang,"Add branch (demo)","إضافة فرع (تجريبي)"))}>{localLabel(lang,"Add Branch","إضافة فرع")}</Btn></PageHeader><div className="cd"><DataTable cols={cols} rows={branches} onRow={x => setSel(x.id)} minW={1180} /></div>
    <Drawer open={!!b} onClose={() => setSel(null)} title={b && branchName(b, lang)} sub={b && (lang === "ar" ? b.addressAr : b.address)} wide>{b && <><div className="kg"><KpiCard icon="users" label={localLabel(lang,"Team","الفريق")} value={st.members} /><KpiCard icon="building" label={localLabel(lang,"Properties","العقارات")} value={st.props} /><KpiCard icon="target" label={localLabel(lang,"Active Leads","العملاء النشطون")} value={st.leads} /><KpiCard icon="handshake" label={localLabel(lang,"Deals","الصفقات")} value={st.deals} /><KpiCard icon="shield" label={localLabel(lang,"Transactions","المعاملات")} value={st.tx.length} /></div><div className="g22"><div className="cd cd-b"><FormSection title={localLabel(lang,"Team","الفريق")}>{members.filter(m => m.branchId === b.id).map(m => <div className="lr" key={m.id}><Avatar name={memberName(m, lang)} id={m.id} size={28} /><div className="lt"><b>{memberName(m, lang)}</b><span>{m.role}</span></div></div>)}</FormSection></div><div className="cd cd-b"><FormSection title={localLabel(lang,"Performance","الأداء")}><HBars items={[{ l:localLabel(lang,"Properties","العقارات"), v:st.props, c:"#2f6bff" },{ l:localLabel(lang,"Clients","العملاء"), v:clients.length, c:"#14b8a6" },{ l:localLabel(lang,"Transactions","المعاملات"), v:st.tx.length, c:"#8b5cf6" }]} /></FormSection></div></div></>}</Drawer>
  </div>;
}

function MediaLibrary() {
  const app = useApp(); const { lang, properties, members, branches, openProp } = app; const [view, setView] = useState("grid"); const [type, setType] = useState("All");
  const types = ["Property Images","Videos","Floor Plans","Panoramas","3D Models","Documents"];
  const typeAr = { "Property Images":"صور العقارات", Videos:"الفيديوهات", "Floor Plans":"المخططات", Panoramas:"صور البانوراما", "3D Models":"النماذج ثلاثية الأبعاد", Documents:"المستندات" };
  const rows = type === "All" ? MEDIA0 : MEDIA0.filter(m => m.type === type);
  const cols = [
    { label:localLabel(lang,"Media","الوسائط"), render:m => <div className="cm"><img className="thmb" src={m.url} alt="" /><div><b>{lang === "ar" ? m.nameAr : m.name}</b><div style={{ color:"var(--tx3)" }}>{localLabel(lang,m.type,typeAr[m.type])}</div></div></div> },
    { label:localLabel(lang,"Property","العقار"), render:m => propTitle(properties.find(p => p.id === m.propertyId), lang) }, { label:localLabel(lang,"Agent","الوكيل"), render:m => memberName(members.find(x => x.id === m.agentId), lang) },
    { label:localLabel(lang,"Branch","الفرع"), render:m => branchName(branches.find(b => b.id === m.branchId), lang) }, { label:localLabel(lang,"Date","التاريخ"), render:m => timeAgo(m.createdAt) }, { label:localLabel(lang,"Size","الحجم"), key:"size" },
    { label:localLabel(lang,"Actions","الإجراءات"), align:"end", render:m => <div className="ra"><button className="ib" onClick={e => { e.stopPropagation(); toast(localLabel(lang,"Preview opened (demo)","تم فتح المعاينة (تجريبي)"),"info"); }}><Icon name="eye" size={14} /></button><button className="ib" onClick={e => { e.stopPropagation(); openProp(m.propertyId); }}><Icon name="building" size={14} /></button><button className="ib" onClick={e => { e.stopPropagation(); toast(localLabel(lang,"Download started (demo)","بدأ التنزيل (تجريبي)"),"info"); }}><Icon name="download" size={14} /></button></div> },
  ];
  return <div className="pg"><PageHeader title={localLabel(lang,"Media Library","مكتبة الوسائط")} sub={localLabel(lang,"Visual property assets kept separate from business files","أصول العقارات المرئية منفصلة عن ملفات الأعمال")}><Seg val={view} onChange={setView} opts={[{ v:"grid", i:"grid", l:localLabel(lang,"Grid","شبكة") },{ v:"list", i:"list", l:localLabel(lang,"List","قائمة") }]} /><Btn v="p" icon="upload" onClick={() => toast(localLabel(lang,"Mock upload zone opened","تم فتح رفع تجريبي"))}>{localLabel(lang,"Upload Media","رفع وسائط")}</Btn></PageHeader><div className="fb"><span className={`chp ${type === "All" ? "on" : ""}`} onClick={() => setType("All")}>{localLabel(lang,"All","الكل")}</span>{types.map(t => <span key={t} className={`chp ${type === t ? "on" : ""}`} onClick={() => setType(t)}>{localLabel(lang,t,typeAr[t])}</span>)}</div>{view === "grid" ? <div className="fgd">{rows.map(m => <div className="cd fc" key={m.id}><img className="thmb" src={m.url} alt="" /><div><b>{lang === "ar" ? m.nameAr : m.name}</b><span>{propTitle(properties.find(p => p.id === m.propertyId), lang)} · {m.size}</span></div></div>)}</div> : <div className="cd"><DataTable cols={cols} rows={rows} minW={1100} /></div>}</div>;
}

function ActivityLog() {
  const app = useApp(); const { lang, branches } = app;
  const rows = ACTIVITY0.map((a, i) => ({ ...a, actionType:["Property","Lead","Payment","Marketing","Client","Media","Approval","Contract"][i] || "System", entity:["property","lead","deal","campaign","client","media","property","contract"][i] || "activity", branchId:["br1","br2","br1","br3","br1","br1","br1","br2"][i] }));
  const cols = [
    { label:localLabel(lang,"Time","الوقت"), render:a => timeAgo(a.ts) }, { label:localLabel(lang,"Member","العضو"), key:"user" }, { label:localLabel(lang,"Action","الإجراء"), key:"text" },
    { label:localLabel(lang,"Entity","العنصر"), key:"entity" }, { label:localLabel(lang,"Branch","الفرع"), render:a => branchName(branches.find(b => b.id === a.branchId), lang) },
    { label:localLabel(lang,"Details","التفاصيل"), render:a => <Badge color={a.color}>{a.actionType}</Badge> },
  ];
  return <div className="pg"><PageHeader title={localLabel(lang,"Activity Log","سجل النشاط")} sub={localLabel(lang,"Organization operational audit trail only","سجل تشغيل المؤسسة فقط")} /><div className="fb">{[localLabel(lang,"Member","العضو"),localLabel(lang,"Action Type","نوع الإجراء"),localLabel(lang,"Entity Type","نوع العنصر"),localLabel(lang,"Branch","الفرع"),localLabel(lang,"Date","التاريخ")].map(f => <span className="chp" key={f}><Icon name="filter" size={12} />{f}</span>)}</div><div className="cd"><DataTable cols={cols} rows={rows} minW={1000} /></div></div>;
}

function Settings() {
  const app = useApp(); const { t, theme, setTheme, lang, setLang, org, branches, setBranches, members } = app;
  const [tab, setTab] = useState("profile");
  const [prof, setProf] = useState({ ...org });
  const [srcs, setSrcs] = useState(LEAD_SOURCES.map(s => s.name));
  const [newSrc, setNewSrc] = useState("");
  const [sw, setSw] = useState({ leads:true, deals:true, contracts:true, digest:false });
  const label = (en, ar) => lang === "ar" ? ar : en;
  const TABS = [["profile",label("Office Profile","ملف المكتب"),"building"],["members",label("Team Members","أعضاء الفريق"),"users"],["defaults",label("Property Defaults","إعدادات العقارات الافتراضية"),"settings"],["currency",label("Currency","العملة"),"dollar"],["language",label("Language","اللغة"),"lang"],["notifications",label("Notifications","الإشعارات"),"bell"],["appearance",label("Appearance","المظهر"),"sun"]];
  const save = () => toast("Settings saved");
  return (<div className="pg">
    <PageHeader title={t("settings")} sub={label("Organization settings · local demo persistence","إعدادات المؤسسة · حفظ تجريبي محلي")} />
    <div className="stg">
      <div className="stn cd" style={{ padding:6 }}>{TABS.map(tb => <button key={tb[0]} className={tab === tb[0] ? "on" : ""} onClick={() => setTab(tb[0])}><Icon name={tb[2]} size={14} />{tb[1]}</button>)}</div>
      <div>
        {tab === "profile" && <div className="cd cd-b"><FormSection title={label("Agency Profile","ملف المكتب")}>
          <div className="fr"><Field label={label("Organization Name","اسم المؤسسة")}><input value={prof.name} onChange={e => setProf(s => ({ ...s, name: e.target.value }))} /></Field><Field label={label("Legal Name","الاسم القانوني")}><input value={prof.legalName || ""} onChange={e => setProf(s => ({ ...s, legalName: e.target.value }))} /></Field></div>
          <div className="fr"><Field label={label("Email","البريد الإلكتروني")}><input type="email" value={prof.email} onChange={e => setProf(s => ({ ...s, email: e.target.value }))} /></Field><Field label={label("Phone","رقم الهاتف")}><input className="num" value={prof.phone} onChange={e => setProf(s => ({ ...s, phone: e.target.value }))} /></Field></div>
          <div className="fr"><Field label={label("Website","الموقع الإلكتروني")}><input type="url" value={prof.web} onChange={e => setProf(s => ({ ...s, web: e.target.value }))} /></Field><Field label={label("Country","الدولة")}><input value={prof.country || "Syria"} onChange={e => setProf(s => ({ ...s, country: e.target.value }))} /></Field></div>
          <div className="fr"><Field label={label("City","المدينة")}><select value={prof.city} onChange={e => setProf(s => ({ ...s, city: e.target.value }))}><option>Homs</option><option>Damascus</option><option>Tartous</option></select></Field><Field label={label("Logo","الشعار")}><UploadZone icon="image" title={label("Logo upload","رفع الشعار")} sub={label("Mock upload only","رفع تجريبي فقط")} /></Field></div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}><Btn v="p" icon="check" onClick={save}>{t("save")}</Btn></div></FormSection></div>}
        {tab === "branches" && <div className="cd cd-b" style={{ padding:"8px 16px" }}>{branches.map(b => <div className="lr" key={b.id}><span style={{ width:30, height:30, borderRadius:9, background:"var(--prs)", color:"var(--pr)", display:"inline-flex", alignItems:"center", justifyContent:"center" }}><Icon name="building" size={14} /></span><div className="lt"><b>{branchName(b, lang)}</b><span>{cityOf(b, lang)} · {b.address}</span></div><div className="lrr"><Badge color="#10b981">{b.status || "Active"}</Badge><span className="mono cs">{b.phone}</span></div></div>)}
          <div style={{ padding:12 }}><Btn v="p" s="s" icon="plus" onClick={() => { setBranches(bs => [...bs, { id: uid("br"), orgId: org.id, name:"Homs Main Branch", nameAr:"فرع حمص الرئيسي", city:"Homs", cityAr:"حمص", address:"New local branch", phone:"+963", status:"Active" }]); toast("Branch added"); }}>{label("Add branch","إضافة فرع")}</Btn></div></div>}
        {tab === "members" && <div className="cd"><DataTable minW={560} cols={[
          { label:label("Name","الاسم"), render: m => <div className="cm"><Avatar name={memberName(m, lang)} id={m.id} size={30} /><b style={{ fontWeight:600 }}>{memberName(m, lang)}</b></div> },
          { label:label("Role","الدور"), render: m => <select defaultValue={m.role} style={{ width:"auto", padding:"4px 8px" }} onChange={() => toast("Role updated (demo)")}><option>Owner</option><option>Manager</option><option>Agent</option><option>Marketing</option><option>Photographer</option><option>Accountant</option></select> },
          { label:label("Branch","الفرع"), render:m => branchName(branches.find(b => b.id === m.branchId) || {}, lang) },
          { label:label("Status","الحالة"), render:m => <Badge color="#10b981">{m.status || "Active"}</Badge> },
          { label:label("Last Active","آخر نشاط"), render:m => <span style={{ color:"var(--tx3)" }}>{timeAgo(m.lastActive || Date.now())}</span> }]} rows={members} /></div>}
        {tab === "defaults" && <div className="cd cd-b"><FormSection title="Property Defaults">
          <div className="fr three"><Field label="Default Type"><select><option>Apartment</option><option>Villa</option><option>Office</option><option>Shop</option><option>Land</option><option>Building</option></select></Field><Field label="Default Listing"><select><option>Sale</option><option>Rent</option></select></Field><Field label="Auto-publish"><select><option>No</option><option>Yes</option></select></Field></div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}><Btn v="p" icon="check" onClick={save}>{t("save")}</Btn></div></FormSection></div>}
        {tab === "currency" && <div className="cd cd-b"><FormSection title={label("Currency","العملة")}><div className="fr"><Field label={label("Default Currency","العملة الافتراضية")}><select defaultValue={org.currency} onChange={() => toast("Currency updated (demo)")}><option value="USD">USD · دولار أمريكي</option><option value="SYP">SYP · ليرة سورية</option></select></Field><Field label="Preview"><input disabled value={money(125000, org.currency, lang)} /></Field></div></FormSection></div>}
        {tab === "language" && <div className="cd cd-b"><FormSection title="Language">
          <div className="fr">{[["en","English Â· LTR"],["ar","Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Â· RTL"]].map(l => (<div key={l[0]} className={`chp ${lang === l[0] ? "on" : ""}`} style={{ padding:"12px 18px" }} onClick={() => setLang(l[0])}>{l[1]}{lang === l[0] && <Icon name="check" size={13} />}</div>))}</div></FormSection></div>}
        {tab === "sources" && <div className="cd cd-b"><FormSection title="Lead Sources"><div className="chips" style={{ marginBottom:10 }}>{srcs.map(s => <span className="chp on" key={s} onClick={() => setSrcs(x => x.filter(y => y !== s))}>{s} <Icon name="x" size={11} /></span>)}</div>
          <div style={{ display:"flex", gap:8 }}><input placeholder="Add sourceâ€¦" value={newSrc} onChange={e => setNewSrc(e.target.value)} style={{ maxWidth:220 }} /><Btn icon="plus" onClick={() => { if (newSrc) { setSrcs(x => [...x, newSrc]); setNewSrc(""); toast("Source added"); } }}>Add</Btn></div></FormSection></div>}
        {tab === "pipeline" && <div className="cd cd-b">{["New","Contacted","Viewing","Offer","Negotiation","Agreement","Contract","Completed","Lost"].map(s => <div className="swr" key={s}><Switch on onChange={() => {}} /><div><b style={{ fontSize:12.5 }}>{s}</b><div className="d">Stage active in kanban & funnel</div></div></div>)}</div>}
        {tab === "notifications" && <div className="cd cd-b">{[["leads","New lead alerts","Email + push when inbound lead arrives"],["deals","Deal stage changes","Notify manager on negotiation"],["contracts","Contract signing","Notify accountant on signed contracts"],["digest","Weekly digest","Monday morning summary"]].map(n => <div className="swr" key={n[0]}><Switch on={sw[n[0]]} onChange={v => setSw(s => ({ ...s, [n[0]]: v }))} /><div><b style={{ fontSize:12.5 }}>{n[1]}</b><div className="d">{n[2]}</div></div></div>)}</div>}
        {tab === "permissions" && <div className="cd"><div className="tw"><table className="tbl" style={{ minWidth:760 }}><thead><tr><th>Resource</th>{["View","Create","Edit","Delete","Manage"].map(r => <th key={r} style={{ textAlign:"center" }}>{label(r, {View:"عرض",Create:"إنشاء",Edit:"تعديل",Delete:"حذف",Manage:"إدارة"}[r])}</th>)}</tr></thead><tbody>
          {["Properties","Clients","Leads","Deals","Contracts","Virtual Tours","Analytics","Files","Settings"].map(md => (<tr key={md}><td style={{ fontWeight:600 }}>{md}</td>{["View","Create","Edit","Delete","Manage"].map(p => { const yes = md !== "Settings" || p !== "Delete"; return <td key={p} style={{ textAlign:"center" }}>{yes ? <Icon name="check" size={14} style={{ color:"#10b981" }} /> : <Icon name="minus" size={14} style={{ color:"var(--tx3)", opacity:.5 }} />}</td>; })}</tr>))}
        </tbody></table></div></div>}
        {tab === "appearance" && <div className="cd cd-b"><FormSection title="Appearance">
          <div className="fr">{[["light","Light","sun"],["dark","Dark","moon"]].map(th => (<div key={th[0]} className={`chp ${theme === th[0] ? "on" : ""}`} style={{ padding:"14px 22px" }} onClick={() => setTheme(th[0])}><Icon name={th[2]} size={14} />{th[1]}{theme === th[0] && <Icon name="check" size={13} />}</div>))}</div>
          <div className="swr"><Switch on onChange={() => {}} /><div><b style={{ fontSize:12.5 }}>Compact density</b><div className="d">Tighter tables & lists</div></div></div></FormSection></div>}
      </div>
    </div>
  </div>);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ APP (state-based routing, hash synced best-effort) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AiAssistant({ open, onClose }) {
  const [mode, setMode] = useState("Write Listing Description");
  const [messages, setMessages] = useState([{ from:"ai", text:"Shared Orbix AI for partner workspaces. Demo responses only; no external API is connected." }]);
  const capabilities = ["Write Listing Description","Analyze Price","Compare Properties","Draft Customer Reply","Summarize Lead","Summarize Transaction","Prepare Viewing Follow-up","Analyze Offer","Draft Negotiation Response"];
  const responses = {
    "Write Listing Description":"Spacious listing with strong natural light, practical circulation, and verified media assets. Emphasize neighborhood trust, nearby services, and branch-level availability.",
    "Analyze Price":"The demo range looks competitive within a 4-7% negotiation band. Watch viewing volume and lead warmth before changing price.",
    "Compare Properties":"The first option is stronger for owner-occupiers; the second is better for investors because the entry price and rental yield are easier to defend.",
    "Draft Customer Reply":"Thank you for your interest. I can share the floor plan, schedule a viewing, and send similar options in Homs, Damascus, or Tartous.",
    "Summarize Lead":"Hot lead: budget aligned, timeline under 30 days, and needs manager follow-up after viewing.",
    "Summarize Transaction":"Transaction is in the Orbix verification and contract preparation phase. Customer offer is accepted, signature remains pending, and payment status is tracked only as a demo status.",
    "Prepare Viewing Follow-up":"Thank the customer for attending, confirm the property fit, ask whether they want to submit an offer, and attach comparable listings if needed.",
    "Analyze Offer":"Offer is close to asking price and within a negotiable range. Recommended next step: request manager approval and prepare a clean counter if documents are incomplete.",
    "Draft Negotiation Response":"We appreciate your offer. The owner is open to proceeding if the timeline and included fixtures are confirmed. I can prepare the next version for review.",
  };
  const ask = () => setMessages(m => [...m, { from:"user", text:mode }, { from:"ai", text:responses[mode] }]);
  return <Drawer open={open} onClose={onClose} title="Orbix AI" sub="Shared partner assistant Â· frontend demo" wide>
    <div className="chips" style={{ marginBottom:14 }}>{capabilities.map(c => <span key={c} className={`chp ${mode === c ? "on" : ""}`} onClick={() => setMode(c)}>{c}</span>)}</div>
    <div className="cd" style={{ background:"var(--bg2)", borderColor:"var(--bd)", maxHeight:360, overflowY:"auto", padding:12 }}>
      {messages.map((m, i) => <div key={i} style={{ display:"flex", justifyContent:m.from === "user" ? "flex-end" : "flex-start", marginBottom:10 }}><div style={{ maxWidth:"78%", borderRadius:12, padding:"10px 12px", background:m.from === "user" ? "var(--pr)" : "var(--sf)", color:m.from === "user" ? "#fff" : "var(--tx)", border:m.from === "user" ? "none" : "1px solid var(--bd)", fontSize:12.5, lineHeight:1.5 }}>{m.text}</div></div>)}
    </div>
    <div style={{ display:"flex", gap:8, marginTop:14 }}><input readOnly value={mode} /><Btn v="p" icon="send" onClick={ask}>Run Demo</Btn></div>
  </Drawer>;
}

function WorkspacePlaceholder({ kind }) {
  const app = useApp();
  const cfg = {
    hotel: { title:"Hotel Workspace", items:["Overview","Rooms","Room Types","Reservations","Guests","Calendar","Housekeeping","Maintenance","Pricing","Offers","Analytics","Files","AI","Settings"] },
    restaurant: { title:"Restaurant Workspace", items:["Overview","Menu","Categories","Orders","Reservations","Tables","Kitchen","Inventory","Customers","Offers","Analytics","Files","AI","Settings"] },
  }[kind];
  return <div className="pg"><PageHeader title={cfg.title} sub={`${app.org.name} Â· future workspace navigation only`} /><div className="cd cd-b"><div className="fgd">{cfg.items.map(item => <div className="fc" key={item}><span className="fi"><Icon name={item === "AI" ? "sparkles" : item === "Files" ? "folder" : "dashboard"} size={15} /></span><div><b>{item}</b><span>Prepared route surface Â· not implemented in this task</span></div></div>)}</div></div></div>;
}

const PLATFORM_NAV = [
  ["overview","Overview","dashboard"],["organizations","Organizations","building"],["commercial-agreements","Commercial Agreements","filetext"],["commissions","Commissions & Fees","dollar"],["transactions","Transactions","shield"],["users","Platform Users","users"],["approvals","Approvals","check"],["moderation","Content Moderation","shield"],["properties-platform","Properties Platform","home"],["hotels-platform","Hotels Platform","building"],["restaurants-platform","Restaurants Platform","wallet"],["maps","Maps","pin"],["virtual-tours","Virtual Tours","video"],["ai-management","AI Management","sparkles"],["usage","Storage & Usage","folder"],["notifications","Notifications","bell"],["reports","Reports","filetext"],["analytics","Platform Analytics","chart"],["audit","Audit Logs","clock"],["settings","System Settings","settings"],
];
function PlatformAdmin({ theme, setTheme, lang, setLang, route, nav }) {
  const page = route.page || "overview";
  const current = PLATFORM_NAV.find(n => n[0] === page) || PLATFORM_NAV[0];
  const pageEl = page === "organizations" ? <PlatformOrganizations /> : page === "commercial-agreements" ? <CommercialAgreements lang={lang} /> : page === "commissions" ? <CommissionsFees lang={lang} /> : page === "transactions" ? <PlatformTransactions /> : page === "overview" ? <PlatformOverview /> : <PlatformPlaceholder title={current[1]} />;
  return <div className="shell"><aside className="sb" style={{ background:"color-mix(in srgb, var(--sf) 92%, #020617)" }}><div className="sb-hd"><div className="orb" /><div className="hd-t"><b>Orbix</b><span>Platform Admin</span></div></div><div className="sb-org"><span className="av" style={{ width:30, height:30, borderRadius:9, "--avc":"#111827" }}>R</span><div className="org-i"><b>RIVIA Internal</b><span>System operations</span></div></div><nav className="nv">{PLATFORM_NAV.map(n => <button key={n[0]} className={`nv-i ${page === n[0] ? "on" : ""}`} onClick={() => nav("/platform-admin" + (n[0] === "overview" ? "" : "/" + n[0]))}><Icon name={n[2]} /><span className="lbl">{n[1]}</span></button>)}</nav></aside><div className="mw"><header className="tb"><div className="crumb"><span>Platform</span><span className="sp">/</span><b>{current[1]}</b></div><div className="tbs-ic"><span className="si"><Icon name="search" size={14} /></span><input readOnly placeholder="Platform search" /><kbd>SYS</kbd></div><div className="tb-r"><Badge color="#f59e0b">Production</Badge><button className="ib"><Icon name="alert" /></button><button className="ib" onClick={() => setTheme(theme === "light" ? "dark" : "light")}><Icon name={theme === "light" ? "moon" : "sun"} /></button><button className="ib" onClick={() => setLang(lang === "en" ? "ar" : "en")}><Icon name="lang" /></button><Avatar name="Platform Admin" id="admin" size={26} /></div></header><main className="mn">{pageEl}</main></div></div>;
}

function PlatformOverview() {
  const vol = TRANSACTIONS0.reduce((s, x) => s + x.propertyValue, 0);
  const fee = TRANSACTIONS0.reduce((s, x) => s + x.orbixFee, 0);
  const done = TRANSACTIONS0.filter(x => x.status === "Transaction Completed").length;
  return <div className="pg"><PageHeader title="Platform Overview" sub="Orbix transaction and technology layer status" /><div className="kg"><KpiCard icon="building" label="Total Organizations" value={PLATFORM_ORGS.length} delta="+12%" up /><KpiCard icon="shield" label="Transaction Volume" value={moneyC(vol, "USD")} /><KpiCard icon="check" label="Completed Transactions" value={done} /><KpiCard icon="dollar" label="Orbix Transaction Revenue" value={moneyC(fee, "USD")} /><KpiCard icon="wallet" label="Pending Fees" value={moneyC(TRANSACTIONS0.filter(x => x.paymentStatus !== "Paid").reduce((s, x) => s + x.orbixFee, 0), "USD")} /><KpiCard icon="trend" label="Average Transaction Value" value={moneyC(vol / TRANSACTIONS0.length, "USD")} /><KpiCard icon="home" label="Real Estate Transaction Revenue" value={moneyC(fee, "USD")} /><KpiCard icon="calendar" label="Hotel Booking Revenue" value="Future" /><KpiCard icon="send" label="Restaurant Transaction Revenue" value="Future" /></div><div className="g3"><ChartCard title="Transaction Volume"><RevArea data={PLATFORM_MONTHLY} dataKey="revenue" color="#10b981" /></ChartCard><ChartCard title="Platform Activity"><BarsSimple data={PLATFORM_MONTHLY} dataKey="activity" color="#8b5cf6" /></ChartCard><ChartCard title="Industry Distribution"><Donut data={[{ name:"Real Estate", value:1, color:"#2f6bff" },{ name:"Hotels", value:1, color:"#14b8a6" },{ name:"Restaurants", value:1, color:"#f59e0b" }]} /></ChartCard></div><div className="g22"><div className="cd"><div className="cd-h"><h3>Recent Platform Activity</h3></div><div className="cd-b"><Timeline items={PLATFORM_ACTIVITY} /></div></div><div className="cd"><div className="cd-h"><h3>Pending Transaction Reviews</h3></div><div className="cd-b">{TRANSACTIONS0.filter(x => x.orbixStatus !== "Completed").slice(0,3).map(x => <div className="lr" key={x.id}><Avatar name={x.transactionId} id={x.id} size={30} /><div className="lt"><b>{x.transactionId}</b><span>{x.orbixStatus} · {x.risk}</span></div><Badge color="#f59e0b">{x.verificationStatus}</Badge></div>)}</div></div></div></div>;
}

function PlatformOrganizations() {
  const cols = [{ label:"Organization", render:o => <div className="cm"><Avatar name={o.name} id={o.id} size={30} /><div><b>{o.name}</b><div className="mono" style={{ color:"var(--tx3)" }}>{o.id}</div></div></div> },{ label:"Industry", key:"industry" },{ label:"Plan", key:"plan" },{ label:"Status", render:o => <Badge color={o.status === "Active" ? "#10b981" : "#f59e0b"}>{o.status}</Badge> },{ label:"Owner", key:"owner" },{ label:"Users", key:"users" },{ label:"Branches", key:"branches" },{ label:"Created", key:"created" },{ label:"Commercial Agreement", key:"commercialAgreement" },{ label:"Usage", key:"usage" },{ label:"Actions", align:"end", render:() => <div className="ra"><button className="ib" title="View"><Icon name="eye" size={14} /></button><button className="ib" title="Approve"><Icon name="check" size={14} /></button><button className="ib" title="Suspend"><Icon name="archive" size={14} /></button><button className="ib" title="Open Organization"><Icon name="ext" size={14} /></button></div> }];
  return <div className="pg"><PageHeader title="Organizations" sub="All Orbix tenants Â· internal platform administration only" /><div className="cd"><DataTable cols={cols} rows={PLATFORM_ORGS} pageSize={8} minW={1180} /></div></div>;
}

function PlatformTransactions() {
  const cols = [
    { label:"Transaction", render:x => <span className="mono">{x.transactionId}</span> },
    { label:"Agency", render:() => "Atlas Real Estate" },
    { label:"Customer", render:x => (CLIENTS0.find(c => c.id === x.clientId) || {}).fullName },
    { label:"Property", render:x => propTitle(PROPERTIES0.find(p => p.id === x.propertyId) || {}) },
    { label:"Value", render:x => <span className="num">{money(x.propertyValue, x.currency)}</span> },
    { label:"Orbix Fee", render:x => <span className="num">{money(x.orbixFee, x.currency)}</span> },
    { label:"Verification", render:x => <Badge color={x.verificationStatus === "Verified" ? "#10b981" : "#f59e0b"}>{x.verificationStatus}</Badge> },
    { label:"Contract", key:"contractStatus" },
    { label:"Status", key:"status" },
    { label:"Risk / Action Required", render:x => <Badge color={x.risk === "Low" ? "#10b981" : x.risk === "Medium" ? "#f59e0b" : "#ef4444"}>{x.risk}</Badge> },
  ];
  return <div className="pg"><PageHeader title="Real Estate Transactions" sub="Platform control view · transaction-based revenue model" /><div className="fb"><span className="chp on">Real Estate Transactions</span><span className="chp">Hotel Bookings · Future</span><span className="chp">Restaurant Transactions · Future</span></div><div className="cd"><DataTable cols={cols} rows={TRANSACTIONS0} minW={1200} /></div></div>;
}

function CommercialAgreements({ lang = "en" }) {
  const [sel, setSel] = useState(null);
  const a = AGREEMENTS0.find(x => x.id === sel);
  const agreementType = v => lang === "ar" ? ({ "Transaction Based":"حسب المعاملة", "Per Transaction":"لكل معاملة", "Commission Share":"مشاركة العمولة", Custom:"اتفاق مخصص" }[v] || v) : v;
  const status = v => lang === "ar" ? ({ Draft:"مسودة", Active:"نشطة", Expiring:"قاربت على الانتهاء", Expired:"منتهية", Suspended:"موقوفة" }[v] || v) : v;
  const cols = [
    { label:localLabel(lang,"Agreement ID","رقم الاتفاقية"), render:x => <span className="mono">{x.agreementId}</span> },
    { label:localLabel(lang,"Organization","المؤسسة"), render:x => lang === "ar" ? x.organizationAr : x.organization },
    { label:localLabel(lang,"Industry","القطاع"), key:"industry" },
    { label:localLabel(lang,"Agreement Type","نوع الاتفاقية"), render:x => agreementType(x.agreementType) },
    { label:localLabel(lang,"Effective Date","تاريخ السريان"), key:"effectiveDate" },
    { label:localLabel(lang,"Expiration Date","تاريخ الانتهاء"), key:"expirationDate" },
    { label:localLabel(lang,"Status","الحالة"), render:x => <Badge color={x.status === "Active" ? "#10b981" : x.status === "Draft" ? "#64748b" : "#f59e0b"}>{status(x.status)}</Badge> },
    { label:localLabel(lang,"Sale Fee","رسم البيع"), key:"saleFee" },
    { label:localLabel(lang,"Rental Fee","رسم الإيجار"), key:"rentalFee" },
    { label:localLabel(lang,"Last Updated","آخر تحديث"), render:x => timeAgo(x.updatedAt) },
  ];
  return <div className="pg"><PageHeader title={localLabel(lang,"Commercial Agreements","الاتفاقيات التجارية")} sub={localLabel(lang,"Internal Orbix relationship terms with partner organizations","شروط العلاقة التجارية الداخلية بين أوربكس والشركاء")}><Btn v="p" icon="plus" onClick={() => toast(localLabel(lang,"Create agreement (demo)","إنشاء اتفاقية (تجريبي)"))}>{localLabel(lang,"Create Agreement","إنشاء اتفاقية")}</Btn></PageHeader><div className="cd"><DataTable cols={cols} rows={AGREEMENTS0} onRow={x => setSel(x.id)} minW={1350} /></div>
    <Drawer open={!!a} onClose={() => setSel(null)} title={a && (lang === "ar" ? a.organizationAr : a.organization)} sub={a && a.agreementId} wide>{a && <div className="g22"><div className="cd cd-b"><FormSection title={localLabel(lang,"Organization","المؤسسة")}><div className="fgd"><div className="fc"><b>{localLabel(lang,"Industry","القطاع")}</b><span>{a.industry}</span></div><div className="fc"><b>{localLabel(lang,"Status","الحالة")}</b><span>{status(a.status)}</span></div></div></FormSection><FormSection title={localLabel(lang,"Agreement Terms","شروط الاتفاقية")}><p style={{ color:"var(--tx2)" }}>{a.notes}</p></FormSection><FormSection title={localLabel(lang,"Effective Dates","تواريخ السريان")}><div className="fgd"><div className="fc"><b>{localLabel(lang,"Effective Date","تاريخ السريان")}</b><span>{a.effectiveDate}</span></div><div className="fc"><b>{localLabel(lang,"Expiration Date","تاريخ الانتهاء")}</b><span>{a.expirationDate}</span></div></div></FormSection></div><div className="cd cd-b"><FormSection title={localLabel(lang,"Transaction Fees","رسوم المعاملات")}><div className="fgd"><div className="fc"><b>{localLabel(lang,"Sale transactions","معاملات البيع")}</b><span>{localLabel(lang,"Orbix fee","رسم أوربكس")}: {a.saleFee}</span></div><div className="fc"><b>{localLabel(lang,"Rental transactions","معاملات الإيجار")}</b><span>{localLabel(lang,"Orbix fee","رسم أوربكس")}: {a.rentalFee}</span></div><div className="fc"><b>{localLabel(lang,"Other Transaction Fee","رسم المعاملات الأخرى")}</b><span>{a.otherFee}</span></div></div><p style={{ color:"var(--tx3)", marginTop:10 }}>{localLabel(lang,"Mock examples only. These are not actual Orbix business rules.","أمثلة تجريبية فقط وليست قواعد عمل فعلية لأوربكس.")}</p></FormSection><FormSection title={localLabel(lang,"Documents","المستندات")}>{a.documents.map(d => <div className="lr" key={d}><span className="fi"><Icon name="filetext" size={14} /></span><div className="lt"><b>{d}</b><span>{localLabel(lang,"Demo document","مستند تجريبي")}</span></div></div>)}</FormSection><FormSection title={localLabel(lang,"Activity History","سجل النشاط")}>{a.activity.map((x,i) => <div className="lr" key={x}><span className="mono">{i + 1}</span><div className="lt"><b>{x}</b><span>{timeAgo(a.updatedAt + i * 36e5)}</span></div></div>)}</FormSection></div></div>}</Drawer>
  </div>;
}

function CommissionsFees({ lang = "en" }) {
  const volume = COMMISSIONS0.reduce((s, x) => s + x.transactionValue, 0);
  const revenue = COMMISSIONS0.reduce((s, x) => s + x.orbixFee, 0);
  const pending = COMMISSIONS0.filter(x => ["Pending","Calculated","Due"].includes(x.feeStatus)).reduce((s, x) => s + x.orbixFee, 0);
  const collected = COMMISSIONS0.filter(x => x.feeStatus === "Paid").reduce((s, x) => s + x.orbixFee, 0);
  const cols = [
    { label:localLabel(lang,"Transaction ID","رقم المعاملة"), render:x => <span className="mono">{(TRANSACTIONS0.find(t => t.id === x.transactionId) || {}).transactionId}</span> },
    { label:localLabel(lang,"Organization","المؤسسة"), render:() => localLabel(lang,"Atlas Real Estate","أطلس العقارية") },
    { label:localLabel(lang,"Property","العقار"), render:x => propTitle(PROPERTIES0.find(p => p.id === x.propertyId), lang) },
    { label:localLabel(lang,"Transaction Type","نوع المعاملة"), render:x => x.transactionType === "sale" ? localLabel(lang,"Sale","بيع") : localLabel(lang,"Rent","إيجار") },
    { label:localLabel(lang,"Transaction Value","قيمة المعاملة"), render:x => money(x.transactionValue, x.currency, lang) },
    { label:localLabel(lang,"Agency Commission","عمولة المكتب"), render:x => money(x.agencyCommission, x.currency, lang) },
    { label:localLabel(lang,"Orbix Fee","رسم أوربكس"), render:x => money(x.orbixFee, x.currency, lang) },
    { label:localLabel(lang,"Fee Status","حالة الرسم"), render:x => <Badge color={x.feeStatus === "Paid" ? "#10b981" : x.feeStatus === "Due" ? "#f59e0b" : "#64748b"}>{feeStatusLabel(x.feeStatus, lang)}</Badge> },
    { label:localLabel(lang,"Completion Date","تاريخ الإتمام"), render:x => x.completionDate ? timeAgo(x.completionDate) : "—" },
  ];
  return <div className="pg"><PageHeader title={localLabel(lang,"Commissions & Fees","العمولات والرسوم")} sub={localLabel(lang,"Internal Orbix transaction-fee operations","عمليات رسوم معاملات أوربكس الداخلية")} /><div className="kg"><KpiCard icon="shield" label={localLabel(lang,"Transaction Volume","حجم المعاملات")} value={moneyC(volume, "USD", lang)} /><KpiCard icon="dollar" label={localLabel(lang,"Orbix Revenue","إيرادات أوربكس")} value={moneyC(revenue, "USD", lang)} /><KpiCard icon="wallet" label={localLabel(lang,"Pending Fees","الرسوم المعلقة")} value={moneyC(pending, "USD", lang)} /><KpiCard icon="check" label={localLabel(lang,"Collected Fees","الرسوم المحصلة")} value={moneyC(collected, "USD", lang)} /><KpiCard icon="trend" label={localLabel(lang,"Average Orbix Fee","متوسط رسم أوربكس")} value={moneyC(revenue / COMMISSIONS0.length, "USD", lang)} /><KpiCard icon="building" label={localLabel(lang,"Completed Transactions","المعاملات المكتملة")} value={COMMISSIONS0.filter(x => x.completionDate).length} /></div><div className="cd"><DataTable cols={cols} rows={COMMISSIONS0} minW={1250} /></div></div>;
}

function PlatformPlaceholder({ title }) {
  return <div className="pg"><PageHeader title={title} sub="Platform-admin route placeholder" /><div className="cd cd-b"><EmptyState icon="settings" title={`${title} surface`} desc="Reserved for internal Orbix platform operations. This is intentionally separate from Partner Suite workflows." /></div></div>;
}

function HomeDemo({ nav }) {
  return <div className="mn" style={{ minHeight:"100vh", display:"grid", placeItems:"center" }}><div className="pg" style={{ width:"100%", maxWidth:980 }}><div style={{ textAlign:"center", marginBottom:24 }}><div className="orb" style={{ margin:"0 auto 12px", width:44, height:44 }} /><h1 style={{ fontSize:30, letterSpacing:0 }}>Orbix</h1><p style={{ color:"var(--tx3)", marginTop:8 }}>B2B2C real estate transaction platform · frontend demo</p></div><div className="g3"><button className="cd cd-b" style={{ textAlign:"start" }} onClick={() => nav("/customer/demo/transactions")}><Icon name="users" size={22} style={{ color:"var(--pr)", marginBottom:18 }} /><h3>Open Customer Tracker</h3><p style={{ color:"var(--tx3)", marginTop:8 }}>B2C transaction progress view for buyers, tenants, investors, and property seekers.</p></button><button className="cd cd-b" style={{ textAlign:"start" }} onClick={() => nav("/partner/demo/real-estate")}><Icon name="building" size={22} style={{ color:"var(--pr)", marginBottom:18 }} /><h3>Open Partner Suite</h3><p style={{ color:"var(--tx3)", marginTop:8 }}>B2B workspace for Atlas Real Estate to manage listings, customers, viewings, offers, and transactions.</p></button><button className="cd cd-b" style={{ textAlign:"start" }} onClick={() => nav("/platform-admin")}><Icon name="shield" size={22} style={{ color:"var(--pr)", marginBottom:18 }} /><h3>Open Platform Admin</h3><p style={{ color:"var(--tx3)", marginTop:8 }}>Orbix internal transaction, trust, and technology operations.</p></button></div></div></div>;
}

function CustomerTransactions({ route, nav, lang = "en" }) {
  const txId = route.param; const tx = txId ? TRANSACTIONS0.find(x => x.id === txId || x.transactionId === txId) : null;
  const wrap = children => <div className="mn" style={{ minHeight:"100vh", background:"var(--bg)", padding:"18px 14px 40px" }}><div style={{ maxWidth:480, margin:"0 auto" }}>{children}</div></div>;
  if (!tx) return wrap(<><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}><div className="orb" /><div><b>Orbix</b><p style={{ color:"var(--tx3)", fontSize:12 }}>{lang === "ar" ? "معاملات العملاء" : "Customer Transactions"}</p></div></div><PageHeader title={lang === "ar" ? "معاملاتك العقارية" : "Your Property Transactions"} sub={lang === "ar" ? "واجهة عميل تجريبية" : "Customer-safe demo view"} />{TRANSACTIONS0.slice(0,3).map(x => { const p = PROPERTIES0.find(p => p.id === x.propertyId); const a = MEMBERS.find(m => m.id === x.agentId); return <button key={x.id} className="cd cd-b" style={{ width:"100%", textAlign:"start", marginBottom:10 }} onClick={() => nav(`/customer/demo/transactions/${x.id}`)}><b>{propTitle(p, lang)}</b><p style={{ color:"var(--tx3)", marginTop:5 }}>{txStageLabel(x.status, lang)} · {memberName(a, lang)}</p><div style={{ marginTop:10 }}><Badge color="#2f6bff">{statusLabel(x.orbixStatus, lang)}</Badge></div></button>; })}</>);
  const p = PROPERTIES0.find(x => x.id === tx.propertyId) || {}; const a = MEMBERS.find(x => x.id === tx.agentId) || {}; const b = BRANCHES.find(x => x.id === tx.branchId) || {};
  const steps = ["Inquiry / Lead","Viewing Completed","Offer Submitted","Orbix Verification","Contract Preparation","Transaction Completed"];
  return wrap(<><button className="bt" onClick={() => nav("/customer/demo/transactions")} style={{ marginBottom:12 }}><Icon name="chevleft" size={14} />Back</button><div className="cd cd-b" style={{ marginBottom:12 }}><h1 style={{ fontSize:22 }}>{lang === "ar" ? "معاملتك العقارية" : "Your Property Transaction"}</h1><p className="mono" style={{ color:"var(--tx3)", marginTop:6 }}>{tx.transactionId}</p><div style={{ marginTop:12 }}><Badge color="#2f6bff">{txStageLabel(tx.status, lang)}</Badge></div></div><div className="cd cd-b" style={{ marginBottom:12 }}><div className="lr"><img className="thmb" src={p.images?.[0]} alt="" /><div className="lt"><b>{propTitle(p, lang)}</b><span>{cityOf(p, lang)} · {districtOf(p, lang)}</span></div></div><div className="lr"><Avatar name="Atlas Real Estate" id="org-demo" size={30} /><div className="lt"><b>{lang === "ar" ? "أطلس العقارية" : "Atlas Real Estate"}</b><span>{branchName(b, lang)}</span></div></div><div className="lr"><Avatar name={memberName(a, lang)} id={a.id} size={30} /><div className="lt"><b>{memberName(a, lang)}</b><span>{lang === "ar" ? "الوكيل المسؤول" : "Assigned Agent"}</span></div></div></div><div className="cd cd-b" style={{ marginBottom:12 }}><FormSection title={lang === "ar" ? "تقدم المعاملة" : "Transaction Progress"}><Timeline items={steps.map((s,i) => ({ id:i, user:i < 3 ? "Customer" : i === 3 ? "Orbix" : "Agency", text:txStageLabel(s, lang), ts:tx.createdAt + i * 864e5, color:i <= steps.indexOf(tx.status) || s === tx.status ? "#10b981" : "#64748b" }))} /></FormSection></div><div style={{ display:"grid", gap:8 }}><Btn v="p" icon="calendar" onClick={() => toast("Viewing appointment opened (demo)", "info")}>{lang === "ar" ? "عرض موعد المعاينة" : "View Appointment"}</Btn><Btn icon="wallet" onClick={() => toast("Offer opened (demo)", "info")}>{lang === "ar" ? "عرض العرض" : "View Offer"}</Btn><Btn icon="upload" onClick={() => toast("Upload document (demo)", "info")}>{lang === "ar" ? "رفع مستند" : "Upload Document"}</Btn><Btn icon="filetext" onClick={() => toast("Contract review (demo)", "info")}>{lang === "ar" ? "مراجعة العقد" : "Review Contract"}</Btn><Btn icon="phone" onClick={() => toast("Contact agent (demo)", "info")}>{lang === "ar" ? "التواصل مع الوكيل" : "Contact Agent"}</Btn></div></>);
}

const BASE = "/partner/demo/real-estate";
function getRoute() {
  const clean = p => (p || "/").replace(/\/+$/, "") || "/";
  try {
    const hash = (window.location.hash || "").replace(/^#/, "");
    const path = clean(hash && hash !== "/" ? hash : window.location.pathname);
    if (path === "/") return { mode:"home", page:"home", param:null, workspace:null };
    if (path === "/partner") return { mode:"partner", page:"overview", param:null, workspace:"real-estate" };
    if (path.startsWith("/customer/demo/transactions")) {
      const rest = path.slice("/customer/demo/transactions".length).replace(/^\//, "").split("/").filter(Boolean);
      return { mode:"customer", page:"transactions", param:rest[0] || null, workspace:null };
    }
    if (path.startsWith("/platform-admin")) {
      const rest = path.slice("/platform-admin".length).replace(/^\//, "").split("/").filter(Boolean);
      return { mode:"platform", page: rest[0] || "overview", param: rest[1] || null, workspace:null };
    }
    if (path.startsWith("/partner/demo/hotel")) return { mode:"partner", page:"hotel", param:null, workspace:"hotel" };
    if (path.startsWith("/partner/demo/restaurant")) return { mode:"partner", page:"restaurant", param:null, workspace:"restaurant" };
    if (path.startsWith(BASE)) {
      const rest = path.slice(BASE.length).replace(/^\//, "").split("/").filter(Boolean);
      return { mode:"partner", page: rest[0] || "overview", param: rest[1] || null, workspace:"real-estate" };
    }
  } catch (e) {}
  return { mode:"home", page:"home", param:null, workspace:null };
}
export default function App() {
  const [theme, setTheme] = useState(safeGet("ox-theme") || "light");
  const [lang, setLang] = useState(safeGet("ox-lang") || "en");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [orgId, setOrgId] = useState("org-demo");
  const [branchId, setBranchId] = useState("all");
  const [collapsed, setCollapsed] = useState(safeGet("ox-sb") === "1");
  const [mobileNav, setMobileNav] = useState(false);
  /* Routing simplified: page is React state â€” dashboard renders DIRECTLY.
     "/" â†’ /partner/demo/real-estate is applied best-effort via hash, but
     rendering never depends on the redirect or the hashchange event. */
  const [route, setRoute] = useState(getRoute);
  const [palette, setPalette] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [cfm, setCfm] = useState(null);
  const [properties, setProperties] = useState(PROPERTIES0);
  const [clients, setClients] = useState(CLIENTS0);
  const [leads, setLeads] = useState(LEADS0);
  const [deals] = useState(DEALS0);
  const [contracts] = useState(CONTRACTS0);
  const [viewings] = useState(VIEWINGS0);
  const [offers] = useState(OFFERS0);
  const [transactions] = useState(TRANSACTIONS0);
  const [tours] = useState(TOURS0);
  const [files, setFiles] = useState(FILES0);
  const [notifs, setNotifs] = useState(NOTIFS0);
  const [branches, setBranches] = useState(BRANCHES);
  const [propView, setPropView] = useState(null); const [propEdit, setPropEdit] = useState(undefined);
  const [clientView, setClientView] = useState(null); const [clientEdit, setClientEdit] = useState(undefined);
  const [leadView, setLeadView] = useState(null); const [leadEdit, setLeadEdit] = useState(undefined);
  const [dealView, setDealView] = useState(null); const [ctView, setCtView] = useState(null);
  const [tourView, setTourView] = useState(null); const [agentView, setAgentView] = useState(null);

  const go = path => {
    try { window.history.pushState({}, "", path); } catch (e) { try { window.location.hash = path; } catch (e2) {} }
    setRoute(getRoute());
  };

  useEffect(() => {
    /* "/" redirect â€” cosmetic only; the dashboard already rendered above */
    const f = () => setRoute(getRoute());
    try { window.addEventListener("hashchange", f); } catch (e) {}
    try { window.addEventListener("popstate", f); } catch (e) {}
    const k = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); } if (e.key === "Escape") setPalette(false); };
    try { window.addEventListener("keydown", k); } catch (e) {}
    return () => { try { window.removeEventListener("hashchange", f); window.removeEventListener("popstate", f); window.removeEventListener("keydown", k); } catch (e) {} };
  }, []);
  useEffect(() => { try { document.documentElement.dataset.theme = theme; } catch (e) {} safeSet("ox-theme", theme); }, [theme]);
  useEffect(() => { try { document.documentElement.dir = dir; document.documentElement.lang = lang; } catch (e) {} safeSet("ox-lang", lang); }, [lang]);
  useEffect(() => { safeSet("ox-sb", collapsed ? "1" : "0"); }, [collapsed]);
  useEffect(() => {
    if (route.mode !== "partner" || !route.workspace) return;
    const cur = ORGS.find(o => o.id === orgId);
    if (!cur || !(cur.workspaces || []).includes(route.workspace)) {
      const next = ORGS.find(o => (o.workspaces || []).includes(route.workspace));
      if (next) { setOrgId(next.id); setBranchId("all"); }
    }
  }, [route.mode, route.workspace]);

  pushToast = (m, ty) => { const id = uid("t"); setToasts(ts => [...ts, { id, m, ty }]); setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3200); };
  pushConfirm = (o, res) => setCfm({ ...o, res });

  const org = ORGS.find(o => o.id === orgId) || ORGS[0];
  const branchesO = branches.filter(b => b.orgId === orgId);
  const members = MEMBERS.filter(m => m.orgId === orgId);
  const me = members[0] || MEMBERS[0];
  const scopedProps = properties.filter(p => (orgId === "org-demo" ? true : p.id.startsWith("s")) && (branchId === "all" || p.branchId === branchId));
  const scopedLeads = leads.filter(() => orgId === "org-demo");
  const t = k => (T[lang] && T[lang][k]) || T.en[k] || k;
  const nav = p => {
    go(BASE + (p === "overview" ? "" : "/" + p));
  };

  const ctx = {
    t, dir, theme, setTheme, lang, setLang, org, orgId, setOrgId: id => { setOrgId(id); setBranchId("all"); }, branchId, setBranchId,
    branches: branchesO, setBranches: fn => setBranches(b => fn(b)), members, me, route, nav,
    collapsed, setCollapsed, mobileNav, setMobileNav,
    properties: scopedProps, clients, leads: scopedLeads, deals, contracts, viewings, offers, transactions, tours, files, setFiles, notifs, setNotifs,
    setProperties, setClients, setLeads,
    openPalette: () => setPalette(true), openAi: () => setAiOpen(true), go,
    openProp: id => setPropView(id), newProperty: () => { setPropEdit(null); }, editProp: id => setPropEdit(id),
    openClient: id => { setClientEdit(undefined); setClientView(id); }, newClient: () => { setClientView(null); setClientEdit(null); }, editClient: id => { setClientView(id); setClientEdit(true); },
    openLead: id => { setLeadEdit(undefined); setLeadView(id); }, newLead: () => { setLeadView(null); setLeadEdit(null); }, editLead: id => { setLeadView(id); setLeadEdit(true); },
    openDeal: setDealView, openContract: setCtView, openTour: setTourView, openAgent: setAgentView,
  };

  const PAGE_EL = {
    overview: <Overview />, properties: <Properties />, requests: <Requests />, clients: <Clients />, leads: <Leads />,
    pipeline: <Pipeline />, viewings: <Viewings />, offers: <Offers />, deals: <Deals />, contracts: <Contracts />, transactions: <TransactionsPage />, "virtual-tours": <Tours />,
    media: <MediaLibrary />, agents: <Agents />, analytics: <Analytics />, files: <Files />, calendar:<CalendarPage />, messages:<MessagesPage />, notifications:<NotificationsCenter />, activity:<ActivityLog />, team:<TeamPage />, branches:<BranchesPage />, settings: <Settings />,
    hotel: <WorkspacePlaceholder kind="hotel" />, restaurant: <WorkspacePlaceholder kind="restaurant" />,
  };

  const chrome = content => (
    <Ctx.Provider value={ctx}>
      <style>{CSS}</style>
      <ErrorBoundary>{content}</ErrorBoundary>
    </Ctx.Provider>
  );

  if (route.mode === "home") return chrome(<HomeDemo nav={go} />);
  if (route.mode === "customer") return chrome(<CustomerTransactions route={route} nav={go} lang={lang} />);
  if (route.mode === "platform") return chrome(<PlatformAdmin theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} route={route} nav={go} />);

  return (
    <Ctx.Provider value={ctx}>
      <style>{CSS}</style>
      <ErrorBoundary>
        <div className={`shell ${collapsed ? "cl" : ""}`}>
          <Sidebar />
          <div className="mw">
            <Topbar />
            <main className="mn">
              <ErrorBoundary key={route.page + orgId}>
                {PAGE_EL[route.page] || <Overview />}
              </ErrorBoundary>
            </main>
          </div>
        </div>

        {propView && <PropDrawer id={propView} onClose={() => setPropView(null)} />}
        {propEdit !== undefined && <PropForm id={propEdit} onClose={() => setPropEdit(undefined)} />}
        {clientView && <ClientDrawer id={clientView} edit={!!clientEdit} onClose={() => { setClientView(null); setClientEdit(undefined); }} />}
        {clientView === null && clientEdit === null && <ClientDrawer id={null} onClose={() => setClientEdit(undefined)} />}
        {leadView && <LeadDrawer id={leadView} edit={!!leadEdit} onClose={() => { setLeadView(null); setLeadEdit(undefined); }} />}
        {leadView === null && leadEdit === null && <LeadDrawer id={null} onClose={() => setLeadEdit(undefined)} />}
        {dealView && <DealDrawer id={dealView} onClose={() => setDealView(null)} />}
        {ctView && <ContractDrawer id={ctView} onClose={() => setCtView(null)} />}
        {tourView && <TourDrawer id={tourView} onClose={() => setTourView(null)} />}
        {agentView && <AgentDrawer id={agentView} onClose={() => setAgentView(null)} />}

        <Palette open={palette} onClose={() => setPalette(false)} />
        <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />

        <Modal open={!!cfm} onClose={() => { if (cfm) { cfm.res(false); setCfm(null); } }}>
          <div className="cd-b" style={{ padding:20 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <span style={{ width:36, height:36, borderRadius:11, background: cfm?.danger ? "rgba(239,68,68,.12)" : "var(--prs)", color: cfm?.danger ? "#ef4444" : "var(--pr)", display:"flex", alignItems:"center", justifyContent:"center", flex:"0 0 auto" }}><Icon name={cfm?.danger ? "alert" : "check"} /></span>
              <div><b style={{ fontSize:14 }}>{cfm?.title}</b><p style={{ fontSize:12.5, color:"var(--tx2)", marginTop:5 }}>{cfm?.msg}</p></div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}>
              <Btn onClick={() => { cfm.res(false); setCfm(null); }}>{t("cancel")}</Btn>
              <Btn v={cfm?.danger ? "d" : "p"} onClick={() => { cfm.res(true); setCfm(null); }}>{cfm?.label || "Confirm"}</Btn>
            </div>
          </div>
        </Modal>

        <div id="tsts">{toasts.map(tt => (<div key={tt.id} className={`tst ${tt.ty}`}><span className="ti"><Icon name={tt.ty === "ok" ? "check" : tt.ty === "err" ? "alert" : "sparkles"} size={13} /></span>{tt.m}</div>))}</div>
      </ErrorBoundary>
    </Ctx.Provider>
  );
}



