import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, User, Crown, Shield, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Employee, Role } from '../../types';
import { supabase } from '../../lib/supabase';

export const EmployeeManagementModal = ({ employees, onClose, onRefresh }: {
  employees: Employee[],
  onClose: () => void,
  onRefresh: () => void
}) => {
  const [editing, setEditing] = useState<Employee | Partial<Employee> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!editing?.name || !editing?.loginId || !editing?.password) {
      alert('Preencha Nome, ID e Senha.');
      return;
    }
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase client not available');
      if (editing.id) {
        await supabase.from('employees').update({
          name: editing.name, cpf: editing.cpf, phone: editing.phone, email: editing.email,
          birthdate: editing.birthdate, job_title: editing.jobTitle, role: editing.role,
          avatar_url: editing.avatarUrl, login_id: editing.loginId, password: editing.password
        }).eq('id', editing.id);
      } else {
        await supabase.from('employees').insert({
          name: editing.name, cpf: editing.cpf, phone: editing.phone, email: editing.email,
          birthdate: editing.birthdate, job_title: editing.jobTitle, role: editing.role || 'funcionario',
          avatar_url: editing.avatarUrl, login_id: editing.loginId, password: editing.password
        });
      }
      onRefresh();
      setEditing(null);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir funcionário?')) return;
    setLoading(true);
    if (supabase) {
      await supabase.from('employees').delete().eq('id', id);
      onRefresh();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold">Gestão de Funcionários</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
          {editing ? (
            <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold mb-4">{editing.id ? 'Editar Funcionário' : 'Novo Funcionário'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-500">Nome *</label><input type="text" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Função (Ex: Técnico)</label><input type="text" value={editing.jobTitle || ''} onChange={e => setEditing({ ...editing, jobTitle: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div>
                  <label className="text-xs text-slate-500">Cargo de Acesso *</label>
                  <select value={editing.role || 'funcionario'} onChange={e => setEditing({ ...editing, role: e.target.value as Role })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 outline-none">
                    <option value="funcionario">Funcionário (Restrito)</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div><label className="text-xs text-slate-500">ID de Login *</label><input type="text" value={editing.loginId || ''} onChange={e => setEditing({ ...editing, loginId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Senha *</label><input type="text" value={editing.password || ''} onChange={e => setEditing({ ...editing, password: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Avatar URL</label><input type="text" value={editing.avatarUrl || ''} onChange={e => setEditing({ ...editing, avatarUrl: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1 placeholder:text-slate-400" placeholder="https://..." /></div>
                <div><label className="text-xs text-slate-500">Email</label><input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
                <div><label className="text-xs text-slate-500">Telefone</label><input type="text" value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 mt-1" /></div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setEditing(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="flex-1">{loading ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={() => setEditing({ role: 'funcionario' })} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                <UserPlus className="w-4 h-4 mr-2" /> Adicionar Funcionário
              </Button>
              <div className="grid gap-3">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {emp.avatarUrl ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold truncate">{emp.name}</p>
                        {emp.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        {emp.role === 'gestor' && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{emp.jobTitle || 'Sem função'} • ID: {emp.loginId}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setEditing(emp)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
