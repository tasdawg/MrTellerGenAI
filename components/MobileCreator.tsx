import React from 'react';
import { Loader } from './Loader';

const ThumbnailUploader = ({ imageSrc, onRemove, onUpload, uploadId, title }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-theme-text-secondary">{title}</label>
        {imageSrc ? (
            <div className="relative group w-24 h-24 bg-theme-bg/50 rounded-md">
                <img src={imageSrc} alt={title} className="w-full h-full object-cover rounded-md" />
                <button onClick={onRemove} className="absolute top-1 right-1 bg-black/50 text-white p-1 hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 rounded-full" aria-label={`Remove ${title}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        ) : (
            <>
                <input type="file" id={uploadId} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={onUpload} />
                <label htmlFor={uploadId} className="w-24 h-24 text-center cursor-pointer bg-theme-surface-2 hover:bg-theme-border text-white font-bold transition duration-300 flex items-center justify-center rounded-md text-xs">
                    🖼️ Upload
                </label>
            </>
        )}
    </div>
);

export const MobileCreator = ({ state, handlers }) => {
    const {
        userPrompt, referenceImage, reverseEngineerImage,
        isReverseEngineering, reverseEngineeredPrompt,
        generatedImages, isGenerating, error,
    } = state;

    const {
        setUserPrompt, setReferenceImage, setReferenceImageMimeType,
        setReverseEngineerImage, setReverseEngineerImageMimeType,
        handleGenerateImage, handleReverseEngineerPrompt,
    } = handlers;

    const handleReverseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReverseEngineerImage(reader.result as string);
                setReverseEngineerImageMimeType(file.type);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
                setReferenceImageMimeType(file.type);
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="h-full max-w-md mx-auto overflow-y-auto p-2 space-y-4 text-sm">

            {/* --- GET PROMPT FROM IMAGE --- */}
            <div className="bg-theme-surface p-4 rounded-lg space-y-3">
                <h2 className="text-lg font-bold">Get Prompt from Image</h2>
                 <ThumbnailUploader
                    imageSrc={reverseEngineerImage}
                    onRemove={() => setReverseEngineerImage(null)}
                    onUpload={handleReverseImageUpload}
                    uploadId="mobile-reverse-upload"
                    title="Upload an image to get a prompt"
                />
                 <button
                    onClick={handleReverseEngineerPrompt}
                    disabled={isReverseEngineering || !reverseEngineerImage}
                    className="w-full py-2 px-4 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 rounded-md"
                >
                    {isReverseEngineering ? <div className="spinner !w-5 !h-5"></div> : '💡 Get Prompt'}
                </button>
                 {reverseEngineeredPrompt && (
                    <div className="space-y-2">
                         <textarea
                            readOnly
                            value={reverseEngineeredPrompt}
                            className="w-full h-24 p-2 bg-theme-bg/50 border border-theme-border rounded-md resize-none font-mono text-xs"
                        />
                         <button
                            onClick={() => setUserPrompt(reverseEngineeredPrompt)}
                            className="w-full py-2 px-4 bg-theme-accent text-white font-semibold hover:bg-theme-primary transition duration-300 rounded-md"
                        >
                            ⬇️ Apply to Prompt
                        </button>
                    </div>
                )}
            </div>
            
            {/* --- CRAFT PROMPT --- */}
            <div className="bg-theme-surface p-4 rounded-lg space-y-3">
                 <h2 className="text-lg font-bold">Craft Your Prompt</h2>
                 <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full h-32 p-3 bg-theme-surface-2 border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary"
                />
                <ThumbnailUploader
                    imageSrc={referenceImage}
                    onRemove={() => setReferenceImage(null)}
                    onUpload={handleReferenceImageUpload}
                    uploadId="mobile-reference-upload"
                    title="Face Reference (Optional)"
                />
                 <p className="text-xs text-theme-text-secondary">
                    If you add a face reference, the AI will be instructed to create a 100% photorealistic match of the face.
                </p>
            </div>
            
            {/* --- GENERATE --- */}
            <div className="sticky bottom-2 z-10">
                <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !userPrompt.trim()}
                    className="w-full py-3 px-4 bg-theme-primary text-white text-base font-bold hover:bg-theme-primary-hover transition duration-300 disabled:bg-theme-surface-2 disabled:text-theme-text-secondary shadow-lg rounded-lg"
                >
                    {isGenerating ? 'Generating...' : '✨ Generate Image'}
                </button>
            </div>

            {/* --- RESULT --- */}
             <div className="bg-theme-surface p-4 rounded-lg min-h-[250px] flex items-center justify-center">
                {error && <div className="text-center text-red-400 p-4"><p className="font-bold">An Error Occurred</p><p className="text-xs mt-1">{error}</p></div>}
                {!error && isGenerating && <Loader message="Generating..."/>}
                {!error && !isGenerating && generatedImages.length === 0 && <div className="text-center text-theme-text-secondary">Your result will appear here.</div>}
                {!error && !isGenerating && generatedImages.length > 0 && (
                    <div className="w-full space-y-4">
                        {generatedImages.map((src, index) => (
                            <img 
                                key={index} 
                                src={src} 
                                alt={`Generated result ${index + 1}`} 
                                className="w-full h-auto object-contain rounded-md"
                            />
                        ))}
                    </div>
                )}
             </div>

        </div>
    );
};
