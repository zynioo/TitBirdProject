import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import Navbar from './components/Navbar';
import TicketItem from './components/TicketItem';
import TicketForm from './components/TicketForm';
import SecurityTests from './components/SecurityTests';
import { 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  CheckCheck, 
  RefreshCw,
  PlusCircle,
  Filter
} from 'lucide-react';

const ROOMS = ['Sala 101', 'Sala 102', 'Sala 204', 'Sala 205', 'Sala 308'];

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('titbird_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('titbird_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'new' | 'security'
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('ALL');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchTickets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        // Token wygasł lub jest nieprawidłowy
        handleLogout();
        showToast('error', 'Sesja wygasła. Zaloguj się ponownie.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Błąd pobierania danych: kod ${res.status}`);
      }

      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      showToast('error', 'Nie udało się pobrać listy zgłoszeń.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  const handleLoginSuccess = (user, accessToken) => {
    setCurrentUser(user);
    setToken(accessToken);
    setActiveTab('all');
    showToast('success', `Zalogowano pomyślnie jako ${user.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('titbird_token');
    localStorage.removeItem('titbird_user');
    setToken(null);
    setCurrentUser(null);
    setTickets([]);
    setActiveTab('all');
    showToast('success', 'Pomyślnie wylogowano z systemu.');
  };

  const handleUpdateStatus = async (ticketId, newStatus, priority = null) => {
    try {
      const body = { status: newStatus };
      if (priority) body.priority = priority;

      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Błąd aktualizacji: kod ${res.status}`);
      }

      showToast('success', `Status zgłoszenia #${ticketId} został zaktualizowany na '${newStatus}'.`);
      // Zaktualizuj stan lokalny
      setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Nie udało się zaktualizować statusu.');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Błąd usuwania: kod ${res.status}`);
      }

      showToast('success', `Zgłoszenie #${ticketId} zostało usunięte.`);
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Nie udało się usunąć zgłoszenia.');
    }
  };

  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    setActiveTab('all');
    showToast('success', `Zgłoszenie #${newTicket.id} w ${newTicket.room} zostało utworzone!`);
  };

  // Jeśli użytkownik nie jest zalogowany -> Ekran Logowania i Rejestracji (Blokada niezalogowanych)
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <AuthView onLoginSuccess={handleLoginSuccess} />
        <footer className="py-4 text-center text-xs text-slate-500">
          TitBird &bull; Projekt z przedmiotu Technologie Webowe &bull; Zabezpieczenia: bcrypt, JWT, IDOR, RBAC, Pydantic v2
        </footer>
      </div>
    );
  }

  // Filtrowanie zgłoszeń
  const displayTickets = tickets.filter(ticket => {
    if (activeTab === 'my') {
      if (ticket.owner_id !== currentUser.id) return false;
    }
    if (selectedRoomFilter !== 'ALL') {
      if (ticket.room !== selectedRoomFilter) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar 
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={fetchTickets}
        loading={loading}
      />

      {/* Globalny Toast / Alert */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full animate-fadeIn">
          <div className={`p-4 rounded-2xl shadow-lg border flex items-start gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-500 text-white border-emerald-600' 
              : 'bg-rose-500 text-white border-rose-600'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium flex-1">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/80 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Główna treść */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Widok: NOWE ZGŁOSZENIE */}
        {activeTab === 'new' && (
          <div className="max-w-2xl mx-auto">
            <TicketForm 
              token={token} 
              onTicketCreated={handleTicketCreated} 
            />
          </div>
        )}

        {/* Widok: TESTY BEZPIECZEŃSTWA */}
        {activeTab === 'security' && (
          <SecurityTests 
            token={token}
            currentUser={currentUser}
            tickets={tickets}
          />
        )}

        {/* Widok: WSZYSTKIE LUB MOJE ZGŁOSZENIA */}
        {(activeTab === 'all' || activeTab === 'my') && (
          <div className="space-y-6">
            {/* Pasek filtrowania i podsumowania */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {activeTab === 'my' ? 'Moje zgłoszenia' : 'Zgłoszenia w pracowniach'}
                </h2>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {displayTickets.length}
                </span>
              </div>

              {/* Filtry */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sala:</span>
                  <select
                    value={selectedRoomFilter}
                    onChange={(e) => setSelectedRoomFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Wszystkie sale</option>
                    {ROOMS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setActiveTab('new')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nowe zgłoszenie
                </button>
              </div>
            </div>

            {/* Lista kafelków zgłoszeń */}
            {loading && tickets.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                <p className="text-sm font-medium">Ładowanie zgłoszeń z bazy danych...</p>
              </div>
            ) : displayTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <CheckCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">Brak zgłoszeń do wyświetlenia</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {activeTab === 'my' 
                    ? 'Nie zarejestrowałeś jeszcze żadnego zgłoszenia usterki. Kliknij przycisk powyżej, aby zgłosić usterkę.'
                    : 'Brak zarejestrowanych usterek dla wybranych kryteriów filtrowania.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayTickets.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    currentUser={currentUser}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteTicket={handleDeleteTicket}
                    token={token}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          TitBird &bull; Technologie Webowe &bull; Zalogowany: <strong>{currentUser.username}</strong> ({currentUser.role === 'admin' ? 'Administrator' : 'Uczeń'})
        </div>
      </footer>
    </div>
  );
}
