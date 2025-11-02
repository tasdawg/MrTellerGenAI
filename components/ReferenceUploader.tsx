import React, { useState, useCallback } from 'react';
import { uploadReferenceImage } from '../utils/api';
import { Loader } from './Loader';

export const ReferenceUploader = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
    const [header, setHeader] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File size should not exceed 10MB.');
                return;
            }
            setError(null);
            setSuccess(null);
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file || !header.trim()) {
            setError('Please provide both a file and a header description.');
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await uploadReferenceImage(header, file, file.name);
            setSuccess(`Successfully uploaded "${response.new_filename}". Your collections will refresh shortly.`);
            setHeader('');
            setFile(null);
            setPreview(null);
            const uploadInput = document.getElementById('ref-upload-input') as HTMLInputElement;
            if(uploadInput) {
                uploadInput.value = '';
            }
            onUploadSuccess(); // This will trigger a refresh in App.tsx
        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };
    
    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const droppedFile = event.dataTransfer.files?.[0];
        if (droppedFile) {
            handleFileChange({ target: { files: [droppedFile] } } as any);
        }
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    const baseInputClasses = "w-full p-3 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";
    const primaryButtonClasses = "px-6 py-3 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover disabled:bg-theme-surface-2 disabled:text-theme-text-secondary disabled:cursor-not-allowed transition duration-300 rounded-md";

    return (
        <div className="h-full bg-theme-bg/50 p-6 rounded-lg flex items-center justify-center">
            <div className="w-full max-w-lg space-y-6">
                 <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Upload Reference Image</h1>
                    <p className="text-theme-text-secondary mt-2">Upload images to use as references or inspiration. They will appear in your "Reference Images" collection.</p>
                </div>
                
                {isUploading ? (
                    <Loader message="Uploading..." />
                ) : (
                    <div className="space-y-4">
                        <input type="file" id="ref-upload-input" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />

                        {!preview ? (
                            <div 
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                className="border-2 border-dashed border-theme-border rounded-lg p-8 text-center"
                            >
                                <label htmlFor="ref-upload-input" className="cursor-pointer">
                                    <svg className="mx-auto h-12 w-12 text-theme-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-18v.01M20 24v12m8-12v12m-4-12v12m-4-12v12m-4-12v12m16-24h-8a4 4 0 00-4 4v8h12v-8a4 4 0 00-4-4z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span className="mt-2 block text-sm font-medium text-theme-text">Click to upload or drag and drop</span>
                                    <span className="block text-xs text-theme-text-secondary">PNG, JPG, WEBP up to 10MB</span>
                                </label>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <img src={preview} alt="Image preview" className="max-h-64 mx-auto rounded-lg shadow-lg" />
                                <label htmlFor="ref-upload-input" className="cursor-pointer text-sm text-theme-accent hover:underline">
                                    Change image
                                </label>
                            </div>
                        )}

                        <div>
                             <label htmlFor="header-input" className="text-sm font-medium text-theme-text-secondary block mb-1">Header / Description</label>
                             <input 
                                id="header-input"
                                type="text"
                                value={header}
                                onChange={(e) => setHeader(e.target.value)}
                                placeholder="e.g., 'Inspiration for a cyberpunk character'"
                                className={baseInputClasses}
                             />
                        </div>
                        
                        <button
                            onClick={handleUpload}
                            disabled={!file || !header.trim()}
                            className={`${primaryButtonClasses} w-full`}
                        >
                            Upload Image
                        </button>
                    </div>
                )}
                
                {error && <p className="text-center text-red-400 font-semibold p-3 bg-red-900/50 rounded-md">{error}</p>}
                {success && <p className="text-center text-green-400 font-semibold p-3 bg-green-900/50 rounded-md">{success}</p>}
            </div>
        </div>
    );
};
