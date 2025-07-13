
import React, { useState, useEffect } from 'react';
import { BusinessProfile } from '../../types.ts';
import { TrashIcon, PlusCircleIcon } from './icons.tsx';

interface ProfileProps {
    allProfiles: BusinessProfile[];
    activeProfile: BusinessProfile | null;
    onSave: (profile: BusinessProfile | Omit<BusinessProfile, 'id'>) => void;
    onSwitch: (profileId: string) => void;
    onDelete: (profileId: string) => void;
    onNew: () => void;
}

const newBlankProfile: Omit<BusinessProfile, 'id'> = {
    businessName: '',
    businessType: '',
    businessModel: '',
    typicalIncomeSources: '',
    typicalExpenseCategories: '',
    ownerName: '',
};


const FormRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        {children}
    </div>
);

const TextInput: React.FC<{ name: keyof BusinessProfile, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ name, value, onChange }) => (
    <input
        type="text"
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
    />
);

const TextAreaInput: React.FC<{ name: keyof BusinessProfile, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows?: number }> = ({ name, value, onChange, rows = 3 }) => (
    <textarea
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
    />
);

const Profile: React.FC<ProfileProps> = ({ allProfiles, activeProfile, onSave, onSwitch, onDelete, onNew }) => {
    const [formData, setFormData] = useState<BusinessProfile | Omit<BusinessProfile, 'id'>>(activeProfile || newBlankProfile);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // When activeProfile changes, update the form
        // If activeProfile is null, it means we are in "new profile" mode
        setFormData(activeProfile || newBlankProfile);
    }, [activeProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsSaved(false);
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleDeleteClick = () => {
        if (activeProfile && window.confirm(`Вы уверены, что хотите удалить профиль "${activeProfile.businessName}"? Это действие необратимо.`)) {
            onDelete(activeProfile.id);
        }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Профиль бизнеса</h1>
                    <p className="text-text-secondary max-w-3xl mt-2">
                        Эта информация поможет ИИ лучше понимать специфику вашего бизнеса и давать более релевантные рекомендации.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-grow">
                        <label htmlFor="profile-switcher" className="sr-only">Выбрать профиль</label>
                        <select
                            id="profile-switcher"
                            value={activeProfile?.id || ''}
                            onChange={(e) => onSwitch(e.target.value)}
                            className="p-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                            disabled={allProfiles.length === 0}
                        >
                            {allProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.businessName || `Профиль ${p.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={onNew} className="p-2 text-text-secondary hover:text-primary transition-colors" title="Создать новый профиль">
                        <PlusCircleIcon className="w-7 h-7" />
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="p-2 text-text-secondary hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Удалить текущий профиль"
                        disabled={!activeProfile || allProfiles.length <= 1}
                    >
                        <TrashIcon className="w-7 h-7" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg space-y-4">
                    <h2 className="text-xl font-bold text-text-primary">Информация о компании</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormRow label="Название компании / ИП">
                            <TextInput name="businessName" value={formData.businessName} onChange={handleChange} />
                        </FormRow>
                        <FormRow label="Вид деятельности (напр., IT, розница)">
                            <TextInput name="businessType" value={formData.businessType} onChange={handleChange} />
                        </FormRow>
                    </div>
                    <FormRow label="Модель заработка (как вы получаете доход?)">
                        <TextAreaInput name="businessModel" value={formData.businessModel} rows={4} onChange={handleChange} />
                    </FormRow>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormRow label="Основные источники дохода">
                            <TextAreaInput name="typicalIncomeSources" value={formData.typicalIncomeSources} onChange={handleChange} />
                        </FormRow>
                        <FormRow label="Основные статьи расходов">
                            <TextAreaInput name="typicalExpenseCategories" value={formData.typicalExpenseCategories} onChange={handleChange} />
                        </FormRow>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-border shadow-lg space-y-4">
                    <h2 className="text-xl font-bold text-text-primary">Информация о владельце</h2>
                    <FormRow label="Имя владельца / контактного лица">
                        <TextInput name="ownerName" value={formData.ownerName} onChange={handleChange} />
                    </FormRow>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        className="px-6 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover transition-colors shadow-md"
                    >
                        {('id' in formData && allProfiles.some(p => p.id === formData.id)) ? 'Сохранить изменения' : 'Создать профиль'}
                    </button>
                    {isSaved && <span className="text-success transition-opacity duration-300">Профиль успешно сохранен!</span>}
                </div>
            </form>
        </div>
    );
};

export default Profile;
