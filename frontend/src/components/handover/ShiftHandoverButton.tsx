import { useState } from 'react';
import { 
  Sunrise, Sunset, Moon, QrCode, Download, X, CheckCircle, 
  AlertCircle, ChevronDown, Copy, Activity 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';

interface ShiftHandoverButtonProps {
  className?: string;
  onSuccess?: (qrCode: string, qrDataUrl: string) => void;
}

const SHIFT_TYPES = [
  { value: 'morning', label: 'Morning (6AM–2PM)', icon: Sunrise },
  { value: 'evening', label: 'Evening (2PM–10PM)', icon: Sunset },
  { value: 'night', label: 'Night (10PM–6AM)', icon: Moon },
] as const;

export function ShiftHandoverButton({ className, onSuccess }: ShiftHandoverButtonProps) {
  const { role, userId, apiBase } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedShift, setSelectedShift] = useState<'morning' | 'evening' | 'night'>('morning');
  const [qrData, setQrData] = useState<{ qrCode: string; qrCodeUrl: string; payload: any } | null>(null);

  const canGenerate = role === 'worker' || role === 'admin';

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({ title: 'Permission denied', description: 'Only workers can generate handovers', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/handover/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` 
        },
        body: JSON.stringify({ 
          shift_type: selectedShift, 
          shift_date: new Date().toISOString().split('T')[0],
          user_id: userId || 1
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to generate handover' }));
        throw new Error(err.detail || 'Failed to generate handover');
      }

      const data = await res.json();
      setQrData({
        qrCode: data.qr_code,
        qrCodeUrl: data.qr_code_url,
        payload: data.payload
      });
      setShowModal(true);
      toast({ title: 'Handover generated', description: `QR code ready for ${SHIFT_TYPES.find(s => s.value === selectedShift)?.label} shift` });
      onSuccess?.(data.qr_code, data.qr_code_url);
    } catch (error: any) {
      toast({ title: 'Failed to generate', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!canGenerate) return null;

  const currentShiftObj = SHIFT_TYPES.find(s => s.value === selectedShift);

  return (
    <div className={cn('relative inline-flex items-center gap-2', className)}>
      {/* Main Button */}
      <Button
        variant="primary"
        size="lg"
        icon={<Sunrise className="w-5 h-5 text-amber-300" />}
        onClick={handleGenerate}
        loading={loading}
        className="gap-2 shadow-lg shadow-[#77BA99]/20"
      >
        <span className="hidden sm:inline">End Shift & Generate Handover</span>
        <span className="inline sm:hidden">End Shift</span>
        <span className="hidden lg:inline text-xs font-normal opacity-90">({currentShiftObj?.label.split(' ')[0]})</span>
      </Button>

      {/* Shift Selector Toggle */}
      <div className="relative">
        <Button
          variant="secondary"
          size="lg"
          icon={<ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />}
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3"
          aria-label="Select shift type"
        >
          <span className="hidden sm:inline">{currentShiftObj?.label.split(' ')[0]}</span>
        </Button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#1d1e25] border border-[#3d3e4b] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {SHIFT_TYPES.map(shift => (
                <button
                  key={shift.value}
                  onClick={() => {
                    setSelectedShift(shift.value);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    selectedShift === shift.value 
                      ? 'bg-[#77BA99]/15 text-[#77BA99] font-semibold' 
                      : 'text-[#EFF0D1]/80 hover:bg-[#262730] hover:text-[#EFF0D1]'
                  }`}
                >
                  <shift.icon className="w-4 h-4 text-[#77BA99]" />
                  <span className="flex-1">{shift.label}</span>
                  {selectedShift === shift.value && (
                    <CheckCircle className="w-4 h-4 text-[#77BA99]" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* QR Modal */}
      {showModal && qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1d1e25] border border-[#3d3e4b] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#3d3e4b] sticky top-0 bg-[#1d1e25]/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#77BA99] to-teal-600 flex items-center justify-center shadow-md shadow-[#77BA99]/20">
                  <QrCode className="w-7 h-7 text-[#1d1e25]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#EFF0D1]">Shift Handover Generated</h2>
                  <p className="text-xs text-[#D7C0D0]">
                    {currentShiftObj?.label} • {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowModal(false); setQrData(null); }} 
                className="p-2 rounded-lg hover:bg-[#262730] text-[#D7C0D0] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* QR Code Display */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-xl border border-[#3d3e4b] shadow-xl">
                  <img 
                    src={qrData.qrCodeUrl} 
                    alt="Handover QR Code" 
                    className="w-48 h-48 mx-auto" 
                  />
                </div>
                <p className="mt-3 text-sm text-[#EFF0D1]/90 font-medium">Scan with VAJRA app or mobile camera</p>
                <p className="text-xs text-[#77BA99] mt-1 font-mono tracking-wider">{qrData.qrCode}</p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#262730] border border-[#3d3e4b] rounded-xl">
                <div className="text-center p-2 rounded-lg bg-[#1d1e25]/50">
                  <p className="text-2xl font-bold text-sky-400">{qrData.payload.summary?.tickets_open || 0}</p>
                  <p className="text-xs text-[#D7C0D0]">Open Tickets</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#1d1e25]/50">
                  <p className="text-2xl font-bold text-amber-400">{qrData.payload.summary?.escalations_pending || 0}</p>
                  <p className="text-xs text-[#D7C0D0]">Escalations</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#1d1e25]/50">
                  <p className="text-2xl font-bold text-[#77BA99]">{qrData.payload.summary?.machines_watching || 0}</p>
                  <p className="text-xs text-[#D7C0D0]">Machines to Watch</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-[#1d1e25]/50">
                  <p className="text-2xl font-bold text-[#D33F49]">{qrData.payload.summary?.safety_incidents || 0}</p>
                  <p className="text-xs text-[#D7C0D0]">Safety Incidents</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="primary" 
                  fullWidth 
                  className="sm:flex-1"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrData.qrCodeUrl;
                    link.download = `handover-${qrData.payload.shift_type}-${new Date().toISOString().split('T')[0]}.png`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download QR
                </Button>
                <Button 
                  variant="secondary" 
                  fullWidth 
                  className="sm:flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + `/handover/${qrData.qrCode}`);
                    toast({ title: 'Copied', description: 'Handover link copied to clipboard' });
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
              </div>

              {/* Preview Sections */}
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-[#262730] border border-[#3d3e4b] hover:border-[#77BA99]/50 transition-colors">
                  <span className="font-medium text-sm text-[#EFF0D1]">View Full Handover Summary</span>
                  <ChevronDown className="w-4 h-4 text-[#D7C0D0] transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 space-y-4 pt-3 border-t border-[#3d3e4b]">
                  {/* Open Tickets */}
                  {qrData.payload.open_tickets?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D7C0D0] mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Open Tickets ({qrData.payload.open_tickets.length})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {qrData.payload.open_tickets.map((t: any) => (
                          <div key={t.id} className="p-3 rounded-lg bg-[#262730] border border-[#3d3e4b] flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-[#EFF0D1]">{t.title}</p>
                              <p className="text-xs text-[#D7C0D0]">{t.machine_name} • Status: {t.status}</p>
                            </div>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#77BA99]/20 text-[#77BA99]">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Escalations */}
                  {qrData.payload.pending_escalations?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D7C0D0] mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#D33F49]" />
                        Pending Escalations ({qrData.payload.pending_escalations.length})
                      </h4>
                      <div className="space-y-2">
                        {qrData.payload.pending_escalations.map((e: any) => (
                          <div key={e.id} className="p-3 rounded-lg bg-[#D33F49]/10 border border-[#D33F49]/30">
                            <p className="font-medium text-sm text-[#D33F49]">{e.machine_id} — {e.reason}</p>
                            <p className="text-xs text-[#D7C0D0] mt-1">Status: {e.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Machines to Watch */}
                  {qrData.payload.machines_to_watch?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D7C0D0] mb-2 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#77BA99]" />
                        Machines to Watch ({qrData.payload.machines_to_watch.length})
                      </h4>
                      <div className="space-y-2">
                        {qrData.payload.machines_to_watch.map((m: any) => (
                          <div key={m.machine_id} className="p-3 rounded-lg bg-[#262730] border border-[#3d3e4b] flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-[#EFF0D1]">{m.machine_name}</p>
                              <p className="text-xs text-[#D7C0D0]">Finding: {m.last_finding}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#77BA99] text-sm">{m.health_score}%</p>
                              <p className="text-[10px] text-[#D7C0D0]">Health</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>

              {/* Close Button */}
              <Button 
                variant="secondary" 
                fullWidth 
                onClick={() => { setShowModal(false); setQrData(null); }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
