export const uid = () => Math.random().toString(36).slice(2, 10);

const KHMER = "'Noto Sans Khmer'";

export const TEMPLATES = [
  { id: 'circular', name: 'Circular', desc: 'Add a few gentle curves to take the angular edge off.', preview: '/template-previews/circular.svg' },
  { id: 'professional', name: 'Professional', desc: 'A classic resume template with a modern, organized structure.', preview: '/template-previews/professional.svg' },
  { id: 'vertical', name: 'Vertical', desc: 'Display your skills alongside your experience in a perfectly aligned template.', preview: '/template-previews/vertical.svg' },
  { id: 'horizontal', name: 'Horizontal', desc: 'Get the most out of your space and display a professional look.', preview: '/template-previews/horizontal.svg' },
  { id: 'elegant', name: 'Elegant', desc: 'Balance an attractive look with an easy-to-read format and structure.', preview: '/template-previews/elegant.svg' },
  { id: 'modern', name: 'Modern', desc: 'A sharp, attractive template for the future of work.', preview: '/template-previews/modern.svg' },
  { id: 'casual', name: 'Casual', desc: 'Attract recruiters’ eyes with a simple stripe of color.', preview: '/template-previews/casual.svg' },
  { id: 'chrono', name: 'Chrono', desc: 'A well-structured template with simplicity and a splash of color.', preview: '/template-previews/chrono.svg' },
  { id: 'luxurious', name: 'Luxurious', desc: 'A new take on an old-fashioned resume that draws attention to your summary.', preview: '/template-previews/luxurious.svg' },
  { id: 'classic', name: 'Classic', desc: 'Showcase your experience in a traditional resume with distinct sections.', preview: '/template-previews/classic.svg' },
  { id: 'simple', name: 'Simple', desc: 'Focus on your achievements and qualifications with a digestible layout.', preview: '/template-previews/simple.svg' },
  { id: 'metro', name: 'Metro', desc: 'Draw the eye to each section with stand-out headers.', preview: '/template-previews/metro.svg' },
  { id: 'profile', name: 'Default CV', desc: 'Blue profile header with a clean sidebar and readable sections.', preview: '/template-previews/profile.png' },
];

export const FONTS = [
  { label: 'Inter', value: `'Inter', ${KHMER}, sans-serif` },
  { label: 'Arial', value: `Arial, Helvetica, ${KHMER}, sans-serif` },
  { label: 'Times New Roman', value: `'Times New Roman', Times, ${KHMER}, serif` },
  { label: 'Roboto', value: `'Roboto', ${KHMER}, sans-serif` },
  { label: 'Lato', value: `'Lato', ${KHMER}, sans-serif` },
  { label: 'Merriweather', value: `'Merriweather', ${KHMER}, serif` },
  { label: 'Montserrat', value: `'Montserrat', ${KHMER}, sans-serif` },
];

export const COLORS = [
  { name: 'Teal', value: '#0f766e' },
  { name: 'Blue', value: '#1d4ed8' },
  { name: 'Indigo', value: '#4338ca' },
  { name: 'Plum', value: '#86198f' },
  { name: 'Crimson', value: '#be123c' },
  { name: 'Amber', value: '#b45309' },
  { name: 'Forest', value: '#166534' },
  { name: 'Charcoal', value: '#1f2937' },
];

export const DEFAULT_SETTINGS = {
  fontFamily: FONTS[0].value,
  fontSize: 13,
  lineHeight: 1.5,
  sectionSpacing: 18,
  color: COLORS[0].value,
};

export const LEVEL_LABELS = ['', 'Basic', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
export const LANG_LABELS = ['', 'Basic', 'Elementary', 'Intermediate', 'Advanced', 'Native'];

const blankData = () => ({
  personal: { fullName: '', jobTitle: '', email: '', phone: '', address: '', website: '', github: '', linkedin: '', photo: '', photoPosition: { x: 50, y: 50 } },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  languages: [],
  hobbies: [],
  custom: [],
});

export const newResume = () => ({
  title: 'Untitled resume',
  template: 'profile',
  settings: { ...DEFAULT_SETTINGS },
  data: blankData(),
});

export const clearedData = blankData;

/** Fill any missing keys (old or imported resumes) so the UI never crashes. */
export function mergeResume(r = {}) {
  const base = blankData();
  const d = r.data || {};
  return {
    title: r.title || 'Untitled resume',
    template: typeof r.template === 'string' && r.template ? r.template : 'profile',
    settings: { ...DEFAULT_SETTINGS, ...(r.settings || {}) },
    data: {
      ...base,
      ...d,
      personal: { ...base.personal, ...(d.personal || {}) },
      experience: d.experience || [],
      education: d.education || [],
      skills: d.skills || [],
      languages: d.languages || [],
      hobbies: d.hobbies || [],
      custom: d.custom || [],
    },
  };
}
