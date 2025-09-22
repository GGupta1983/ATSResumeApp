import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation({ userRole, onLogout }) {
  const location = useLocation();
  
  const navItems = userRole === 'recruiter' 
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/jobs', label: 'Job Management', icon: '💼' },
        { path: '/matches', label: 'Candidate Matches', icon: '🎯' },
      ]
    : [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/upload-resume', label: 'Upload Resume', icon: '📄' },
        { path: '/job-recommendations', label: 'Job Recommendations', icon: '🔍' },
        { path: '/profile', label: 'My Profile', icon: '👤' },
      ];

  const navStyle = {
    backgroundColor: '#2c3e50',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1rem'
  };

  const logoStyle = {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: '#34495e'
  };

  const userInfoStyle = {
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const logoutButtonStyle = {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/dashboard" style={logoStyle}>
          🏢 ATS System
        </Link>
        
        <ul style={navLinksStyle}>
          {navItems.map(item => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                style={location.pathname === item.path ? activeLinkStyle : linkStyle}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        
        <div style={userInfoStyle}>
          <span>
            {userRole === 'recruiter' ? '👔 Recruiter' : '👤 Candidate'}
          </span>
          <button 
            onClick={onLogout}
            style={logoutButtonStyle}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
