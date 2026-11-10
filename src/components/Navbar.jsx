import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FileText, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const link = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="z-30 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <FileText size={18} />
          </span>
          <span className="hidden sm:inline">CV Builder</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={link}>My resumes</NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin" className={link}>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} /> Admin</span>
              </NavLink>
            )}
          </nav>
        )}

        {!user && (
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#tools" className={link({ isActive: false })}>Tools</a>
            <a href="#pricing" className={link({ isActive: false })}>Pricing</a>
            <a href="#faq" className={link({ isActive: false })}>FAQ</a>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!user && (
            <>
              <Link to="/login" className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700">Log in</Link>
              <Link to="/editor" className="rounded-full bg-[#2878e8] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1767d7]">Create resume</Link>
            </>
          )}
          {user && (
            <>
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-slate-500">{user.phone}</div>
              </div>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
