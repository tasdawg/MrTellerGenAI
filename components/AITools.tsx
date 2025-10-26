import React, { useState } from 'react';
import { Collection, DecodedPrompt } from '../utils/db';
import { Loader } from './Loader';
import { renderFormControl } from '../utils/ui';

export const AITools = ({ state, handlers, collection }: { state: any, handlers: any, collection: Collection }) => {
    const { isDecoding, decodedPromptJson, s3Available } = state;
    const { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt } = handlers;

    const [promptToDecode, setPromptToDecode] = useState('');
    const [showSaveOptions, setShowSaveOptions] = useState(false);

    const onDecodeClick = () => {
        if (promptToDecode.trim()) {
            handleDecodePrompt(promptToDecode);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full bg-black/50 p-6">
            {/* --- Left Panel: Decoder Input --- */}
            <aside className="w-full md:w-1/2 lg:w-1/3 bg-gray-900 p-6 shadow-lg flex flex-col gap-6 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white">Prompt Decoder</h1>
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
};