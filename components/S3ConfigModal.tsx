import React, { useState, useEffect } from 'react';
import { testS3Connection } from '../utils/s3';
import { Loader } from './Loader';

export const S3ConfigModal = ({ isOpen, onClose, onSave, initialConfig }) => {
    const [config, setConfig] = useState(initialConfig);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState({ message: '', type: '' }); // 'success' or 'error'

    useEffect(() => {
        setConfig(initialConfig);
        setTestStatus({ message: '', type: '' });
    }, [initialConfig, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus({ message: 'Testing...', type: 'info' });
        try {
            await testS3Connection(config);
            setTestStatus({ message: 'Connection successful!', type: 'success' });
        } catch (e) {
            setTestStatus({ message: `Connection failed: ${e.message}`, type: 'error' });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        onSave(config);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 text-white p-8 shadow-2xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">S3 Storage Configuration</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Endpoint URL</label>
                        <input type="text" name="endpoint" value={config.endpoint} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600" placeholder="e.g., http://127.0.0.1:9000"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Bucket Name</label>
                        <input type="text" name="bucketName" value={config.bucketName} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Access Key ID</label>
                        <input type="text" name="accessKeyId" value={config.accessKeyId} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400 block mb-1">Secret Access Key</label>
                        <input type="password" name="secretAccessKey" value={config.secretAccessKey} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"/>
                    </div>
                    {testStatus.message && (
                        <div className={`p-3 text-sm font-semibold ${testStatus.type === 'success' ? 'bg-green-800 text-green-200' : testStatus.type === 'error' ? 'bg-red-800 text-red-200' : 'bg-blue-800 text-blue-200'}`}>
                            {testStatus.message}
                        </div>
                    )}
                </div>
                <div className="mt-8 flex flex-wrap justify-between items-center gap-4">
                    <button onClick={handleTest} disabled={isTesting} className="px-6 py-2 bg-gray-700 font-bold hover:bg-gray-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {isTesting && <div className="spinner !w-4 !h-4 !border-white !border-t-transparent"></div>}
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-800 font-bold hover:bg-gray-700 transition">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 transition">Save & Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
