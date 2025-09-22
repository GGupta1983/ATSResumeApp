
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ResumeUploadPage from './ResumeUploadPage';
import JobRecommendationsPage from './JobRecommendationsPage';
import JobManagementPage from './JobManagementPage';
import MatchResultsPage from './MatchResultsPage';
import CandidateProfilePage from './CandidateProfilePage';
import Navigation from './Navigation';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      // Decode token to get user role
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || 'candidate');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('jwt');
      }
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('jwt', token);
    setUserRole(role || 'candidate');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <Navigation userRole={userRole} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard userRole={userRole} />} />
            <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />
            
            {/* Candidate Routes */}
            <Route path="/upload-resume" element={<ResumeUploadPage />} />
            <Route path="/job-recommendations" element={<JobRecommendationsPage />} />
            <Route path="/profile" element={<CandidateProfilePage />} />
            
            {/* Recruiter Routes */}
            {userRole === 'recruiter' && (
              <>
                <Route path="/jobs" element={<JobManagementPage />} />
                <Route path="/matches" element={<MatchResultsPage />} />
              </>
            )}
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
