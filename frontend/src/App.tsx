import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from './components/layout/AppLayout';
import PrivateRoute from './components/layout/PrivateRoute';
import PublicRoute from './components/layout/PublicRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { PartyList } from './pages/parties/PartyList';
import { TransactionEntry } from './pages/transactions/TransactionEntry';
import { BulkImport } from './pages/transactions/BulkImport';
import { Ledger } from './pages/reports/Ledger';
import { TrialBalance } from './pages/reports/TrialBalance';
import { VatavReport } from './pages/reports/VatavReport';
import { InterestReport } from './pages/reports/InterestReport';
import { DailyRegister } from './pages/reports/DailyRegister';
import { UserManagement } from './pages/admin/UserManagement';
import { useSessionManager } from './hooks/useSessionManager';

function SessionWrapper({ children }: { children: React.ReactNode }) {
  useSessionManager();
  return <>{children}</>;
}

function App() {
  return (
    <SessionWrapper>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        
        {/* PRIVATE ROUTES */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/parties" element={<PartyList />} />
            <Route path="/transactions" element={<TransactionEntry />} />
            <Route path="/transactions/bulk-import" element={<BulkImport />} />
            <Route path="/reports" element={<Ledger />} />
            <Route path="/reports/trial-balance" element={<TrialBalance />} />
            <Route path="/reports/vatav" element={<VatavReport />} />
            <Route path="/reports/interest" element={<InterestReport />} />
            <Route path="/reports/daily-register" element={<DailyRegister />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </SessionWrapper>
  );
}

export default App;
