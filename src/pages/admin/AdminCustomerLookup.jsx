import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mail, MessageSquare, Send, X, ChevronDown, ChevronUp, FilePlus,
  Download, RefreshCcw, Users, Loader2, CheckCircle2, AlertTriangle, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sendEmail, sendSMS, downloadInvoice } from '../../lib/utils';
import {
  buildCustomerDirectory, searchCustomers, SEGMENTS, fillPromoTokens, whatsappLink,
} from '../../lib/customerLookup';
import CreateInvoiceModal from '../../components/CreateInvoiceModal';

const PROMO_PRESETS = [
  { code: 'FIRST15', text: 'Hi {name}, enjoy 15% off your next Amani\'s Cleaners order with code {code}. Book now at amanicleaners.com' },
  { code: 'SUMMER10', text: 'Hi {name}, we miss you! Take 10% off your next order with code {code} at amanicleaners.com' },
  { code: 'SAVE5', text: 'Hi {name}, $5 off your next order with code {code}. Pickup & delivery at amanicleaners.com' },
];

const SMS_OPT_OUT = ' Reply STOP to opt out.';
const EMAIL_OPT_OUT = 'You are receiving this because you are a customer of Amani\'s Cleaners. Reply to this email with UNSUBSCRIBE to stop promotional messages.';

const formatWhen = (iso) =>
  iso ? new Date(iso).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const promoEmailHtml = (bodyText) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #2D9CDB, #C9379D); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0;">Amani's Cleaners</h1>
    </div>
    <div style="padding: 28px; background: #f9f9f9; white-space: pre-line; line-height: 1.5;">${bodyText
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <p style="color: #888; font-size: 12px; text-align: center; padding: 0 20px 20px;">${EMAIL_OPT_OUT}</p>
  </div>`;

const AdminCustomerLookup = () => {
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [invoiceFor, setInvoiceFor] = useState(undefined); // undefined = closed, null = blank, entry = prefilled
  const [promoTargets, setPromoTargets] = useState(null); // array of customers

  const load = async () => {
    try {
      setDirectory(await buildCustomerDirectory());
    } catch (e) {
      console.error(e);
      toast.error('Failed to load customers');
    }
    setLoading(false);
  };

  const refresh = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    let cancelled = false;
    buildCustomerDirectory()
      .then((dir) => { if (!cancelled) setDirectory(dir); })
      .catch((e) => { console.error(e); toast.error('Failed to load customers'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const results = useMemo(
    () => searchCustomers(directory, query).filter(SEGMENTS[segment].test),
    [directory, query, segment]
  );

  const segmentCounts = useMemo(
    () => Object.fromEntries(Object.entries(SEGMENTS).map(([k, s]) => [k, directory.filter(s.test).length])),
    [directory]
  );

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const allVisibleSelected = results.length > 0 && results.every((c) => selected.has(c.key));
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      results.forEach((c) => (allVisibleSelected ? next.delete(c.key) : next.add(c.key)));
      return next;
    });

  const selectedCustomers = directory.filter((c) => selected.has(c.key));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Customer Look-up &amp; Promotions</h1>
          <p className="text-gray-600">Find any customer, review their new and old invoices, and send promos by email, text or WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={refresh}>
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setInvoiceFor(null)}>
            <FilePlus className="w-4 h-4" /> New invoice
          </button>
        </div>
      </div>

      {/* Search + segments */}
      <div className="card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            autoFocus
            className="input pl-10"
            placeholder="Search by name, email, phone or invoice #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SEGMENTS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setSegment(key)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                segment === key ? 'bg-amani-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label} <span className="opacity-70">({segmentCounts[key] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selection bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-gray-700">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
          Select all {results.length} shown
        </label>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">{selected.size} selected</span>
          <button
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
            disabled={selected.size === 0}
            onClick={() => setPromoTargets(selectedCustomers)}
          >
            <Send className="w-4 h-4" /> Send promo
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="card divide-y divide-gray-100">
        {loading ? (
          <div className="p-10 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : results.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No customers match your search.
          </div>
        ) : (
          results.slice(0, 100).map((c) => (
            <div key={c.key} className="p-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1.5" checked={selected.has(c.key)} onChange={() => toggle(c.key)} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy-900">{c.name}</span>
                    {c.isGuest && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Guest</span>}
                    {c.orderCount === 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">New</span>}
                    {c.daysSinceLast !== null && c.daysSinceLast >= 60 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{c.daysSinceLast} days ago</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {c.orderCount} invoice{c.orderCount === 1 ? '' : 's'} &middot; ${c.totalSpent.toFixed(2)}
                    {c.lastOrderAt && <> &middot; last {formatWhen(c.lastOrderAt)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button title="Email" disabled={!c.email} onClick={() => setPromoTargets([c])}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><Mail className="w-4 h-4" /></button>
                  <button title="Text / WhatsApp" disabled={!c.phone} onClick={() => setPromoTargets([c])}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><MessageSquare className="w-4 h-4" /></button>
                  <button title="New invoice for this customer" onClick={() => setInvoiceFor(c)}
                    className="p-2 rounded-lg hover:bg-gray-100"><FilePlus className="w-4 h-4" /></button>
                  <button title="Invoice history" onClick={() => setExpanded(expanded === c.key ? null : c.key)}
                    className="p-2 rounded-lg hover:bg-gray-100">
                    {expanded === c.key ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expanded === c.key && (
                <div className="mt-3 ml-7 border border-gray-100 rounded-xl overflow-hidden">
                  {c.orders.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No invoices yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="text-left px-3 py-2">Invoice</th>
                          <th className="text-left px-3 py-2">Date &amp; time</th>
                          <th className="text-left px-3 py-2">Status</th>
                          <th className="text-right px-3 py-2">Total</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {c.orders.map((o) => (
                          <tr key={o.id}>
                            <td className="px-3 py-2 font-mono">{o.reference_code}</td>
                            <td className="px-3 py-2">{formatWhen(o.created_at)}</td>
                            <td className="px-3 py-2 capitalize">{String(o.status || '').replace(/_/g, ' ')}</td>
                            <td className="px-3 py-2 text-right">${(Number(o.total) || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">
                              <button title="Download invoice" className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => downloadInvoice(o)}><Download className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {results.length > 100 && (
        <p className="text-sm text-gray-500 text-center">Showing the first 100 of {results.length}. Refine your search to narrow the list.</p>
      )}

      <CreateInvoiceModal
        isOpen={invoiceFor !== undefined}
        prefillCustomer={invoiceFor || null}
        onClose={() => setInvoiceFor(undefined)}
        onCreated={load}
      />

      <AnimatePresence>
        {promoTargets && (
          <PromoComposer customers={promoTargets} onClose={() => setPromoTargets(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

/** A checkbox pill for choosing a send channel. */
const ChannelToggle = ({ checked, onChange, label, count, icon: ChannelIcon }) => (
  <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm ${
    checked ? 'border-amani-500 bg-amani-50' : 'border-gray-200'
  }`}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <ChannelIcon className="w-4 h-4" /> {label} <span className="text-gray-500">({count})</span>
  </label>
);

/** Compose and send a promo to one or more customers over email, text and/or WhatsApp. */
const PromoComposer = ({ customers, onClose }) => {
  const [channels, setChannels] = useState({ email: true, sms: true, whatsapp: false });
  const [code, setCode] = useState(PROMO_PRESETS[0].code);
  const [subject, setSubject] = useState('A special offer from Amani\'s Cleaners');
  const [message, setMessage] = useState(PROMO_PRESETS[0].text);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);

  const withEmail = customers.filter((c) => c.email);
  const withPhone = customers.filter((c) => c.phone);
  const preview = fillPromoTokens(message, customers[0] || {}, code);

  const pickPreset = (preset) => {
    setCode(preset.code);
    setMessage(preset.text);
  };

  const send = async () => {
    if (!channels.email && !channels.sms && !channels.whatsapp) return toast.error('Choose at least one channel');
    if (!message.trim()) return toast.error('Write a message first');

    setSending(true);
    setProgress(0);
    const out = { email: { ok: 0, fail: 0 }, sms: { ok: 0, fail: 0 }, whatsapp: [] };
    const jobs = [];
    customers.forEach((c) => {
      const text = fillPromoTokens(message, c, code);
      if (channels.email && c.email) jobs.push(async () => {
        const r = await sendEmail(c.email, subject, promoEmailHtml(text));
        r?.success ? out.email.ok++ : out.email.fail++;
      });
      if (channels.sms && c.phone) jobs.push(async () => {
        const r = await sendSMS(c.phone, text + SMS_OPT_OUT);
        r?.success ? out.sms.ok++ : out.sms.fail++;
      });
      if (channels.whatsapp && c.phone) {
        out.whatsapp.push({ name: c.name, url: whatsappLink(c.phone, text) });
      }
    });

    for (let i = 0; i < jobs.length; i++) {
      try { await jobs[i](); } catch { /* counted via result below */ }
      setProgress(Math.round(((i + 1) / Math.max(jobs.length, 1)) * 100));
    }
    setSending(false);
    setReport(out);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 16 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-display font-bold text-navy-900">Send promo</h2>
            <p className="text-sm text-gray-500">To {customers.length} customer{customers.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        {report ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" /> Done
            </div>
            <ul className="text-sm space-y-1">
              {channels.email && <li>Email: {report.email.ok} sent{report.email.fail ? `, ${report.email.fail} failed` : ''}</li>}
              {channels.sms && <li>Text: {report.sms.ok} sent{report.sms.fail ? `, ${report.sms.fail} failed` : ''}</li>}
            </ul>
            {report.whatsapp.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">WhatsApp — open each chat and press send:</p>
                <ul className="space-y-1 max-h-56 overflow-y-auto">
                  {report.whatsapp.map((w) => (
                    <li key={w.url}>
                      <a href={w.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-800 text-sm">
                        {w.name} <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Close</button></div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              <ChannelToggle checked={channels.email} onChange={(v) => setChannels({ ...channels, email: v })}
                label="Email" count={withEmail.length} icon={Mail} />
              <ChannelToggle checked={channels.sms} onChange={(v) => setChannels({ ...channels, sms: v })}
                label="Text" count={withPhone.length} icon={MessageSquare} />
              <ChannelToggle checked={channels.whatsapp} onChange={(v) => setChannels({ ...channels, whatsapp: v })}
                label="WhatsApp" count={withPhone.length} icon={Send} />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Promo code</p>
              <div className="flex flex-wrap gap-2">
                {PROMO_PRESETS.map((p) => (
                  <button key={p.code} type="button" onClick={() => pickPreset(p)}
                    className={`px-3 py-1.5 rounded-full text-sm ${code === p.code ? 'bg-amani-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {p.code}
                  </button>
                ))}
                <input className="input w-36" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Custom code" />
              </div>
            </div>

            {channels.email && (
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Email subject</span>
                <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </label>
            )}

            <label className="block text-sm">
              <span className="block text-gray-600 mb-1">Message — use {'{name}'} and {'{code}'}</span>
              <textarea className="input min-h-[110px]" value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>

            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Preview ({customers[0]?.name})</p>
              <p className="whitespace-pre-line">{preview}</p>
              {channels.sms && <p className="text-xs text-gray-500 mt-2">Texts end with “{SMS_OPT_OUT.trim()}”; emails include an unsubscribe line.</p>}
            </div>

            <div className="flex gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Only send promotions to customers who have agreed to receive them (CASL). Honour any opt-out replies.</span>
            </div>

            {sending && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amani-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button className="btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
              <button className="btn-primary flex items-center gap-2" onClick={send} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? `Sending ${progress}%` : 'Send'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminCustomerLookup;
