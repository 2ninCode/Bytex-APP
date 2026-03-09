import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, Check, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BytexIcon } from '../components/ui/BytexIcon';
import { cn } from '../components/ui/utils';
import { Employee, Role } from '../types';
import { supabase } from '../lib/supabase';

export const LoginView = ({ onLogin }: { onLogin: (employee: Employee) => void }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    if (!loginId.trim() || !password.trim()) { setError('Preencha ID e senha.'); return; }
    setLoading(true); setError('');
    try {
      if (!supabase) throw new Error('Sem conexão com banco de dados.');
      const { data, error: dbErr } = await supabase
        .from('employees')
        .select('*')
        .eq('login_id', loginId.trim())
        .single();
      if (dbErr || !data) { setError('ID não encontrado.'); return; }
      if (data.password !== password) { setError('Senha incorreta.'); return; }
      const emp: Employee = {
        id: data.id, loginId: data.login_id, password: data.password,
        name: data.name, cpf: data.cpf || '', phone: data.phone || '',
        email: data.email || '', birthdate: data.birthdate || '',
        job_title: data.job_title || '', role: data.role as Role,
        avatar_url: data.avatar_url || '',
      } as any; 
      // Mapping back to our interface names if they differ from DB
      const mappedEmp: Employee = {
        id: data.id, loginId: data.login_id, password: data.password,
        name: data.name, cpf: data.cpf || '', phone: data.phone || '',
        email: data.email || '', birthdate: data.birthdate || '',
        jobTitle: data.job_title || '', role: data.role as Role,
        avatarUrl: data.avatar_url || '',
      };
      if (remember) localStorage.setItem('bytex_remember', JSON.stringify(mappedEmp));
      onLogin(mappedEmp);
    } catch (e: any) {
      setError(e.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-slate-900/50 rounded-xl shadow-2xl border border-slate-800 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 mb-4"><BytexIcon className="w-full h-full" /></div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Bytex</h2>
            <p className="text-slate-400 text-sm mt-1">Gerenciamento de Infraestrutura Digital</p>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-white text-2xl font-bold mb-2">Bem-vindo</h1>
              <p className="text-slate-400 text-sm">Faça login com seu ID e senha.</p>
            </div>

            <div className="space-y-4">
              {/* ID */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-medium">ID de Acesso</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type="text" value={loginId} onChange={e => { setLoginId(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg h-12 pl-12 pr-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Login" />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-medium">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg h-12 pl-12 pr-12 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* Remember */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setRemember(r => !r)}
                  className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                    remember ? "bg-primary border-primary" : "border-slate-600 bg-transparent hover:border-primary/60")}>
                  {remember && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-slate-300 text-sm">Lembrar de mim</span>
              </label>
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Verificando...</span>
              ) : (
                <>Entrar <LogOut className="w-5 h-5 rotate-180" /></>
              )}
            </Button>
          </div>
        </div>
        <div className="h-1.5 w-full bg-primary/20"><div className="h-full bg-primary w-1/3"></div></div>
      </motion.div>
    </div>
  );
};
