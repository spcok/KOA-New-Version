import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../lib/db';
import { useAuthStore } from '../../store/authStore';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { 
  Utensils, Calendar, CheckCircle2, Trash2, Loader2, Plus, 
  Info, ShieldAlert, Edit2, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

// ==========================================
// V3 TYPE LAW ENFORCEMENT
// ==========================================
interface FeedingSchedule {
  id: string;
  animal_id: string;
  food_type: string;
  quantity_grams: number | null;
  calci_dust: boolean;
  notes: string | null;
  interval_days: number;
  next_feed_date: string;
  animal_name?: string;
  animal_species?: string;
}

interface AnimalOption {
  id: string;
  name: string;
  species: string | null;
}

// ==========================================
// V3 ZOD & NULL LAW ENFORCEMENT
// ==========================================
const scheduleSchema = z.object({
  animal_id: z.string().min(1, "Animal selection is required"),
  food_type: z.string().min(1, "Food type is required"),
  quantity_grams: z.number().nullable().optional(),
  calci_dust: z.boolean(),
  notes: z.string().nullable().optional(),
  interval_days: z.number().min(1, "Must be at least 1 day"),
  next_feed_date: z.string().min(1, "Starting date required")
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

// ==========================================
// COMPONENT: Data Entry Modal
// ==========================================
function ScheduleModal({ isOpen, onClose, animals, editSchedule }: { isOpen: boolean, onClose: () => void, animals: AnimalOption[], editSchedule: FeedingSchedule | null }) {
  const queryClient = useQueryClient();
  const session = useAuthStore(s => s.session);
  const currentUserId = session?.user?.id || '00000000-0000-0000-0000-000000000000';

  const saveMutation = useMutation({
    mutationFn: async (val: ScheduleFormValues) => {
      await db.waitReady;
      
      const params = [
        val.animal_id,
        val.food_type,
        val.quantity_grams || null, // Null Law Enforcement
        val.calci_dust,
        val.notes || null,
        val.interval_days,
        val.next_feed_date,
        currentUserId
      ];

      if (editSchedule) {
        await db.query(
          `UPDATE feeding_schedules SET 
            animal_id = $1, food_type = $2, quantity_grams = $3, calci_dust = $4, 
            notes = $5, interval_days = $6, next_feed_date = $7, modified_by = $8, updated_at = now()
           WHERE id = $9`,
          [...params, editSchedule.id]
        );
      } else {
        await db.query(
          `INSERT INTO feeding_schedules (
            animal_id, food_type, quantity_grams, calci_dust, notes, interval_days, next_feed_date, created_by, modified_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
          params
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeding-schedules'] });
      toast.success(editSchedule ? 'Schedule updated' : 'Schedule created');
      onClose();
    }
  });

  const form = useForm({
    validatorAdapter: zodValidator,
    defaultValues: {
      animal_id: editSchedule?.animal_id || '',
      food_type: editSchedule?.food_type || '',
      quantity_grams: editSchedule?.quantity_grams || undefined,
      calci_dust: editSchedule?.calci_dust || false,
      notes: editSchedule?.notes || '',
      interval_days: editSchedule?.interval_days || 1,
      next_feed_date: editSchedule?.next_feed_date ? editSchedule.next_feed_date.substring(0, 10) : new Date().toISOString().split('T')[0]
    } as ScheduleFormValues,
    onSubmit: async ({ value }) => {
      await saveMutation.mutateAsync(value);
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
            <Utensils size={20} className="text-emerald-500" />
            {editSchedule ? 'Edit Schedule' : 'New Schedule'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
          <form id="schedule-form" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-5">
            
            <form.Field name="animal_id">
              {(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Animal</label>
                  <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500">
                    <option value="">-- Select Animal --</option>
                    {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                  </select>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="food_type" validators={{ onChange: scheduleSchema.shape.food_type }}>
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Diet / Food Type</label>
                    <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" placeholder="e.g. DOC, Mice..." />
                  </div>
                )}
              </form.Field>

              <form.Field name="quantity_grams">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount (Grams)</label>
                    <input type="number" value={field.state.value || ''} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 150" />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="next_feed_date">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Feed Date</label>
                    <input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                )}
              </form.Field>

              <form.Field name="interval_days">
                {(field) => (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Repeat Every (Days)</label>
                    <input type="number" min="1" value={field.state.value} onChange={(e) => field.handleChange(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="calci_dust">
              {(field) => (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                  <label className="text-sm font-bold text-slate-700">Requires Calcium Dusting</label>
                </div>
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dietary Notes</label>
                  <textarea value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value === '' ? null as any : e.target.value)} className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 min-h-[80px]" placeholder="Specific preparation instructions..." />
                </div>
              )}
            </form.Field>

          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors">Cancel</button>
          <button form="schedule-form" type="submit" disabled={saveMutation.isPending} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center gap-2">
            {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT: Main View
// ==========================================
export function FeedingScheduleView() {
  const queryClient = useQueryClient();
  const session = useAuthStore(s => s.session);
  const currentUserId = session?.user?.id;

  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<FeedingSchedule | null>(null);

  const { data: animals = [] } = useQuery({
    queryKey: ['animals-dropdown'],
    queryFn: async () => {
      await db.waitReady;
      const res = await db.query(`SELECT id, name, species FROM animals WHERE is_deleted = false ORDER BY name ASC`);
      return res.rows as AnimalOption[];
    }
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['feeding-schedules', viewDate],
    queryFn: async () => {
      await db.waitReady;
      const res = await db.query(`
        SELECT f.*, a.name as animal_name, a.species as animal_species 
        FROM feeding_schedules f 
        JOIN animals a ON f.animal_id = a.id 
        WHERE f.is_deleted = false AND f.next_feed_date <= $1
        ORDER BY a.name ASC
      `, [viewDate]);
      return res.rows as FeedingSchedule[];
    }
  });

  // ATOMIC ACTION: Log the feed AND push the schedule forward
  const markFedMutation = useMutation({
    mutationFn: async (schedule: FeedingSchedule) => {
      await db.waitReady;
      
      // 1. Insert into daily logs
      await db.query(
        `INSERT INTO daily_logs (animal_id, log_type, log_date, notes, weight_grams, created_by, modified_by) 
         VALUES ($1, 'feed', now(), $2, $3, $4, $4)`,
        [schedule.animal_id, `Scheduled feed: ${schedule.food_type}`, schedule.quantity_grams, currentUserId]
      );

      // 2. Increment the schedule date
      await db.query(
        `UPDATE feeding_schedules 
         SET next_feed_date = (DATE($1) + INTERVAL '${schedule.interval_days} days')::DATE, 
             updated_at = now(), modified_by = $2 
         WHERE id = $3`,
        [schedule.next_feed_date, currentUserId, schedule.id]
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeding-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      toast.success('Feed logged & schedule updated!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await db.waitReady;
      await db.query(`UPDATE feeding_schedules SET is_deleted = true, updated_at = now() WHERE id = $1`, [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeding-schedules'] });
      toast.success('Schedule deleted');
    }
  });

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dietary Operations</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">Manage recurring collection feeding schedules.</p>
        </div>
        <button 
          onClick={() => { setScheduleToEdit(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <Plus size={18} /> New Schedule
        </button>
      </div>

      {/* Date Controls */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-black uppercase tracking-widest text-xs ml-2">
          <Calendar size={16} className="text-emerald-500" /> Target Date:
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronLeft size={16}/></button>
          <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().split('T')[0]); }} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronRight size={16}/></button>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl border-dashed">
            <Utensils size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">No Feeds Required</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">No schedules found for this date.</p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow group gap-4">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">{schedule.animal_name}</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-full">{schedule.animal_species}</span>
                  {schedule.calci_dust && <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1"><Info size={10}/> Dust</span>}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Diet</p>
                    <p className="text-sm font-bold text-slate-700">{schedule.food_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Amount</p>
                    <p className="text-sm font-bold text-slate-700">{schedule.quantity_grams ? `${schedule.quantity_grams}g` : 'To appetite'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Interval</p>
                    <p className="text-sm font-bold text-slate-700">Every {schedule.interval_days} {schedule.interval_days === 1 ? 'day' : 'days'}</p>
                  </div>
                </div>
                
                {schedule.notes && <p className="mt-3 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">📝 {schedule.notes}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-4">
                <button 
                  onClick={() => markFedMutation.mutate(schedule)}
                  disabled={markFedMutation.isPending}
                  className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
                  title="Mark as Fed"
                >
                  {markFedMutation.isPending && markFedMutation.variables?.id === schedule.id ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={24} />}
                </button>
                <button 
                  onClick={() => { setScheduleToEdit(schedule); setIsModalOpen(true); }} 
                  className="w-12 h-12 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center transition-colors"
                  title="Edit Schedule"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => window.confirm('Delete this feeding schedule entirely?') && deleteMutation.mutate(schedule.id)} 
                  className="w-12 h-12 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-colors"
                  title="Delete Schedule"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AUDIT R-05: Hydration Law (The React Key Hack) */}
      {isModalOpen && (
        <ScheduleModal 
          key={scheduleToEdit ? scheduleToEdit.id : 'new-schedule'} 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setScheduleToEdit(null); }} 
          animals={animals} 
          editSchedule={scheduleToEdit} 
        />
      )}

    </div>
  );
}