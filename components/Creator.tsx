import React from 'react';
import { Loader } from './Loader';
import { ToggleSwitch } from './ToggleSwitch';
import { CollapsibleSection } from './CollapsibleSection';
import { PhotorealisticSection } from './PhotorealisticSection';
import { Collection } from '../utils/db';
import { ChatOptimizer } from './ChatOptimizer';

export const Creator = ({ state, handlers, collection }: { state: any, handlers: any, collection: Collection }) => {
    const {
        userPrompt, studioPrompt, useStudioPrompt,
        generatedImages, isGenerating,
        error, copySuccess, subjectReferenceImage, isGettingIdea,
        strictFaceLock, strictHairLock, photorealisticSettings, isConfigured, promptHistory,
        chatHistory, isOptimizing, optimizerSystemPrompt
    } = state;
    const {
        setUserPrompt, setUseStudioPrompt,
        handleGenerateImage, handleCopyPrompt,
        handleImageUpload, handleRemoveImage, handleGetIdeaFromImage,
        setStrictFaceLock, setStrictHairLock, setPhotorealisticSettings,
        handleSelectHistoryPrompt, handleClearPromptHistory,
        handleSendMessageToOptimizer, setOptimizerSystemPrompt, handleSaveCreatorPrompt
    } = handlers;
    
    const [enlargedImageSrc, setEnlargedImageSrc] = React.useState<string | null>(null);
    
    let generateButtonText = '🖼 Generate Image';
    if (subjectReferenceImage) {
        generateButtonText = '🎨 Generate with Reference';
    }

    const activePrompt = useStudioPrompt ? studioPrompt : userPrompt;
            
    return (
        <React.Fragment>
            <div className="flex flex-col md:flex-row gap-4 h-full">
                <aside className="w-full md:w-1/3 lg:w-1/4 bg-theme-surface p-6 shadow-lg flex flex-col gap-6 overflow-y-auto rounded-lg">
                    <h1 className="text-2xl font-bold text-white">Asian Photorealism Studio</h1>
                    
                    <div className="space-y-6 pt-4 border-t border-theme-border">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-theme-text-secondary">Subject Reference</label>
                            {subjectReferenceImage ? (
                                <div className="relative group">
                                    <img src={subjectReferenceImage} alt="Subject Reference" className="w-full rounded-md" />
                                    <button onClick={() => handleRemoveImage()} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 rounded-full" aria-label="Remove subject image">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <><input type="file" id="subject-image-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} /><label htmlFor="subject-image-upload" className="w-full text-center cursor-pointer bg-theme-surface-2 hover:bg-theme-border text-white font-bold py-2 px-4 transition duration-300 block rounded-md">🖼️ Upload Subject</label></>
                            )}
                             <button onClick={handleGetIdeaFromImage} disabled={!isConfigured || !subjectReferenceImage || isGettingIdea} className="w-full bg-theme-surface-2 hover:bg-theme-border text-white font-bold py-2 px-4 transition duration-300 disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-md">
                                {isGettingIdea ? <div className="spinner !w-5 !h-5"></div> : '💡'} Get Idea & Send to Tools
                            </button>
                            {subjectReferenceImage && (
                                <div className="mt-4 p-3 bg-theme-bg/50 rounded-md space-y-3">
                                    <p className="text-xs text-theme-text-secondary font-medium">Reference Fidelity</p>
                                    <ToggleSwitch 
                                        id="face-lock"
                                        checked={strictFaceLock}
                                        onChange={(e) => setStrictFaceLock(e.target.checked)}
                                        label="Strict Face Lock"
                                    />
                                    <ToggleSwitch 
                                        id="hair-lock"
                                        checked={strictHairLock}
                                        onChange={(e) => setStrictHairLock(e.target.checked)}
                                        label="Strict Hair Lock"
                                    />
                                    <p className="text-xs text-theme-text-secondary/70">Ensure the generated image's face and hair closely match the reference.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <CollapsibleSection title="Studio Settings" defaultOpen={true}>
                        <PhotorealisticSection
                            settings={photorealisticSettings}
                            onSettingsChange={setPhotorealisticSettings}
                        />
                    </CollapsibleSection>

                </aside>
                
                <main className="w-full md:w-2/3 lg:w-3/4 bg-theme-bg p-6 flex flex-row gap-6 overflow-hidden rounded-lg">
                    {/* --- Left Column: Prompts & Controls --- */}
                     <div className="w-1/2 flex flex-col gap-4 overflow-hidden">
                        {/* --- Top Part: Scrollable Prompts & Controls --- */}
                        <div className="flex-shrink-0 overflow-y-auto pr-2 space-y-6">
                            {/* --- CUSTOM PROMPT SECTION --- */}
                            <div>
                                <h2 className="text-xl font-bold">Custom Prompt</h2>
                                <p className="text-sm text-theme-text-secondary mt-1">
                                    Manually enter your prompt here. Disable "Use Studio Prompt" below to use this for generation.
                                </p>
                                <div className="relative mt-2">
                                    <textarea
                                        value={userPrompt}
                                        onChange={(e) => {
                                            setUserPrompt(e.target.value);
                                            if (useStudioPrompt) {
                                                setUseStudioPrompt(false); // Auto-disable studio prompt on edit
                                            }
                                        }}
                                        placeholder="Enter a custom prompt or apply one from AI Tools..."
                                        className={`w-full h-24 p-3 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary transition resize-y font-mono text-sm ${useStudioPrompt ? 'opacity-50' : ''}`}
                                    />
                                </div>
                                <div className="mt-2">
                                    <CollapsibleSection title="Prompt History">
                                        {promptHistory && promptHistory.length > 0 ? (
                                            <>
                                                <button 
                                                    onClick={handleClearPromptHistory}
                                                    className="w-full text-center text-xs py-1 px-2 bg-red-900 hover:bg-red-800 text-white transition mb-2 font-semibold rounded-md"
                                                >
                                                    Clear All History
                                                </button>
                                                <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                    {promptHistory.map((prompt, index) => (
                                                        <li key={index}>
                                                            <button
                                                                onClick={() => handleSelectHistoryPrompt(prompt)}
                                                                title={prompt} // Show full prompt on hover
                                                                className="w-full text-left text-xs p-2 bg-theme-surface hover:bg-theme-surface-2 transition text-theme-text-secondary truncate rounded-md"
                                                            >
                                                                {prompt}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        ) : (
                                            <p className="text-xs text-theme-text-secondary p-2">Your recently used prompts will appear here after you generate an image.</p>
                                        )}
                                    </CollapsibleSection>
                                </div>
                            </div>

                            {/* --- STUDIO GENERATED PROMPT SECTION --- */}
                            <div>
                                <h2 className="text-xl font-bold">Studio Generated Prompt</h2>
                                <p className="text-sm text-theme-text-secondary mt-1">This prompt is automatically generated from the studio settings. Edit settings to update it.</p>
                                <div className="relative mt-2">
                                    <textarea
                                        readOnly
                                        value={studioPrompt}
                                        placeholder="Your generated prompt will appear here..."
                                        className={`w-full h-24 p-3 bg-theme-surface border border-theme-border rounded-md transition resize-none font-mono text-sm ${!useStudioPrompt ? 'opacity-50' : ''}`}
                                    />
                                </div>
                                <div className="mt-4 p-3 bg-theme-surface/50 rounded-md">
                                    <ToggleSwitch
                                        id="use-studio-prompt"
                                        checked={useStudioPrompt}
                                        onChange={(e) => setUseStudioPrompt(e.target.checked)}
                                        label="Use Studio Prompt for Generation"
                                    />
                                </div>
                            </div>

                            {/* --- ACTION BUTTONS --- */}
                            <div>
                                <div className="flex items-center gap-4 mt-3">
                                    <button onClick={handleGenerateImage} disabled={!isConfigured || isGenerating || !activePrompt} className="px-6 py-2 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover disabled:bg-theme-surface-2 disabled:text-theme-text-secondary disabled:cursor-not-allowed transition duration-300 rounded-md">{generateButtonText}</button>
                                    <button onClick={handleCopyPrompt} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">{copySuccess ? 'Copied!' : '📋 Copy Active Prompt'}</button>
                                    <button
                                        onClick={() => handleSaveCreatorPrompt(activePrompt)}
                                        disabled={!activePrompt.trim()}
                                        className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 disabled:opacity-50 rounded-md"
                                    >
                                        💾 Save Active Prompt
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* --- Bottom Part: Chat Optimizer --- */}
                        <div className="flex-grow flex flex-col min-h-0 border-t-2 border-theme-border mt-4 pt-4">
                            <ChatOptimizer
                                history={chatHistory}
                                isOptimizing={isOptimizing}
                                onSendMessage={handleSendMessageToOptimizer}
                                isConfigured={isConfigured}
                                systemPrompt={optimizerSystemPrompt}
                                onSystemPromptChange={setOptimizerSystemPrompt}
                            />
                        </div>
                     </div>


                    {/* --- Right Column: Image Display --- */}
                     <div className="w-1/2 bg-theme-bg/50 p-4 flex items-center justify-center min-h-0 rounded-lg">
                        {error && <div className="text-center text-red-400 border border-red-500 p-4 rounded-lg"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                        {!error && isGenerating && <Loader message="Generating & saving..."/>}
                        {!error && !isGenerating && generatedImages.length === 0 && <div className="text-center text-theme-text-secondary">{ isConfigured ? 'Your generated images will appear here.' : 'Please set your API Key in Settings to generate images.'}</div>}
                        {!error && !isGenerating && generatedImages.length > 0 && (
                            <div className={`grid gap-4 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} w-full max-w-4xl`}>
                                {generatedImages.map((src, index) => (
                                    <div key={index} className="relative group">
                                        <img 
                                            src={src} 
                                            alt={`Generated variation ${index + 1}`} 
                                            className="object-contain w-full h-auto shadow-lg max-h-[60vh] cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                                            onClick={() => setEnlargedImageSrc(src)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                </main>
            </div>
            
            {enlargedImageSrc && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setEnlargedImageSrc(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button 
                        className="absolute top-4 right-4 text-white p-2 hover:text-gray-300 transition z-10"
                        aria-label="Close enlarged view"
                        onClick={() => setEnlargedImageSrc(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img 
                        src={enlargedImageSrc} 
                        alt="Enlarged view" 
                        className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                    />
                </div>
            )}
        </React.Fragment>
    );
};