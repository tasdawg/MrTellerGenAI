import React from 'react';
import { Loader } from './Loader';
import { ToggleSwitch } from './ToggleSwitch';
import { CollapsibleSection } from './CollapsibleSection';
import { PhotorealisticSection } from './PhotorealisticSection';
import { renderFormControl } from '../utils/ui';
import { SUBJECT_TYPES, STYLE_PRESETS, LIGHTING_OPTIONS, CAMERA_ANGLES, VARIATION_COUNTS, REFERENCE_USAGE_OPTIONS, QUICK_CHIPS } from '../utils/constants';
import { Collection } from '../utils/db';

const generatePhotorealisticPrompt = (settings: any) => {
    const promptParts = [
        `Create a photorealistic image from the original source with the most realistic face. The face must be 100% like the original; do not change it.`,
        `She is wearing a ${settings.dressDetails} ${settings.dressColor} ${settings.dressStyle}.`,
        `Her hair is ${settings.hairStyle}. She has a ${settings.hairAccessory}.`,
        `The background is ${settings.background} with ${settings.backgroundElements}.`
    ];

    if (settings.shotPose !== 'Custom Pose') {
         promptParts.push(`The shot is composed as a ${settings.shotPose}.`);
    } else {
        promptParts.push(`She is ${settings.action}. Her skirt is flowing.`);
        promptParts.push(`${settings.gaze}.`);
    }

    promptParts.push(`Shot on a ${settings.cameraModel} with a ${settings.lensType}.`);
    promptParts.push(`The lighting and shadows should be ${settings.lighting}.`);
    promptParts.push(`${settings.skin}.`);
    promptParts.push(`${settings.fashionAesthetics}.`);
    promptParts.push(`Aspect ratio ${settings.aspectRatio} -- hyperrealism.`);
    
    return promptParts.join(' ');
};


export const Creator = ({ state, handlers, collection, onSavePrompt }: { state: any, handlers: any, collection: Collection, onSavePrompt: (prompt: string, folderId: string) => void }) => {
    const { idea, subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative,
            variationCount, optimisedPrompt, generatedImages, isOptimising, isGenerating,
            error, copySuccess, subjectReferenceImage, styleReferenceImage, isGettingIdea, referenceUsage,
            strictFaceLock, strictHairLock, s3Available, photorealisticSettings } = state;
    const { setIdea, setSubjectType, setStylePreset, setLighting, setCameraAngle, setQualityBoost,
            setAddNegative, setVariationCount, setOptimisedPrompt, setReferenceUsage,
            handleOptimizeClick, handleGenerateImage, handleCopyPrompt, handleSurpriseMe,
            handleQuickChip, handleImageUpload, handleRemoveImage, handleGetIdeaFromImage,
            setStrictFaceLock, setStrictHairLock, setPhotorealisticSettings } = handlers;
    
    React.useEffect(() => {
        const prompt = generatePhotorealisticPrompt(photorealisticSettings);
        setOptimisedPrompt(prompt);
    }, [photorealisticSettings, setOptimisedPrompt]);

    const [showSavePromptOptions, setShowSavePromptOptions] = React.useState(false);
    const hasAnyReference = !!subjectReferenceImage || !!styleReferenceImage;
    const hasBothReferences = !!subjectReferenceImage && !!styleReferenceImage;
    const hasOneReference = hasAnyReference && !hasBothReferences;
    
    let generateButtonText = '🖼 Generate Image';
    if (hasBothReferences) {
        generateButtonText = '✨ Generate with Subject & Style';
    } else if (hasAnyReference) {
        generateButtonText = '🎨 Generate with Reference';
    }
            
    return (
        <div className="flex flex-col md:flex-row gap-4 h-full">
            <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-900 p-6 shadow-lg flex flex-col gap-6 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white">Prompt Optimizer</h1>
                
                {renderFormControl("Your Idea", <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="a dog surfing at sunset" className="w-full h-24 p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition"/>)}
                
                <div className="space-y-6 pt-4 border-t border-gray-700">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-400">Subject Reference (Optional)</label>
                        {subjectReferenceImage ? (
                            <div className="relative group">
                                <img src={subjectReferenceImage} alt="Subject Reference" className="w-full" />
                                <button onClick={() => handleRemoveImage('subject')} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label="Remove subject image">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <><input type="file" id="subject-image-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageUpload(e, 'subject')} /><label htmlFor="subject-image-upload" className="w-full text-center cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300 block">🖼️ Upload Subject</label></>
                        )}
                         <button onClick={handleGetIdeaFromImage} disabled={!subjectReferenceImage || isGettingIdea} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isGettingIdea ? <div className="spinner !w-5 !h-5"></div> : '💡'} Get Idea from Subject
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

                     <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-400">Style Reference (Optional)</label>
                        {styleReferenceImage ? (
                            <div className="relative group">
                                <img src={styleReferenceImage} alt="Style Reference" className="w-full" />
                                <button onClick={() => handleRemoveImage('style')} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100" aria-label="Remove style image">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ) : (
                            <><input type="file" id="style-image-upload" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageUpload(e, 'style')} /><label htmlFor="style-image-upload" className="w-full text-center cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300 block">🎨 Upload Style</label></>
                        )}
                    </div>
                </div>
                
                {/* FIX: Wrapped children in CollapsibleSection to fix missing 'children' prop error. */}
                <CollapsibleSection title="Fine-Tuning" defaultOpen={true}>
                    <>
                        {renderFormControl("Subject Type", <select value={subjectType} onChange={(e) => setSubjectType(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition"> {SUBJECT_TYPES.map(s => <option key={s}>{s}</option>)} </select>)}
                        {renderFormControl("Style Preset", <select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition"> {STYLE_PRESETS.map(s => <option key={s}>{s}</option>)} </select>)}
                        {renderFormControl("Lighting", <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition"> {LIGHTING_OPTIONS.map(l => <option key={l}>{l}</option>)} </select>)}
                        {renderFormControl("Camera Angle", <select value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition"> {CAMERA_ANGLES.map(c => <option key={c}>{c}</option>)} </select>)}
                    </>
                </CollapsibleSection>
                
                {/* FIX: Wrapped children in CollapsibleSection to fix missing 'children' prop error. */}
                <CollapsibleSection title="Advanced Settings">
                     <>
                        <div className="space-y-4">
                            <ToggleSwitch id="quality-boost" checked={qualityBoost} onChange={(e) => setQualityBoost(e.target.checked)} label="Quality Boost"/>
                            <ToggleSwitch id="add-negative" checked={addNegative} onChange={(e) => setAddNegative(e.target.checked)} label="Add Negative Prompt"/>
                        </div>
                         {hasOneReference && (
                            renderFormControl("Reference Usage", <select value={referenceUsage} onChange={(e) => setReferenceUsage(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition">{REFERENCE_USAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}</select>)
                        )}
                        <div>
                            {renderFormControl("Variations", <select value={variationCount} onChange={(e) => setVariationCount(Number(e.target.value))} disabled={hasAnyReference} className="w-full p-2 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed">{VARIATION_COUNTS.map(v => <option key={v} value={v}>{v} Image{v > 1 ? 's' : ''}</option>)}</select>)}
                            {hasAnyReference && <p className="text-xs text-gray-500 mt-1">Variations are disabled when using a reference image.</p>}
                        </div>
                    </>
                </CollapsibleSection>

                 {/* FIX: Wrapped children in CollapsibleSection to fix missing 'children' prop error. */}
                 <CollapsibleSection title="Inspiration Tools">
                    <>
                        <button onClick={handleSurpriseMe} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 transition duration-300">🎲 Surprise Me</button>
                        <div className="text-sm font-medium text-gray-400">Quick Chips:</div>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_CHIPS.map(chip => (
                                <button key={chip.name} onClick={() => handleQuickChip(chip.settings)} className="bg-gray-700 hover:bg-gray-600 text-xs font-semibold py-1 px-3 transition duration-300">{chip.name}</button>
                            ))}
                        </div>
                    </>
                </CollapsibleSection>

                {/* FIX: Wrapped children in CollapsibleSection to fix missing 'children' prop error. */}
                <CollapsibleSection title="Asian Photorealism Studio">
                    <>
                        <PhotorealisticSection
                            settings={photorealisticSettings}
                            onSettingsChange={setPhotorealisticSettings}
                        />
                    </>
                </CollapsibleSection>

            </aside>
            
            <main className="w-full md:w-2/3 lg:w-3/4 bg-black/50 p-6 flex flex-col gap-6 overflow-y-auto">
                 <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold">1. Optimize Your Prompt</h2>
                        <p className="text-sm text-gray-400 mt-1">Adjust settings, upload a reference, or use "Surprise Me," then optimize.</p>
                    </div>
                     <button onClick={handleOptimizeClick} disabled={isOptimising || !idea.trim()} className="w-full px-6 py-3 bg-gray-300 text-black font-bold hover:bg-gray-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        Optimize Prompt
                     </button>
                    <div>
                        <h2 className="text-xl font-bold">2. Edit & Generate Image</h2>
                        <div className="relative mt-2">
                            <textarea value={optimisedPrompt} onChange={(e) => setOptimisedPrompt(e.target.value)} placeholder="Your optimized prompt will appear here..." className="w-full h-32 p-3 bg-gray-800 border border-gray-600 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition resize-none"/>
                            {isOptimising && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="spinner !w-8 !h-8"></div></div>}
                        </div>
                         <div className="flex items-center gap-4 mt-3">
                             <button onClick={handleGenerateImage} disabled={isGenerating || !optimisedPrompt} className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300">{generateButtonText}</button>
                             <button onClick={handleCopyPrompt} className="px-4 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300">{copySuccess ? 'Copied!' : '📋 Copy Prompt'}</button>
                             <div className="relative">
                                <button
                                    onClick={() => setShowSavePromptOptions(p => !p)}
                                    disabled={!optimisedPrompt.trim() || !s3Available}
                                    className="px-4 py-2 bg-gray-700 text-white font-semibold hover:bg-gray-600 transition duration-300 disabled:opacity-50"
                                >
                                    💾 Save Prompt
                                </button>
                                {showSavePromptOptions && collection.folders.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-600 shadow-lg z-10 text-center">
                                        <ul className="py-1">
                                            {collection.folders.map(folder => (
                                                <li key={folder.id}>
                                                    <button
                                                        onClick={() => {
                                                            onSavePrompt(optimisedPrompt, folder.id);
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
                    {!error && !isGenerating && generatedImages.length === 0 && <div className="text-center text-gray-500">Your generated images will appear here.</div>}
                    {!error && !isGenerating && generatedImages.length > 0 && (
                        <div className={`grid gap-4 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} w-full max-w-4xl`}>
                            {generatedImages.map((src, index) => (
                                <div key={index} className="relative group">
                                    <img src={src} alt={`Generated variation ${index + 1}`} className="object-contain w-full h-auto shadow-lg"/>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            </main>
        </div>
    );
};