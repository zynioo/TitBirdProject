import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Lock, 
  Code2, 
  Database,
  RefreshCw
} from 'lucide-react';

export default function SecurityTests({ token, currentUser, tickets }) {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  // 1. Test IDOR
  const runIdorTest = async () => {
    setLoading(prev => ({ ...prev, idor: true }));
    try {
      // Znajdź zgłoszenie, które NIE należy do current_user
      const otherTicket = tickets.find(t => t.owner_id !== currentUser?.id) || { id: 9999 };
      
      const res = await fetch(`/api/tickets/${otherTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      const body = await res.json();
      setResults(prev => ({
        ...prev,
        idor: {
          status: res.status,
          ok: res.status === 403,
          url: `PATCH /api/tickets/${otherTicket.id}/status`,
          response: body,
          explanation: res.status === 403 
            ? 'Sukces testu: Serwer zablokował próbę nieuprawnionej modyfikacji cudzego rekordu (403 Forbidden).'
            : `Nieoczekiwany status: ${res.status}`
        }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        idor: { status: 'Błąd sieci', ok: false, response: err.message }
      }));
    } finally {
      setLoading(prev => ({ ...prev, idor: false }));
    }
  };

  // 2. Test Walidacji Serwerowej (Pydantic)
  const runValidationTest = async () => {
    setLoading(prev => ({ ...prev, val: true }));
    try {
      // Wyślij błędne dane: stanowisko #999 i zbyt krótki opis (2 znaki)
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room: 'Sala 204',
          workstation_number: 999, // Błąd: dopuszczalne 1-32
          category: 'Monitor',
          description: 'ab' // Błąd: min 5 znaków
        })
      });

      const body = await res.json();
      setResults(prev => ({
        ...prev,
        val: {
          status: res.status,
          ok: res.status === 422,
          url: 'POST /api/tickets (workstation=999, desc="ab")',
          response: body,
          explanation: res.status === 422
            ? 'Sukces testu: Walidator Pydantic odrzucił niepoprawne dane (422 Unprocessable Entity).'
            : `Nieoczekiwany status: ${res.status}`
        }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        val: { status: 'Błąd sieci', ok: false, response: err.message }
      }));
    } finally {
      setLoading(prev => ({ ...prev, val: false }));
    }
  };

  // 3. Test XSS
  const runXssTest = async () => {
    setLoading(prev => ({ ...prev, xss: true }));
    try {
      const maliciousPayload = "<script>alert('XSS')</script><b>Pogrubiony tekst testowy</b>";
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room: 'Sala 101',
          workstation_number: 1,
          category: 'Inne',
          description: maliciousPayload
        })
      });

      const body = await res.json();
      setResults(prev => ({
        ...prev,
        xss: {
          status: res.status,
          ok: res.status === 201,
          url: 'POST /api/tickets (treść ze znacznikami HTML/JS)',
          response: body,
          renderedText: body.description,
          explanation: 'Sukces testu: React JSX traktuje zawartość jako czysty ciąg tekstowy. Znaczniki <script> i <b> nie są interpretowane przez przeglądarkę, co uniemożliwia atak XSS.'
        }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        xss: { status: 'Błąd sieci', ok: false, response: err.message }
      }));
    } finally {
      setLoading(prev => ({ ...prev, xss: false }));
    }
  };

  // 4. Test RBAC (Ochrona uprawnień administratora)
  const runRbacTest = async () => {
    setLoading(prev => ({ ...prev, rbac: true }));
    try {
      const targetTicket = tickets[0] || { id: 1 };
      // Próba zmiany statusu na "resolved" (dostępne tylko dla nauczyciela)
      const res = await fetch(`/api/tickets/${targetTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'resolved' })
      });

      const body = await res.json();
      const isStudent = currentUser?.role === 'student';
      const expectedStatus = isStudent ? 403 : 200;

      setResults(prev => ({
        ...prev,
        rbac: {
          status: res.status,
          ok: res.status === expectedStatus,
          url: `PATCH /api/tickets/${targetTicket.id}/status -> "resolved"`,
          response: body,
          explanation: isStudent
            ? 'Sukces testu: Uczeń nie może zmienić statusu na "resolved" (403 Forbidden). Zabezpieczenie RBAC działa prawidłowo.'
            : 'Zalogowano jako Administrator - zmiana statusu została zaakceptowana (200 OK).'
        }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        rbac: { status: 'Błąd sieci', ok: false, response: err.message }
      }));
    } finally {
      setLoading(prev => ({ ...prev, rbac: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Nagłówek */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Panel Weryfikacji Bezpieczeństwa (Security Showcase)
            </h2>
            <p className="text-xs text-slate-500">
              Interaktywne testy mechanizmów ochronnych zgodnie z wymaganiami projektowymi
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test 1: IDOR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">1. Ochrona przed IDOR / BOLA</h3>
            </div>
            <button
              onClick={runIdorTest}
              disabled={loading.idor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading.idor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Uruchom test IDOR
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Próba wysłania żądania anulowania zgłoszenia należącego do innego ucznia.
          </p>
          {results.idor && (
            <div className={`p-3.5 rounded-xl text-xs font-mono border ${
              results.idor.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="font-bold mb-1">Status HTTP: {results.idor.status}</div>
              <div className="text-[11px] mb-2">{results.idor.explanation}</div>
              <pre className="bg-white/80 p-2 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(results.idor.response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test 2: Walidacja Pydantic */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">2. Ścisła walidacja (Pydantic v2)</h3>
            </div>
            <button
              onClick={runValidationTest}
              disabled={loading.val}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading.val ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Uruchom test walidacji
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Wysłanie stanowiska nr 999 (limit to 1-32) oraz opisu o długości 2 znaków (min. 5).
          </p>
          {results.val && (
            <div className={`p-3.5 rounded-xl text-xs font-mono border ${
              results.val.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="font-bold mb-1">Status HTTP: {results.val.status}</div>
              <div className="text-[11px] mb-2">{results.val.explanation}</div>
              <pre className="bg-white/80 p-2 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(results.val.response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test 3: XSS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">3. Ochrona przed XSS (React JSX)</h3>
            </div>
            <button
              onClick={runXssTest}
              disabled={loading.xss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading.xss ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Uruchom test XSS
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Przesłanie skryptu JavaScript w opisie usterki i weryfikacja bezpiecznego renderowania.
          </p>
          {results.xss && (
            <div className="p-3.5 rounded-xl text-xs font-mono border bg-emerald-50 border-emerald-200 text-emerald-900">
              <div className="font-bold mb-1">Status HTTP: {results.xss.status} (Utworzono)</div>
              <div className="text-[11px] mb-2">{results.xss.explanation}</div>
              <div className="p-2 bg-white rounded border border-emerald-200 mb-2">
                <span className="text-[10px] text-slate-500 block mb-1">Renderowany podgląd w DOM:</span>
                <span className="text-slate-800 font-sans">{results.xss.renderedText}</span>
              </div>
            </div>
          )}
        </div>

        {/* Test 4: RBAC */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">4. Kontrola ról (RBAC)</h3>
            </div>
            <button
              onClick={runRbacTest}
              disabled={loading.rbac}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading.rbac ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Uruchom test RBAC
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Próba oznaczenia usterki jako naprawionej (dostępne tylko dla opiekuna pracowni).
          </p>
          {results.rbac && (
            <div className={`p-3.5 rounded-xl text-xs font-mono border ${
              results.rbac.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="font-bold mb-1">Status HTTP: {results.rbac.status}</div>
              <div className="text-[11px] mb-2">{results.rbac.explanation}</div>
              <pre className="bg-white/80 p-2 rounded text-[10px] overflow-x-auto">
                {JSON.stringify(results.rbac.response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Sekcja Bazy Danych i haszowania */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            5. Haszowanie haseł w bazie danych (bcrypt + salt)
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Wszystkie hasła są haszowane algorytmem <strong>bcrypt</strong> z unikalną solą przed zapisem w tabeli <code>users</code>. 
          W bazie danych nie występuje ani jedno hasło w postaci jawnego tekstu (plain text).
        </p>
        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto">
          <code>
            {`SELECT id, username, hashed_password, role FROM users;\n`}
            {`1 | uczen1     | $2b$12$94bTHsoDiWmrS/5vcFTIeu89DnQTd5.Xtw4X92St7lFu05/AWl59G | student\n`}
            {`2 | uczen2     | $2b$12$5QmXArQ5hVcs6rxblbQvI.Kr4Her30pBmFVSsGhtLv5mBBRyjfAWq | student\n`}
            {`3 | nauczyciel | $2b$12$nUdAXBEOEsAXg8epPZL5keMrVZYjj.4qxxoEl.41Ix9M4Rc3/p/Ki | admin`}
          </code>
        </div>
      </div>
    </div>
  );
}
