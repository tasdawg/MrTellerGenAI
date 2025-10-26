

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { StoredImage, Collection, CollectionFolder, CollectionItem, DecodedPrompt } from './utils/db';
import { uploadToS3, listFromS3, getFromS3, base64ToBlob, getPublicUrl } from './utils/s3';
import { SUBJECT_TYPES, STYLE_PRESETS, LIGHTING_OPTIONS, CAMERA_ANGLES, VARIATION_COUNTS, REFERENCE_USAGE_OPTIONS, SURPRISE_IDEAS, QUICK_CHIPS, DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, CAMERA_MODELS, LENS_TYPES } from './utils/constants';
import { Creator } from './components/Creator';
import { Gallery } from './components/Gallery';
import { Collection as CollectionComponent } from './components/Collection';
import { AITools } from './components/AITools';

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
    const [idea, setIdea] = useState(initialCreatorState?.idea ?? "a dog surfing at sunset");
    const [subjectType, setSubjectType] = useState(initialCreatorState?.subjectType ?? SUBJECT_TYPES[2]);
    const [stylePreset, setStylePreset] = useState(initialCreatorState?.stylePreset ?? STYLE_PRESETS[0]);
    const [lighting, setLighting] = useState(initialCreatorState?.lighting ?? LIGHTING_OPTIONS[1]);
    const [cameraAngle, setCameraAngle] = useState(initialCreatorState?.cameraAngle ?? CAMERA_ANGLES[4]);
    const [qualityBoost, setQualityBoost] = useState(initialCreatorState?.qualityBoost ?? true);
    const [addNegative, setAddNegative] = useState(initialCreatorState?.addNegative ?? true);
    const [variationCount, setVariationCount] = useState(initialCreatorState?.variationCount ?? VARIATION_COUNTS[0]);
    
    const [optimisedPrompt, setOptimisedPrompt] = useState(initialCreatorState?.optimisedPrompt ?? '');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]); // Don't persist generated images
    const [isOptimising, setIsOptimising] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Reference Image State
    const [subjectReferenceImage, setSubjectReferenceImage] = useState(initialCreatorState?.subjectReferenceImage ?? null);
    const [subjectReferenceImageMimeType, setSubjectReferenceImageMimeType] = useState(initialCreatorState?.subjectReferenceImageMimeType ?? '');
    const [styleReferenceImage, setStyleReferenceImage] = useState(initialCreatorState?.styleReferenceImage ?? null);
    const [styleReferenceImageMimeType, setStyleReferenceImageMimeType] = useState(initialCreatorState?.styleReferenceImageMimeType ?? '');
    const [isGettingIdea, setIsGettingIdea] = useState(false);
    const [referenceUsage, setReferenceUsage] = useState(initialCreatorState?.referenceUsage ?? REFERENCE_USAGE_OPTIONS[0]);
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

    // S3 Availability State
    const [s3Available, setS3Available] = useState(true);

    // --- S3 DATA HANDLING ---
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
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
            
            // For now, load everything into a single collection folder
            // Update savedImages for the gallery tab
            const galleryImages = allItems
                .filter(item => item.type === 'image')
                .map(item => item.content as StoredImage);
            setSavedImages(galleryImages);
            
            const s3Folder: CollectionFolder = {
                id: 's3-bucket-main',
                name: 'S3 Bucket',
                items: allItems
            };
            setCollection({ folders: [s3Folder] });
            setS3Available(true); // Connection is OK

        } catch (e: any) {
            console.error("Failed to refresh from S3", e);
            setS3Available(wasAvailable => {
                if (wasAvailable) { // Only show error when transitioning from good to bad state
                    setError(`S3 Connection Failed: ${getS3ErrorMessage(e)}. Images will now be stored in-memory for this session.`);
                }
                return false;
            });
            setSavedImages([]); // Clear any S3-based images
            setCollection({ folders: [] }); // Clear S3-based collection
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Initial load from S3
    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Save creator state to localStorage whenever it changes
    useEffect(() => {
        const creatorStateToSave = {
            idea, subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative,
            variationCount, optimisedPrompt, subjectReferenceImage, subjectReferenceImageMimeType,
            styleReferenceImage, styleReferenceImageMimeType, referenceUsage, strictFaceLock, strictHairLock,
            photorealisticSettings
        };
        try {
            localStorage.setItem('gemini-creator-state', JSON.stringify(creatorStateToSave));
        } catch (error) {
            console.error("Could not save creator state to localStorage", error);
        }
    }, [
        idea, subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative,
        variationCount, optimisedPrompt, subjectReferenceImage, subjectReferenceImageMimeType,
        styleReferenceImage, styleReferenceImageMimeType, referenceUsage, strictFaceLock, strictHairLock,
        photorealisticSettings
    ]);

    useEffect(() => {
        try {
            const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
            setAi(genAI);
        } catch (e) {
            setError("Failed to initialize GoogleGenAI. Please check your API key.");
            console.error(e);
        }
    }, []);

    const optimizePrompt = useCallback(async (currentSettings: any) => {
        if (!ai) return;
        setIsOptimising(true);
        setError(null);
        const qualityBoostText = currentSettings.qualityBoost ? "high detail, sharp focus, ultra-realistic, intricate textures" : "";
        const negativeText = currentSettings.addNegative ? "blurry, distorted, extra limbs, multiple faces, text, watermark, cropped, low quality, bad hands" : "";
        const promptTemplate = `
            You are an expert image prompt formatter.
            Take the user's rough idea and build a clean, high-performing prompt.
            USER IDEA: ${currentSettings.idea}
            Subject type: ${currentSettings.subjectType}
            Style: ${currentSettings.stylePreset}
            Lighting: ${currentSettings.lighting}
            Camera angle: ${currentSettings.cameraAngle}
            ${qualityBoostText ? `Quality Boosters: ${qualityBoostText}` : ""}
            ${negativeText ? `Negative prompt hints: ${negativeText}`: ""}
            Rules: Keep it 1–3 sentences max. Include subject framing, style, lighting, and camera angle. Make it sound natural. Avoid repetition. Output ONLY the final optimised prompt text.
        `;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptTemplate,
            });
            setOptimisedPrompt(response.text.trim());
        } catch (e) {
            setError("Failed to optimize prompt.");
            console.error(e);
        } finally {
            setIsOptimising(false);
        }
    }, [ai]);

    const handleOptimizeClick = () => {
        if (idea.trim()) {
            const currentSettings = { idea, subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative };
            optimizePrompt(currentSettings);
        }
    };

    const handleGenerateImage = async () => {
        if (!ai || !optimisedPrompt) return;
        setIsGenerating(true);
        setGeneratedImages([]);
        setError(null);

        const uploadOrSaveImages = async (imageSrcs: string[]) => {
            const saveToMemory = () => {
                const newStoredImages: StoredImage[] = imageSrcs.map(src => ({
                    id: crypto.randomUUID(),
                    src: src, // The base64 data URL
                    prompt: optimisedPrompt,
                    settings: { subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative },
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
                        prompt: optimisedPrompt,
                        settings: { subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative },
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
        const hasStyle = !!styleReferenceImage;

        try {
            let fidelityInstructions = '';
            if (hasSubject) {
                if (strictFaceLock) {
                    fidelityInstructions += " The face of the subject MUST be an exact, photorealistic match to the reference image (or first image, if two are provided). Do not alter the facial features, structure, or identity.";
                }
                if (strictHairLock) {
                    fidelityInstructions += " The hair color, length, and style of the subject MUST match the reference image (or first image, if two are provided) exactly.";
                }
            }

            if (hasSubject && hasStyle) {
                // Case 1: Subject and Style reference images
                const subjectBase64 = subjectReferenceImage.split(',')[1];
                const styleBase64 = styleReferenceImage.split(',')[1];
                
                const subjectPart = { inlineData: { data: subjectBase64, mimeType: subjectReferenceImageMimeType } };
                const stylePart = { inlineData: { data: styleBase64, mimeType: styleReferenceImageMimeType } };
                const baseText = `Use the first image as the subject reference. Use the second image as the style reference. Recreate the subject from the first image in the artistic style of the second image. The new image should also incorporate the following text description: "${optimisedPrompt}"`;
                const textPart = { text: baseText + fidelityInstructions };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [subjectPart, stylePart, textPart] },
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

            } else if (hasSubject || hasStyle) {
                // Case 2: Only one reference image
                const referenceImage = hasSubject ? subjectReferenceImage : styleReferenceImage;
                const referenceImageMimeType = hasSubject ? subjectReferenceImageMimeType : styleReferenceImageMimeType;
                
                const base64Data = referenceImage.split(',')[1];
                let instructionText = '';
                // If only style image is provided, default usage to 'Use as Style' if it's 'Use as Subject'
                const currentUsage = (hasStyle && referenceUsage === 'Use as Subject') ? 'Use as Style' : referenceUsage;

                switch(currentUsage) {
                    case 'Use as Subject':
                        instructionText = `Take the main subject from the provided image. Create a new image of that same subject but place it in the scene described here: "${optimisedPrompt}". The new image should not use the background or style of the reference image unless specified in the description.` + fidelityInstructions;
                        break;
                    case 'Use as Style':
                        instructionText = `Analyze the artistic style, color palette, and lighting of the provided image. Apply this exact style to a new image depicting the following scene: "${optimisedPrompt}". The subject of the new image should be what's in the text description, not the reference image.`;
                        break;
                    case 'Edit with Prompt':
                        instructionText = `Use the provided image as a base. Edit it according to the following instruction: "${optimisedPrompt}".` + fidelityInstructions;
                        break;
                    default:
                        instructionText = optimisedPrompt;
                }
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ inlineData: { data: base64Data, mimeType: referenceImageMimeType } }, { text: instructionText }] },
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
                // Case 3: No reference images
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: optimisedPrompt,
                    config: { numberOfImages: variationCount, aspectRatio: '1:1' },
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
        navigator.clipboard.writeText(optimisedPrompt).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    
    const handleSurpriseMe = () => {
        const randomIdea = SURPRISE_IDEAS[Math.floor(Math.random() * SURPRISE_IDEAS.length)];
        setIdea(randomIdea);
    };

    const handleQuickChip = (settings: any) => {
        setSubjectType(settings.subject_type);
        setStylePreset(settings.style_preset);
        setLighting(settings.lighting);
        setCameraAngle(settings.camera_angle);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'subject' | 'style') => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'subject') {
                    setSubjectReferenceImage(reader.result as string);
                    setSubjectReferenceImageMimeType(file.type);
                } else { // type === 'style'
                    setStyleReferenceImage(reader.result as string);
                    setStyleReferenceImageMimeType(file.type);
                }
                setVariationCount(1);
            };
            reader.readAsDataURL(file);
        } else {
            setError("Please upload a valid image file (PNG, JPG, etc.).");
        }
        e.target.value = ''; // Allow re-uploading the same file
    };

    const handleRemoveImage = (type: 'subject' | 'style') => {
        if (type === 'subject') {
            setSubjectReferenceImage(null);
            setSubjectReferenceImageMimeType('');
        } else { // type === 'style'
            setStyleReferenceImage(null);
            setStyleReferenceImageMimeType('');
        }
    };

    const handleGetIdeaFromImage = useCallback(async () => {
        if (!ai || !subjectReferenceImage) return;
        setIsGettingIdea(true);
        setError(null);
        setIdea('');
        try {
            const base64Data = subjectReferenceImage.split(',')[1];
            const imagePart = { inlineData: { mimeType: subjectReferenceImageMimeType, data: base64Data } };
            const textPart = { text: "Analyze this image in detail. Describe the main subject, the environment, the lighting, camera angle, and the overall artistic style. Based on your analysis, create a detailed and creative prompt that could be used to generate a similar or inspired image. Output only the prompt text." };
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            setIdea(response.text.trim());
        } catch (e) {
            setError("Failed to get idea from image.");
            console.error(e);
        } finally {
            setIsGettingIdea(false);
        }
    }, [ai, subjectReferenceImage, subjectReferenceImageMimeType]);

    // --- Gallery Handlers ---
    const handleUseAsReference = (image: StoredImage, type: 'subject' | 'style' = 'subject') => {
        // Since image.src could be a public URL or base64, we handle both
        const processImageSrc = (src: string, mime: string) => {
             if (type === 'subject') {
                setSubjectReferenceImage(src);
                setSubjectReferenceImageMimeType(mime);
            } else { // 'style'
                setStyleReferenceImage(src);
                setStyleReferenceImageMimeType(mime);
            }
            setVariationCount(1);
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
        setIdea(image.prompt);
        const { settings } = image;
        setSubjectType(settings.subjectType);
        setStylePreset(settings.stylePreset);
        setLighting(settings.lighting);
        setCameraAngle(settings.cameraAngle);
        setQualityBoost(settings.qualityBoost);
        setAddNegative(settings.addNegative);
        setOptimisedPrompt(image.prompt);
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
    
    const handleApplyDecodedPrompt = (decoded: DecodedPrompt) => {
        if (!decoded) return;
        setPhotorealisticSettings(decoded);
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
                { prompt: 'A majestic lion with a crown of stars', settings: { subjectType: 'Animal', stylePreset: 'Cinematic', lighting: 'Golden hour', cameraAngle: 'Low angle', qualityBoost: true, addNegative: true } },
                { prompt: 'A futuristic cityscape at night with flying cars', settings: { subjectType: 'Landscape', stylePreset: 'Cyberpunk', lighting: 'Neon', cameraAngle: 'Wide', qualityBoost: true, addNegative: true } },
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
    const creatorState = { idea, subjectType, stylePreset, lighting, cameraAngle, qualityBoost, addNegative, variationCount, optimisedPrompt, generatedImages, isOptimising, isGenerating, error, copySuccess, subjectReferenceImage, styleReferenceImage, isGettingIdea, referenceUsage, strictFaceLock, strictHairLock, s3Available, photorealisticSettings };
    const creatorHandlers = { setIdea, setSubjectType, setStylePreset, setLighting, setCameraAngle, setQualityBoost, setAddNegative, setVariationCount, setOptimisedPrompt, setReferenceUsage, handleOptimizeClick, handleGenerateImage, handleCopyPrompt, handleSurpriseMe, handleQuickChip, handleImageUpload, handleRemoveImage, handleGetIdeaFromImage, setStrictFaceLock, setStrictHairLock, setPhotorealisticSettings };
    const aiToolsState = { isDecoding, decodedPromptJson, s3Available };
    const aiToolsHandlers = { handleDecodePrompt, handleSaveDecodedPrompt, handleApplyDecodedPrompt };

    return (
        <div className="h-screen bg-black flex flex-col p-4 gap-4 text-gray-200">
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
                    // Fix: Removed props that are not defined on the CollectionComponent to resolve TypeScript error.
                    <CollectionComponent
                        collection={collection}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                        onAddDummyData={handleAddDummyData}
                        s3Available={s3Available}
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