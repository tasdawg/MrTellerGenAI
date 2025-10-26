import React, { useState, useEffect } from 'react';
import { testS3Connection } from '../utils/s3';

export const SettingsModal = ({ isOpen, onClose, onSave, initialApiKey, initialS3Config }) => {
    const [activeTab, setActiveTab] = useState('api');
    const [apiKey, setApiKey] = useState(initialApiKey || '');
    const [s3Config, setS3Config] = useState(initialS3Config);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState({ message: '', type: '' }); // 'success', 'error', or 'info'

    useEffect(() => {
        setApiKey(initialApiKey || '');
        setS3Config(initialS3Config);
        setTestStatus({ message: '', type: '' });
    }, [initialApiKey, initialS3Config, isOpen]);

    if (!isOpen) return null;

    const handleS3Change = (e) => {
        setS3Config({ ...s3Config, [e.target.name]: e.target.value });
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus({ message: 'Testing...', type: 'info' });
        try {
            await testS3Connection(s3Config);
            setTestStatus({ message: 'Connection successful!', type: 'success' });
        } catch (e) {
            setTestStatus({ message: `Connection failed: ${e.message}`, type: 'error' });
        } finally {
            setIsTesting(false);
        }
    };
    
    const handleSave = () => {
        onSave({ apiKey, s3Config });
    };

    const renderApiKeyTab = () => (
        <div className="space-y-4 pt-6">
            <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Gemini API Key</label>
                <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    className="w-full p-2 bg-gray-800 border border-gray-600" 
                    placeholder="Enter your API key"
                />
            </div>
            <p className="text-xs text-gray-500">
                You can get your API key from {' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-gray-400 underline hover:text-white">
                    Google AI Studio
                </a>. Your key is stored securely in your browser's local storage and is never sent anywhere else.
            </p>
        </div>
    );
    
    const renderS3Tab = () => (
        <div className="space-y-4 pt-6">
            <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Endpoint URL</label>
                <input type="text" name="endpoint" value={s3Config.endpoint} onChange={handleS3Change} className="w-full p-2 bg-gray-800 border border-gray-600" placeholder="e.g., http://127.0.0.1:9000"/>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Bucket Name</label>
                <input type="text" name="bucketName" value={s3Config.bucketName} onChange={handleS3Change} className="w-full p-2 bg-gray-800 border border-gray-600"/>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Access Key ID</label>
                <input type="text" name="accessKeyId" value={s3Config.accessKeyId} onChange={handleS3Change} className="w-full p-2 bg-gray-800 border border-gray-600"/>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Secret Access Key</label>
                <input type="password" name="secretAccessKey" value={s3Config.secretAccessKey} onChange={handleS3Change} className="w-full p-2 bg-gray-800 border border-gray-600"/>
            </div>
            {testStatus.message && (
                <div className={`p-3 text-sm font-semibold ${testStatus.type === 'success' ? 'bg-green-800 text-green-200' : testStatus.type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`}>
                    {testStatus.message}
                </div>
            )}
            <button onClick={handleTest} disabled={isTesting} className="px-6 py-2 bg-gray-700 font-bold hover:bg-gray-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {isTesting && <div className="spinner !w-4 !h-4 !border-white !border-t-transparent"></div>}
                {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 text-white p-8 shadow-2xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('api')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'api' ? 'border-gray-300 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'}`}>
                            Gemini API Key
                        </button>
                        <button onClick={() => setActiveTab('s3')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTab === 's3' ? 'border-gray-300 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'}`}>
                            S3 Storage
                        </button>
                    </nav>
                </div>

                {activeTab === 'api' ? renderApiKeyTab() : renderS3Tab()}
                
                <div className="mt-8 flex justify-end items-center gap-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-800 font-bold hover:bg-gray-700 transition">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 transition">Save & Close</button>
                </div>
            </div>
        </div>
    );
};
