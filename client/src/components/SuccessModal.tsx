import React, { useEffect } from 'react';
import { CheckCircle2, X, ArrowRight, Calendar, IndianRupee, MapPin } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  customerName?: string;
  ptpDate?: string;
  ptpAmount?: number;
  autoCloseMs?: number;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Action Logged Successfully!',
  message = 'Case details and field visit outcome have been saved.',
  customerName,
  ptpDate,
  ptpAmount,
  autoCloseMs = 2800
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, autoCloseMs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950/30 max-w-sm w-full space-y-4 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Checkmark Circle */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 mx-auto shadow-xl shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400 animate-bounce" />
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{message}</p>
        </div>

        {/* Customer & PTP Details Box */}
        {(customerName || ptpDate || ptpAmount) && (
          <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800/80 text-xs space-y-1.5 text-left">
            {customerName && (
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-slate-400">Customer:</span>
                <span className="text-cyan-300 truncate max-w-[180px]">{customerName}</span>
              </div>
            )}

            {ptpDate && (
              <div className="flex items-center justify-between font-bold text-amber-300 pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  <span>PTP Date:</span>
                </span>
                <span>{ptpDate}</span>
              </div>
            )}

            {ptpAmount && ptpAmount > 0 && (
              <div className="flex items-center justify-between font-extrabold text-emerald-400">
                <span className="text-slate-400 flex items-center space-x-1">
                  <IndianRupee className="w-3 h-3 text-emerald-400" />
                  <span>PTP Amount:</span>
                </span>
                <span>₹{ptpAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
        >
          <span>Done & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
