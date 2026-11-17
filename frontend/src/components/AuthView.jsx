import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function AuthView({ onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Pola logowania
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Pola rejestracji
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regRole, setRegRole] = useState('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async (e, customUser = null, customPass = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const u = customUser !== null ? customUser : loginUsername.trim();
    const p = customPass !== null ? customPass : loginPassword;

    // Walidacja po stronie klienta
    if (!u || !p) {
      setError('Proszę podać nazwę użytkownika oraz hasło.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Błąd logowania: kod ${res.status}`);
      }

      // Zapis w localStorage
      localStorage.setItem('titbird_token', data.access_token);
      localStorage.setItem('titbird_user', JSON.stringify(data.user));

      setSuccess(`Zalogowano pomyślnie jako ${data.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.access_token);
      }, 300);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Wystąpił błąd podczas logowania.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const u = regUsername.trim();
    const p = regPassword;
    const pc = regPasswordConfirm;

    // Walidacja po stronie frontendu
    if (u.length < 3) {
      setError('Nazwa użytkownika musi mieć co najmniej 3 znaki.');
      setLoading(false);
      return;
    }
    if (p.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      setLoading(false);
      return;
    }
    if (p !== pc) {
      setError('Wprowadzone hasła nie są identyczne!');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: u,
          password: p,
          role: regRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Błąd rejestracji: kod ${res.status}`);
      }

      setSuccess(`Konto '${data.user.username}' zostało zarejestrowane! Logowanie...`);
      localStorage.setItem('titbird_token', data.access_token);
      localStorage.setItem('titbird_user', JSON.stringify(data.user));

      setTimeout(() => {
        onLoginSuccess(data.user, data.access_token);
      }, 500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Wystąpił błąd podczas rejestracji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo i wstęp */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-blue-500/20">
            TB
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
            TitBird
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            System zgłaszania usterek w pracowniach komputerowych
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Bezpieczne haszowanie bcrypt & autoryzacja JWT
          </div>
        </div>

        {/* Karta formularza */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
          {/* Przełącznik logowanie / rejestracja */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                tab === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                tab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Rejestracja
            </button>
          </div>

          {/* Komunikaty */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Błąd:</strong>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Formularz LOGOWANIA */}
          {tab === 'login' && (
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login użytkownika
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="np. uczen1 lub nauczyciel"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Hasło
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 text-sm"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>

              {/* Szybkie logowanie testowe do prezentacji */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Szybkie konta demonstracyjne
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLogin(null, 'uczen1', 'HasloUcznia123!')}
                    className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium text-center transition"
                  >
                    👤 Uczeń 1
                    <span className="block text-[10px] text-slate-400">uczen1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogin(null, 'nauczyciel', 'AdminNauczyciel123!')}
                    className="p-2 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-800 text-xs font-medium text-center transition"
                  >
                    🛡️ Opiekun (Admin)
                    <span className="block text-[10px] text-purple-600">nauczyciel</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Formularz REJESTRACJI */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login (min. 3 znaki)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="np. jan_kowalski"
                    minLength={3}
                    maxLength={30}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Rola w systemie
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option value="student">Uczeń (zgłaszanie usterek)</option>
                  <option value="admin">Opiekun pracowni (Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Hasło (min. 6 znaków)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Powtórz hasło
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                🔒 Hasło zostanie zahaszowane algorytmem bcrypt przed zapisem w bazie.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
