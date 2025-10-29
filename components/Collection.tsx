
import React, { useState } from 'react';
import { Collection as CollectionType, CollectionItem, StoredImage, TemplatePrompt, UserSavedPrompt } from '../utils/db';
import { Loader } from './Loader';

const TemplateEditor = ({ item, onSave, onCancel, onReset }: { item: CollectionItem, onSave: (item: CollectionItem) => void, onCancel: () => void, onReset: () => void }) => {
    // FIX: Cast `item.content` to `TemplatePrompt` to resolve type errors.
    // This is safe because `TemplateEditor` is only used for 'template_prompt' items.
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

    return (
        <div className="bg-gray-800 p-6 h-full flex flex-col gap-4">
            <h3 className="text-xl font-bold">{isNew ? "Create New Template" : "Edit Template"}</h3>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Title</label>
                <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="w-full p-2 bg-gray-900 border border-gray-600"
                />
            </div>
            <div className="space-y-2 flex-grow flex flex-col">
                <label className="text-sm font-medium text-gray-400">Prompt</label>
                <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    className="w-full h-full p-2 bg-gray-900 border border-gray-600 resize-none flex-grow"
                    placeholder="Enter your detailed prompt here..."
                />
            </div>
            <div className="flex-shrink-0 flex items-center gap-4">
                <button onClick={handleSave} className="px-6 py-2 bg-gray-300 text-black font-bold hover:bg-gray-400 transition">Save Changes</button>
                <button onClick={onCancel} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 font-bold transition">Cancel</button>
                <div className="flex-grow"></div>
                <button onClick={onReset} className="px-4 py-2 text-sm bg-red-900 hover:bg-red-800 font-bold transition">Reset All Templates to Default</button>
            </div>
        </div>
    );
};

const CollectionItemCard: React.FC<{ item: CollectionItem; onEdit?: (item: CollectionItem) => void; }> = ({ item, onEdit }) => {
    const { type, content } = item;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = (textToCopy: string) => {
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (type === 'image') {
        const imageContent = content as StoredImage;
        return (
             <div className="bg-gray-800 group relative">
                <img src={imageContent.src} alt="Collection item" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                    <p className="text-white text-xs text-center">S3 Image</p>
                    <button disabled className="w-full text-xs bg-gray-700 text-white py-1 px-2 opacity-50 cursor-not-allowed">Move (N/A)</button>
                    <button disabled className="w-full text-xs bg-red-800 text-white py-1 px-2 opacity-50 cursor-not-allowed">Delete (N/A)</button>
                </div>
            </div>
        );
    }

    if (type === 'user_saved_prompt') {
        const promptContent = content as UserSavedPrompt;
        return (
            <div className="bg-gray-800 p-3 h-40 flex flex-col justify-between border-l-2 border-blue-400">
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-white truncate">{promptContent.title}</p>
                    <p className="text-xs text-gray-400 mt-2 text-ellipsis overflow-hidden h-16">{promptContent.prompt}</p>
                </div>
                <button onClick={() => handleCopy(promptContent.prompt)} className="w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-2 transition mt-2">
                    {isCopied ? 'Copied!' : '📋 Copy Prompt'}
                </button>
            </div>
        );
    }

    if (type === 'prompt') {
        const promptContent = content as { title: string, prompt: string };
        return (
            <div className="bg-gray-800 p-3 h-40 flex flex-col justify-between border-l-2 border-gray-500">
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-white truncate">{promptContent.title}</p>
                    <p className="text-xs text-gray-400 mt-2 text-ellipsis overflow-hidden h-16">{promptContent.prompt}</p>
                </div>
                <button onClick={() => handleCopy(promptContent.prompt)} className="w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-2 transition mt-2">
                    {isCopied ? 'Copied!' : '📋 Copy Prompt'}
                </button>
            </div>
        );
    }
    
    if (type === 'decoded_prompt') {
        return (
            <div className="bg-gray-800 group relative">
                <div className="p-4 h-40 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl">🧩</span>
                    <p className="text-sm font-bold mt-2">Decoded Prompt</p>
                    <p className="text-xs text-gray-400 mt-1">Ready for Photorealism Studio</p>
                </div>
                 <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                    <p className="text-white text-xs text-center">S3 Decoded Prompt</p>
                    <button disabled className="w-full text-xs bg-gray-700 text-white py-1 px-2 opacity-50 cursor-not-allowed">Move (N/A)</button>
                    <button disabled className="w-full text-xs bg-red-800 text-white py-1 px-2 opacity-50 cursor-not-allowed">Delete (N/A)</button>
                </div>
            </div>
        );
    }
    
    if (type === 'template_prompt') {
        const templateContent = content as TemplatePrompt;
        return (
            <div className="bg-gray-800 p-3 h-40 flex flex-col justify-between border-l-2 border-gray-500 group relative">
                <div className="overflow-hidden">
                    <p className="font-bold text-sm text-white truncate">{templateContent.title}</p>
                    <p className="text-xs text-gray-400 mt-2 text-ellipsis overflow-hidden h-16">{templateContent.prompt}</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => handleCopy(templateContent.prompt)} className="flex-grow text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-2 transition">
                        {isCopied ? 'Copied!' : '📋 Copy'}
                    </button>
                    <button onClick={() => onEdit && onEdit(item)} className="flex-grow text-xs bg-gray-700 hover:bg-gray-600 text-white py-1.5 px-2 transition">
                        ✏️ Edit
                    </button>
                </div>
            </div>
        );
    }

    return null; // Fallback for unknown types
};

export const Collection = ({ collection, onRefresh, isRefreshing, onAddDummyData, s3Available, onOpenSettings, onSaveTemplates }: { collection: CollectionType, onRefresh: () => void, isRefreshing: boolean, onAddDummyData: () => void, s3Available: boolean, onOpenSettings: () => void, onSaveTemplates: (templates: TemplatePrompt[]) => void }) => {
    const [selectedFolderId, setSelectedFolderId] = useState(collection.folders[0]?.id || null);
    const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
    
    React.useEffect(() => {
        if (!selectedFolderId && collection.folders.length > 0) {
            setSelectedFolderId(collection.folders[0].id);
        }
         if (collection.folders.length > 0 && !collection.folders.find((f) => f.id === selectedFolderId)) {
            setSelectedFolderId(collection.folders[0].id);
        }
    }, [collection.folders, selectedFolderId]);
    
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
        <div className="flex flex-col md:flex-row gap-4 h-full bg-black/50 p-6">
            <aside className="md:w-1/3 lg:w-1/4 bg-gray-900 p-4 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-white">My Collections</h2>
                 <button onClick={onOpenSettings} className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-white font-bold transition">
                    ⚙️ Settings
                </button>
                 <button onClick={onRefresh} disabled={isRefreshing || !s3Available} className="w-full p-2 bg-gray-300 hover:bg-gray-400 text-black font-bold transition disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-2">
                    {isRefreshing ? <div className="spinner !w-5 !h-5 !border-black"></div> : '🔄'}
                    Refresh from S3
                </button>
                <div className="flex-grow overflow-y-auto space-y-2">
                    {collection.folders.map((folder) => (
                        <button
                            key={folder.id}
                            onClick={() => { setSelectedFolderId(folder.id); setEditingItem(null); }}
                            className={`w-full text-left p-2 font-semibold transition ${selectedFolderId === folder.id ? 'bg-gray-300 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {folder.name} ({folder.items.length})
                        </button>
                    ))}
                </div>
                <div className="flex-shrink-0 space-y-2 border-t border-gray-700 pt-4">
                     <button disabled className="w-full p-2 bg-gray-700 font-bold transition opacity-50 cursor-not-allowed">
                        + New Folder (N/A)
                    </button>
                     <div className="grid grid-cols-2 gap-2">
                        <button disabled className="w-full p-2 bg-gray-700 font-bold transition opacity-50 cursor-not-allowed">Export</button>
                        <button disabled className="w-full p-2 bg-gray-700 font-bold transition opacity-50 cursor-not-allowed">Import</button>
                    </div>
                    <button onClick={onAddDummyData} disabled={isRefreshing || !s3Available} className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed">
                        🌱 Seed S3 with Dummy Data
                    </button>
                </div>
            </aside>
            <main className="flex-grow bg-gray-900 p-4 flex flex-col gap-4 relative">
                 {isRefreshing && !editingItem && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <Loader message="Refreshing from S3..." />
                    </div>
                )}
                
                {isTemplateFolder && editingItem && (
                    <TemplateEditor item={editingItem} onSave={handleSaveTemplate} onCancel={() => setEditingItem(null)} onReset={handleResetTemplates}/>
                )}

                {!editingItem && selectedFolder && (
                    <>
                        <h3 className="text-lg font-bold flex-shrink-0">{selectedFolder.name}</h3>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {selectedFolder.items.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {selectedFolder.items.map((item) => (
                                        <CollectionItemCard key={item.id} item={item} onEdit={isTemplateFolder ? handleEditItem : undefined} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-gray-500">
                                    <div>
                                        <p>This folder is empty.</p>
                                        {selectedFolder.id !== 's3-bucket-main' && <p className="text-sm mt-2">You can add new items to this collection.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                        {isTemplateFolder && (
                             <div className="flex-shrink-0 pt-4 border-t border-gray-700">
                                <button onClick={handleCreateNewTemplate} className="px-6 py-2 bg-gray-700 font-bold hover:bg-gray-600 transition">+ Create New Template</button>
                             </div>
                        )}
                    </>
                )}
                
                {!editingItem && !selectedFolder && (
                     <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        {!s3Available && !isRefreshing && <p>S3 connection failed or is not configured. Please use the 'Settings' button.</p>}
                        {s3Available && !isRefreshing && <p>No collections found in S3. Try adding dummy data or generating an image.</p>}
                    </div>
                )}
            </main>
        </div>
    );
};
