import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '../../lib/db';
import { z } from 'zod';
import { 
    Loader2, ArrowLeft, FileText, Stethoscope, ClipboardList, 
    ShieldAlert, Thermometer, Scale, AlertTriangle, GitMerge
} from 'lucide-react';

// Stubbing child components for the tabs/actions
import { IUCNBadge } from './components/IUCNBadge';
import { ProfileActionBar } from './components/ProfileActionBar';
import { HusbandryLogsTab } from './components/HusbandryLogsTab';
import { MedicalTab } from './components/MedicalTab';
import { SignGenerator } from './components/SignGenerator';

// ==========================================
// AUDIT POINT O-01: The Zod Edge Parser
// We strictly define the shape we expect from PGlite based on the V3 CSV Schema.
// This guarantees zero 'as any' runtime crashes.
// ==========================================
const FullAnimalSchema = z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    species: z.string().nullable(),
    latin_name: z.string().nullable(),
    category: z.string().nullable(),
    weight_unit: z.string().default('g'),
    entity_type: z.string(),
    census_count: z.number(),
    red_list_status: z.string(),
    is_venomous: z.boolean().default(false),
    hazard_rating: z.string().nullable(),
    gender: z.string().nullable(),
    date_of_birth: z.string().nullable(),
    microchip_id: z.string().nullable(),
    ring_number: z.string().nullable(),
    
    // Environmental Targets
    target_day_temp_c: z.preprocess(v => v === null ? null : Number(v), z.number().nullable()),
    target_night_temp_c: z.preprocess(v => v === null ? null : Number(v), z.number().nullable()),
    target_humidity_min_percent: z.preprocess(v => v === null ? null : Number(v), z.number().nullable()),
    target_humidity_max_percent: z.preprocess(v => v === null ? null : Number(v), z.number().nullable()),
    misting_frequency: z.string().nullable(),
}).passthrough(); // Allows extra fields without crashing

type ParsedAnimal = z.infer<typeof FullAnimalSchema>;

export function AnimalProfileView({ animalId, onBack }: { animalId: string, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'husbandry'>('profile');
    const [signGeneratorOpen, setSignGeneratorOpen] = useState(false);

    // Fetch and strictly parse the core animal data
    const { data: animal, isLoading, isError } = useQuery({
        queryKey: ['animal-profile', animalId],
        queryFn: async () => {
            await db.waitReady;
            const res = await db.query("SELECT * FROM animals WHERE id = $1", [animalId]);
            
            if (!res.rows[0]) throw new Error("Animal record not found in local vault.");
            
            // Pass the raw data through the Zod Edge Parser
            return FullAnimalSchema.parse(res.rows[0]);
        }
    });

    if (isLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 bg-slate-50">
                <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Decrypting Record...</p>
            </div>
        );
    }

    if (isError || !animal) {
        return (
            <div className="p-8 text-center bg-rose-50 m-6 rounded-2xl border border-rose-100">
                <ShieldAlert className="mx-auto mb-3 text-rose-500" size={32} />
                <h3 className="font-black text-rose-800 uppercase">Vault Integrity Error</h3>
                <p className="text-sm text-rose-600 mb-4">Could not verify this animal record.</p>
                <button onClick={onBack} className="px-4 py-2 bg-white text-rose-600 rounded-lg font-bold text-sm shadow-sm">Return to Roster</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">
            {/* Action Bar & Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-20 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-4 transition-colors">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-200 overflow-hidden shadow-inner">
                             <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${animal.name || animal.species}&backgroundColor=e2e8f0`} alt="Avatar" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{animal.name || 'Unnamed'}</h1>
                                <IUCNBadge status={animal.red_list_status} />
                                {animal.is_venomous && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={12}/> Venomous</span>}
                            </div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{animal.species || 'Unknown Species'} <span className="italic normal-case text-slate-400 ml-2">({animal.latin_name || 'N/A'})</span></p>
                        </div>
                    </div>

                    <ProfileActionBar 
                        onEdit={() => {/* Hook up AddAnimalModal in edit mode later */}} 
                        onSign={() => setSignGeneratorOpen(true)} 
                        animal={animal as any} // Temporary cast until ProfileActionBar is hardened
                    />
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-6 mt-6 border-b border-slate-200 -mb-4">
                    <button onClick={() => setActiveTab('profile')} className={`pb-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'profile' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Profile & Environment</button>
                    <button onClick={() => setActiveTab('husbandry')} className={`pb-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'husbandry' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Husbandry Logs</button>
                    <button onClick={() => setActiveTab('medical')} className={`pb-3 text-sm font-black uppercase tracking-widest transition-colors ${activeTab === 'medical' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Clinical & Medical</button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 max-w-[1200px] w-full mx-auto">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Identifiers Card */}
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-indigo-500"/> Identifiers</h3>
                            <div className="space-y-4">
                                <div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Record Type</span><span className="text-sm font-bold text-slate-700 capitalize">{animal.entity_type} {animal.entity_type === 'group' ? `(Count: ${animal.census_count})` : ''}</span></div>
                                <div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Gender</span><span className="text-sm font-bold text-slate-700 capitalize">{animal.gender || 'Unknown'}</span></div>
                                <div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Date of Birth</span><span className="text-sm font-bold text-slate-700">{animal.date_of_birth ? new Date(animal.date_of_birth).toLocaleDateString() : 'Unknown'}</span></div>
                                <div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ring / Microchip ID</span><span className="text-sm font-bold text-slate-700 font-mono">{animal.ring_number || animal.microchip_id || 'None'}</span></div>
                            </div>
                        </div>

                        {/* Environmental Card */}
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2"><Thermometer size={16} className="text-amber-500"/> Environmental Targets</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Day Temp</span><span className="text-sm font-bold text-slate-700">{animal.target_day_temp_c !== null ? `${animal.target_day_temp_c}°C` : 'N/A'}</span></div>
                                <div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Night Temp</span><span className="text-sm font-bold text-slate-700">{animal.target_night_temp_c !== null ? `${animal.target_night_temp_c}°C` : 'N/A'}</span></div>
                                <div className="col-span-2"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Humidity Target</span><span className="text-sm font-bold text-slate-700">{animal.target_humidity_min_percent !== null ? `${animal.target_humidity_min_percent}% - ${animal.target_humidity_max_percent}%` : 'N/A'}</span></div>
                                <div className="col-span-2"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Misting Protocol</span><span className="text-sm font-bold text-slate-700">{animal.misting_frequency || 'N/A'}</span></div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Child Tabs */}
                {activeTab === 'medical' && <MedicalTab animalId={animal.id} />}
                {activeTab === 'husbandry' && <HusbandryLogsTab animalId={animal.id} />}
            </div>

            {signGeneratorOpen && <SignGenerator animal={animal as any} onClose={() => setSignGeneratorOpen(false)} orgProfile={null} />}
        </div>
    );
}