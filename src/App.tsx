import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeProvider';
import { AuthProvider } from './context/AuthProvider';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth, RequireRole, RequireVerified } from './components/layout/guards';
import { Splash } from './pages/Splash';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Notes } from './pages/Notes';
import { Chat } from './pages/Chat';
import { News } from './pages/News';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { ContributorApply } from './pages/ContributorApply';
import { ContributorDashboard } from './pages/ContributorDashboard';
import { AdminPanel } from './pages/admin/AdminPanel';
import { Roadmap } from './pages/Roadmap';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/verify-email"
              element={
                <RequireAuth>
                  <VerifyEmail />
                </RequireAuth>
              }
            />

            {/* Authenticated + verified app shell */}
            <Route
              element={
                <RequireVerified>
                  <AppShell />
                </RequireVerified>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/news" element={<News />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/apply" element={<ContributorApply />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route
                path="/contributor"
                element={
                  <RequireRole roles={['contributor', 'admin']}>
                    <ContributorDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireRole roles={['admin']}>
                    <AdminPanel />
                  </RequireRole>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
