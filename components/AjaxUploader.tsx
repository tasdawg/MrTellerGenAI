import React, { useState, useRef, useEffect } from 'react';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'data';
}

interface Header {
    id: string;
    key: string;
    value: string;
}

export const AjaxUploader = () => {
    const [apiUrl, setApiUrl] = useState('https://httpbin.org/post');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [headers, setHeaders] = useState<Header[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prevLogs => [...prevLogs, { timestamp, message, type }]);
    };
    
    useEffect(() => {
        addLog("AJAX Uploader initialized. Use a service like https://httpbin.org/post to test.", 'info');
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            addLog(`Image selected: ${file.name} (Size: ${(file.size / 1024).toFixed(2)} KB, Type: ${file.type})`);
        }
    };

    const handleSendRequest = async () => {
        if (!apiUrl) {
            addLog("API URL is required.", 'error');
            return;
        }
        if (!selectedFile) {
            addLog("No file selected.", 'error');
            return;
        }

        setIsSending(true);
        addLog(`Preparing to send POST request to: ${apiUrl}`);
        
        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);
        addLog(`FormData created with key 'file' and filename '${selectedFile.name}'`);

        const requestHeaders = new Headers();
        const activeHeaders: Record<string, string> = {};
        headers.forEach(header => {
            if (header.key && header.value) {
                requestHeaders.append(header.key, header.value);
                activeHeaders[header.key] = header.value;
            }
        });
        
        if (Object.keys(activeHeaders).length > 0) {
            addLog(`Sending with custom headers: ${JSON.stringify(activeHeaders)}`);
        } else {
            addLog(`Sending with no custom headers.`);
        }

        try {
            addLog("Sending request...");
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData,
                headers: requestHeaders,
            });

            addLog(`Request sent. Awaiting response...`);

            const responseText = await response.text();
            
            if (response.ok) {
                addLog(`Request successful! Status: ${response.status} ${response.statusText}`, 'success');
                addLog('--- RESPONSE ---', 'data');
                try {
                    const jsonResponse = JSON.parse(responseText);
                    addLog(JSON.stringify(jsonResponse, null, 2), 'data');
                } catch (e) {
                    addLog(responseText, 'data');
                }
                 addLog('--- END RESPONSE ---', 'data');
            } else {
                addLog(`Request failed. Status: ${response.status} ${response.statusText}`, 'error');
                 addLog('--- ERROR RESPONSE ---', 'error');
                addLog(responseText, 'error');
                addLog('--- END ERROR RESPONSE ---', 'error');
            }

        } catch (error: any) {
            addLog(`A network or CORS error occurred. Check browser console for more details.`, 'error');
            addLog(`Error Message: ${error.message}`, 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    const getLogColor = (type: LogEntry['type']) => {
        switch(type) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'data': return 'text-cyan-400';
            case 'info':
            default: return 'text-theme-text-secondary';
        }
    };

    const handleAddHeader = () => {
        setHeaders([...headers, { id: crypto.randomUUID(), key: '', value: '' }]);
    };

    const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
        setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const handleRemoveHeader = (id: string) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    return (
        <div className="flex flex-col md:flex-row h-full bg-theme-bg/50 p-6 font-mono text-sm gap-6 rounded-lg">
            {/* Left Panel: Headers */}
            <aside className="w-full md:w-1/3 flex flex-col gap-4 bg-theme-surface p-4 border border-theme-border rounded-lg">
                <h2 className="text-lg font-bold text-white flex-shrink-0">Custom Headers</h2>
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    {headers.map((header) => (
                        <div key={header.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Header Key"
                                    value={header.key}
                                    onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
                                    className="w-full p-2 bg-theme-bg/50 border border-theme-border text-white rounded-md"
                                />
                                <button onClick={() => handleRemoveHeader(header.id)} className="p-2 bg-red-800/50 hover:bg-red-800 text-white transition rounded-md flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Header Value"
                                value={header.value}
                                onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value)}
                                className="w-full p-2 bg-theme-bg/50 border border-theme-border text-white rounded-md"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={handleAddHeader} className="w-full mt-2 flex-shrink-0 bg-theme-surface-2 hover:bg-theme-border text-white font-bold py-2 px-4 transition duration-300 rounded-md">
                    + Add Header
                </button>
            </aside>
            
            {/* Right Panel: Main Content */}
            <main className="w-full md:w-2/3 flex flex-col">
                 <h1 className="text-xl font-bold text-white mb-4 flex-shrink-0">AJAX POST Uploader</h1>
                {/* --- CORS Helper Box --- */}
                <div className="flex-shrink-0 bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-4 text-xs">
                    <h3 className="font-bold text-yellow-100 mb-2">💡 Working with CORS (Cross-Origin Resource Sharing)</h3>
                    <p className="mb-2">If your request fails with a "network error" or "failed to fetch", it's likely a CORS issue. This is a security feature your server must handle. Your server needs to send an <code className="bg-black/20 px-1 rounded-sm">Access-Control-Allow-Origin</code> header to allow this app to connect.</p>
                    <p className="mb-2">Example for a Python FastAPI server:</p>
                    <pre className="bg-black/30 p-2 rounded-md font-mono text-cyan-300 overflow-x-auto text-[10px]">
                        <code>
{`# On your FastAPI server:
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# IMPORTANT: Add this middleware to your app
origins = ["*"] # Allows all origins for development

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# ... your API routes (@app.post("/"), etc.)`}
                        </code>
                    </pre>
                </div>
                {/* Output Window */}
                <div ref={logContainerRef} className="flex-grow bg-theme-surface p-4 overflow-y-auto mb-4 border border-theme-border rounded-lg">
                    {logs.map((log, index) => (
                        <div key={index} className="flex">
                            <span className="text-theme-text-secondary/50 mr-4 flex-shrink-0">{log.timestamp}</span>
                            <pre className={`whitespace-pre-wrap break-all ${getLogColor(log.type)}`}>{log.message}</pre>
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex items-center">
                            <span className="text-theme-text-secondary/50 mr-4 flex-shrink-0">{new Date().toLocaleTimeString()}</span>
                            <span className="text-yellow-400 flex items-center gap-2">
                                <div className="spinner !w-4 !h-4 !border-yellow-400 !border-t-transparent"></div>
                                Processing...
                            </span>
                        </div>
                    )}
                </div>
                {/* Input Window */}
                <div className="flex-shrink-0 space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <label htmlFor="api-url" className="text-white font-bold flex-shrink-0">API URL:</label>
                        <input
                            id="api-url"
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="w-full p-2 bg-theme-surface border border-theme-border text-white flex-grow rounded-md"
                            placeholder="Enter the target API endpoint"
                        />
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                        <label htmlFor="image-upload" className="w-full md:w-auto text-center cursor-pointer bg-theme-surface-2 hover:bg-theme-border text-white font-bold py-2 px-4 transition duration-300 rounded-md">
                            {selectedFile ? 'Change File' : 'Select Image File'}
                        </label>
                        {selectedFile && <span className="text-theme-text-secondary truncate">{selectedFile.name}</span>}
                        <div className="flex-grow"></div>
                        <button
                            onClick={handleSendRequest}
                            disabled={isSending || !selectedFile}
                            className="w-full md:w-auto px-6 py-2 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover disabled:bg-theme-surface-2 disabled:text-theme-text-secondary disabled:cursor-not-allowed transition duration-300 rounded-md"
                        >
                            Send POST Request
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};