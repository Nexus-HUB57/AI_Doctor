import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   CSS KEYFRAMES — injected once via <style>
   ───────────────────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes w-float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes w-glow-pulse {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(6,182,212,0.4),
      0 0 60px rgba(6,182,212,0.15);
  }
  50% {
    box-shadow:
      0 0 40px rgba(6,182,212,0.7),
      0 0 100px rgba(6,182,212,0.3),
      0 0 160px rgba(59,130,246,0.12);
  }
}
@keyframes w-dna-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes w-twinkle {
  0%, 100% { opacity: var(--w-op); }
  50%      { opacity: 0.015; }
}
@keyframes w-subtle-breathe {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.75; }
}
`;

/* ─────────────────────────────────────────────────────────────
   Smooth deceleration cubic-bezier
   ───────────────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/* ─────────────────────────────────────────────────────────────
   Mission statement lines (Phase 4)
   ───────────────────────────────────────────────────────────── */
const MISSION_LINES = [
  "15 Especialistas PhD à sua disposição",
  "Inteligência Artificial fundamentada em ciência",
  "Porque cada vida merece uma segunda opinião",
] as const;

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  isCyan: boolean;
}

interface BasePair {
  id: number;
  y: number;
  leftX: number;
  rightX: number;
  leftDf: number;   // depth factor 0-1 for left dot
  rightDf: number;  // depth factor 0-1 for right dot
  connectorWidth: number;
}

interface WelcomeExperienceProps {
  onComplete: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Phase constants
   ───────────────────────────────────────────────────────────── */
const PHASE_DNA_START = 2;
const PHASE_LOGO_START = 3;
const PHASE_MISSION_START = 4;
const PHASE_ENTER_START = 5;

/* ═════════════════════════════════════════════════════════════
   WELCOME EXPERIENCE — Cinematic Oncology Intro
   ═════════════════════════════════════════════════════════════ */
export default function WelcomeExperience({ onComplete }: WelcomeExperienceProps) {
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Keep phase ref in sync for event handlers
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* ── Enter handler ─────────────────────────────────────── */
  const handleEnter = useCallback(() => {
    sessionStorage.setItem("ai_doctor_welcomed", "true");
    onCompleteRef.current();
  }, []);

  /* ── Skip to phase 5 ───────────────────────────────────── */
  const skipToEnd = useCallback(() => setPhase(PHASE_ENTER_START), []);

  /* ── Session check & phase timers ──────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("ai_doctor_welcomed")) {
      onCompleteRef.current();
      return;
    }

    // Kick off phase 1 immediately
    setPhase(1);

    const timers = [
      setTimeout(() => setPhase(PHASE_DNA_START), 3000),
      setTimeout(() => setPhase(PHASE_LOGO_START), 6000),
      setTimeout(() => setPhase(PHASE_MISSION_START), 9000),
      setTimeout(() => setPhase(PHASE_ENTER_START), 12000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  /* ── Keyboard handler ──────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = phaseRef.current;
      if (p >= 1 && p < PHASE_ENTER_START) {
        skipToEnd();
      } else if (p >= PHASE_ENTER_START && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skipToEnd, handleEnter]);

  /* ── Background click → skip ───────────────────────────── */
  const handleBgClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-enter-btn]")) return;
      const p = phaseRef.current;
      if (p >= 1 && p < PHASE_ENTER_START) skipToEnd();
    },
    [skipToEnd],
  );

  /* ── Particle system (seeded once) ─────────────────────── */
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.4,
        duration: 2 + Math.random() * 4,
        delay: Math.random() * 5,
        isCyan: Math.random() > 0.5,
      })),
    [],
  );

  /* ── DNA base-pairs (seeded once) ──────────────────────── */
  const basePairs = useMemo<BasePair[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i * Math.PI) / 5; // 2 full rotations over 20 pairs
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const leftDf = (sinA + 1) / 2;   // 0 → 1
        const rightDf = 1 - leftDf;
        return {
          id: i,
          y: i * 10,
          leftX: 50 * cosA,
          rightX: -50 * cosA,
          leftDf,
          rightDf,
          connectorWidth: Math.abs(100 * cosA),
        };
      }),
    [],
  );

  /* ── Don't render until session check completes ────────── */
  if (phase === 0) return null;

  /* ═══════════════════════════════════════════════════════
     R E N D E R
     ═══════════════════════════════════════════════════════ */
  return (
    <div
      onClick={handleBgClick}
      className="fixed inset-0 z-[9999] bg-black overflow-hidden cursor-pointer select-none"
    >
      {/* ── Injected keyframes ──────────────────────────── */}
      <style>{KEYFRAMES}</style>

      {/* ── Cinematic vignette overlay ──────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* ═══════════════════════════════════════════════════
          PHASE 1  ·  Particle Star Field
          ═══════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.isCyan
                  ? "rgba(6,182,212,0.85)"
                  : "rgba(255,255,255,0.9)",
                opacity: phase >= 1 ? p.opacity : 0,
                animation:
                  phase >= 1
                    ? `w-twinkle ${p.duration}s ease-in-out ${p.delay}s infinite`
                    : "none",
                "--w-op": String(p.opacity),
                transition: "opacity 2s ease-out",
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          PHASE 1  ·  Central Cyan Pulse
          ═══════════════════════════════════════════════════ */}
      <motion.div
        className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
        style={{
          width: 420,
          height: 420,
          marginLeft: -210,
          marginTop: -210,
          background:
            "radial-gradient(circle, rgba(6,182,212,0.14) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)",
        }}
        animate={
          phase === 1
            ? { opacity: [0.4, 1, 0.4], scale: [1, 1.18, 1] }
            : phase === PHASE_DNA_START
              ? { opacity: 0.9, scale: 1.35 }
              : { opacity: 0, scale: 2.2 }
        }
        transition={
          phase === 1
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : { duration: 1.8, ease: EASE }
        }
      />

      {/* ═══════════════════════════════════════════════════
          PHASE 2  ·  DNA Double Helix
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase >= PHASE_DNA_START && phase < PHASE_MISSION_START && (
          <motion.div
            className="absolute top-1/2 left-1/2 pointer-events-none"
            style={{
              width: 120,
              height: 200,
              marginLeft: -60,
              marginTop: -100,
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{
              opacity: phase === PHASE_DNA_START ? 1 : 0,
              scale: phase === PHASE_DNA_START ? 1 : 1.4,
            }}
            exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.4 } }}
            transition={{ duration: 1.6, ease: EASE }}
          >
            {/* Rotating helix container */}
            <div
              style={{
                animation: "w-dna-rotate 12s linear infinite",
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              {basePairs.map((pair) => {
                const leftDotSize = 3 + pair.leftDf * 4.5;
                const rightDotSize = 3 + pair.rightDf * 4.5;
                const leftDotOp = 0.15 + pair.leftDf * 0.85;
                const rightDotOp = 0.15 + pair.rightDf * 0.85;
                const connectorOp = Math.max(0.04, 1 - Math.abs(pair.leftDf - 0.5) * 2) * 0.25;

                return (
                  <motion.div
                    key={pair.id}
                    className="absolute left-0 right-0"
                    style={{ top: pair.y, height: 10 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: (pair.id) * 0.075,
                      duration: 0.55,
                      ease: EASE,
                    }}
                  >
                    {/* Connector (base pair bond) */}
                    {pair.connectorWidth > 4 && (
                      <div
                        className="absolute top-1/2 h-px"
                        style={{
                          width: pair.connectorWidth,
                          left: 60 - pair.connectorWidth / 2,
                          marginTop: -0.5,
                          background: `linear-gradient(90deg, rgba(6,182,212,${connectorOp}), rgba(59,130,246,${connectorOp}))`,
                        }}
                      />
                    )}

                    {/* Left strand dot (cyan) */}
                    <div
                      className="absolute top-1/2 rounded-full"
                      style={{
                        width: leftDotSize,
                        height: leftDotSize,
                        left: 60 + pair.leftX - leftDotSize / 2,
                        marginTop: -leftDotSize / 2,
                        opacity: leftDotOp,
                        background:
                          "radial-gradient(circle, #67e8f9 0%, #06b6d4 60%, #0284c7 100%)",
                        boxShadow: `0 0 ${3 + pair.leftDf * 8}px rgba(6,182,212,${0.25 + pair.leftDf * 0.55})`,
                      }}
                    />

                    {/* Right strand dot (blue) */}
                    <div
                      className="absolute top-1/2 rounded-full"
                      style={{
                        width: rightDotSize,
                        height: rightDotSize,
                        left: 60 + pair.rightX - rightDotSize / 2,
                        marginTop: -rightDotSize / 2,
                        opacity: rightDotOp,
                        background:
                          "radial-gradient(circle, #93c5fd 0%, #3b82f6 60%, #1d4ed8 100%)",
                        boxShadow: `0 0 ${3 + pair.rightDf * 8}px rgba(59,130,246,${0.25 + pair.rightDf * 0.55})`,
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          PHASE 3–4  ·  Logo + Tagline + Mission
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase >= PHASE_LOGO_START && phase < PHASE_ENTER_START && (
          <motion.div
            key="logo-mission"
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            {/* Heart icon with pulsing glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.3, ease: EASE }}
              className="mb-5"
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 100,
                  height: 100,
                  background:
                    "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
                  animation: "w-float 4s ease-in-out infinite, w-glow-pulse 3s ease-in-out infinite",
                }}
              >
                <Heart
                  size={80}
                  className="text-cyan-400"
                  style={{
                    filter:
                      "drop-shadow(0 0 24px rgba(6,182,212,0.65)) drop-shadow(0 0 48px rgba(59,130,246,0.3))",
                  }}
                />
              </div>
            </motion.div>

            {/* AI_Doctor title */}
            <motion.h1
              className="text-5xl md:text-6xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 1, ease: EASE }}
              style={{
                background:
                  "linear-gradient(135deg, #67e8f9 0%, #06b6d4 25%, #3b82f6 60%, #818cf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter:
                  "drop-shadow(0 0 32px rgba(6,182,212,0.55)) drop-shadow(0 0 64px rgba(59,130,246,0.2))",
              }}
            >
              AI_Doctor
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="mt-3 uppercase"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 0.65, y: 0 }}
              transition={{ delay: 0.65, duration: 1, ease: EASE }}
              style={{
                color: "#94a3b8",
                letterSpacing: "0.22em",
                fontSize: "0.8rem",
              }}
            >
              Oncologia de Precisão Humanizada
            </motion.p>

            {/* ── Phase 4: Mission statement ─────────────── */}
            <AnimatePresence>
              {phase >= PHASE_MISSION_START && (
                <motion.div
                  key="mission"
                  className="flex flex-col items-center mt-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {MISSION_LINES.map((text, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3.5 mb-4"
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.15,
                        duration: 0.85,
                        ease: EASE,
                      }}
                    >
                      {/* Cyan left-border accent */}
                      <motion.div
                        className="w-[3px] rounded-full origin-bottom"
                        initial={{ scaleY: 0, height: 18 }}
                        animate={{ scaleY: 1, height: 20 }}
                        transition={{
                          delay: i * 0.15 + 0.12,
                          duration: 0.65,
                          ease: EASE,
                        }}
                        style={{
                          background:
                            "linear-gradient(180deg, #22d3ee 0%, #3b82f6 100%)",
                          boxShadow: "0 0 10px rgba(6,182,212,0.6)",
                        }}
                      />
                      <span
                        className="text-sm md:text-base"
                        style={{ color: "rgba(203,213,225,0.9)" }}
                      >
                        {text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          PHASE 5  ·  Enter the Platform
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase >= PHASE_ENTER_START && (
          <motion.div
            key="enter-screen"
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: EASE }}
          >
            {/* Compact logo */}
            <motion.div
              className="flex items-center gap-2.5 mb-14"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            >
              <Heart
                size={26}
                className="text-cyan-400"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(6,182,212,0.5))",
                }}
              />
              <span
                className="text-2xl font-bold tracking-tight"
                style={{
                  background:
                    "linear-gradient(135deg, #67e8f9 0%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AI_Doctor
              </span>
            </motion.div>

            {/* Enter button */}
            <motion.button
              data-enter-btn
              onClick={(e) => {
                e.stopPropagation();
                handleEnter();
              }}
              className="relative px-10 py-4 text-lg font-bold text-white rounded-xl cursor-pointer border-0 outline-none focus:outline-none"
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.35, ease: EASE }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "linear-gradient(135deg, #0891b2 0%, #2563eb 100%)",
                boxShadow:
                  "0 0 30px rgba(6,182,212,0.2), 0 0 60px rgba(37,99,235,0.08), 0 4px 24px rgba(0,0,0,0.3)",
                transition: "box-shadow 0.35s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow =
                  "0 0 50px rgba(6,182,212,0.45), 0 0 100px rgba(37,99,235,0.2), 0 4px 32px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.boxShadow =
                  "0 0 30px rgba(6,182,212,0.2), 0 0 60px rgba(37,99,235,0.08), 0 4px 24px rgba(0,0,0,0.3)";
              }}
            >
              Entrar na Plataforma
            </motion.button>

            {/* Beta date */}
            <motion.p
              className="mt-7 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ delay: 0.75, duration: 0.9 }}
              style={{ color: "#64748b" }}
            >
              Beta Go Live&nbsp; •&nbsp; Julho 2026
            </motion.p>

            {/* Pulsing "press Enter" hint */}
            <motion.p
              className="mt-3 text-xs"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.25, 0.6, 0.25],
              }}
              transition={{
                delay: 1.1,
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ color: "#475569" }}
            >
              pressione Enter ou clique para continuar
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          SKIP HINT  ·  Phases 1–4
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase >= 1 && phase < PHASE_ENTER_START && (
          <motion.div
            key="skip-hint"
            className="absolute bottom-8 left-0 right-0 text-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.22 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="text-xs tracking-wide"
              style={{ color: "#64748b" }}
            >
              pressione qualquer tecla ou clique para avançar
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}