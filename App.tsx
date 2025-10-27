import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StoredImage, Collection, CollectionFolder, CollectionItem, DecodedPrompt, TemplatePrompt } from './utils/db';
import { uploadToS3, listFromS3, getFromS3, base64ToBlob, getPublicUrl, setS3Config } from './utils/s3';
import { CONFIG } from './utils/config';
import { DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, CAMERA_MODELS, LENS_TYPES, REVERSE_ENGINEER_EXAMPLES } from './utils/constants';
import { Creator } from './components/Creator';
import { Gallery } from './components/Gallery';
import { Collection as CollectionComponent } from './components/Collection';
import { AITools } from './components/AITools';
import { SettingsModal } from './components/SettingsModal';

// --- HELPER FOR S3 ERROR DIAGNOSIS ---
const getS3ErrorMessage = (e: any): string => {
    const errorMessage = e.message || 'An unknown error occurred.';
    if (errorMessage.toLowerCase().includes('network failure')) {
        const origin = window.location.origin;
        const corsPolicy = `
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]`;
        return `Network Failure: This is a CORS issue. Your MiniIO server must be configured to allow requests from this app.

ACTION REQUIRED:
Apply the following CORS policy to your 'image-gen' bucket on the MiniIO server:
------------------------------------------
${corsPolicy.trim()}
------------------------------------------

After applying this, refresh the page.
(App Origin: ${origin})
`;
    }
    return errorMessage;
};

const parseTemplatePrompts = (): CollectionFolder => {
    const templateItems: CollectionItem[] = [];
    // Split by '---' and remove the first empty element if the string starts with it
    const examples = REVERSE_ENGINEER_EXAMPLES.split('---').filter(s => s.trim().startsWith('EXAMPLE'));
    
    examples.forEach((example, index) => {
        const lines = example.trim().split('\n');
        const title = lines[0].replace('EXAMPLE ', '').replace(' ---', '').trim();
        const prompt = lines.slice(1).join('\n').trim();

        templateItems.push({
            id: `template-${index}`,
            type: 'template_prompt',
            timestamp: Date.now() - index, // ensure stable order
            content: {
                title: `AI Template: ${title}`,
                prompt: prompt,
            } as TemplatePrompt
        });
    });

    return {
        id: 'ai-prompt-templates',
        name: 'AI Prompt Templates',
        items: templateItems,
    };
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

    const [generatedPrompt, setGeneratedPrompt] = useState(initialCreatorState?.generatedPrompt ?? '');
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

    // Gallery State
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [savedImages, setSavedImages] = useState<StoredImage[]>([]);

    // Collection State
    const [collection, setCollection] = useState<Collection>({ folders: [] });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // AI Tools State
    const [isDecoding, setIsDecoding] = useState(false);
    const [decodedPromptJson, setDecodedPromptJson] = useState<DecodedPrompt | null>(null);
    const [reverseEngineerImage, setReverseEngineerImage] = useState<string | null>(null);
    const [reverseEngineerImageMimeType, setReverseEngineerImageMimeType] = useState('');
    const [isReverseEngineering, setIsReverseEngineering] = useState(false);
    const [reverseEngineeredPrompt, setReverseEngineeredPrompt] = useState('');


    // Photorealistic Studio State (lifted from component)
    const [photorealisticSettings, setPhotorealisticSettings] = useState(initialCreatorState?.photorealisticSettings ?? {
        dressStyle: DRESS_STYLES[0],
        dressColor: 'red',
        dressDetails: 'lightweight, flowing, hem and sleeves are long and drape to the floor',
        hairStyle: 'long and loose, with a few strands falling around her face',
        hairAccessory: 'long, flowing red fabric hair accessory',
        background: BACKGROUND_SETTINGS[0],
        backgroundElements: BACKGROUND_ELEMENTS_PRESETS[0],
        action: 'running away from something',
        gaze: GAZE_OPTIONS[0],
        lighting: LIGHTING_PRESETS[0],
        shotPose: SHOT_POSES[0].value,
        cameraModel: CAMERA_MODELS[0],
        lensType: LENS_TYPES[0],
        skin: 'Glowing porcelain skin',
        fashionAesthetics: 'Meticulously detailed fashion aesthetics',
        aspectRatio: '9:16',
    });
    const [isPromptOverridden, setIsPromptOverridden] = useState(initialCreatorState?.isPromptOverridden ?? false);


    // S3 & Settings State
    const [s3Config, setS3ConfigState] = useState(CONFIG.s3);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [s3Available, setS3Available] = useState(true);


    // --- S3 & API KEY CONFIGURATION HANDLING ---
    useEffect(() => {
        // Load API Key from localStorage on initial load
        const savedApiKey = localStorage.getItem('gemini-api-key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
        } else {
            setError("Welcome! Please configure your Gemini API Key in settings to enable AI features.");
            setIsSettingsModalOpen(true);
        }

        // Load S3 config from localStorage on initial load
        try {
            const savedS3Config = localStorage.getItem('s3-config');
            if (savedS3Config) {
                const parsedConfig = JSON.parse(savedS3Config);
                setS3ConfigState(parsedConfig);
            } else {
                setError(prev => prev ? `${prev}\n\nS3 is not configured. Go to Settings > S3 Storage to set it up.` : "S3 is not configured. Please go to the Collection tab to set it up.");
                setS3Available(false);
            }
        } catch (e) {
            console.error("Failed to load S3 config from localStorage", e);
            setS3ConfigState(CONFIG.s3);
        }
    }, []);

    useEffect(() => {
        // Whenever s3Config state changes, update the s3 utility
        setS3Config(s3Config);
    }, [s3Config]);
    
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
    
    const handleSaveSettings = useCallback(({ apiKey: newApiKey, s3Config: newS3Config }) => {
        // Save and update API Key
        setApiKey(newApiKey);
        localStorage.setItem('gemini-api-key', newApiKey);

        // Save and update S3 Config
        setS3ConfigState(newS3Config);
        localStorage.setItem('s3-config', JSON.stringify(newS3Config));
        
        setIsSettingsModalOpen(false);
        
        // Automatically trigger a refresh to test the new S3 config
        handleRefresh();
    }, []);


    // --- S3 DATA HANDLING ---
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);

        const templateFolder = parseTemplatePrompts();
        let s3Folders: CollectionFolder[] = [];

        try {
            const objects = await listFromS3();
            const allItems: CollectionItem[] = [];

            await Promise.all(
                objects.map(async (file) => {
                    const uuid = file.Key.split('-').pop().replace('.json', '');
                    const id = `item-${uuid}`;

                    if (file.Key.startsWith('prompt-')) {
                        const jsonContent = await getFromS3(file.Key);
                        const data = JSON.parse(jsonContent);
                        const imageKey = `image-${uuid}.jpg`;
                        const imageUrl = getPublicUrl(imageKey);
                        
                        const imageItem: StoredImage = {
                            id: uuid,
                            src: imageUrl,
                            prompt: data.prompt,
                            settings: data.settings,
                            timestamp: data.timestamp,
                        };

                        allItems.push({
                            id,
                            type: 'image',
                            timestamp: data.timestamp,
                            content: imageItem,
                        });
                    } else if (file.Key.startsWith('decoded-prompt-')) {
                         const jsonContent = await getFromS3(file.Key);
                         const data = JSON.parse(jsonContent);
                         allItems.push({
                            id,
                            type: 'decoded_prompt',
                            timestamp: data.timestamp,
                            content: data.content as DecodedPrompt,
                         });
                    }
                })
            );

            allItems.sort((a, b) => b.timestamp - a.timestamp);
            
            // Update savedImages for the gallery tab
            const galleryImages = allItems
                .filter(item => item.type === 'image')
                .map(item => item.content as StoredImage);
            setSavedImages(galleryImages);
            
            s3Folders.push({
                id: 's3-bucket-main',
                name: 'S3 Bucket',
                items: allItems
            });

            setS3Available(true); // Connection is OK

        } catch (e: any) {
            console.error("Failed to refresh from S3", e);
            setS3Available(wasAvailable => {
                if (wasAvailable) { // Only show error when transitioning from good to bad state
                    setError(`S3 Connection Failed: ${getS3ErrorMessage(e)}. Images will now be stored in-memory for this session. Please check your S3 configuration in Settings.`);
                }
                return false;
            });
            setSavedImages([]); // Clear any S3-based images
        } finally {
            setCollection({ folders: [templateFolder, ...s3Folders] });
            setIsRefreshing(false);
        }
    }, []);

    // Initial load from S3 after config is settled
    useEffect(() => {
        // A small delay to allow config to be set from localstorage
        const timer = setTimeout(() => {
            handleRefresh();
        }, 100);
        return () => clearTimeout(timer);
    }, [handleRefresh]);

    // Save creator state to localStorage whenever it changes
    useEffect(() => {
        const creatorStateToSave = {
            generatedPrompt, subjectReferenceImage, subjectReferenceImageMimeType,
            strictFaceLock, strictHairLock, photorealisticSettings, isPromptOverridden
        };
        try {
            localStorage.setItem('gemini-creator-state', JSON.stringify(creatorStateToSave));
        } catch (error) {
            console.error("Could not save creator state to localStorage", error);
        }
    }, [
        generatedPrompt, subjectReferenceImage, subjectReferenceImageMimeType,
        strictFaceLock, strictHairLock,
        photorealisticSettings, isPromptOverridden
    ]);

    const handleGenerateImage = async () => {
        if (!ai || !generatedPrompt) return;
        setIsGenerating(true);
        setGeneratedImages([]);
        setError(null);

        const uploadOrSaveImages = async (imageSrcs: string[]) => {
            const saveToMemory = () => {
                const newStoredImages: StoredImage[] = imageSrcs.map(src => ({
                    id: crypto.randomUUID(),
                    src: src, // The base64 data URL
                    prompt: generatedPrompt,
                    settings: { photorealisticSettings },
                    timestamp: Date.now(),
                }));
                setSavedImages(prevImages => [...newStoredImages, ...prevImages]);
            };

            if (!s3Available) {
                saveToMemory();
                return;
            }

            try {
                for (const src of imageSrcs) {
                    const uuid = crypto.randomUUID();
                    const imageKey = `image-${uuid}.jpg`;
                    const jsonKey = `prompt-${uuid}.json`;
                    const imageBlob = base64ToBlob(src, 'image/jpeg');
                    const jsonData = {
                        prompt: generatedPrompt,
                        settings: { photorealisticSettings },
                        timestamp: Date.now(),
                    };
                    const jsonString = JSON.stringify(jsonData, null, 2);
                    const jsonBlob = new Blob([jsonString], { type: 'application/json' });
                    
                    await uploadToS3({ key: imageKey, body: imageBlob, contentType: 'image/jpeg' });
                    await uploadToS3({ key: jsonKey, body: jsonBlob, contentType: 'application/json' });
                }
                await handleRefresh();
            } catch (s3Error: any) {
                console.error("Failed to upload to S3", s3Error);
                setError(`Failed to upload to S3: ${getS3ErrorMessage(s3Error)}. Saving to in-memory gallery instead.`);
                setS3Available(false);
                saveToMemory();
            }
        };
        
        const hasSubject = !!subjectReferenceImage;
       
        try {
            let fidelityInstructions = '';
            if (hasSubject) {
                if (strictFaceLock) {
                    fidelityInstructions += "The face of the subject MUST be an exact, photorealistic match to the reference image. Do not alter the facial features, structure, or identity. ";
                }
                if (strictHairLock) {
                    fidelityInstructions += "The hair color, length, and style of the subject MUST match the reference image exactly. ";
                }
            }
            
            const instructionText = fidelityInstructions + generatedPrompt;

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
        navigator.clipboard.writeText(generatedPrompt).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
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
                    setError(`Failed to load reference image from S3: ${getS3ErrorMessage(err)}`);
                });
        }
    };

    const handleUseSettings = (image: StoredImage) => {
        const { settings } = image;
        if (settings.photorealisticSettings) {
            handlePhotorealisticSettingsChange(settings.photorealisticSettings);
        }
        setGeneratedPrompt(image.prompt);
        setActiveTab('creator');
    };
    
    const handleUpscaleImage = async (image: StoredImage, aspectRatio: string) => {
       alert("Upscaling is not compatible with S3 storage in this version.");
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
        if (!s3Available) {
            setError("Cannot save decoded prompt. S3 is unavailable.");
            return;
        }
        setError(null);
        try {
            const uuid = crypto.randomUUID();
            const jsonKey = `decoded-prompt-${uuid}.json`;
            const dataToSave = {
                timestamp: Date.now(),
                content: decodedJson
            };
            const jsonBlob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
            await uploadToS3({ key: jsonKey, body: jsonBlob, contentType: 'application/json' });
            await handleRefresh();
        } catch (s3Error: any) {
             console.error("Failed to save decoded prompt to S3", s3Error);
             setError(`Failed to save to S3: ${getS3ErrorMessage(s3Error)}`);
        }
    };
    
    const handlePhotorealisticSettingsChange = (newSettings: DecodedPrompt) => {
        setPhotorealisticSettings(newSettings);
        setIsPromptOverridden(false);
    };

    const handleApplyDecodedPrompt = (decoded: DecodedPrompt) => {
        if (!decoded) return;
        handlePhotorealisticSettingsChange(decoded);
        setActiveTab('creator');
    };

    const handleReverseEngineerPrompt = useCallback(async () => {
        if (!ai || !reverseEngineerImage) return;
        setIsReverseEngineering(true);
        setError(null);
        setReverseEngineeredPrompt('');

        const instruction = `
            You are an expert at reverse engineering images to create highly detailed, cinematic, and optimized prompts for an image generation AI. Your task is to analyze the provided reference image and generate a new prompt in the style of the provided examples.

            First, think step-by-step. Write down your analysis of the image, covering these aspects:
            - **Subject:** Describe the main person or object.
            - **Composition:** How is the shot framed (e.g., close-up, full-body)? What's the camera angle?
            - **Lighting:** Describe the lighting style (e.g., soft, dramatic, natural).
            - **Style & Mood:** What is the overall artistic style (e.g., cinematic, editorial, candid) and mood (e.g., romantic, mysterious, energetic)?
            - **Details:** Note any important details like clothing, accessories, or background elements.

            IMPORTANT: If the reference image contains a person, the generated prompt MUST include the phrase 'using the original face' or 'without changing the face' to instruct the image generator to preserve the person's likeness.

            After your analysis, provide the final, optimized prompt. The prompt should be structured like the examples provided below.
            Start the final prompt on a new line, prefixed with "--- FINAL PROMPT ---".

            Here are examples of the desired prompt structure and style:
            ${REVERSE_ENGINEER_EXAMPLES}

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
        setGeneratedPrompt(reverseEngineeredPrompt);
        // Set the image as a subject reference in the creator
        setSubjectReferenceImage(reverseEngineerImage);
        setSubjectReferenceImageMimeType(reverseEngineerImageMimeType);
        // Set the override flag to prevent the Creator's useEffect from overwriting the prompt
        setIsPromptOverridden(true);
        // Switch to the creator tab
        setActiveTab('creator');
    };

    // --- Collection Handlers ---
    const handleAddDummyData = async () => {
        if (!s3Available) {
            setError("Cannot add dummy data. S3 is unavailable.");
            return;
        }
        setIsRefreshing(true);
        setError(null);
        try {
            const dummyItems = [
                { prompt: 'A majestic lion with a crown of stars', settings: { photorealisticSettings: { ...photorealisticSettings, action: 'staring majestically' } } },
                { prompt: 'A futuristic cityscape at night with flying cars', settings: { photorealisticSettings: { ...photorealisticSettings, background: 'Modern City Street', backgroundElements: 'Neon-lit cyberpunk alleyway' } } },
            ];
            // A tiny 1x1 black pixel GIF
            const placeholderImg = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            const imageBlob = base64ToBlob(placeholderImg, 'image/gif');

            for (const item of dummyItems) {
                const uuid = crypto.randomUUID();
                const imageKey = `image-${uuid}.jpg`;
                const jsonKey = `prompt-${uuid}.json`;

                const jsonData = {
                    prompt: item.prompt,
                    settings: item.settings,
                    timestamp: Date.now(),
                };
                const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                
                await uploadToS3({ key: imageKey, body: imageBlob, contentType: 'image/jpeg' });
                await uploadToS3({ key: jsonKey, body: jsonBlob, contentType: 'application/json' });
            }
            await handleRefresh();
        } catch (e: any) {
            console.error("Failed to add dummy data", e);
            setError(`Failed to add dummy data to S3: ${getS3ErrorMessage(e)}`);
        } finally {
            setIsRefreshing(false);
        }
    };

    // --- Props for children ---
    const creatorState = { generatedPrompt, generatedImages, isGenerating, error, copySuccess, subjectReferenceImage, isGettingIdea, strictFaceLock, strictHairLock, s3Available, photorealisticSettings, isConfigured: !!ai, isPromptOverridden };
    const creatorHandlers = { setGeneratedPrompt, handleGenerateImage, handleCopyPrompt, handleImageUpload, handleRemoveImage, handleGetIdeaFromImage, setStrictFaceLock, setStrictHairLock, setPhotorealisticSettings: handlePhotorealisticSettingsChange };
    const aiToolsState = { isDecoding, decodedPromptJson, s3Available, reverseEngineerImage, isReverseEngineering, reverseEngineeredPrompt };
    const aiToolsHandlers = { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt, setReverseEngineerImage, setReverseEngineerImageMimeType, handleReverseEngineerPrompt, handleApplyReverseEngineeredPrompt };

    return (
        <div className="h-screen bg-black flex flex-col p-4 gap-4 text-gray-200">
            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSaveSettings}
                initialApiKey={apiKey}
                initialS3Config={s3Config}
            />
            <nav className="flex-shrink-0 bg-gray-900 p-2 flex items-center justify-center gap-2">
                <button onClick={() => setActiveTab('creator')} className={`px-6 py-2 font-semibold transition ${activeTab === 'creator' ? 'bg-gray-300 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    Creator
                </button>
                <button onClick={() => setActiveTab('gallery')} className={`px-6 py-2 font-semibold transition ${activeTab === 'gallery' ? 'bg-gray-300 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    Gallery ({savedImages.length})
                </button>
                <button onClick={() => setActiveTab('collection')} className={`px-6 py-2 font-semibold transition ${activeTab === 'collection' ? 'bg-gray-300 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    Collection ({collection.folders.reduce((acc, f) => acc + f.items.length, 0)})
                </button>
                 <button onClick={() => setActiveTab('ai_tools')} className={`px-6 py-2 font-semibold transition ${activeTab === 'ai_tools' ? 'bg-gray-300 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    AI Tools
                </button>
                <div className="flex-grow"></div>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition" aria-label="Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </nav>
            <div className="flex-grow min-h-0">
                {activeTab === 'creator' && (
                    <Creator state={creatorState} handlers={creatorHandlers} collection={collection} onSavePrompt={() => alert("Save Prompt to S3 not implemented yet.")} />
                )}
                {activeTab === 'gallery' && (
                    <Gallery 
                        savedImages={savedImages} 
                        onUseAsReference={handleUseAsReference} 
                        onUseSettings={handleUseSettings}
                        onUpscaleImage={handleUpscaleImage}
                        isUpscaling={isUpscaling}
                        onAddToCollection={() => {}}
                        collection={collection}
                    />
                )}
                {activeTab === 'collection' && (
                    <CollectionComponent
                        collection={collection}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        onAddDummyData={handleAddDummyData}
                        s3Available={s3Available}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
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
             {error && (
                <div className="absolute bottom-4 right-4 bg-red-800 text-white p-4 max-w-sm z-50 shadow-lg">
                    <p className="font-bold">An Error Occurred</p>
                    <p className="text-sm whitespace-pre-wrap">{error}</p>
                    <button onClick={() => setError(null)} className="absolute top-1 right-2 text-lg">&times;</button>
                </div>
            )}
        </div>
    );
};

export default App;