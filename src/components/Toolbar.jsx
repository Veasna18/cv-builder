import { useEffect, useRef, useState } from 'react';
import { Check, LayoutTemplate, Palette, SlidersHorizontal, Type } from 'lucide-react';
import { COLORS, DEFAULT_SETTINGS, FONTS, TEMPLATES } from '../data/constants.js';
import { api } from '../services/api.js';

/** Tiny schematic of each template, tinted with the current color. */
function Thumb({ id, color, image }) {
  const line = <div className="h-[3px] rounded bg-slate-300" />;
  return (
    <div className="relative h-[72px] w-[52px] overflow-hidden rounded border border-slate-300 bg-white">
      {image ? <img src={image} alt="" className="h-full w-full object-contain" /> : <>
      {id === 'modern' && (
        <>
          <div className="absolute inset-y-0 left-0 w-[34%]" style={{ background: color }} />
          <div className="absolute inset-y-2 left-[42%] right-1.5 space-y-1.5">{line}{line}{line}{line}</div>
        </>
      )}
      {id === 'classic' && (
        <div className="space-y-1.5 p-1.5">
          <div className="mx-auto h-1.5 w-8 rounded" style={{ background: color }} />
          <div className="h-px" style={{ background: color }} />
          {line}{line}{line}{line}
        </div>
      )}
      {id === 'executive' && (
        <>
          <div className="h-5" style={{ background: color }} />
          <div className="absolute bottom-0 right-0 top-5 w-[34%] bg-slate-100" />
          <div className="absolute left-1.5 top-7 w-[52%] space-y-1.5">{line}{line}{line}</div>
        </>
      )}
      {id === 'profile' && (
        <>
          <div className="absolute inset-y-0 left-0 w-[35%]" style={{ background: color }} />
          <div className="absolute left-[42%] right-1.5 top-2 space-y-1.5">{line}{line}{line}{line}</div>
          <div className="absolute bottom-2 left-1.5 w-[28%] space-y-1.5">{line}{line}</div>
        </>
      )}
      {id === 'professional' && (
        <>
          <div className="h-4 border-b-2 p-1" style={{ borderColor: color }} />
          <div className="grid grid-cols-[1.5fr_1fr] gap-1 p-1.5"><div className="space-y-1.5">{line}{line}{line}{line}</div><div className="space-y-1.5 rounded-sm bg-slate-100 p-1">{line}{line}{line}</div></div>
        </>
      )}
      {id === 'circular' && <div className="space-y-1.5 p-1.5"><div className="mx-auto h-4 w-4 rounded-full" style={{ background: color }} />{line}{line}{line}</div>}
      {id === 'vertical' && <><div className="absolute inset-y-0 left-0 w-[28%] bg-slate-100" /><div className="absolute inset-y-2 left-1 w-[22%] space-y-1.5"><span className="block h-2 w-2 rounded-full" style={{ background: color }} />{line}{line}</div><div className="absolute inset-y-2 left-[36%] right-1 space-y-1.5">{line}{line}{line}</div></>}
      {id === 'horizontal' && <><div className="h-5" style={{ background: color }} /><div className="space-y-1.5 p-1.5">{line}{line}{line}{line}</div></>}
      {id === 'elegant' && <div className="space-y-2 p-2"><div className="mx-auto h-1.5 w-7 rounded bg-slate-500" /><div className="mx-auto h-px w-8" style={{ background: color }} />{line}{line}{line}</div>}
      {id === 'casual' && <><div className="absolute inset-y-0 left-0 w-2" style={{ background: color }} /><div className="space-y-1.5 p-2 pl-3">{line}{line}{line}{line}</div></>}
      {id === 'chrono' && <div className="space-y-2 p-2"><div className="ml-1 h-14 border-l-2" style={{ borderColor: color }}><div className="space-y-1.5 pl-2">{line}{line}{line}</div></div>{line}</div>}
      {id === 'luxurious' && <><div className="h-6 bg-slate-800" /><div className="space-y-1.5 p-2"><div className="h-px" style={{ background: '#a98745' }} />{line}{line}{line}</div></>}
      {id === 'simple' && <div className="space-y-2 p-2">{line}{line}{line}{line}</div>}
      {id === 'metro' && <><div className="absolute inset-y-0 left-0 w-1.5" style={{ background: color }} /><div className="space-y-2 p-2 pl-3"><div className="h-2 w-5 rounded-sm" style={{ background: color }} />{line}{line}<div className="h-2 w-5 rounded-sm" style={{ background: color }} />{line}</div></>}
      </>}
    </div>
  );
}

const Slider = ({ label, value, min, max, step, onChange, format }) => (
  <label className="block">
    <span className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
      {label}<span className="text-slate-500">{format ? format(value) : value}</span>
    </span>
    <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
);

export default function Toolbar({ resume, onChange }) {
  const [open, setOpen] = useState(null);
  const [templates, setTemplates] = useState(TEMPLATES);
  const root = useRef(null);
  const { template, settings: s } = resume;
  useEffect(() => { api.templates.list().then(setTemplates).catch(() => setTemplates(TEMPLATES)); }, []);
  const setS = (patch) => onChange({ settings: { ...s, ...patch } });

  useEffect(() => {
    const close = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(null); };
    const esc = (e) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  const tabs = [
    { id: 'template', label: 'Template', icon: LayoutTemplate },
    { id: 'font', label: 'Font', icon: Type },
    { id: 'spacing', label: 'Size & spacing', icon: SlidersHorizontal },
    { id: 'color', label: 'Color', icon: Palette },
  ];

  return (
    <div ref={root} className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3">
      <div className="pointer-events-auto relative">
        {open && (
          <div className="absolute bottom-full left-1/2 mb-3 w-[min(92vw,22rem)] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
            {open === 'template' && (
              <div className="grid gap-2">
                {templates.map((t) => (
                  <button key={t.id} type="button" onClick={() => onChange({ template: t.id })}
                    className={`flex items-center gap-3 rounded-xl border p-2 text-left transition-colors ${template === t.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <Thumb id={t.layout || t.id} color={s.color} image={t.image_data || t.preview} />
                    <span className="flex-1">
                      <span className="block text-sm font-bold">{t.name}</span>
                      <span className="block text-xs text-slate-500">{t.desc}</span>
                    </span>
                    {template === t.id && <Check size={18} className="mr-1 text-brand-600" />}
                  </button>
                ))}
              </div>
            )}

            {open === 'font' && (
              <div className="grid gap-1">
                {FONTS.map((f) => (
                  <button key={f.label} type="button" onClick={() => setS({ fontFamily: f.value })}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-base ${s.fontFamily === f.value ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50'}`}
                    style={{ fontFamily: f.value }}>
                    {f.label}
                    {s.fontFamily === f.value && <Check size={16} className="text-brand-600" />}
                  </button>
                ))}
              </div>
            )}

            {open === 'spacing' && (
              <div className="space-y-4">
                <Slider label="Font size" min={11} max={16} step={0.5} value={s.fontSize} onChange={(v) => setS({ fontSize: v })} format={(v) => `${v}px`} />
                <Slider label="Line spacing" min={1.2} max={2} step={0.05} value={s.lineHeight} onChange={(v) => setS({ lineHeight: v })} format={(v) => v.toFixed(2)} />
                <Slider label="Space between sections" min={8} max={36} step={1} value={s.sectionSpacing} onChange={(v) => setS({ sectionSpacing: v })} format={(v) => `${v}px`} />
                <button type="button" className="text-xs font-semibold text-slate-500 underline hover:text-brand-700"
                  onClick={() => setS({ fontSize: DEFAULT_SETTINGS.fontSize, lineHeight: DEFAULT_SETTINGS.lineHeight, sectionSpacing: DEFAULT_SETTINGS.sectionSpacing })}>
                  Reset to defaults
                </button>
              </div>
            )}

            {open === 'color' && (
              <div>
                <div className="grid grid-cols-4 gap-3">
                  {COLORS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setS({ color: c.value })} aria-label={c.name} title={c.name}
                      className="grid h-10 place-items-center rounded-full ring-offset-2 transition-shadow"
                      style={{ background: c.value, boxShadow: s.color === c.value ? `0 0 0 2px #fff, 0 0 0 4px ${c.value}` : 'none' }}>
                      {s.color === c.value && <Check size={18} color="#fff" />}
                    </button>
                  ))}
                </div>
                <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-600">
                  <input type="color" value={s.color} onChange={(e) => setS({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5" />
                  Pick any color
                </label>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 rounded-2xl bg-ink p-1.5 text-white shadow-xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${open === id ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              {id === 'color' ? <span className="h-4 w-4 rounded-full ring-2 ring-white/70" style={{ background: s.color }} /> : <Icon size={17} />}
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
