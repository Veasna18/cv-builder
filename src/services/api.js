const API = import.meta.env.VITE_API_URL || 'http://localhost/cv-resume-builder/backend/api';
const TOKEN_KEY = 'cvb_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that Laragon (Apache + MySQL) is running.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new Event('cvb:unauthorized'));
    }
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  templates: {
    list: () => request('templates.php', { auth: false }).then((r) => (r.templates || []).filter((t) => !/population/i.test(`${t.id || ''} ${t.name || ''}`))),
    create: (body) => request('templates.php', { method: 'POST', body }),
    update: (body) => request('templates.php', { method: 'PUT', body }),
    remove: (id) => request('templates.php', { method: 'DELETE', body: { id } }),
  },
  auth: {
    register: (body) => request('auth/register.php', { method: 'POST', body, auth: false }),
    login: (body) => request('auth/login.php', { method: 'POST', body, auth: false }),
    me: () => request('auth/me.php'),
    logout: () => request('auth/logout.php', { method: 'POST' }),
  },
  resumes: {
    list: () => request('resumes/read.php').then((r) => r.resumes),
    get: (id) => request(`resumes/read.php?id=${id}`).then((r) => r.resume),
    create: (body) => request('resumes/create.php', { method: 'POST', body }),
    update: (id, body) => request(`resumes/update.php?id=${id}`, { method: 'PUT', body }),
    remove: (id) => request(`resumes/delete.php?id=${id}`, { method: 'DELETE' }),
  },
  admin: {
    stats: () => request('admin/stats.php'),
    users: (q = '') => request(`admin/users.php?q=${encodeURIComponent(q)}`).then((r) => r.users),
    updateUser: (id, body) => request(`admin/users.php?id=${id}`, { method: 'PUT', body }),
    deleteUser: (id) => request(`admin/users.php?id=${id}`, { method: 'DELETE' }),
    resumes: () => request('admin/resumes.php').then((r) => r.resumes),
    deleteResume: (id) => request(`admin/resumes.php?id=${id}`, { method: 'DELETE' }),
  },
};
