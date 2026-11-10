import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, Bold, Briefcase, Camera, Download, FileUp, GraduationCap, Italic, Languages,
  Layers, Linkedin, List, ListOrdered, Plus, Strikethrough, Trash2, Underline, User, FileText, Wrench, Upload,
} from 'lucide-react';
import AccordionSection from './AccordionSection.jsx';
import { Field, TextInput, TextArea, LevelDots, Button } from './ui.jsx';
import { uid, LANG_LABELS, LEVEL_LABELS } from '../data/constants.js';

/** Keep the original framing while shrinking large uploads for the saved CV. */
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('That file is not a readable image.'));
    img.src = url;
  });
}

function ItemCard({ title, onUp, onDown, onRemove, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center gap-1">
        <span className="flex-1 truncate text-sm font-semibold">{title || 'Untitled'}</span>
        {onUp && <IconBtn label="Move up" onClick={onUp}><ArrowUp size={15} /></IconBtn>}
        {onDown && <IconBtn label="Move down" onClick={onDown}><ArrowDown size={15} /></IconBtn>}
        <IconBtn label="Remove" onClick={onRemove} danger><Trash2 size={15} /></IconBtn>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

const IconBtn = ({ label, onClick, danger, children }) => (
  <button
    type="button" onClick={onClick} aria-label={label} title={label}
    className={`rounded-md p-1.5 ${danger ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
  >
    {children}
  </button>
);

const AddBtn = ({ onClick, children }) => (
  <Button type="button" variant="secondary" onClick={onClick} className="w-full border-dashed">
    <Plus size={16} /> {children}
  </Button>
);

function legacyRichText(item) {
  if (item.richText) return item.richText;
  const bullets = (item.bullets || []).filter((x) => x && x.trim());
  return bullets.length ? `<ul>${bullets.map((x) => `<li>${x}</li>`).join('')}</ul>` : '';
}

function RichTextEditor({ item, onChange }) {
  const editor = useRef(null);
  const run = (command, value = null) => {
    editor.current?.focus();
    document.execCommand(command, false, value);
    onChange(editor.current?.innerHTML || '');
  };
  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
        {[[Bold, 'bold', 'Bold'], [Italic, 'italic', 'Italic'], [Underline, 'underline', 'Underline'], [Strikethrough, 'strikeThrough', 'Strikethrough'], [List, 'insertUnorderedList', 'Bulleted list'], [ListOrdered, 'insertOrderedList', 'Numbered list']].map(([Icon, command, label]) => (
          <button key={command} type="button" title={label} aria-label={label} onMouseDown={(e) => { e.preventDefault(); run(command); }} className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-brand-700">
            <Icon size={15} />
          </button>
        ))}
        <span className="ml-1 border-l border-slate-200 pl-2 text-[11px] text-slate-400">Format like Word</span>
      </div>
      <div
        ref={editor}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: legacyRichText(item) }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder="Write achievements, responsibilities, and results…"
        className="rich-editor min-h-[120px] px-3 py-2 text-sm leading-6 outline-none"
      />
    </div>
  );
}

export default function FormEditor({ data, onChange, onClear, onImportJson, onExportJson }) {
  const [note, setNote] = useState('');
  const [activeStep, setActiveStep] = useState('personal');
  const photoInput = useRef(null);
  const jsonInput = useRef(null);

  const set = (patch) => onChange({ ...data, ...patch });
  const setPersonal = (k, v) => set({ personal: { ...data.personal, [k]: v } });
  const addItem = (key, item) => set({ [key]: [...data[key], { id: uid(), ...item }] });
  const patchItem = (key, id, patch) => set({ [key]: data[key].map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const removeItem = (key, id) => set({ [key]: data[key].filter((i) => i.id !== id) });
  const moveItem = (key, id, dir) => {
    const list = [...data[key]];
    const i = list.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set({ [key]: list });
  };
  const mover = (key, list, item, idx) => ({
    onUp: idx > 0 ? () => moveItem(key, item.id, -1) : null,
    onDown: idx < list.length - 1 ? () => moveItem(key, item.id, 1) : null,
    onRemove: () => removeItem(key, item.id),
  });

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setNote('Choose a JPG or PNG image.');
    try {
      const photo = await readPhoto(file);
      set({ personal: { ...data.personal, photo, photoPosition: { x: 50, y: 50 } } });
      setNote('');
    } catch (err) { setNote(err.message); }
  };

  const pickJson = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { onImportJson(JSON.parse(reader.result)); setNote('Backup imported.'); }
      catch { setNote('That file is not a valid CV backup (.json).'); }
    };
    reader.readAsText(file);
  };

  const p = data.personal;
  const steps = [
    { id: 'personal', label: 'Personal', detail: 'Contact details', icon: User },
    { id: 'summary', label: 'Profile', detail: 'Professional summary', icon: FileText },
    { id: 'experience', label: 'Experience', detail: 'Work history', icon: Briefcase },
    { id: 'education', label: 'Education', detail: 'Studies', icon: GraduationCap },
    { id: 'skills', label: 'Skills', detail: 'Skills & extras', icon: Wrench },
  ];
  useEffect(() => {
    const root = document.querySelector('.editor-scroll-container');
    if (!root || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveStep(visible.target.id.replace('editor-', ''));
    }, { root, rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.15, 0.5] });
    steps.forEach(({ id }) => {
      const section = document.getElementById(`editor-${id}`);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  const goToStep = (id) => {
    setActiveStep(id);
    const section = document.getElementById(`editor-${id}`);
    if (!section) return;
    const toggle = section.querySelector('h3 button');
    if (toggle?.getAttribute('aria-expanded') !== 'true') toggle?.click();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* ---- Import ---- */}
      <div className="border-b border-slate-200 bg-brand-50/60 px-5 py-4">
        <div className="mb-2 text-sm font-bold">Start from something you already have</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" disabled
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-400">
            <FileUp size={16} /> <span className="flex-1">Upload CV (PDF, Word)</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold">Soon</span>
          </button>
          <button type="button" disabled
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-400">
            <Linkedin size={16} /> <span className="flex-1">Import from LinkedIn</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold">Soon</span>
          </button>
          <Button type="button" onClick={() => jsonInput.current.click()} className="justify-start">
            <Upload size={16} /> Import backup (.json)
          </Button>
          <Button type="button" onClick={onExportJson} className="justify-start">
            <Download size={16} /> Download backup
          </Button>
        </div>
        <input ref={jsonInput} type="file" accept="application/json,.json" className="hidden" onChange={pickJson} />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500" role="status">{note}</span>
          <button type="button" className="font-semibold text-slate-500 underline hover:text-red-600"
            onClick={() => window.confirm('Remove all content from this resume?') && onClear()}>
            Clear all content
          </button>
        </div>
      </div>

      <nav aria-label="Resume steps" className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">Build your resume</p>
            <p className="text-xs text-slate-500">Your changes appear in the preview as you type.</p>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Step {steps.findIndex((s) => s.id === activeStep) + 1} of {steps.length}</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1" role="list">
          {steps.map(({ id, label, icon: StepIcon }, index) => (
            <button key={id} type="button" role="listitem" onClick={() => goToStep(id)} aria-current={activeStep === id ? 'step' : undefined}
              className={`flex min-w-max items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors sm:flex-1 sm:justify-center ${activeStep === id ? 'bg-brand-600 text-white shadow-sm' : index < steps.findIndex((s) => s.id === activeStep) ? 'bg-brand-50 text-brand-800' : 'text-slate-500 hover:bg-slate-100'}`}>
              <StepIcon size={15} /><span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ---- Personal ---- */}
      <AccordionSection id="editor-personal" title="Personal information" icon={User} defaultOpen>
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-400">
            {p.photo ? <img src={p.photo} alt="Your photo" className="h-full w-full object-cover" style={{ objectPosition: `${p.photoPosition?.x ?? 50}% ${p.photoPosition?.y ?? 50}%` }} /> : <Camera size={24} />}
          </div>
          <div className="space-y-1.5">
            <Button type="button" onClick={() => photoInput.current.click()}>
              {p.photo ? 'Change photo' : 'Upload photo'}
            </Button>
            {p.photo && (
              <button type="button" onClick={() => setPersonal('photo', '')}
                className="block text-xs font-semibold text-slate-500 underline hover:text-red-600">
                Remove photo
              </button>
            )}
          </div>
          <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>
        {p.photo && <div className="grid gap-2 sm:grid-cols-2">
          {['x', 'y'].map((axis) => <label key={axis} className="text-xs font-semibold text-slate-600">Move photo {axis === 'x' ? 'left / right' : 'up / down'}
            <input aria-label={`Move photo ${axis === 'x' ? 'left or right' : 'up or down'}`} type="range" min="0" max="100" value={p.photoPosition?.[axis] ?? 50}
              onChange={(e) => setPersonal('photoPosition', { x: 50, y: 50, ...(p.photoPosition || {}), [axis]: Number(e.target.value) })} className="mt-1 w-full" />
          </label>)}
        </div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><TextInput value={p.fullName} onChange={(e) => setPersonal('fullName', e.target.value)} /></Field>
          <Field label="Job title"><TextInput value={p.jobTitle} onChange={(e) => setPersonal('jobTitle', e.target.value)} /></Field>
          <Field label="Email"><TextInput type="email" value={p.email} onChange={(e) => setPersonal('email', e.target.value)} /></Field>
          <Field label="Phone"><TextInput type="tel" value={p.phone} onChange={(e) => setPersonal('phone', e.target.value)} /></Field>
          <Field label="Address" className="sm:col-span-2"><TextInput value={p.address} onChange={(e) => setPersonal('address', e.target.value)} /></Field>
          <Field label="Personal website" className="sm:col-span-2"><TextInput type="url" placeholder="https://example.com" value={p.website} onChange={(e) => setPersonal('website', e.target.value)} /></Field>
          <Field label="GitHub"><TextInput type="url" placeholder="https://github.com/username" value={p.github} onChange={(e) => setPersonal('github', e.target.value)} /></Field>
          <Field label="LinkedIn"><TextInput type="url" placeholder="https://linkedin.com/in/username" value={p.linkedin} onChange={(e) => setPersonal('linkedin', e.target.value)} /></Field>
        </div>
      </AccordionSection>

      {/* ---- Summary ---- */}
      <AccordionSection id="editor-summary" title="Professional summary" icon={FileText}>
        <Field label="Two or three sentences about who you are and what you do best">
          <TextArea rows={5} value={data.summary} onChange={(e) => set({ summary: e.target.value })} />
        </Field>
      </AccordionSection>

      {/* ---- Experience ---- */}
      <AccordionSection id="editor-experience" title="Work experience" icon={Briefcase} count={data.experience.length}>
        {data.experience.map((e, idx) => (
          <ItemCard key={e.id} title={[e.role, e.company].filter(Boolean).join(' at ')} {...mover('experience', data.experience, e, idx)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Job title"><TextInput value={e.role} onChange={(ev) => patchItem('experience', e.id, { role: ev.target.value })} /></Field>
              <Field label="Company"><TextInput value={e.company} onChange={(ev) => patchItem('experience', e.id, { company: ev.target.value })} /></Field>
              <Field label="Location" className="sm:col-span-2"><TextInput value={e.location} onChange={(ev) => patchItem('experience', e.id, { location: ev.target.value })} /></Field>
              <Field label="Start"><TextInput placeholder="Jan 2021" value={e.start} onChange={(ev) => patchItem('experience', e.id, { start: ev.target.value })} /></Field>
              <Field label="End">
                <TextInput placeholder="Dec 2023" disabled={e.current} value={e.current ? 'Present' : e.end}
                  onChange={(ev) => patchItem('experience', e.id, { end: ev.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!e.current} onChange={(ev) => patchItem('experience', e.id, { current: ev.target.checked })} />
              I currently work here
            </label>
            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-600">Achievements and responsibilities</span>
              <p className="mb-2 text-xs text-slate-500">Write and format your content like in Word. Use the toolbar to add bullets, numbering, or emphasis.</p>
              <RichTextEditor item={e} onChange={(richText) => patchItem('experience', e.id, { richText })} />
            </div>
          </ItemCard>
        ))}
        <AddBtn onClick={() => addItem('experience', { role: '', company: '', location: '', start: '', end: '', current: false, bullets: [], richText: '<ul><li></li></ul>' })}>
          Add experience
        </AddBtn>
      </AccordionSection>

      {/* ---- Education ---- */}
      <AccordionSection id="editor-education" title="Education" icon={GraduationCap} count={data.education.length}>
        {data.education.map((e, idx) => (
          <ItemCard key={e.id} title={[e.degree, e.school].filter(Boolean).join(', ')} {...mover('education', data.education, e, idx)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="School" className="sm:col-span-2"><TextInput value={e.school} onChange={(ev) => patchItem('education', e.id, { school: ev.target.value })} /></Field>
              <Field label="Degree or field" className="sm:col-span-2"><TextInput value={e.degree} onChange={(ev) => patchItem('education', e.id, { degree: ev.target.value })} /></Field>
              <Field label="Start"><TextInput value={e.start} onChange={(ev) => patchItem('education', e.id, { start: ev.target.value })} /></Field>
              <Field label="End"><TextInput value={e.end} onChange={(ev) => patchItem('education', e.id, { end: ev.target.value })} /></Field>
              <Field label="Notes (optional)" className="sm:col-span-2">
                <TextArea rows={2} value={e.description} onChange={(ev) => patchItem('education', e.id, { description: ev.target.value })} />
              </Field>
            </div>
          </ItemCard>
        ))}
        <AddBtn onClick={() => addItem('education', { school: '', degree: '', start: '', end: '', description: '' })}>Add education</AddBtn>
      </AccordionSection>

      {/* ---- Skills ---- */}
      <AccordionSection id="editor-skills" title="Skills" icon={Wrench} count={data.skills.length}>
        <p className="text-xs text-slate-500">Click a dot to set the level. Click the same dot again to hide the level bar.</p>
        {data.skills.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <TextInput value={s.name} placeholder="e.g. Project management" onChange={(ev) => patchItem('skills', s.id, { name: ev.target.value })} />
            <div title={LEVEL_LABELS[s.level] || 'No level'}><LevelDots value={s.level} onChange={(n) => patchItem('skills', s.id, { level: n })} /></div>
            <IconBtn label="Remove skill" danger onClick={() => removeItem('skills', s.id)}><Trash2 size={15} /></IconBtn>
          </div>
        ))}
        <AddBtn onClick={() => addItem('skills', { name: '', level: 3 })}>Add skill</AddBtn>
      </AccordionSection>

      {/* ---- Languages ---- */}
      <AccordionSection title="Languages" icon={Languages} count={data.languages.length}>
        {data.languages.map((l) => (
          <div key={l.id} className="flex items-center gap-3">
            <TextInput value={l.name} placeholder="e.g. English" onChange={(ev) => patchItem('languages', l.id, { name: ev.target.value })} />
            <div title={LANG_LABELS[l.level] || 'No level'}><LevelDots value={l.level} onChange={(n) => patchItem('languages', l.id, { level: n })} /></div>
            <IconBtn label="Remove language" danger onClick={() => removeItem('languages', l.id)}><Trash2 size={15} /></IconBtn>
          </div>
        ))}
        <AddBtn onClick={() => addItem('languages', { name: '', level: 3 })}>Add language</AddBtn>
      </AccordionSection>

      {/* ---- Hobbies ---- */}
      <AccordionSection title="Hobbies" icon={Layers} count={(data.hobbies || []).length}>
        {(data.hobbies || []).map((hobby) => (
          <div key={hobby.id} className="flex items-center gap-2">
            <TextInput value={hobby.name} placeholder="e.g. Reading" onChange={(ev) => patchItem('hobbies', hobby.id, { name: ev.target.value })} />
            <IconBtn label="Remove hobby" danger onClick={() => removeItem('hobbies', hobby.id)}><Trash2 size={15} /></IconBtn>
          </div>
        ))}
        <AddBtn onClick={() => addItem('hobbies', { name: '' })}>Add hobby</AddBtn>
      </AccordionSection>

      {/* ---- Custom sections ---- */}
      <AccordionSection title="Custom sections" icon={Layers} count={data.custom.length}>
        <p className="text-xs text-slate-500">Certificates, projects, volunteering, awards — anything that does not fit above.</p>
        {data.custom.map((sec, idx) => {
          const setItems = (items) => patchItem('custom', sec.id, { items });
          return (
            <ItemCard key={sec.id} title={sec.title || 'New section'} {...mover('custom', data.custom, sec, idx)}>
              <Field label="Section title">
                <TextInput value={sec.title} placeholder="e.g. Certificates" onChange={(ev) => patchItem('custom', sec.id, { title: ev.target.value })} />
              </Field>
              {sec.items.map((it) => (
                <div key={it.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex gap-2">
                    <TextInput value={it.heading} placeholder="Heading"
                      onChange={(ev) => setItems(sec.items.map((x) => (x.id === it.id ? { ...x, heading: ev.target.value } : x)))} />
                    <TextInput value={it.meta} placeholder="Date or place" className="max-w-[9rem]"
                      onChange={(ev) => setItems(sec.items.map((x) => (x.id === it.id ? { ...x, meta: ev.target.value } : x)))} />
                    <IconBtn label="Remove entry" danger onClick={() => setItems(sec.items.filter((x) => x.id !== it.id))}><Trash2 size={15} /></IconBtn>
                  </div>
                  <TextArea rows={2} value={it.description} placeholder="Details (optional)"
                    onChange={(ev) => setItems(sec.items.map((x) => (x.id === it.id ? { ...x, description: ev.target.value } : x)))} />
                </div>
              ))}
              <Button type="button" variant="ghost" className="px-2! py-1! text-brand-700"
                onClick={() => setItems([...sec.items, { id: uid(), heading: '', meta: '', description: '' }])}>
                <Plus size={15} /> Add entry
              </Button>
            </ItemCard>
          );
        })}
        <AddBtn onClick={() => addItem('custom', { title: '', items: [{ id: uid(), heading: '', meta: '', description: '' }] })}>
          Add custom section
        </AddBtn>
      </AccordionSection>
    </div>
  );
}
