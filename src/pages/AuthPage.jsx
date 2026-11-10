import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, ErrorNote, Field, TextInput } from '../components/ui.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((current) => ({ ...current, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isRegister
        ? await register(form.name, form.phone, form.password)
        : await login(form.phone, form.password);
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      {/* Left: a paper sheet being "filled in" */}
      <div className="relative hidden overflow-hidden bg-brand-900 lg:block">
        <div className="absolute left-1/2 top-1/2 w-[360px] -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-sm bg-white p-7 shadow-2xl">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-600" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-3/4 rounded bg-slate-800" />
              <div className="h-2.5 w-1/2 rounded bg-brand-600" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {[100, 92, 96, 70].map((w, i) => <div key={i} className="h-2 rounded bg-slate-200" style={{ width: `${w}%` }} />)}
          </div>
          <div className="mt-6 h-2.5 w-1/3 rounded bg-brand-600" />
          <div className="mt-3 space-y-2">
            {[100, 88, 94].map((w, i) => <div key={i} className="h-2 rounded bg-slate-200" style={{ width: `${w}%` }} />)}
          </div>
        </div>
        <p className="absolute bottom-10 left-10 max-w-xs text-2xl font-extrabold leading-snug text-white">
          Build a CV that gets read — and see every change as you type.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white"><FileText size={19} /></span>
            CV Builder
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isRegister ? 'Your phone number is your login. No email needed.' : 'Sign in with your phone number.'}
            </p>
          </div>

          <ErrorNote>{error}</ErrorNote>

          {isRegister && (
            <Field label="Full name">
              <TextInput required minLength={2} autoComplete="name" value={form.name} onChange={set('name')} />
            </Field>
          )}
          <Field label="Phone number">
            <TextInput required type="tel" inputMode="tel" autoComplete="tel" placeholder="012 345 678" value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label={isRegister ? 'Password (at least 8 characters)' : 'Password'}>
            <div className="relative">
              <TextInput required minLength={isRegister ? 8 : 1} type={show ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'} className="pr-10"
                value={form.password} onChange={set('password')} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-700">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Button type="submit" variant="primary" loading={busy} className="w-full py-2.5">
            {isRegister ? 'Create account' : 'Sign in'}
          </Button>

          <p className="text-center text-sm text-slate-600">
            {isRegister ? 'Already have an account? ' : 'New here? '}
            <Link to={isRegister ? '/login' : '/register'} className="font-bold text-brand-700 hover:underline">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
