'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Brain,
  Users,
  Shield,
  Lock,
  Eye,
  FileCheck,
  Server,
  Sparkles,
  ChevronRight,
  SkipForward,
} from 'lucide-react';

interface PatientOnboardingProps {
  userName: string;
  onComplete: () => void;
}

const STORAGE_KEY = 'ai_doctor_onboarded';

/* ------------------------------------------------------------------ */
/*  Tiny reusable helpers                                              */
/* ------------------------------------------------------------------ */

function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-shadow hover:shadow-cyan-500/40 disabled:opacity-40"
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </motion.button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-transparent px-6 py-3.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
    >
      {children}
    </motion.button>
  );
}

function NumberCircle({ n }: { n: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.15, 1] }}
      transition={{ duration: 0.5, ease: 'easeOut', times: [0, 0.6, 1] }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/30"
    >
      {n}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkle particles for Step 4                                       */
/* ------------------------------------------------------------------ */

function SparkleParticles() {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: (Math.cos((i / 8) * Math.PI * 2) * 60 + (Math.random() - 0.5) * 30),
    y: (Math.sin((i / 8) * Math.PI * 2) * 60 + (Math.random() - 0.5) * 30),
    size: Math.random() * 4 + 2,
    delay: i * 0.15,
    duration: Math.random() * 2 + 2,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-400"
          style={{ width: p.size, height: p.size }}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.2, 0],
            x: [0, p.x],
            y: [0, p.y],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

function Step1Welcome({ userName, onNext }: { userName: string; onNext: () => void }) {
  const features = [
    {
      icon: Brain,
      title: 'Diagnóstico Inteligente',
      desc: 'IA analisa seu caso com precisão',
    },
    {
      icon: Users,
      title: 'Junta de Especialistas',
      desc: '15 PhDs deliberam juntos',
    },
    {
      icon: Heart,
      title: 'Apoio Humanizado',
      desc: 'Telemedicina acolhedora 24h',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 px-6 py-10 sm:px-10">
      {/* Heart with pulse */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl" />
          <div className="relative rounded-full bg-slate-800/80 p-5">
            <Heart className="h-12 w-12 text-cyan-400" strokeWidth={1.5} />
          </div>
        </motion.div>
      </div>

      {/* Greeting */}
      <div className="text-center">
        <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
          Bem-vindo ao AI_Doctor
          <br />
          <GradientText>, {userName}!</GradientText>
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-400">
          Estamos aqui para apoiar você em cada etapa da sua jornada
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            whileHover={{ borderColor: 'rgba(6,182,212,0.3)', y: -2 }}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-700/30 bg-slate-800/50 p-4 text-center transition-colors"
          >
            <f.icon className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-white">{f.title}</span>
            <span className="text-xs leading-snug text-slate-500">{f.desc}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <PrimaryButton onClick={onNext}>Continuar</PrimaryButton>
    </div>
  );
}

function Step2HowItWorks({ onNext }: { onNext: () => void }) {
  const steps = [
    {
      n: 1,
      title: 'Seus dados são analisados',
      desc: 'Informações clínicas e genômicas são processadas com segurança',
    },
    {
      n: 2,
      title: 'A IA gera um diagnóstico',
      desc: 'Algoritmos de ponta cruzam dados com literatura médica mundial',
    },
    {
      n: 3,
      title: 'A Junta Médica delibera',
      desc: '15 especialistas PhD revisam e validam cada caso',
    },
    {
      n: 4,
      title: 'Você recebe orientação',
      desc: 'Um plano personalizado com as melhores opções de tratamento',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 px-6 py-10 sm:px-10">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          Sua jornada no <GradientText>AI_Doctor</GradientText>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Entenda como a plataforma trabalha para você
        </p>
      </div>

      {/* Timeline */}
      <div className="flex w-full max-w-md flex-col gap-0">
        {steps.map((s, i) => (
          <div key={s.n} className="relative flex gap-4">
            {/* Vertical connecting line */}
            {i < steps.length - 1 && (
              <div className="absolute left-5 top-10 h-[calc(100%-1.5rem)] w-px border-l border-dashed border-cyan-500/40" />
            )}

            <NumberCircle n={s.n} />

            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
              className="pb-7"
            >
              <h3 className="text-sm font-bold text-white">{s.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.desc}</p>
            </motion.div>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext}>Entendi, continuar</PrimaryButton>
    </div>
  );
}

function Step3Privacy({ onNext }: { onNext: () => void }) {
  const items = [
    {
      icon: Shield,
      title: 'Criptografia AES-256',
      desc: 'Seus dados estão sempre protegidos',
    },
    {
      icon: Lock,
      title: 'Controle total',
      desc: 'Você decide quem acessa suas informações',
    },
    {
      icon: Eye,
      title: 'Transparência',
      desc: 'Entenda exatamente como seus dados são usados',
    },
    {
      icon: FileCheck,
      title: 'Conforme LGPD',
      desc: 'Seguimos a legislação brasileira de proteção de dados',
    },
    {
      icon: Server,
      title: 'Servidor seguro',
      desc: 'Infraestrutura protegida e monitorada 24/7',
    },
    {
      icon: Heart,
      title: 'Cuidado humano',
      desc: 'Tecnologia a serviço da empatia, não o contrário',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 px-6 py-10 sm:px-10">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          Sua privacidade é nossa <GradientText>prioridade</GradientText>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Protegemos seus dados como se fossem nossos
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
            className="flex flex-col gap-2 rounded-xl bg-slate-800/30 p-4"
          >
            <item.icon className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-white">{item.title}</span>
            <span className="text-xs leading-snug text-slate-500">{item.desc}</span>
          </motion.div>
        ))}
      </div>

      <PrimaryButton onClick={onNext}>Estou seguro, continuar</PrimaryButton>
    </div>
  );
}

function Step4Ready({
  userName,
  onComplete,
}: {
  userName: string;
  onComplete: () => void;
}) {
  const quote =
    'A cada diagnóstico, uma esperança. A cada consenso, uma oportunidade. Você não está sozinho nessa jornada.';

  const words = quote.split(' ');

  const handleComplete = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    onComplete();
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 px-6 py-10 sm:px-10">
      {/* Sparkles with particles */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        <SparkleParticles />
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl" />
            <Sparkles
              className="relative h-14 w-14 text-cyan-400 drop-shadow-lg"
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          Tudo pronto, <GradientText>{userName}!</GradientText>
        </h2>
        <p className="mt-2 text-sm text-slate-400">Sua jornada de cuidado começa agora</p>
      </div>

      {/* Motivational quote — word-by-word fade-in */}
      <div className="flex max-w-md flex-wrap justify-center gap-x-1.5 gap-y-1 px-4 text-center">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
            className="text-sm italic leading-relaxed text-slate-300"
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <PrimaryButton onClick={handleComplete}>Começar agora</PrimaryButton>
        <GhostButton onClick={handleComplete}>Pular tutorial</GhostButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                             */
/* ------------------------------------------------------------------ */

export default function PatientOnboarding({ userName, onComplete }: PatientOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  /* If already onboarded, skip immediately */
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      onComplete();
      return;
    }
    setMounted(true);
  }, [onComplete]);

  const totalSteps = 4;
  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const skipToEnd = useCallback(() => {
    setCurrentStep(totalSteps - 1);
  }, []);

  /* Don't render anything while checking sessionStorage */
  if (!mounted) return null;

  const stepVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/95 shadow-2xl shadow-cyan-500/10"
      >
        {/* ---- Progress bar ---- */}
        <div className="h-[3px] w-full bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            initial={{ width: '25%' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          />
        </div>

        {/* ---- Skip button ---- */}
        {currentStep < totalSteps - 1 && (
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={skipToEnd}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Pular
            </button>
          </div>
        )}

        {/* ---- Step content ---- */}
        <div className="relative min-h-[440px] sm:min-h-[420px]">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <Step1Welcome userName={userName} onNext={goNext} />
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step-1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <Step2HowItWorks onNext={goNext} />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step-2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <Step3Privacy onNext={goNext} />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step-3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
              >
                <Step4Ready userName={userName} onComplete={onComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}