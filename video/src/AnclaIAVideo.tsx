import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

// ── Colores del brand ─────────────────────────────────────────────────────────
const COLORS = {
  navy:    '#0f172a',
  blue:    '#2563eb',
  blueLt:  '#3b82f6',
  blueXlt: '#dbeafe',
  slate:   '#1e293b',
  slate500:'#64748b',
  white:   '#ffffff',
  green:   '#16a34a',
  amber:   '#d97706',
  red:     '#dc2626',
  bg:      '#f8fafc',
};

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

// ── Utilidades de animación ────────────────────────────────────────────────────
function useFadeIn(delay = 0, duration = 20) {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function useSlideUp(delay = 0, duration = 20) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120, mass: 0.8 } });
  const translateY = interpolate(progress, [0, 1], [40, 0]);
  const opacity    = interpolate(progress, [0, 1], [0, 1]);
  return { transform: `translateY(${translateY}px)`, opacity };
}

function useScaleIn(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100 } });
  return {
    transform: `scale(${interpolate(progress, [0, 1], [0.7, 1])})`,
    opacity:   interpolate(progress, [0, 1], [0, 1]),
  };
}

// ── Componentes UI de escenas ──────────────────────────────────────────────────

const Badge: React.FC<{ label: string; color?: string; bg?: string; delay?: number }> = ({
  label, color = COLORS.blue, bg = COLORS.blueXlt, delay = 0,
}) => {
  const style = useFadeIn(delay);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color, border: `1.5px solid ${color}40`,
      borderRadius: 999, padding: '5px 14px',
      fontSize: 13, fontWeight: 700, fontFamily: FONT,
      opacity: style,
    }}>
      {label}
    </div>
  );
};

const Tag: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const opacity = useFadeIn(delay);
  return (
    <div style={{
      background: '#1e293b', color: '#94a3b8',
      borderRadius: 8, padding: '6px 14px',
      fontSize: 13, fontWeight: 600, fontFamily: FONT,
      opacity,
    }}>
      {label}
    </div>
  );
};

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, background: '#1e293b',
  }}>
    <div style={{
      height: '100%', background: COLORS.blue,
      width: `${progress * 100}%`,
      transition: 'width 0.1s linear',
    }} />
  </div>
);

const SceneIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div style={{
    position: 'absolute', top: 24, right: 32,
    display: 'flex', gap: 6, alignItems: 'center',
  }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i === current ? 20 : 8, height: 8,
        borderRadius: 999,
        background: i === current ? COLORS.blue : '#334155',
        transition: 'all 0.3s ease',
      }} />
    ))}
  </div>
);

// ── ESCENA 0: Intro ────────────────────────────────────────────────────────────
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleSlide = useSlideUp(15, 25);
  const subSlide   = useSlideUp(30, 25);
  const badgeOpacity = useFadeIn(50);

  const bgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1e3a5f 100%)`,
      opacity: bgOpacity,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT,
    }}>
      {/* Logo */}
      <div style={{
        width: 100, height: 100,
        background: COLORS.blue,
        borderRadius: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 52,
        transform: `scale(${logoScale})`,
        boxShadow: '0 20px 60px rgba(37,99,235,0.5)',
        marginBottom: 28,
      }}>
        ⚓
      </div>

      {/* Título */}
      <div style={{ ...titleSlide, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 72, fontWeight: 900, color: COLORS.white,
          margin: 0, letterSpacing: -2, lineHeight: 1,
        }}>
          Ancla<span style={{ color: COLORS.blueLt }}>IA</span>
        </h1>
      </div>

      {/* Subtítulo */}
      <div style={{ ...subSlide, textAlign: 'center', marginTop: 16 }}>
        <p style={{
          fontSize: 22, color: '#94a3b8', margin: 0, fontWeight: 400,
        }}>
          Diagnóstico de equipos marítimos con IA
        </p>
      </div>

      {/* Badges */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 36,
        opacity: badgeOpacity,
      }}>
        {['RAG + Vector Search', 'Claude Vision', 'LATAM'].map((t, i) => (
          <Tag key={i} label={t} />
        ))}
      </div>

      {/* Línea inferior */}
      <div style={{
        position: 'absolute', bottom: 40,
        display: 'flex', gap: 8, alignItems: 'center',
        opacity: useFadeIn(60),
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} />
        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500, margin: 0 }}>
          Marketplace vertical · Técnicos certificados en Chile
        </p>
      </div>

      <ProgressBar progress={interpolate(frame, [0, 120], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 1: El Problema ──────────────────────────────────────────────────────
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  const titleAnim = useSlideUp(10);
  const card1 = useScaleIn(20);
  const card2 = useScaleIn(35);
  const card3 = useScaleIn(50);

  const problems = [
    { icon: '🚢', title: 'Equipo falla en alta mar', desc: 'El técnico no sabe qué piezas llevar antes de ir a terreno' },
    { icon: '⏰', title: 'Tiempo perdido', desc: 'Ida y vuelta sin diagnóstico previo = horas de inactividad del barco' },
    { icon: '💸', title: 'Costo elevado', desc: 'Cada viaje innecesario cuesta $200-800 USD en logística' },
  ];

  const delays = [card1, card2, card3];

  return (
    <AbsoluteFill style={{
      background: COLORS.bg, fontFamily: FONT,
      padding: '60px 80px',
    }}>
      <SceneIndicator current={1} total={7} />

      <Badge label="El Problema" color="#dc2626" bg="#fef2f2" />

      <div style={{ ...titleAnim, marginTop: 20 }}>
        <h2 style={{
          fontSize: 44, fontWeight: 800, color: COLORS.navy,
          margin: 0, lineHeight: 1.15,
        }}>
          Los técnicos van a terreno{' '}
          <span style={{ color: '#dc2626' }}>sin diagnóstico previo</span>
        </h2>
      </div>

      <div style={{
        display: 'flex', gap: 20, marginTop: 40,
      }}>
        {problems.map((p, i) => (
          <div key={i} style={{
            ...delays[i],
            flex: 1,
            background: COLORS.white,
            borderRadius: 20,
            padding: 28,
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>{p.icon}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.navy, margin: '0 0 8px 0' }}>
              {p.title}
            </h3>
            <p style={{ fontSize: 14, color: COLORS.slate500, margin: 0, lineHeight: 1.6 }}>
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      <ProgressBar progress={interpolate(frame, [0, 150], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 2: La Solución ──────────────────────────────────────────────────────
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();

  const titleAnim = useSlideUp(10);
  const flowAnim  = useFadeIn(30, 30);

  const steps = [
    { icon: '📋', label: 'Modelo + Código falla' },
    { icon: '📷', label: 'Foto del equipo (opcional)' },
    { icon: '🧠', label: 'RAG + Claude Vision' },
    { icon: '📊', label: 'Diagnóstico estructurado' },
  ];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)`,
      fontFamily: FONT, padding: '60px 80px',
    }}>
      <SceneIndicator current={2} total={7} />

      <Badge label="La Solución" color={COLORS.blue} bg={COLORS.blueXlt} />

      <div style={{ ...titleAnim, marginTop: 20 }}>
        <h2 style={{
          fontSize: 44, fontWeight: 800, color: COLORS.navy,
          margin: 0, lineHeight: 1.15,
        }}>
          Diagnóstico IA{' '}
          <span style={{ color: COLORS.blue }}>antes de ir a terreno</span>
        </h2>
        <p style={{ fontSize: 18, color: COLORS.slate500, margin: '12px 0 0 0' }}>
          El técnico ingresa la falla → recibe causa, acción y pasos exactos en segundos
        </p>
      </div>

      {/* Flujo de pasos */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 48, opacity: flowAnim,
      }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              flex: 1,
              background: COLORS.white,
              borderRadius: 16, padding: '20px 16px',
              textAlign: 'center',
              border: `1.5px solid ${i === 2 ? COLORS.blue : '#e2e8f0'}`,
              boxShadow: i === 2 ? `0 0 0 3px ${COLORS.blueXlt}` : '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, margin: 0, lineHeight: 1.4 }}>
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div style={{ color: COLORS.blue, fontSize: 24, fontWeight: 700 }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <ProgressBar progress={interpolate(frame, [0, 150], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 3: Stack Técnico ────────────────────────────────────────────────────
const SceneStack: React.FC = () => {
  const frame = useCurrentFrame();
  const titleAnim = useSlideUp(8);

  const stack = [
    { layer: 'Frontend',   tech: 'React + Tailwind + Vite',          icon: '⚛️',  color: '#0ea5e9' },
    { layer: 'Backend',    tech: 'FastAPI + Python 3.12',             icon: '🐍',  color: '#22c55e' },
    { layer: 'Vector DB',  tech: 'pgvector + Hybrid Search',          icon: '🔍',  color: '#a855f7' },
    { layer: 'AI',         tech: 'Claude Vision + OpenRouter',        icon: '🧠',  color: '#f59e0b' },
    { layer: 'Embeddings', tech: 'paraphrase-multilingual-MiniLM',    icon: '📐',  color: '#ec4899' },
    { layer: 'Infra',      tech: 'Docker Compose / Railway / Fly.io', icon: '🐳',  color: '#06b6d4' },
  ];

  return (
    <AbsoluteFill style={{
      background: COLORS.navy, fontFamily: FONT, padding: '60px 80px',
    }}>
      <SceneIndicator current={3} total={7} />

      <Badge label="Stack Técnico" color="#a78bfa" bg="#1e1b4b" />

      <div style={{ ...titleAnim, marginTop: 20, marginBottom: 36 }}>
        <h2 style={{
          fontSize: 44, fontWeight: 800, color: COLORS.white,
          margin: 0, lineHeight: 1.15,
        }}>
          Arquitectura <span style={{ color: '#818cf8' }}>moderna y escalable</span>
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {stack.map((s, i) => {
          const anim = useScaleIn(15 + i * 10);
          return (
            <div key={i} style={{
              ...anim,
              background: '#1e293b',
              borderRadius: 16, padding: '18px 20px',
              border: `1.5px solid ${s.color}30`,
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${s.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, shrink: 0,
              }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: s.color, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {s.layer}
                </p>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  {s.tech}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ProgressBar progress={interpolate(frame, [0, 150], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 4: Demo UI ──────────────────────────────────────────────────────────
const SceneDemoUI: React.FC = () => {
  const frame = useCurrentFrame();
  const titleAnim = useSlideUp(8);
  const uiAnim = useScaleIn(20);

  const typingProgress = interpolate(frame, [30, 80], [0, 1], { extrapolateRight: 'clamp' });
  const fullText = "Radar no enciende, pantalla en negro tras encender";
  const typedText = fullText.slice(0, Math.floor(fullText.length * typingProgress));

  return (
    <AbsoluteFill style={{
      background: COLORS.bg, fontFamily: FONT, padding: '50px 80px',
    }}>
      <SceneIndicator current={4} total={7} />

      <Badge label="Interfaz del Técnico" color={COLORS.blue} bg={COLORS.blueXlt} />

      <div style={{ ...titleAnim, marginTop: 16, marginBottom: 30 }}>
        <h2 style={{
          fontSize: 38, fontWeight: 800, color: COLORS.navy, margin: 0,
        }}>
          Simple, rápido y desde cualquier dispositivo
        </h2>
      </div>

      {/* Mock UI */}
      <div style={{
        ...uiAnim,
        background: COLORS.white,
        borderRadius: 20, padding: 28,
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
        maxWidth: 480,
      }}>
        {/* Header mock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: 36, height: 36, background: COLORS.blue, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚓</div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: COLORS.navy }}>AnclaIA</p>
            <p style={{ margin: 0, fontSize: 12, color: COLORS.slate500 }}>Diagnóstico Furuno</p>
          </div>
        </div>

        {/* Tabs mock */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {['🔧 Diagnóstico', '💬 Chat'].map((t, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '8px 12px',
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: i === 0 ? COLORS.white : 'transparent',
              color: i === 0 ? COLORS.navy : COLORS.slate500,
              boxShadow: i === 0 ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {t}
            </div>
          ))}
        </div>

        {/* Form mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Modelo</p>
            <p style={{ margin: '3px 0 0 0', fontSize: 15, fontWeight: 700, color: COLORS.blue }}>FAR1523 — Radar</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Código de falla</p>
            <p style={{ margin: '3px 0 0 0', fontSize: 15, fontWeight: 700, color: COLORS.navy }}>E-07</p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1.5px solid #e2e8f0', minHeight: 60 }}>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.slate500, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Descripción</p>
            <p style={{ margin: '3px 0 0 0', fontSize: 14, color: COLORS.navy }}>
              {typedText}
              {typingProgress < 1 && <span style={{ opacity: Math.sin(frame * 0.2) > 0 ? 1 : 0, color: COLORS.blue }}>|</span>}
            </p>
          </div>

          <div style={{
            background: COLORS.blue, color: COLORS.white,
            borderRadius: 12, padding: '12px 20px',
            textAlign: 'center', fontWeight: 700, fontSize: 15,
            opacity: interpolate(frame, [90, 110], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            🔍 Obtener diagnóstico
          </div>
        </div>
      </div>

      <ProgressBar progress={interpolate(frame, [0, 150], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 5: Resultado del Diagnóstico ────────────────────────────────────────
const SceneResult: React.FC = () => {
  const frame = useCurrentFrame();
  const titleAnim = useSlideUp(5);
  const card1 = useScaleIn(15);
  const card2 = useScaleIn(25);
  const stepsAnim = useFadeIn(40, 25);

  return (
    <AbsoluteFill style={{
      background: COLORS.bg, fontFamily: FONT, padding: '50px 80px',
    }}>
      <SceneIndicator current={5} total={7} />

      <Badge label="Resultado del Diagnóstico" color="#16a34a" bg="#f0fdf4" />

      <div style={{ ...titleAnim, marginTop: 14, marginBottom: 24 }}>
        <h2 style={{
          fontSize: 38, fontWeight: 800, color: COLORS.navy, margin: 0,
        }}>
          Diagnóstico estructurado y accionable
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Card resultado */}
        <div style={{
          ...card1, flex: 1,
          background: COLORS.white, borderRadius: 20, padding: 24,
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          {/* Header card */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.slate} 0%, #1e3a5f 100%)`,
            borderRadius: 14, padding: '16px 20px', marginBottom: 18,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 4px 0', fontWeight: 600 }}>DIAGNÓSTICO</p>
              <p style={{ color: COLORS.white, fontSize: 20, fontWeight: 800, margin: 0 }}>FAR1523</p>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '2px 0 0 0' }}>Código: E-07</p>
            </div>
            <div style={{
              background: '#fef3c7', color: '#92400e',
              border: '1.5px solid #fde68a',
              borderRadius: 999, padding: '6px 14px',
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              ALTA
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#eff6ff', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, margin: '0 0 6px 0', textTransform: 'uppercase' }}>Causa probable</p>
              <p style={{ fontSize: 13, color: COLORS.navy, margin: 0, lineHeight: 1.5 }}>Falla en cable coaxial RF o conector deteriorado</p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28 }}>🔩</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, margin: 0 }}>Cambiar componente</p>
            </div>
          </div>

          <div style={{ opacity: stepsAnim }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, margin: '0 0 10px 0' }}>📋 Pasos del técnico</p>
            {[
              'Apagar radar desde interruptor principal',
              'Verificar continuidad del cable coaxial',
              'Inspeccionar conectores PL-259',
              'Reemplazar cable si hay corrosión o daño',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: COLORS.blue, color: COLORS.white,
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral métricas */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Confianza', value: 'ALTA', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
            { label: 'RAG Context', value: '5 chunks', color: COLORS.blue, bg: COLORS.blueXlt, icon: '📚' },
            { label: 'Fuente', value: 'Pág. 8-3 Manual FAR15XX', color: '#6d28d9', bg: '#f5f3ff', icon: '📄' },
          ].map((m, i) => {
            const a = useScaleIn(25 + i * 12);
            return (
              <div key={i} style={{
                ...a,
                background: m.bg,
                borderRadius: 14, padding: 16,
                border: `1.5px solid ${m.color}30`,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <p style={{ fontSize: 11, fontWeight: 700, color: m.color, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{m.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <ProgressBar progress={interpolate(frame, [0, 150], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 6: Modelo de Negocio ────────────────────────────────────────────────
const SceneBusiness: React.FC = () => {
  const frame = useCurrentFrame();
  const titleAnim = useSlideUp(10);

  const metrics = [
    { label: '8 técnicos', sub: 'certificados en Chile', icon: '👨‍🔧', color: '#2563eb' },
    { label: '15%', sub: 'comisión por servicio', icon: '💰', color: '#16a34a' },
    { label: '$29/mes', sub: 'suscripción Pro técnico', icon: '⭐', color: '#d97706' },
    { label: '5 modelos', sub: 'Furuno indexados MVP', icon: '📡', color: '#7c3aed' },
  ];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1e3a5f 100%)`,
      fontFamily: FONT, padding: '60px 80px',
    }}>
      <SceneIndicator current={6} total={7} />

      <Badge label="Modelo de Negocio" color="#fbbf24" bg="#451a03" />

      <div style={{ ...titleAnim, marginTop: 20, marginBottom: 40 }}>
        <h2 style={{
          fontSize: 44, fontWeight: 800, color: COLORS.white, margin: 0,
        }}>
          Marketplace vertical para{' '}
          <span style={{ color: '#fbbf24' }}>técnicos marítimos</span>
        </h2>
        <p style={{ fontSize: 17, color: '#94a3b8', margin: '12px 0 0 0' }}>
          Flotas pesqueras y navieras medianas en LATAM — Dominio: AnclaIA.cl
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {metrics.map((m, i) => {
          const anim = useScaleIn(20 + i * 12);
          return (
            <div key={i} style={{
              ...anim, flex: 1,
              background: '#1e293b',
              borderRadius: 20, padding: '24px 20px',
              border: `1.5px solid ${m.color}30`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{m.icon}</div>
              <p style={{ fontSize: 26, fontWeight: 900, color: m.color, margin: '0 0 6px 0' }}>{m.label}</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{m.sub}</p>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 32, display: 'flex', gap: 16,
        opacity: useFadeIn(70, 20),
      }}>
        {['Diagnóstico IA pre-terreno', 'Chat con manuales Furuno', 'Matching técnico (próx. fase)', 'Scheduling automático (próx. fase)'].map((f, i) => (
          <div key={i} style={{
            flex: 1, background: '#0f172a', borderRadius: 12, padding: '12px 16px',
            border: '1px solid #334155', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              {f.includes('próx.') ? '🔜 ' : '✅ '}{f}
            </p>
          </div>
        ))}
      </div>

      <ProgressBar progress={interpolate(frame, [0, 150], [0, 1], { extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};

// ── ESCENA 7: Outro / CTA ──────────────────────────────────────────────────────
const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleAnim = useSlideUp(15);
  const linksAnim = useFadeIn(35, 25);
  const ctaAnim   = useScaleIn(50);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1e3a5f 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, gap: 0,
    }}>
      <div style={{
        width: 80, height: 80, background: COLORS.blue, borderRadius: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 40, transform: `scale(${logoScale})`,
        boxShadow: '0 16px 48px rgba(37,99,235,0.5)',
        marginBottom: 24,
      }}>
        ⚓
      </div>

      <div style={{ ...titleAnim, textAlign: 'center' }}>
        <h1 style={{
          fontSize: 64, fontWeight: 900, color: COLORS.white,
          margin: 0, letterSpacing: -2,
        }}>
          Ancla<span style={{ color: COLORS.blueLt }}>IA</span>
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', margin: '12px 0 0 0' }}>
          Diagnóstico técnico marítimo antes de ir a terreno
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 36, opacity: linksAnim }}>
        {[
          { label: 'github.com/devjaime/anclaIA', icon: '🐙' },
          { label: 'AnclaIA.cl', icon: '🌊' },
          { label: '@devjaime', icon: '👨‍💻' },
        ].map((l, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#1e293b', border: '1.5px solid #334155',
            borderRadius: 12, padding: '10px 18px',
          }}>
            <span style={{ fontSize: 18 }}>{l.icon}</span>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, fontWeight: 500 }}>{l.label}</p>
          </div>
        ))}
      </div>

      <div style={{
        ...ctaAnim,
        marginTop: 32,
        background: COLORS.blue,
        borderRadius: 16, padding: '14px 32px',
        boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
      }}>
        <p style={{ color: COLORS.white, fontSize: 16, fontWeight: 700, margin: 0 }}>
          🚀 Busca inversión seed · LATAM MarTech AI
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ── Composición principal ──────────────────────────────────────────────────────
const FPS = 30;

const SCENES = [
  { component: SceneIntro,    frames: 4 * FPS },   // 0-4s
  { component: SceneProblem,  frames: 6 * FPS },   // 4-10s
  { component: SceneSolution, frames: 6 * FPS },   // 10-16s
  { component: SceneStack,    frames: 6 * FPS },   // 16-22s
  { component: SceneDemoUI,   frames: 6 * FPS },   // 22-28s
  { component: SceneResult,   frames: 7 * FPS },   // 28-35s
  { component: SceneBusiness, frames: 6 * FPS },   // 35-41s
  { component: SceneOutro,    frames: 5 * FPS },   // 41-46s
];

export const AnclaIAVideo: React.FC = () => {
  let offset = 0;
  return (
    <AbsoluteFill>
      {SCENES.map(({ component: Scene, frames }, i) => {
        const from = offset;
        offset += frames;
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <Scene />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
