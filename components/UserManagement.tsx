import React, { useState, useMemo } from 'react';
import { User, UserRole, Language } from '../types';
import { translations } from '../translations';
import { Users, Plus, Edit2, Trash2, X, Key, Mail, User as UserIcon, ShieldCheck, Building2 } from 'lucide-react';

interface UserManagementProps {
    language: Language;
    users: User[];
    onAddUser: (user: User) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ language, users, onAddUser, onUpdateUser, onDeleteUser }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const t = translations[language];

    const handleAddNew = () => {
        setIsCreating(true);
        setEditingUser({
            id: `user-${Date.now()}`,
            name: '',
            email: '',
            password_plaintext: '',
            role: UserRole.USER,
            organization_id: 'org-1'
        });
    };

    const handleEdit = (user: User) => {
        setIsCreating(false);
        setEditingUser(user);
    };

    const stats = useMemo(() => {
        const total = users.length;
        const admins = users.filter(u => u.role === UserRole.ADMIN).length;
        return { total, admins };
    }, [users]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.users.totalUsers}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.total}</span>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.users.admins}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.admins}</span>
                    </div>
                </div>
                 <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white flex flex-col justify-center items-start md:col-span-2">
                     <h3 className="font-black text-lg mb-1">{t.users.title}</h3>
                     <p className="text-xs text-slate-400">{t.users.subtitle}</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-end">
                <button 
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm font-bold active:scale-95"
                >
                    <Plus size={18} /> {t.users.addUser}
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.users.table.user}</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.users.table.role}</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organisatie</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.users.table.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs border border-slate-200">
                                                {user.name ? user.name.split(' ').map(n => n[0]).join('') : '?'}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 text-sm">{user.name}</div>
                                                <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.role === UserRole.ADMIN ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-5 text-xs font-bold text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-slate-300" />
                                            {user.organization_id}
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <button 
                                            onClick={() => handleEdit(user)} 
                                            className="p-2 text-slate-300 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    isNew={isCreating}
                    onClose={() => setEditingUser(null)}
                    onSave={isCreating ? onAddUser : onUpdateUser}
                    onDelete={onDeleteUser}
                    language={language}
                />
            )}
        </div>
    );
};

interface EditUserModalProps {
    user: User;
    isNew: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    onDelete: (id: string) => void;
    language: Language;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isNew, onClose, onSave, onDelete, language }) => {
    const [form, setForm] = useState(user);
    const t = translations[language];

    const handleSave = () => {
        onSave(form);
        onClose();
    };
    
    const handleDelete = () => {
        if (window.confirm(`${t.users.modal.confirmDelete} (${form.name})?`)) {
            onDelete(form.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{isNew ? t.users.modal.newTitle : t.users.modal.editTitle}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Beheer accountrechten</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 transition-all shadow-sm">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.users.modal.name}</label>
                        <div className="relative">
                            <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.users.modal.email}</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="email" value={form.email} disabled={!isNew} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none disabled:opacity-50" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Organisatie ID</label>
                        <div className="relative">
                            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={form.organization_id} onChange={e => setForm({...form, organization_id: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.users.modal.role}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setForm({...form, role: UserRole.USER})}
                                className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${form.role === UserRole.USER ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {t.users.modal.roleUser}
                            </button>
                            <button 
                                onClick={() => setForm({...form, role: UserRole.ADMIN})}
                                className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${form.role === UserRole.ADMIN ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {t.users.modal.roleAdmin}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    {!isNew ? (
                        <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
                            <Trash2 size={16} /> {t.common.delete}
                        </button>
                    ) : (<div></div>)}
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">{t.common.cancel}</button>
                        <button onClick={handleSave} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-black transition-all active:scale-95">{t.common.save}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;