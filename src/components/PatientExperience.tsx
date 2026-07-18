import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Brain,
  Users,
  Calendar,
  Pill,
  ClipboardList,
  Bell,
  Activity,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

interface PatientExperienceProps {
  onNavigate: (tab: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════
   Seeded Data — motivational sentences that rotate in the Hero
   ═══════════════════════════════════════════════════════════════════ */

const HERO_SENTENCES = [
  "Sua jornada de cuidado começa aqui. Estamos com você a cada passo.",
  "A precisão da medicina moderna, com o calor que você merece.",
  "Hoje é mais um dia de avanço. Confie no processo.",
  "Cada detalhe do seu caso importa — e nós não perdemos nenhum.",
  "Você não está sozinho. 15 especialistas pensam em você agora.",
  "A ciência evoluiu para atender pessoas reais. Como você.",
  "Respirar fundo, dar um passo de cada vez. A cura é caminho, não destino.",
] as const;

/* ═══════════════════════════════════════════════════════════════════
   Daily Inspirational Quotes — one per day of the week
   ═══════════════════════════════════════════════════════════════════ */

const QUOTES = [
  "A cada diagnóstico, uma esperança renovada. A ciência avança todos os dias, e você não está sozinho nessa jornada.",
  "Seu corpo é único, e merece um tratamento igualmente único. Por isso 15 especialistas trabalham juntos por você.",
  "A imunoterapia de hoje era ciência ficção há 10 anos. O amanhã traz promessas que ainda não imaginamos.",
  "Você é mais que um paciente. É uma pessoa com história, sonhos e uma força que a medicina aprende a respeitar.",
  "Cada exame, cada resultado, cada passo nos aproxima da resposta certa. A precisão salva vidas.",
  "A cura não é um destino — é uma jornada. E nessa jornada, você tem uma equipe inteira ao seu lado.",
  "A esperança é o melhor remédio. Deixe a ciência cuidar do resto.",
] as const;

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */

/** Returns a warm greeting based on the current hour */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Pick today's quote using the day-of-week index */
function getDailyQuoteIndex(): number {
  return new Date().getDay();
}

/** Animation easing — gentle and organic */
const ORGANIC_EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/* ═══════════════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════════════ */

/* ── Breathing Background Orbs ──────────────────────────────────── */

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Warm cyan orb — top-right drift */}
      <motion.div
        className="absolute -top-24 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/8 blur-[120px]"
        animate={{ x: [0, -40, 20, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Deep purple orb — bottom-left drift */}
      <motion.div
        className="absolute -bottom-32 -left-20 h-[400px] w-[400px] rounded-full bg-purple-500/6 blur-[100px]"
        animate={{ x: [0, 30, -10, 0], y: [0, -25, 15, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Emerald whisper — center-left */}
      <motion.div
        className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-emerald-500/4 blur-[90px]"
        animate={{ x: [0, -20, 15, 0], y: [0, 15, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Pulsing Heart Icon ────────────────────────────────────────── */

function PulsingHeart() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-12 w-12 rounded-full bg-rose-500/10"
        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-8 w-8 rounded-full bg-rose-500/15"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <Heart className="relative h-6 w-6 text-rose-400" fill="currentColor" />
    </div>
  );
}

/* ── Zone 1: Hero Card ─────────────────────────────────────────── */

interface HeroCardProps {
  sentence: string;
  sentenceIndex: number;
}

function HeroCard({ sentence, sentenceIndex }: HeroCardProps) {
  const greeting = useMemo(() => getGreeting(), []);
  const patientName = "Maria"; // seeded for demo — would come from auth context

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 p-8 sm:p-10"
      animate={{ scale: [1.0, 1.015, 1.0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Subtle inner glow */}
      <div className="pointer-events-none absolute -top-1/2 -right-1/4 h-full w-1/2 rounded-full bg-cyan-400/5 blur-[80px]" />

      <div className="relative z-10 flex items-start justify-between">
        {/* Left: Greeting + Rotating Sentence */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <PulsingHeart />
            <div>
              <p className="text-sm font-medium tracking-wide text-slate-400">
                {greeting},
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
                {patientName}
              </h1>
            </div>
          </div>

          {/* Crossfading motivational sentence */}
          <div className="relative h-12 w-full overflow-hidden sm:h-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={sentenceIndex}
                className="absolute inset-0 flex items-center text-base leading-relaxed text-slate-300 sm:text-lg"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.8, ease: ORGANIC_EASE }}
              >
                {sentence}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Decorative breathing ring (desktop only) */}
        <motion.div
          className="hidden items-center justify-center sm:flex"
          animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-28 w-28 rounded-full border border-cyan-400/20" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Zone 2: Quick Action Card ─────────────────────────────────── */

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  ringClass: string;
  onClick: () => void;
  index: number;
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  accentClass,
  ringClass,
  onClick,
  index,
}: QuickActionCardProps) {
  return (
    <motion.button
      type="button"
      className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/60 p-5 text-left backdrop-blur-sm transition-colors hover:border-slate-600/60"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: ORGANIC_EASE }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Hover glow — fades in on hover via group */}
      <div className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${accentClass} transition-opacity duration-500 group-hover:opacity-10`} />

      <div className="relative z-10 space-y-4">
        {/* Icon circle */}
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${ringClass}`}
        >
          {icon}
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight text-slate-100">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">{subtitle}</p>
        </div>
      </div>
    </motion.button>
  );
}

/* ── Zone 3: Metric Card ───────────────────────────────────────── */

interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  index: number;
  hasUnread?: boolean;
  barColor?: string;
}

function MetricCard({ icon, value, label, index, hasUnread, barColor }: MetricCardProps) {
  return (
    <motion.div
      className="relative flex h-full w-[160px] min-w-[160px] flex-col items-start gap-3 rounded-xl border border-slate-700/30 bg-slate-800/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.45, ease: ORGANIC_EASE }}
    >
      {/* Icon */}
      <div className="relative">
        <div className="text-slate-400">{icon}</div>
        {hasUnread && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
        )}
      </div>

      {/* Value + optional health bar */}
      <div className="w-full space-y-1.5">
        {barColor ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: "72%" }}
              transition={{ delay: 0.8 + index * 0.1, duration: 1, ease: ORGANIC_EASE }}
            />
          </div>
        ) : null}
        <p className="text-sm font-medium leading-snug text-slate-200">{value}</p>
      </div>

      {/* Label */}
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
    </motion.div>
  );
}

/* ── Zone 4: Daily Quote with word-by-word animation ───────────── */

function DailyQuoteSection() {
  const quoteIndex = useMemo(() => getDailyQuoteIndex(), []);
  const quote = QUOTES[quoteIndex];

  const words = useMemo(() => quote.split(" "), [quote]);

  return (
    <motion.section
      className="relative rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 sm:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6, ease: ORGANIC_EASE }}
    >
      {/* Vertical cyan accent line */}
      <div className="absolute left-6 top-8 h-6 w-1 rounded-full bg-cyan-400/60 sm:left-8 sm:top-10" />

      <p className="pl-4 text-base leading-relaxed italic text-slate-300 sm:pl-5 sm:text-lg sm:leading-loose">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="mr-[0.3em] inline-block"
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 1.3 + i * 0.04,
              duration: 0.4,
              ease: ORGANIC_EASE,
            }}
          >
            {word}
          </motion.span>
        ))}
      </p>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */

export default function PatientExperience({ onNavigate }: PatientExperienceProps) {
  /* ── State: which hero sentence is visible ──────────────────── */
  const [sentenceIndex, setSentenceIndex] = useState(0);

  /* ── Memoized data (seeded, no API calls for shell) ─────────── */
  const metrics = useMemo(
    () => [
      {
        icon: <Activity className="h-4 w-4" />,
        value: "Estável",
        label: "Estado Geral",
        barColor: "bg-emerald-400",
      },
      {
        icon: <Calendar className="h-4 w-4" />,
        value: "15 de Julho, 14:00",
        label: "Próxima Consulta",
      },
      {
        icon: <Pill className="h-4 w-4" />,
        value: "3 ativas",
        label: "Medicações",
      },
      {
        icon: <ClipboardList className="h-4 w-4" />,
        value: "2 aguardando resultado",
        label: "Exames Pendentes",
      },
      {
        icon: <Bell className="h-4 w-4" />,
        value: "1 nova recomendação",
        label: "Mensagens da Junta",
        hasUnread: true,
      },
    ],
    [],
  );

  /* ── Rotate hero sentence every 8 seconds ──────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setSentenceIndex((prev) => (prev + 1) % HERO_SENTENCES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  /* ── Navigation handlers ───────────────────────────────────── */
  const handleTelemedicine = useCallback(
    () => onNavigate("telemedicine"),
    [onNavigate],
  );

  const handleDiagnostic = useCallback(
    () => onNavigate("diagnostic"),
    [onNavigate],
  );

  const handleBoard = useCallback(
    () => onNavigate("board"),
    [onNavigate],
  );

  /* ── Current hero sentence ─────────────────────────────────── */
  const currentSentence = HERO_SENTENCES[sentenceIndex];

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      {/* Ambient breathing orbs */}
      <BackgroundOrbs />

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* ─── Zone 1: Hero Card ─────────────────────────────── */}
        <HeroCard sentence={currentSentence} sentenceIndex={sentenceIndex} />

        {/* ─── Zone 2: Quick Actions ─────────────────────────── */}
        <section>
          <motion.h2
            className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            Ações rápidas
          </motion.h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickActionCard
              title="Conversar com Especialistas"
              subtitle="15 PhDs prontos para ouvir você"
              icon={<Heart className="h-4 w-4 text-cyan-300" />}
              accentClass="from-cyan-500/10 to-transparent"
              ringClass="bg-cyan-500/15 ring-1 ring-cyan-400/30"
              onClick={handleTelemedicine}
              index={0}
            />
            <QuickActionCard
              title="Meu Diagnóstico"
              subtitle="Análise personalizada do seu caso"
              icon={<Brain className="h-4 w-4 text-purple-300" />}
              accentClass="from-purple-500/10 to-transparent"
              ringClass="bg-purple-500/15 ring-1 ring-purple-400/30"
              onClick={handleDiagnostic}
              index={1}
            />
            <QuickActionCard
              title="Junta Médica"
              subtitle="Consenso multidisciplinar"
              icon={<Users className="h-4 w-4 text-emerald-300" />}
              accentClass="from-emerald-500/10 to-transparent"
              ringClass="bg-emerald-500/15 ring-1 ring-emerald-400/30"
              onClick={handleBoard}
              index={2}
            />
          </div>
        </section>

        {/* ─── Zone 3: Health Profile (Horizontal Scroll) ────── */}
        <section>
          <motion.h2
            className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Seu Perfil de Saúde
          </motion.h2>

          <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
            {metrics.map((metric, i) => (
              <MetricCard
                key={metric.label}
                icon={metric.icon}
                value={metric.value}
                label={metric.label}
                index={i}
                hasUnread={"hasUnread" in metric ? metric.hasUnread : undefined}
                barColor={"barColor" in metric ? metric.barColor : undefined}
              />
            ))}
          </div>
        </section>

        {/* ─── Zone 4: Daily Inspirational Quote ─────────────── */}
        <DailyQuoteSection />

        {/* ─── Zone 5: Footer ────────────────────────────────── */}
        <motion.footer
          className="pt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
        >
          <p className="text-xs text-slate-600">
            AI_Doctor v4.0 · Beta Go Live · Julho 2026
          </p>
        </motion.footer>
      </div>
    </div>
  );
}