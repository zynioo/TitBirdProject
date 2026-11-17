import React, { useState } from 'react';
import { 
  PlusCircle, 
  Monitor, 
  Mouse, 
  Computer, 
  Wifi, 
  Cable, 
  HelpCircle, 
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Monitor', label: 'Monitor / Ekran', icon: Monitor },
  { id: 'Mysz/Klawiatura', label: 'Mysz / Klawiatura', icon: Mouse },
  { id: 'PC/Stacja', label: 'Komputer / PC', icon: Computer },
  { id: 'Sieć/Internet', label: 'Sieć / Internet', icon: Wifi },
  { id: 'Okablowanie', label: 'Kable / Zasilanie', icon: Cable },
  { id: 'Inne', label: 'Inna usterka', icon: HelpCircle },
];

const ROOMS = ['Sala 101', 'Sala 102', 'Sala 204', 'Sala 205', 'Sala 308'];

export default function TicketForm({ token, onTicketCreated }) {
  const [formData, setFormData] = useState({
    room: 'Sala 204',
    workstation_number: 1,
    category: 'Monitor',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const workstation = parseInt(formData.workstation_number, 10);

    // Walidacja po stronie frontendu
    if (isNaN(workstation) || workstation < 1 || workstation > 32) {
      setError('Numer stanowiska musi mieścić się w przedziale od 1 do 32.');
      setSubmitting(false);
      return;
    }

    if (formData.description.trim().length < 5) {
      setError('Opis usterki musi zawierać co najmniej 5 znaków.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        room: formData.room,
        workstation_number: workstation,
        category: formData.category,
        description: formData.description.trim(),
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail && Array.isArray(data.detail)) {
          const msg = data.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
          throw new Error(`Błąd walidacji serwera (Pydantic): ${msg}`);
        } else if (typeof data.detail === 'string') {
          throw new Error(data.detail);
        } else {
          throw new Error(`Błąd serwera: kod ${res.status}`);
        }
      }

      setSuccess(`Zgłoszenie #${data.id} w ${data.room} zostało pomyślnie zarejestrowane!`);
      setFormData({
        room: formData.room,
        workstation_number: 1,
        category: 'Monitor',
        description: '',
      });

      if (onTicketCreated) {
        onTicketCreated(data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Wystąpił problem podczas dodawania zgłoszenia.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Zgłoś nową usterkę</h2>
          <p className="text-xs text-slate-500">Wypełnij formularz zgłoszenia sprzętu w pracowni szkolnej</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Błąd walidacji:</strong>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sala */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Sala lekcyjna
            </label>
            <select
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            >
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Stanowisko */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Stanowisko (1–32)
              </label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Stanowisko #{formData.workstation_number}
              </span>
            </div>
            <input
              type="number"
              min="1"
              max="32"
              value={formData.workstation_number}
              onChange={(e) => setFormData({ ...formData, workstation_number: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              required
            />
          </div>
        </div>

        {/* Kategoria usterki */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Kategoria usterki
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium text-left transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opis */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Dokładny opis usterki (min. 5 znaków)
            </label>
            <span className="text-xs text-slate-400">
              {formData.description.length} / 2000 znaków
            </span>
          </div>
          <textarea
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Opisz dokładnie objawy problemu, np. brak sygnału z karty graficznej, zacięty lewy przycisk myszy..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
            required
            minLength={5}
            maxLength={2000}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Ścisła walidacja serwerowa Pydantic chroni przed pustymi lub zbyt długimi opisami.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 text-sm"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Zapisywanie zgłoszenia...
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              Zarejestruj usterkę
            </>
          )}
        </button>
      </form>
    </div>
  );
}
