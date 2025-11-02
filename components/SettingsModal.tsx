import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../utils/api';

export const SettingsModal = ({ isOpen, onClose, onSave, initialApiKey, initialApiConfig }) => {
    // Hooks are now at the top level to follow the Rules of Hooks
    const [activeTab, setActiveTab] = useState('gemini');
    const [apiKey, setApiKey] = useState(initialApiKey || '');
    const [apiConfig, setApiConfig] = useState(initialApiConfig);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState({ message: '', type: '' });

    // This effect now resets the entire modal's state when it opens
    useEffect(() => {
        if (isOpen) {
            setApiKey(initialApiKey || '');
            setApiConfig(initialApiConfig);
            setTestStatus({ message: '', type: '' });
            setActiveTab('gemini');
            setIsTesting(false);
        }
    }, [isOpen, initialApiKey, initialApiConfig]);

    if (!isOpen) return null;

    const handleApiConfigChange = (e) => {
        setApiConfig({ ...apiConfig, [e.target.name]: e.target.value });
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus({ message: 'Testing...', type: 'info' });
        try {
            await testApiConnection(apiConfig.baseUrl);
            setTestStatus({ message: 'Connection successful! API is running.', type: 'success' });
        } catch (e: any) {
            const errorMessage = e.message || 'An unknown error occurred.';
            let friendlyMessage = `Connection failed: ${errorMessage}`;
            if (errorMessage.toLowerCase().includes('failed to fetch')) {
                friendlyMessage += '\nThis is often a CORS issue. Ensure your server allows requests from this origin.';
            }
            setTestStatus({ message: friendlyMessage, type: 'error' });
        } finally {
            setIsTesting(false);
        }
    };
    
    const handleSave = () => {
        onSave({ apiKey, apiConfig });
    };

    const baseInputClasses = "w-full p-2 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";
    
    const renderApiKeyTab = () => (
        <div className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold text-theme-text">Gemini AI Configuration</h3>
            <div>
                <label className="text-sm font-medium text-theme-text-secondary block mb-1" htmlFor="gemini-api-key">Gemini API Key</label>
                <input 
                    id="gemini-api-key"
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className={baseInputClasses} 
                    placeholder="Enter your API key"
                />
            </div>
            <p className="text-xs text-theme-text-secondary">
                This key is required for all AI features. You can get your key from{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-theme-accent underline hover:text-white">
                    Google AI Studio
                </a>. Your key is stored securely in your browser's local storage.
            </p>
        </div>
    );
    
    const renderApiBackendTab = () => (
        <div className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold text-theme-text">Backend API Configuration</h3>
             <div>
                <label className="text-sm font-medium text-theme-text-secondary block mb-1" htmlFor="api-base-url">API Base URL</label>
                <input 
                    id="api-base-url"
                    type="text" 
                    name="baseUrl"
                    value={apiConfig.baseUrl} 
                    onChange={handleApiConfigChange} 
                    className={baseInputClasses} 
                    placeholder="e.g., https://your-api.com"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-theme-text-secondary block mb-1" htmlFor="api-secret-key">API Secret Key (X-API-Key)</label>
                <input 
                    id="api-secret-key"
                    type="password"
                    name="apiKey" 
                    value={apiConfig.apiKey} 
                    onChange={handleApiConfigChange} 
                    className={baseInputClasses} 
                    placeholder="Enter your secret API key"
                />
            </div>
            <p className="text-xs text-theme-text-secondary">
                Configure the connection to your custom backend for storing generated images and prompts.
            </p>
            {testStatus.message && (
                <div className={`p-3 text-sm font-semibold rounded-md whitespace-pre-wrap ${testStatus.type === 'success' ? 'bg-green-800 text-green-200' : testStatus.type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`}>
                    {testStatus.message}
                </div>
            )}
            <button onClick={handleTest} disabled={isTesting || !apiConfig.baseUrl} className="px-6 py-2 bg-theme-surface-2 font-bold hover:bg-theme-border transition disabled:opacity-50 flex items-center justify-center gap-2 rounded-md">
                {isTesting && <div className="spinner !w-4 !h-4 !border-white !border-t-transparent"></div>}
                {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-theme-surface text-white p-8 shadow-2xl w-full max-w-2xl rounded-lg relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-theme-text-secondary hover:text-white transition rounded-full"
                    aria-label="Close settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <div className="border-b border-theme-border">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('gemini')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${activeTab === 'gemini' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-accent'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v2.586l1.707-1.707a1 1 0 111.414 1.414L12.414 8H15a1 1 0 110 2h-2.586l1.707 1.707a1 1 0 11-1.414 1.414L11 11.586V16a1 1 0 11-2 0v-4.414l-1.707 1.707a1 1 0 11-1.414-1.414L7.586 10H5a1 1 0 110-2h2.586L5.793 6.293a1 1 0 011.414-1.414L9 6.586V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            Gemini AI
                        </button>
                        <button onClick={() => setActiveTab('backend')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${activeTab === 'backend' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-accent'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 10-2 0v1a1 1 0 102 0V6zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" /></svg>
                            Backend API
                        </button>
                    </nav>
                </div>

                {activeTab === 'gemini' ? renderApiKeyTab() : renderApiBackendTab()}
                
                <div className="mt-8 flex justify-end items-center gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-theme-surface-2 font-bold hover:bg-theme-border transition rounded-md">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover transition rounded-md">Save & Close</button>
                </div>
            </div>
        </div>
    );
};