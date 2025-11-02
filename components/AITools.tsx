import React, { useState } from 'react';
import { Collection, DecodedPrompt } from '../utils/db';
import { Loader } from './Loader';
import { renderFormControl } from '../utils/ui';

export const AITools = ({ state, handlers, collection }: { state: any, handlers: any, collection: Collection }) => {
    const { isDecoding, decodedPromptJson, reverseEngineerImage, isReverseEngineering, reverseEngineeredPrompt } = state;
    const { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt, setReverseEngineerImage, setReverseEngineerImageMimeType, handleReverseEngineerPrompt, handleApplyReverseEngineeredPrompt, handleSaveReverseEngineeredPrompt } = handlers;

    const [activeTool, setActiveTool] = useState('decoder'); // 'decoder' or 'reverse_engineer'
    const [promptToDecode, setPromptToDecode] = useState('');
    const [showSaveView, setShowSaveView] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [isPasting, setIsPasting] = useState(false);


    const onDecodeClick = () => {
        if (promptToDecode.trim()) {
            handleDecodePrompt(promptToDecode);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReverseEngineerImage(reader.result as string);
                setReverseEngineerImageMimeType(file.type);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Allow re-uploading the same file
    };
    
    const handlePasteImage = async () => {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            alert('Clipboard API not supported in this browser.');
            return;
        }
        setIsPasting(true);
        try {
            const clipboardItems = await navigator.clipboard.read();
            let imageFound = false;
            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    imageFound = true;
                    const blob = await item.getType(imageType);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setReverseEngineerImage(reader.result as string);
                        setReverseEngineerImageMimeType(blob.type);
                    };
                    reader.onerror = () => {
                         alert('Error reading the pasted image file.');
                    }
                    reader.readAsDataURL(blob);
                    break; // Exit loop once image is found
                }
            }
            if (!imageFound) {
                alert('No image found on the clipboard. Please copy an image first (e.g., using Shift+Win+S).');
            }
        } catch (err: any) {
            console.error('Failed to paste from clipboard:', err);
            let errorMessage = 'Could not paste image. ';
            if (err.name === 'NotAllowedError') {
                errorMessage += 'Permission to access the clipboard was denied. Please check your browser settings and allow this page to read from the clipboard.';
            } else {
                errorMessage += 'An error occurred. Your browser might require you to grant permission, or the clipboard content may not be a supported image.';
            }
            alert(errorMessage);
        } finally {
            setIsPasting(false);
        }
    };

    const handleRemoveImage = () => {
        setReverseEngineerImage(null);
        setReverseEngineerImageMimeType('');
    };

    const handleConfirmSaveReversePrompt = () => {
        if (saveName.trim() && reverseEngineeredPrompt) {
            handleSaveReverseEngineeredPrompt({
                name: saveName.trim(),
                prompt: reverseEngineeredPrompt
            });
            setShowSaveView(false);
            setSaveName('');
        }
    };
    
    const baseInputClasses = "w-full p-2 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";
    const primaryButtonClasses = "px-6 py-2 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover disabled:bg-theme-surface-2 disabled:text-theme-text-secondary disabled:cursor-not-allowed transition duration-300 rounded-md";
    const secondaryButtonClasses = "px-6 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 disabled:opacity-50 rounded-md";


    const renderDecoder = () => (
        <div className="flex flex-col gap-4">
            {/* --- Top Panel: Decoder Input --- */}
            <section className="w-full bg-theme-surface p-6 shadow-lg flex flex-col gap-6 rounded-lg">
                <h2 className="text-xl font-bold text-white">Prompt Decoder</h2>
                <p className="text-sm text-theme-text-secondary">
                    Paste a complex prompt below. The AI will analyze it and break it down into the categories used by the Photorealistic Studio.
                </p>

                {renderFormControl("Prompt to Analyze",
                    <textarea
                        value={promptToDecode}
                        onChange={(e) => setPromptToDecode(e.target.value)}
                        placeholder="e.g., A photorealistic image of a woman in a red, flowing Hanfu dress..."
                        className={`${baseInputClasses} h-24`}
                    />
                )}
                
                <button
                    onClick={onDecodeClick}
                    disabled={isDecoding || !promptToDecode.trim()}
                    className={`${primaryButtonClasses} w-full flex items-center justify-center gap-2`}
                >
                    {isDecoding ? <div className="spinner !w-5 !h-5 !border-white"></div> : '🧩'}
                    Decode Prompt
                </button>
            </section>

            {/* --- Bottom Panel: Decoder Output --- */}
            <section className="w-full bg-theme-surface p-6 flex flex-col gap-6 rounded-lg">
                <h2 className="text-xl font-bold">Decoded Output</h2>
                <div className="bg-theme-bg/50 p-4 flex items-center justify-center min-h-[200px] relative rounded-lg">
                    {isDecoding && <Loader message="Analyzing prompt..." />}
                    {!isDecoding && !decodedPromptJson && (
                        <div className="text-center text-theme-text-secondary">
                            The structured output will appear here.
                        </div>
                    )}
                    {!isDecoding && decodedPromptJson && (
                        <div className="w-full h-full max-h-64 overflow-y-auto">
                            <pre className="text-xs text-theme-text whitespace-pre-wrap break-all">
                                {JSON.stringify(decodedPromptJson, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                <div className="relative flex items-center gap-4">
                    <button
                        disabled={true}
                        className={`${secondaryButtonClasses} opacity-50 cursor-not-allowed`}
                        title="Saving decoded prompts is not supported in this version."
                    >
                        💾 Save to Collection
                    </button>
                    <button
                        onClick={() => handleApplyDecodedPrompt(decodedPromptJson)}
                        disabled={!decodedPromptJson}
                        className={primaryButtonClasses}
                    >
                        ⚙️ Use in Creator
                    </button>
                </div>
            </section>
        </div>
    );

    const renderReverseEngineer = () => (
         <div className="flex flex-col gap-4">
            <section className="w-full bg-theme-surface p-6 shadow-lg flex flex-col gap-6 rounded-lg">
                <h2 className="text-xl font-bold text-white">Prompt Reverse Engineer</h2>
                <p className="text-sm text-theme-text-secondary">
                    Upload or paste an image and the AI will generate a detailed, descriptive prompt based on its content.
                </p>

                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-grow w-full">
                        {renderFormControl("Image for Analysis",
                             <div className="w-full aspect-video bg-theme-surface-2 rounded-md flex items-center justify-center relative">
                                {reverseEngineerImage ? (
                                    <>
                                        <img src={reverseEngineerImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-md"/>
                                        <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition rounded-full" aria-label="Remove image">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </>
                                ) : (
                                    <p className="text-xs text-theme-text-secondary">Upload or paste an image</p>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                             <input type="file" id="reverse-image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                             <label htmlFor="reverse-image-upload" className={`${secondaryButtonClasses} text-sm flex-grow text-center`}>
                                🖼️ Upload
                            </label>
                            <button onClick={handlePasteImage} disabled={isPasting} className={`${secondaryButtonClasses} text-sm flex-grow`}>
                                {isPasting ? 'Pasting...' : '📋 Paste'}
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow w-full">
                         <button
                            onClick={handleReverseEngineerPrompt}
                            disabled={isReverseEngineering || !reverseEngineerImage}
                            className={`${primaryButtonClasses} w-full flex items-center justify-center gap-2`}
                        >
                            {isReverseEngineering ? <div className="spinner !w-5 !h-5 !border-white"></div> : '🛠️'}
                            Generate Prompt
                        </button>
                    </div>
                </div>

            </section>
            
            <section className="w-full bg-theme-surface p-6 flex flex-col gap-6 rounded-lg">
                <h2 className="text-xl font-bold">Generated Prompt Output</h2>
                <div className="bg-theme-bg/50 p-2 flex items-center justify-center min-h-[200px] relative rounded-lg">
                    {isReverseEngineering && <Loader message="Analyzing image and generating prompt..." />}
                    {!isReverseEngineering && !reverseEngineeredPrompt && (
                        <div className="text-center text-theme-text-secondary">
                            The generated prompt will appear here.
                        </div>
                    )}
                    {!isReverseEngineering && reverseEngineeredPrompt && (
                         <textarea
                            readOnly
                            value={reverseEngineeredPrompt}
                            className={`${baseInputClasses} h-48 resize-y font-mono text-xs`}
                        />
                    )}
                </div>
                
                {showSaveView ? (
                    <div className="flex items-center gap-2 bg-theme-surface-2 p-2 rounded-md">
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Enter a title for your prompt..."
                            className={`${baseInputClasses} flex-grow`}
                        />
                         <button onClick={handleConfirmSaveReversePrompt} disabled={!saveName.trim()} className={primaryButtonClasses}>Confirm</button>
                         <button onClick={() => setShowSaveView(false)} className={secondaryButtonClasses}>Cancel</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSaveView(true)}
                            disabled={!reverseEngineeredPrompt}
                            className={secondaryButtonClasses}
                        >
                            💾 Save to Collection
                        </button>
                        <button
                            onClick={handleApplyReverseEngineeredPrompt}
                            disabled={!reverseEngineeredPrompt}
                            className={primaryButtonClasses}
                        >
                            ⚙️ Use in Creator
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
    
    return (
        <div className="flex flex-col gap-4 h-full">
            <nav className="flex-shrink-0 bg-theme-surface p-2 flex items-center justify-center flex-wrap gap-2 rounded-lg">
                <button
                    onClick={() => setActiveTool('decoder')}
                    className={`px-6 py-2 font-semibold transition rounded-md ${activeTool === 'decoder' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}
                >
                    Prompt Decoder
                </button>
                <button
                    onClick={() => setActiveTool('reverse_engineer')}
                    className={`px-6 py-2 font-semibold transition rounded-md ${activeTool === 'reverse_engineer' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}
                >
                    Reverse Engineer
                </button>
            </nav>
            <div className="flex-grow min-h-0">
                {activeTool === 'decoder' ? renderDecoder() : renderReverseEngineer()}
            </div>
        </div>
    );
};
