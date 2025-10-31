import React, { useState } from 'react';
import { Collection, DecodedPrompt } from '../utils/db';
import { Loader } from './Loader';
import { renderFormControl } from '../utils/ui';

export const AITools = ({ state, handlers, collection }: { state: any, handlers: any, collection: Collection }) => {
    const { isDecoding, decodedPromptJson, reverseEngineerImage, isReverseEngineering, reverseEngineeredPrompt } = state;
    const { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt, setReverseEngineerImage, setReverseEngineerImageMimeType, handleReverseEngineerPrompt, handleApplyReverseEngineeredPrompt, handleSaveReverseEngineeredPrompt } = handlers;

    const [activeTool, setActiveTool] = useState('decoder'); // 'decoder' or 'reverse_engineer'
    const [promptToDecode, setPromptToDecode] = useState('');
    const [showSaveOptions, setShowSaveOptions] = useState(false);
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
        <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* --- Left Panel: Decoder Input --- */}
            <aside className="w-full md:w-1/2 lg:w-1/3 bg-theme-surface p-6 shadow-lg flex flex-col gap-6 overflow-y-auto rounded-lg">
                <h2 className="text-xl font-bold text-white">Prompt Decoder</h2>
                <p className="text-sm text-theme-text-secondary">
                    Paste a complex prompt below. The AI will analyze it and break it down into the categories used by the Photorealistic Studio.
                </p>

                {renderFormControl("Prompt to Analyze",
                    <textarea
                        value={promptToDecode}
                        onChange={(e) => setPromptToDecode(e.target.value)}
                        placeholder="e.g., A photorealistic image of a woman in a red, flowing Hanfu dress..."
                        className={`${baseInputClasses} h-48`}
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
            </aside>

            {/* --- Right Panel: Decoder Output --- */}
            <main className="w-full md:w-1/2 lg:w-2/3 bg-theme-surface p-6 flex flex-col gap-6 overflow-y-auto rounded-lg">
                <h2 className="text-xl font-bold">Decoded Output</h2>
                <div className="flex-grow bg-theme-bg/50 p-4 flex items-center justify-center min-h-0 relative rounded-lg">
                    {isDecoding && <Loader message="Analyzing prompt..." />}
                    {!isDecoding && !decodedPromptJson && (
                        <div className="text-center text-theme-text-secondary">
                            The structured output will appear here.
                        </div>
                    )}
                    {!isDecoding && decodedPromptJson && (
                        <div className="w-full h-full overflow-y-auto">
                            <pre className="text-xs text-theme-text whitespace-pre-wrap break-all">
                                {JSON.stringify(decodedPromptJson, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                <div className="relative flex items-center gap-4">
                    <button
                        disabled={true}
                        className={secondaryButtonClasses}
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
            </main>
        </div>
    );

    const renderReverseEngineer = () => (
         <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* --- Left Panel: Image Input --- */}
            <aside className="w-full md:w-1/2 lg:w-1/3 bg-theme-surface p-6 shadow-lg flex flex-col gap-6 overflow-y-auto rounded-lg">
                <h2 className="text-xl font-bold text-white">Prompt Reverse Engineer</h2>
                <p className="text-sm text-theme-text-secondary">
                    Upload an image and the AI will generate a highly detailed, creative prompt inspired by it, based on a template of professional prompts.
                </p>

                 <div className="space-y-3">
                    <label className="text-sm font-medium text-theme-text-secondary">Reference Image</label>
                    {reverseEngineerImage ? (
                        <div className="relative group">
                            <img src={reverseEngineerImage} alt="Reference for reverse engineering" className="w-full rounded-md" />
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 rounded-full" aria-label="Remove image">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <input type="file" id="reverse-engineer-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <div className="grid grid-cols-2 gap-2">
                                <label htmlFor="reverse-engineer-upload" className="w-full text-center cursor-pointer bg-theme-surface-2 hover:bg-theme-border text-white font-bold py-2 px-4 transition duration-300 flex items-center justify-center rounded-md">
                                    🖼️ Upload
                                </label>
                                <button onClick={handlePasteImage} disabled={isPasting} className="w-full text-center cursor-pointer bg-theme-surface-2 hover:bg-theme-border text-white font-bold py-2 px-4 transition duration-300 flex items-center justify-center disabled:opacity-50 rounded-md">
                                    {isPasting ? 'Pasting...' : '📋 Paste'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                
                <button
                    onClick={handleReverseEngineerPrompt}
                    disabled={isReverseEngineering || !reverseEngineerImage}
                    className={`${primaryButtonClasses} w-full flex items-center justify-center gap-2`}
                >
                    {isReverseEngineering ? <div className="spinner !w-5 !h-5 !border-white"></div> : '🛠️'}
                    Reverse Engineer Prompt
                </button>
            </aside>

            {/* --- Right Panel: Generated Prompt Output --- */}
            <main className="w-full md:w-1/2 lg:w-2/3 bg-theme-surface p-6 flex flex-col gap-6 overflow-y-auto rounded-lg">
                <h2 className="text-xl font-bold">Generated Prompt</h2>
                <div className="flex-grow bg-theme-bg/50 p-4 flex items-center justify-center min-h-0 relative rounded-lg">
                    {isReverseEngineering && !reverseEngineeredPrompt && <Loader message="Generating prompt from image..." />}
                    
                    {!isReverseEngineering && !reverseEngineeredPrompt && (
                        <div className="text-center text-theme-text-secondary">
                            The generated prompt will appear here.
                        </div>
                    )}
                    
                    {reverseEngineeredPrompt && (
                        <textarea
                            readOnly
                            value={reverseEngineeredPrompt}
                            className="w-full h-full p-3 bg-theme-surface border border-theme-border rounded-md resize-none font-mono text-xs"
                        />
                    )}
                </div>
                <div className="flex-shrink-0">
                    <div className="relative flex items-center gap-4">
                         <button
                            onClick={() => navigator.clipboard.writeText(reverseEngineeredPrompt)}
                            disabled={!reverseEngineeredPrompt}
                            className={secondaryButtonClasses}
                        >
                            📋 Copy Prompt
                        </button>
                        <button
                            onClick={() => { setShowSaveView(true); setSaveName(''); }}
                            disabled={!reverseEngineeredPrompt}
                            className={secondaryButtonClasses}
                        >
                            💾 Save Prompt
                        </button>
                        <button
                            onClick={handleApplyReverseEngineeredPrompt}
                            disabled={!reverseEngineeredPrompt}
                            className={primaryButtonClasses}
                        >
                            ⚙️ Use in Creator
                        </button>
                    </div>
                    {showSaveView && (
                        <div className="mt-4 p-4 bg-theme-bg/50 space-y-3 rounded-lg">
                             <p className="text-sm font-semibold">Save to "Reverse Engineered Prompts"</p>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={saveName} 
                                    onChange={(e) => setSaveName(e.target.value)} 
                                    placeholder="Enter a name for this prompt"
                                    className={`${baseInputClasses} flex-grow`}
                                    aria-label="Prompt name"
                                />
                                <button onClick={handleConfirmSaveReversePrompt} className={primaryButtonClasses}>Save</button>
                                <button onClick={() => setShowSaveView(false)} className={`${secondaryButtonClasses} bg-theme-border`}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-theme-bg/50 p-6 rounded-lg">
            <div className="flex-shrink-0 border-b border-theme-border mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTool('decoder')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTool === 'decoder' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-accent'}`}>
                        Prompt Decoder
                    </button>
                    <button onClick={() => setActiveTool('reverse_engineer')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTool === 'reverse_engineer' ? 'border-theme-primary text-theme-text' : 'border-transparent text-theme-text-secondary hover:text-theme-text hover:border-theme-accent'}`}>
                        Prompt Reverse Engineer
                    </button>
                </nav>
            </div>
            <div className="flex-grow min-h-0">
                {activeTool === 'decoder' ? renderDecoder() : renderReverseEngineer()}
            </div>
        </div>
    );
};