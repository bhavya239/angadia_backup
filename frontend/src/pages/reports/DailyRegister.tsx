import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import api from '../../lib/axios';

export function DailyRegister() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const downloadFile = async (type: 'pdf' | 'excel') => {
    if (type === 'pdf') setIsExportingPdf(true);
    else setIsExportingExcel(true);

    try {
      const response = await api.get(`/export/daily-register/${type}?date=${date}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-register-${date}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to format / download the export');
    } finally {
      if (type === 'pdf') setIsExportingPdf(false);
      else setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Daily Register</h1>
          <p className="text-slate-500 mt-1">Export global pedhi daybook cash summaries.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-12 flex flex-col items-center justify-center space-y-8 max-w-xl mx-auto">
          
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-slate-800">Generate Export</h3>
            <p className="text-sm text-slate-500">
                Select a target date to fetch the exact opening balance, individual sent/received records, and pedhi closing cash balances.
            </p>
          </div>

          <div className="w-full space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Target Date</label>
            <input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-slate-800 font-semibold text-lg text-center transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4 border-t border-slate-100">
            <Button 
                onClick={() => downloadFile('pdf')}
                isLoading={isExportingPdf}
                disabled={isExportingPdf || isExportingExcel}
                className="flex-1 flex gap-2 items-center justify-center py-6 text-sm font-bold tracking-wide"
                style={{ backgroundColor: '#e11d48' }} // Rose shade explicitly bypassing generic props
            >
                {!isExportingPdf && <FileText className="w-5 h-5" />} PDF Statement
            </Button>
            
            <Button 
                onClick={() => downloadFile('excel')}
                isLoading={isExportingExcel}
                disabled={isExportingPdf || isExportingExcel}
                className="flex-1 flex gap-2 items-center justify-center py-6 text-sm font-bold tracking-wide"
                style={{ backgroundColor: '#059669' }} // Emerald
            >
                {!isExportingExcel && <FileSpreadsheet className="w-5 h-5" />} Excel Workbook
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
