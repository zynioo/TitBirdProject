import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Computer, 
  Monitor, 
  Mouse, 
  Wifi, 
  Cable, 
  HelpCircle, 
  RefreshCw, 
  PlusCircle, 
  Clock, 
  Layers
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

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Formularz
  const [formData, setFormData] = useState({
    room: 'Sala 204',
    workstation_number: 1,
    category: 'Monitor',
    description: '',
  });

  // Filtrowanie
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('ALL');

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) {
        throw new Error(`Błąd serwera: ${res.status}`);
      }
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      setError('Nie udało się pobrać listy zgłoszeń. Upewnij się, że backend TitBird jest uruchomiony na porcie 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        room: formData.room,
        workstation_number: parseInt(formData.workstation_number, 10),
        category: formData.category,
        description: formData.description,
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Obsługa błędów walidacji Pydantic
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const msg = errorData.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
          throw new Error(`Błąd walidacji serwerowej (Pydantic): ${msg}`);
        } else if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail);
        } else {
          throw new Error(`Błąd serwera: kod ${res.status}`);
        }
      }

      const created = await res.json();
      setSuccess(`Zgłoszenie #${created.id} zostało pomyślnie zarejestrowane!`);
      setFormData({
        room: formData.room,
        workstation_number: 1,
        category: 'Monitor',
        description: '',
      });
      // Odśwież listę
      fetchTickets();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Wystąpił nieoczekiwany błąd podczas wysyłania zgłoszenia.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = selectedRoomFilter === 'ALL' 
    ? tickets 
    : tickets.filter(t => t.room === selectedRoomFilter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Nowe</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">W trakcie</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Naprawione</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Anulowane</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              TB
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                TitBird
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                  Vertical Slice
                </span>
              </h1>
              <p className="text-xs text-slate-500">System zgłaszania usterek w pracowniach komputerowych</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </button>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              Swagger API /docs
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Powiadomienia */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold block">Wystąpił problem:</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm font-medium">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolumna 1: Formularz dodawania (5 kolumn) */}
          <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Zgłoś nową usterkę</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Wybór sali */}
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

              {/* Numer stanowiska */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Numer stanowiska (1–32)
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
                <p className="mt-1 text-xs text-slate-500">
                  W każdej pracowni znajduje się maksymalnie 32 ponumerowane stanowiska.
                </p>
              </div>

              {/* Kategoria sprzętu */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kategoria usterki
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition ${
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

              {/* Opis problemu */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Dokładny opis usterki
                  </label>
                  <span className="text-xs text-slate-400">
                    {formData.description.length} / 2000 znaków
                  </span>
                </div>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Np. Brak sygnału na monitorze, uszkodzony wtyk kabla HDMI po prawej stronie..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
                  required
                  minLength={5}
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Minimalna długość opisu to 5 znaków (weryfikowana przez Pydantic).
                </p>
              </div>

              {/* Przycisk wysyłania */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition active:scale-98 disabled:opacity-50"
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
          </section>

          {/* Kolumna 2: Lista zgłoszeń (7 kolumn) */}
          <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Zgłoszenia w pracowniach
                </h2>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {filteredTickets.length}
                </span>
              </div>

              {/* Filtr sal */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Filtruj salę:</span>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Wszystkie sale</option>
                  {ROOMS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista kafelków */}
            {loading && tickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Ładowanie zgłoszeń z bazy...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Brak zgłoszonych usterek</p>
                <p className="text-xs text-slate-400 mt-1">
                  Wszystkie stanowiska komputerowe w tej sali działają prawidłowo!
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredTickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {ticket.room}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200">
                          Stanowisko #{ticket.workstation_number}
                        </span>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md border border-indigo-200">
                          {ticket.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    {/* Bezpieczne renderowanie JSX - ochrona przed XSS */}
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 break-words">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ticket.created_at).toLocaleString('pl-PL')}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ID: #{ticket.id}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          TitBird &bull; Projekt semestralny z przedmiotu Technologie Webowe &bull; Zgodny ze specyfikacją Bezpieczna aplikacja webowa
        </div>
      </footer>
    </div>
  );
}
