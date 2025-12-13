import React, { useState, useEffect } from 'react';
import { Play, Code, Folder, FileCode, Loader, AlertCircle, CheckCircle, LogOut, Lock, User } from 'lucide-react';

const API_URL = 'https://python-runner-api.onrender.com';

const getToken = () => localStorage.getItem('auth_token');
const setToken = (token) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');
const getUsername = () => localStorage.getItem('username');
const setUsername = (username) => localStorage.setItem('username', username);
const removeUsername = () => localStorage.removeItem('username');

export default function PythonProjectRunner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsernameState] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDays();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const checkAuthentication = async () => {
    const token = getToken();
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        removeToken();
        removeUsername();
      }
    } catch (err) {
      removeToken();
      removeUsername();
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      setToken(data.access_token);
      setUsername(data.username);
      setIsAuthenticated(true);
      setUsernameState('');
      setPassword('');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogout = () => {
    removeToken();
    removeUsername();
    setIsAuthenticated(false);
    setDays([]);
    setSelectedDay(null);
    setFiles([]);
    setSelectedFile(null);
    setCode('');
    setOutput('');
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
  };

  const fetchDays = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/days`);
      if (!res.ok) throw new Error('Failed to fetch days');
      const data = await res.json();
      setDays(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (dayNumber) => {
    setLoading(true);
    setError('');
    setSelectedFile(null);
    setCode('');
    setOutput('');
    setUserInput('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/days/${dayNumber}/files`);
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data);
      setSelectedDay(dayNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (dayNumber, filename) => {
    setLoading(true);
    setError('');
    setOutput('');
    setUserInput('');
    try {
      const res = await fetchWithAuth(`${API_URL}/api/file/${dayNumber}/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch file content');
      const data = await res.json();
      setCode(data.content);
      setSelectedFile(filename);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeCode = async () => {
    setExecuting(true);
    setOutput('');
    setError('');

    let modifiedCode = code;
    if (userInput.trim()) {
      const inputs = userInput.split('\n');
      let inputIndex = 0;
      modifiedCode = code.replace(/input\([^)]*\)/g, () => {
        const value = inputs[inputIndex] || '';
        inputIndex++;
        return `"${value}"`;
      });
    }

    try {
      const res = await fetchWithAuth(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: modifiedCode, timeout: 10 })
      });
      const data = await res.json();

      if (data.success) {
        setOutput(data.output || 'Code executed successfully (no output)');
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite', color: '#ffffff' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Lock size={64} style={{ color: '#1a1a1a', margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>
              Python Project Runner
            </h1>
            <p style={{ color: '#666666', marginTop: '0.5rem' }}>Sign in to continue</p>
          </div>

          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsernameState(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#2d3748' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1a1a1a'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {loginError && (
              <div style={{
                padding: '0.75rem',
                background: '#ffebee',
                color: '#c62828',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loggingIn}
              style={{
                width: '100%',
                padding: '1rem',
                background: loggingIn ? '#cccccc' : '#1a1a1a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loggingIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => !loggingIn && (e.target.style.background = '#333333')}
              onMouseOut={(e) => !loggingIn && (e.target.style.background = '#1a1a1a')}
            >
              {loggingIn ? (
                <>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#edf2f7',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#4a5568'
          }}>
            <strong>Default credentials:</strong><br />
            Username: admin<br />
            Password: admin123<br />
            <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>⚠️ Change after first login!</span>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', color: 'white', position: 'relative' }}>
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <LogOut size={16} />
            Logout
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Code size={48} />
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', margin: 0 }}>
              Python Project Runner
            </h1>
          </div>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Welcome, <strong>{getUsername()}</strong>! 👋
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Folder size={20} style={{ color: '#1a1a1a' }} />
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>Days</h2>
              </div>
              
              {loading && !selectedDay ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#1a1a1a' }} />
                </div>
              ) : error && !days.length ? (
                <div style={{ color: '#c62828', fontSize: '0.9rem' }}>{error}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {days.map((day) => (
                    <button
                      key={day.day_number}
                      onClick={() => fetchFiles(day.day_number)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedDay === day.day_number ? '#1a1a1a' : '#f5f5f5',
                        color: selectedDay === day.day_number ? 'white' : '#1a1a1a',
                        fontWeight: selectedDay === day.day_number ? 'bold' : 'normal'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Day {day.day_number}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{day.folder_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {selectedDay && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <FileCode size={20} style={{ color: '#1a1a1a' }} />
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Python Files - Day {selectedDay}
                  </h2>
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#1a1a1a' }} />
                  </div>
                ) : files.length === 0 ? (
                  <p style={{ color: '#666666' }}>No Python files found in this day</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {files.map((file) => (
                      <button
                        key={file.filename}
                        onClick={() => fetchFileContent(selectedDay, file.filename)}
                        style={{
                          padding: '1rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          background: selectedFile === file.filename ? '#1a1a1a' : '#f5f5f5',
                          color: selectedFile === file.filename ? 'white' : '#1a1a1a'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileCode size={16} />
                          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{file.filename}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedFile && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedFile}</h3>
                  <button
                    onClick={executeCode}
                    disabled={executing || !code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: executing || !code ? '#cccccc' : '#1a1a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: executing || !code ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => !executing && !(!code) && (e.target.style.background = '#333333')}
                    onMouseOut={(e) => !executing && !(!code) && (e.target.style.background = '#1a1a1a')}
                  >
                    {executing ? (
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Play size={16} />
                    )}
                    {executing ? 'Running...' : 'Run Code'}
                  </button>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '300px',
                    padding: '1rem',
                    background: '#1a202c',
                    color: '#48bb78',
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    borderRadius: '8px',
                    border: '2px solid #4a5568',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  spellCheck="false"
                />

                {code.includes('input(') && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      Program Inputs (one per line):
                    </label>
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Enter input values (one per line)&#10;Example:&#10;5&#10;10"
                      style={{
                        width: '100%',
                        height: '100px',
                        padding: '0.75rem',
                        background: '#f7fafc',
                        color: '#2d3748',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        borderRadius: '8px',
                        border: '2px solid #e2e8f0',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                    />
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#718096', 
                      marginTop: '0.5rem',
                      fontStyle: 'italic'
                    }}>
                      💡 Tip: If your code has multiple input() calls, enter each value on a new line
                    </p>
                  </div>
                )}

                {(output || error) && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {error ? (
                        <>
                          <AlertCircle size={16} style={{ color: '#e53e3e' }} />
                          <span style={{ color: '#e53e3e' }}>Error</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} style={{ color: '#48bb78' }} />
                          <span>Output</span>
                        </>
                      )}
                    </h4>
                    <pre style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: error ? '#fed7d7' : '#1a202c',
                      color: error ? '#c53030' : '#48bb78',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      margin: 0
                    }}>
                      {error || output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
