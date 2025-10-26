import React, { useState } from 'react';
// Fix: Rename imported 'Collection' type to 'CollectionType' to avoid name collision with the component.
import { Collection as CollectionType, CollectionItem, DecodedPrompt, StoredImage } from '../utils/db';
import { Loader } from './Loader';

const CollectionItemCard = ({ item }: { item: CollectionItem }) => {
    const { type, content } = item;

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

    if (type === 'prompt') {
        const promptContent = content as { prompt: string };
        return (
            <div className="bg-gray-800 group relative">
                <div className="p-4 h-40 overflow-y-auto">
                    <p className="text-xs font-mono text-gray-400">{promptContent.prompt}</p>
                </div>
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                    <p className="text-white text-xs text-center">S3 Prompt</p>
                    <button disabled className="w-full text-xs bg-gray-700 text-white py-1 px-2 opacity-50 cursor-not-allowed">Move (N/A)</button>
                    <button disabled className="w-full text-xs bg-red-800 text-white py-1 px-2 opacity-50 cursor-not-allowed">Delete (N/A)</button>
                </div>
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

    return null; // Fallback for unknown types
};

export const Collection = ({ collection, onRefresh, isRefreshing, onAddDummyData, s3Available }: { collection: CollectionType, onRefresh: () => void, isRefreshing: boolean, onAddDummyData: () => void, s3Available: boolean }) => {
    const [selectedFolderId, setSelectedFolderId] = useState(collection.folders[0]?.id || null);
    
    React.useEffect(() => {
        if (!selectedFolderId && collection.folders.length > 0) {
            setSelectedFolderId(collection.folders[0].id);
        }
         if (collection.folders.length > 0 && !collection.folders.find((f: any) => f.id === selectedFolderId)) {
            setSelectedFolderId(collection.folders[0].id);
        }
    }, [collection.folders, selectedFolderId]);

    const selectedFolder = collection.folders.find((f: any) => f.id === selectedFolderId);

    return (
        <div className="flex flex-col md:flex-row gap-4 h-full bg-black/50 p-6">
            <aside className="md:w-1/3 lg:w-1/4 bg-gray-900 p-4 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-white">My Collections</h2>
                 <button onClick={onRefresh} disabled={isRefreshing || !s3Available} className="w-full p-2 bg-gray-300 hover:bg-gray-400 text-black font-bold transition disabled:bg-gray-800 disabled:text-gray-500 flex items-center justify-center gap-2">
                    {isRefreshing ? <div className="spinner !w-5 !h-5 !border-black"></div> : '🔄'}
                    Refresh from S3
                </button>
                <div className="flex-grow overflow-y-auto space-y-2">
                    {collection.folders.map((folder: any) => (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolderId(folder.id)}
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
            <main className="flex-grow bg-gray-900 p-4 overflow-y-auto relative">
                 {isRefreshing && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <Loader message="Refreshing from S3..." />
                    </div>
                )}
                {selectedFolder ? (
                    <div>
                        <h3 className="text-lg font-bold mb-4">{selectedFolder.name}</h3>
                        {selectedFolder.items.length > 0 ? (
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {selectedFolder.items.map((item: any) => (
                                    <CollectionItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        ) : (
                             <div className="text-center text-gray-500 py-16">
                                <p>This folder is empty.</p>
                                <p className="text-sm mt-2">Generate images in the Creator tab to upload them to your S3 bucket, then click Refresh.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        {!isRefreshing && <p>No collections found in S3. Try adding dummy data or generating an image.</p>}
                    </div>
                )}
            </main>
        </div>
    );
};