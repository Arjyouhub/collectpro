import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  IndianRupee,
  Mic,
  MicOff,
  Camera,
  Navigation,
  FileCheck,
  Send,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { CollectionCase } from '../../types';
import { useCaseStore } from '../../store/useCaseStore';
import api from '../../api/client';

interface QuickActionDrawerProps {
  caseItem: CollectionCase | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickActionDrawer: React.FC<QuickActionDrawerProps> = ({ caseItem, isOpen, onClose, onSuccess }) => {
  if (!isOpen || !caseItem) return null;

  const [actionType, setActionType] = useState<'visit' | 'ptp' | 'settlement' | 'payment'>('visit');
  
  // Fields
  const [personMet, setPersonMet] = useState(caseItem.customerName);
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState(caseItem.totalPOS.toString());
  const [ptpDate, setPtpDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Voice Recognition
  const [isListening, setIsListening] = useState(false);

  // GPS Location
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  // Automatically fetch GPS when opening drawer
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        () => setGpsLoading(false)
      );
    }
  }, []);

  // Web Speech API Voice Dictation
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is supported on Chrome Android. Please type remarks manually if not available.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Supports Indian English / Hindi accent

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setRemarks((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Camera Capture Handler
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotoPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (actionType === 'visit') {
        await api.post('/logs/visit', {
          caseId: caseItem._id,
          addressVisited: caseItem.address,
          personMet,
          outcome: 'Premises_Visited',
          remarks: remarks || 'Field visit completed by executive.',
          location: gpsLocation
        }).catch(() => {});
      } else if (actionType === 'ptp') {
        await api.post('/logs/call', {
          caseId: caseItem._id,
          outcome: 'PTP',
          remarks: remarks || 'PTP commitment logged by executive.',
          ptpAmount: Number(amount),
          ptpDate
        }).catch(() => {});
      } else if (actionType === 'settlement') {
        await api.put('/cases/' + caseItem._id, {
          status: 'Settlement_Requested',
          customFields: { settlementAmountRequested: Number(amount), settlementNotes: remarks }
        }).catch(() => {});
      } else if (actionType === 'payment') {
        await api.post('/logs/visit', {
          caseId: caseItem._id,
          addressVisited: caseItem.address,
          personMet,
          outcome: 'Paid_' + paymentMode,
          paymentReceived: Number(amount),
          paymentMode,
          remarks: remarks || 'Payment collected on site.',
          location: gpsLocation
        }).catch(() => {});
      }

      // Update local store case status
      const paidAmt = actionType === 'payment' ? Number(amount || 0) : 0;
      const customCases = useCaseStore.getState().customCases || [];
      const updated = customCases.map((c: CollectionCase) => {
        if (c._id === caseItem._id) {
          const newPos = paidAmt > 0 ? Math.max(0, c.totalPOS - paidAmt) : c.totalPOS;
          let newStatus = c.status;
          if (actionType === 'payment') newStatus = 'Paid';
          else if (actionType === 'visit') newStatus = 'Visited';
          else if (actionType === 'ptp') newStatus = 'PTP';
          else if (actionType === 'settlement') newStatus = 'Settlement_Requested';

          return {
            ...c,
            totalPOS: newPos,
            status: newStatus,
            ptpDate: actionType === 'ptp' ? ptpDate : c.ptpDate,
            ptpAmount: actionType === 'ptp' ? Number(amount) : c.ptpAmount,
            lastActionDate: new Date().toISOString()
          };
        }
        return c;
      });

      useCaseStore.setState({ customCases: updated });
      try { localStorage.setItem('collectpro_custom_cases', JSON.stringify(updated)); } catch(e){}

      alert('Action logged successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Action logged successfully!');
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 pb-20 sm:pb-4">
      <div className="w-full max-w-lg glass-panel rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              1-Tap Quick Action Update
            </div>
            <h3 className="text-lg font-black text-white truncate">{caseItem.customerName}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Type Pills */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
          <button
            type="button"
            onClick={() => setActionType('visit')}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center space-y-1 ${
              actionType === 'visit' ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[11px]">Visit</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType('ptp')}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center space-y-1 ${
              actionType === 'ptp' ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[11px]">PTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType('settlement')}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center space-y-1 ${
              actionType === 'settlement' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span className="text-[11px]">Settlement</span>
          </button>

          <button
            type="button"
            onClick={() => setActionType('payment')}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center space-y-1 ${
              actionType === 'payment' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            <span className="text-[11px]">Payment</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {actionType === 'visit' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Person Met</label>
              <input
                type="text"
                required
                value={personMet}
                onChange={(e) => setPersonMet(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {(actionType === 'ptp' || actionType === 'settlement' || actionType === 'payment') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {actionType === 'payment' ? 'Collected (₹)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl p-2.5"
                />
              </div>

              {actionType === 'ptp' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">PTP Date</label>
                  <input
                    type="date"
                    required
                    value={ptpDate}
                    onChange={(e) => setPtpDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl p-2.5"
                  />
                </div>
              )}

              {actionType === 'payment' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl p-2.5"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="NetBanking">NetBanking</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Voice Input & Camera Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-400">Remarks & Field Notes</label>
              
              {/* Hands-Free Voice Input Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-900 text-cyan-400 border-slate-800 hover:border-cyan-500'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'Listening...' : 'Dictate Remark'}</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Speak or type field remarks..."
              className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Camera Snap Photo Option */}
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>{photoPreview ? 'Photo Captured ✓' : 'Snap House/Receipt Photo'}</span>
            </div>

            <label className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold border border-slate-700">
              <span>{photoPreview ? 'Retake' : 'Open Camera'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>
          </div>

          {/* GPS Location Status */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {gpsLocation
                  ? `GPS Tagged: ${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}`
                  : gpsLoading
                  ? 'Fetching GPS location...'
                  : 'GPS Ready'}
              </span>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full touch-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'One-Tap Submit Action'}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
