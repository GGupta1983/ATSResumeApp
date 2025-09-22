import React, { useState, useEffect } from 'react';

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: ''
    },
    preferences: {
      jobTypes: [],
      locations: [],
      salaryRange: '',
      availability: ''
    },
    skills: [],
    experience: []
  });
  const [resumes, setResumes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchResumes();
    fetchMatches();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/candidates/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      } else {
        console.log('No existing profile found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const fetchMatches = async () => {
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/matches?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    const token = localStorage.getItem('jwt');
    
    try {
      const res = await fetch('http://localhost:4000/candidates/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const skill = prompt('Enter a new skill:');
    if (skill && skill.trim()) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skill.trim()]
      });
    }
  };

  const removeSkill = (index) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index)
    });
  };

  const addExperience = () => {
    const newExperience = {
      company: '',
      position: '',
      duration: '',
      description: ''
    };
    setProfile({
      ...profile,
      experience: [...profile.experience, newExperience]
    });
  };

  const updateExperience = (index, field, value) => {
    const updatedExperience = [...profile.experience];
    updatedExperience[index][field] = value;
    setProfile({
      ...profile,
      experience: updatedExperience
    });
  };

  const removeExperience = (index) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_, i) => i !== index)
    });
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

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: '1rem'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical'
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

  const skillTagStyle = {
    display: 'inline-block',
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    margin: '0.25rem',
    cursor: 'pointer'
  };

  const cardStyle = {
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: '#fafafa'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <div>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem', textAlign: 'center' }}>
        👤 My Profile
      </h1>

      {/* Personal Information */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📝 Personal Information</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Full Name:
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={profile.personalInfo.name}
              onChange={(e) => setProfile({
                ...profile,
                personalInfo: { ...profile.personalInfo, name: e.target.value }
              })}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Email:
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={profile.personalInfo.email}
              onChange={(e) => setProfile({
                ...profile,
                personalInfo: { ...profile.personalInfo, email: e.target.value }
              })}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Phone:
            </label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={profile.personalInfo.phone}
              onChange={(e) => setProfile({
                ...profile,
                personalInfo: { ...profile.personalInfo, phone: e.target.value }
              })}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Location:
            </label>
            <input
              type="text"
              placeholder="Enter your current location"
              value={profile.personalInfo.location}
              onChange={(e) => setProfile({
                ...profile,
                personalInfo: { ...profile.personalInfo, location: e.target.value }
              })}
              style={inputStyle}
            />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Professional Summary:
          </label>
          <textarea
            placeholder="Write a brief professional summary about yourself"
            value={profile.personalInfo.summary}
            onChange={(e) => setProfile({
              ...profile,
              personalInfo: { ...profile.personalInfo, summary: e.target.value }
            })}
            style={textareaStyle}
          />
        </div>
      </section>

      {/* Skills */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>🔧 Skills</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          {profile.skills.map((skill, index) => (
            <span
              key={index}
              style={skillTagStyle}
              onClick={() => removeSkill(index)}
              title="Click to remove"
            >
              {skill} ✕
            </span>
          ))}
        </div>
        
        <button
          onClick={addSkill}
          style={{
            ...buttonStyle,
            backgroundColor: '#28a745'
          }}
        >
          ➕ Add Skill
        </button>
      </section>

      {/* Experience */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>💼 Work Experience</h2>
        
        {profile.experience.map((exp, index) => (
          <div key={index} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Position"
                value={exp.position}
                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Duration (e.g., 2020-2023)"
                value={exp.duration}
                onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                style={inputStyle}
              />
            </div>
            <textarea
              placeholder="Describe your role and achievements"
              value={exp.description}
              onChange={(e) => updateExperience(index, 'description', e.target.value)}
              style={textareaStyle}
            />
            <button
              onClick={() => removeExperience(index)}
              style={{
                ...buttonStyle,
                backgroundColor: '#dc3545',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem'
              }}
            >
              🗑️ Remove
            </button>
          </div>
        ))}
        
        <button
          onClick={addExperience}
          style={{
            ...buttonStyle,
            backgroundColor: '#28a745'
          }}
        >
          ➕ Add Experience
        </button>
      </section>

      {/* Job Preferences */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>🎯 Job Preferences</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Preferred Job Types:
            </label>
            <input
              type="text"
              placeholder="e.g., Full-time, Part-time, Contract"
              value={profile.preferences.jobTypes.join(', ')}
              onChange={(e) => setProfile({
                ...profile,
                preferences: { 
                  ...profile.preferences, 
                  jobTypes: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }
              })}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Preferred Locations:
            </label>
            <input
              type="text"
              placeholder="e.g., Bangalore, Mumbai, Remote"
              value={profile.preferences.locations.join(', ')}
              onChange={(e) => setProfile({
                ...profile,
                preferences: { 
                  ...profile.preferences, 
                  locations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }
              })}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Expected Salary Range:
            </label>
            <input
              type="text"
              placeholder="e.g., 15-25 LPA"
              value={profile.preferences.salaryRange}
              onChange={(e) => setProfile({
                ...profile,
                preferences: { ...profile.preferences, salaryRange: e.target.value }
              })}
              style={inputStyle}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Availability:
            </label>
            <select
              value={profile.preferences.availability}
              onChange={(e) => setProfile({
                ...profile,
                preferences: { ...profile.preferences, availability: e.target.value }
              })}
              style={inputStyle}
            >
              <option value="">Select availability</option>
              <option value="immediate">Immediate</option>
              <option value="2weeks">2 Weeks Notice</option>
              <option value="1month">1 Month Notice</option>
              <option value="2months">2 Months Notice</option>
            </select>
          </div>
        </div>
      </section>

      {/* My Resumes */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>📄 My Resumes ({resumes.length})</h2>
        
        {resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
            <div>No resumes uploaded yet. Upload a resume to get started!</div>
          </div>
        ) : (
          <div>
            {resumes.map((resume, index) => (
              <div key={resume._id} style={cardStyle}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                  Resume #{index + 1}
                </h4>
                <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                  <div>📅 Uploaded: {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'Unknown'}</div>
                  <div>🔍 Status: {resume.analysisStatus || 'Pending'}</div>
                  {resume.filename && <div>📄 File: {resume.filename}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Matches */}
      <section style={sectionStyle}>
        <h2 style={titleStyle}>🎯 Recent Job Matches ({matches.length})</h2>
        
        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
            <div>No job matches yet. Upload a resume and get AI-powered job recommendations!</div>
          </div>
        ) : (
          <div>
            {matches.slice(0, 3).map((match, index) => (
              <div key={index} style={{ ...cardStyle, borderLeft: '4px solid #28a745' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
                  {match.job?.title || 'Job Title Not Available'}
                </h4>
                <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                  🏢 {match.job?.company || 'Company Not Available'}
                </div>
                <div style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                  📍 {match.job?.location || 'Location Not Available'}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: '#28a745'
                }}>
                  {Math.round((match.score || 0) * 100)}% Match
                </div>
              </div>
            ))}
            {matches.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <em style={{ color: '#6c757d' }}>
                  And {matches.length - 3} more matches available...
                </em>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Save Button */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={saveProfile}
          disabled={saving}
          style={{
            ...buttonStyle,
            backgroundColor: saving ? '#6c757d' : '#28a745',
            fontSize: '1.1rem',
            padding: '1rem 2rem'
          }}
        >
          {saving ? '💾 Saving...' : '💾 Save Profile'}
        </button>
        
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
      </div>
    </div>
  );
}
