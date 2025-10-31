import React, { useState, useEffect } from 'react';
import { Collection, StoredImage } from '../utils/db';
import { Loader } from './Loader';
import { ASPECT_RATIOS } from '../utils/constants';

export const Gallery = ({ savedImages, onUseAsReference, onUseSettings, onUpscaleImage, isUpscaling, collection, onAddToCollection }: { savedImages: StoredImage[], onUseAsReference: any, onUseSettings: any, onUpscaleImage: any, isUpscaling: boolean, collection: Collection, onAddToCollection: (image: StoredImage, folderId: string) => void }) => {
    const [selectedImage, setSelectedImage] = useState<StoredImage | null>(savedImages.length > 0 ? savedImages[0] : null);
    const [showUpscaleOptions, setShowUpscaleOptions] = useState(false);
    const [showCollectionOptions, setShowCollectionOptions] = useState(false);

    useEffect(() => {
        if (!selectedImage && savedImages.length > 0) {
            setSelectedImage(savedImages[0]);
        }
         if (selectedImage && !savedImages.find(img => img.id === selectedImage.id)) {
            setSelectedImage(savedImages.length > 0 ? savedImages[0] : null);
        }
        setShowUpscaleOptions(false);
        setShowCollectionOptions(false);
    }, [savedImages, selectedImage]);

    if (savedImages.length === 0) {
        return (
            <div className="flex-grow bg-theme-bg/50 p-4 flex items-center justify-center rounded-lg">
                <div className="text-center text-theme-text-secondary">
                    <h2 className="text-2xl font-bold mb-2 text-theme-text">Your Gallery is Empty</h2>
                    <p>Generate some images in the Creator tab and save them to see them here.</p>
                </div>
            </div>
        );
    }

    const handleDownload = () => {
        if (!selectedImage) return;
        const link = document.createElement('a');
        link.href = selectedImage.src;
        link.download = `gallery-image-${selectedImage.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative flex flex-col md:flex-row gap-4 h-full bg-theme-bg/50 p-6 rounded-lg">
            {isUpscaling && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 rounded-lg">
                    <Loader message="Upscaling your image..." />
                </div>
            )}
            <div className="md:w-1/3 lg:w-1/4 bg-theme-surface p-2 overflow-y-auto rounded-lg">
                <div className="grid grid-cols-3 gap-2">
                    {savedImages.map((image) => (
                        <img
                            key={image.id}
                            src={image.src}
                            alt="Saved generation"
                            className={`w-full h-full object-cover cursor-pointer aspect-square rounded-md ${selectedImage?.id === image.id ? 'ring-2 ring-theme-primary' : 'hover:ring-2 ring-theme-accent transition'}`}
                            onClick={() => setSelectedImage(image)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex-grow bg-theme-surface p-4 flex items-center justify-center rounded-lg">
                {selectedImage ? (
                    <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
                        <div className="flex-grow w-full flex items-center justify-center min-h-0">
                            <img src={selectedImage.src} alt="Selected" className="max-h-full max-w-full object-contain rounded-md"/>
                        </div>
                        <div className="bg-theme-bg p-4 w-full max-w-3xl text-sm flex-shrink-0 rounded-lg">
                            <p className="font-bold text-white mb-2">Prompt:</p>
                            <p className="text-theme-text-secondary bg-theme-surface p-2 font-mono text-xs max-h-24 overflow-y-auto rounded-md">{selectedImage.prompt}</p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center items-start">
                                <button onClick={handleDownload} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">⬇️ Download</button>
                                <button onClick={() => onUseAsReference(selectedImage)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">🖼️ Use as Subject Ref</button>
                                <button onClick={() => onUseSettings(selectedImage)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">⚙️ Use Settings</button>
                                <div className="relative">
                                    <button onClick={() => setShowCollectionOptions(prev => !prev)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">📦 Add to Collection</button>
                                    {showCollectionOptions && collection.folders.length > 0 && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-theme-surface-2 shadow-lg z-10 text-center rounded-md">
                                            <ul className="py-1">
                                                {collection.folders.map(folder => (
                                                    <li key={folder.id}>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedImage) {
                                                                    onAddToCollection(selectedImage, folder.id);
                                                                }
                                                                setShowCollectionOptions(false);
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-theme-text hover:bg-theme-border"
                                                        >
                                                            {folder.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setShowUpscaleOptions(!showUpscaleOptions)} className="px-4 py-2 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md">✨ Upscale</button>
                            </div>
                            {showUpscaleOptions && (
                                <div className="mt-4 p-4 bg-theme-bg text-center rounded-md">
                                    <p className="font-semibold mb-2 text-white">Choose an aspect ratio to expand to:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {ASPECT_RATIOS.map(ratio => (
                                            <button 
                                                key={ratio}
                                                onClick={() => {
                                                    onUpscaleImage(selectedImage, ratio);
                                                    setShowUpscaleOptions(false);
                                                }}
                                                className="px-3 py-1 bg-theme-surface-2 text-white font-semibold hover:bg-theme-border transition duration-300 rounded-md"
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-theme-text-secondary">Select an image to view.</div>
                )}
            </div>
        </div>
    );
};