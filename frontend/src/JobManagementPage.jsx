import React, { useState, useEffect } from 'react';

export default function JobManagementPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [analyzing, setAnalyzing] = useState({});
  const [fetchingJobs, setFetchingJobs] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/jobs?analyzed_only=false&limit=50', {
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
    setFetchingJobs(true);
    setError('');
    const token = localStorage.getItem('jwt');
    
    try {
      const queryParams = new URLSearchParams({
        keywords: searchKeywords || 'software engineer',
        location: searchLocation || 'india',
        results_per_page: '30',
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
        setError('');
        await fetchJobs(); // Refresh the jobs list
      } else {
        setError(data.message || 'Failed to fetch jobs from API');
      }
    } catch (err) {
      setError('Network error while fetching jobs');
    } finally {
      setFetchingJobs(false);
    }
  };

  const analyzeJob = async (jobId) => {
    setAnalyzing({ ...analyzing, [jobId]: true });
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch(`http://localhost:4000/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Refresh the jobs list to show updated analysis
        await fetchJobs();
      } else {
        setError('Failed to analyze job');
      }
    } catch (error) {
      setError('Error analyzing job');
    } finally {
      setAnalyzing({ ...analyzing, [jobId]: false });
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch(`http://localhost:4000/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        await fetchJobs();
      } else {
        setError('Failed to delete job');
      }
    } catch (error) {
      setError('Error deleting job');
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

  const searchGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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

  const statusBadgeStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 'bold'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'analyzed': return { backgroundColor: '#28a745', color: 'white' };
      case 'pending': return { backgroundColor: '#ffc107', color: '#212529' };
      case 'error': return { backgroundColor: '#dc3545', color: 'white' };
      default: return { backgroundColor: '#6c757d', color: 'white' };
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem', textAlign: 'center' }}>
        💼 Job Management Dashboard
      </h1>

      {/* Job Fetching Section */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>🔍 Fetch New Jobs</h2>
        
        <div style={searchGridStyle}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Keywords:
            </label>
            <input
              type="text"
              placeholder="e.g., software engineer, react developer"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Location:
            </label>
            <input
              type="text"
              placeholder="e.g., Bangalore, Mumbai, India"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        
        <button 
          onClick={fetchJobsFromAPI} 
          disabled={fetchingJobs}
          style={{
            ...buttonStyle,
            backgroundColor: fetchingJobs ? '#6c757d' : '#28a745'
          }}
        >
          {fetchingJobs ? '🔄 Fetching Jobs...' : '🔍 Fetch Jobs from API'}
        </button>
        
        <button 
          onClick={fetchJobs} 
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: '#6f42c1'
          }}
        >
          🔄 Refresh List
        </button>
      </section>

      {/* Jobs List Section */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📋 Current Jobs ({jobs.length})</h2>
        
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
            <div>No jobs available. Try fetching some jobs from the API.</div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>
                        {job.title || 'Untitled Job'}
                      </h4>
                      <span style={{
                        ...statusBadgeStyle,
                        ...getStatusColor(job.analysisStatus || 'pending')
                      }}>
                        {job.analysisStatus === 'analyzed' ? '✅ Analyzed' : 
                         job.analysisStatus === 'error' ? '❌ Error' : 
                         '⏳ Pending'}
                      </span>
                    </div>
                    
                    <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                      🏢 {job.company || 'Company Not Available'}
                    </div>
                    <div style={{ color: '#6c757d', marginBottom: '1rem' }}>
                      📍 {job.location || 'Location Not Available'}
                    </div>

                    {job.salary && (
                      <div style={{ color: '#28a745', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        💰 {job.salary}
                      </div>
                    )}

                    {job.description && (
                      <p style={{ 
                        margin: '0 0 1rem 0', 
                        color: '#495057',
                        lineHeight: '1.5',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {job.description.length > 200 ? 
                          job.description.substring(0, 200) + '...' : 
                          job.description
                        }
                      </p>
                    )}

                    <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                      📅 Added: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem' }}>
                    {(!job.analysisStatus || job.analysisStatus === 'pending' || job.analysisStatus === 'error') && (
                      <button
                        onClick={() => analyzeJob(job._id)}
                        disabled={analyzing[job._id]}
                        style={{
                          ...buttonStyle,
                          backgroundColor: analyzing[job._id] ? '#6c757d' : '#28a745',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        {analyzing[job._id] ? '🧠 Analyzing...' : '🔍 Analyze with AI'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteJob(job._id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Delete
                    </button>
                    
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
                        🔗 View Original
                      </a>
                    )}
                  </div>
                </div>

                {/* Show AI Analysis Results */}
                {job.analysis && job.analysisStatus === 'analyzed' && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: '4px',
                    border: '1px solid #c3e6c3'
                  }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                      🤖 AI Analysis Results:
                    </h5>
                    <div style={{ fontSize: '0.9rem', color: '#495057' }}>
                      {typeof job.analysis === 'string' ? 
                        job.analysis : 
                        JSON.stringify(job.analysis, null, 2)
                      }
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Statistics Section */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📊 Job Statistics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#007bff', marginBottom: '0.5rem' }}>
              {jobs.length}
            </div>
            <div style={{ color: '#6c757d' }}>Total Jobs</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#28a745', marginBottom: '0.5rem' }}>
              {jobs.filter(job => job.analysisStatus === 'analyzed').length}
            </div>
            <div style={{ color: '#6c757d' }}>Analyzed</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#ffc107', marginBottom: '0.5rem' }}>
              {jobs.filter(job => !job.analysisStatus || job.analysisStatus === 'pending').length}
            </div>
            <div style={{ color: '#6c757d' }}>Pending Analysis</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', color: '#dc3545', marginBottom: '0.5rem' }}>
              {jobs.filter(job => job.analysisStatus === 'error').length}
            </div>
            <div style={{ color: '#6c757d' }}>Analysis Errors</div>
          </div>
        </div>
      </section>
    </div>
  );
}
