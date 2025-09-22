
import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('candidate');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/users/register' : '/users/login';
      const body = isRegister 
        ? { username, email, password, role }
        : { email, password };

      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (res.ok) {
        if (isRegister) {
          // Registration successful - show success and switch to login
          setError('');
          setIsRegister(false);
          setPassword(''); // Clear password for security
          alert('Registration successful! Please login with your credentials.');
        } else if (data.token) {
          // Login successful - proceed to app
          onLogin(data.token, data.user?.role || role);
        } else {
          setError('Login failed - no token received');
        }
      } else {
        setError(data.message || data.error || `${isRegister ? 'Registration' : 'Login'} failed`);
      }
    } catch (err) {
      setError('Network error. Please check if services are running.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userType) => {
    setLoading(true);
    try {
      const credentials = userType === 'recruiter' 
        ? { email: 'recruiter@company.com', password: 'password123' }
        : { email: 'candidate@example.com', password: 'password123' };

      const res = await fetch('http://localhost:4000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token, userType);
      } else {
        setError('Quick login failed. You may need to register first.');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 500, 
      margin: '2rem auto', 
      padding: '2rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fafafa'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        ATS System - {isRegister ? 'Register' : 'Login'}
      </h2>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username:</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email:</label>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password:</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        {isRegister && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role:</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
        </button>

        {error && (
          <div style={{ 
            color: 'red', 
            marginTop: '1rem', 
            padding: '0.5rem',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
      </form>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '1.5rem',
        borderTop: '1px solid #ddd',
        paddingTop: '1.5rem'
      }}>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>

      <div style={{ 
        marginTop: '1.5rem',
        borderTop: '1px solid #ddd',
        paddingTop: '1.5rem'
      }}>
        <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Quick Demo Login:</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => quickLogin('candidate')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Demo Candidate
          </button>
          <button
            onClick={() => quickLogin('recruiter')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Demo Recruiter
          </button>
        </div>
      </div>
    </div>
  );
}
