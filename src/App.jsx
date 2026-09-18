import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ThemeProvider from '@/components/ThemeProvider';
import { UIProvider } from '@/lib/UIContext';
import HouseholdGate from '@/components/HouseholdGate';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Budgets from '@/pages/Budgets';
import Recurring from '@/pages/Recurring';
import Settings from '@/pages/Settings';
import Rapports from '@/pages/Rapports';
import GestionMembres from '@/pages/GestionMembres';
import Notifications from '@/pages/Notifications';
import Categories from '@/pages/Categories';
import Calendrier from '@/pages/Calendrier';
import Objectifs from '@/pages/Objectifs';
import AnalyseMensuelle from '@/pages/AnalyseMensuelle';
import ExportDonnees from '@/pages/ExportDonnees';
import RepartitionDepenses from '@/pages/RepartitionDepenses';
import Aide from '@/pages/Aide';
import Dettes from '@/pages/Dettes';
import FluxTresorerie from '@/pages/FluxTresorerie';
import Profil from '@/pages/Profil';
import Landing from '@/pages/Landing';
import Abonnement from '@/pages/Abonnement';
import SuperAdmin from '@/pages/SuperAdmin';
import JournalActivite from '@/pages/JournalActivite';
import GestionPatrimoine from '@/pages/GestionPatrimoine';
import ParametresNotifications from '@/pages/ParametresNotifications';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<HouseholdGate />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/abonnement" element={<Abonnement />} />
            <Route path="/super-admin" element={<SuperAdmin />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/rapports" element={<Rapports />} />
            <Route path="/analyse-mensuelle" element={<AnalyseMensuelle />} />
            <Route path="/repartition-depenses" element={<RepartitionDepenses />} />
            <Route path="/flux-tresorerie" element={<FluxTresorerie />} />
            <Route path="/objectifs" element={<Objectifs />} />
            <Route path="/dettes" element={<Dettes />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/calendrier" element={<Calendrier />} />
            <Route path="/gestion-membres" element={<GestionMembres />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/export-donnees" element={<ExportDonnees />} />
            <Route path="/aide" element={<Aide />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit-log" element={<JournalActivite />} />
            <Route path="/gestion-patrimoine" element={<GestionPatrimoine />} />
            <Route path="/parametres-notifications" element={<ParametresNotifications />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <UIProvider>
              <AuthenticatedApp />
            </UIProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App