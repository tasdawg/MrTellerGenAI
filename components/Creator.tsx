import React from 'react';
import { Loader } from './Loader';
import { ToggleSwitch } from './ToggleSwitch';
import { CollapsibleSection } from './CollapsibleSection';
import { PhotorealisticSection } from './PhotorealisticSection';
import { renderFormControl } from '../utils/ui';
import { Collection } from '../utils/db';

export const Creator = ({ state, handlers, collection, onSavePrompt }: { state: any, handlers: any, collection: Collection, onSavePrompt: (prompt: string, folderId: string) => void }) => {
    const { generatedPrompt, generatedImages, isGenerating,
            error, copySuccess, subjectReferenceImage, isGettingIdea,
            strictFaceLock, strictHairLock, s3Available, photorealisticSettings, isConfigured } = state;
    const { setGeneratedPrompt,
            handleGenerateImage, handleCopyPrompt,
            handleImageUpload, handleRemoveImage, handleGetIdeaFromImage,
            setStrictFaceLock, setStrictHairLock, setPhotorealisticSettings } = handlers;
    
    const [showSavePromptOptions, setShowSavePromptOptions] = React.useState(false);
    const [enlargedImageSrc, setEnlargedImageSrc] = React.useState<string | null>(null);
    
    let generateButtonText = '🖼 Generate Image';
    if (subjectReferenceImage) {
        generateButtonText = '🎨 Generate with Reference';
    }
            
    return (
        <React.Fragment>
            <div className="flex flex-col md:flex-row gap-4 h-full">
                <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-900 p-6 shadow-lg flex flex-col gap-6 overflow-y-auto">
                    <h1 className="text-2xl font-bold text-white">Asian Photorealism Studio</h1>
                    
                    <div className="space-y-6 pt-4 border-t border-gray-700">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-400">Subject Reference</label>
                            {subjectReferenceImage ? (
                                <div className="relative group">
                                    <img src={subjectReferenceImage} alt="Subject Reference" className="w-full" />
                                    <button onClick={() => handleRemoveImage()} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label="Remove subject image">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ) : (
                                <><input type="file" id="subject-image-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageUpload(e, 'subject')} /><label htmlFor="subject-image-upload" className="w-full text-center cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300 block">🖼️ Upload Subject</label></>
                            )}
                             <button onClick={handleGetIdeaFromImage} disabled={!isConfigured || !subjectReferenceImage || isGettingIdea} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isGettingIdea ? <div className="spinner !w-5 !h-5"></div> : '💡'} Get Idea & Send to Tools
                            </button>
                            {subjectReferenceImage && (
                                <div className="mt-4 p-3 bg-gray-800/50 space-y-3">
                                    <p className="text-xs text-gray-400 font-medium">Reference Fidelity</p>
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
                                    <p className="text-xs text-gray-500">Ensure the generated image's face and hair closely match the reference.</p>
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
                
                <main className="w-full md:w-2/3 lg:w-3/4 bg-black/50 p-6 flex flex-col gap-6 overflow-y-auto">
                     <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold">Generated Prompt</h2>
                            <p className="text-sm text-gray-400 mt-1">This prompt is automatically generated from the studio settings. Edit settings to update it.</p>
                        </div>
                        <div>
                            <div className="relative mt-2">
                                <textarea 
                                    readOnly 
                                    value={generatedPrompt} 
                                    placeholder="Your generated prompt will appear here..." 
                                    className="w-full h-40 p-3 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition resize-none font-mono text-sm"
                                />
                            </div>
                             <div className="flex items-center gap-4 mt-3">
                                 <button onClick={handleGenerateImage} disabled={!isConfigured || isGenerating || !generatedPrompt} className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300">{generateButtonText}</button>
                                 <button onClick={handleCopyPrompt} className="px-4 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300">{copySuccess ? 'Copied!' : '📋 Copy Prompt'}</button>
                                 <div className="relative">
                                    <button
                                        onClick={() => setShowSavePromptOptions(p => !p)}
                                        disabled={!generatedPrompt.trim() || !s3Available}
                                        className="px-4 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300 disabled:opacity-50"
                                    >
                                        💾 Save Prompt
                                    </button>
                                    {showSavePromptOptions && collection.folders.length > 0 && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-600 shadow-lg z-10 text-center">
                                            <ul className="py-1">
                                                {collection.folders.map(folder => folder.id !== 'ai-prompt-templates' && ( // Don't allow saving to template folder
                                                    <li key={folder.id}>
                                                        <button
                                                            onClick={() => {
                                                                onSavePrompt(generatedPrompt, folder.id);
                                                                setShowSavePromptOptions(false);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-500"
                                                        >
                                                            {folder.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                     </div>

                     <div className="flex-grow bg-black/50 p-4 flex items-center justify-center min-h-0">
                        {error && <div className="text-center text-red-400 border border-red-500 p-4"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                        {!error && isGenerating && <Loader message="Generating & saving..."/>}
                        {!error && !isGenerating && generatedImages.length === 0 && <div className="text-center text-gray-500">{ isConfigured ? 'Your generated images will appear here.' : 'Please set your API Key in Settings to generate images.'}</div>}
                        {!error && !isGenerating && generatedImages.length > 0 && (
                            <div className={`grid gap-4 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} w-full max-w-4xl`}>
                                {generatedImages.map((src, index) => (
                                    <div key={index} className="relative group">
                                        <img 
                                            src={src} 
                                            alt={`Generated variation ${index + 1}`} 
                                            className="object-contain w-full h-auto shadow-lg max-h-[60vh] cursor-pointer hover:opacity-90 transition-opacity"
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
                        className="max-w-[95vw] max-h-[95vh] object-contain"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                    />
                </div>
            )}
        </React.Fragment>
    );
};