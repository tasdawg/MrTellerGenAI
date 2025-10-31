import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type, Chat } from "@google/genai";
import { StoredImage, Collection, CollectionFolder, CollectionItem, DecodedPrompt, TemplatePrompt, ReverseEngineeredPrompt, UserSavedPrompt } from './utils/db';
import { setApiConfig, uploadFile, saveJson } from './utils/api';
import { base64ToBlob } from './utils/helpers';
import { DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, CAMERA_MODELS, LENS_TYPES, CLOTHING_DETAILS_MAP, HAIR_STYLES, HAIR_ACCESSORIES, SKIN_DETAILS, FASHION_AESTHETICS, SHADOW_INTENSITY_OPTIONS, HIGHLIGHT_BLOOM_OPTIONS, GENDERS, ETHNICITIES } from './utils/constants';
import { Creator } from './components/Creator';
import { Gallery } from './components/Gallery';
import { Collection as CollectionComponent } from './components/Collection';
import { AITools } from './components/AITools';
import { SettingsModal } from './components/SettingsModal';
import { AjaxUploader } from './components/AjaxUploader';


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

    const promptParts = [
        `Create a photorealistic image of a ${settings.ethnicity} ${subject}.`,
        `${pronoun} is wearing a ${settings.dressDetails} ${settings.dressColor} ${settings.dressStyle}.`,
        `${possessive} hair is ${settings.hairStyle}. ${pronoun} has a ${settings.hairAccessory}.`,
        `The background is ${settings.background} with ${settings.backgroundElements}.`
    ];

    if (settings.shotPose !== 'Custom Pose') {
         promptParts.push(`The shot is composed as a ${settings.shotPose}.`);
    } else {
        const clothingFlows = ['Ancient Chinese Dress', 'Hanfu', 'Qipao', 'Modern Minimalist Gown', 'Bohemian Beach Sundress', 'Japanese Kimono', 'Korean Hanbok', 'Indian Saree', 'Gothic Victorian Ballgown', 'Mermaid Tail Skirt'].includes(settings.dressStyle);
        if (settings.gender === 'Female' && clothingFlows) {
            promptParts.push(`${pronoun} is ${settings.action}. ${possessive} skirt is flowing.`);
        } else {
            promptParts.push(`${pronoun} is ${settings.action}.`);
        }
        promptParts.push(`${settings.gaze}.`);
    }

    promptParts.push(`Shot on a ${settings.cameraModel} with a ${settings.lensType}.`);
    promptParts.push(`The lighting is ${settings.lighting}, featuring ${settings.shadowIntensity} and ${settings.highlightBloom}.`);
    promptParts.push(`${settings.skin}.`);
    promptParts.push(`${settings.fashionAesthetics}.`);
    promptParts.push(`Aspect ratio ${settings.aspectRatio} -- hyperrealism.`);
    
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
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Reference Image State
    const [subjectReferenceImage, setSubjectReferenceImage] = useState(initialCreatorState?.subjectReferenceImage ?? null);
    const [subjectReferenceImageMimeType, setSubjectReferenceImageMimeType] = useState(initialCreatorState?.subjectReferenceImageMimeType ?? '');
    const [isGettingIdea, setIsGettingIdea] = useState(false);
    const [strictFaceLock, setStrictFaceLock] = useState(initialCreatorState?.strictFaceLock ?? true);
    const [strictHairLock, setStrictHairLock] = useState(initialCreatorState?.strictHairLock ?? true);

    // Gallery State (now sourced from localStorage)
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [savedImages, setSavedImages] = useState<StoredImage[]>([]);
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
        gender: GENDERS[0],
        ethnicity: ETHNICITIES[0],
        dressStyle: DRESS_STYLES[0],
        dressColor: 'red',
        dressDetails: CLOTHING_DETAILS_MAP[DRESS_STYLES[0]][0],
        hairStyle: HAIR_STYLES[0],
        hairAccessory: HAIR_ACCESSORIES[1], // Default to an accessory, not 'None'
        background: BACKGROUND_SETTINGS[0],
        backgroundElements: BACKGROUND_ELEMENTS_PRESETS[0],
        action: 'running away from something',
        gaze: GAZE_OPTIONS[0],
        lighting: LIGHTING_PRESETS[0],
        shadowIntensity: SHADOW_INTENSITY_OPTIONS[0],
        highlightBloom: HIGHLIGHT_BLOOM_OPTIONS[0],
        shotPose: SHOT_POSES[0].value,
        cameraModel: CAMERA_MODELS[0],
        lensType: LENS_TYPES[0],
        skin: SKIN_DETAILS[0],
        fashionAesthetics: FASHION_AESTHETICS[0],
        aspectRatio: '9:16',
    });


    // API & Settings State
    const [apiConfig, setApiConfigState] = useState({
        baseUrl: 'https://fastapi.mrteller.win',
        apiKey: ''
    });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);


    // --- API KEY & CONFIGURATION HANDLING ---
    useEffect(() => {
        // Load Gemini API Key from localStorage
        const savedApiKey = localStorage.getItem('gemini-api-key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        } else {
            setError("Welcome! Please configure your Gemini API Key in settings to enable AI features.");
            setIsSettingsModalOpen(true);
        }

        // Load custom API config from localStorage
        try {
            const savedApiConfig = localStorage.getItem('api-config');
            if (savedApiConfig) {
                const parsedConfig = JSON.parse(savedApiConfig);
                setApiConfigState(parsedConfig);
            } else {
                setError(prev => prev ? `${prev}\n\nYour custom API is not configured. Go to Settings to set it up.` : "Your custom API is not configured. Go to Settings to set it up.");
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
                if (error?.includes("API Key")) {
                    setError(null);
                }
            } catch (e) {
                setError("Failed to initialize GoogleGenAI. Your API key might be invalid. Please check it in Settings.");
                console.error(e);
                setAi(null);
            }
        } else {
            setAi(null); // No AI instance if no key
        }
    }, [apiKey, error]);
    
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


    // --- DATA HANDLING (from localStorage) ---
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            // The API spec doesn't provide a file list endpoint.
            // We rely on localStorage as the source of truth for the gallery.
            const savedItemsJSON = localStorage.getItem('galleryItems');
            const savedItems: StoredImage[] = savedItemsJSON ? JSON.parse(savedItemsJSON) : [];
            
            const sortedItems = savedItems.sort((a, b) => b.timestamp - a.timestamp);

            setGalleryItems(sortedItems);
            setSavedImages(sortedItems);

        } catch (e: any) {
            console.error("Failed to refresh from localStorage", e);
            setError(`Failed to load gallery from local storage: ${e.message}. Data might be corrupted.`);
            setGalleryItems([]);
            setSavedImages([]);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Save creator state to localStorage whenever it changes
    useEffect(() => {
        const creatorStateToSave = {
            userPrompt,
            useStudioPrompt,
            subjectReferenceImage,
            subjectReferenceImageMimeType,
            strictFaceLock,
            strictHairLock,
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
        subjectReferenceImage, subjectReferenceImageMimeType,
        strictFaceLock, strictHairLock,
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
             items: galleryItems.map((item): CollectionItem => ({
                id: item.id,
                type: 'image',
                timestamp: item.timestamp,
                content: item,
            }))
        };
        
        const folders = [userSavedFolder, templateFolder, reverseEngineeredFolder, cloudStorageFolder];
        
        setCollection({ folders });
    }, [templatePrompts, savedReversePrompts, userSavedPrompts, galleryItems]);

    // --- AUTOMATIC PROMPT GENERATION ---
    useEffect(() => {
        const basePrompt = generatePhotorealisticPrompt(photorealisticSettings);
        
        let fidelityInstructions = '';
        const hasSubject = !!subjectReferenceImage;
        if (hasSubject) {
            if (strictFaceLock) {
                fidelityInstructions += "The subject's face MUST be a 100% photorealistic match to the reference image. Do not change any details about the eyes, face, nose, mouth, or ears. The final image must use the exact face from the reference without any deviation. ";
            }
            if (strictHairLock) {
                fidelityInstructions += "The hair color, length, and style of the subject MUST match the reference image exactly. ";
            }
        }
        
        const finalPrompt = fidelityInstructions + basePrompt;
        setStudioPrompt(finalPrompt);

    }, [
        photorealisticSettings, 
        strictFaceLock, 
        strictHairLock, 
        subjectReferenceImage
    ]);

    const handleAddToPromptHistory = (prompt: string) => {
        if (!prompt || prompt.trim() === '') return;
        
        setPromptHistory(prevHistory => {
            const filteredHistory = prevHistory.filter(p => p !== prompt);
            const newHistory = [prompt, ...filteredHistory];
            return newHistory.slice(0, 50); 
        });
    };

    const handleGenerateImage = async () => {
        const promptToUse = useStudioPrompt ? studioPrompt : userPrompt;
        if (!ai || !promptToUse) return;

        handleAddToPromptHistory(promptToUse);
        
        setIsGenerating(true);
        setGeneratedImages([]);
        setError(null);

        const uploadOrSaveImages = async (imageSrcs: string[]) => {
            try {
                let newGalleryItems: StoredImage[] = [];

                for (const src of imageSrcs) {
                    const uuid = crypto.randomUUID();
                    const imageFilename = `image-${uuid}.jpeg`;
                    const jsonFilename = `prompt-${uuid}.json`;
                    const imageBlob = base64ToBlob(src, 'image/jpeg');
                    
                    // 1. Upload image
                    const imageUploadResponse = await uploadFile(imageBlob, imageFilename);
                    const publicUrl = imageUploadResponse.public_url;

                    // 2. Prepare and upload JSON metadata
                    const jsonData = {
                        prompt: promptToUse,
                        settings: { photorealisticSettings },
                        timestamp: Date.now(),
                        imageUrl: publicUrl,
                    };
                    await saveJson(jsonFilename, jsonData);

                    // 3. Create the new item for our local gallery state
                    const newStoredImage: StoredImage = {
                        id: uuid,
                        src: publicUrl,
                        prompt: promptToUse,
                        settings: { photorealisticSettings },
                        timestamp: jsonData.timestamp,
                    };
                    newGalleryItems.push(newStoredImage);
                }

                // 4. Update localStorage
                const currentItemsJSON = localStorage.getItem('galleryItems');
                const currentItems: StoredImage[] = currentItemsJSON ? JSON.parse(currentItemsJSON) : [];
                const updatedItems = [...newGalleryItems, ...currentItems];
                localStorage.setItem('galleryItems', JSON.stringify(updatedItems));

                // 5. Refresh UI
                handleRefresh();

            } catch (apiError: any) {
                console.error("Failed to upload to API", apiError);
                setError(`Upload Failed: ${getApiErrorMessage(apiError)}. The generated image was not saved.`);
            }
        };
        
        const hasSubject = !!subjectReferenceImage;
       
        try {
            const instructionText = promptToUse;

            if (hasSubject) {
                const base64Data = subjectReferenceImage.split(',')[1];
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ inlineData: { data: base64Data, mimeType: subjectReferenceImageMimeType } }, { text: instructionText }] },
                    config: { responseModalities: [Modality.IMAGE] },
                });
                const imageParts = response.candidates[0].content.parts.filter(part => part.inlineData);
                if (imageParts.length > 0) {
                    const images = imageParts.map(part => `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    setGeneratedImages(images);
                    await uploadOrSaveImages(images);
                } else {
                    setError("The model did not return an image. It might have refused the request. Please try a different prompt or image.");
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
                await uploadOrSaveImages(images);
            }
        } catch (e) {
            setError("Failed to generate images. Please try a different prompt.");
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
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSubjectReferenceImage(reader.result as string);
                setSubjectReferenceImageMimeType(file.type);
            };
            reader.readAsDataURL(file);
        } else {
            setError("Please upload a valid image file (PNG, JPG, etc.).");
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    const handleRemoveImage = () => {
        setSubjectReferenceImage(null);
        setSubjectReferenceImageMimeType('');
    };

    const handleGetIdeaFromImage = useCallback(async () => {
        if (!ai || !subjectReferenceImage) return;
        setIsGettingIdea(true);
        setError(null);
        
        try {
            const base64Data = subjectReferenceImage.split(',')[1];
            const imagePart = { inlineData: { mimeType: subjectReferenceImageMimeType, data: base64Data } };
            const textPart = { text: "Analyze this image in detail. Describe the main subject, the environment, the lighting, camera angle, and the overall artistic style. Based on your analysis, create a detailed and creative prompt that could be used to generate a similar or inspired image. Output only the prompt text." };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            // This now feeds into the AI Tools -> Reverse Engineer prompt
            setReverseEngineeredPrompt(response.text.trim());
            setActiveTab('ai_tools');
            // Maybe set the reverse engineer image as well?
            setReverseEngineerImage(subjectReferenceImage);
            setReverseEngineerImageMimeType(subjectReferenceImageMimeType);

        } catch (e) {
            setError("Failed to get idea from image.");
            console.error(e);
        } finally {
            setIsGettingIdea(false);
        }
    }, [ai, subjectReferenceImage, subjectReferenceImageMimeType]);

    // --- Gallery Handlers ---
    const handleUseAsReference = (image: StoredImage) => {
        // Since image.src could be a public URL or base64, we handle both
        const processImageSrc = (src: string, mime: string) => {
            setSubjectReferenceImage(src);
            setSubjectReferenceImageMimeType(mime);
            setActiveTab('creator');
        };

        if (image.src.startsWith('data:')) {
            const mimeType = image.src.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
            processImageSrc(image.src, mimeType);
        } else {
            fetch(image.src)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result as string;
                        processImageSrc(base64String, blob.type || 'image/jpeg');
                    }
                    reader.readAsDataURL(blob);
                }).catch(err => {
                    console.error("Failed to fetch image for reference:", err);
                    setError(`Failed to load reference image from storage: ${getApiErrorMessage(err)}`);
                });
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
    
    const handleUpscaleImage = async (image: StoredImage, aspectRatio: string) => {
       alert("Upscaling is not implemented in this version.");
    };

    const handleSaveGalleryPromptToCollection = (image: StoredImage, folderId: string) => {
        if (folderId !== 'user-saved-prompts') {
            alert("Saving gallery items to folders other than 'My Saved Prompts' is not supported yet.");
            return;
        }

        const title = window.prompt("Enter a title for your saved prompt:", `From Gallery Image ${image.id.substring(0, 4)}`);
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
        setError(null);
        setDecodedPromptJson(null);

        const schema = {
            type: Type.OBJECT,
            properties: {
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

        const instruction = `You are an expert prompt analyzer for an image generation tool specializing in photorealistic Asian cultural styles. Analyze the user's prompt and extract the relevant details into a JSON object matching the provided schema. If a detail is not present in the prompt, use a reasonable default or an empty string.
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
            setError("Failed to decode prompt. The AI might not have understood the input, or the format was incorrect.");
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
        setError(null);
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
            setError("Failed to reverse engineer the prompt from the image.");
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
        setSubjectReferenceImage(reverseEngineerImage);
        setSubjectReferenceImageMimeType(reverseEngineerImageMimeType);
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

    // --- Props for children ---
    const isConfigured = !!ai;
    const creatorState = { userPrompt, studioPrompt, useStudioPrompt, generatedImages, isGenerating, error, copySuccess, subjectReferenceImage, isGettingIdea, strictFaceLock, strictHairLock, photorealisticSettings, isConfigured, promptHistory, chatHistory, isOptimizing, optimizerSystemPrompt };
    const creatorHandlers = { setUserPrompt, setUseStudioPrompt, handleGenerateImage, handleCopyPrompt, handleImageUpload, handleRemoveImage, handleGetIdeaFromImage, setStrictFaceLock, setStrictHairLock, setPhotorealisticSettings: handlePhotorealisticSettingsChange, handleSelectHistoryPrompt, handleClearPromptHistory, handleSendMessageToOptimizer, setOptimizerSystemPrompt, handleSaveCreatorPrompt };
    const aiToolsState = { isDecoding, decodedPromptJson, reverseEngineerImage, isReverseEngineering, reverseEngineeredPrompt };
    const aiToolsHandlers = { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt, setReverseEngineerImage, setReverseEngineerImageMimeType, handleReverseEngineerPrompt, handleApplyReverseEngineeredPrompt, handleSaveReverseEngineeredPrompt };

    return (
        <div className="h-screen bg-theme-bg flex flex-col p-4 gap-4 text-theme-text">
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSaveSettings}
                initialApiKey={apiKey}
                initialApiConfig={apiConfig}
            />
            <nav className="flex-shrink-0 bg-theme-surface p-2 flex items-center justify-center gap-2 rounded-lg">
                <button onClick={() => setActiveTab('creator')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'creator' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    Creator
                </button>
                <button onClick={() => setActiveTab('gallery')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'gallery' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    Gallery ({savedImages.length})
                </button>
                <button onClick={() => setActiveTab('collection')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'collection' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    Collection ({collection.folders.reduce((acc, f) => acc + f.items.length, 0)})
                </button>
                 <button onClick={() => setActiveTab('ai_tools')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'ai_tools' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    AI Tools
                </button>
                <button onClick={() => setActiveTab('ajax_uploader')} className={`px-6 py-2 font-semibold transition rounded-md ${activeTab === 'ajax_uploader' ? 'bg-theme-primary text-white' : 'bg-transparent text-theme-text-secondary hover:bg-theme-surface-2'}`}>
                    AJAX Uploader
                </button>
                <div className="flex-grow"></div>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 bg-transparent text-theme-text-secondary hover:bg-theme-surface-2 hover:text-white transition rounded-full" aria-label="Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </nav>
            <div className="flex-grow min-h-0">
                {activeTab === 'creator' && (
                    <Creator state={creatorState} handlers={creatorHandlers} collection={collection} />
                )}
                {activeTab === 'gallery' && (
                    <Gallery 
                        savedImages={savedImages} 
                        onUseAsReference={handleUseAsReference} 
                        onUseSettings={handleUseSettings}
                        onUpscaleImage={handleUpscaleImage}
                        isUpscaling={isUpscaling}
                        onAddToCollection={handleSaveGalleryPromptToCollection}
                        collection={collection}
                    />
                )}
                {activeTab === 'collection' && (
                    <CollectionComponent
                        collection={collection}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onSaveTemplates={handleSaveTemplatePrompts}
                    />
                )}
                 {activeTab === 'ai_tools' && (
                    <AITools
                        state={aiToolsState}
                        handlers={aiToolsHandlers}
                        collection={collection}
                    />
                )}
                {activeTab === 'ajax_uploader' && (
                    <AjaxUploader />
                )}
            </div>
             {error && (
                <div className="absolute bottom-4 right-4 bg-red-800 text-white p-4 max-w-sm z-50 shadow-lg rounded-lg">
                    <p className="font-bold">An Error Occurred</p>
                    <p className="text-sm whitespace-pre-wrap">{error}</p>
                    <button onClick={() => setError(null)} className="absolute top-1 right-2 text-lg">&times;</button>
                </div>
            )}
        </div>
    );
};

export default App;