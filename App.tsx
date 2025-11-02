





import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality, Type, Chat } from "@google/genai";
import { StoredImage, Collection, CollectionFolder, CollectionItem, DecodedPrompt, TemplatePrompt, ReverseEngineeredPrompt, UserSavedPrompt } from './utils/db';
import { setApiConfig, uploadFile, saveJson, getIndexList, getJson, addToIndex } from './utils/api';
import { base64ToBlob, createThumbnail, imageUrlToBase64 } from './utils/helpers';
import { DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, CAMERA_MODELS, LENS_TYPES, CLOTHING_DETAILS_MAP, HAIR_STYLES, HAIR_ACCESSORIES, SKIN_DETAILS, FASHION_AESTHETICS, SHADOW_INTENSITY_OPTIONS, HIGHLIGHT_BLOOM_OPTIONS, GENDERS, ETHNICITIES, ARTISTIC_STYLES } from './utils/constants';
import { Creator } from './components/Creator';
import { Collection as CollectionComponent } from './components/Collection';
import { AITools } from './components/AITools';
import { SettingsModal } from './components/SettingsModal';
import { ReferenceUploader } from './components/ReferenceUploader';
import { ImageCropper } from './components/ImageCropper';


const getApiErrorMessage = (e: any): string => {
    const errorMessage = e.message || 'An unknown error occurred.';
    if (errorMessage.toLowerCase().includes('failed to fetch')) {
        const origin = window.location.origin;
        return `Network Failure: This is likely a CORS issue. Your API server must be configured to allow requests from this app.
(App Origin: ${origin})

Check the browser's developer console for more details.`;
    }
    return errorMessage;
};

const generatePhotorealisticPrompt = (settings: DecodedPrompt) => {
    const subject = settings.gender === 'Female' ? 'woman' : 'man';
    const pronoun = settings.gender === 'Female' ? 'She' : 'He';
    const possessive = settings.gender === 'Female' ? 'Her' : 'His';
    const {
        artisticStyle, ethnicity, dressStyle, dressColor, dressDetails,
        hairStyle, hairAccessory, background, backgroundElements,
        shotPose, action, gaze, cameraModel, lensType, lighting,
        shadowIntensity, highlightBloom, skin, fashionAesthetics, aspectRatio
    } = settings;

    const promptParts = [];

    // Core subject description
    if (artisticStyle !== 'None') {
        promptParts.push(`A ${artisticStyle} image of a ${ethnicity} ${subject}.`);
    } else {
        promptParts.push(`Create a photorealistic image of a ${ethnicity} ${subject}.`);
    }

    // Clothing description
    if (dressStyle !== 'None') {
        const clothingParts = [];
        if (dressColor) clothingParts.push(dressColor);
        if (dressDetails) clothingParts.push(dressDetails);
        clothingParts.push(dressStyle);
        promptParts.push(`${pronoun} is wearing a ${clothingParts.join(' ')}.`);
    }

    // Hair description
    if (hairStyle !== 'None') {
        let hairSentence = `${possessive} hair is ${hairStyle}.`;
        if (hairAccessory !== 'None') {
            hairSentence += ` ${pronoun} has a ${hairAccessory}.`;
        }
        promptParts.push(hairSentence);
    }

    // Background description
    if (background !== 'None') {
        let bgSentence = `The background is ${background}`;
        if (backgroundElements !== 'None') {
            bgSentence += ` with ${backgroundElements}.`;
        }
        promptParts.push(bgSentence + '.');
    }

    // Pose and Action
    if (shotPose !== 'Custom Pose') {
        promptParts.push(`The shot is composed as a ${shotPose}.`);
    } else {
        if (action) {
            const clothingFlows = ['Ancient Chinese Dress', 'Hanfu', 'Qipao', 'Modern Minimalist Gown', 'Bohemian Beach Sundress', 'Japanese Kimono', 'Korean Hanbok', 'Indian Saree', 'Gothic Victorian Ballgown', 'Mermaid Tail Skirt'].includes(dressStyle);
            if (settings.gender === 'Female' && clothingFlows) {
                promptParts.push(`${pronoun} is ${action}. ${possessive} skirt is flowing.`);
            } else {
                promptParts.push(`${pronoun} is ${action}.`);
            }
        }
        if (gaze !== 'None') {
            promptParts.push(`${gaze}.`);
        }
    }

    // Technical details
    if (cameraModel !== 'None' && lensType !== 'None') {
        promptParts.push(`Shot on a ${cameraModel} with a ${lensType}.`);
    }

    if (lighting !== 'None') {
        let lightSentence = `The lighting is ${lighting}`;
        if (shadowIntensity !== 'None' && highlightBloom !== 'None') {
            lightSentence += `, featuring ${shadowIntensity} and ${highlightBloom}.`;
        }
        promptParts.push(lightSentence);
    }
    
    if (skin !== 'None') {
        promptParts.push(`${skin}.`);
    }

    if (fashionAesthetics !== 'None') {
        promptParts.push(`${fashionAesthetics}.`);
    }
    
    promptParts.push(`Aspect ratio ${aspectRatio}`);
    if (artisticStyle === 'Photorealistic' || artisticStyle === 'Hyperrealistic' || artisticStyle === 'None') {
        promptParts.push(`-- hyperrealism.`);
    }

    return promptParts.join(' ');
};

const App = () => {
    // --- State Management ---

    // Load initial creator state from localStorage
    const getInitialCreatorState = () => {
        try {
            const savedStateJSON = localStorage.getItem('gemini-creator-state');
            return savedStateJSON ? JSON.parse(savedStateJSON) : null;
        } catch (error) {
            console.error("Error loading creator state from localStorage", error);
            return null;
        }
    };
    const initialCreatorState = getInitialCreatorState();

    const [activeTab, setActiveTab] = useState('creator');
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [apiKey, setApiKey] = useState('');

    // --- PROMPT STATE REFACTORED ---
    const [userPrompt, setUserPrompt] = useState(initialCreatorState?.userPrompt ?? '');
    const [studioPrompt, setStudioPrompt] = useState(''); // Always generated, never saved
    const [useStudioPrompt, setUseStudioPrompt] = useState(initialCreatorState?.useStudioPrompt ?? true);
    // --- END REFACTOR ---

    const [generatedImages, setGeneratedImages] = useState<string[]>([]); // Don't persist generated images
    const [isGenerating, setIsGenerating] = useState(false);
    const [creatorError, setCreatorError] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Reference Image State
    const [faceReferenceImage, setFaceReferenceImage] = useState(initialCreatorState?.faceReferenceImage ?? null);
    const [faceReferenceImageMimeType, setFaceReferenceImageMimeType] = useState(initialCreatorState?.faceReferenceImageMimeType ?? '');
    const [clothingReferenceImage, setClothingReferenceImage] = useState(initialCreatorState?.clothingReferenceImage ?? null);
    const [clothingReferenceImageMimeType, setClothingReferenceImageMimeType] = useState(initialCreatorState?.clothingReferenceImageMimeType ?? '');
    const [sceneReferenceImage, setSceneReferenceImage] = useState(initialCreatorState?.sceneReferenceImage ?? null);
    const [sceneReferenceImageMimeType, setSceneReferenceImageMimeType] = useState(initialCreatorState?.sceneReferenceImageMimeType ?? '');
    const [backgroundReferenceImage, setBackgroundReferenceImage] = useState(initialCreatorState?.backgroundReferenceImage ?? null);
    const [backgroundReferenceImageMimeType, setBackgroundReferenceImageMimeType] = useState(initialCreatorState?.backgroundReferenceImageMimeType ?? '');

    // Gallery State (now sourced from API or localStorage)
    const [galleryItems, setGalleryItems] = useState<StoredImage[]>([]);

    // Collection State
    const [collection, setCollection] = useState<Collection>({ folders: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [templatePrompts, setTemplatePrompts] = useState<TemplatePrompt[]>([]);
    const [savedReversePrompts, setSavedReversePrompts] = useState<ReverseEngineeredPrompt[]>([]);
    const [userSavedPrompts, setUserSavedPrompts] = useState<UserSavedPrompt[]>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);


    // AI Tools State
    const [isDecoding, setIsDecoding] = useState(false);
    const [decodedPromptJson, setDecodedPromptJson] = useState<DecodedPrompt | null>(null);
    const [reverseEngineerImage, setReverseEngineerImage] = useState<string | null>(null);
    const [reverseEngineerImageMimeType, setReverseEngineerImageMimeType] = useState('');
    const [isReverseEngineering, setIsReverseEngineering] = useState(false);
    const [reverseEngineeredPrompt, setReverseEngineeredPrompt] = useState('');

    // Chat Optimizer State
    const [optimizerChat, setOptimizerChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizerSystemPrompt, setOptimizerSystemPrompt] = useState(initialCreatorState?.optimizerSystemPrompt ?? "You are an expert prompt optimizer for an advanced image generation AI. Your task is to take the user's simple idea or keywords and transform it into a rich, detailed, and evocative prompt. Maintain the core concepts from the user's input, but expand upon them by adding cinematic details, lighting descriptions, artistic styles, and specific composition elements. The final output should be only the optimized prompt, ready to be used for image generation.");


    // Photorealistic Studio State (lifted from component)
    const [photorealisticSettings, setPhotorealisticSettings] = useState<DecodedPrompt>(initialCreatorState?.photorealisticSettings ?? {
        artisticStyle: ARTISTIC_STYLES[1], // Default to Photorealistic
        gender: GENDERS[0],
        ethnicity: ETHNICITIES[0],
        dressStyle: DRESS_STYLES[1],
        dressColor: 'red',
        dressDetails: CLOTHING_DETAILS_MAP[DRESS_STYLES[1]][0],
        hairStyle: HAIR_STYLES[1],
        hairAccessory: HAIR_ACCESSORIES[1],
        background: BACKGROUND_SETTINGS[1],
        backgroundElements: BACKGROUND_ELEMENTS_PRESETS[1],
        action: 'running away from something',
        gaze: GAZE_OPTIONS[1],
        lighting: LIGHTING_PRESETS[1],
        shadowIntensity: SHADOW_INTENSITY_OPTIONS[1],
        highlightBloom: HIGHLIGHT_BLOOM_OPTIONS[1],
        shotPose: SHOT_POSES[0].value,
        cameraModel: CAMERA_MODELS[1],
        lensType: LENS_TYPES[1],
        skin: SKIN_DETAILS[1],
        fashionAesthetics: FASHION_AESTHETICS[1],
        aspectRatio: '9:16',
    });


    // API & Settings State
    const [apiConfig, setApiConfigState] = useState({
        baseUrl: 'https://fastapi.mrteller.win',
        apiKey: 'CHANGE_THIS_TO_A_REAL_SECRET_KEY'
    });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // --- IMAGE CROPPER STATE ---
    const [imageToCrop, setImageToCrop] = useState<{ src: string; onConfirm: (data: string) => void; } | null>(null);


    // --- API KEY & CONFIGURATION HANDLING ---
    useEffect(() => {
        // Load Gemini API Key from localStorage
        const savedApiKey = localStorage.getItem('gemini-api-key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        } else {
            const msg = "Welcome! Please configure your Gemini API Key in settings to enable AI features.";
            setCreatorError(msg);
            setNotification(msg);
            setIsSettingsModalOpen(true);
        }

        // Load custom API config from localStorage
        try {
            const savedApiConfig = localStorage.getItem('api-config');
            if (savedApiConfig) {
                const parsedConfig = JSON.parse(savedApiConfig);
                setApiConfigState(parsedConfig);
            }
        } catch (e) {
            console.error("Failed to load API config from localStorage", e);
        }

        // Load local prompt collections from localStorage
        try {
            const savedTemplates = localStorage.getItem('user-template-prompts');
            if (savedTemplates) {
                setTemplatePrompts(JSON.parse(savedTemplates));
            } else {
                fetch('./prompts/templates.json')
                    .then(response => response.json())
                    .then(data => setTemplatePrompts(data))
                    .catch(error => console.error("Failed to fetch default prompt templates:", error));
            }

            const savedReversed = localStorage.getItem('user-reverse-engineered-prompts');
            setSavedReversePrompts(savedReversed ? JSON.parse(savedReversed) : []);
            
            const savedCreatorPrompts = localStorage.getItem('user-creator-prompts');
            setUserSavedPrompts(savedCreatorPrompts ? JSON.parse(savedCreatorPrompts) : []);

            const savedHistory = localStorage.getItem('user-prompt-history');
            setPromptHistory(savedHistory ? JSON.parse(savedHistory) : []);

        } catch (error) {
            console.error("Failed to load local prompts from localStorage", error);
        }

    }, []);

    useEffect(() => {
        // Whenever apiConfig state changes, update the api utility
        setApiConfig(apiConfig);
    }, [apiConfig]);
    
     useEffect(() => {
        if (apiKey) {
            try {
                const genAI = new GoogleGenAI({ apiKey });
                setAi(genAI);
                // Clear API key related errors if any
                if (creatorError?.includes("API Key")) {
                    setCreatorError(null);
                }
                 if (notification?.includes("API Key")) {
                    setNotification(null);
                }
            } catch (e) {
                const msg = "Failed to initialize GoogleGenAI. Your API key might be invalid. Please check it in Settings.";
                setCreatorError(msg);
                setNotification(msg);
                console.error(e);
                setAi(null);
            }
        } else {
            setAi(null); // No AI instance if no key
        }
    }, [apiKey]);
    
    // Initialize Chat Optimizer instance when AI is ready
    useEffect(() => {
        if (ai) {
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: optimizerSystemPrompt,
                }
            });
            setOptimizerChat(chat);
            setChatHistory([]); // Clear history on re-initialization
        }
    }, [ai, optimizerSystemPrompt]);

    const handleSaveSettings = useCallback(({ apiKey: newApiKey, apiConfig: newApiConfig }) => {
        // Save and update Gemini API Key
        setApiKey(newApiKey);
        localStorage.setItem('gemini-api-key', newApiKey);

        // Save and update Custom API Config
        setApiConfigState(newApiConfig);
        localStorage.setItem('api-config', JSON.stringify(newApiConfig));
        
        setIsSettingsModalOpen(false);
        handleRefresh();
    }, []);


    // --- DATA HANDLING (from API or localStorage) ---
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setNotification(null);
        console.log('[DEBUG] Starting gallery refresh...');
    
        if (apiConfig.baseUrl && apiConfig.apiKey) {
            console.log('[DEBUG] API config found, fetching from:', apiConfig.baseUrl);
            try {
                const indexList = await getIndexList();
                console.log('[DEBUG] Fetched master index list:', JSON.parse(JSON.stringify(indexList)));
    
                const fixUrl = (url: string) => {
                    if (!url) return '';
                    const storageDomain = 'https://storage.mrteller.win';

                    try {
                        const parsedUrl = new URL(url);
                        const apiHostname = new URL(apiConfig.baseUrl).hostname;
                        
                        // If URL points to localhost or the API server, rewrite it to the storage domain.
                        if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === apiHostname) {
                            // The path from backend might be `/storage/image.jpg`. On a dedicated storage domain,
                            // the `/storage` prefix is likely not needed.
                            const pathname = parsedUrl.pathname.replace(/^\/storage/, '');
                            const fixedUrl = `${storageDomain}${pathname}`;
                            console.log(`[DEBUG] Rewriting backend URL: ${url} -> ${fixedUrl}`);
                            return fixedUrl;
                        }
                    } catch (e) {
                        // Catches invalid URLs, which we assume are relative paths/filenames.
                        if (!url.startsWith('http')) {
                            const filename = url.startsWith('/') ? url.substring(1) : url;
                            const fixedUrl = `${storageDomain}/${filename}`;
                            return fixedUrl;
                        }
                        console.warn("[DEBUG] Could not parse URL, returning original:", url, e);
                    }
                    
                    // Return original URL if it's already valid and not pointing to the backend API host.
                    return url;
                };
    
                 const itemPromises = indexList.map(async (entry: any): Promise<StoredImage | null> => {
                    if (entry.image_json_file) { // This is a generated image
                        try {
                            const jsonData = await getJson(entry.image_json_file);
                            console.log(`[DEBUG] Fetched JSON for ${entry.image_json_file}:`, JSON.parse(JSON.stringify(jsonData)));
        
                            const fixedImageUrl = fixUrl(jsonData.imageUrl);
                            const fixedThumbnailUrl = fixUrl(entry.thumbnail);
        
                            const result: StoredImage = {
                                id: entry.image_name,
                                src: fixedImageUrl,
                                publicUrl: fixedImageUrl,
                                thumbnailUrl: fixedThumbnailUrl,
                                prompt: jsonData.prompt,
                                settings: jsonData.settings,
                                timestamp: jsonData.timestamp,
                                isReference: false,
                            };
                            return result;
                        } catch (jsonError) {
                            console.error(`[DEBUG] Failed to fetch or process JSON for ${entry.image_json_file}`, jsonError);
                            return null;
                        }
                    } else { // This is a reference image
                         const storageDomain = 'https://storage.mrteller.win/storage';
                         // Directly prepend the storage domain for reference images, as they are simple filenames.
                         const imageUrl = entry.image_name && !entry.image_name.startsWith('http') 
                             ? `${storageDomain}/${entry.image_name}` 
                             : entry.image_name;
                         const thumbnailUrl = entry.thumbnail && !entry.thumbnail.startsWith('http') 
                             ? `${storageDomain}/${entry.thumbnail}` 
                             : entry.thumbnail;

                         const result: StoredImage = {
                            id: entry.image_name,
                            src: imageUrl,
                            publicUrl: imageUrl,
                            thumbnailUrl: thumbnailUrl,
                            prompt: entry.header,
                            settings: {},
                            timestamp: 0, // No timestamp available from backend for these
                            isReference: true,
                         };
                         return result;
                    }
                });
    
                const settledItems = await Promise.allSettled(itemPromises);
                const successfulItems: StoredImage[] = settledItems
                    .filter(result => {
                        if (result.status === 'rejected') {
                            console.error('[DEBUG] A promise was rejected while processing an item:', result.reason);
                            return false;
                        }
                        if (result.status === 'fulfilled' && !result.value) {
                             console.warn('[DEBUG] A promise resolved to a null/falsy value, skipping item.');
                            return false;
                        }
                        return result.status === 'fulfilled' && result.value;
                    })
                    .map(result => (result as PromiseFulfilledResult<any>).value);
    
                const sortedItems = successfulItems.sort((a, b) => b.timestamp - a.timestamp);
                console.log('[DEBUG] Final items to be set in gallery state:', JSON.parse(JSON.stringify(sortedItems)));
                setGalleryItems(sortedItems);
                console.log('[DEBUG] Gallery refresh from API complete.');
    
            } catch (e: any) {
                console.error("[DEBUG] Failed to refresh from API", e);
                setNotification(`Failed to load gallery from API: ${getApiErrorMessage(e)}. Falling back to local storage.`);
                try {
                    const savedItemsJSON = localStorage.getItem('galleryItems');
                    const savedItems: StoredImage[] = savedItemsJSON ? JSON.parse(savedItemsJSON) : [];
                    setGalleryItems(savedItems.sort((a, b) => b.timestamp - a.timestamp));
                } catch (localError: any) {
                    setNotification(`Failed to load from API and local storage. Error: ${localError.message}`);
                }
            } finally {
                setIsRefreshing(false);
            }
        } else {
            console.log('[DEBUG] API not configured. Falling back to local storage.');
            try {
                const savedItemsJSON = localStorage.getItem('galleryItems');
                const savedItems: StoredImage[] = savedItemsJSON ? JSON.parse(savedItemsJSON) : [];
                setGalleryItems(savedItems.sort((a, b) => b.timestamp - a.timestamp));
                if (savedItems.length > 0) {
                    setNotification("Displaying local cache. Configure backend API in Settings for cloud storage.");
                }
            } catch (e: any) {
                console.error("Failed to refresh from localStorage", e);
                setNotification(`Failed to load gallery from local storage: ${e.message}. Data might be corrupted.`);
                setGalleryItems([]);
            } finally {
                setIsRefreshing(false);
            }
        }
    }, [apiConfig]);


    // Initial load
    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Save creator state to localStorage whenever it changes
    useEffect(() => {
        const creatorStateToSave = {
            userPrompt,
            useStudioPrompt,
            faceReferenceImage,
            faceReferenceImageMimeType,
            clothingReferenceImage,
            clothingReferenceImageMimeType,
            sceneReferenceImage,
            sceneReferenceImageMimeType,
            backgroundReferenceImage,
            backgroundReferenceImageMimeType,
            photorealisticSettings,
            optimizerSystemPrompt,
        };
        try {
            localStorage.setItem('gemini-creator-state', JSON.stringify(creatorStateToSave));
        } catch (error) {
            console.error("Could not save creator state to localStorage", error);
        }
    }, [
        userPrompt, useStudioPrompt,
        faceReferenceImage, faceReferenceImageMimeType,
        clothingReferenceImage, clothingReferenceImageMimeType,
        sceneReferenceImage, sceneReferenceImageMimeType,
        backgroundReferenceImage, backgroundReferenceImageMimeType,
        photorealisticSettings, optimizerSystemPrompt
    ]);
    
    // Save user prompts to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('user-creator-prompts', JSON.stringify(userSavedPrompts));
        } catch (error) {
            console.error("Could not save creator prompts to localStorage", error);
        }
    }, [userSavedPrompts]);

    // Save prompt history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('user-prompt-history', JSON.stringify(promptHistory));
        } catch (error) {
            console.error("Could not save prompt history to localStorage", error);
        }
    }, [promptHistory]);


    // --- COLLECTION BUILDING ---
    useEffect(() => {
        const userSavedFolder: CollectionFolder = {
            id: 'user-saved-prompts',
            name: 'My Saved Prompts',
            items: userSavedPrompts.map((p): CollectionItem => ({
                id: p.id,
                type: 'user_saved_prompt',
                timestamp: p.timestamp,
                content: p,
            })).sort((a, b) => b.timestamp - a.timestamp),
        };

        const templateFolder: CollectionFolder = {
            id: 'ai-prompt-templates',
            name: 'AI Prompt Templates',
            items: templatePrompts.map((p): CollectionItem => ({
                id: p.id,
                type: 'template_prompt',
                timestamp: 0,
                content: p,
            })),
        };

        const reverseEngineeredFolder: CollectionFolder = {
            id: 'reverse-engineered-prompts',
            name: 'Reverse Engineered Prompts',
            items: savedReversePrompts.map((p): CollectionItem => ({
                id: p.id,
                type: 'prompt',
                timestamp: new Date(p.date).getTime(),
                content: { title: p.name, prompt: p.prompt }
            })).sort((a, b) => b.timestamp - a.timestamp)
        };
        
        const cloudStorageFolder: CollectionFolder = {
             id: 'cloud-storage',
             name: 'Cloud Storage',
             items: galleryItems.filter(item => !item.isReference).map((item): CollectionItem => ({
                id: item.id,
                type: 'image',
                timestamp: item.timestamp,
                content: item,
            }))
        };
        
        const referenceImagesFolder: CollectionFolder = {
            id: 'reference-images',
            name: 'Reference Images',
            items: galleryItems.filter(item => item.isReference).map((item): CollectionItem => ({
                id: item.id,
                type: 'image',
                timestamp: item.timestamp,
                content: item,
            }))
        };

        const folders = [cloudStorageFolder, referenceImagesFolder, userSavedFolder, templateFolder, reverseEngineeredFolder];
        
        setCollection({ folders });
    }, [templatePrompts, savedReversePrompts, userSavedPrompts, galleryItems]);

    // --- AUTOMATIC PROMPT GENERATION ---
    const generatePromptPrefix = useCallback((face, clothing, scene, background) => {
        let prefix = '';
        if (face) {
            prefix += `The subject's face must be a 100% photorealistic match to the first reference image, including all facial features, expressions, and skin imperfections. `;
        }
        if (clothing) {
            prefix += `The subject's clothing must be an exact replica of the outfit in the second reference image, matching its style, design, color, and fabric. `;
        }
        if (scene) {
            prefix += `The overall artistic style and composition of the final image must be a 100% match to the third reference image. `;
        }
        if (background) {
            prefix += `The background of the final image must be a faithful recreation of the environment shown in the fourth reference image. `;
        }
        return prefix;
    }, []);

    // --- Studio Prompt Generation ---
    useEffect(() => {
        const basePrompt = generatePhotorealisticPrompt(photorealisticSettings);
        const prefix = generatePromptPrefix(faceReferenceImage, clothingReferenceImage, sceneReferenceImage, backgroundReferenceImage);
        setStudioPrompt(prefix + basePrompt);
    }, [
        photorealisticSettings, 
        faceReferenceImage,
        clothingReferenceImage,
        sceneReferenceImage,
        backgroundReferenceImage,
        generatePromptPrefix
    ]);
    
    // --- Custom Prompt Prefix Management ---
    const prevRefs = useRef({
        face: faceReferenceImage,
        clothing: clothingReferenceImage,
        scene: sceneReferenceImage,
        background: backgroundReferenceImage,
    });
    
    useEffect(() => {
        const { face, clothing, scene, background } = prevRefs.current;
        const oldPrefix = generatePromptPrefix(face, clothing, scene, background);
        const newPrefix = generatePromptPrefix(faceReferenceImage, clothingReferenceImage, sceneReferenceImage, backgroundReferenceImage);

        if (oldPrefix !== newPrefix) {
            setUserPrompt(currentPrompt => {
                const wasEmpty = !oldPrefix.trim();
                // If we're adding a prefix where there was none, prepend it.
                if (wasEmpty && newPrefix.trim()) {
                    return newPrefix + currentPrompt;
                }
                // If the prompt starts with the old prefix, replace it but keep user's additions.
                if (!wasEmpty && currentPrompt.startsWith(oldPrefix)) {
                    const suffix = currentPrompt.substring(oldPrefix.length);
                    return newPrefix + suffix;
                }
                // Otherwise, the user has likely edited the prefix, so we don't touch their prompt.
                return currentPrompt;
            });
        }
        
        // Update refs for the next render
        prevRefs.current = {
            face: faceReferenceImage,
            clothing: clothingReferenceImage,
            scene: sceneReferenceImage,
            background: backgroundReferenceImage,
        };
    }, [faceReferenceImage, clothingReferenceImage, sceneReferenceImage, backgroundReferenceImage, generatePromptPrefix]);


    const handleAddToPromptHistory = (prompt: string) => {
        if (!prompt || prompt.trim() === '') return;
        
        setPromptHistory(prevHistory => {
            const filteredHistory = prevHistory.filter(p => p !== prompt);
            const newHistory = [prompt, ...filteredHistory];
            return newHistory.slice(0, 50); 
        });
    };
    
    const saveAndUploadImages = async (base64Images: string[], prompt: string, settings: any) => {
        if (!apiConfig.baseUrl || !apiConfig.apiKey) {
            setCreatorError("Backend API is not configured. Please go to Settings to enable saving images to cloud storage.");
            return;
        }

        setNotification("Uploading to cloud storage...");

        try {
            for (const base64Image of base64Images) {
                const timestamp = Date.now();
                const uniqueId = crypto.randomUUID();

                // 1. Generate Thumbnail
                const thumbnailBlob = await createThumbnail(base64Image, 256, 256);
                const thumbnailFilename = `thumb-${uniqueId}.jpeg`;

                // 2. Upload Thumbnail
                const thumbUploadResponse = await uploadFile(thumbnailBlob, thumbnailFilename);
                const thumbnailUrl = thumbUploadResponse.public_url;

                // 3. Upload Full Image
                const imageBlob = base64ToBlob(base64Image, 'image/jpeg');
                const imageFilename = `image-${uniqueId}.jpeg`;
                const imageUploadResponse = await uploadFile(imageBlob, imageFilename);
                const imageUrl = imageUploadResponse.public_url;
                const imageName = imageUploadResponse.new_filename;

                // 4. Create and Upload JSON metadata
                const jsonData = {
                    prompt: prompt,
                    settings: settings,
                    timestamp: timestamp,
                    imageUrl: imageUrl,
                };
                const jsonFilename = `prompt-${uniqueId}.json`;
                const jsonSaveResponse = await saveJson(jsonFilename, jsonData);
                const jsonName = jsonSaveResponse.new_filename;

                // 5. Add to Master Index
                const indexEntry = {
                    image_name: imageName,
                    image_json_file: jsonName,
                    thumbnail: thumbnailUrl,
                    header: prompt.substring(0, 100), // Use first 100 chars of prompt as header
                };
                await addToIndex(indexEntry);
            }
            
            setNotification("Successfully saved to cloud storage!");
            setTimeout(() => setNotification(null), 3000);
            
            await handleRefresh();

        } catch (apiError: any) {
            console.error("Cloud API Upload Failed.", apiError);
            const errorMessage = `Cloud sync failed: ${getApiErrorMessage(apiError)}. Image not saved.`;
            setCreatorError(errorMessage);
            setNotification(errorMessage);
        }
    };


    const handleGenerateImage = async () => {
        const promptToUse = useStudioPrompt ? studioPrompt : userPrompt;
        if (!ai || !promptToUse) return;

        handleAddToPromptHistory(promptToUse);
        
        setIsGenerating(true);
        setGeneratedImages([]);
        setCreatorError(null);
        setNotification(null);
        
        const allRefs = [
            { image: faceReferenceImage, mime: faceReferenceImageMimeType },
            { image: clothingReferenceImage, mime: clothingReferenceImageMimeType },
            { image: sceneReferenceImage, mime: sceneReferenceImageMimeType },
            { image: backgroundReferenceImage, mime: backgroundReferenceImageMimeType },
        ];
        const activeRefs = allRefs.filter(ref => !!ref.image);
       
        try {
            const instructionText = promptToUse;

            if (activeRefs.length > 0) {
                // FIX: The parts array was being inferred by TypeScript as containing only
                // image parts, causing a type error when pushing a text part. This new
                // approach constructs the array with both image and text parts at once,
                // allowing TypeScript to correctly infer the union type for its elements.
                const parts = [
                    ...activeRefs.map(ref => {
                        const base64Data = ref.image.split(',')[1];
                        return { inlineData: { data: base64Data, mimeType: ref.mime } };
                    }),
                    { text: instructionText }
                ];

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE] },
                });
                const imageParts = response.candidates[0].content.parts.filter(part => part.inlineData);
                if (imageParts.length > 0) {
                    const images = imageParts.map(part => `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    setGeneratedImages(images);
                    await saveAndUploadImages(images, promptToUse, { photorealisticSettings });
                } else {
                    setCreatorError("The model did not return an image. It might have refused the request. Please try a different prompt or image.");
                }
            } else {
                // Case for no reference image, using Imagen
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: instructionText,
                    config: { numberOfImages: 1, aspectRatio: photorealisticSettings.aspectRatio === '9:16' ? '9:16' : '1:1' },
                });
                const images = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
                setGeneratedImages(images);
                await saveAndUploadImages(images, promptToUse, { photorealisticSettings });
            }
        } catch (e: any) {
             const errorMessage = getApiErrorMessage(e);
            setCreatorError(errorMessage);
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyPrompt = () => {
        const promptToCopy = useStudioPrompt ? studioPrompt : userPrompt;
        navigator.clipboard.writeText(promptToCopy).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    
    const handleSaveCreatorPrompt = (promptToSave: string) => {
        const title = window.prompt("Enter a title for your saved prompt:", "My Awesome Prompt");
        if (title && title.trim()) {
            const newSavedPrompt: UserSavedPrompt = {
                id: `user-${crypto.randomUUID()}`,
                title: title.trim(),
                prompt: promptToSave,
                timestamp: Date.now(),
            };
            setUserSavedPrompts(prev => [...prev, newSavedPrompt]);
            alert(`Prompt "${title.trim()}" saved to "My Saved Prompts" in the Collection tab!`);
        }
    };
    
    const createUploadHandler = (
        setImage: React.Dispatch<React.SetStateAction<string | null>>,
        setMimeType: React.Dispatch<React.SetStateAction<string>>
    ) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setNotification(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setMimeType(file.type);
            };
            reader.readAsDataURL(file);
        } else {
            setNotification("Please upload a valid image file (PNG, JPG, etc.).");
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    const handleFaceImageUpload = createUploadHandler(setFaceReferenceImage, setFaceReferenceImageMimeType);
    const handleClothingImageUpload = createUploadHandler(setClothingReferenceImage, setClothingReferenceImageMimeType);
    const handleSceneImageUpload = createUploadHandler(setSceneReferenceImage, setSceneReferenceImageMimeType);
    const handleBackgroundImageUpload = createUploadHandler(setBackgroundReferenceImage, setBackgroundReferenceImageMimeType);

    const handleRemoveFaceImage = () => { setFaceReferenceImage(null); setFaceReferenceImageMimeType(''); };
    const handleRemoveClothingImage = () => { setClothingReferenceImage(null); setClothingReferenceImageMimeType(''); };
    const handleRemoveSceneImage = () => { setSceneReferenceImage(null); setSceneReferenceImageMimeType(''); };
    const handleRemoveBackgroundImage = () => { setBackgroundReferenceImage(null); setBackgroundReferenceImageMimeType(''); };


    // --- Collection / Gallery Handlers ---
    const handleUseAsReference = async (image: StoredImage) => {
        if (image.src.startsWith('http')) {
            setNotification("Loading reference image...");
            try {
                const base64Image = await imageUrlToBase64(image.src);
                const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
                setFaceReferenceImage(base64Image);
                setFaceReferenceImageMimeType(mimeType);
                setActiveTab('creator');
                setNotification(null);
            } catch (e: any) {
                console.error("Failed to load reference image from URL", e);
                setNotification(`Error: Could not load the selected image as a reference. This can happen due to a network error or if the image server has CORS restrictions. Please try downloading the image and uploading it manually.`);
            }
        } else {
            const mimeType = image.src.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
            setFaceReferenceImage(image.src);
            setFaceReferenceImageMimeType(mimeType);
            setActiveTab('creator');
        }
    };

    const handleUseSettings = (image: StoredImage) => {
        const { settings } = image;
        if (settings.photorealisticSettings) {
            handlePhotorealisticSettingsChange(settings.photorealisticSettings);
        }
        setUserPrompt(image.prompt);
        setUseStudioPrompt(false);
        setActiveTab('creator');
    };

    const handleSaveGalleryPromptToCollection = (image: StoredImage, folderId: string) => {
        if (folderId !== 'user-saved-prompts') {
            alert("Saving gallery items to folders other than 'My Saved Prompts' is not supported yet.");
            return;
        }

        const title = window.prompt("Enter a title for your saved prompt:", `From Image ${image.id.substring(0, 4)}`);
        if (title && title.trim()) {
            const newSavedPrompt: UserSavedPrompt = {
                id: `user-${crypto.randomUUID()}`,
                title: title.trim(),
                prompt: image.prompt,
                timestamp: Date.now(),
            };
            setUserSavedPrompts(prevPrompts => [...prevPrompts, newSavedPrompt]);
            alert(`Prompt "${title.trim()}" saved to "My Saved Prompts"!`);
        }
    };


    // --- AI Tools Handlers ---
    const handleDecodePrompt = useCallback(async (prompt: string) => {
        if (!ai) return;
        setIsDecoding(true);
        setNotification(null);
        setDecodedPromptJson(null);

        const schema = {
            type: Type.OBJECT,
            properties: {
                artisticStyle: { type: Type.STRING, description: "The overall artistic style, e.g., 'Photorealistic', 'Pixar Animation'." },
                gender: { type: Type.STRING, description: "The gender of the subject, e.g., 'Female', 'Male'." },
                ethnicity: { type: Type.STRING, description: "The ethnicity of the subject, e.g., 'East Asian'." },
                dressStyle: { type: Type.STRING, description: "The style of dress, e.g., 'Hanfu', 'Qipao'." },
                dressColor: { type: Type.STRING, description: "The primary color of the clothing." },
                dressDetails: { type: Type.STRING, description: "Specific details about the clothing's appearance." },
                hairStyle: { type: Type.STRING, description: "Description of the hair style." },
                hairAccessory: { type: Type.STRING, description: "Any accessories in the hair." },
                background: { type: Type.STRING, description: "The main background setting, e.g., 'City Wall', 'Ancient Temple'." },
                backgroundElements: { type: Type.STRING, description: "Additional elements in the background." },
                action: { type: Type.STRING, description: "The action or pose of the subject." },
                gaze: { type: Type.STRING, description: "The direction of the subject's gaze." },
                lighting: { type: Type.STRING, description: "The overall lighting style." },
                shadowIntensity: { type: Type.STRING, description: "The intensity and style of shadows." },
                highlightBloom: { type: Type.STRING, description: "The bloom or glow effect of highlights." },
                shotPose: { type: Type.STRING, description: "The specific camera shot or pose composition." },
                cameraModel: { type: Type.STRING, description: "The camera model used." },
                lensType: { type: Type.STRING, description: "The camera lens type used." },
                skin: { type: Type.STRING, description: "Description of the subject's skin." },
                fashionAesthetics: { type: Type.STRING, description: "Overall fashion aesthetic description." },
                aspectRatio: { type: Type.STRING, description: "The aspect ratio, e.g., '9:16'." },
            },
        };

        const instruction = `You are an expert prompt analyzer for an image generation tool specializing in photorealistic Asian cultural styles. Analyze the user's prompt and extract the relevant details into a JSON object matching the provided schema. If a detail is not present in the prompt, use a reasonable default or 'None'.
        USER PROMPT: "${prompt}"`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: instruction,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });
            const jsonString = response.text.trim();
            const parsedJson = JSON.parse(jsonString);
            setDecodedPromptJson(parsedJson);
        } catch (e) {
            setNotification("Failed to decode prompt. The AI might not have understood the input, or the format was incorrect.");
            console.error(e);
        } finally {
            setIsDecoding(false);
        }
    }, [ai]);

    const handleSaveDecodedPrompt = async (decodedJson: DecodedPrompt, folderId: string) => {
        alert("Saving decoded prompts to the backend is not supported in this version.");
    };
    
    const handlePhotorealisticSettingsChange = (newSettings: DecodedPrompt) => {
        setPhotorealisticSettings(newSettings);
    };

    const handleApplyDecodedPrompt = (decoded: DecodedPrompt) => {
        if (!decoded) return;
        handlePhotorealisticSettingsChange(decoded);
        setActiveTab('creator');
        setUseStudioPrompt(true);
    };

    const handleReverseEngineerPrompt = useCallback(async () => {
        if (!ai || !reverseEngineerImage) return;
        setIsReverseEngineering(true);
        setNotification(null);
        setReverseEngineeredPrompt('');

        const instruction = `
            You are an expert at reverse engineering images to create highly detailed, cinematic, and optimized prompts for an image generation AI. Your task is to analyze the provided reference image and generate a new prompt.

            First, think step-by-step. Write down your analysis of the image, covering these aspects:
            - **Subject:** Describe the main person or object.
            - **Composition:** How is the shot framed (e.g., close-up, full-body)? What's the camera angle?
            - **Lighting:** Describe the lighting style (e.g., soft, dramatic, natural).
            - **Style & Mood:** What is the overall artistic style (e.g., cinematic, editorial, candid) and mood (e.g., romantic, mysterious, energetic)?
            - **Details:** Note any important details like clothing, accessories, or background elements.

            IMPORTANT: If the reference image contains a person, the generated prompt MUST include the phrase 'using the original face' or 'without changing the face' to instruct the image generator to preserve the person's likeness.

            After your analysis, provide the final, optimized prompt. The prompt should be structured like the examples provided in your training data.
            Start the final prompt on a new line, prefixed with "--- FINAL PROMPT ---".

            ---

            Now, begin your analysis of the user's uploaded image, followed by the final prompt.
        `;

        try {
            const base64Data = reverseEngineerImage.split(',')[1];
            const imagePart = { inlineData: { mimeType: reverseEngineerImageMimeType, data: base64Data } };
            const textPart = { text: instruction };
            
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });

            let fullResponse = '';
            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullResponse += chunkText;
                    setReverseEngineeredPrompt(fullResponse);
                }
            }

            // After streaming is complete, parse for the final prompt
            const finalPromptMarker = '--- FINAL PROMPT ---';
            const finalPromptIndex = fullResponse.indexOf(finalPromptMarker);
            if (finalPromptIndex !== -1) {
                const finalPrompt = fullResponse.substring(finalPromptIndex + finalPromptMarker.length).trim();
                // Set the state to just the clean prompt for copying and applying
                setReverseEngineeredPrompt(finalPrompt);
            }
            
        } catch (e) {
            setNotification("Failed to reverse engineer the prompt from the image.");
            console.error(e);
        } finally {
            setIsReverseEngineering(false);
        }
    }, [ai, reverseEngineerImage, reverseEngineerImageMimeType]);
    
    const handleApplyReverseEngineeredPrompt = () => {
        if (!reverseEngineeredPrompt || !reverseEngineerImage) return;
        // Set the prompt in the creator
        setUserPrompt(reverseEngineeredPrompt);
        // Set the image as a subject reference in the creator
        setFaceReferenceImage(reverseEngineerImage);
        setFaceReferenceImageMimeType(reverseEngineerImageMimeType);
        // Set the override flag to prevent the Creator's useEffect from overwriting the prompt
        setUseStudioPrompt(false);
        // Switch to the creator tab
        setActiveTab('creator');
    };

    const handleSaveReverseEngineeredPrompt = ({ name, prompt }: { name: string, prompt: string }) => {
        const newEntry: ReverseEngineeredPrompt = {
            id: `rev-${crypto.randomUUID()}`,
            name: name,
            date: new Date().toISOString(),
            prompt: prompt,
        };
        const updated = [...savedReversePrompts, newEntry];
        setSavedReversePrompts(updated);
        localStorage.setItem('user-reverse-engineered-prompts', JSON.stringify(updated));
        alert('Prompt saved to Collection!');
    };


    // --- Collection Handlers ---
    const handleSaveTemplatePrompts = (updatedPrompts: TemplatePrompt[]) => {
        setTemplatePrompts(updatedPrompts);
        localStorage.setItem('user-template-prompts', JSON.stringify(updatedPrompts));
    };
    
    // --- Prompt History Handlers ---
    const handleSelectHistoryPrompt = (prompt: string) => {
        setUserPrompt(prompt);
        setUseStudioPrompt(false);
    };

    const handleClearPromptHistory = () => {
        if (window.confirm("Are you sure you want to clear your entire prompt history? This cannot be undone.")) {
            setPromptHistory([]);
        }
    };

    // --- Chat Optimizer Handler ---
    const handleSendMessageToOptimizer = useCallback(async (message: string) => {
        if (!optimizerChat || !message.trim()) return;

        const userMessage = { role: 'user', text: message };
        setChatHistory(prev => [...prev, userMessage]);
        setIsOptimizing(true);

        try {
            const response = await optimizerChat.sendMessage({ message });
            const modelMessage = { role: 'model', text: response.text };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (e) {
            console.error("Optimizer chat failed", e);
            const errorMessage = { role: 'model', text: "Sorry, I couldn't process that. Please try again." };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsOptimizing(false);
        }
    }, [optimizerChat]);
    
    // --- Image Cropper Handlers ---
    const handleCloseCropper = () => setImageToCrop(null);
    const createCropHandler = (
        image: string | null,
        setImage: (data: string) => void,
        setMime: (mime: string) => void
    ) => () => {
        if (!image) return;
        setImageToCrop({
            src: image,
            onConfirm: (croppedData) => {
                setImage(croppedData);
                const newMimeType = croppedData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
                setMime(newMimeType);
            }
        });
    };
    
    const handleCropFaceReference = createCropHandler(faceReferenceImage, setFaceReferenceImage, setFaceReferenceImageMimeType);
    const handleCropClothingReference = createCropHandler(clothingReferenceImage, setClothingReferenceImage, setClothingReferenceImageMimeType);
    const handleCropSceneReference = createCropHandler(sceneReferenceImage, setSceneReferenceImage, setSceneReferenceImageMimeType);
    const handleCropBackgroundReference = createCropHandler(backgroundReferenceImage, setBackgroundReferenceImage, setBackgroundReferenceImageMimeType);

    const handleCropCollectionImage = async (image: StoredImage, onCropComplete: () => void) => {
        const imageUrl = image.publicUrl || image.src;
        setNotification("Loading image for cropping...");
        try {
            const base64Image = await imageUrlToBase64(imageUrl);
            setNotification(null);
            setImageToCrop({
                src: base64Image,
                onConfirm: async (croppedData) => {
                    setNotification("Saving cropped image as a new item...");
                    const newPrompt = `(Cropped) ${image.prompt}`;
                    await saveAndUploadImages([croppedData], newPrompt, image.settings);
                    onCropComplete(); // This will close the detail view in the collection
                }
            });
        } catch (e: any) {
            setNotification(`Error: Failed to load image for cropping. ${e.message}`);
        }
    };

    // --- Props for children ---
    const isConfigured = !!ai;
    const creatorState = { userPrompt, studioPrompt, useStudioPrompt, generatedImages, isGenerating, error: creatorError, copySuccess, faceReferenceImage, clothingReferenceImage, sceneReferenceImage, backgroundReferenceImage, photorealisticSettings, isConfigured, promptHistory, chatHistory, isOptimizing, optimizerSystemPrompt };
    const creatorHandlers = { setUserPrompt, setUseStudioPrompt, handleGenerateImage, handleCopyPrompt, handleFaceImageUpload, handleRemoveFaceImage, handleClothingImageUpload, handleRemoveClothingImage, handleSceneImageUpload, handleRemoveSceneImage, handleBackgroundImageUpload, handleRemoveBackgroundImage, setPhotorealisticSettings: handlePhotorealisticSettingsChange, handleSelectHistoryPrompt, handleClearPromptHistory, handleSendMessageToOptimizer, setOptimizerSystemPrompt, handleSaveCreatorPrompt, onCropFaceReference: handleCropFaceReference, onCropClothingReference: handleCropClothingReference, onCropSceneReference: handleCropSceneReference, onCropBackgroundReference: handleCropBackgroundReference };
    const aiToolsState = { isDecoding, decodedPromptJson, reverseEngineerImage, isReverseEngineering, reverseEngineeredPrompt };
    const aiToolsHandlers = { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt, setReverseEngineerImage, setReverseEngineerImageMimeType, handleReverseEngineerPrompt, handleApplyReverseEngineeredPrompt, handleSaveReverseEngineeredPrompt };

    return (
        <div className="h-screen bg-theme-bg flex flex-col p-2 md:p-4 gap-4 text-theme-text">
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSaveSettings}
                initialApiKey={apiKey}
                initialApiConfig={apiConfig}
            />
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop.src}
                    onConfirm={(croppedData) => {
                        imageToCrop.onConfirm(croppedData);
                        handleCloseCropper();
                    }}
                    onCancel={handleCloseCropper}
                />
            )}
            <nav className="flex-shrink-0 bg-theme-surface p-2 flex items-center justify-center flex-wrap gap-2 rounded-lg">
                <button onClick={() => setActiveTab('creator')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'creator' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    Creator
                </button>
                 <button onClick={() => setActiveTab('reference_uploader')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'reference_uploader' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    Reference Uploader
                </button>
                <button onClick={() => setActiveTab('collection')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'collection' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    Collection ({collection.folders.reduce((acc, f) => acc + f.items.length, 0)})
                </button>
                 <button onClick={() => setActiveTab('ai_tools')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'ai_tools' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    AI Tools
                </button>
                <div className="hidden sm:flex flex-grow"></div>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 bg-transparent text-theme-text-secondary hover:bg-theme-surface-2 hover:text-white transition rounded-full" aria-label="Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </nav>
            <div className="flex-grow min-h-0">
                {activeTab === 'creator' && (
                    <Creator state={creatorState} handlers={creatorHandlers} collection={collection} />
                )}
                {activeTab === 'reference_uploader' && (
                    <ReferenceUploader onUploadSuccess={handleRefresh} />
                )}
                {activeTab === 'collection' && (
                    <CollectionComponent
                        collection={collection}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onSaveTemplates={handleSaveTemplatePrompts}
                        onUseAsReference={handleUseAsReference}
                        onUseSettings={handleUseSettings}
                        onAddToCollection={handleSaveGalleryPromptToCollection}
                        ai={ai}
                        onSaveAndUpload={saveAndUploadImages}
                        onCropImage={handleCropCollectionImage}
                    />
                )}
                 {activeTab === 'ai_tools' && (
                    <AITools
                        state={aiToolsState}
                        handlers={aiToolsHandlers}
                        collection={collection}
                    />
                )}
            </div>
             {notification && (
                <div className={`absolute bottom-4 right-4 text-white p-4 max-w-sm z-50 shadow-lg rounded-lg ${
                    notification.toLowerCase().startsWith('warning:') ? 'bg-yellow-800' : notification.toLowerCase().includes('error:') ? 'bg-red-800' : 'bg-blue-800'
                }`}>
                    <p className="font-bold">{notification.split(':')[0]}</p>
                    <p className="text-sm whitespace-pre-wrap">{notification.substring(notification.indexOf(':') + 1).trim()}</p>
                    <button onClick={() => setNotification(null)} className="absolute top-1 right-2 text-lg">&times;</button>
                </div>
            )}
        </div>
    );
};

export default App;