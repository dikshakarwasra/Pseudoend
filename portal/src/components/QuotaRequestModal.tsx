import React, { useState } from 'react';
import { X, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface QuotaRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tier: string, reason: string) => Promise<void>;
  currentTier: string;
}

export const QuotaRequestModal: React.FC<QuotaRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentTier
}) => {
  const [requestedTier, setRequestedTier] = useState('developer');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a brief description of your project.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(requestedTier, reason.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Request Credit Limit Increase</h3>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Upgrade Request Submitted!</h4>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              Your request for the <strong>{requestedTier.toUpperCase()}</strong> tier has been sent to the administrator review queue. Upgrades are reviewed quickly to maintain community server safety.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Zero-Paid Community Model:</strong> sudoend does not charge credit cards. Higher limits are granted manually by administrators to prevent cloud resource abuse.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Tier: <strong className="text-white capitalize">{currentTier}</strong>
              </label>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Desired Tier</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setRequestedTier('developer')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    requestedTier === 'developer'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm">Developer Tier</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">10,000 req / day</div>
                  <div className="text-[10px] text-slate-500 mt-1">For active frontend prototypes</div>
                </div>

                <div
                  onClick={() => setRequestedTier('pro')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    requestedTier === 'pro'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm">Pro Tier</div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-0.5">50,000 req / day</div>
                  <div className="text-[10px] text-slate-500 mt-1">For team testing & hackathons</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Project Context / Justification
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe what frontend application or project you are developing..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg text-xs font-medium text-black bg-emerald-400 hover:bg-emerald-300 font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

