import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, Download, FilePlus2, Loader2, Printer, Save } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import FormEditor from '../components/FormEditor.jsx';
import ResumePreview from '../components/ResumePreview.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { Button, ErrorNote, Spinner } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { clearedData, mergeResume, newResume } from '../data/constants.js';
import { downloadPdf, printResume } from '../utils/exportPdf.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS = {
  new: { icon: FilePlus2, text: 'New, not saved yet', cls: 'text-slate-500' },
  saved: { icon: Check, text: 'All changes saved', cls: 'text-brand-700' },
  dirty: { icon: Loader2, text: 'Unsaved changes', cls: 'text-signal' },
  saving: { icon: Loader2, text: 'Saving…', cls: 'text-slate-500', spin: true },
  error: { icon: AlertTriangle, text: 'Not saved', cls: 'text-red-600' },
};

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState('saved');
  const [tab, setTab] = useState('edit'); // mobile only
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const idRef = useRef(null);        // saved resume id (null until first save)
  const loadedFor = useRef(null);   // key of the resume currently loaded ('new' or the id)
  const mounted = useRef(true);
  const resumeRef = useRef(null);
  const statusRef = useRef('saved');
  const version = useRef(0);         // bumps on every edit
  const saving = useRef(false);
  const queued = useRef(false);
  const latest = useRef(null);

  // ---- load ----
  useEffect(() => {
    const key = id ?? 'new';
    if (loadedFor.current === key) return; // URL changed only because we just created the resume
    loadedFor.current = key;
    setError('');
    if (!id) {
      idRef.current = null;
      let draft;
      try { draft = JSON.parse(localStorage.getItem('cvb_guest_draft') || 'null'); } catch { /* ignore invalid local draft */ }
      const fresh = draft ? mergeResume(draft) : newResume();
      if (!draft && location.state?.template) fresh.template = location.state.template;
      setResume(fresh);
      setStatus('new'); // saved on the first edit (or when Save is pressed), not before
      return;
    }
    idRef.current = Number(id);
    api.resumes.get(id)
      .then((r) => { setResume(mergeResume(r)); setStatus('saved'); })
      .catch((e) => setError(e.message));
  }, [id]);

  // ---- save (serialized so a slow request never creates duplicates) ----
  const save = useCallback(async (r) => {
    latest.current = r;
    if (!user) {
      try {
        localStorage.setItem('cvb_guest_draft', JSON.stringify(r));
        setStatus('saved');
        return true;
      } catch { setError('Could not save this draft in browser storage.'); setStatus('error'); }
      return;
    }
    if (saving.current) { queued.current = true; return; }
    saving.current = true;
    const v = version.current;
    setStatus('saving');
    try {
      const payload = { title: r.title, template: r.template, settings: r.settings, data: r.data };
      if (idRef.current) {
        await api.resumes.update(idRef.current, payload);
      } else {
        const res = await api.resumes.create(payload);
        idRef.current = res.id;
        localStorage.removeItem('cvb_guest_draft');
        loadedFor.current = String(res.id);
        if (mounted.current) navigate(`/editor/${res.id}`, { replace: true });
      }
      setError('');
      if (version.current === v) setStatus('saved');
      return true;
    } catch (e) {
      setError(e.message);
      setStatus('error');
      return false;
    } finally {
      saving.current = false;
      if (queued.current) { queued.current = false; save(latest.current); }
    }
  }, [navigate, user]);

  const saveRef = useRef(save);
  resumeRef.current = resume;
  statusRef.current = status;
  saveRef.current = save;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (statusRef.current === 'dirty' && resumeRef.current) saveRef.current(resumeRef.current); // don't lose the last edits
    };
  }, []);

  // ---- autosave 1.5s after the last edit ----
  useEffect(() => {
    if (status !== 'dirty' || !resume) return;
    const t = setTimeout(() => save(resume), 1500);
    return () => clearTimeout(t);
  }, [resume, status, save]);

  const edit = (patch) => {
    version.current += 1;
    setResume((r) => ({ ...r, ...patch }));
    setStatus('dirty');
  };

  const exportJson = () => {
    if (!user) { localStorage.setItem('cvb_guest_draft', JSON.stringify(resume)); navigate('/login', { state: { from: '/editor' } }); return; }
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${resume.title || 'resume'}-backup.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const showPreviewForExport = async () => {
    if (tab !== 'preview') { setTab('preview'); await new Promise((r) => setTimeout(r, 400)); }
  };

  const onDownload = async () => {
    if (!user) { localStorage.setItem('cvb_guest_draft', JSON.stringify(resume)); navigate('/login', { state: { from: '/editor' } }); return; }
    if (!idRef.current && !(await save(resume))) return;
    setExporting(true);
    try { await showPreviewForExport(); await downloadPdf(resume.title); }
    catch (e) { setError(e.message || 'Could not create the PDF.'); }
    finally { setExporting(false); }
  };

  const onPrint = async () => {
    if (!user) { localStorage.setItem('cvb_guest_draft', JSON.stringify(resume)); navigate('/login', { state: { from: '/editor' } }); return; }
    if (!idRef.current && !(await save(resume))) return;
    await showPreviewForExport(); printResume();
  };

  if (!resume) {
    return (
      <div className="flex h-full flex-col">
        <Navbar />
        {error ? <div className="mx-auto mt-10 max-w-md"><ErrorNote>{error}</ErrorNote></div> : <Spinner className="mt-20" />}
      </div>
    );
  }

  const st = STATUS[status];

  return (
    <div className="flex h-full flex-col">
      <Navbar />

      {/* Top bar */}
      <div className="relative z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-5">
        <input
          value={resume.title}
          onChange={(e) => edit({ title: e.target.value })}
          aria-label="Resume name"
          className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-base font-extrabold tracking-tight text-ink hover:border-slate-300 focus:border-brand-600 focus:outline-none sm:max-w-xs sm:flex-none"
        />
        <span className={`order-3 inline-flex w-full items-center gap-1.5 px-2 text-xs font-semibold sm:order-none sm:w-auto sm:text-sm ${st.cls}`} role="status">
          <st.icon size={15} className={st.spin ? 'animate-spin' : ''} /> {st.text}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5 lg:hidden" aria-label="Editor view">
            {['edit', 'preview'].map((t) => (
              <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {t}
              </button>
            ))}
          </div>
          <Button onClick={() => save(resume)} disabled={status === 'saving'} className="px-2.5 sm:px-3.5"><Save size={16} /> <span className="hidden sm:inline">Save</span></Button>
          <Button onClick={onPrint} title="Print or save as a text-selectable PDF" className="px-2.5 sm:px-3.5"><Printer size={16} /> <span className="hidden sm:inline">Print</span></Button>
          <Button variant="primary" onClick={onDownload} loading={exporting} className="px-2.5 sm:px-3.5"><Download size={16} /> <span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span></Button>
        </div>
      </div>

      {error && <div className="px-4 pt-2"><ErrorNote>{error}</ErrorNote></div>}

      {/* Split workspace */}
      <div className="flex min-h-0 flex-1">
        <section className={`${tab === 'edit' ? 'block' : 'hidden'} editor-scroll-container w-full overflow-y-auto border-r border-slate-200 bg-white lg:block lg:w-[42%] xl:w-[38%]`}>
          <FormEditor
            data={resume.data}
            onChange={(data) => edit({ data })}
            onClear={() => edit({ data: clearedData() })}
            onImportJson={(obj) => { const m = mergeResume(obj); edit({ data: m.data, settings: m.settings, template: m.template }); }}
            onExportJson={exportJson}
          />
        </section>

        <section className={`${tab === 'preview' ? 'flex' : 'hidden'} relative min-w-0 flex-1 flex-col bg-desk lg:flex`}>
          <div className="flex-1 overflow-y-scroll px-3 pb-28 pt-6 sm:px-6">
            <ResumePreview resume={resume} onEdit={() => setTab('edit')} />
          </div>
          <Toolbar resume={resume} onChange={edit} />
        </section>
      </div>
    </div>
  );
}
