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
    <div className="min-h-screen flex items-center justify-center p-6 bg-background-dark sm:p-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-800/50 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        
        <div className="p-10 sm:p-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center mb-12"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                filter: ["drop-shadow(0 0 0px rgba(59,130,246,0))", "drop-shadow(0 0 20px rgba(59,130,246,0.3))", "drop-shadow(0 0 0px rgba(59,130,246,0))"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24 mb-6 drop-shadow-2xl"
            >
              <img src="/pwa-192x192.png" alt="Bytex Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h2 className="text-white text-3xl font-black tracking-tight leading-none">Bytex</h2>
            <p className="text-slate-500 text-xs mt-2 font-black uppercase tracking-[0.2em]">Sistemas Inteligentes</p>
          </motion.div>

          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <h1 className="text-white text-2xl font-black tracking-tight">Acesso Restrito</h1>
              <p className="text-slate-500 text-sm font-medium">Insira suas credenciais técnicas</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-6"
            >
              {/* ID */}
              <div className="space-y-2.5">
                <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1">ID de Técnico</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input type="text" value={loginId} onChange={e => { setLoginId(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-slate-800/40 border-2 border-slate-700/50 rounded-2xl h-16 pl-14 pr-4 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="Seu ID de acesso" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2.5">
                <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1">Senha de Segurança</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-slate-800/40 border-2 border-slate-700/50 rounded-2xl h-16 pl-14 pr-14 text-white placeholder:text-slate-600 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-xs font-bold bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 text-center">{error}</p>
              )}

              {/* Remember */}
              <label 
                onClick={() => setRemember(!remember)}
                className="flex items-center gap-4 cursor-pointer select-none group"
              >
                <div className={cn("size-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                    remember ? "bg-primary border-primary shadow-lg shadow-primary/20" : "border-slate-700 bg-transparent group-hover:border-slate-500")}>
                  {remember && <Check className="w-4 h-4 text-white" strokeWidth={4} />}
                </div>
                <span className="text-slate-400 text-sm font-bold group-hover:text-slate-300 transition-colors">Manter sessão ativa</span>
              </label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="w-full"
            >
              <Button onClick={handleSubmit} disabled={loading} className="w-full py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 disabled:opacity-60 text-xs font-black uppercase tracking-widest h-auto">
                {loading ? (
                  <span className="flex items-center gap-3"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Autenticando...</span>
                ) : (
                  <span className="flex items-center gap-3 justify-center">Entrar no Sistema <LogOut className="w-5 h-5 rotate-180" /></span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-800"><motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full bg-primary" /></div>
      </motion.div>
    </div>
  );
};
