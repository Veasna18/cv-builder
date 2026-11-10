import { Loader2 } from 'lucide-react';

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20';

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const TextInput = ({ className = '', ...p }) => <input {...p} className={`${inputCls} ${className}`} />;
export const TextArea = ({ className = '', ...p }) => <textarea {...p} className={`${inputCls} resize-y ${className}`} />;

const BTN = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/50',
  secondary: 'border border-slate-300 bg-white text-ink hover:bg-slate-50 disabled:opacity-50',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:opacity-50',
  danger: 'text-red-600 hover:bg-red-50 disabled:opacity-50',
};

export function Button({ variant = 'secondary', className = '', loading, children, ...p }) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

/** Five clickable dots. Clicking the current level again clears it (hides the indicator in the CV). */
export function LevelDots({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Skill level">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`Level ${n}`}
          onClick={() => onChange(value === n ? 0 : n)}
          className={`h-3.5 w-3.5 rounded-full border transition-colors ${
            n <= value ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white hover:border-brand-500'
          }`}
        />
      ))}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center p-10 text-slate-400 ${className}`}>
      <Loader2 className="animate-spin" />
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}
