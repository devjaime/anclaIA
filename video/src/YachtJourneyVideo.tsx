import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// ── Brand colors ──────────────────────────────────────────────────────────────
const C = {
  navy:   '#0a2342',
  ocean:  '#0e6ba8',
  teal:   '#0a9396',
  seafom: '#94d2bd',
  sand:   '#e9d8a6',
  coral:  '#ca3c25',
  amber:  '#ee9b00',
  white:  '#ffffff',
  slate:  '#1e293b',
  bg:     '#f0f9ff',
};

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

// ── Animation helpers ─────────────────────────────────────────────────────────
function useFade(delay = 0, dur = 20) {
  const f = useCurrentFrame();
  return interpolate(f, [delay, delay + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
function useUp(delay = 0) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  return { transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`, opacity: interpolate(p, [0, 1], [0, 1]) };
}
function useScale(delay = 0) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - delay, fps, config: { damping: 12, stiffness: 100 } });
  return { transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`, opacity: interpolate(p, [0, 1], [0, 1]) };
}

// ── Progress bar ─────────────────────────────────────────────────────────���────
const Bar: React.FC<{ pct: number }> = ({ pct }) => (
  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#1e293b' }}>
    <div style={{ height: '100%', background: C.teal, width: `${pct * 100}%`, transition: 'width .1s linear' }} />
  </div>
);

// ── Scene dots indicator ──────────────────────────────────────────────────────
const Dots: React.FC<{ cur: number; tot: number }> = ({ cur, tot }) => (
  <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 6 }}>
    {Array.from({ length: tot }).map((_, i) => (
      <div key={i} style={{ width: i === cur ? 20 : 8, height: 8, borderRadius: 999, background: i === cur ? C.teal : '#334155', transition: 'all .3s' }} />
    ))}
  </div>
);

// ── Flag badge ────────────────────────────────────────────────────────────────
const FlagBadge: React.FC<{ flag: string; country: string; delay?: number }> = ({ flag, country, delay = 0 }) => {
  const op = useFade(delay);
  return (
    <div style={{ opacity: op, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(10,147,150,.15)', border: '1.5px solid rgba(148,210,189,.4)', borderRadius: 999, padding: '6px 16px' }}>
      <span style={{ fontSize: 22 }}>{flag}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.seafom, fontFamily: FONT }}>{country}</span>
    </div>
  );
};

// ── Diagnostic card ───────────────────────────────────────────────────────────
const DiagCard: React.FC<{
  model: string; code: string; cause: string;
  urgency: string; urgColor: string; urgBg: string;
  time: string; delay?: number;
}> = ({ model, code, cause, urgency, urgColor, urgBg, time, delay = 0 }) => {
  const anim = useScale(delay);
  return (
    <div style={{ ...anim, background: C.white, borderRadius: 20, overflow: 'hidden', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
      <div style={{ padding: '14px 18px', background: `linear-gradient(135deg,${C.navy},${C.ocean})` }}>
        <p style={{ fontSize: 10, color: C.seafom, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: FONT }}>Diagnóstico · AnclaIA</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: C.white, fontWeight: 800, fontSize: 20, margin: 0, fontFamily: FONT }}>{model}</p>
            <p style={{ color: C.seafom, fontSize: 12, margin: '3px 0 0', fontFamily: 'monospace' }}>Código: {code}</p>
          </div>
          <div style={{ background: urgBg, border: `1.5px solid ${urgColor}80`, borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: urgColor, fontFamily: FONT }}>{urgency}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 6px', fontFamily: FONT }}>Causa probable</p>
        <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.5, margin: '0 0 12px', fontFamily: FONT }}>{cause}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: FONT }}>⏱ Diagnóstico en {time}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 20, padding: '2px 8px', fontFamily: FONT }}>ALTA confianza</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════��═══════════════════
// ESCENA 0 — INTRO
// ══════════════════════════════════════��════════════════════════════════
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const logoS = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const t1 = useUp(14);
  const t2 = useUp(26);
  const t3 = useUp(38);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg,${C.navy} 0%,#0e3d6b 50%,${C.teal} 100%)`, opacity: bgOp, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* waves bg */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: .08 }} viewBox="0 0 1280 160" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C200,20 400,140 640,80 C880,20 1080,140 1280,80 L1280,160 L0,160 Z" fill={C.seafom}/>
        <path d="M0,100 C240,40 480,160 720,100 C960,40 1120,160 1280,100 L1280,160 L0,160 Z" fill={C.seafom} opacity=".5"/>
      </svg>

      {/* Logo */}
      <div style={{ transform: `scale(${logoS})`, width: 100, height: 100, background: C.teal, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, boxShadow: '0 20px 60px rgba(10,147,150,.5)', marginBottom: 28 }}>⚓</div>

      <div style={{ ...t1, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: C.seafom, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>AnclaIA · Maritime AI Diagnostics</p>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.1 }}>
          Una travesía.<br/>
          <span style={{ color: C.seafom }}>5 puertos. 0 fallas.</span>
        </h1>
      </div>

      <div style={{ ...t2, marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 20, color: '#94a3b8', margin: 0 }}>
          Cómo AnclaIA protege al S/Y <strong style={{ color: C.white }}>ANCORA</strong> en ruta <span style={{ color: C.seafom }}>Italia → Chile</span>
        </p>
      </div>

      <div style={{ ...t3, display: 'flex', gap: 12, marginTop: 32 }}>
        {['🇮🇹 Génova','🇪🇸 Barcelona','🇲🇽 Veracruz','🇨🇴 Cartagena','🇨🇱 Valparaíso'].map((p, i) => (
          <div key={i} style={{ background: 'rgba(148,210,189,.1)', border: '1px solid rgba(148,210,189,.3)', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: C.seafom }}>{p}</div>
        ))}
      </div>

      <Bar pct={interpolate(frame, [0, 240], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ════════════════════════���════════════════════════════��═════════════════
// ESCENA 1 — MAPA DE RUTA
// ═══════════════════════════════════════════════════════════════════════
const SceneMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleAnim = useUp(8);

  const ports = [
    { name: 'Génova',     flag: '🇮🇹', x: 520, y: 145, delay: 15 },
    { name: 'Barcelona',  flag: '🇪🇸', x: 450, y: 160, delay: 30 },
    { name: 'Veracruz',   flag: '🇲🇽', x: 185, y: 215, delay: 55 },
    { name: 'Cartagena',  flag: '🇨🇴', x: 240, y: 250, delay: 75 },
    { name: 'Valparaíso', flag: '🇨🇱', x: 240, y: 360, delay: 95 },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg,${C.navy},#0e3d6b)`, fontFamily: FONT, padding: '48px 64px' }}>
      <Dots cur={1} tot={9} />

      <div style={{ ...titleAnim, marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: C.seafom, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>La travesía</p>
        <h2 style={{ fontSize: 42, fontWeight: 800, color: C.white, margin: 0, lineHeight: 1.1 }}>
          Ruta del <span style={{ color: C.seafom }}>S/Y ANCORA</span>
        </h2>
        <p style={{ fontSize: 15, color: '#94a3b8', margin: '8px 0 0' }}>12.000 millas náuticas · 4 meses de travesía · 5 revisiones técnicas con AnclaIA</p>
      </div>

      <div style={{ display: 'flex', gap: 40, flex: 1, alignItems: 'center' }}>
        {/* Simplified map SVG */}
        <div style={{ flex: 1.2, position: 'relative', height: 420 }}>
          <svg viewBox="0 0 720 480" style={{ width: '100%', height: '100%' }}>
            {/* Ocean bg */}
            <rect width="720" height="480" fill="#0e2d4a" rx="16"/>

            {/* Simplified continental shapes */}
            {/* Europe */}
            <path d="M420,80 L560,80 L580,130 L530,160 L480,155 L450,175 L420,165 Z" fill="#1e3d5c" stroke="#2d5a7a" strokeWidth="1"/>
            {/* Africa */}
            <path d="M440,170 L560,170 L570,300 L500,360 L450,300 L440,220 Z" fill="#1e3d5c" stroke="#2d5a7a" strokeWidth="1"/>
            {/* Americas */}
            <path d="M100,80 L280,80 L295,200 L260,280 L220,360 L200,420 L140,400 L100,300 L80,180 Z" fill="#1e3d5c" stroke="#2d5a7a" strokeWidth="1"/>

            {/* Route line */}
            {ports.map((p, i) => {
              if (i === 0) return null;
              const prev = ports[i - 1];
              const lineProgress = interpolate(frame, [p.delay, p.delay + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const endX = prev.x + (p.x - prev.x) * lineProgress;
              const endY = prev.y + (p.y - prev.y) * lineProgress;
              return (
                <line key={i} x1={prev.x} y1={prev.y} x2={endX} y2={endY} stroke={C.seafom} strokeWidth="2.5" strokeDasharray="6,4" opacity=".8"/>
              );
            })}

            {/* Port dots + labels */}
            {ports.map((p, i) => {
              const pct = spring({ frame: frame - p.delay, fps, config: { damping: 12, stiffness: 130 } });
              const op = interpolate(pct, [0, 1], [0, 1]);
              const sc = interpolate(pct, [0, 1], [0, 1]);
              return (
                <g key={i} style={{ opacity: op, transform: `scale(${sc})`, transformOrigin: `${p.x}px ${p.y}px` }}>
                  <circle cx={p.x} cy={p.y} r="12" fill={C.teal} opacity=".25"/>
                  <circle cx={p.x} cy={p.y} r="6" fill={C.seafom}/>
                  <text x={p.x + 14} y={p.y - 8} fill={C.white} fontSize="11" fontWeight="700" fontFamily={FONT}>{p.flag} {p.name}</text>
                  <text x={p.x + 14} y={p.y + 6} fill="#94a3b8" fontSize="9" fontFamily={FONT}>Puerto {i + 1}</text>
                </g>
              );
            })}

            {/* Yacht icon at latest active port */}
            {(() => {
              const activeIdx = ports.findIndex((p, i) => i === ports.length - 1 || frame < ports[i + 1].delay);
              const p = ports[Math.max(activeIdx, 0)];
              const yachtOp = useFade(30);
              return (
                <text x={p.x - 10} y={p.y - 18} fontSize="18" opacity={yachtOp} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}>⛵</text>
              );
            })()}
          </svg>
        </div>

        {/* Port list */}
        <div style={{ width: 240 }}>
          {ports.map((p, i) => {
            const op = interpolate(frame, [p.delay, p.delay + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const tx = interpolate(frame, [p.delay, p.delay + 15], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity: op, transform: `translateX(${tx}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(148,210,189,.06)', border: '1px solid rgba(148,210,189,.15)', borderRadius: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{p.flag}</span>
                <div>
                  <p style={{ color: C.white, fontWeight: 700, fontSize: 14, margin: 0, fontFamily: FONT }}>{p.name}</p>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0, fontFamily: FONT }}>Parada {i + 1} · Revisión técnica</p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 16 }}>🔧</span>
              </div>
            );
          })}
        </div>
      </div>

      <Bar pct={interpolate(frame, [0, 180], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// PORT SCENE template
// ═══════════════════════════════════════════════════════════════════════
interface PortSceneProps {
  sceneIdx: number;
  flag: string;
  city: string;
  country: string;
  portDesc: string;
  model: string;
  equipment: string;
  code: string;
  cause: string;
  urgency: string;
  urgColor: string;
  urgBg: string;
  time: string;
  techAction: string;
  accentColor: string;
  totalFrames: number;
}

const PortScene: React.FC<PortSceneProps> = ({
  sceneIdx, flag, city, country, portDesc,
  model, equipment, code, cause, urgency, urgColor, urgBg, time, techAction,
  accentColor, totalFrames
}) => {
  const frame = useCurrentFrame();
  const headerAnim = useUp(8);
  const leftAnim = useUp(18);
  const cardAnim = useScale(32);
  const actionAnim = useFade(55, 18);

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: `linear-gradient(135deg,${C.navy},${C.ocean})`, padding: '20px 64px 18px' }}>
        <Dots cur={sceneIdx} tot={9} />
        <div style={{ ...headerAnim, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 44 }}>{flag}</div>
          <div>
            <p style={{ fontSize: 11, color: C.seafom, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: 0 }}>Puerto {sceneIdx - 1} · {country}</p>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: C.white, margin: '2px 0 0', lineHeight: 1 }}>{city}</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>{portDesc}</p>
          </div>
          <div style={{ marginLeft: 'auto', background: 'rgba(202,60,37,.15)', border: '1.5px solid rgba(202,60,37,.4)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#fca5a5', margin: 0, textTransform: 'uppercase', letterSpacing: '.08em' }}>Equipo en falla</p>
            <p style={{ fontSize: 16, color: C.white, fontWeight: 700, margin: '3px 0 0' }}>⚠ {model}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', gap: 48, padding: '28px 64px', alignItems: 'center' }}>
        {/* Left: problem */}
        <div style={{ ...leftAnim, flex: 1 }}>
          <p style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>El problema</p>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: C.navy, margin: '0 0 10px', lineHeight: 1.2 }}>
            {equipment} muestra <span style={{ color: C.coral }}>código {code}</span>
          </h3>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: '0 0 20px' }}>
            El técnico recibe el aviso antes de subir al yate. Abre AnclaIA en su teléfono, ingresa el modelo y el código de falla.
          </p>

          {/* Steps */}
          {[
            { icon: '📱', text: `Selecciona ${model} en AnclaIA` },
            { icon: '⌨️', text: `Ingresa código "${code}"` },
            { icon: '📷', text: 'Adjunta foto del display' },
          ].map((s, i) => {
            const op = interpolate(frame, [20 + i * 12, 36 + i * 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const tx = interpolate(frame, [20 + i * 12, 36 + i * 12], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ opacity: op, transform: `translateX(${tx}px)`, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${C.navy},${C.ocean})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{s.icon}</div>
                <p style={{ fontSize: 13, color: '#475569', margin: 0, fontFamily: FONT }}>{s.text}</p>
              </div>
            );
          })}

          {/* Tech action */}
          <div style={{ opacity: actionAnim, marginTop: 20, background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <p style={{ fontSize: 13, color: '#166534', fontWeight: 600, margin: 0, fontFamily: FONT }}>{techAction}</p>
          </div>
        </div>

        {/* Right: diagnosis card */}
        <div style={{ width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <DiagCard
            model={model} code={code} cause={cause}
            urgency={urgency} urgColor={urgColor} urgBg={urgBg}
            time={time} delay={32}
          />

          {/* Time saved badge */}
          {(() => {
            const op2 = useFade(65, 15);
            return (
              <div style={{ opacity: op2, background: `linear-gradient(135deg,${C.navy},${C.teal})`, borderRadius: 14, padding: '10px 20px', display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
                <span style={{ fontSize: 24 }}>⏱</span>
                <div>
                  <p style={{ fontSize: 10, color: C.seafom, margin: 0, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: FONT }}>Sin AnclaIA</p>
                  <p style={{ fontSize: 13, color: C.white, fontWeight: 700, margin: '2px 0 0', fontFamily: FONT }}>Manual: 20-40 min → <span style={{ color: C.seafom }}>AnclaIA: {time}</span></p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <Bar pct={interpolate(frame, [0, totalFrames], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════��
// ESCENA 7 — RESUMEN
// ═══════════════════════════════════════════════════════════════════════
const SceneSummary: React.FC = () => {
  const frame = useCurrentFrame();
  const titleAnim = useUp(8);

  const ports = [
    { flag: '🇮🇹', city: 'Génova',     model: 'FAR1523', fault: 'E-07',   time: '2.1s', saved: '35 min' },
    { flag: '🇪🇸', city: 'Barcelona',  model: 'FA170',   fault: 'AIS-03', time: '1.8s', saved: '28 min' },
    { flag: '🇲🇽', city: 'Veracruz',   model: 'FCV628',  fault: 'E-12',   time: '2.4s', saved: '40 min' },
    { flag: '🇨🇴', city: 'Cartagena',  model: 'FM8900S', fault: 'DIST',   time: '2.0s', saved: '32 min' },
    { flag: '🇨🇱', city: 'Valparaíso', model: 'FAR1518', fault: 'T-01',   time: '2.7s', saved: '38 min' },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg,${C.navy},#0e3d6b)`, fontFamily: FONT, padding: '48px 64px' }}>
      <Dots cur={7} tot={9} />

      <div style={{ ...titleAnim, textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 11, color: C.seafom, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>La travesía completa</p>
        <h2 style={{ fontSize: 46, fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.1 }}>
          5 puertos · 5 diagnósticos<br/>
          <span style={{ color: C.seafom }}>0 visitas innecesarias</span>
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ports.map((p, i) => {
          const op = interpolate(frame, [20 + i * 15, 38 + i * 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const ty = interpolate(frame, [20 + i * 15, 38 + i * 15], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${ty}px)`, background: 'rgba(148,210,189,.06)', border: '1.5px solid rgba(148,210,189,.2)', borderRadius: 16, padding: '16px 20px', width: 210 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{p.flag}</span>
                <div>
                  <p style={{ color: C.white, fontWeight: 700, fontSize: 14, margin: 0 }}>{p.city}</p>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{p.model} · {p.fault}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: C.seafom, fontWeight: 800, fontSize: 18, margin: 0 }}>{p.time}</p>
                  <p style={{ color: '#64748b', fontSize: 10, margin: 0 }}>diagnóstico</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#fbbf24', fontWeight: 800, fontSize: 18, margin: 0 }}>{p.saved}</p>
                  <p style={{ color: '#64748b', fontSize: 10, margin: 0 }}>ahorrados</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      {(() => {
        const op = useFade(100, 20);
        return (
          <div style={{ opacity: op, marginTop: 28, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', gap: 32, background: 'rgba(148,210,189,.08)', border: '1.5px solid rgba(148,210,189,.25)', borderRadius: 20, padding: '16px 40px' }}>
              <div>
                <p style={{ color: C.seafom, fontWeight: 900, fontSize: 36, margin: 0 }}>2h 53m</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>tiempo total ahorrado</p>
              </div>
              <div style={{ width: 1, background: 'rgba(148,210,189,.2)' }}/>
              <div>
                <p style={{ color: C.seafom, fontWeight: 900, fontSize: 36, margin: 0 }}>$0</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>visitas extra al barco</p>
              </div>
              <div style={{ width: 1, background: 'rgba(148,210,189,.2)' }}/>
              <div>
                <p style={{ color: C.seafom, fontWeight: 900, fontSize: 36, margin: 0 }}>11.1s</p>
                <p style={{ color: '#94a3b8', fontSize: 12, margin: '4px 0 0' }}>tiempo promedio IA</p>
              </div>
            </div>
          </div>
        );
      })()}

      <Bar pct={interpolate(frame, [0, 240], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════��═══════════
// ESCENA 8 — CTA
// ═══════════════════════════════════════════════════════════════════════
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 100 } });
  const t1 = useUp(18);
  const t2 = useUp(32);
  const t3 = useFade(48, 18);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg,${C.navy} 0%,#0e3d6b 50%,${C.teal} 100%)`, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: .08 }} viewBox="0 0 1280 160">
        <path d="M0,80 C200,20 400,140 640,80 C880,20 1080,140 1280,80 L1280,160 L0,160 Z" fill={C.seafom}/>
      </svg>

      <div style={{ transform: `scale(${logoS})`, width: 88, height: 88, background: C.teal, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, boxShadow: '0 16px 50px rgba(10,147,150,.45)', marginBottom: 24 }}>⚓</div>

      <div style={{ ...t1, textAlign: 'center' }}>
        <h2 style={{ fontSize: 50, fontWeight: 900, color: C.white, margin: 0, lineHeight: 1.1 }}>
          AnclaIA cuida tu flota<br/>
          <span style={{ color: C.seafom }}>en cualquier océano</span>
        </h2>
      </div>

      <div style={{ ...t2, textAlign: 'center', marginTop: 16 }}>
        <p style={{ fontSize: 18, color: '#94a3b8', margin: 0, maxWidth: 580 }}>
          RAG + Vision IA sobre manuales Furuno. Open source. Técnicos certificados en LATAM.
        </p>
      </div>

      <div style={{ opacity: t3, marginTop: 32, display: 'flex', gap: 16 }}>
        <div style={{ background: `linear-gradient(135deg,${C.seafom},${C.teal})`, borderRadius: 14, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>github.com/devjaime/anclaIA</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 14, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚢</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.white }}>Únete a la beta → anclaIA.cl</span>
        </div>
      </div>

      <Bar pct={interpolate(frame, [0, 180], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ════════════════════════════���════════════════════════════════════���═════
// ROOT COMPOSITION
// ═══════════════════════════════════════════════════════════════════════
export const YachtJourneyVideo: React.FC = () => {
  // Scene durations (seconds): intro 8, map 6, 5×ports 9 each, summary 8, cta 6
  // Total: 8+6+9+9+9+9+9+8+6 = 73s
  const FPS = 30;
  const s = (sec: number) => sec * FPS;

  // Cumulative start frames
  const starts = [0, s(8), s(14), s(23), s(32), s(41), s(50), s(59), s(67)];

  return (
    <AbsoluteFill>
      <Sequence from={starts[0]} durationInFrames={s(8)}>  <SceneIntro /> </Sequence>
      <Sequence from={starts[1]} durationInFrames={s(6)}>  <SceneMap />   </Sequence>

      {/* Port 1 — Génova, Italy */}
      <Sequence from={starts[2]} durationInFrames={s(9)}>
        <PortScene sceneIdx={2} flag="🇮🇹" city="Génova" country="Italia"
          portDesc="Puerto antiguo del Mediterráneo · 44°24'N 8°55'E"
          model="FAR1523" equipment="Radar FAR1523" code="E-07"
          cause="Cable coaxial de antena RF deteriorado. Conector PL-259 con corrosión visible en terminal principal."
          urgency="ALTA" urgColor="#f59e0b" urgBg="#fef3c7"
          time="2.1s" techAction="Técnico lleva cable RG-214 y torque 15Nm — reemplazó en 45 min en puerto."
          accentColor="#2563eb" totalFrames={s(9)} />
      </Sequence>

      {/* Port 2 — Barcelona, Spain */}
      <Sequence from={starts[3]} durationInFrames={s(9)}>
        <PortScene sceneIdx={3} flag="🇪🇸" city="Barcelona" country="España"
          portDesc="Puerto Olímpico · 41°22'N 2°12'E"
          model="FA170" equipment="AIS Transponder FA170" code="AIS-03"
          cause="Antena GPS desconectada o dañada. El transpondedor AIS no recibe fix GPS para emitir posición MMSI."
          urgency="CRÍTICA" urgColor="#dc2626" urgBg="#fef2f2"
          time="1.8s" techAction="Sin AIS el yate navega ciego para otros buques. Antena reemplazada antes de zarpar."
          accentColor="#dc2626" totalFrames={s(9)} />
      </Sequence>

      {/* Port 3 — Veracruz, Mexico */}
      <Sequence from={starts[4]} durationInFrames={s(9)}>
        <PortScene sceneIdx={4} flag="🇲🇽" city="Veracruz" country="México"
          portDesc="Golfo de México · 19°11'N 96°08'O"
          model="FCV628" equipment="Ecosonda FCV628" code="E-12"
          cause="Transductor con desviación de ganancia >3dB. Posible acumulación de organismos marinos en la quilla."
          urgency="MEDIA" urgColor="#0a9396" urgBg="#e0f2f1"
          time="2.4s" techAction="Limpieza del transductor y recalibración de ganancia. Sonda operativa antes de la pesca."
          accentColor="#0a9396" totalFrames={s(9)} />
      </Sequence>

      {/* Port 4 — Cartagena, Colombia */}
      <Sequence from={starts[5]} durationInFrames={s(9)}>
        <PortScene sceneIdx={5} flag="🇨🇴" city="Cartagena" country="Colombia"
          portDesc="Mar Caribe · 10°23'N 75°31'O"
          model="FM8900S" equipment="Radio GMDSS FM8900S" code="DIST"
          cause="Batería de emergencia DSC bajo el umbral de carga mínima (12.2V). Equipo no apto para navegación offshore."
          urgency="CRÍTICA" urgColor="#dc2626" urgBg="#fef2f2"
          time="2.0s" techAction="Batería VRLA reemplazada antes de cruzar el Atlántico. Obligatorio por SOLAS."
          accentColor="#0e6ba8" totalFrames={s(9)} />
      </Sequence>

      {/* Port 5 — Valparaíso, Chile */}
      <Sequence from={starts[6]} durationInFrames={s(9)}>
        <PortScene sceneIdx={6} flag="🇨🇱" city="Valparaíso" country="Chile"
          portDesc="Costa del Pacífico · 33°02'S 71°38'O"
          model="FAR1518" equipment="Radar FAR1518" code="T-01"
          cause="Potencia de transmisión del magnetrón al 60% del nominal. Alcance máximo reducido a 18nm (nominal 36nm)."
          urgency="ALTA" urgColor="#f59e0b" urgBg="#fef3c7"
          time="2.7s" techAction="Magnetrón programado para reemplazo. Yate ingresa a puerto con radar funcional a corto alcance."
          accentColor="#0a9396" totalFrames={s(9)} />
      </Sequence>

      <Sequence from={starts[7]} durationInFrames={s(8)}>  <SceneSummary /> </Sequence>
      <Sequence from={starts[8]} durationInFrames={s(6)}>  <SceneCTA />     </Sequence>
    </AbsoluteFill>
  );
};
