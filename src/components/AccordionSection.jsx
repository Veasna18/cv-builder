import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function AccordionSection({ id, title, icon: Icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="scroll-mt-28 border-b border-slate-200">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50"
        >
          {Icon && <Icon size={18} className="text-brand-600" />}
          <span className="flex-1 text-sm font-bold">{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{count}</span>
          )}
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-3 px-5 pb-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
