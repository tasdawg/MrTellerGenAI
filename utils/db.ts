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

export interface TemplatePrompt {
    id: string;
    title: string;
    prompt: string;
}

export interface ReverseEngineeredPrompt {
    id: string;
    name: string;
    date: string;
    prompt: string;
}

// --- NEW TYPES FOR COLLECTION ---
export type CollectionItemContent = StoredImage | { title: string, prompt: string } | DecodedPrompt | TemplatePrompt;

export interface CollectionItem {
    id: string;
    type: 'image' | 'prompt' | 'decoded_prompt' | 'template_prompt';
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
