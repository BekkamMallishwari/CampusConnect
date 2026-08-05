import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CampusMapPage = lazy(() => import('./pages/CampusMapPage'));
const ReportLostItemPage = lazy(() => import('./pages/ReportLostItemPage'));
const ReportFoundItemPage = lazy(() => import('./pages/ReportFoundItemPage'));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage'));
const ItemDetailsPage = lazy(() => import('./pages/ItemDetailsPage'));
const ItemsCatalogPage = lazy(() => import('./pages/ItemsCatalogPage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const ReviewMatchPage = lazy(() => import('./pages/ReviewMatchPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12%] top-[-10%] h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[26%] h-96 w-96 rounded-full bg-slate-200/80 blur-3xl dark:bg-slate-800/40" />
      </div>

      <Navbar />

      <main className="w-full pb-16">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Guest Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Dashboard/App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/campus-map" element={<CampusMapPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Lost Items Routes */}
            <Route path="/lost-items" element={<ItemsCatalogPage type="lost" />} />
            <Route path="/lost-items/new" element={<ReportLostItemPage />} />
            <Route path="/lost-items/edit/:id" element={<ReportLostItemPage />} />
            <Route path="/lost-items/:id" element={<ItemDetailsPage type="lost" />} />

            {/* Found Items Routes */}
            <Route path="/found-items" element={<ItemsCatalogPage type="found" />} />
            <Route path="/found-items/new" element={<ReportFoundItemPage />} />
            <Route path="/found-items/edit/:id" element={<ReportFoundItemPage />} />
            <Route path="/found-items/:id" element={<ItemDetailsPage type="found" />} />

            {/* Workflows Routes */}
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/matches/:id" element={<ReviewMatchPage />} />
            <Route path="/chats" element={<ChatPage />} />
            <Route path="/messages" element={<ChatPage />} />
            <Route path="/chats/:id" element={<ChatPage />} />
            <Route path="/messages/:id" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/payments/confirm" element={<PaymentsPage />} />
            <Route path="/payments/success" element={<PaymentsPage />} />
            <Route path="/payments/cancel" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
