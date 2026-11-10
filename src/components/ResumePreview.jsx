import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { TEMPLATES } from '../data/constants.js';
import { Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { LANG_LABELS, LEVEL_LABELS } from '../data/constants.js';

export const PAGE_W = 794; // A4 at 96 dpi
export const PAGE_H = 1123;

const INK = '#0f172a';
const MUTED = '#64748b';

const range = (a, b, cur) => [a, cur ? 'Present' : b].filter(Boolean).join(' – ');
const lines = (arr = []) => arr.filter((x) => x && x.trim());

/* ---------- small building blocks ---------- */

function Contacts({ p, inline, justify = 'flex-start', color = 'inherit', iconColor = 'currentColor' }) {
  const webHref = (url) => /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const items = [
    [Mail, p.email, p.email ? `mailto:${p.email}` : ''],
    [Phone, p.phone, p.phone ? `tel:${p.phone.replace(/[^+\d]/g, '')}` : ''],
    [MapPin, p.address, ''],
    [Globe, p.website, p.website ? webHref(p.website) : ''],
    [Github, p.github, p.github ? webHref(p.github) : ''],
    [Linkedin, p.linkedin, p.linkedin ? webHref(p.linkedin) : ''],
  ].filter(([, v]) => v);
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: inline ? 'row' : 'column', flexWrap: 'wrap', justifyContent: justify, gap: inline ? '0.3em 1.3em' : '0.6em', color }}>
      {items.map(([Icon, v, href], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5em', wordBreak: 'break-word' }}>
          <Icon size={13} style={{ flexShrink: 0, marginTop: '0.22em', color: iconColor }} />
          {href ? <a href={href} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{v}</a> : <span>{v}</span>}
        </div>
      ))}
    </div>
  );
}

function Title({ kind, color, children }) {
  const base = { margin: '0 0 0.6em', fontWeight: 800, lineHeight: 1.25 };
  if (kind === 'classic')
    return <h2 style={{ ...base, textTransform: 'uppercase', fontSize: '0.95em', letterSpacing: '0.1em', color, borderBottom: `1.5px solid ${color}`, paddingBottom: '0.3em' }}>{children}</h2>;
  if (kind === 'sidebar')
    return <h2 style={{ ...base, fontSize: '1.02em', color: '#fff', borderBottom: '1px solid rgba(255,255,255,.4)', paddingBottom: '0.35em' }}>{children}</h2>;
  if (kind === 'exec')
    return <h2 style={{ ...base, fontSize: '1.05em', color: INK, borderLeft: `4px solid ${color}`, paddingLeft: '0.6em' }}>{children}</h2>;
  return <h2 style={{ ...base, fontSize: '1.12em', color }}>{children}</h2>;
}

const Block = ({ title, kind, color, gap, show = true, children }) =>
  show ? (
    <section style={{ marginBottom: gap }}>
      <Title kind={kind} color={color}>{title}</Title>
      {children}
    </section>
  ) : null;

function Bullets({ items }) {
  const list = lines(items);
  if (!list.length) return null;
  return (
    <ul style={{ margin: '0.35em 0 0', paddingLeft: '1.2em', listStyle: 'disc' }}>
      {list.map((b, i) => <li key={i} style={{ marginBottom: '0.15em' }}>{b}</li>)}
    </ul>
  );
}

function richTextHtml(item) {
  if (item.richText) return item.richText;
  const list = lines(item.bullets);
  return list.length ? `<ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul>` : '';
}

function RichText({ item }) {
  const html = richTextHtml(item);
  if (!html) return null;
  const safe = html.replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, '').replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  return <div className="resume-rich-text" dangerouslySetInnerHTML={{ __html: safe }} />;
}

const Row = ({ left, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
    <div style={{ minWidth: 0, flex: '1 1 auto', overflowWrap: 'anywhere', fontWeight: 700, color: INK }}>{left}</div>
    {right ? <div style={{ flexShrink: 0, fontSize: '0.88em', color: MUTED, whiteSpace: 'nowrap', textAlign: 'right' }}>{right}</div> : null}
  </div>
);

function Experience({ items, color }) {
  return items.map((e) => (
    <div key={e.id} className="avoid-break" style={{ marginBottom: '0.95em' }}>
      <Row left={e.role} right={range(e.start, e.end, e.current)} />
      <div style={{ color, fontWeight: 600, fontSize: '0.95em' }}>{[e.company, e.location].filter(Boolean).join(', ')}</div>
      <RichText item={e} />
    </div>
  ));
}

function Education({ items, color }) {
  return items.map((e) => (
    <div key={e.id} className="avoid-break" style={{ marginBottom: '0.8em' }}>
      <Row left={e.degree || e.school} right={range(e.start, e.end)} />
      {e.degree && e.school ? <div style={{ color, fontWeight: 600, fontSize: '0.95em' }}>{e.school}</div> : null}
      {e.description ? <div style={{ marginTop: '0.2em', whiteSpace: 'pre-line' }}>{e.description}</div> : null}
    </div>
  ));
}

function CustomBlocks({ sections, kind, color, gap }) {
  return sections
    .filter((c) => c.title || c.items.some((i) => i.heading || i.description))
    .map((c) => (
      <Block key={c.id} title={c.title || 'Section'} kind={kind} color={color} gap={gap}>
        {c.items.filter((i) => i.heading || i.description).map((i) => (
          <div key={i.id} className="avoid-break" style={{ marginBottom: '0.7em' }}>
            <Row left={i.heading} right={i.meta} />
            {i.description ? <div style={{ whiteSpace: 'pre-line' }}>{i.description}</div> : null}
          </div>
        ))}
      </Block>
    ));
}

function LevelBar({ level, fill, track }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: '0.3em' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ height: 5, flex: 1, borderRadius: 3, background: n <= level ? fill : track }} />
      ))}
    </div>
  );
}

function BarList({ items, labels, fill, track, text }) {
  return items.map((it) => (
    <div key={it.id} style={{ marginBottom: '0.7em', color: text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontWeight: 600 }}>{it.name}</span>
        {labels && it.level > 0 ? <span style={{ fontSize: '0.82em', opacity: 0.8 }}>{labels[it.level]}</span> : null}
      </div>
      {it.level > 0 ? <LevelBar level={it.level} fill={fill} track={track} /> : null}
    </div>
  ));
}

function Chips({ items, color }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4em' }}>
      {items.map((it) => (
        <span key={it.id} style={{ background: `${color}14`, color: INK, border: `1px solid ${color}40`, borderRadius: 4, padding: '0.15em 0.6em', fontWeight: 500 }}>
          {it.name}{it.level > 0 ? <span style={{ color: MUTED }}> · {LEVEL_LABELS[it.level]}</span> : null}
        </span>
      ))}
    </div>
  );
}

function LangInline({ items }) {
  return items.map((l) => (
    <div key={l.id} style={{ marginBottom: '0.3em' }}>
      <span style={{ fontWeight: 600, color: INK }}>{l.name}</span>
      {l.level > 0 ? <span style={{ color: MUTED }}> – {LANG_LABELS[l.level]}</span> : null}
    </div>
  ));
}

const photoStyle = (extra, p) => ({ objectFit: 'cover', objectPosition: `${p.photoPosition?.x ?? 50}% ${p.photoPosition?.y ?? 50}%`, display: 'block', ...extra });

/* ---------- templates ---------- */

function useParts(d) {
  const p = d.personal;
  return {
    p,
    hasContact: !!(p.email || p.phone || p.address || p.website || p.github || p.linkedin),
    hasSummary: !!d.summary.trim(),
    exp: d.experience.filter((e) => e.role || e.company || lines(e.bullets).length),
    edu: d.education.filter((e) => e.school || e.degree),
    skills: d.skills.filter((x) => x.name.trim()),
    langs: d.languages.filter((x) => x.name.trim()),
    hobbies: (d.hobbies || []).filter((x) => x.name.trim()),
  };
}

function Modern({ d, s }) {
  const { p, hasContact, hasSummary, exp, edu, skills, langs } = useParts(d);
  const c = s.color, gap = s.sectionSpacing;
  return (
    <div style={{ display: 'flex', minHeight: PAGE_H }}>
      <aside style={{ width: '33%', background: c, color: '#fff', padding: '42px 24px' }}>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: '74%', aspectRatio: '1 / 1', borderRadius: '50%', margin: `0 auto ${gap * 1.3}px`, border: '3px solid rgba(255,255,255,.7)' }, p)} />}
        <Block title="Contact" kind="sidebar" gap={gap} show={hasContact}>
          <Contacts p={p} iconColor="rgba(255,255,255,.85)" />
        </Block>
        <Block title="Skills" kind="sidebar" gap={gap} show={skills.length > 0}>
          <BarList items={skills} fill="#fff" track="rgba(255,255,255,.3)" text="#fff" />
        </Block>
        <Block title="Languages" kind="sidebar" gap={gap} show={langs.length > 0}>
          <BarList items={langs} labels={LANG_LABELS} fill="#fff" track="rgba(255,255,255,.3)" text="#fff" />
        </Block>
      </aside>
      <main style={{ flex: 1, padding: '46px 36px 40px' }}>
        <h1 style={{ margin: 0, fontSize: '2.6em', lineHeight: 1.1, fontWeight: 800, color: INK }}>{p.fullName || 'Your name'}</h1>
        {p.jobTitle && <div style={{ fontSize: '1.2em', color: c, fontWeight: 600, marginTop: '0.25em' }}>{p.jobTitle}</div>}
        <div style={{ height: gap * 1.3 }} />
        <Block title="Profile" color={c} gap={gap} show={hasSummary}><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{d.summary}</p></Block>
        <Block title="Education" color={c} gap={gap} show={edu.length > 0}><Education items={edu} color={c} /></Block>
        <Block title="Experience" color={c} gap={gap} show={exp.length > 0}><Experience items={exp} color={c} /></Block>
        <CustomBlocks sections={d.custom} color={c} gap={gap} />
      </main>
    </div>
  );
}

function Classic({ d, s }) {
  const { p, hasContact, hasSummary, exp, edu, skills, langs } = useParts(d);
  const c = s.color, gap = s.sectionSpacing;
  return (
    <div style={{ padding: '46px 54px', minHeight: PAGE_H }}>
      <header style={{ textAlign: 'center', marginBottom: gap * 1.3 }}>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: 92, height: 92, borderRadius: '50%', margin: '0 auto 0.8em' }, p)} />}
        <h1 style={{ margin: 0, fontSize: '2.3em', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: INK, lineHeight: 1.15 }}>{p.fullName || 'Your name'}</h1>
        {p.jobTitle && <div style={{ fontSize: '1.15em', color: c, fontWeight: 600, marginTop: '0.3em' }}>{p.jobTitle}</div>}
        {hasContact && <div style={{ marginTop: '0.8em' }}><Contacts p={p} inline justify="center" color={MUTED} iconColor={c} /></div>}
      </header>
      <Block title="Summary" kind="classic" color={c} gap={gap} show={hasSummary}><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{d.summary}</p></Block>
      <Block title="Education" kind="classic" color={c} gap={gap} show={edu.length > 0}><Education items={edu} color={c} /></Block>
      <Block title="Experience" kind="classic" color={c} gap={gap} show={exp.length > 0}><Experience items={exp} color={c} /></Block>
      <Block title="Skills" kind="classic" color={c} gap={gap} show={skills.length > 0}><Chips items={skills} color={c} /></Block>
      <Block title="Languages" kind="classic" color={c} gap={gap} show={langs.length > 0}><LangInline items={langs} /></Block>
      <CustomBlocks sections={d.custom} kind="classic" color={c} gap={gap} />
    </div>
  );
}

function Executive({ d, s }) {
  const { p, hasContact, hasSummary, exp, edu, skills, langs } = useParts(d);
  const c = s.color, gap = s.sectionSpacing;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: PAGE_H }}>
      <header style={{ background: c, color: '#fff', padding: '40px 46px 30px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '2.7em', lineHeight: 1.08, fontWeight: 800 }}>{p.fullName || 'Your name'}</h1>
          {p.jobTitle && <div style={{ fontSize: '1.2em', marginTop: '0.3em', opacity: 0.92 }}>{p.jobTitle}</div>}
          {hasContact && <div style={{ marginTop: '1em' }}><Contacts p={p} inline iconColor="rgba(255,255,255,.85)" /></div>}
        </div>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: 112, height: 112, borderRadius: 14, border: '3px solid rgba(255,255,255,.7)' }, p)} />}
      </header>
      <div style={{ display: 'flex', flex: 1, alignItems: 'stretch', minWidth: 0 }}>
        <main style={{ flex: '2 1 0', minWidth: 0, padding: '30px 26px 36px 46px' }}>
          <Block title="Profile" kind="exec" color={c} gap={gap} show={hasSummary}><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{d.summary}</p></Block>
          <Block title="Experience" kind="exec" color={c} gap={gap} show={exp.length > 0}><Experience items={exp} color={c} /></Block>
          <CustomBlocks sections={d.custom} kind="exec" color={c} gap={gap} />
        </main>
        <aside style={{ flex: '1 1 0', minWidth: 0, background: '#f1f5f9', padding: '30px 30px 36px 26px' }}>
          <Block title="Education" kind="exec" color={c} gap={gap} show={edu.length > 0}><Education items={edu} color={c} /></Block>
          <Block title="Skills" kind="exec" color={c} gap={gap} show={skills.length > 0}>
            <BarList items={skills} fill={c} track="#cbd5e1" text={INK} />
          </Block>
          <Block title="Languages" kind="exec" color={c} gap={gap} show={langs.length > 0}>
            <BarList items={langs} labels={LANG_LABELS} fill={c} track="#cbd5e1" text={INK} />
          </Block>
        </aside>
      </div>
    </div>
  );
}

function Profile({ d, s }) {
  const { p, hasContact, hasSummary, exp, edu, skills, langs, hobbies } = useParts(d);
  const c = s.color, gap = s.sectionSpacing;
  const sidebarGap = Math.max(gap + 16, gap * 2.0);
  return (
    <div style={{ display: 'flex', minHeight: PAGE_H, background: '#fff' }}>
      <aside style={{ width: '34%', flexShrink: 0, background: '#f1f4f7', color: INK, padding: '0 22px 38px' }}>
        <div style={{ margin: '0 -22px 62px', minHeight: 150, padding: '28px 22px 70px', textAlign: 'center', color: '#fff', background: c, borderBottomRightRadius: '55% 34%', borderBottomLeftRadius: '10% 12%' }}>
          <h1 style={{ margin: 0, fontSize: '1.35em', lineHeight: 1.2, fontWeight: 800 }}>{p.fullName || 'Your name'}</h1>
          {p.jobTitle && <div style={{ marginTop: 5, fontSize: '1.2em', opacity: 0.92 }}>{p.jobTitle}</div>}
        </div>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: '76%', aspectRatio: '1 / 1', borderRadius: '50%', margin: '-112px auto 28px', border: '4px solid #fff', position: 'relative' }, p)} />}
        <Block title="Personal details" kind="classic" color={c} gap={sidebarGap} show={hasContact}>
          <Contacts p={p} color={INK} iconColor={c} />
        </Block>
        <Block title="Skills" kind="classic" color={c} gap={sidebarGap} show={skills.length > 0}>
          <BarList items={skills} fill={c} track="#d4dbe2" text={INK} />
        </Block>
        <Block title="Languages" kind="classic" color={c} gap={sidebarGap} show={langs.length > 0}>
          <BarList items={langs} labels={LANG_LABELS} fill={c} track="#d4dbe2" text={INK} />
        </Block>
        <Block title="Hobbies" kind="classic" color={c} gap={sidebarGap} show={hobbies.length > 0}>
          <ul style={{ margin: 0, paddingLeft: '1.1em', listStyle: 'square' }}>{hobbies.map((h) => <li key={h.id} style={{ marginBottom: '0.35em' }}>{h.name}</li>)}</ul>
        </Block>
      </aside>
      <main style={{ flex: 1, padding: '42px 34px', background: '#fff' }}>
        {hasSummary && <Block title="Profile" kind="classic" color={c} gap={gap}><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{d.summary}</p></Block>}
        <Block title="Education" kind="classic" color={c} gap={gap} show={edu.length > 0}><Education items={edu} color={c} /></Block>
        <Block title="Employment" kind="classic" color={c} gap={gap} show={exp.length > 0}><Experience items={exp} color={c} /></Block>
        <CustomBlocks sections={d.custom} color={c} gap={gap} />
      </main>
    </div>
  );
}

function Professional({ d, s }) {
  const { p, hasContact, hasSummary, exp, edu, skills, langs, hobbies } = useParts(d);
  const c = s.color, gap = s.sectionSpacing;
  return (
    <div style={{ minHeight: PAGE_H, padding: '44px 48px', background: '#fff' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 22, borderBottom: `2px solid ${c}`, paddingBottom: 22 }}>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: 92, height: 92, flexShrink: 0, borderRadius: '50%' }, p)} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, color: INK, fontSize: '2.4em', fontWeight: 800, lineHeight: 1.12 }}>{p.fullName || 'Your name'}</h1>
          {p.jobTitle && <div style={{ marginTop: 6, color: c, fontSize: '1.12em', fontWeight: 600 }}>{p.jobTitle}</div>}
          {hasContact && <div style={{ marginTop: 12 }}><Contacts p={p} inline color={MUTED} iconColor={c} /></div>}
        </div>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 0.9fr)', gap: 28, paddingTop: 25 }}>
        <main style={{ minWidth: 0 }}>
          <Block title="Profile" kind="classic" color={c} gap={gap} show={hasSummary}><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{d.summary}</p></Block>
          <Block title="Education" kind="classic" color={c} gap={gap} show={edu.length > 0}><Education items={edu} color={c} /></Block>
          <Block title="Experience" kind="classic" color={c} gap={gap} show={exp.length > 0}><Experience items={exp} color={c} /></Block>
          <CustomBlocks sections={d.custom} kind="classic" color={c} gap={gap} />
        </main>
        <aside style={{ minWidth: 0, padding: '20px 18px', background: '#f8fafc', borderTop: `3px solid ${c}` }}>
          <Block title="Skills" kind="classic" color={c} gap={gap} show={skills.length > 0}><BarList items={skills} fill={c} track="#dbe3ea" text={INK} /></Block>
          <Block title="Languages" kind="classic" color={c} gap={gap} show={langs.length > 0}><LangInline items={langs} /></Block>
          <Block title="Hobbies" kind="classic" color={c} gap={gap} show={hobbies.length > 0}>
            <ul style={{ margin: 0, paddingLeft: '1.2em', listStyle: 'disc' }}>{hobbies.map((h) => <li key={h.id} style={{ marginBottom: '0.35em' }}>{h.name}</li>)}</ul>
          </Block>
        </aside>
      </div>
    </div>
  );
}

function VariantTemplate({ d, s, variant }) {
  const { p, hasContact, hasSummary, exp, edu, skills, langs, hobbies } = useParts(d);
  const gap = variant === 'simple' ? Math.max(10, s.sectionSpacing - 5) : s.sectionSpacing;
  const c = variant === 'luxurious' ? '#a98745' : s.color;
  const dark = variant === 'luxurious';
  const side = ['vertical', 'casual'].includes(variant);
  const wideHeader = ['horizontal', 'luxurious'].includes(variant);
  const centered = ['circular', 'elegant'].includes(variant);
  const titleKind = ['elegant', 'simple'].includes(variant) ? 'classic' : variant === 'metro' ? 'exec' : undefined;
  const sidePanel = (
    <aside style={{ width: side ? (variant === 'vertical' ? '29%' : '31%') : '34%', flexShrink: 0, background: dark ? '#1c2527' : variant === 'casual' ? '#eef6f2' : '#f1f5f9', color: dark ? '#fff' : INK, padding: '30px 22px' }}>
      {side && <div style={{ marginBottom: gap, textAlign: variant === 'casual' ? 'left' : 'center' }}>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: variant === 'casual' ? 82 : '74%', aspectRatio: '1 / 1', borderRadius: '50%', margin: '0 auto 12px' }, p)} />}
        <div style={{ fontWeight: 800, fontSize: '1.25em' }}>{p.fullName || 'Your name'}</div>
        {p.jobTitle && <div style={{ marginTop: 5, color: c, fontWeight: 600 }}>{p.jobTitle}</div>}
      </div>}
      <Block title="Contact" kind="sidebar" color={c} gap={gap} show={hasContact}><Contacts p={p} color={dark ? '#e2e8f0' : MUTED} iconColor={c} /></Block>
      <Block title="Skills" kind="sidebar" color={c} gap={gap} show={skills.length > 0}><BarList items={skills} fill={c} track={dark ? '#475569' : '#cbd5e1'} text={dark ? '#fff' : INK} /></Block>
      <Block title="Languages" kind="sidebar" color={c} gap={gap} show={langs.length > 0}><BarList items={langs} labels={LANG_LABELS} fill={c} track={dark ? '#475569' : '#cbd5e1'} text={dark ? '#fff' : INK} /></Block>
      <Block title="Hobbies" kind="sidebar" color={c} gap={gap} show={hobbies.length > 0}><LangInline items={hobbies.map((h) => ({ ...h, level: 0 }))} /></Block>
    </aside>
  );
  const header = (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: centered ? 'center' : 'flex-start', textAlign: centered ? 'center' : 'left', gap: 20, padding: variant === 'elegant' ? '6px 0 20px' : '0 0 22px', marginBottom: 24, borderBottom: `2px solid ${c}` }}>
      {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: variant === 'circular' ? 100 : 82, height: variant === 'circular' ? 100 : 82, borderRadius: '50%', order: centered ? 0 : 1 }, p)} />}
      <div style={{ flex: centered ? '0 1 auto' : 1 }}>
        <h1 style={{ margin: 0, color: dark ? '#fff' : INK, fontSize: variant === 'elegant' ? '2.2em' : '2.35em', fontWeight: 800, lineHeight: 1.1, fontFamily: variant === 'elegant' ? 'Georgia, serif' : s.fontFamily, letterSpacing: variant === 'metro' ? '-0.04em' : 'normal' }}>{p.fullName || 'Your name'}</h1>
        {p.jobTitle && <div style={{ marginTop: 7, color: c, fontSize: '1.1em', fontWeight: 600 }}>{p.jobTitle}</div>}
        {hasContact && !side && <div style={{ marginTop: 12, color: dark ? '#e2e8f0' : MUTED }}><Contacts p={p} inline justify={centered ? 'center' : 'flex-start'} iconColor={c} /></div>}
      </div>
    </header>
  );
  const experience = variant === 'chrono' ? (
    <div style={{ borderLeft: `2px solid ${c}`, marginLeft: 5, paddingLeft: 18 }}>
      {exp.map((item) => <div key={item.id} className="avoid-break" style={{ position: 'relative', marginBottom: '1em' }}>
        <span style={{ position: 'absolute', left: -24, top: 4, height: 10, width: 10, borderRadius: '50%', background: c, border: '2px solid white', boxShadow: `0 0 0 1px ${c}` }} />
        <Row left={item.role} right={range(item.start, item.end, item.current)} />
        <div style={{ color: c, fontWeight: 600 }}>{[item.company, item.location].filter(Boolean).join(', ')}</div><Bullets items={item.bullets} />
      </div>)}
    </div>
  ) : <Experience items={exp} color={c} />;
  const content = (
    <main style={{ flex: 1, minWidth: 0, padding: side ? '34px 36px 44px' : wideHeader ? '34px 46px 48px' : '0', background: variant === 'metro' ? 'linear-gradient(90deg,#fff 0%,#fff 97%,#f1f5f9 97%)' : '#fff', boxSizing: 'border-box' }}>
      {!side && !wideHeader && header}
      <Block title="Profile" kind={titleKind} color={c} gap={gap} show={hasSummary}><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{d.summary}</p></Block>
      <Block title="Education" kind={titleKind} color={c} gap={gap} show={edu.length > 0}><Education items={edu} color={c} /></Block>
      <Block title={variant === 'chrono' ? 'Career timeline' : 'Experience'} kind={titleKind} color={c} gap={gap} show={exp.length > 0}>{experience}</Block>
      {!side && <>
        <Block title="Skills" kind={titleKind} color={c} gap={gap} show={skills.length > 0}><Chips items={skills} color={c} /></Block>
        <Block title="Languages" kind={titleKind} color={c} gap={gap} show={langs.length > 0}><LangInline items={langs} /></Block>
        <Block title="Hobbies" kind={titleKind} color={c} gap={gap} show={hobbies.length > 0}><LangInline items={hobbies.map((h) => ({ ...h, level: 0 }))} /></Block>
      </>}
      <CustomBlocks sections={d.custom} kind={titleKind} color={c} gap={gap} />
    </main>
  );
  return (
    <div style={{ minHeight: PAGE_H, padding: wideHeader ? 0 : variant === 'simple' ? '44px 58px 52px' : '40px 44px 48px', background: '#fff', borderTop: variant === 'casual' ? `12px solid ${c}` : undefined, boxSizing: 'border-box' }}>
      {wideHeader && <header style={{ display: 'flex', alignItems: 'center', gap: 22, minHeight: 180, padding: '34px 46px', color: '#fff', background: dark ? '#1c2527' : c }}>
        <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: '2.45em', fontWeight: 800 }}>{p.fullName || 'Your name'}</h1>{p.jobTitle && <div style={{ marginTop: 6, fontSize: '1.15em', opacity: 0.92 }}>{p.jobTitle}</div>}{hasContact && <div style={{ marginTop: 12 }}><Contacts p={p} inline color="#fff" iconColor={dark ? '#d6bd83' : '#fff'} /></div>}</div>
        {p.photo && <img src={p.photo} alt="" style={photoStyle({ width: 96, height: 96, borderRadius: variant === 'horizontal' ? 12 : '50%', border: '3px solid rgba(255,255,255,.8)' }, p)} />}
      </header>}
      <div style={{ display: 'flex', minHeight: wideHeader ? PAGE_H - 180 : undefined }}>
        {side && sidePanel}
        {variant === 'metro' && <div style={{ width: 13, flexShrink: 0, background: `linear-gradient(${c} 0 24%,#e2e8f0 24% 48%,${c} 48% 72%,#e2e8f0 72%)` }} />}
        {content}
      </div>
    </div>
  );
}

const Circular = (props) => <VariantTemplate {...props} variant="circular" />;
const Vertical = (props) => <VariantTemplate {...props} variant="vertical" />;
const Horizontal = (props) => <VariantTemplate {...props} variant="horizontal" />;
const Elegant = (props) => <VariantTemplate {...props} variant="elegant" />;
const Casual = (props) => <VariantTemplate {...props} variant="casual" />;
const Chrono = (props) => <VariantTemplate {...props} variant="chrono" />;
const Luxurious = (props) => <VariantTemplate {...props} variant="luxurious" />;
const Simple = (props) => <VariantTemplate {...props} variant="simple" />;
const Metro = (props) => <VariantTemplate {...props} variant="metro" />;

const LAYOUTS = { modern: Modern, classic: Classic, executive: Executive, profile: Profile, professional: Professional,
  circular: Circular, vertical: Vertical, horizontal: Horizontal, elegant: Elegant, casual: Casual, chrono: Chrono, luxurious: Luxurious, simple: Simple, metro: Metro };

/* ---------- paper + auto-fit scaling ---------- */

export default function ResumePreview({ resume, onEdit }) {
  const { data, settings: s, template } = resume;
  const wrapRef = useRef(null);
  const paperRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(PAGE_H);
  const [templates, setTemplates] = useState(TEMPLATES);
  useEffect(() => { api.templates.list().then(setTemplates).catch(() => setTemplates(TEMPLATES)); }, []);
  const layoutId = templates.find((t) => t.id === template)?.layout || template;
  const Layout = LAYOUTS[layoutId] || Modern;

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      // Ignore sub-pixel width changes (often caused by scrollbar rounding)
      // so the scaled page doesn't visibly wobble while the editor updates.
      const next = Math.round(Math.max(0.2, Math.min(1, e.contentRect.width / PAGE_W)) * 1000) / 1000;
      setScale((current) => current === next ? current : next);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const next = paperRef.current?.offsetHeight || PAGE_H;
      setHeight((current) => Math.abs(current - next) < 1 ? current : next);
    });
    ro.observe(paperRef.current);
    return () => ro.disconnect();
  }, []);

  const pages = Math.max(1, Math.ceil((height - 4) / PAGE_H));

  return (
    <div ref={wrapRef} className="group relative flex w-full justify-center" title="Hover over the resume to see this tip; click to return to the editable fields." onClick={onEdit}>
      <div className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-ink/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">Click the resume to edit its information</div>
      <div className="shadow-[0_10px_40px_-8px_rgba(16,34,31,0.35)]" style={{ width: PAGE_W * scale, height: height * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PAGE_W }}>
          <div
            id="resume-paper"
            ref={paperRef}
            style={{
              position: 'relative', width: PAGE_W, minHeight: PAGE_H, background: '#fff', color: '#1e293b',
              fontFamily: s.fontFamily, fontSize: s.fontSize, lineHeight: s.lineHeight, overflow: 'hidden',
            }}
          >
            <Layout d={data} s={s} />
            {Array.from({ length: pages - 1 }, (_, i) => (
              <div
                key={i}
                className="no-export"
                data-html2canvas-ignore="true"
                style={{ position: 'absolute', left: 0, right: 0, top: (i + 1) * PAGE_H, borderTop: '2px dashed #f87171', pointerEvents: 'none' }}
              >
                <span style={{ position: 'absolute', right: 8, top: 4, fontSize: 11, fontFamily: 'sans-serif', color: '#ef4444', background: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                  Page {i + 2} starts here
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
