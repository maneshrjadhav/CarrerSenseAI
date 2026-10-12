import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import ResumeAnalysisResult from './pages/ResumeAnalysisResult';
import JobMatch from './pages/JobMatch';
import JobMatchResult from './pages/JobMatchResult';
import SkillGapPage from './pages/SkillGapPage';
import Resumes from './pages/Resumes';
import Matches from './pages/Matches';
import Roadmap from './pages/Roadmap';
import Interview from './pages/Interview';
import History from './pages/History';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminPayments from './pages/AdminPayments';

import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription" element={<Pricing />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />

              {/* Protected Application Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Resume Analyzer & Analysis Result Routes */}
                <Route path="/resume-analyzer" element={<Analyze />} />
                <Route path="/analyze" element={<Analyze />} />
                <Route path="/resume-analysis/:resumeId" element={<ResumeAnalysisResult />} />
                <Route path="/resumes" element={<Resumes />} />

                {/* Job Match Routes */}
                <Route path="/job-match" element={<JobMatch />} />
                <Route path="/job-match/:resumeId" element={<JobMatch />} />
                <Route path="/job-match-result/:matchId" element={<JobMatchResult />} />
                <Route path="/analysis/:analysisId" element={<JobMatchResult />} />
                <Route path="/matches" element={<Matches />} />

                {/* Skill Gap Routes */}
                <Route path="/skill-gap" element={<SkillGapPage />} />
                <Route path="/skill-gap/:matchId" element={<SkillGapPage />} />
                <Route path="/skills" element={<SkillGapPage />} />

                {/* Career Roadmap Routes */}
                <Route path="/career-roadmap" element={<Roadmap />} />
                <Route path="/career-roadmap/:matchId" element={<Roadmap />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/roadmap/:matchId" element={<Roadmap />} />

                {/* Interview Prep Routes */}
                <Route path="/interview-prep" element={<Interview />} />
                <Route path="/interview-prep/:matchId" element={<Interview />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/interview/:matchId" element={<Interview />} />

                {/* History, Profile & Settings */}
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />

                {/* Admin Portal Routes */}
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/payment-settings" element={<AdminPayments />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
