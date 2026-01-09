import React, { useState } from 'react';
import { User, Language } from '../types';
import { translations } from '../translations';
import { X, User as UserIcon, Mail, Check, Loader2, Camera, Upload } from 'lucide-react';
import { updateProfile } from '../auth';

interface ProfileModalProps {
    user: User;
    language: Language;
    onClose: () => void;
    onUpdate: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, language, onClose, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [photoUrl, setPhotoUrl] = useState(user.photo_url || '');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const t = translations[language];

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoUrl('');
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await updateProfile(user.id, { name, photo_url: photoUrl });
            onUpdate({ ...user, name, photo_url: photoUrl });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Profile update error:", error);
            alert("Er is een fout opgetreden bij het bijwerken van het profiel.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{t.profile.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.profile.subtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 transition-all shadow-sm">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    {/* Photo Upload Section */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profiel" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-slate-50 shadow-inner">
                                    <UserIcon size={40} />
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 p-2 bg-slate-900 hover:bg-black text-white rounded-full cursor-pointer shadow-lg transition-all active:scale-95">
                                <Camera size={14} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <label className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                                <Upload size={12} /> {t.profile.uploadPhoto}
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                            {photoUrl && (
                                <button onClick={handleRemovePhoto} className="text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors">
                                    {t.profile.removePhoto}
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.profile.nameLabel}</label>
                        <div className="relative">
                            <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.profile.emailLabel}</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="email" 
                                value={user.email} 
                                disabled 
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold opacity-60 cursor-not-allowed" 
                            />
                        </div>
                        <p className="mt-2 text-[9px] text-slate-400 italic">E-mailadres kan alleen via de beheerder worden gewijzigd.</p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">
                        {t.common.cancel}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading || success}
                        className={`px-8 py-3 rounded-2xl text-sm font-black shadow-xl transition-all flex items-center justify-center gap-2 ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-black active:scale-95'}`}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : success ? <Check size={18} /> : null}
                        {success ? t.profile.saveSuccess : t.common.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;