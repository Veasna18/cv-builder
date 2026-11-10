import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, ChevronDown, ClipboardList, Copy, Download, FileText, LayoutTemplate, Pencil, Plus, Sparkles, Star, Trash2, BriefcaseBusiness } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { Button, ErrorNote, Spinner } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TEMPLATES } from '../data/constants.js';

const fmt = (s) => new Date(s.replace(' ', 'T')).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const tplName = (id) => TEMPLATES.find((t) => t.id === id)?.name || id;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => api.resumes.list().then(setList).catch((e) => setError(e.message));
  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <GuestHome navigate={navigate} />;

  const duplicate = async (id) => {
    setBusyId(id);
    try {
      const r = await api.resumes.get(id);
      await api.resumes.create({ title: `${r.title} (copy)`, template: r.template, settings: r.settings, data: r.data });
      await load();
    } catch (e) { setError(e.message); } finally { setBusyId(null); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete “${r.title}”? This cannot be undone.`)) return;
    setBusyId(r.id);
    try { await api.resumes.remove(r.id); await load(); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  };

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-7 text-white shadow-lg sm:px-9 sm:py-9">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div><p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider"><Sparkles size={14} /> Your workspace</p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Hello, {user.name.split(' ')[0]}</h1>
              <p className="mt-2 max-w-lg text-sm text-white/80 sm:text-base">Pick up where you left off, or create a fresh resume for your next opportunity.</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/editor')} className="bg-white! text-brand-900! hover:bg-brand-50!"><Plus size={17} /> Create a resume</Button>
          </div>
        </section>

        <div className="mt-8 space-y-3">
          <ErrorNote>{error}</ErrorNote>

          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Your resumes</h2>{list?.length > 0 && <span className="text-sm text-slate-500">{list.length} saved</span>}</div>

          {!list && !error && <Spinner />}
          {list?.length === 0 && (
            <p className="rounded-xl bg-white px-5 py-8 text-center text-sm text-slate-500 ring-1 ring-slate-200">
              You have no saved resumes yet. Create one above and it will appear here.
            </p>
          )}

          {list?.map((r) => (
            <div key={r.id} className="group flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
              <Link to={`/editor/${r.id}`} className="grid h-16 w-12 shrink-0 place-items-center rounded-md border border-brand-100 bg-gradient-to-br from-brand-50 to-white text-brand-600 shadow-sm">
                <FileText size={22} />
              </Link>
              <Link to={`/editor/${r.id}`} className="min-w-0 flex-1">
                <div className="truncate font-bold hover:text-brand-700">{r.title}</div>
                <div className="truncate text-sm text-slate-600">
                  {[r.full_name, r.job_title].filter(Boolean).join(', ') || 'No name yet'}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{tplName(r.template)}</span><span>Edited {fmt(r.updated_at)}</span></div>
              </Link>
              <div className="flex items-center gap-1">
                <Button variant="ghost" onClick={() => navigate(`/editor/${r.id}`)} aria-label="Edit" title="Edit"><Pencil size={16} /></Button>
                <Button variant="ghost" loading={busyId === r.id} onClick={() => duplicate(r.id)} aria-label="Duplicate" title="Duplicate"><Copy size={16} /></Button>
                <Button variant="danger" disabled={busyId === r.id} onClick={() => remove(r)} aria-label="Delete" title="Delete"><Trash2 size={16} /></Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function GuestHome({ navigate }) {
  const start = (template) => navigate('/editor', { state: { template } });
  const steps = [
    [ClipboardList, 'Enter details', 'Complete the relevant sections that make up the content of your resume.'],
    [LayoutTemplate, 'Select template', 'Choose a template and customize your resume around your style and personality.'],
    [Download, 'Download resume', 'Download quickly, print when ready, and edit your resume at any time.'],
  ];
  const tools = [
    [FileText, 'Resume', 'Create unlimited resumes and edit them whenever you need.'],
    [BookOpen, 'Cover letters', 'Keep your application story consistent with a polished letter.'],
    [BriefcaseBusiness, 'Jobs', 'Keep your next opportunity in view while you prepare to apply.'],
    [ClipboardList, 'Applications', 'Organize your applications and stay ready for every step.'],
  ];
  const faqs = [
    ['What is a resume?', 'A resume is a concise summary of your experience, education, skills, and achievements for a specific opportunity.'],
    ['What should be in a resume?', 'Start with your contact details, a short profile, experience, education, relevant skills, and links such as LinkedIn or a portfolio.'],
    ['How do I make a professional resume?', 'Use clear sections, strong action verbs, relevant results, and a clean template that keeps the most important information easy to scan.'],
    ['Can I use this resume maker for free?', 'Yes. You can start editing without an account and create a polished resume before deciding whether you want to save or export it.'],
  ];
  return <div className="min-h-full bg-[#f8fafc] text-slate-900">
    <Navbar />
    <main>
      <section className="relative overflow-hidden border-b border-slate-100 bg-[#f8fafc]">
        <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full border-[42px] border-blue-100/60" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-[28rem] w-[28rem] rounded-full border-[70px] border-blue-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.92fr_1.08fr] lg:gap-16 lg:py-24">
          <ResumeCard />
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#2878e8]">Resume builder</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-[4rem]">Easily create a professional resume</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Fill in your details, select a winning template, and download your resume in no time.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => start('profile')} className="rounded-full! bg-[#2878e8]! px-6! py-3! text-white! shadow-md hover:bg-[#1767d7]!"><Pencil size={17} /> Get started <ArrowRight size={16} /></Button>
              <Link to="/login" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#2878e8] hover:text-[#2878e8]">Log in</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {['No account to get started', 'Live preview', 'PDF when ready'].map((x) => <span key={x} className="inline-flex items-center gap-1.5"><Check size={15} className="text-[#2878e8]" />{x}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#2878e8]">Simple by design</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">How does it work?</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([Icon, title, desc], i) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#2878e8] text-[#2878e8]"><Icon size={19} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">0{i + 1}</p><h3 className="mt-1 text-lg font-semibold text-[#2878e8]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></div></div></div>)}
        </div>
      </section>

      <section id="tools" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-8 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#2878e8]">Everything in one place</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tools for your next move</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map(([Icon, title, desc]) => <div key={title} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5"><Icon size={22} className="text-[#2878e8]" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#2878e8]">Make it yours</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Choose a resume style</h2><p className="mt-2 text-sm text-slate-600">Switch templates any time in the editor.</p></div><button onClick={() => start('profile')} className="inline-flex items-center gap-1 text-sm font-bold text-[#2878e8] hover:text-[#1767d7]">Open the editor <ArrowRight size={16} /></button></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => <TemplateCard key={t.id} template={t} index={i} onClick={() => start(t.id)} />)}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20"><div className="mb-8 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#2878e8]">Loved by job seekers</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A simpler way to move forward</h2><div className="mt-4 flex items-center justify-center gap-1 text-amber-400">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} fill="currentColor" />)}<span className="ml-2 text-sm font-semibold text-slate-600">4.5 / 5 from 49,182 reviews</span></div></div>
          <div className="grid gap-4 md:grid-cols-3">{[
            ['Luis Ramirez', 'Works very well and does what it promises. I put together a solid resume in a short amount of time.'],
            ['Michael', 'Simple and intuitive. The interface is clean and the templates look modern without being overwhelming.'],
            ['Aaliyah J.', 'The website is user-friendly and I loved having different formatting options to choose from.'],
          ].map(([name, quote]) => <blockquote key={name} className="rounded-2xl border border-slate-200 p-6"><div className="flex gap-1 text-amber-400">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill="currentColor" />)}</div><p className="mt-4 text-sm leading-6 text-slate-600">“{quote}”</p><footer className="mt-5 text-sm font-bold text-slate-900">{name}</footer></blockquote>)}</div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 py-16 sm:py-20"><div className="mb-8 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#2878e8]">Questions</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h2></div><div className="space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-xl border border-slate-200 bg-white px-5 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{question}<ChevronDown size={18} className="shrink-0 text-[#2878e8] transition group-open:rotate-180" /></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{answer}</p></details>)}</div></section>

      <footer id="pricing" className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:px-8"><span className="font-semibold text-slate-800">CV Builder</span><div className="flex flex-wrap gap-5"><a href="#tools" className="hover:text-[#2878e8]">Resume builder</a><a href="#faq" className="hover:text-[#2878e8]">FAQ</a><Link to="/login" className="hover:text-[#2878e8]">Log in</Link></div><span>Free to start · No account required to edit</span></div></footer>
    </main>
  </div>;
}

function ResumeCard() {
  return <div className="relative mx-auto w-full max-w-[440px] -rotate-1 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
    <div className="absolute -left-5 top-12 hidden rounded-2xl border border-blue-100 bg-white p-3 text-[#2878e8] shadow-lg md:block"><Sparkles size={20} /></div>
    <div className="mx-auto min-h-[390px] max-w-[320px] rounded-lg bg-white p-6 text-slate-800 shadow-xl sm:p-8">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5"><div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-lg font-extrabold text-white">CV</div><div className="flex-1"><div className="h-3 w-32 rounded bg-slate-800"/><div className="mt-2 h-2 w-24 rounded bg-brand-500"/><div className="mt-2 h-1.5 w-28 rounded bg-slate-200"/></div></div>
      <div className="mt-5 grid grid-cols-[.72fr_1.28fr] gap-5"><div className="space-y-4"><MockSection title="CONTACT"/><MockSection title="SKILLS"/><MockSection title="LANGUAGES"/></div><div className="space-y-5"><MockSection title="PROFILE" wide/><MockSection title="EXPERIENCE" wide/><MockSection title="EDUCATION" wide/></div></div>
      <div className="mt-6 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#1767d7]"><Check size={15} /> Live preview as you edit</div>
    </div>
    <div className="absolute -bottom-4 -right-3 rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink shadow-xl"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#2878e8]"/>Ready to customize</div>
  </div>;
}

function MockSection({ title, wide = false }) {
  return <div><div className="mb-2 text-[8px] font-extrabold tracking-widest text-brand-700">{title}</div><div className="space-y-1.5">{(wide ? ['w-full', 'w-11/12', 'w-4/5'] : ['w-full', 'w-4/5']).map((w, i) => <div key={i} className={`h-1.5 rounded bg-slate-200 ${w}`} />)}</div></div>;
}

function TemplateCard({ template, index, onClick }) {
  return <button onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg">
    <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-xl bg-[#edf2f1] p-3">
      <img src={template.preview} alt={`${template.name} resume template preview`} className="h-full w-full object-contain transition group-hover:scale-[1.03]" />
      <span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white text-brand-700 shadow transition group-hover:bg-brand-600 group-hover:text-white"><ArrowRight size={16} /></span>
    </div>
    <div className="flex items-center justify-between px-1 pb-1 pt-3"><div><h3 className="font-extrabold">{template.name}</h3><p className="mt-0.5 text-xs text-slate-500">{template.desc}</p></div><span className="rounded-lg px-2 py-1 text-xs font-bold text-brand-700 group-hover:bg-brand-50">Use</span></div>
  </button>;
}
