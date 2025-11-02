import React, { useState } from 'react';
import { Collection as CollectionType, CollectionItem, StoredImage, TemplatePrompt, UserSavedPrompt } from '../utils/db';
import { Loader } from './Loader';
import { GoogleGenAI, Modality } from "@google/genai";
import { imageUrlToBase64 } from '../utils/helpers';

const TemplateEditor = ({ item, onSave, onCancel, onReset }: { item: CollectionItem, onSave: (item: CollectionItem) => void, onCancel: () => void, onReset: () => void }) => {
    const templateContent = item.content as TemplatePrompt;
    const isNew = !templateContent.prompt;
    const [title, setTitle] = useState(templateContent.title || 'AI Template: New Custom Prompt');
    const [prompt, setPrompt] = useState(templateContent.prompt || '');

    const handleSave = () => {
        onSave({
            ...item,
            content: { ...templateContent, title, prompt }
        });
    };

    const baseInputClasses = "w-full p-2 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";

    return (
        <div className="bg-theme-surface p-6 h-full flex flex-col gap-4 rounded-lg">
            <h3 className="text-xl font-bold">{isNew ? "Create New Template" : "Edit Template"}</h3>
            <div className="space-y-2">
                <label className="text-sm font-medium text-theme-text-secondary">Title</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className={baseInputClasses}
                />
            </div>
            <div className="space-y-2 flex-grow flex flex-col">
                <label className="text-sm font-medium text-theme-text-secondary">Prompt</label>
                <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    className={`${baseInputClasses} h-full resize-none flex-grow`}
                    placeholder="Enter your detailed prompt here..."
                />
            </div>
            <div className="flex-shrink-0 flex items-center gap-4">
                <button onClick={handleSave} className="px-6 py-2 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover transition rounded-md">Save Changes</button>
                <button onClick={onCancel} className="px-6 py-2 bg-theme-surface-2 hover:bg-theme-border font-bold transition rounded-md">Cancel</button>
                <div className="flex-grow"></div>
                <button onClick={onReset} className="px-4 py-2 text-sm bg-red-900 hover:bg-red-800 font-bold transition rounded-md">Reset All Templates to Default</button>
            </div>
        </div>
    );
};

const ImageDetailView = ({ item, onBack, onUseAsReference, onUseSettings, onAddToCollection, ai, onSaveAndUpload, onCropImage }: { 
    item: CollectionItem; 
    onBack: () => void; 
    onUseAsReference: (image: StoredImage) => void; 
    onUseSettings: (image: StoredImage) => void; 
    onAddToCollection: (image: StoredImage, folderId: string) => void;
    ai: GoogleGenAI | null;
    onSaveAndUpload: (base64Images: string[], prompt: string, settings: any) => Promise<void>;
    onCropImage: (image: StoredImage, onComplete: () => void) => void;
}) => {
    const imageContent = item.content as StoredImage;
    const displaySrc = imageContent.publicUrl || imageContent.src;

    const [isReverseEngineering, setIsReverseEngineering] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<{ src: string; prompt: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const handleDownload = async () => {
        if (!imageContent) return;
        const filename = imageContent.id ? `gallery-image-${imageContent.id.substring(0, 8)}.png` : 'downloaded-image.png';
    
        try {
            // Fetch attempts to get the image. This will fail if the server has a strict CORS policy.
            const response = await fetch(displaySrc);
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const blob = await response.blob();
            
            // Create a temporary URL for the blob and trigger the download via a link.
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Clean up the temporary URL and link.
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
    
        } catch (error) {
            console.error('Download failed, likely due to a CORS policy on the server.', error);
            // If fetch fails, it's almost certainly a CORS issue. Provide a user-friendly fallback.
            alert(
                'Direct download failed due to server security restrictions (CORS).\n\n' +
                'The image will now open in a new tab. You can save it from there by right-clicking and selecting "Save Image As...".'
            );
            window.open(displaySrc, '_blank');
        }
    };

    const handleReverseEngineerAndGenerate = async () => {
        if (!ai || !imageContent) return;

        setIsReverseEngineering(true);
        setGeneratedResult(null);
        setError(null);

        try {
            // 1. Get Base64 of original image
            const originalBase64Image = await imageUrlToBase64(displaySrc);
            const mimeType = originalBase64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
            const base64Data = originalBase64Image.split(',')[1];
            const imagePart = { inlineData: { mimeType, data: base64Data } };

            // 2. Reverse engineer to get a new prompt
            const reverseEngineerInstruction = `Analyze this image in detail. Describe the main subject, their clothing, the environment, the lighting, camera angle, and the overall artistic style. Based on your analysis, create a detailed and creative prompt that could be used to generate a similar or inspired image. IMPORTANT: The prompt MUST instruct the AI to use the original face from the reference image without any deviation. Output only the final prompt text, nothing else.`;
            const promptResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, { text: reverseEngineerInstruction }] },
            });
            const newPrompt = promptResponse.text.trim();

            // 3. Generate a new image using the new prompt and original face
            const generationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, { text: newPrompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            const imageParts = generationResponse.candidates[0].content.parts.filter(part => part.inlineData);
            if (imageParts.length === 0) {
                throw new Error("The model did not return a new image.");
            }
            const newImageBase64 = `data:${imageParts[0].inlineData.mimeType};base64,${imageParts[0].inlineData.data}`;
            
            // 4. Save and upload the new image
            await onSaveAndUpload([newImageBase64], newPrompt, { source: 'reverse_engineered_in_collection' });

            // 5. Update UI with the result
            setGeneratedResult({ src: newImageBase64, prompt: newPrompt });

        } catch (e: any) {
            console.error("Reverse engineering failed", e);
            setError(`Reverse engineering failed: ${e.message}. This might be due to a network error, a broken link, or the server's CORS policy`);
        } finally {
            setIsReverseEngineering(false);
        }
    };

    const handleGoBack = () => {
        setGeneratedResult(null);
        setError(null);
        onBack();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-4">
                <button onClick={handleGoBack} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">
                    &larr; Back to Collection
                </button>
            </div>
             <div className="flex-grow flex flex-col md:flex-row gap-4 w-full min-h-0">
                {/* Left Panel: Original Image */}
                <div className={`w-full ${generatedResult || isReverseEngineering || error ? 'md:w-1/2' : 'md:w-full'} flex flex-col items-center justify-center gap-4`}>
                    <div className="flex-grow w-full flex items-center justify-center min-h-0">
                        <img src={displaySrc} alt="Selected" className="max-h-full max-w-full object-contain rounded-md"/>
                    </div>
                    <div className="bg-theme-bg p-4 w-full max-w-3xl text-sm flex-shrink-0 rounded-lg">
                        <p className="font-bold text-white mb-2">Original Prompt:</p>
                        <p className="text-theme-text-secondary bg-theme-surface p-2 font-mono text-xs max-h-24 overflow-y-auto rounded-md">{imageContent.prompt}</p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center items-start">
                            <button onClick={handleDownload} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">⬇️ Download</button>
                            <button onClick={() => onUseAsReference(imageContent)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">🖼️ Use as Subject Ref</button>
                            <button onClick={() => onCropImage(imageContent, onBack)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">✂️ Crop Image</button>
                            <button onClick={() => onUseSettings(imageContent)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">⚙️ Use Settings</button>
                            <button onClick={() => onAddToCollection(imageContent, 'user-saved-prompts')} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">💾 Save Prompt</button>
                            <button 
                                onClick={handleReverseEngineerAndGenerate} 
                                disabled={isReverseEngineering || !ai}
                                className="px-4 py-2 bg-theme-accent/80 text-white font-semibold hover:bg-theme-accent transition duration-300 disabled:bg-opacity-50 disabled:cursor-not-allowed rounded-md"
                            >
                                {isReverseEngineering ? 'Working...' : '🛠️ Reverse Engineer & Generate'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Generated Image */}
                {(isReverseEngineering || generatedResult || error) && (
                    <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-theme-surface p-4 rounded-lg">
                        {isReverseEngineering && <Loader message="Analyzing, Generating & Saving..." />}
                        {error && <div className="text-center text-red-400 p-4"><p className="font-bold">An Error Occurred</p><p className="text-xs mt-1 whitespace-pre-wrap">{error}</p></div>}
                        {generatedResult && (
                            <div className="h-full w-full flex flex-col gap-4">
                                <div className="flex-grow w-full flex items-center justify-center min-h-0">
                                    <img src={generatedResult.src} alt="Generated" className="max-h-full max-w-full object-contain rounded-md"/>
                                </div>
                                <div className="bg-theme-bg p-4 w-full text-sm flex-shrink-0 rounded-lg">
                                    <p className="font-bold text-white mb-2">Generated Prompt:</p>
                                    <p className="text-theme-text-secondary bg-theme-surface p-2 font-mono text-xs max-h-24 overflow-y-auto rounded-md">{generatedResult.prompt}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const CollectionItemCard: React.FC<{ item: CollectionItem; onSelectItem: (item: CollectionItem) => void; onEdit?: (item: CollectionItem) => void; }> = ({ item, onSelectItem, onEdit }) => {
    const { type, content } = item;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (type === 'image') {
        const imageContent = content as StoredImage;
        const displaySrc = imageContent.thumbnailUrl || imageContent.src;
        return (
             <button onClick={() => onSelectItem(item)} className="bg-theme-surface group relative rounded-lg overflow-hidden aspect-square block w-full text-left focus:ring-2 focus:ring-theme-primary outline-none">
                <img 
                    src={displaySrc} 
                    alt="Collection item" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                        e.currentTarget.onerror = null; // prevent infinite loop
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzM3NDExNSI+PHBhdGggZD0iTTE5IDV2MTRINVY1aDE0bTAtMkg1Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDE0YzEuMSAwIDItLjkgMi0yVjdjMC0xLjEtLjktMi0yLTJ6bS00LjUgNmwtMi41IDMuMDEtMS41LTEuODZMOSAxN2g2bC0zLjUtNC41eiIvPjwvc3ZnPg==";
                    }}
                />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center font-bold">View Details</p>
                </div>
            </button>
        );
    }

    if (type === 'user_saved_prompt') {
        const promptContent = content as UserSavedPrompt;
        return (
            <div className="bg-theme-surface p-3 h-40 flex flex-col justify-between border-l-4 border-theme-accent rounded-r-lg">
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-white truncate">{promptContent.title}</p>
                    <p className="text-xs text-theme-text-secondary mt-2 text-ellipsis overflow-hidden h-16">{promptContent.prompt}</p>
                </div>
                <button onClick={() => handleCopy(promptContent.prompt)} className="w-full text-xs bg-theme-surface-2 hover:bg-theme-border text-white py-1.5 px-2 transition mt-2 rounded-md">
                    {isCopied ? 'Copied!' : '📋 Copy Prompt'}
                </button>
            </div>
        );
    }

    if (type === 'prompt') {
        const promptContent = content as { title: string, prompt: string };
        return (
            <div className="bg-theme-surface p-3 h-40 flex flex-col justify-between border-l-4 border-theme-text-secondary rounded-r-lg">
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-white truncate">{promptContent.title}</p>
                    <p className="text-xs text-theme-text-secondary mt-2 text-ellipsis overflow-hidden h-16">{promptContent.prompt}</p>
                </div>
                <button onClick={() => handleCopy(promptContent.prompt)} className="w-full text-xs bg-theme-surface-2 hover:bg-theme-border text-white py-1.5 px-2 transition mt-2 rounded-md">
                    {isCopied ? 'Copied!' : '📋 Copy Prompt'}
                </button>
            </div>
        );
    }
    
    if (type === 'decoded_prompt') {
        return (
            <div className="bg-theme-surface group relative rounded-lg overflow-hidden">
                <div className="p-4 h-40 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl">🧩</span>
                    <p className="text-sm font-bold mt-2">Decoded Prompt</p>
                    <p className="text-xs text-theme-text-secondary mt-1">Ready for Photorealism Studio</p>
                </div>
                 <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                    <p className="text-white text-xs text-center">Cloud Decoded Prompt</p>
                    <button disabled className="w-full text-xs bg-theme-surface-2 text-white py-1 px-2 opacity-50 cursor-not-allowed rounded-md">Move (N/A)</button>
                    <button disabled className="w-full text-xs bg-red-800 text-white py-1 px-2 opacity-50 cursor-not-allowed rounded-md">Delete (N/A)</button>
                </div>
            </div>
        );
    }
    
    if (type === 'template_prompt') {
        const templateContent = content as TemplatePrompt;
        return (
            <div className="bg-theme-surface p-3 h-40 flex flex-col justify-between border-l-4 border-theme-text-secondary group relative rounded-r-lg">
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-white truncate">{templateContent.title}</p>
                    <p className="text-xs text-theme-text-secondary mt-2 text-ellipsis overflow-hidden h-16">{templateContent.prompt}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => handleCopy(templateContent.prompt)} className="flex-grow text-xs bg-theme-surface-2 hover:bg-theme-border text-white py-1.5 px-2 transition rounded-md">
                        {isCopied ? 'Copied!' : '📋 Copy'}
                    </button>
                    <button onClick={() => onEdit && onEdit(item)} className="flex-grow text-xs bg-theme-surface-2 hover:bg-theme-border text-white py-1.5 px-2 transition rounded-md">
                        ✏️ Edit
                    </button>
                </div>
            </div>
        );
    }

    return null; // Fallback for unknown types
};

interface CollectionProps {
    collection: CollectionType;
    onRefresh: () => void;
    isRefreshing: boolean;
    onOpenSettings: () => void;
    onSaveTemplates: (templates: TemplatePrompt[]) => void;
    onUseAsReference: (image: StoredImage) => void;
    onUseSettings: (image: StoredImage) => void;
    onAddToCollection: (image: StoredImage, folderId: string) => void;
    ai: GoogleGenAI | null;
    onSaveAndUpload: (base64Images: string[], prompt: string, settings: any) => Promise<void>;
    onCropImage: (image: StoredImage, onComplete: () => void) => void;
}

export const Collection = ({ collection, onRefresh, isRefreshing, onOpenSettings, onSaveTemplates, onUseAsReference, onUseSettings, onAddToCollection, ai, onSaveAndUpload, onCropImage }: CollectionProps) => {
    const [selectedFolderId, setSelectedFolderId] = useState(collection.folders[0]?.id || null);
    const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
    const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);

    React.useEffect(() => {
        if (!selectedFolderId && collection.folders.length > 0) {
            setSelectedFolderId(collection.folders[0].id);
        }
         if (collection.folders.length > 0 && !collection.folders.find((f) => f.id === selectedFolderId)) {
            setSelectedFolderId(collection.folders[0].id);
        }
    }, [collection.folders, selectedFolderId]);

     React.useEffect(() => {
        // Reset detail/edit views when folder changes
        setSelectedItem(null);
        setEditingItem(null);
    }, [selectedFolderId]);
    
    const selectedFolder = collection.folders.find((f) => f.id === selectedFolderId);
    const isTemplateFolder = selectedFolder?.id === 'ai-prompt-templates';
    
    const handleEditItem = (item: CollectionItem) => {
        setEditingItem(item);
    };
    
    const handleCreateNewTemplate = () => {
        setEditingItem({
            id: `template-${crypto.randomUUID()}`,
            type: 'template_prompt',
            timestamp: Date.now(),
            content: { id: `template-${crypto.randomUUID()}`, title: '', prompt: '' }
        });
    };

    const handleSaveTemplate = (updatedItem: CollectionItem) => {
        const existingItems = selectedFolder?.items || [];
        const itemExists = existingItems.some(item => item.id === updatedItem.id);
        
        let newItems;
        if (itemExists) {
            newItems = existingItems.map(item => item.id === updatedItem.id ? updatedItem : item);
        } else {
            newItems = [...existingItems, updatedItem];
        }
        
        const newTemplates = newItems.map(item => item.content as TemplatePrompt);
        onSaveTemplates(newTemplates);
        setEditingItem(null);
    };
    
    const handleResetTemplates = () => {
        if (window.confirm("Are you sure you want to delete all your custom templates and reset to the defaults? This cannot be undone.")) {
            localStorage.removeItem('user-template-prompts');
            window.location.reload(); // Easiest way to force re-load from JSON file
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full bg-theme-bg/50 p-6 rounded-lg">
            <section className="w-full bg-theme-surface p-4 flex flex-col gap-4 rounded-lg">
                <h2 className="text-xl font-bold text-white">My Collections</h2>
                 <button onClick={onOpenSettings} className="w-full p-2 bg-theme-surface-2 hover:bg-theme-border text-white font-bold transition rounded-md">
                    ⚙️ Settings
                </button>
                 <button onClick={onRefresh} disabled={isRefreshing} className="w-full p-2 bg-theme-primary hover:bg-theme-primary-hover text-white font-bold transition disabled:bg-opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-md">
                    {isRefreshing ? <div className="spinner !w-5 !h-5 !border-white"></div> : '🔄'}
                    Refresh Gallery
                </button>
                <div className="space-y-2">
                    {collection.folders.map((folder) => (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolderId(folder.id)}
                            className={`w-full text-left p-2 font-semibold transition rounded-md ${selectedFolderId === folder.id ? 'bg-theme-primary text-white' : 'bg-theme-surface-2 text-theme-text-secondary hover:bg-theme-border'}`}
                        >
                            {folder.name} ({folder.items.length})
                        </button>
                    ))}
                </div>
                <div className="space-y-2 border-t border-theme-border pt-4">
                     <button disabled className="w-full p-2 bg-theme-surface-2 font-bold transition opacity-50 cursor-not-allowed rounded-md">
                        + New Folder (N/A)
                    </button>
                     <div className="grid grid-cols-2 gap-2">
                        <button disabled className="w-full p-2 bg-theme-surface-2 font-bold transition opacity-50 cursor-not-allowed rounded-md">Export</button>
                        <button disabled className="w-full p-2 bg-theme-surface-2 font-bold transition opacity-50 cursor-not-allowed rounded-md">Import</button>
                    </div>
                </div>
            </section>
            <main className="flex-grow bg-theme-surface p-4 flex flex-col gap-4 relative rounded-lg">
                 {isRefreshing && !editingItem && !selectedItem && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-lg">
                        <Loader message="Refreshing..." />
                    </div>
                )}
                
                {selectedItem?.type === 'image' ? (
                    <ImageDetailView 
                        item={selectedItem}
                        onBack={() => setSelectedItem(null)}
                        onUseAsReference={onUseAsReference}
                        onUseSettings={onUseSettings}
                        onAddToCollection={onAddToCollection}
                        ai={ai}
                        onSaveAndUpload={onSaveAndUpload}
                        onCropImage={onCropImage}
                    />
                ) : isTemplateFolder && editingItem ? (
                    <TemplateEditor item={editingItem} onSave={handleSaveTemplate} onCancel={() => setEditingItem(null)} onReset={handleResetTemplates}/>
                ) : !editingItem && selectedFolder ? (
                    <>
                        <h3 className="text-lg font-bold flex-shrink-0">{selectedFolder.name}</h3>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {selectedFolder.items.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {selectedFolder.items.map((item) => (
                                        <CollectionItemCard 
                                            key={item.id} 
                                            item={item} 
                                            onEdit={isTemplateFolder ? handleEditItem : undefined}
                                            onSelectItem={setSelectedItem}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-theme-text-secondary">
                                    <div>
                                        <p>This folder is empty.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {isTemplateFolder && (
                             <div className="flex-shrink-0 pt-4 border-t border-theme-border">
                                <button onClick={handleCreateNewTemplate} className="px-6 py-2 bg-theme-surface-2 font-bold hover:bg-theme-border transition rounded-md">+ Create New Template</button>
                             </div>
                        )}
                    </>
                ) : (
                     <div className="text-center text-theme-text-secondary flex items-center justify-center h-full">
                        <p>No collections found. Select a folder to view items.</p>
                    </div>
                )}
            </main>
        </div>
    );
};