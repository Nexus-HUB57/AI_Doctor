import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import {
  Heart,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader,
  Brain,
  Users,
  Shield,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   CSS KEYFRAMES — injected once via <style>
   ───────────────────────────────────────────── */
const KEYFRAMES_CSS = `
@keyframes gopulse-ring {
  0%   { transform: scale(0.6); opacity: 0.55; }
  100% { transform: scale(2.8); opacity: 0; }
}
@keyframes gopulse-heart {
  0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 12px rgba(6,182,212,0.5)); }
  14%      { transform: scale(1.18); filter: drop-shadow(0 0 28px rgba(6,182,212,0.9)); }
  28%      { transform: scale(1);   filter: drop-shadow(0 0 12px rgba(6,182,212,0.5)); }
  42%      { transform: scale(1.12); filter: drop-shadow(0 0 22px rgba(6,182,212,0.7)); }
}
@keyframes godrift {
  0%, 100% { transform: translate(0, 0) scale(1);   opacity: 0.35; }
  25%      { transform: translate(8px,-14px) scale(1.15); opacity: 0.6; }
  50%      { transform: translate(-6px,-22px) scale(0.9);  opacity: 0.25; }
  75%      { transform: translate(12px,-8px) scale(1.1);   opacity: 0.5; }
}
@keyframes goecg-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes goecg-scan {
  0%   { left: 0%;   opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
@keyframes gospin {
  to { transform: rotate(360deg); }
}
.animate-gopulse-ring {
  animation: gopulse-ring 3s cubic-bezier(0.215,0.61,0.355,1) infinite;
}
.animate-gopulse-heart {
  animation: gopulse-heart 1.6s ease-in-out infinite;
}
/* godrift is applied via inline styles with randomized duration/delay */
.animate-goecg-draw {
  animation: goecg-draw 2.4s ease-in-out forwards;
}
.animate-goecg-scan {
  animation: goecg-scan 2.4s ease-in-out forwards;
}
.animate-gospin {
  animation: gospin 1s linear infinite;
}
`;

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

/** Small inline SVG noise data-URI for texture overlay */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

/** Generate floating particle configs */
function makeParticles(count: number) {
  const particles: { id: number; x: number; y: number; size: number; dur: number; del: number }[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      dur: 6 + Math.random() * 8,
      del: Math.random() * 6,
    });
  }
  return particles;
}

/** ECG waveform path — flat, spike, flat, spike, flat */
const ECG_PATH =
  'M0,30 L60,30 L70,30 L80,10 L90,50 L100,5 L110,45 L120,30 L130,30 L200,30 L260,30 L270,30 L280,10 L290,50 L300,5 L310,45 L320,30 L330,30 L400,30';
const ECG_LENGTH = 420;

/* ─────────────────────────────────────────────
   DEV-ONLY TEST CREDENTIALS (stripped in production)
   ───────────────────────────────────────────── */
const IS_DEV = process.env.NODE_ENV !== 'production';
const TEST_CREDS = IS_DEV ? [
  { label: 'Paciente',    email: 'patient@example.com',    password: 'password123', icon: Heart,        color: 'text-emerald-400' },
  { label: 'Médico',      email: 'doctor@example.com',     password: 'password123', icon: Shield,       color: 'text-cyan-400' },
  { label: 'Pesquisador', email: 'researcher@example.com', password: 'password123', icon: FlaskConical, color: 'text-purple-400' },
  { label: 'Admin',       email: 'admin@example.com',      password: 'admin123',    icon: Users,        color: 'text-amber-400' },
] as const : [] as const;

/* ─────────────────────────────────────────────
   ROLE OPTIONS (register)
   ───────────────────────────────────────────── */
const ROLE_OPTIONS = [
  { value: UserRole.PATIENT,    label: 'Paciente',    icon: Heart,        desc: 'Acesso ao diagnóstico' },
  { value: UserRole.DOCTOR,     label: 'Médico',      icon: Shield,       desc: 'Junta e laudos' },
  { value: UserRole.RESEARCHER, label: 'Pesquisador', icon: FlaskConical, desc: 'Dados e análises' },
] as const;

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function GoLiveLoginPage() {
  const { login, register } = useAuth();

  /* ── state ── */
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreds, setShowCreds] = useState(IS_DEV ? false : false);
  const [shakeKey, setShakeKey] = useState(0);

  /* ── derived ── */
  const particles = useMemo(() => makeParticles(26), []);

  /* ── handlers ── */
  const handleAutoFill = useCallback((cred: (typeof TEST_CREDS)[number]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  }, []);

  const switchMode = useCallback((m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setRole(UserRole.PATIENT);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, name, password, role);
      }
    } catch (err) {
      const msg = (err as Error).message || 'Erro ao processar requisição';
      setError(msg);
      setShakeKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── shared variants ── */
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    }),
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <>
      {/* ── Global CSS ── */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />

      <div className="min-h-screen flex bg-slate-950 relative overflow-hidden">
        {/* ══════════════════════════════════════════
            LEFT PANEL — "The Promise"
            ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="hidden md:flex relative w-[60%] min-h-screen flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, #020617 0%, rgba(8,145,178,0.08) 50%, #020617 100%)',
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* Noise texture */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat' }}
          />

          {/* Floating particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-cyan-400/50 pointer-events-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                animation: `godrift ${p.dur}s ease-in-out ${p.del}s infinite`,
              }}
            />
          ))}

          {/* Concentric pulse rings */}
          <div className="absolute flex items-center justify-center">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border border-cyan-500/30 animate-gopulse-ring"
                style={{
                  width: 120 + i * 90,
                  height: 120 + i * 90,
                  animationDelay: `${i * 0.75}s`,
                }}
              />
            ))}
          </div>

          {/* Pulsing Heart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 mb-8"
          >
            <div className="animate-gopulse-heart">
              <Heart className="w-20 h-20 text-cyan-400" strokeWidth={1.5} fill="rgba(6,182,212,0.15)" />
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative z-10 text-center px-8 max-w-lg"
          >
            <p className="text-[11px] font-mono tracking-[0.3em] text-cyan-500/70 uppercase mb-4">
              AI_DOCTOR v3.0 — GO LIVE BETA
            </p>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              O futuro da oncologia
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                começa aqui
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Plataforma de inteligência artificial médica com 15 especialistas PhD
              trabalhando por você
            </p>
          </motion.div>

          {/* ECG heartbeat line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="relative z-10 mt-12 w-full max-w-md px-4"
          >
            <div className="relative h-12 overflow-hidden">
              <svg
                viewBox="0 0 400 60"
                className="w-full h-full"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d={ECG_PATH}
                  stroke="rgba(6,182,212,0.4)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={ECG_PATH}
                  stroke="rgba(6,182,212,1)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={ECG_LENGTH}
                  strokeDashoffset={ECG_LENGTH}
                  className="animate-goecg-draw"
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))',
                  }}
                />
              </svg>
              {/* Scan line */}
              <div className="absolute top-0 bottom-0 w-[2px] bg-cyan-400/60 animate-goecg-scan" style={{ boxShadow: '0 0 12px 2px rgba(6,182,212,0.5)' }} />
            </div>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="relative z-10 flex gap-6 mt-14"
          >
            {[
              { icon: Brain, text: 'Diagnóstico Assistido por IA' },
              { icon: Users, text: 'Junta Médica PhD' },
              { icon: Heart, text: 'Telemedicina 24/7' },
            ].map((badge) => (
              <div
                key={badge.text}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 transition-colors duration-300">
                  <badge.icon className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 transition-colors" />
                </div>
                <span className="text-[10px] text-slate-500 font-medium text-center max-w-[90px] leading-tight">
                  {badge.text}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Bottom version bar */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/30 border border-slate-700/20">
              <Activity className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-mono text-slate-600 tracking-wide">
                SISTEMA OPERACIONAL • GO LIVE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — "The Gateway"
            ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="w-full md:w-[40%] min-h-screen flex items-center justify-center relative"
          style={{ background: 'rgba(2,6,23,0.97)' }}
        >
          {/* Subtle side glow */}
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent hidden md:block" />

          <div className="w-full max-w-md px-6 py-10 md:px-8">
            {/* ── Mobile logo ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:hidden flex items-center justify-center gap-3 mb-8"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-white leading-none">AI Doctor</p>
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Go Live Beta</p>
              </div>
            </motion.div>

            {/* ── Logo section (desktop) ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex items-center gap-3 mb-10"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white leading-none">AI Doctor</p>
                <p className="text-xs text-slate-500 mt-0.5">Plataforma Médica</p>
              </div>
            </motion.div>

            {/* ── Tab Toggle ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative flex mb-8 border-b border-slate-800"
            >
              {(['login', 'register'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchMode(tab)}
                  className="relative flex-1 pb-3 text-sm font-semibold tracking-wide transition-colors duration-200 z-10"
                >
                  <span className={mode === tab ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-400'}>
                    {tab === 'login' ? 'Entrar' : 'Criar Conta'}
                  </span>
                  {mode === tab && (
                    <motion.div
                      layoutId="golive-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </motion.div>

            {/* ── Form ── */}
            <motion.form
              key={shakeKey}
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={
                error
                  ? { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }
                  : { x: 0 }
              }
              className="space-y-5"
            >
              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    role="alert"
                    aria-live="assertive"
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </motion.div>

              {/* Name (register) */}
              {mode === 'register' && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, height: 0 }}
                  custom={1}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder="Nome completo"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </motion.div>
              )}

              {/* Password */}
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={mode === 'register' ? 2 : 1}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Senha"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </motion.div>

              {/* Role selector (register) */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Usuário</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {ROLE_OPTIONS.map((opt) => {
                        const isSelected = role === opt.value;
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            onClick={() => setRole(opt.value)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border-2 transition-colors duration-200 ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                            }`}
                            style={
                              isSelected
                                ? { boxShadow: '0 0 16px -2px rgba(6,182,212,0.3)' }
                                : undefined
                            }
                          >
                            <opt.icon
                              className={`w-5 h-5 transition-colors ${
                                isSelected ? 'text-cyan-400' : 'text-slate-500'
                              }`}
                            />
                            <span
                              className={`text-xs font-semibold transition-colors ${
                                isSelected ? 'text-cyan-300' : 'text-slate-400'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="text-[9px] text-slate-600 leading-tight">{opt.desc}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={mode === 'register' ? 4 : 2}>
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.01 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: submitting
                      ? undefined
                      : 'linear-gradient(135deg, rgba(8,145,178,1) 0%, rgba(37,99,235,1) 100%)',
                    boxShadow: '0 4px 24px -4px rgba(6,182,212,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background =
                        'linear-gradient(135deg, rgba(6,182,212,1) 0%, rgba(59,130,246,1) 100%)';
                      e.currentTarget.style.boxShadow = '0 8px 32px -4px rgba(6,182,212,0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background =
                        'linear-gradient(135deg, rgba(8,145,178,1) 0%, rgba(37,99,235,1) 100%)';
                      e.currentTarget.style.boxShadow = '0 4px 24px -4px rgba(6,182,212,0.3)';
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-gospin" />
                      <span>{mode === 'login' ? 'Autenticando...' : 'Criando conta...'}</span>
                    </>
                  ) : (
                    <span>{mode === 'login' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}</span>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>

            {/* ── Test Credentials (login only, DEV only) ── */}
            <AnimatePresence>
              {IS_DEV && mode === 'login' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-6 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setShowCreds((v) => !v)}
                    className="w-full flex items-center justify-between py-2 px-1 text-xs font-semibold text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Credenciais de teste
                    </span>
                    {showCreds ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showCreds && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 mt-1 p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                          {TEST_CREDS.map((cred) => (
                            <button
                              key={cred.label}
                              type="button"
                              onClick={() => handleAutoFill(cred)}
                              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700/30 transition-colors duration-150 text-left group"
                            >
                              <div
                                className={`w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center flex-shrink-0 group-hover:border-cyan-500/30 transition-colors`}
                              >
                                <cred.icon className={`w-3.5 h-3.5 ${cred.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-300">{cred.label}</p>
                                <p className="text-[10px] font-mono text-slate-600 truncate">
                                  {cred.email}
                                </p>
                              </div>
                              <span className="text-[9px] text-slate-700 group-hover:text-cyan-600 transition-colors font-medium flex-shrink-0">
                                PREENCHER
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Footer ── */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-slate-600 text-xs mt-10 leading-relaxed"
            >
              Protegido por criptografia AES-256 • Conforme LGPD
            </motion.p>
          </div>
        </motion.div>
      </div>
    </>
  );
}