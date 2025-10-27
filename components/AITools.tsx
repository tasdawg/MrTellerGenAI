import React, { useState } from 'react';
import { Collection, DecodedPrompt } from '../utils/db';
import { Loader } from './Loader';
import { renderFormControl } from '../utils/ui';

export const AITools = ({ state, handlers, collection }: { state: any, handlers: any, collection: Collection }) => {
    const { isDecoding, decodedPromptJson, s3Available, reverseEngineerImage, isReverseEngineering, reverseEngineeredPrompt } = state;
    const { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt, setReverseEngineerImage, setReverseEngineerImageMimeType, handleReverseEngineerPrompt, handleApplyReverseEngineeredPrompt, handleSaveReverseEngineeredPrompt } = handlers;

    const [activeTool, setActiveTool] = useState('decoder'); // 'decoder' or 'reverse_engineer'
    const [promptToDecode, setPromptToDecode] = useState('');
    const [showSaveOptions, setShowSaveOptions] = useState(false);
    const [showSaveView, setShowSaveView] = useState(false);
    const [saveName, setSaveName] = useState('');


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

    const renderDecoder = () => (
        <div className="flex flex-col md:flex-row gap-4 h-full">
            {/* --- Left Panel: Decoder Input --- */}
            <aside className="w-full md:w-1/2 lg:w-1/3 bg-gray-900 p-6 shadow-lg flex flex-col gap-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-white">Prompt Decoder</h2>
                <p className="text-sm text-gray-400">
                    Paste a complex prompt below. The AI will analyze it and break it down into the categories used by the Photorealistic Studio.
                </p>

                {renderFormControl("Prompt to Analyze",
                    <textarea
                        value={promptToDecode}
                        onChange={(e) => setPromptToDecode(e.target.value)}
                        placeholder="e.g., A photorealistic image of a woman in a red, flowing Hanfu dress..."
                        className="w-full h-48 p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition"
                    />
                )}
                
                <button
                    onClick={onDecodeClick}
                    disabled={isDecoding || !promptToDecode.trim()}
                    className="w-full px-6 py-3 bg-gray-300 text-black font-bold hover:bg-gray-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center gap-2"
                >
                    {isDecoding ? <div className="spinner !w-5 !h-5 !border-black"></div> : '🧩'}
                    Decode Prompt
                </button>
            </aside>

            {/* --- Right Panel: Decoder Output --- */}
            <main className="w-full md:w-1/2 lg:w-2/3 bg-gray-900 p-6 flex flex-col gap-6 overflow-y-auto">
                <h2 className="text-xl font-bold">Decoded Output</h2>
                <div className="flex-grow bg-black/50 p-4 flex items-center justify-center min-h-0 relative">
                    {isDecoding && <Loader message="Analyzing prompt..." />}
                    {!isDecoding && !decodedPromptJson && (
                        <div className="text-center text-gray-500">
                            The structured output will appear here.
                        </div>
                    )}
                    {!isDecoding && decodedPromptJson && (
                        <div className="w-full h-full overflow-y-auto">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                                {JSON.stringify(decodedPromptJson, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
                <div className="relative flex items-center gap-4">
                    <button
                        onClick={() => setShowSaveOptions(p => !p)}
                        disabled={!decodedPromptJson || !s3Available}
                        className="px-6 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300 disabled:opacity-50"
                    >
                        💾 Save to Collection
                    </button>
                    {showSaveOptions && collection.folders.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-max bg-gray-600 shadow-lg z-10 text-center">
                            <ul className="py-1">
                                {collection.folders.map(folder => (
                                    <li key={folder.id}>
                                        <button
                                            onClick={() => {
                                                if (decodedPromptJson) {
                                                    handleSaveDecodedPrompt(decodedPromptJson, folder.id);
                                                    setShowSaveOptions(false);
                                                }
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500"
                                        >
                                            Save to "{folder.name}"
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <button
                        onClick={() => handleApplyDecodedPrompt(decodedPromptJson)}
                        disabled={!decodedPromptJson}
                        className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 transition duration-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
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
            <aside className="w-full md:w-1/2 lg:w-1/3 bg-gray-900 p-6 shadow-lg flex flex-col gap-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-white">Prompt Reverse Engineer</h2>
                <p className="text-sm text-gray-400">
                    Upload an image and the AI will generate a highly detailed, creative prompt inspired by it, based on a template of professional prompts.
                </p>

                 <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-400">Reference Image</label>
                    {reverseEngineerImage ? (
                        <div className="relative group">
                            <img src={reverseEngineerImage} alt="Reference for reverse engineering" className="w-full" />
                            <button onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label="Remove image">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <input type="file" id="reverse-engineer-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <label htmlFor="reverse-engineer-upload" className="w-full text-center cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300 block">
                                🖼️ Upload Image
                            </label>
                        </>
                    )}
                </div>
                
                <button
                    onClick={handleReverseEngineerPrompt}
                    disabled={isReverseEngineering || !reverseEngineerImage}
                    className="w-full px-6 py-3 bg-gray-300 text-black font-bold hover:bg-gray-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center gap-2"
                >
                    {isReverseEngineering ? <div className="spinner !w-5 !h-5 !border-black"></div> : '🛠️'}
                    Reverse Engineer Prompt
                </button>
            </aside>

            {/* --- Right Panel: Generated Prompt Output --- */}
            <main className="w-full md:w-1/2 lg:w-2/3 bg-gray-900 p-6 flex flex-col gap-6 overflow-y-auto">
                <h2 className="text-xl font-bold">Generated Prompt</h2>
                <div className="flex-grow bg-black/50 p-4 flex items-center justify-center min-h-0 relative">
                    {isReverseEngineering && !reverseEngineeredPrompt && <Loader message="Generating prompt from image..." />}
                    
                    {!isReverseEngineering && !reverseEngineeredPrompt && (
                        <div className="text-center text-gray-500">
                            The generated prompt will appear here.
                        </div>
                    )}
                    
                    {reverseEngineeredPrompt && (
                        <textarea
                            readOnly
                            value={reverseEngineeredPrompt}
                            className="w-full h-full p-3 bg-gray-800 border border-gray-600 resize-none font-mono text-xs"
                        />
                    )}
                </div>
                <div className="flex-shrink-0">
                    <div className="relative flex items-center gap-4">
                         <button
                            onClick={() => navigator.clipboard.writeText(reverseEngineeredPrompt)}
                            disabled={!reverseEngineeredPrompt}
                            className="px-6 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300 disabled:opacity-50"
                        >
                            📋 Copy Prompt
                        </button>
                        <button
                            onClick={() => { setShowSaveView(true); setSaveName(''); }}
                            disabled={!reverseEngineeredPrompt}
                            className="px-6 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300 disabled:opacity-50"
                        >
                            💾 Save Prompt
                        </button>
                        <button
                            onClick={handleApplyReverseEngineeredPrompt}
                            disabled={!reverseEngineeredPrompt}
                            className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 transition duration-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            ⚙️ Use in Creator
                        </button>
                    </div>
                    {showSaveView && (
                        <div className="mt-4 p-4 bg-gray-800 space-y-3">
                             <p className="text-sm font-semibold">Save to "Reverse Engineered Prompts"</p>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={saveName} 
                                    onChange={(e) => setSaveName(e.target.value)} 
                                    placeholder="Enter a name for this prompt"
                                    className="flex-grow p-2 bg-gray-700 border border-gray-600"
                                    aria-label="Prompt name"
                                />
                                <button onClick={handleConfirmSaveReversePrompt} className="px-4 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400">Save</button>
                                <button onClick={() => setShowSaveView(false)} className="px-4 py-2 bg-gray-900 hover:bg-black font-bold">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-black/50 p-6">
            <div className="flex-shrink-0 border-b border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTool('decoder')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTool === 'decoder' ? 'border-gray-300 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'}`}>
                        Prompt Decoder
                    </button>
                    <button onClick={() => setActiveTool('reverse_engineer')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition ${activeTool === 'reverse_engineer' ? 'border-gray-300 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'}`}>
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
