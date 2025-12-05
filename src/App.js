import React, { useState, useEffect } from 'react';
import { Play, Code, Folder, FileCode, Loader, AlertCircle } from 'lucide-react';

const API_URL = 'https://python-runner-api.onrender.com'; // Your Render backend

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

  // Fetch all days on mount
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
    try {
      const res = await fetch(`${API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, timeout: 10 })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Python Project Runner
            </h1>
          </div>
          <p className="text-gray-300 text-lg">View and execute your daily Python projects</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Days Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <Folder className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">Days</h2>
              </div>
              
              {loading && !selectedDay ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-purple-400" />
                </div>
              ) : error && !days.length ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {days.map((day) => (
                    <button
                      key={day.day_number}
                      onClick={() => fetchFiles(day.day_number)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedDay === day.day_number
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-semibold">Day {day.day_number}</div>
                      <div className="text-xs text-gray-300">{day.folder_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Files List */}
            {selectedDay && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-4">
                  <FileCode className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold">Python Files - Day {selectedDay}</h2>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-gray-400">No Python files found in this day</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {files.map((file) => (
                      <button
                        key={file.filename}
                        onClick={() => fetchFileContent(selectedDay, file.filename)}
                        className={`px-4 py-3 rounded-lg text-left transition-all ${
                          selectedFile === file.filename
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4" />
                          <span className="font-mono text-sm">{file.filename}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Code Editor */}
            {selectedFile && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{selectedFile}</h3>
                  <button
                    onClick={executeCode}
                    disabled={executing || !code}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg"
                  >
                    {executing ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {executing ? 'Running...' : 'Run Code'}
                  </button>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-64 p-4 bg-slate-900 text-green-400 font-mono text-sm rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  spellCheck="false"
                />

                {/* Output */}
                {(output || error) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                      {error ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          Error
                        </>
                      ) : (
                        'Output'
                      )}
                    </h4>
                    <pre className={`p-4 rounded-lg ${
                      error ? 'bg-red-900/30 text-red-200' : 'bg-slate-900 text-green-400'
                    } font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto`}>
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
          <div className="mt-8 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Setup Required</h3>
            <p className="text-gray-300">
              Please configure your GitHub repository details in the backend (main.py)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
