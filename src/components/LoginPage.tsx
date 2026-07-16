import React, { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Heart, Mail, Lock, User, AlertCircle, Loader, Shield, Dna, FlaskConical } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PATIENT);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, name, password, role);
      }
    } catch (err) {
      setError((err as Error).message || 'Erro ao processar requisição');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/30">
            <Heart className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-1">AI Doctor</h1>
          <p className="text-slate-400 text-sm">Plataforma de Inteligência Artificial Médica</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">
                {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
              </h2>
              <p className="text-slate-400 text-sm">
                {isLogin
                  ? 'Faça login para acessar a plataforma'
                  : 'Preencha os dados para se registrar'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Name (Register only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="João Silva"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Role (Register only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Tipo de Usuário
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: UserRole.PATIENT, label: 'Paciente', icon: Heart, color: 'from-green-500 to-emerald-600' },
                      { value: UserRole.DOCTOR, label: 'Médico', icon: Shield, color: 'from-blue-500 to-cyan-600' },
                      { value: UserRole.RESEARCHER, label: 'Pesquisador', icon: FlaskConical, color: 'from-purple-500 to-pink-600' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value as UserRole)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          role === opt.value
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                        }`}
                      >
                        <opt.icon className={`w-5 h-5 mx-auto mb-1 ${
                          role === opt.value ? 'text-cyan-400' : 'text-slate-500'
                        }`} />
                        <span className={`text-xs font-medium ${
                          role === opt.value ? 'text-cyan-300' : 'text-slate-400'
                        }`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </button>
            </form>

            {/* Test Credentials */}
            {isLogin && (
              <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
                <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Dna className="w-3.5 h-3.5" />
                  Credenciais de Teste
                </p>
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paciente:</span>
                    <span className="font-mono">patient@example.com / password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Médico:</span>
                    <span className="font-mono">doctor@example.com / password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pesquisador:</span>
                    <span className="font-mono">researcher@example.com / password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Admin:</span>
                    <span className="font-mono">admin@example.com / admin123</span>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setName('');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  {isLogin ? 'Registre-se' : 'Faça login'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          AI Doctor v3.0 — Fase 8: Segurança JWT + RBAC
        </p>
      </div>
    </div>
  );
};

export default LoginPage;