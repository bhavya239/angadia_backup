/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { formatScaledCurrency } from '../../utils/numberScale';
import { ScaledAmountInput } from '../../components/common/ScaledAmountInput';
import { ArrowLeftRight, Zap, CalendarDays, TrendingUp, IndianRupee } from 'lucide-react';

const txnSchema = z.object({
  txnDate: z.string().min(1, 'Date required'),
  senderId: z.string().min(1, 'Sender required'),
  receiverId: z.string().min(1, 'Receiver required'),
  amount: z.coerce.number().min(1, 'Amount must be > 0'),
  vatavRate: z.coerce.number().min(0).max(100),
  narration: z.string().optional(),
});

type TxnForm = z.infer<typeof txnSchema>;

export function TransactionEntry() {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [vatavPreview, setVatavPreview] = useState(0);

  const { register, handleSubmit, watch, reset, setFocus, control, formState: { errors } } = useForm<any>({
    resolver: zodResolver(txnSchema),
    defaultValues: {
      txnDate: new Date().toISOString().split('T')[0],
      vatavRate: 0.25,
    }
  });

  const amountWatch = watch('amount');
  const vatavRateWatch = watch('vatavRate');

  useEffect(() => {
    if (amountWatch && vatavRateWatch) {
      setVatavPreview((Number(amountWatch) * Number(vatavRateWatch)) / 100);
    } else {
      setVatavPreview(0);
    }
  }, [amountWatch, vatavRateWatch]);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;
      const elements = Array.from(form.elements) as HTMLElement[];
      const index = elements.indexOf(e.target as HTMLElement);
      let nextIndex = index + 1;
      while (nextIndex < elements.length &&
        (elements[nextIndex].tagName === 'BUTTON' || (elements[nextIndex] as HTMLInputElement).disabled)) {
        nextIndex++;
      }
      if (nextIndex < elements.length && elements[nextIndex].tagName !== 'BUTTON') {
        elements[nextIndex].focus();
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  const { data: parties } = useQuery({
    queryKey: ['parties_list'],
    queryFn: async () => (await api.get('/parties')).data.data.content
  });

  const { data: daybook, isLoading: loadDaybook } = useQuery({
    queryKey: ['daybook'],
    queryFn: async () => (await api.get('/transactions/daybook')).data.data
  });

  const mutCreate = useMutation({
    mutationFn: (data: TxnForm) => api.post('/transactions', data),
    onSuccess: () => {
      toast.success('Transaction saved!');
      // Refresh daybook AND dashboard so stats update immediately
      queryClient.invalidateQueries({ queryKey: ['daybook'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      reset({ txnDate: watch('txnDate'), vatavRate: watch('vatavRate') });
      setFocus('senderId');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error saving transaction')
  });

  const onSubmit: SubmitHandler<TxnForm> = (data) => mutCreate.mutate(data);

  const activeTxns = daybook?.filter((t: any) => t.status === 'ACTIVE') || [];
  const todayVolume = activeTxns.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const todayVatav = activeTxns.reduce((sum: number, t: any) => sum + (t.vatavAmount || 0), 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-indigo-500" />
          Transactions
        </h1>
        <p className="page-desc">
          Record hawala transfers between parties. Enter the sender (Dr), receiver (Cr), amount and vatav (commission %). 
          The daybook shows all of today's entries in real time.
        </p>
      </div>

      {/* Today's summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Entries", value: activeTxns.length, icon: CalendarDays, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Volume Moved', value: formatScaledCurrency(todayVolume), icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Vatav Earned', value: formatScaledCurrency(todayVatav), icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="section-card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Create Transaction Form ─── */}
        <div className="xl:col-span-1">
          <div className="section-card overflow-hidden">
            {/* Form header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Zap className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">New Transaction</h2>
                <p className="text-xs text-slate-500">Press Enter to jump between fields</p>
              </div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="p-6 space-y-4">
              <Input
                label="Transaction Date"
                type="date"
                {...register('txnDate')}
                error={errors.txnDate?.message as any}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Sender Party (Dr) <span className="text-red-400">*</span>
                </label>
                <select {...register('senderId')} className="form-select">
                  <option value="">— Select Sender —</option>
                  {parties?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}  {p.cityName ? `(${p.cityName})` : ''}</option>
                  ))}
                </select>
                {errors.senderId && <p className="text-xs text-red-500">⚠ {errors.senderId.message as any}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Receiver Party (Cr) <span className="text-red-400">*</span>
                </label>
                <select {...register('receiverId')} className="form-select">
                  <option value="">— Select Receiver —</option>
                  {parties?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}  {p.cityName ? `(${p.cityName})` : ''}</option>
                  ))}
                </select>
                {errors.receiverId && <p className="text-xs text-red-500">⚠ {errors.receiverId.message as any}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <ScaledAmountInput
                      label="Amount (₹)"
                      placeholder="0.00"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors.amount?.message as any}
                      required
                    />
                  )}
                />
                <Input
                  label="Vatav (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.25"
                  {...register('vatavRate')}
                  error={errors.vatavRate?.message as any}
                />
              </div>

              {/* Live vatav preview */}
              <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Commission Preview</p>
                  <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                    ₹ {formatScaledCurrency(vatavPreview, { showSymbol: false })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-300" />
              </div>

              <Input
                label="Narration / Note"
                type="text"
                placeholder="Optional description..."
                {...register('narration')}
              />

              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="w-full"
                size="lg"
                isLoading={mutCreate.isPending}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Save Transaction
              </Button>
            </form>
          </div>
        </div>

        {/* ─── Daybook ─── */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">Today's Daybook</h2>
            <Badge variant="indigo" dot>{activeTxns.length} Transactions</Badge>
          </div>

          <div className="section-card overflow-hidden">
            <Table
              data={activeTxns}
              isLoading={loadDaybook}
              keyExtractor={(t: any) => t.id}
              emptyMessage="No transactions recorded today. Use the form to add your first entry."
              emptyIcon={<ArrowLeftRight className="w-8 h-8 text-slate-200" />}
              columns={[
                { header: 'Txn #', accessor: (t: any) => <span className="font-mono text-xs text-slate-500">{t.txnNumber}</span> },
                {
                  header: 'Sender',
                  accessor: (t: any) => (
                    <span className="font-semibold text-red-600">{t.senderName}</span>
                  )
                },
                {
                  header: 'Receiver',
                  accessor: (t: any) => (
                    <span className="font-semibold text-emerald-600">{t.receiverName}</span>
                  )
                },
                {
                  header: 'Amount ₹',
                  accessor: (t: any) => (
                    <span className="font-bold text-slate-900">{formatScaledCurrency(t.amount)}</span>
                  )
                },
                {
                  header: 'Vatav ₹',
                  accessor: (t: any) => (
                    <Badge variant="warning">{formatScaledCurrency(t.vatavAmount)}</Badge>
                  )
                },
                {
                  header: 'Date',
                  accessor: (t: any) => (
                    <span className="text-xs text-slate-400">{t.txnDate}</span>
                  )
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
