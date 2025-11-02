import React from 'react';
import { DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, ASPECT_RATIOS, CAMERA_MODELS, LENS_TYPES, CLOTHING_DETAILS_MAP, HAIR_STYLES, HAIR_ACCESSORIES, SKIN_DETAILS, FASHION_AESTHETICS, RANDOM_COLORS, SHADOW_INTENSITY_OPTIONS, HIGHLIGHT_BLOOM_OPTIONS, GENDERS, ETHNICITIES, ARTISTIC_STYLES } from '../utils/constants';
import { renderFormControl } from '../utils/ui';
import { DecodedPrompt } from '../utils/db';

interface PhotorealisticSectionProps {
    settings: DecodedPrompt;
    onSettingsChange: (newSettings: DecodedPrompt) => void;
    isReferenceImageUsed: boolean;
}

export const PhotorealisticSection = ({ settings, onSettingsChange, isReferenceImageUsed }: PhotorealisticSectionProps) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'dressStyle') {
            // When dress style changes, update the style and reset details to the first option for that style.
            const newDetails = (CLOTHING_DETAILS_MAP as any)[value]?.[0] || '';
            onSettingsChange({ ...settings, dressStyle: value, dressDetails: newDetails });
        } else {
            onSettingsChange({ ...settings, [name]: value });
        }
    };

    const handleRandomize = () => {
        const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
        const getRandomExcludingNone = (arr: any[]) => {
            const filtered = arr.slice(1); // Exclude "None"
            return filtered[Math.floor(Math.random() * filtered.length)];
        }

        const randomSettings: DecodedPrompt = { ...settings };

        if (!isReferenceImageUsed) {
            randomSettings.gender = getRandom(GENDERS);
            randomSettings.ethnicity = getRandom(ETHNICITIES);
        }
        
        randomSettings.artisticStyle = getRandom(ARTISTIC_STYLES);
        randomSettings.dressStyle = getRandom(DRESS_STYLES);
        if (randomSettings.dressStyle !== 'None') {
            randomSettings.dressColor = getRandom(RANDOM_COLORS);
            const detailsForStyle = (CLOTHING_DETAILS_MAP as any)[randomSettings.dressStyle] || [];
            randomSettings.dressDetails = getRandom(detailsForStyle);
        }
        
        randomSettings.hairStyle = getRandom(HAIR_STYLES);
        randomSettings.hairAccessory = getRandom(HAIR_ACCESSORIES);
        randomSettings.background = getRandom(BACKGROUND_SETTINGS);
        randomSettings.backgroundElements = getRandom(BACKGROUND_ELEMENTS_PRESETS);
        
        const randomPose = getRandom(SHOT_POSES);
        randomSettings.shotPose = randomPose.value;

        if (randomSettings.shotPose === 'Custom Pose') {
            randomSettings.action = 'running away from something';
            randomSettings.gaze = getRandom(GAZE_OPTIONS);
        }
        
        randomSettings.cameraModel = getRandom(CAMERA_MODELS);
        randomSettings.lensType = getRandom(LENS_TYPES);
        randomSettings.lighting = getRandom(LIGHTING_PRESETS);
        randomSettings.shadowIntensity = getRandom(SHADOW_INTENSITY_OPTIONS);
        randomSettings.highlightBloom = getRandom(HIGHLIGHT_BLOOM_OPTIONS);
        randomSettings.skin = getRandom(SKIN_DETAILS);
        randomSettings.fashionAesthetics = getRandom(FASHION_AESTHETICS);
        randomSettings.aspectRatio = getRandom(ASPECT_RATIOS);

        onSettingsChange(randomSettings);
    };

    const handleClear = () => {
        const clearedSettings: DecodedPrompt = {
            ...settings, // Start with current settings to preserve essentials like gender, ethnicity, aspect ratio
            artisticStyle: 'None',
            dressStyle: 'None',
            dressColor: '',
            dressDetails: 'None',
            hairStyle: 'None',
            hairAccessory: 'None',
            background: 'None',
            backgroundElements: 'None',
            action: '',
            gaze: 'None',
            lighting: 'None',
            shadowIntensity: 'None',
            highlightBloom: 'None',
            shotPose: 'Custom Pose', // Reset to custom pose as a neutral default
            cameraModel: 'None',
            lensType: 'None',
            skin: 'None',
            fashionAesthetics: 'None',
        };
        onSettingsChange(clearedSettings);
    };


    const baseInputClasses = "w-full px-2 py-1.5 text-sm bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";
    const disabledInputClasses = "disabled:opacity-50 disabled:cursor-not-allowed";

    // Get the clothing detail options for the currently selected style.
    const dressDetailOptions: string[] = (CLOTHING_DETAILS_MAP as any)[settings.dressStyle] || [];
    // Ensure the currently set detail is in the list (for loading from localStorage).
    if (settings.dressDetails && !dressDetailOptions.includes(settings.dressDetails)) {
        dressDetailOptions.unshift(settings.dressDetails);
    }

    const ensureOption = (options: any[], value: any) => {
        if (value && !options.includes(value)) {
            return [value, ...options];
        }
        return options;
    };

    const isClothingDisabled = settings.dressStyle === 'None';

    return (
        <div className="space-y-4">
            <p className="text-xs text-theme-text-secondary">This tool helps construct a detailed prompt. For best results, upload a clear 'Face Reference' image first. The prompt will update in real-time in the generation box.</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <button 
                    onClick={handleRandomize}
                    className="w-full py-2 px-4 bg-theme-surface-2 hover:bg-theme-border text-white font-bold transition duration-300 flex items-center justify-center gap-2 rounded-md"
                >
                    🎲 Randomize
                </button>
                 <button 
                    onClick={handleClear}
                    className="w-full py-2 px-4 bg-theme-surface-2 hover:bg-theme-border text-white font-bold transition duration-300 flex items-center justify-center gap-2 rounded-md"
                >
                    🧹 Clear All
                </button>
            </div>


            <div className="space-y-4 border-b border-theme-border pb-4 mb-4">
                <h3 className="text-base font-semibold text-white">Subject</h3>
                {isReferenceImageUsed && (
                    <p className="text-xs text-theme-text-secondary/80 italic -mt-2">Gender & Ethnicity are controlled by the reference image.</p>
                )}
                {renderFormControl("Gender", <select name="gender" value={settings.gender} onChange={handleChange} disabled={isReferenceImageUsed} className={`${baseInputClasses} ${disabledInputClasses}`}> {GENDERS.map(s => <option key={s}>{s}</option>)} </select>)}
                {renderFormControl("Ethnicity", <select name="ethnicity" value={settings.ethnicity} onChange={handleChange} disabled={isReferenceImageUsed} className={`${baseInputClasses} ${disabledInputClasses}`}> {ETHNICITIES.map(s => <option key={s}>{s}</option>)} </select>)}
            </div>

             <h3 className="text-base font-semibold text-white">Styling &amp; Environment</h3>
            
            {renderFormControl("Artistic Style", <select name="artisticStyle" value={settings.artisticStyle} onChange={handleChange} className={baseInputClasses}> {ensureOption(ARTISTIC_STYLES, settings.artisticStyle).map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Clothing Style", <select name="dressStyle" value={settings.dressStyle} onChange={handleChange} className={baseInputClasses}> {ensureOption(DRESS_STYLES, settings.dressStyle).map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Clothing Color", <input type="text" name="dressColor" value={settings.dressColor} onChange={handleChange} disabled={isClothingDisabled} className={`${baseInputClasses} ${disabledInputClasses}`}/>)}
            {renderFormControl("Clothing Details", <select name="dressDetails" value={settings.dressDetails} onChange={handleChange} disabled={isClothingDisabled} className={`${baseInputClasses} ${disabledInputClasses}`}>{dressDetailOptions.map(s => <option key={s} value={s}>{s}</option>)}</select>)}
            {renderFormControl("Hair Style", <select name="hairStyle" value={settings.hairStyle} onChange={handleChange} className={baseInputClasses}>{ensureOption(HAIR_STYLES, settings.hairStyle).map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Hair Accessory", <select name="hairAccessory" value={settings.hairAccessory} onChange={handleChange} className={baseInputClasses}>{ensureOption(HAIR_ACCESSORIES, settings.hairAccessory).map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Background Setting", <select name="background" value={settings.background} onChange={handleChange} className={baseInputClasses}> {ensureOption(BACKGROUND_SETTINGS, settings.background).map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Background Elements", <select name="backgroundElements" value={settings.backgroundElements} onChange={handleChange} className={baseInputClasses}> {ensureOption(BACKGROUND_ELEMENTS_PRESETS, settings.backgroundElements).map(s => <option key={s}>{s}</option>)} </select>)}
            
            <h3 className="text-base font-semibold text-white pt-4 border-t border-theme-border">Composition &amp; Cinematography</h3>

            {renderFormControl("Shot Pose", <select name="shotPose" value={settings.shotPose} onChange={handleChange} className={baseInputClasses}> {SHOT_POSES.map(s => <option key={s.name} value={s.value}>{s.name}</option>)} </select>)}
            
            {settings.shotPose === 'Custom Pose' && (
                <>
                    {renderFormControl("Action / Pose", <textarea name="action" value={settings.action} onChange={handleChange} className={`${baseInputClasses} h-20`}/>)}
                    {renderFormControl("Gaze", <select name="gaze" value={settings.gaze} onChange={handleChange} className={baseInputClasses}> {ensureOption(GAZE_OPTIONS, settings.gaze).map(s => <option key={s}>{s}</option>)} </select>)}
                </>
            )}

            {renderFormControl("Camera Model", <select name="cameraModel" value={settings.cameraModel} onChange={handleChange} className={baseInputClasses}> {ensureOption(CAMERA_MODELS, settings.cameraModel).map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Lens Style", <select name="lensType" value={settings.lensType} onChange={handleChange} className={baseInputClasses}> {ensureOption(LENS_TYPES, settings.lensType).map(s => <option key={s}>{s}</option>)} </select>)}

            {renderFormControl("Lighting", <select name="lighting" value={settings.lighting} onChange={handleChange} className={baseInputClasses}> {ensureOption(LIGHTING_PRESETS, settings.lighting).map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Shadow Intensity", <select name="shadowIntensity" value={settings.shadowIntensity} onChange={handleChange} className={baseInputClasses}>{ensureOption(SHADOW_INTENSITY_OPTIONS, settings.shadowIntensity).map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Highlight Bloom", <select name="highlightBloom" value={settings.highlightBloom} onChange={handleChange} className={baseInputClasses}>{ensureOption(HIGHLIGHT_BLOOM_OPTIONS, settings.highlightBloom).map(s => <option key={s}>{s}</option>)}</select>)}
            
            <h3 className="text-base font-semibold text-white pt-4 border-t border-theme-border">Final Details</h3>

            {renderFormControl("Skin Details", <select name="skin" value={settings.skin} onChange={handleChange} className={baseInputClasses}>{ensureOption(SKIN_DETAILS, settings.skin).map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Fashion Aesthetics", <select name="fashionAesthetics" value={settings.fashionAesthetics} onChange={handleChange} className={baseInputClasses}>{ensureOption(FASHION_AESTHETICS, settings.fashionAesthetics).map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Aspect Ratio", <select name="aspectRatio" value={settings.aspectRatio} onChange={handleChange} className={baseInputClasses}> {ASPECT_RATIOS.map(s => <option key={s}>{s}</option>)} </select>)}
        </div>
    );
};