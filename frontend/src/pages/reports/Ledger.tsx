/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { WhatsAppButton } from '../../components/ui/WhatsAppButton';
import api from '../../lib/axios';
import { formatScaledCurrency, scaleAmount } from '../../utils/numberScale';
import { BookOpen, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';

export function Ledger() {
  const [partyId, setPartyId] = useState('');
  const [from, setFrom] = useState('2024-04-01');
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [submittedArgs, setSubmittedArgs] = useState<{ id: string; from: string; to: string } | null>(null);
  const [exportScaled, setExportScaled] = useState(false);

  const { data: parties } = useQuery({
    queryKey: ['parties_select'],
    queryFn: async () => (await api.get('/parties')).data.data.content
  });

  const { data: ledger, isLoading } = useQuery({
    queryKey: ['ledger', submittedArgs],
    queryFn: async () => {
      const res = await api.get(`/parties/${submittedArgs?.id}/ledger`, {
        params: { from: submittedArgs?.from, to: submittedArgs?.to }
      });
      return res.data.data;
    },
    enabled: !!submittedArgs
  });

  const handleFetch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (partyId && from && to) setSubmittedArgs({ id: partyId, from, to });
  };

  const handleExport = () => {
    if (!ledger || !ledger.entries) return;
    
    const headers = ['Date', 'Particulars', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance', 'Balance Type'];
    
    const rows = ledger.entries.map((e: any) => {
        const formatExportVal = (amount: number) => {
            if (!amount) return '';
            return exportScaled ? scaleAmount(amount).toFixed(2) : amount.toString();
        };

        const dr = formatExportVal(e.drAmount);
        const cr = formatExportVal(e.crAmount);
        const bal = formatExportVal(e.runningBalance);

        return [e.date, `"${e.particulars}"`, dr, cr, bal, e.balanceType];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + 
        [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
        
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `ledger_${ledger.partyName.replace(/\\s+/g,'_')}_${ledger.fromDate}_to_${ledger.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const selectedParty = parties?.find((p: any) => p.id === partyId);

  const cols = [
    { header: 'Date', accessor: (e: any) => <span className="text-xs text-slate-500">{e.date}</span> },
    { header: 'Particulars', accessor: (e: any) => <span className="text-sm text-slate-800">{e.particulars}</span> },
    {
      header: 'Debit (Dr)',
      accessor: (e: any) => e.drAmount > 0
        ? <span className="font-semibold text-red-600">{formatScaledCurrency(e.drAmount)}</span>
        : <span className="text-slate-300">—</span>
    },
    {
      header: 'Credit (Cr)',
      accessor: (e: any) => e.crAmount > 0
        ? <span className="font-semibold text-emerald-600">{formatScaledCurrency(e.crAmount)}</span>
        : <span className="text-slate-300">—</span>
    },
    {
      header: 'Running Balance',
      accessor: (e: any) => (
        <span className={`font-bold ${e.balanceType === 'CR' ? 'text-emerald-700' : 'text-red-700'}`}>
          {formatScaledCurrency(e.runningBalance)} {e.balanceType}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          Party Ledger
        </h1>
        <p className="page-desc">
          View the complete transaction history for any party over a custom date range.
          Each entry shows Dr/Cr amounts and a live running balance — just like a traditional khata book.
        </p>
      </div>

      {/* Filter card */}
      <div className="section-card p-5">
        <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Select Party <span className="text-red-400">*</span></label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="form-select"
              required
            >
              <option value="">— Choose a party —</option>
              {parties?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.cityName})</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-40">
            <Input label="From Date" type="date" value={from} onChange={e => setFrom(e.target.value)} required />
          </div>
          <div className="w-full md:w-40">
            <Input label="To Date" type="date" value={to} onChange={e => setTo(e.target.value)} required />
          </div>
          <Button type="submit" className="h-[46px] px-6 shrink-0" isLoading={isLoading}>
            Generate Ledger
          </Button>
        </form>
      </div>

      {ledger && (
        <div className="section-card overflow-hidden animate-slide-up">
          {/* Ledger Header Info */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{ledger.partyName}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Code: <strong>{ledger.partyCode}</strong> &nbsp;·&nbsp; City: <strong>{ledger.cityName}</strong>
                  &nbsp;·&nbsp; {ledger.fromDate} to {ledger.toDate}
                </p>
                {selectedParty?.phone && (
                  <div className="mt-3 flex items-center gap-3">
                    <WhatsAppButton
                      phone={selectedParty.phone}
                      partyName={ledger.partyName}
                      amount={ledger.closingBalance}
                      balanceType={ledger.closingBalanceType}
                      label="Send Balance Reminder"
                    />
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2 h-9 px-3 text-xs w-auto">
                      <Download className="w-4 h-4" />
                      Export CSV
                  </Button>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors">
                      <input type="checkbox" checked={exportScaled} onChange={e => setExportScaled(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      Export Scaled Values
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Opening Balance</p>
                  <p className={`text-lg font-bold mt-1 ${ledger.openingBalanceType === 'CR' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatScaledCurrency(ledger.openingBalance)} {ledger.openingBalanceType}
                  </p>
                </div>
                <div className={`text-right pl-6 border-l border-slate-200`}>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Closing Balance</p>
                  <p className={`text-2xl font-extrabold mt-1 ${ledger.closingBalanceType === 'CR' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatScaledCurrency(ledger.closingBalance)} {ledger.closingBalanceType}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Entries table */}
          <Table
            data={ledger.entries || []}
            columns={cols}
            keyExtractor={(e: any) => e.txnNumber || e.date + e.drAmount}
            isLoading={isLoading}
            emptyMessage="No entries found for this date range"
          />

          {/* Totals Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-10">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <ArrowUpRight className="w-5 h-5" />
              Total Dr: {formatScaledCurrency(ledger.totalDr)}
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <ArrowDownRight className="w-5 h-5" />
              Total Cr: {formatScaledCurrency(ledger.totalCr)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
