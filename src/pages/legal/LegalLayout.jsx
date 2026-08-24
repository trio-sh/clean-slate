import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

// Shared frame for privacy/terms/refund/delete-account pages.
// Keeps typography, spacing, and back-navigation consistent across all
// legal surfaces, and matches the site's navy/amani palette.

export default function LegalLayout({ title, subtitle, effective, children }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-amani-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white/10 items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-3 text-white/80 text-base md:text-lg leading-relaxed">
                  {subtitle}
                </p>
              )}
              {effective && (
                <p className="mt-4 text-xs text-white/60">Effective {effective}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-10 md:py-14 prose prose-slate prose-headings:font-semibold prose-headings:text-navy-900 prose-a:text-amani-600 hover:prose-a:text-amani-700 prose-strong:text-navy-900">
        {children}
      </article>

      <div className="max-w-3xl mx-auto px-6 mt-6 text-xs text-gray-500 flex flex-wrap justify-center gap-4 border-t border-gray-200 pt-6">
        <Link to="/privacy" className="hover:text-navy-900">Privacy</Link>
        <Link to="/terms" className="hover:text-navy-900">Terms</Link>
        <Link to="/refund" className="hover:text-navy-900">Refund policy</Link>
        <Link to="/delete-account" className="hover:text-navy-900">Delete account</Link>
        <Link to="/" className="hover:text-navy-900">Home</Link>
      </div>
    </div>
  );
}
