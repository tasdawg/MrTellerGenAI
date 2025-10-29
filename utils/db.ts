export interface StoredImage {
    id: string;
    src: string;
    prompt: string;
    settings: any;
    timestamp: number;
}

export interface DecodedPrompt {
    gender: string;
    ethnicity: string;
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
    shadowIntensity: string;
    highlightBloom: string;
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

export interface UserSavedPrompt {
    id: string;
    title: string;
    prompt: string;
    timestamp: number;
}

// --- NEW TYPES FOR COLLECTION ---
export type CollectionItemContent = StoredImage | { title: string, prompt: string } | DecodedPrompt | TemplatePrompt | UserSavedPrompt;

export interface CollectionItem {
    id: string;
    type: 'image' | 'prompt' | 'decoded_prompt' | 'template_prompt' | 'user_saved_prompt';
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