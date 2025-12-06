import React, { useState, useEffect } from 'react';
import { Play, Code, Folder, FileCode, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = 'https://python-runner-api.onrender.com';

export default function PythonProjectRunner() {
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
    fetchDays();
  }, []);

  const fetchDays = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/days`);
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
    try {
      const res = await fetch(`${API_URL}/api/days/${dayNumber}/files`);
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
    try {
      const res = await fetch(`${API_URL}/api/file/${dayNumber}/${filename}`);
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
    
    // Replace input() calls with predefined values if user provided input
    let modifiedCode = code;
    if (userInput.trim()) {
      const inputs = userInput.split('\n');
      let inputIndex = 0;
      
      // Replace input() with actual values
      modifiedCode = code.replace(/input\([^)]*\)/g, () => {
        const value = inputs[inputIndex] || '';
        inputIndex++;
        return `"${value}"`;
      });
    }
    
    try {
      const res = await fetch(`${API_URL}/api/execute`, {
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Code size={48} />
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', margin: 0 }}>
              Python Project Runner
            </h1>
          </div>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>View and execute your daily Python projects</p>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          {/* Days Sidebar */}
          <div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Folder size={20} style={{ color: '#667eea' }} />
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>Days</h2>
              </div>
              
              {loading && !selectedDay ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
                </div>
              ) : error && !days.length ? (
                <div style={{ color: '#e53e3e', fontSize: '0.9rem' }}>{error}</div>
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
                        background: selectedDay === day.day_number ? '#667eea' : '#f7fafc',
                        color: selectedDay === day.day_number ? 'white' : '#2d3748',
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

          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Files List */}
            {selectedDay && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <FileCode size={20} style={{ color: '#667eea' }} />
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Python Files - Day {selectedDay}
                  </h2>
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
                  </div>
                ) : files.length === 0 ? (
                  <p style={{ color: '#718096' }}>No Python files found in this day</p>
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
                          background: selectedFile === file.filename ? '#667eea' : '#f7fafc',
                          color: selectedFile === file.filename ? 'white' : '#2d3748'
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

            {/* Code Editor */}
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
                      background: executing || !code ? '#cbd5e0' : '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: executing || !code ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
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

                {/* Input Section */}
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

                {/* Output */}
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

        {/* Setup Notice */}
        {days.length === 0 && !loading && (
          <div style={{
            marginTop: '2rem',
            background: 'rgba(237, 137, 54, 0.2)',
            border: '2px solid rgba(237, 137, 54, 0.5)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center',
            color: 'white'
          }}>
            <AlertCircle size={32} style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Setup Required</h3>
            <p>Please configure your GitHub repository details in the backend (main.py)</p>
          </div>
        )}
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
