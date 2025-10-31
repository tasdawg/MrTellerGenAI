import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../utils/api';

export const SettingsModal = ({ isOpen, onClose, onSave, initialApiKey, initialApiConfig }) => {
    const [apiKey, setApiKey] = useState(initialApiKey || '');
    const [apiConfig, setApiConfig] = useState(initialApiConfig);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState({ message: '', type: '' }); // 'success', 'error', or 'info'

    useEffect(() => {
        setApiKey(initialApiKey || '');
        setApiConfig(initialApiConfig);
        setTestStatus({ message: '', type: '' });
    }, [initialApiKey, initialApiConfig, isOpen]);

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
        } catch (e) {
            setTestStatus({ message: `Connection failed: ${e.message}`, type: 'error' });
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
            <div>
                <label className="text-sm font-medium text-theme-text-secondary block mb-1">Gemini API Key</label>
                <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className={baseInputClasses} 
                    placeholder="Enter your API key"
                />
            </div>
            <p className="text-xs text-theme-text-secondary">
                You can get your API key from {' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-theme-accent underline hover:text-white">
                    Google AI Studio
                </a>. Your key is stored securely in your browser's local storage.
            </p>
        </div>
    );
    
    const renderApiBackendTab = () => (
        <div className="space-y-4 pt-6">
             <div>
                <label className="text-sm font-medium text-theme-text-secondary block mb-1">API Base URL</label>
                <input 
                    type="text" 
                    name="baseUrl"
                    value={apiConfig.baseUrl} 
                    onChange={handleApiConfigChange} 
                    className={baseInputClasses} 
                    placeholder="e.g., https://fastapi.mrteller.win"
                />
            </div>
            <div>
                <label className="text-sm font-medium text-theme-text-secondary block mb-1">API Secret Key (X-API-Key)</label>
                <input 
                    type="password"
                    name="apiKey" 
                    value={apiConfig.apiKey} 
                    onChange={handleApiConfigChange} 
                    className={baseInputClasses} 
                    placeholder="Enter your secret API key"
                />
            </div>
            {testStatus.message && (
                <div className={`p-3 text-sm font-semibold rounded-md ${testStatus.type === 'success' ? 'bg-green-800 text-green-200' : testStatus.type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`}>
                    {testStatus.message}
                </div>
            )}
            <button onClick={handleTest} disabled={isTesting || !apiConfig.baseUrl} className="px-6 py-2 bg-theme-surface-2 font-bold hover:bg-theme-border transition disabled:opacity-50 flex items-center justify-center gap-2 rounded-md">
                {isTesting && <div className="spinner !w-4 !h-4 !border-white !border-t-transparent"></div>}
                {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
        </div>
    );

    const [activeTab, setActiveTab] = useState('gemini');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-theme-surface text-white p-8 shadow-2xl w-full max-w-2xl rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <div className="border-b border-theme-border">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('gemini')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'gemini' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-accent'}`}>
                            Gemini API
                        </button>
                        <button onClick={() => setActiveTab('backend')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'backend' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-accent'}`}>
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
