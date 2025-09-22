import { useState, useEffect } from 'react';

export default function ResumeUploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
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
        setResumes(data.resumes || []);
      } else {
        console.error('Failed to fetch resumes');
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage('');
    setAnalysisResults(null);
    
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setMessage('Please select a PDF or Word document');
        setFile(null);
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        setFile(null);
        return;
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const token = localStorage.getItem('jwt');
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch('http://localhost:4000/resumes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();
      
      if (res.ok) {
        setMessage('Resume uploaded and analyzed successfully!');
        setFile(null);
        
        // Display analysis results
        if (data.analysis) {
          setAnalysisResults(data.analysis);
        }
        
        // Reset file input
        const fileInput = document.getElementById('resume-file');
        if (fileInput) fileInput.value = '';
        
        // Refresh resumes list
        await fetchResumes();
      } else {
        setMessage(data.message || 'Upload failed');
      }
    } catch (err) {
      setMessage('Network error. Please check if services are running.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const analyzeResume = async (resumeId) => {
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch(`http://localhost:4000/resumes/${resumeId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResults(data.analysis);
        setMessage('Resume analysis completed!');
        await fetchResumes();
      } else {
        setMessage('Failed to analyze resume');
      }
    } catch (error) {
      setMessage('Error analyzing resume');
    }
  };

  const deleteResume = async (resumeId) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch(`http://localhost:4000/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setMessage('Resume deleted successfully');
        await fetchResumes();
      } else {
        setMessage('Failed to delete resume');
      }
    } catch (error) {
      setMessage('Error deleting resume');
    }
  };

  const containerStyle = {
    maxWidth: '1000px',
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

  const uploadAreaStyle = {
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: file ? '#f8f9fa' : '#fefefe',
    transition: 'all 0.3s'
  };

  const fileInputStyle = {
    margin: '1rem 0',
    padding: '0.5rem',
    width: '100%',
    border: '1px solid #dee2e6',
    borderRadius: '4px'
  };

  const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem'
  };

  const progressBarStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    marginTop: '1rem',
    overflow: 'hidden'
  };

  const progressFillStyle = {
    width: `${uploadProgress}%`,
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.3s'
  };

  const resumeCardStyle = {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#fafafa'
  };

  const analysisCardStyle = {
    backgroundColor: '#e8f5e8',
    border: '1px solid #c3e6c3',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem'
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem', textAlign: 'center' }}>
        📄 Resume Management
      </h1>

      {/* Upload Section */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>Upload New Resume</h2>
        
        <form onSubmit={handleUpload}>
          <div style={uploadAreaStyle}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
            <h3>Upload Your Resume</h3>
            <p>Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
            
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={fileInputStyle}
            />
            
            {file && (
              <div style={{ marginTop: '1rem', color: '#28a745' }}>
                ✅ Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={!file || uploading}
            style={{
              ...buttonStyle,
              backgroundColor: (!file || uploading) ? '#6c757d' : '#007bff',
              cursor: (!file || uploading) ? 'not-allowed' : 'pointer'
            }}
          >
            {uploading ? 'Uploading & Analyzing...' : 'Upload Resume'}
          </button>
          
          {uploading && (
            <div style={progressBarStyle}>
              <div style={progressFillStyle}></div>
            </div>
          )}
        </form>

        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '4px',
            backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
            color: message.includes('success') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}
      </section>

      {/* Analysis Results */}
      {analysisResults && (
        <section style={sectionStyle}>
          <h2 style={titleStyle}>AI Analysis Results</h2>
          <div style={analysisCardStyle}>
            <h3 style={{ color: '#2c3e50', marginBottom: '1rem' }}>Resume Analysis</h3>
            
            {analysisResults.skills && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>🔧 Extracted Skills:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {Array.isArray(analysisResults.skills) ? 
                    analysisResults.skills.map((skill, index) => (
                      <span key={index} style={{
                        display: 'inline-block',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        margin: '0.25rem',
                      }}>
                        {skill}
                      </span>
                    )) : 
                    <span>{analysisResults.skills}</span>
                  }
                </div>
              </div>
            )}

            {analysisResults.experience && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>💼 Experience Level:</strong> {analysisResults.experience}
              </div>
            )}

            {analysisResults.summary && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>📝 AI Summary:</strong>
                <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                  {analysisResults.summary}
                </p>
              </div>
            )}

            {analysisResults.recommendations && (
              <div>
                <strong>💡 Recommendations:</strong>
                <p style={{ marginTop: '0.5rem' }}>
                  {analysisResults.recommendations}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Existing Resumes */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>My Resumes</h2>
        
        {loadingResumes ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <div>Loading resumes...</div>
          </div>
        ) : resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
            <div>No resumes uploaded yet</div>
          </div>
        ) : (
          <div>
            {resumes.map((resume, index) => (
              <div key={resume._id || index} style={resumeCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                      Resume #{index + 1}
                    </h4>
                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                      <div>📅 Uploaded: {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'Unknown'}</div>
                      <div>🔍 Status: {resume.analysisStatus || 'Pending'}</div>
                      {resume.filename && <div>📄 File: {resume.filename}</div>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(!resume.analysisStatus || resume.analysisStatus === 'pending') && (
                      <button
                        onClick={() => analyzeResume(resume._id)}
                        style={{
                          ...buttonStyle,
                          backgroundColor: '#28a745',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        🔍 Analyze
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteResume(resume._id)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: '#dc3545',
                        padding: '0.5rem 1rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                {resume.analysis && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}>
                    <strong>AI Analysis:</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {typeof resume.analysis === 'string' ? 
                        resume.analysis : 
                        JSON.stringify(resume.analysis, null, 2)
                      }
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
