/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle,
  Loader2, ArrowRight, RotateCcw, Download, Trash2, Info
} from 'lucide-react';
import { formatScaledCurrency } from '../../utils/numberScale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  rowNumber: number;
  txnDate: string | null;
  senderName: string;
  senderId: string | null;
  sentAmount: number;
  receiverName: string;
  receiverId: string | null;
  receivedAmount: number;
  vatav: number;
  city: string;
  remarks: string;
  valid: boolean;
  errors: string[];
}

interface BulkImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}

// ─── Column headers the Excel must have ──────────────────────────────────────
const EXPECTED_HEADERS = ['Date', 'Sender', 'SentAmount', 'Receiver', 'ReceivedAmount', 'Vatav', 'City', 'Remarks'];

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [fileName, setFileName]       = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ParsedRow[] | null>(null);
  const [result, setResult]           = useState<BulkImportResult | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // ── Derived stats ──────────────────────────────────────────────────────────
  const validRows   = previewRows?.filter(r => r.valid) ?? [];
  const invalidRows = previewRows?.filter(r => !r.valid) ?? [];

  // ── Toggle row selection for confirm ──────────────────────────────────────
  const isSelected = (row: ParsedRow) => selectedRows.has(row.rowNumber);
  const toggleRow = (row: ParsedRow) => {
    if (!row.valid) return;
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(row.rowNumber) ? next.delete(row.rowNumber) : next.add(row.rowNumber);
      return next;
    });
  };
  const selectAll = () => setSelectedRows(new Set(validRows.map(r => r.rowNumber)));
  const deselectAll = () => setSelectedRows(new Set());

  // ── Phase 1: Upload & Preview ──────────────────────────────────────────────
  const previewMut = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/transactions/bulk-import/preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as ParsedRow[];
    },
    onSuccess: (rows) => {
      setPreviewRows(rows);
      setResult(null);
      // Auto-select all valid rows
      setSelectedRows(new Set(rows.filter(r => r.valid).map(r => r.rowNumber)));
      const valid   = rows.filter(r => r.valid).length;
      const invalid = rows.filter(r => !r.valid).length;
      if (invalid > 0) {
        toast(`${valid} rows valid · ${invalid} rows have errors`, { icon: '⚠️' });
      } else {
        toast.success(`${valid} rows parsed successfully`);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to parse file'),
  });

  // ── Phase 2: Confirm Import ────────────────────────────────────────────────
  const confirmMut = useMutation({
    mutationFn: async (rowsToSend: ParsedRow[]) => {
      const payload = rowsToSend.map(r => ({
        txnDate:        r.txnDate,
        senderName:     r.senderName,
        sentAmount:     r.sentAmount,
        receiverName:   r.receiverName,
        receivedAmount: r.receivedAmount,
        vatav:          r.vatav,
        city:           r.city,
        remarks:        r.remarks,
      }));
      const res = await api.post('/transactions/bulk-import/confirm', payload);
      return res.data.data as BulkImportResult;
    },
    onSuccess: (res) => {
      setResult(res);
      if (res.errorCount === 0) {
        toast.success(`${res.successCount} transactions imported!`);
      } else {
        toast(`${res.successCount} imported · ${res.errorCount} failed`, { icon: '⚠️' });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Import failed'),
  });

  // ── File handling helpers ──────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an .xlsx or .xls file');
      return;
    }
    setFileName(file.name);
    setPreviewRows(null);
    setResult(null);
    previewMut.mutate(file);
  }, [previewMut]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const reset = () => {
    setFileName(null);
    setPreviewRows(null);
    setResult(null);
    setSelectedRows(new Set());
  };

  // ── Template download (generates column header row inline) ─────────────────
  const downloadTemplate = () => {
    const header = EXPECTED_HEADERS.join('\t');
    const blob   = new Blob([header + '\n'], { type: 'text/tab-separated-values' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = 'angadia_bulk_import_template.tsv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const rowsToConfirm = previewRows?.filter(r => r.valid && selectedRows.has(r.rowNumber)) ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            Bulk Transaction Import
          </h1>
          <p className="page-desc mt-1">
            Upload an Excel file to import multiple transactions at once.
            The system validates every row before committing — no data is saved until you confirm.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Template
        </button>
      </div>

      {/* ── Format Guide ── */}
      <div className="section-card p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Required Excel columns (in order):</p>
          <div className="flex flex-wrap gap-2">
            {EXPECTED_HEADERS.map(h => (
              <span key={h} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold rounded-lg border border-indigo-100">
                {h}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Row 1 must be the header. Party names must exactly match existing parties in the system.</p>
        </div>
      </div>

      {/* ── Upload Zone ── */}
      {!previewRows && (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300
            ${isDragging
              ? 'border-emerald-400 bg-emerald-50 scale-[1.01]'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'}
          `}
          onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileChange}
            className="hidden"
          />

          {previewMut.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
              <p className="text-slate-600 font-semibold">Parsing & validating <span className="text-emerald-600">{fileName}</span>…</p>
              <p className="text-sm text-slate-400">This usually takes less than a second</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-emerald-100' : 'bg-slate-50'}`}>
                <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-emerald-500' : 'text-slate-300'}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-700">
                  {isDragging ? 'Drop to upload' : 'Drag & drop your Excel file'}
                </p>
                <p className="text-sm text-slate-400 mt-1">or <span className="text-emerald-600 font-semibold underline underline-offset-2">click to browse</span> · .xlsx / .xls only</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Result Summary Banner ── */}
      {result && (
        <div className={`rounded-2xl p-5 border flex items-start gap-4 ${
          result.errorCount === 0
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          {result.errorCount === 0
            ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            : <AlertCircle  className="w-6 h-6 text-amber-500  shrink-0 mt-0.5" />}
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-lg">Import Complete</p>
            <div className="flex gap-6 mt-2">
              <span className="text-sm text-slate-600">Total: <b>{result.totalRows}</b></span>
              <span className="text-sm text-emerald-700">✓ Saved: <b>{result.successCount}</b></span>
              {result.errorCount > 0 && (
                <span className="text-sm text-red-600">✗ Failed: <b>{result.errorCount}</b></span>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                {result.errors.map(e => (
                  <p key={e.row} className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> New Import
          </button>
        </div>
      )}

      {/* ── Preview Table ── */}
      {previewRows && !result && (
        <div className="space-y-4">

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Rows',    value: previewRows.length,   color: 'text-slate-700 bg-slate-50',   border: 'border-slate-200' },
              { label: '✓ Valid',       value: validRows.length,     color: 'text-emerald-700 bg-emerald-50', border: 'border-emerald-200' },
              { label: '✗ Errors',     value: invalidRows.length,   color: 'text-red-700 bg-red-50',       border: 'border-red-200' },
            ].map(s => (
              <div key={s.label} className={`section-card p-4 border ${s.border}`}>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${s.color.split(' ')[0]}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear
              </button>
              {validRows.length > 0 && (
                <>
                  <button onClick={selectAll}   className="text-xs text-emerald-600 hover:underline font-medium px-2">Select all valid</button>
                  <button onClick={deselectAll} className="text-xs text-slate-400  hover:underline font-medium px-2">Deselect all</button>
                </>
              )}
            </div>

            <button
              disabled={rowsToConfirm.length === 0 || confirmMut.isPending}
              onClick={() => confirmMut.mutate(rowsToConfirm)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
            >
              {confirmMut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                : <><ArrowRight className="w-4 h-4" /> Confirm Import ({rowsToConfirm.length} rows)</>}
            </button>
          </div>

          {/* Table */}
          <div className="section-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === validRows.length && validRows.length > 0}
                        onChange={e => e.target.checked ? selectAll() : deselectAll()}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Row</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Sender</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Sent ₹</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Receiver</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Rcvd ₹</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Vatav ₹</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">City</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {previewRows.map(row => (
                    <tr
                      key={row.rowNumber}
                      onClick={() => toggleRow(row)}
                      className={`
                        transition-colors group
                        ${row.valid
                          ? isSelected(row)
                            ? 'bg-emerald-50/60 cursor-pointer'
                            : 'hover:bg-slate-50 cursor-pointer'
                          : 'bg-red-50/40 cursor-not-allowed'}
                      `}
                    >
                      <td className="px-4 py-3 text-center">
                        {row.valid ? (
                          <input
                            type="checkbox"
                            checked={isSelected(row)}
                            onChange={() => toggleRow(row)}
                            onClick={e => e.stopPropagation()}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="text-red-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-slate-400">{row.rowNumber}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-slate-700 font-medium text-xs">{row.txnDate || <span className="text-red-400 italic">missing</span>}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`font-semibold text-xs ${row.senderId ? 'text-orange-700' : 'text-red-500'}`}>
                          {row.senderName || <i className="text-slate-300">—</i>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-slate-800 text-xs tabular-nums">
                          {formatScaledCurrency(row.sentAmount)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`font-semibold text-xs ${row.receiverId ? 'text-blue-700' : 'text-red-500'}`}>
                          {row.receiverName || <i className="text-slate-300">—</i>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-slate-800 text-xs tabular-nums">
                          {formatScaledCurrency(row.receivedAmount)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs font-semibold text-amber-700 tabular-nums">
                          {formatScaledCurrency(row.vatav)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-slate-500">{row.city || '—'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[160px]">
                        <span className="text-xs text-slate-400 truncate block">{row.remarks || '—'}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-full border border-red-200">
                              <XCircle className="w-3 h-3" /> Error
                            </span>
                            <div className="space-y-0.5 text-left">
                              {row.errors.map((e, i) => (
                                <p key={i} className="text-[10px] text-red-500 leading-tight">• {e}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            {previewRows.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{previewRows.length} rows · {selectedRows.size} selected for import</span>
                <span className="text-emerald-600 font-semibold">
                  Total selected sent: {formatScaledCurrency(
                    previewRows.filter(r => selectedRows.has(r.rowNumber)).reduce((s, r) => s + (r.sentAmount || 0), 0)
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
