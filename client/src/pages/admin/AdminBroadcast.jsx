import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Send, Clock, Trash2, Plus, Edit2, CheckCircle, RefreshCw,
    LayoutGrid, ShoppingBag, ChevronRight, X, Loader2, Users, ToggleLeft, ToggleRight,
} from 'lucide-react';
import AdminNav from '../../components/AdminNav';

const INTERVALS = [
    { value: 3, label: '3 Days', desc: 'Fires every 3 days' },
    { value: 5, label: '5 Days', desc: 'Fires every 5 days' },
    { value: 7, label: '7 Days', desc: 'Fires every 7 days / weekly' },
];

const inputClass =
    'w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-3.5 text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all text-sm';
const labelClass = 'text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 block';

// ─── Broadcast Form Modal ────────────────────────────────────────────────────
const BroadcastFormModal = ({ initial, onSave, onClose }) => {
    const [form, setForm] = useState({
        title: initial?.title || '',
        message: initial?.message || '',
        isScheduled: initial?.isScheduled || false,
        intervalDays: initial?.intervalDays || 3,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            toast.error('Title and message are required');
            return;
        }
        setSaving(true);
        await onSave(form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-lg"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                            <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="font-black text-gray-900 dark:text-white">
                            {initial ? 'Edit Broadcast' : 'New Broadcast'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className={labelClass}>Notification Title</label>
                        <input
                            className={inputClass}
                            placeholder="e.g. New Arrivals! 🎉"
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            maxLength={100}
                        />
                    </div>

                    {/* Message */}
                    <div>
                        <label className={labelClass}>Message Body</label>
                        <textarea
                            className={`${inputClass} resize-none h-24`}
                            placeholder="e.g. Check out our latest collection with up to 30% off!"
                            value={form.message}
                            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                            maxLength={250}
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.message.length}/250</p>
                    </div>

                    {/* Scheduled toggle */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
                        <button
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, isScheduled: !p.isScheduled }))}
                            className="w-full flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                                <div className="text-left">
                                    <p className="font-black text-gray-900 dark:text-white text-sm">Auto-Schedule</p>
                                    <p className="text-xs text-gray-400">Send automatically at a set interval</p>
                                </div>
                            </div>
                            {form.isScheduled
                                ? <ToggleRight size={28} className="text-blue-600" />
                                : <ToggleLeft size={28} className="text-gray-300 dark:text-gray-600" />}
                        </button>

                        <AnimatePresence>
                            {form.isScheduled && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <label className={labelClass}>Repeat Every</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {INTERVALS.map((iv) => (
                                            <button
                                                key={iv.value}
                                                type="button"
                                                onClick={() => setForm((p) => ({ ...p, intervalDays: iv.value }))}
                                                className={`py-3 rounded-2xl border-2 text-center transition-all ${form.intervalDays === iv.value
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                    : 'border-transparent bg-white dark:bg-gray-900 text-gray-500 hover:border-gray-200'
                                                    }`}
                                            >
                                                <p className="font-black text-sm">{iv.label}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{iv.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 dark:border-white/5 text-gray-500 font-black text-sm uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-[2] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const AdminBroadcast = () => {
    const navigate = useNavigate();
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState({});
    const [deleting, setDeleting] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    useEffect(() => { fetchBroadcasts(); }, []);

    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/broadcast');
            setBroadcasts(data);
        } catch {
            toast.error('Failed to load broadcasts');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (form) => {
        try {
            if (editTarget) {
                const { data } = await API.put(`/broadcast/${editTarget._id}`, form);
                setBroadcasts((prev) => prev.map((b) => (b._id === data._id ? data : b)));
                toast.success('Broadcast updated');
            } else {
                const { data } = await API.post('/broadcast', form);
                setBroadcasts((prev) => [data, ...prev]);
                toast.success('Broadcast created');
            }
            setShowForm(false);
            setEditTarget(null);
        } catch {
            toast.error('Failed to save broadcast');
        }
    };

    const handleSendNow = async (broadcast) => {
        setSending((p) => ({ ...p, [broadcast._id]: true }));
        try {
            const { data } = await API.post(`/broadcast/${broadcast._id}/send`);
            toast.success(`Sent to ${data.recipientCount} subscriber${data.recipientCount !== 1 ? 's' : ''} ✅`);
            fetchBroadcasts();
        } catch {
            toast.error('Failed to send broadcast');
        } finally {
            setSending((p) => ({ ...p, [broadcast._id]: false }));
        }
    };

    const handleDelete = async (id) => {
        setDeleting((p) => ({ ...p, [id]: true }));
        try {
            await API.delete(`/broadcast/${id}`);
            setBroadcasts((prev) => prev.filter((b) => b._id !== id));
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeleting((p) => ({ ...p, [id]: false }));
        }
    };

    const handleToggleSchedule = async (broadcast) => {
        try {
            const { data } = await API.put(`/broadcast/${broadcast._id}`, {
                isScheduled: !broadcast.isScheduled,
            });
            setBroadcasts((prev) => prev.map((b) => (b._id === data._id ? data : b)));
            toast.success(data.isScheduled ? 'Auto-broadcast enabled' : 'Auto-broadcast paused');
        } catch {
            toast.error('Failed to update');
        }
    };

    const manualBroadcasts = broadcasts.filter((b) => !b.isScheduled);
    const scheduled = broadcasts.filter((b) => b.isScheduled);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Broadcasts</p>
            </div>
        );
    }

    return (
        <>
            <AnimatePresence>
                {showForm && (
                    <BroadcastFormModal
                        initial={editTarget}
                        onSave={handleSave}
                        onClose={() => { setShowForm(false); setEditTarget(null); }}
                    />
                )}
            </AnimatePresence>

            <div className="max-w-8xl mx-auto px-1 py-0 space-y-6">
                <AdminNav
                    activePage="broadcast"
                    onActionClick={() => { setEditTarget(null); setShowForm(true); }}
                    actionLabel="New Broadcast"
                />

                {/* ── Manual / One-off Broadcasts ── */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Send size={16} className="text-blue-600" />
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">
                            Manual Broadcasts
                        </h3>
                    </div>

                    {manualBroadcasts.length === 0 ? (
                        <div className="glass dark:bg-gray-800 rounded-3xl p-10 text-center border border-dashed border-gray-200 dark:border-gray-700">
                            <Bell size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">No manual broadcasts yet.</p>
                            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Create one and send it immediately to all subscribers.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {manualBroadcasts.map((b) => (
                                <BroadcastCard
                                    key={b._id}
                                    broadcast={b}
                                    onSendNow={handleSendNow}
                                    onEdit={() => { setEditTarget(b); setShowForm(true); }}
                                    onDelete={handleDelete}
                                    onToggle={handleToggleSchedule}
                                    sending={sending[b._id]}
                                    deleting={deleting[b._id]}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Scheduled Auto-Broadcasts ── */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-purple-600" />
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">
                            Scheduled Auto-Broadcasts
                        </h3>
                    </div>

                    {scheduled.length === 0 ? (
                        <div className="glass dark:bg-gray-800 rounded-3xl p-10 text-center border border-dashed border-gray-200 dark:border-gray-700">
                            <Clock size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-gray-400 font-bold text-sm">No scheduled broadcasts yet.</p>
                            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Create one and turn on Auto-Schedule to fire it automatically every 3, 5, or 7 days.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scheduled.map((b) => (
                                <BroadcastCard
                                    key={b._id}
                                    broadcast={b}
                                    onSendNow={handleSendNow}
                                    onEdit={() => { setEditTarget(b); setShowForm(true); }}
                                    onDelete={handleDelete}
                                    onToggle={handleToggleSchedule}
                                    sending={sending[b._id]}
                                    deleting={deleting[b._id]}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

// ─── Broadcast Card ──────────────────────────────────────────────────────────
const BroadcastCard = ({ broadcast: b, onSendNow, onEdit, onDelete, onToggle, sending, deleting }) => {
    const nextFire = b.nextFireAt ? new Date(b.nextFireAt) : null;
    const lastSent = b.lastSentAt ? new Date(b.lastSentAt) : null;

    return (
        <div className="glass dark:bg-gray-900 rounded-3xl border border-white/40 dark:border-white/5 premium-shadow overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-black text-gray-900 dark:text-white truncate">{b.title}</p>
                            {b.isScheduled && (
                                <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                    <Clock size={9} /> Every {b.intervalDays}d
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{b.message}</p>

                        <div className="flex flex-wrap gap-4 mt-3">
                            {lastSent && (
                                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold">
                                    <CheckCircle size={11} className="text-green-500" />
                                    Last sent: {lastSent.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {b.lastRecipientCount > 0 && (
                                        <span className="flex items-center gap-0.5">
                                            <Users size={10} /> {b.lastRecipientCount}
                                        </span>
                                    )}
                                </span>
                            )}
                            {b.isScheduled && nextFire && (
                                <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold">
                                    <RefreshCw size={11} className="text-blue-500" />
                                    Next: {nextFire.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {/* Toggle schedule on/off */}
                        {b.isScheduled !== undefined && (
                            <button
                                onClick={() => onToggle(b)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-gray-800"
                                title={b.isScheduled ? 'Pause auto-send' : 'Enable auto-send'}
                            >
                                {b.isScheduled
                                    ? <ToggleRight size={18} className="text-purple-600" />
                                    : <ToggleLeft size={18} className="text-gray-400" />}
                                <span className={b.isScheduled ? 'text-purple-600' : 'text-gray-400'}>
                                    {b.isScheduled ? 'Active' : 'Paused'}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={() => onEdit(b)}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-gray-100 dark:border-white/5"
                            title="Edit"
                        >
                            <Edit2 size={15} />
                        </button>

                        <button
                            onClick={() => onDelete(b._id)}
                            disabled={deleting}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-gray-100 dark:border-white/5 disabled:opacity-50"
                            title="Delete"
                        >
                            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>

                        <button
                            onClick={() => onSendNow(b)}
                            disabled={sending}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-70"
                        >
                            {sending
                                ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                                : <><Send size={13} /> Send Now</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBroadcast;
