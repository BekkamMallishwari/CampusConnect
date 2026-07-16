import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ReportLostItemPage from './pages/ReportLostItemPage';
import ReportFoundItemPage from './pages/ReportFoundItemPage';
import MyReportsPage from './pages/MyReportsPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import ItemsCatalogPage from './pages/ItemsCatalogPage';
import MatchesPage from './pages/MatchesPage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import RewardsPage from './pages/RewardsPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Guest Routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Dashboard/App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
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
          <Route path="/my-posts" element={<MyReportsPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/chats" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
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
  );
}
