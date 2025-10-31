import React from 'react';
import { DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, ASPECT_RATIOS, CAMERA_MODELS, LENS_TYPES, CLOTHING_DETAILS_MAP, HAIR_STYLES, HAIR_ACCESSORIES, SKIN_DETAILS, FASHION_AESTHETICS, RANDOM_COLORS, SHADOW_INTENSITY_OPTIONS, HIGHLIGHT_BLOOM_OPTIONS, GENDERS, ETHNICITIES } from '../utils/constants';
import { renderFormControl } from '../utils/ui';
import { DecodedPrompt } from '../utils/db';

interface PhotorealisticSectionProps {
    settings: DecodedPrompt;
    onSettingsChange: (newSettings: DecodedPrompt) => void;
}

export const PhotorealisticSection = ({ settings, onSettingsChange }: PhotorealisticSectionProps) => {

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

        const randomSettings: DecodedPrompt = { ...settings };

        randomSettings.gender = getRandom(GENDERS);
        randomSettings.ethnicity = getRandom(ETHNICITIES);
        randomSettings.dressStyle = getRandom(DRESS_STYLES);
        randomSettings.dressColor = getRandom(RANDOM_COLORS);
        const detailsForStyle = (CLOTHING_DETAILS_MAP as any)[randomSettings.dressStyle] || [];
        randomSettings.dressDetails = getRandom(detailsForStyle);
        
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

    const baseInputClasses = "w-full p-2 bg-theme-surface border border-theme-border rounded-md focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";

    // Get the clothing detail options for the currently selected style.
    const dressDetailOptions: string[] = (CLOTHING_DETAILS_MAP as any)[settings.dressStyle] || [];
    // Ensure the currently set detail is in the list (for loading from localStorage).
    if (settings.dressDetails && !dressDetailOptions.includes(settings.dressDetails)) {
        dressDetailOptions.unshift(settings.dressDetails);
    }

    // Ensure current setting is in the list for other new dropdowns
    const hairStyleOptions = [...HAIR_STYLES];
    if (settings.hairStyle && !hairStyleOptions.includes(settings.hairStyle)) {
        hairStyleOptions.unshift(settings.hairStyle);
    }
    const hairAccessoryOptions = [...HAIR_ACCESSORIES];
    if (settings.hairAccessory && !hairAccessoryOptions.includes(settings.hairAccessory)) {
        hairAccessoryOptions.unshift(settings.hairAccessory);
    }
    const skinDetailOptions = [...SKIN_DETAILS];
    if (settings.skin && !skinDetailOptions.includes(settings.skin)) {
        skinDetailOptions.unshift(settings.skin);
    }
    const fashionAestheticOptions = [...FASHION_AESTHETICS];
    if (settings.fashionAesthetics && !fashionAestheticOptions.includes(settings.fashionAesthetics)) {
        fashionAestheticOptions.unshift(settings.fashionAesthetics);
    }
    const shadowIntensityOptions = [...SHADOW_INTENSITY_OPTIONS];
    if (settings.shadowIntensity && !shadowIntensityOptions.includes(settings.shadowIntensity)) {
        shadowIntensityOptions.unshift(settings.shadowIntensity);
    }
    const highlightBloomOptions = [...HIGHLIGHT_BLOOM_OPTIONS];
    if (settings.highlightBloom && !highlightBloomOptions.includes(settings.highlightBloom)) {
        highlightBloomOptions.unshift(settings.highlightBloom);
    }


    return (
        <div className="space-y-4">
            <p className="text-xs text-theme-text-secondary">This tool helps construct a detailed prompt for Chinese and Vietnamese cultural styles. For best results, upload a clear 'Subject Reference' image first. The prompt will update in real-time in the generation box.</p>
            <button 
                onClick={handleRandomize}
                className="w-full mb-2 py-2 px-4 bg-theme-surface-2 hover:bg-theme-border text-white font-bold transition duration-300 flex items-center justify-center gap-2 rounded-md"
            >
                🎲 Randomize All Settings
            </button>

            <div className="space-y-4 border-b border-theme-border pb-4 mb-4">
                <h3 className="text-base font-semibold text-white">Subject</h3>
                {renderFormControl("Gender", <select name="gender" value={settings.gender} onChange={handleChange} className={baseInputClasses}> {GENDERS.map(s => <option key={s}>{s}</option>)} </select>)}
                {renderFormControl("Ethnicity", <select name="ethnicity" value={settings.ethnicity} onChange={handleChange} className={baseInputClasses}> {ETHNICITIES.map(s => <option key={s}>{s}</option>)} </select>)}
            </div>

             <h3 className="text-base font-semibold text-white">Styling &amp; Environment</h3>
            
            {renderFormControl("Clothing Style", <select name="dressStyle" value={settings.dressStyle} onChange={handleChange} className={baseInputClasses}> {DRESS_STYLES.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Clothing Color", <input type="text" name="dressColor" value={settings.dressColor} onChange={handleChange} className={baseInputClasses}/>)}
            {renderFormControl("Clothing Details", <select name="dressDetails" value={settings.dressDetails} onChange={handleChange} className={baseInputClasses}>{dressDetailOptions.map(s => <option key={s} value={s}>{s}</option>)}</select>)}
            {renderFormControl("Hair Style", <select name="hairStyle" value={settings.hairStyle} onChange={handleChange} className={baseInputClasses}>{hairStyleOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Hair Accessory", <select name="hairAccessory" value={settings.hairAccessory} onChange={handleChange} className={baseInputClasses}>{hairAccessoryOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Background Setting", <select name="background" value={settings.background} onChange={handleChange} className={baseInputClasses}> {BACKGROUND_SETTINGS.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Background Elements", <select name="backgroundElements" value={settings.backgroundElements} onChange={handleChange} className={baseInputClasses}> {BACKGROUND_ELEMENTS_PRESETS.map(s => <option key={s}>{s}</option>)} </select>)}
            
            <h3 className="text-base font-semibold text-white pt-4 border-t border-theme-border">Composition &amp; Cinematography</h3>

            {renderFormControl("Shot Pose", <select name="shotPose" value={settings.shotPose} onChange={handleChange} className={baseInputClasses}> {SHOT_POSES.map(s => <option key={s.name} value={s.value}>{s.name}</option>)} </select>)}
            
            {settings.shotPose === 'Custom Pose' && (
                <>
                    {renderFormControl("Action / Pose", <textarea name="action" value={settings.action} onChange={handleChange} className={`${baseInputClasses} h-20`}/>)}
                    {renderFormControl("Gaze", <select name="gaze" value={settings.gaze} onChange={handleChange} className={baseInputClasses}> {GAZE_OPTIONS.map(s => <option key={s}>{s}</option>)} </select>)}
                </>
            )}

            {renderFormControl("Camera Model", <select name="cameraModel" value={settings.cameraModel} onChange={handleChange} className={baseInputClasses}> {CAMERA_MODELS.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Lens Style", <select name="lensType" value={settings.lensType} onChange={handleChange} className={baseInputClasses}> {LENS_TYPES.map(s => <option key={s}>{s}</option>)} </select>)}

            {renderFormControl("Lighting", <select name="lighting" value={settings.lighting} onChange={handleChange} className={baseInputClasses}> {LIGHTING_PRESETS.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Shadow Intensity", <select name="shadowIntensity" value={settings.shadowIntensity} onChange={handleChange} className={baseInputClasses}>{shadowIntensityOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Highlight Bloom", <select name="highlightBloom" value={settings.highlightBloom} onChange={handleChange} className={baseInputClasses}>{highlightBloomOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            
            <h3 className="text-base font-semibold text-white pt-4 border-t border-theme-border">Final Details</h3>

            {renderFormControl("Skin Details", <select name="skin" value={settings.skin} onChange={handleChange} className={baseInputClasses}>{skinDetailOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Fashion Aesthetics", <select name="fashionAesthetics" value={settings.fashionAesthetics} onChange={handleChange} className={baseInputClasses}>{fashionAestheticOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Aspect Ratio", <select name="aspectRatio" value={settings.aspectRatio} onChange={handleChange} className={baseInputClasses}> {ASPECT_RATIOS.map(s => <option key={s}>{s}</option>)} </select>)}
        </div>
    );
};