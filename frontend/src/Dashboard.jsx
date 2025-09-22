import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard({ userRole }) {
  const [stats, setStats] = useState({
    resumes: 0,
    jobs: 0,
    matches: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [quickActions, setQuickActions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    setupQuickActions();
  }, [userRole]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('jwt');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      // Fetch stats from various services
      const [resumesRes, jobsRes, matchesRes] = await Promise.allSettled([
        fetch('http://localhost:4000/resumes', { headers }),
        fetch('http://localhost:4000/jobs', { headers }),
        fetch('http://localhost:4000/matches', { headers })
      ]);

      const newStats = { ...stats };
      
      if (resumesRes.status === 'fulfilled' && resumesRes.value.ok) {
        const resumeData = await resumesRes.value.json();
        newStats.resumes = resumeData.pagination?.total_resumes || resumeData.resumes?.length || 0;
      }

      if (jobsRes.status === 'fulfilled' && jobsRes.value.ok) {
        const jobData = await jobsRes.value.json();
        newStats.jobs = jobData.pagination?.total_jobs || jobData.jobs?.length || 0;
      }

      if (matchesRes.status === 'fulfilled' && matchesRes.value.ok) {
        const matchData = await matchesRes.value.json();
        newStats.matches = matchData.pagination?.total_matches || matchData.matches?.length || 0;
      }

      setStats({ ...newStats, loading: false });

      // Set recent activity based on role
      if (userRole === 'recruiter') {
        setRecentActivity([
          { action: 'New job posted', time: '2 hours ago', icon: '💼' },
          { action: 'Candidate matched', time: '4 hours ago', icon: '🎯' },
          { action: 'Resume analyzed', time: '1 day ago', icon: '📄' },
        ]);
      } else {
        setRecentActivity([
          { action: 'Resume uploaded', time: '1 hour ago', icon: '📄' },
          { action: 'Job recommendations updated', time: '3 hours ago', icon: '🔍' },
          { action: 'Profile completed', time: '2 days ago', icon: '👤' },
        ]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({ ...stats, loading: false });
    }
  };

  const setupQuickActions = () => {
    if (userRole === 'recruiter') {
      setQuickActions([
        { label: 'Post New Job', icon: '➕', path: '/jobs', color: '#28a745' },
        { label: 'View Matches', icon: '🎯', path: '/matches', color: '#007bff' },
        { label: 'Browse Candidates', icon: '👥', path: '/candidates', color: '#17a2b8' },
      ]);
    } else {
      setQuickActions([
        { label: 'Upload Resume', icon: '📤', path: '/upload-resume', color: '#28a745' },
        { label: 'Find Jobs', icon: '🔍', path: '/job-recommendations', color: '#007bff' },
        { label: 'Update Profile', icon: '👤', path: '/profile', color: '#6f42c1' },
      ]);
    }
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    marginBottom: '2rem',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    color: '#7f8c8d',
    textTransform: 'capitalize'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem'
  };

  const statCardStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #e9ecef'
  };

  const statValueStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  };

  const statLabelStyle = {
    fontSize: '1rem',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const sectionStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem'
  };

  const sectionTitleStyle = {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '1rem',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '0.5rem'
  };

  const quickActionsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  };

  const actionButtonStyle = {
    display: 'block',
    padding: '1rem',
    textAlign: 'center',
    textDecoration: 'none',
    color: 'white',
    borderRadius: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    fontSize: '1rem',
    fontWeight: '500'
  };

  const activityListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const activityItemStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #e9ecef',
    gap: '1rem'
  };

  const activityIconStyle = {
    fontSize: '1.5rem',
    width: '40px',
    textAlign: 'center'
  };

  const activityContentStyle = {
    flex: 1
  };

  const activityTimeStyle = {
    fontSize: '0.85rem',
    color: '#6c757d'
  };

  if (stats.loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          Welcome to ATS Dashboard
        </h1>
        <p style={subtitleStyle}>
          {userRole} Portal - Your hiring journey starts here
        </p>
      </header>

      {/* Statistics Cards */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={statValueStyle}>
            {stats.resumes}
          </div>
          <div style={statLabelStyle}>
            📄 {userRole === 'recruiter' ? 'Total Resumes' : 'My Resumes'}
          </div>
        </div>
        
        <div style={statCardStyle}>
          <div style={statValueStyle}>
            {stats.jobs}
          </div>
          <div style={statLabelStyle}>
            💼 {userRole === 'recruiter' ? 'Job Postings' : 'Available Jobs'}
          </div>
        </div>
        
        <div style={statCardStyle}>
          <div style={statValueStyle}>
            {stats.matches}
          </div>
          <div style={statLabelStyle}>
            🎯 {userRole === 'recruiter' ? 'Total Matches' : 'My Matches'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Quick Actions</h2>
        <div style={quickActionsGridStyle}>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              style={{
                ...actionButtonStyle,
                backgroundColor: action.color
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {action.icon}
              </div>
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Recent Activity</h2>
        <ul style={activityListStyle}>
          {recentActivity.map((activity, index) => (
            <li key={index} style={activityItemStyle}>
              <div style={activityIconStyle}>
                {activity.icon}
              </div>
              <div style={activityContentStyle}>
                <div>{activity.action}</div>
                <div style={activityTimeStyle}>{activity.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* System Status */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>System Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#28a745', fontSize: '1.2rem' }}>✅</span>
            <span>Resume Service</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#28a745', fontSize: '1.2rem' }}>✅</span>
            <span>Job Service</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#28a745', fontSize: '1.2rem' }}>✅</span>
            <span>Match Service</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#28a745', fontSize: '1.2rem' }}>✅</span>
            <span>AI Engine</span>
          </div>
        </div>
      </section>
    </div>
  );
}
