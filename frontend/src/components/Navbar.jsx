import React from 'react';
import { 
  LogOut, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  PlusCircle, 
  Layers, 
  UserCheck,
  Shield
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  loading 
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo i Tytuł */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
              TB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  TitBird
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  v0.2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Zgłoszenia w pracowniach komputerowych
              </p>
            </div>
          </div>

          {/* Zakładki nawigacyjne */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wszystkie</span>
            </button>

            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'my'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Moje</span>
            </button>

            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'new'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Zgłoś usterkę</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'security'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Testy Bezpieczeństwa</span>
              <span className="md:hidden">Bezpieczeństwo</span>
            </button>
          </nav>

          {/* Profil i Wyloguj */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Odśwież zgłoszenia"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Informacja o użytkowniku */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">
                  {currentUser?.username}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">
                  {isAdmin ? (
                    <span className="text-purple-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 inline" /> Opiekun (Admin)
                    </span>
                  ) : (
                    <span className="text-blue-600 flex items-center gap-1">
                      <User className="w-3 h-3 inline" /> Uczeń
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Wyloguj się"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wyloguj</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
