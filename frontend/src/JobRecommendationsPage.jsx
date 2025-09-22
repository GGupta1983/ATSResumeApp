import { useState, useEffect } from 'react';

export default function JobRecommendationsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    keywords: '',
    location: '',
    minScore: 0.5,
    maxResults: 10
  });
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [availableResumes, setAvailableResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  useEffect(() => {
    fetchAvailableJobs();
    fetchAvailableResumes();
  }, []);

  const fetchAvailableResumes = async () => {
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/resumes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAvailableResumes(data.resumes || []);
        if (data.resumes && data.resumes.length > 0) {
          setSelectedResumeId(data.resumes[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const fetchAvailableJobs = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '20',
        analyzed_only: 'false'
      });

      const res = await fetch(`http://localhost:4000/jobs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs || []);
      } else {
        setError(data.message || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError('Network error. Please check if services are running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobsFromAPI = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      const queryParams = new URLSearchParams({
        keywords: filters.keywords || 'software developer',
        location: filters.location || 'india',
        results_per_page: '20',
        page: '1'
      });

      const res = await fetch(`http://localhost:4000/jobs/fetch?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs || []);
        setError(''); // Clear any previous errors
      } else {
        setError(data.message || 'Failed to fetch jobs from API');
      }
    } catch (err) {
      setError('Network error while fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const getPersonalizedMatches = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume first');
      return;
    }

    setMatchLoading(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      const requestBody = {
        resume_id: selectedResumeId,
        filters: {
          max_matches: parseInt(filters.maxResults),
          min_score_threshold: parseFloat(filters.minScore)
        }
      };

      const res = await fetch('http://localhost:4000/matches/auto-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      if (res.ok) {
        setMatches(data.matches || []);
        setError(''); // Clear any previous errors
      } else {
        setError(data.message || 'Failed to get personalized matches');
      }
    } catch (err) {
      setError('Network error while getting matches');
    } finally {
      setMatchLoading(false);
    }
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

  const jobCardStyle = {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    backgroundColor: '#fafafa',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  const matchCardStyle = {
    ...jobCardStyle,
    borderLeft: '4px solid #28a745'
  };

  const scoreStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
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
        🔍 Job Recommendations
      </h1>

      {/* Search & Filter Section */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>Search Jobs</h2>
        
        <div style={filtersStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Keywords:
            </label>
            <input
              type="text"
              placeholder="e.g., software developer, react"
              value={filters.keywords}
              onChange={(e) => setFilters({...filters, keywords: e.target.value})}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Location:
            </label>
            <input
              type="text"
              placeholder="e.g., Bangalore, Mumbai"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Min Match Score:
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
              value={filters.maxResults}
              onChange={(e) => setFilters({...filters, maxResults: parseInt(e.target.value)})}
              style={inputStyle}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button 
            onClick={fetchJobsFromAPI} 
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#6c757d' : '#007bff'
            }}
          >
            {loading ? '🔄 Searching...' : '🔍 Search Jobs'}
          </button>
          
          <button 
            onClick={fetchAvailableJobs} 
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: '#6f42c1'
            }}
          >
            📋 View All Jobs
          </button>
        </div>
      </section>

      {/* AI-Powered Personalized Matches */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>🤖 AI-Powered Personalized Matches</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Select Resume for Analysis:
          </label>
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            style={{ ...inputStyle, maxWidth: '400px' }}
          >
            <option value="">Select a resume...</option>
            {availableResumes.map((resume, index) => (
              <option key={resume._id} value={resume._id}>
                Resume #{index + 1} ({resume.filename || 'Unnamed'})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={getPersonalizedMatches} 
          disabled={matchLoading || !selectedResumeId}
          style={{
            ...buttonStyle,
            backgroundColor: matchLoading || !selectedResumeId ? '#6c757d' : '#28a745'
          }}
        >
          {matchLoading ? '🧠 Analyzing...' : '🎯 Get AI Matches'}
        </button>

        {matches.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
              🎯 Your Personalized Matches ({matches.length})
            </h3>
            {matches.map((match, index) => (
              <div key={index} style={matchCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                      {match.job?.title || 'Job Title Not Available'}
                    </h4>
                    <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                      🏢 {match.job?.company || 'Company Not Available'}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '1rem' }}>
                      📍 {match.job?.location || 'Location Not Available'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{
                      ...scoreStyle,
                      backgroundColor: getScoreColor(match.score)
                    }}>
                      {Math.round(match.score * 100)}% Match
                    </span>
                  </div>
                </div>

                {match.strengths && match.strengths.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#28a745' }}>✅ Strengths:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      {match.strengths.map((strength, idx) => (
                        <li key={idx} style={{ color: '#28a745' }}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {match.concerns && match.concerns.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#dc3545' }}>⚠️ Areas to Consider:</strong>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      {match.concerns.map((concern, idx) => (
                        <li key={idx} style={{ color: '#dc3545' }}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {match.job?.url && (
                  <a 
                    href={match.job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#007bff',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    🔗 View Full Job Details
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All Jobs Section */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📋 Available Jobs ({jobs.length})</h2>
        
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
            <div>Loading jobs...</div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💼</div>
            <div>No jobs available. Try searching with different keywords.</div>
          </div>
        ) : (
          <div>
            {jobs.map((job, index) => (
              <div 
                key={job._id || index} 
                style={jobCardStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '1.2rem' }}>
                      {job.title}
                    </h4>
                    <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                      🏢 {job.company}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '1rem' }}>
                      📍 {job.location}
                    </div>
                    
                    {job.description && (
                      <p style={{ 
                        margin: '0 0 1rem 0', 
                        color: '#495057',
                        lineHeight: '1.5',
                        maxHeight: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {job.description.length > 300 ? 
                          job.description.substring(0, 300) + '...' : 
                          job.description
                        }
                      </p>
                    )}

                    {job.salary && (
                      <div style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        💰 {job.salary}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                    {job.url && (
                      <a 
                        href={job.url} 
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
                        🔗 Apply
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
