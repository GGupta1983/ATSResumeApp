import React, { useState, useEffect } from 'react';

export default function MatchResultsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    minScore: 0.5,
    maxMatches: 20,
    jobId: '',
    resumeId: ''
  });
  const [availableJobs, setAvailableJobs] = useState([]);
  const [availableResumes, setAvailableResumes] = useState([]);
  const [runningMatch, setRunningMatch] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchAvailableJobs();
    fetchAvailableResumes();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50'
      });

      const res = await fetch(`http://localhost:4000/matches?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches || []);
      } else {
        setError(data.message || 'Failed to fetch matches');
      }
    } catch (err) {
      setError('Network error. Please check if services are running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableJobs = async () => {
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/jobs?analyzed_only=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAvailableJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchAvailableResumes = async () => {
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/resumes?analyzed_only=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAvailableResumes(data.resumes || []);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const runAutoMatch = async () => {
    if (!filters.resumeId && !filters.jobId) {
      setError('Please select either a specific job or resume to match against');
      return;
    }

    setRunningMatch(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      let requestBody;
      let endpoint;

      if (filters.resumeId) {
        // Match jobs for a specific resume
        endpoint = 'http://localhost:4000/matches/auto-match';
        requestBody = {
          resume_id: filters.resumeId,
          filters: {
            max_matches: parseInt(filters.maxMatches),
            min_score_threshold: parseFloat(filters.minScore)
          }
        };
      } else if (filters.jobId) {
        // Match candidates for a specific job
        endpoint = 'http://localhost:4000/jobs/match-candidate';
        requestBody = {
          job_id: filters.jobId,
          filters: {
            max_matches: parseInt(filters.maxMatches),
            min_score_threshold: parseFloat(filters.minScore)
          }
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      if (res.ok) {
        // Refresh matches list
        await fetchMatches();
        setError(''); // Clear any previous errors
      } else {
        setError(data.message || 'Failed to run auto-matching');
      }
    } catch (err) {
      setError('Network error while running auto-match');
    } finally {
      setRunningMatch(false);
    }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm('Are you sure you want to delete this match?')) {
      return;
    }

    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch(`http://localhost:4000/matches/${matchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        await fetchMatches();
      } else {
        setError('Failed to delete match');
      }
    } catch (error) {
      setError('Error deleting match');
    }
  };

  const contactCandidate = async (match) => {
    // Placeholder for contact functionality
    alert(`Contact feature would reach out to candidate for ${match.job?.title} position`);
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  };

  const sectionStyle = {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '2rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '1rem',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '0.5rem'
  };

  const filtersStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  };

  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '1rem'
  };

  const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    margin: '0.25rem'
  };

  const matchCardStyle = {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    backgroundColor: '#fafafa',
    borderLeft: '4px solid #28a745'
  };

  const scoreStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: 'white'
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#28a745'; // Green
    if (score >= 0.6) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem', textAlign: 'center' }}>
        🎯 Candidate-Job Matching Dashboard
      </h1>

      {/* Matching Controls */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>🤖 AI-Powered Matching</h2>
        
        <div style={filtersStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Select Job to Find Candidates:
            </label>
            <select
              value={filters.jobId}
              onChange={(e) => setFilters({...filters, jobId: e.target.value, resumeId: ''})}
              style={inputStyle}
            >
              <option value="">Select a job...</option>
              {availableJobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} - {job.company}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              OR Select Resume to Find Jobs:
            </label>
            <select
              value={filters.resumeId}
              onChange={(e) => setFilters({...filters, resumeId: e.target.value, jobId: ''})}
              style={inputStyle}
            >
              <option value="">Select a resume...</option>
              {availableResumes.map((resume, index) => (
                <option key={resume._id} value={resume._id}>
                  Resume #{index + 1} ({resume.filename || 'Unnamed'})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Minimum Match Score:
            </label>
            <select
              value={filters.minScore}
              onChange={(e) => setFilters({...filters, minScore: parseFloat(e.target.value)})}
              style={inputStyle}
            >
              <option value={0.3}>30%</option>
              <option value={0.5}>50%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Max Results:
            </label>
            <select
              value={filters.maxMatches}
              onChange={(e) => setFilters({...filters, maxMatches: parseInt(e.target.value)})}
              style={inputStyle}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={runAutoMatch} 
            disabled={runningMatch || (!filters.jobId && !filters.resumeId)}
            style={{
              ...buttonStyle,
              backgroundColor: runningMatch || (!filters.jobId && !filters.resumeId) ? '#6c757d' : '#28a745'
            }}
          >
            {runningMatch ? '🧠 AI Matching...' : '🎯 Run AI Match'}
          </button>
          
          <button 
            onClick={fetchMatches} 
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: '#6f42c1'
            }}
          >
            🔄 Refresh Matches
          </button>
        </div>
      </section>

      {/* Matches Results */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📋 Match Results ({matches.length})</h2>
        
        {error && (
          <div style={{
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <div>Loading matches...</div>
          </div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
            <div>No matches found. Try running AI matching with different parameters.</div>
          </div>
        ) : (
          <div>
            {matches.map((match, index) => (
              <div key={match._id || index} style={matchCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>
                        {match.job?.title || 'Job Title Not Available'}
                      </h4>
                      <span style={{
                        ...scoreStyle,
                        backgroundColor: getScoreColor(match.score || match.matchingScore?.overallScore || 0)
                      }}>
                        {Math.round((match.score || match.matchingScore?.overallScore || 0) * 100)}% Match
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      {/* Job Details */}
                      <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>💼 Job Details</h5>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                          <div>🏢 {match.job?.company || 'Company Not Available'}</div>
                          <div>📍 {match.job?.location || 'Location Not Available'}</div>
                          {match.job?.salary && <div>💰 {match.job.salary}</div>}
                        </div>
                      </div>
                      
                      {/* Resume Details */}
                      <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>👤 Candidate Details</h5>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                          <div>📄 Resume ID: {match.resumeId || 'Not Available'}</div>
                          <div>📅 Matched: {match.analyzedAt ? new Date(match.analyzedAt).toLocaleDateString() : 'Unknown'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths and Concerns */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem' 
                    }}>
                      {/* Strengths */}
                      {(match.strengths || match.matchingScore?.strengths) && (
                        <div style={{ padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                          <h6 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>✅ Strengths:</h6>
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem' }}>
                            {(match.strengths || match.matchingScore?.strengths || []).map((strength, idx) => (
                              <li key={idx} style={{ color: '#28a745', marginBottom: '0.25rem' }}>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {(match.concerns || match.matchingScore?.concerns) && (
                        <div style={{ padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                          <h6 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>⚠️ Areas to Consider:</h6>
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.9rem' }}>
                            {(match.concerns || match.matchingScore?.concerns || []).map((concern, idx) => (
                              <li key={idx} style={{ color: '#dc3545', marginBottom: '0.25rem' }}>
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => contactCandidate(match)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#28a745',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      📧 Contact
                    </button>
                    
                    <button
                      onClick={() => deleteMatch(match._id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Remove
                    </button>
                    
                    {match.job?.url && (
                      <a 
                        href={match.job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          ...buttonStyle,
                          backgroundColor: '#17a2b8',
                          textDecoration: 'none',
                          textAlign: 'center',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        🔗 View Job
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Statistics */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📊 Matching Statistics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#007bff', marginBottom: '0.5rem' }}>
              {matches.length}
            </div>
            <div style={{ color: '#6c757d' }}>Total Matches</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#28a745', marginBottom: '0.5rem' }}>
              {matches.filter(match => (match.score || match.matchingScore?.overallScore || 0) >= 0.8).length}
            </div>
            <div style={{ color: '#6c757d' }}>High Quality (80%+)</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#ffc107', marginBottom: '0.5rem' }}>
              {matches.filter(match => {
                const score = match.score || match.matchingScore?.overallScore || 0;
                return score >= 0.6 && score < 0.8;
              }).length}
            </div>
            <div style={{ color: '#6c757d' }}>Good Matches (60-80%)</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#17a2b8', marginBottom: '0.5rem' }}>
              {availableJobs.length}
            </div>
            <div style={{ color: '#6c757d' }}>Available Jobs</div>
          </div>
        </div>
      </section>
    </div>
  );
}
