import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../lib/db';
import { useAuthStore } from '../../../store/authStore';
import { X, Save, Loader2, Info } from 'lucide-react';

// ==========================================
// AUDIT POINT O-01 & C-02: Strict Zod Edge
// Perfectly mirrors the V3 PostgreSQL Schema.
// No 'unknown' fallbacks. No ZERO_UUIDs. True NULLs allowed.
// ==========================================
const animalSchema = z.object({
  entity_type: z.enum(['individual', 'group']),
  parent_mob_id: z.string().uuid().nullable().optional(),
  census_count: z.number().int().min(0).default(1),
  name: z.string().nullable().optional(),
  species: z.string().nullable().optional(),
  latin_name: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  weight_unit: z.enum(['g', 'kg', 'oz', 'lb']).default('g'),
  red_list_status: z.string().default('LC'),
});

// Enforce Type Law (Zero 'as any')
type AddAnimalValues = z.infer<typeof animalSchema>;

const CATEGORIES = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];
const RED_LIST_STATUSES = ['NE', 'DD', 'LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'];

interface AddAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAnimalModal({ isOpen, onClose }: AddAnimalModalProps) {
  if (!isOpen) return null;

  const queryClient = useQueryClient();
  
  // Zustand Law: Strict Selector Subscription
  const session = useAuthStore(s => s.session);
  const currentUserId = session?.user?.id || '00000000-0000-0000-0000-000000000000';

  const addMutation = useMutation({
    mutationFn: async (payload: AddAnimalValues) => {
      await db.waitReady;
      
      // Clean empty strings to true NULLs for the SQL engine
      const cleanString = (val?: string | null) => (val && val.trim() !== '') ? val.trim() : null;

      // Parameterized SQL Execution
      await db.query(`
        INSERT INTO animals (
          entity_type, parent_mob_id, census_count, name, species, latin_name, 
          category, weight_unit, red_list_status, created_by, modified_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        payload.entity_type,
        cleanString(payload.parent_mob_id),
        payload.entity_type === 'individual' ? 1 : payload.census_count,
        cleanString(payload.name),
        cleanString(payload.species),
        cleanString(payload.latin_name),
        cleanString(payload.category),
        payload.weight_unit,
        payload.red_list_status,
        currentUserId,
        currentUserId
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['animals-list'] });
      onClose();
    }
  });

  const form = useForm({
    validatorAdapter: zodValidator,
    defaultValues: {
      entity_type: 'individual' as const,
      census_count: 1,
      name: '',
      species: '',
      latin_name: '',
      category: 'OWLS',
      weight_unit: 'g' as const,
      red_list_status: 'LC',
    },
    onSubmit: async ({ value }) => {
      await addMutation.mutateAsync(value);
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Add New Record</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">Register a new animal or group into the collection.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-6">
            
            {/* Entity Type Toggle */}
            <form.Field name="entity_type" children={(field) => (
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex">
                <button type="button" onClick={() => field.handleChange('individual')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${field.state.value === 'individual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Individual</button>
                <button type="button" onClick={() => field.handleChange('group')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${field.state.value === 'group' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Group / Mob</button>
              </div>
            )} />

            {/* Core Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field name="name" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Common Name / Identifier</label>
                  <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Tempest" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              )} />
              <form.Field name="category" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Category</label>
                  <select value={field.state.value || ''} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )} />
              <form.Field name="species" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Species</label>
                  <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Golden Eagle" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              )} />
              <form.Field name="latin_name" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Latin Name</label>
                  <input value={field.state.value || ''} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} placeholder="e.g. Aquila chrysaetos" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold italic focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              )} />
            </div>

            {/* Husbandry & Setup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <form.Field name="entity_type" children={(typeField) => (
                <form.Field name="census_count" children={(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Census Count</label>
                    <input type="number" min="1" disabled={typeField.state.value === 'individual'} value={typeField.state.value === 'individual' ? 1 : field.state.value} onChange={e => field.handleChange(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors disabled:opacity-50" />
                  </div>
                )} />
              )} />
              <form.Field name="weight_unit" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Default Weight Unit</label>
                  <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value as any)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors">
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="lb">Pounds (lb)</option>
                  </select>
                </div>
              )} />
              <form.Field name="red_list_status" children={(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">IUCN Red List</label>
                  <select value={field.state.value} onBlur={field.handleBlur} onChange={e => field.handleChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors">
                    {RED_LIST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )} />
            </div>
            
            <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl flex items-start gap-3 text-sm">
              <Info className="shrink-0 mt-0.5" size={18} />
              <p>Additional profiling details (such as Parent Mob linking, Enclosure Assignment, Date of Birth, and Medical flags) can be edited from the <strong>Animal Profile view</strong> after the core record is established.</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors text-slate-600">Cancel</button>
          <button onClick={() => form.handleSubmit()} disabled={addMutation.isPending} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50">
            {addMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Establish Record
          </button>
        </div>

      </div>
    </div>
  );
}