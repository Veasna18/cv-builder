import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, FileText, ImagePlus, KeyRound, Pencil, Search, ShieldCheck, Trash2, UserX, Users, X } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { Button, ErrorNote, Spinner, Field, TextInput, inputCls } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TEMPLATES } from '../data/constants.js';

const fmt = (s) => new Date(s.replace(' ', 'T')).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const LEGACY_LAYOUTS = [{ id: 'executive', name: 'Executive' }, { id: 'profile', name: 'Profile' }];
const LAYOUT_CHOICES = [...TEMPLATES, ...LEGACY_LAYOUTS];
const tplName = (id) => LAYOUT_CHOICES.find((t) => t.id === id)?.name || id;

function readTemplateImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1000 / img.width, 1400 / img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

const Badge = ({ tone, children }) => {
  const tones = {
    admin: 'bg-brand-100 text-brand-800',
    user: 'bg-slate-100 text-slate-700',
    active: 'bg-emerald-50 text-emerald-700',
    blocked: 'bg-red-50 text-red-700',
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-sm text-slate-600"><Icon size={16} className="text-brand-600" /> {label}</div>
      <div className="mt-2 text-3xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

/* ---------------- Overview ---------------- */
function Overview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.admin.stats().then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!s) return <Spinner />;

  const max = Math.max(1, ...s.daily.flatMap((d) => [d.users, d.resumes]));
  const tplMax = Math.max(1, ...s.templates.map((t) => Number(t.count)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Users" value={s.totals.users} icon={Users} />
        <Stat label="Resumes created" value={s.totals.resumes} icon={FileText} />
        <Stat label="New users, last 7 days" value={s.totals.newUsers7} icon={CheckCircle2} />
        <Stat label="Blocked accounts" value={s.totals.blocked} icon={UserX} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Last 7 days</h2>
            <div className="flex gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-brand-600" /> New users</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-signal" /> New resumes</span>
            </div>
          </div>
          <div className="flex h-40 items-end gap-3">
            {s.daily.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t bg-brand-600" style={{ height: `${(d.users / max) * 100}%`, minHeight: d.users ? 4 : 0 }} title={`${d.users} users`} />
                  <div className="w-1/2 rounded-t bg-signal" style={{ height: `${(d.resumes / max) * 100}%`, minHeight: d.resumes ? 4 : 0 }} title={`${d.resumes} resumes`} />
                </div>
                <span className="text-[11px] text-slate-500">{new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-3 font-bold">Template usage</h2>
            {s.templates.length === 0 && <p className="text-sm text-slate-500">No resumes yet.</p>}
            <div className="space-y-3">
              {s.templates.map((t) => (
                <div key={t.template}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{tplName(t.template)}</span><span className="tabular-nums text-slate-600">{t.count}</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${(Number(t.count) / tplMax) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-3 font-bold">Newest accounts</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {s.recent.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <span><span className="font-semibold">{u.name}</span> <span className="text-slate-500">{u.phone}</span></span>
                  <span className="text-xs text-slate-400">{fmt(u.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Users ---------------- */
function UsersTab() {
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback((term) => api.admin.users(term).then((r) => { setRows(r); setError(''); }).catch((e) => setError(e.message)), []);
  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q, load]);

  const run = async (id, fn) => {
    setBusy(id);
    try { await fn(); await load(q); } catch (e) { setError(e.message); } finally { setBusy(null); }
  };

  const resetPassword = (u) => {
    const pw = window.prompt(`New password for ${u.name} (at least 8 characters):`);
    if (pw === null) return;
    run(u.id, async () => { await api.admin.updateUser(u.id, { password: pw }); window.alert('Password changed.'); });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
      </div>
      <ErrorNote>{error}</ErrorNote>
      {!rows ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>{['Name', 'Phone', 'Role', 'Status', 'Resumes', 'Joined', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => {
                const self = Number(u.id) === Number(me.id);
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold">{u.name}{self && <span className="ml-2 text-xs font-normal text-slate-400">you</span>}</td>
                    <td className="px-4 py-3 tabular-nums">{u.phone}</td>
                    <td className="px-4 py-3"><Badge tone={u.role}>{u.role}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={u.status}>{u.status}</Badge></td>
                    <td className="px-4 py-3 tabular-nums">{u.resume_count}</td>
                    <td className="px-4 py-3 text-slate-500">{fmt(u.created_at)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-0.5">
                        {!self && (
                          <>
                            <Button variant="ghost" disabled={busy === u.id} title={u.status === 'active' ? 'Block account' : 'Unblock account'}
                              onClick={() => run(u.id, () => api.admin.updateUser(u.id, { status: u.status === 'active' ? 'blocked' : 'active' }))}>
                              {u.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                            </Button>
                            <Button variant="ghost" disabled={busy === u.id} title={u.role === 'admin' ? 'Make regular user' : 'Make admin'}
                              onClick={() => window.confirm(u.role === 'admin' ? `Remove admin rights from ${u.name}?` : `Give ${u.name} full admin access?`) &&
                                run(u.id, () => api.admin.updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' }))}>
                              <ShieldCheck size={16} />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" disabled={busy === u.id} title="Reset password" onClick={() => resetPassword(u)}><KeyRound size={16} /></Button>
                        {!self && (
                          <Button variant="danger" disabled={busy === u.id} title="Delete account"
                            onClick={() => window.confirm(`Delete ${u.name} and all of their resumes? This cannot be undone.`) && run(u.id, () => api.admin.deleteUser(u.id))}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No users match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Resumes ---------------- */
function ResumesTab() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.admin.resumes().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const remove = async (r) => {
    if (!window.confirm(`Delete “${r.title}” by ${r.owner_name}?`)) return;
    try { await api.admin.deleteResume(r.id); await load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-4">
      <ErrorNote>{error}</ErrorNote>
      {!rows ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>{['Resume', 'Owner', 'Template', 'Last edited', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold">{r.title}</td>
                  <td className="px-4 py-3">{r.owner_name} <span className="text-slate-500">{r.owner_phone}</span></td>
                  <td className="px-4 py-3">{tplName(r.template)}</td>
                  <td className="px-4 py-3 text-slate-500">{fmt(r.updated_at)}</td>
                  <td className="px-4 py-2 text-right"><Button variant="danger" title="Delete resume" onClick={() => remove(r)}><Trash2 size={16} /></Button></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No resumes have been created yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const tabs = [['overview', 'Overview'], ['users', 'Users'], ['resumes', 'Resumes'], ['templates', 'Templates']];
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Admin dashboard</h1>
        <div className="mt-5 flex gap-1 border-b border-slate-200" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold ${tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {tab === 'overview' && <Overview />}
          {tab === 'users' && <UsersTab />}
          {tab === 'resumes' && <ResumesTab />}
          {tab === 'templates' && <TemplatesTab />}
        </div>
      </main>
    </div>
  );
}

function TemplatesTab() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', desc: '', layout: 'modern', image_data: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api.templates.list().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    const id = editingId || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    try {
      if (editingId) { await api.templates.update({ ...form, id }); setNotice('Template updated.'); }
      else { await api.templates.create({ ...form, id }); setNotice('Template added. Users can select it in the editor and edit their CV details there.'); }
      setForm({ name: '', desc: '', layout: 'modern', image_data: '' }); setEditingId(null); await load();
    }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const editTemplate = (template) => {
    setEditingId(template.id);
    setForm({ name: template.name, desc: template.desc || '', layout: template.layout, image_data: template.image_data || '' });
    setError(''); setNotice('');
  };
  const deleteTemplate = async (template) => {
    if (!window.confirm(`Delete the “${template.name}” template? Existing resumes will switch to its base design.`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await api.templates.remove(template.id); setNotice('Template deleted.'); if (editingId === template.id) { setEditingId(null); setForm({ name: '', desc: '', layout: 'modern', image_data: '' }); } await load(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const cancelEdit = () => { setEditingId(null); setForm({ name: '', desc: '', layout: 'modern', image_data: '' }); setError(''); setNotice(''); };
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-center justify-between"><h2 className="font-bold">{editingId ? `Edit ${form.name}` : 'Add a template'}</h2>{editingId && <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><X size={14} /> Cancel</button>}</div>
      <ErrorNote>{error}</ErrorNote>
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {editingId && <Field label="Template ID"><TextInput value={editingId} readOnly className="bg-slate-50 text-slate-500" /></Field>}
      <Field label="Template name"><TextInput required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Minimal" /></Field>
      <Field label="Description"><TextInput maxLength={160} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Short description shown in the editor" /></Field>
      <Field label="Base design"><select className={inputCls} value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })}>{LAYOUT_CHOICES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-600">Template picture / preview</span>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-brand-500 hover:bg-brand-50/50">
          {form.image_data ? <img src={form.image_data} alt="Template preview" className="h-24 w-20 rounded-md border border-slate-200 bg-white object-contain" /> : <span className="grid h-24 w-20 place-items-center rounded-md bg-white text-brand-600 ring-1 ring-slate-200"><ImagePlus size={25} /></span>}
          <span className="text-sm"><span className="block font-bold">{form.image_data ? 'Change picture' : 'Upload picture'}</span><span className="mt-1 block text-xs text-slate-500">JPG, PNG, or WebP. Used as the template card preview.</span></span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0]; e.target.value = '';
            if (!file) return;
            try { const image_data = await readTemplateImage(file); setForm((current) => ({ ...current, image_data })); setError(''); }
            catch (err) { setError(err.message); }
          }} />
        </label>
        {form.image_data && <button type="button" className="mt-1 text-xs font-semibold text-slate-500 underline hover:text-red-600" onClick={() => setForm({ ...form, image_data: '' })}>Remove picture</button>}
      </div>
      <Button type="submit" variant="primary" loading={busy}>{editingId ? 'Save changes' : 'Add template'}</Button>
      <p className="text-xs leading-5 text-slate-500">The uploaded picture appears in the user’s template picker. The selected base design controls the editable resume layout; users can fill in their details in the editor.</p>
    </form>
    <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200"><h2 className="mb-3 font-bold">Added templates</h2>
      {rows.length ? <ul className="divide-y divide-slate-100">{rows.map((t) => <li key={t.id} className="flex items-center gap-3 py-3">{t.image_data ? <img src={t.image_data} alt="" className="h-20 w-16 rounded border border-slate-200 object-contain" /> : <div className="grid h-20 w-16 place-items-center rounded bg-slate-100 text-xs font-bold text-slate-400">{t.name.slice(0, 2).toUpperCase()}</div>}<div className="min-w-0 flex-1"><span className="font-semibold">{t.name}</span><span className="ml-2 text-xs text-slate-500">Based on {tplName(t.layout)}</span><p className="text-sm text-slate-500">{t.desc}</p></div><div className="flex shrink-0 gap-1"><Button variant="ghost" title={`Edit ${t.name}`} aria-label={`Edit ${t.name}`} onClick={() => editTemplate(t)}><Pencil size={15} /></Button><Button variant="danger" title={`Delete ${t.name}`} aria-label={`Delete ${t.name}`} disabled={busy} onClick={() => deleteTemplate(t)}><Trash2 size={15} /></Button></div></li>)}</ul> : <p className="text-sm text-slate-500">No templates added yet.</p>}
    </div>
  </div>;
}
