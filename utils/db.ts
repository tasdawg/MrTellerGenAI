export interface StoredImage {
    id: string;
    src: string;
    prompt: string;
    settings: any;
    timestamp: number;
}

export interface DecodedPrompt {
    dressStyle: string;
    dressColor: string;
    dressDetails: string;
    hairStyle: string;
    hairAccessory: string;
    background: string;
    backgroundElements: string;
    action: string;
    gaze: string;
    lighting: string;
    shotPose: string;
    cameraModel: string;
    lensType: string;
    skin: string;
    fashionAesthetics: string;
    aspectRatio: string;
}

// --- NEW TYPES FOR COLLECTION ---
export type CollectionItemContent = StoredImage | { prompt: string } | DecodedPrompt;

export interface CollectionItem {
    id: string;
    type: 'image' | 'prompt' | 'decoded_prompt';
    timestamp: number;
    content: CollectionItemContent;
}

export interface CollectionFolder {
    id: string;
    name: string;
    items: CollectionItem[];
}

export interface Collection {
    folders: CollectionFolder[];
}
// --- END OF NEW TYPES ---