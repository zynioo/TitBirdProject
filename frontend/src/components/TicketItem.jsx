import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  Trash2, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Tag
} from 'lucide-react';

export default function TicketItem({ 
  ticket, 
  currentUser, 
  onUpdateStatus, 
  onDeleteTicket,
  token 
}) {
  const [updating, setUpdating] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentUser?.id === ticket.owner_id;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Nowe
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            W trakcie
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Naprawione
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Anulowane
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Priorytet Wysoki
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Priorytet Niski
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Priorytet Normalny
          </span>
        );
    }
  };

  const handleAdminStatusChange = async (newStatus) => {
    setUpdating(true);
    await onUpdateStatus(ticket.id, newStatus, ticket.priority);
    setUpdating(false);
  };

  const handleAdminPriorityChange = async (newPriority) => {
    setUpdating(true);
    await onUpdateStatus(ticket.id, ticket.status, newPriority);
    setUpdating(false);
  };

  const handleCancelByStudent = async () => {
    if (confirm(`Czy na pewno chcesz anulować własne zgłoszenie #${ticket.id}?`)) {
      setUpdating(true);
      await onUpdateStatus(ticket.id, 'cancelled');
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Czy na pewno chcesz bezpowrotnie usunąć zgłoszenie #${ticket.id}?`)) {
      setUpdating(true);
      await onDeleteTicket(ticket.id);
      setUpdating(false);
    }
  };

  return (
    <article className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition space-y-3">
      {/* Nagłówek kafelka */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
            {ticket.room}
          </span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Stanowisko #{ticket.workstation_number}
          </span>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {ticket.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getPriorityBadge(ticket.priority)}
          {getStatusBadge(ticket.status)}
        </div>
      </div>

      {/* Bezpieczne renderowanie JSX - ochrona przed atakami XSS */}
      <div className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed break-words font-normal">
        {ticket.description}
      </div>

      {/* Stopka kafelka: autor, data i akcje */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Autor: <strong className="text-slate-800">{ticket.owner_username || 'Anonim'}</strong>
            {isOwner && (
              <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                (Ty)
              </span>
            )}
          </span>

          <span className="inline-flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {new Date(ticket.created_at).toLocaleString('pl-PL')}
          </span>
        </div>

        {/* Panel akcji zależny od uprawnień (RBAC & IDOR) */}
        <div className="flex items-center gap-2">
          {/* Akcje Opiekuna (Admin) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-purple-700">Zmień status:</span>
              <select
                disabled={updating}
                value={ticket.status}
                onChange={(e) => handleAdminStatusChange(e.target.value)}
                className="bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="new">Nowe</option>
                <option value="in_progress">W trakcie</option>
                <option value="resolved">Naprawione</option>
                <option value="cancelled">Anulowane</option>
              </select>

              <select
                disabled={updating}
                value={ticket.priority}
                onChange={(e) => handleAdminPriorityChange(e.target.value)}
                className="bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="low">Priorytet: Niski</option>
                <option value="normal">Priorytet: Normalny</option>
                <option value="high">Priorytet: Wysoki</option>
              </select>

              <button
                disabled={updating}
                onClick={handleDelete}
                title="Usuń zgłoszenie z bazy (Admin)"
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Akcje Ucznia dla własnego zgłoszenia */}
          {!isAdmin && isOwner && (
            <div className="flex items-center gap-1.5">
              {ticket.status === 'new' && (
                <button
                  disabled={updating}
                  onClick={handleCancelByStudent}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Anuluj usterkę
                </button>
              )}
              <button
                disabled={updating}
                onClick={handleDelete}
                title="Usuń własne zgłoszenie"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
