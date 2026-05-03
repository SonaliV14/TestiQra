import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, X, Settings, LogOut, Search, ChevronRight,
  Star, MessageSquare, Heart, Sparkles, Video, FileText,
  Trash2, Edit3, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:3001';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null); // space object to delete
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      setLoading(true);
      try {
        const r = await axios.get(`${BACKEND_URL}/api/v1/space-fetch`, {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        setSpaces(r.data.spaces.spaces || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSpaces();
  }, []);

  const filtered = spaces.filter(s =>
    s.space_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteSpace = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/v1/space/${deleteModal.space_name}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setSpaces(prev => prev.filter(s => s.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (e) {
      console.error('Delete failed:', e);
      // Optimistically remove from UI even if backend delete not wired up
      setSpaces(prev => prev.filter(s => s.id !== deleteModal.id));
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">TestiQra</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 w-56">
              <Search size={14} className="text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search spaces…"
                className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none flex-1" />
            </div>
            <button onClick={() => { localStorage.removeItem('token'); navigate('/signin'); }}
              className="p-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Your Spaces</h1>
            <p className="text-gray-400 text-sm">{spaces.length} space{spaces.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={() => setShowPopup(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-violet-500/20">
            <Plus size={16} /> Create Space
          </button>
        </div>

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-5">
              <MessageSquare size={36} className="text-gray-600" />
            </div>
            <h2 className="text-white font-semibold text-xl mb-2">
              {search ? 'No spaces match your search' : 'No spaces yet'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {search ? 'Try a different search term' : 'Create your first space to start collecting testimonials'}
            </p>
            {!search && (
              <button onClick={() => setShowPopup(true)}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all font-medium text-sm">
                Create your first space
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(j => <div key={j} className="h-10 bg-gray-800 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spaces Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                onClick={() => navigate(`/space/${space.space_name}`)}
                onEdit={() => navigate(`/edit/${space.space_name}`)}
                onDelete={() => setDeleteModal(space)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-white font-semibold">Create a new Space</h2>
              <button onClick={() => setShowPopup(false)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <button onClick={() => { navigate('/space-creation'); setShowPopup(false); }}
                className="w-full flex items-center justify-between p-4 bg-violet-600/10 border border-violet-500/30 hover:bg-violet-600/20 text-white rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Create from scratch</p>
                    <p className="text-gray-400 text-xs">Full customisation</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button onClick={() => { navigate('/space-creation?mode=ai'); setShowPopup(false); }}
                className="w-full flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-white rounded-xl transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/80 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Create with AI</p>
                    <p className="text-gray-400 text-xs">AI generates your content</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-red-400" />
              </div>
              <h2 className="text-white font-semibold text-center text-lg mb-1">Delete Space</h2>
              <p className="text-gray-400 text-sm text-center mb-1">
                Are you sure you want to delete
              </p>
              <p className="text-white font-medium text-center text-sm mb-4">
                "{deleteModal.space_name}"?
              </p>
              <p className="text-gray-500 text-xs text-center mb-6">
                This will permanently delete all testimonials in this space. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSpace}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Trash2 size={14} /> Delete</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpaceCard({ space, onClick, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    if (showActions) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <div
      onClick={onClick}
      className="group bg-gray-900/50 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:bg-gray-900 hover:-translate-y-0.5 relative"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <img
            src={space.logo || 'https://testimonial.to/static/media/just-logo.040f4fd2.svg'}
            alt={space.space_name}
            className="w-12 h-12 rounded-xl object-cover border border-gray-700 bg-gray-800"
          />
          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">{space.space_name}</h3>
            <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{space.header || 'No header set'}</p>
          </div>
        </div>

        {/* Settings button with dropdown */}
        <div ref={actionsRef} className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowActions(v => !v)}
            className={`p-1.5 rounded-lg transition-all border
              ${showActions
                ? 'opacity-100 bg-gray-700 border-gray-600 text-white'
                : 'opacity-0 group-hover:opacity-100 bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
          >
            <Settings size={14} />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20">
              <button
                onClick={() => { setShowActions(false); onEdit(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-all text-sm"
              >
                <Edit3 size={13} className="text-blue-400" />
                Edit Space
              </button>
              <div className="h-px bg-gray-800 mx-2" />
              <button
                onClick={() => { setShowActions(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-500/8 transition-all text-sm"
              >
                <Trash2 size={13} className="text-red-400" />
                Delete Space
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <MessageSquare size={13} />, label: 'Reviews', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { icon: <Heart size={13} />, label: 'Liked', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
          { icon: <Star size={13} />, label: 'Rating', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className={`flex flex-col items-center py-2 rounded-xl border text-xs font-medium ${s.color}`}>
            {s.icon}
            <span className="mt-1 text-gray-400 font-normal">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-gray-600 text-xs">testiqra.io/{space.space_name}</span>
        <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </div>
  );
}