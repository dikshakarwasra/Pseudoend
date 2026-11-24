import React, { useState } from 'react';
import { Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Modal } from './ui/Modal.js';
import { Button } from './ui/Button.js';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#ff9f0a]" />
          <span>Request Credit Limit Increase</span>
        </div>
      }
      description="Expand your daily mock request quotas for active development and team prototyping."
      maxWidth="lg"
    >
      {submitted ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/30 flex items-center justify-center mx-auto mb-3 text-[#2997ff]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-white mb-1">Upgrade Request Submitted</h4>
          <p className="text-xs text-[#86868b] mb-6 max-w-sm mx-auto leading-relaxed">
            Your request for the <strong className="text-[#2997ff] uppercase font-mono">{requestedTier}</strong> tier has been routed to the administrator review queue. Upgrades are approved quickly to safeguard community infrastructure.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Back to Dashboard
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 rounded-2xl p-3.5 text-xs text-[#ff9f0a] flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Zero-Paid Community Model:</strong> Pseudoend never charges credit cards. Daily credit increases are granted free by administrators to prevent cloud abuse.
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#86868b] mb-2">
              Current Tier: <strong className="text-white capitalize">{currentTier}</strong>
            </div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">Select Desired Tier</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setRequestedTier('developer')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  requestedTier === 'developer'
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-white shadow-sm ring-1 ring-[#0071e3]'
                    : 'border-[#d2d2d7] bg-[#f5f5f7] text-[#6e6e73] hover:border-[#b0b0b7]'
                }`}
              >
                <div className="font-semibold text-sm text-white">Developer Tier</div>
                <div className="text-[11px] text-[#2997ff] font-mono mt-0.5 font-bold">10,000 req / day</div>
                <div className="text-[10px] text-[#86868b] mt-1">For active frontend prototypes</div>
              </div>

              <div
                onClick={() => setRequestedTier('pro')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  requestedTier === 'pro'
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-white shadow-sm ring-1 ring-[#0071e3]'
                    : 'border-[#d2d2d7] bg-[#f5f5f7] text-[#6e6e73] hover:border-[#b0b0b7]'
                }`}
              >
                <div className="font-semibold text-sm text-white">Pro Tier</div>
                <div className="text-[11px] text-[#2997ff] font-mono mt-0.5 font-bold">50,000 req / day</div>
                <div className="text-[10px] text-[#86868b] mt-1">For team testing & hackathons</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              Project Context / Justification
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe what frontend application or project you are building..."
              className="w-full bg-white border border-[#d2d2d7] rounded-xl p-3 text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              required
            />
          </div>

          {error && (
            <div className="text-xs text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/20 p-2.5 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
