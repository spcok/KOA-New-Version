import React from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from '@tanstack/react-router';
import { Activity, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormValues,
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: value.email,
          password: value.password,
        });

        if (signInError) {
          setError(signInError.message);
          toast.error(signInError.message);
          return;
        }

        if (data.session) {
          setSession(data.session);
          toast.success('Sign in successful');
          navigate({ to: '/' as any });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        toast.error(message);
      }
    },
  });

  return (
    <div className="w-full max-w-md p-8 bg-[#111827] border border-slate-800 rounded-lg shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
          <Activity className="w-6 h-6 text-emerald-500" />
        </div>
        <h2 className="text-xl font-mono tracking-widest text-emerald-400 uppercase">System Login</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-tighter">Clinical_Management_V3</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field
          name="email"
          validators={{
            onChange: loginSchema.shape.email,
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Network Ident
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="name@clinic.sys"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded px-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-colors font-sans"
                />
              </div>
              {field.state.meta.errors ? (
                <div className="flex items-center space-x-1 text-[10px] text-rose-500 font-mono mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{field.state.meta.errors.join(', ')}</span>
                </div>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: loginSchema.shape.password,
          }}
        >
          {(field) => (
            <div className="space-y-1.5">
              <label htmlFor={field.name} className="block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                Security Token
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded px-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-colors font-sans"
                />
              </div>
              {field.state.meta.errors ? (
                <div className="flex items-center space-x-1 text-[10px] text-rose-500 font-mono mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{field.state.meta.errors.join(', ')}</span>
                </div>
              ) : null}
            </div>
          )}
        </form.Field>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-rose-400 font-mono leading-tight">{error}</p>
          </div>
        )}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white py-2.5 rounded font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <span>Initialize Session</span>
              )}
            </button>
          )}
        />
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800/50">
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
          <span>Shield_Mode: Active</span>
          <span>Prot: V3.1.0_L</span>
        </div>
      </div>
    </div>
  );
}
