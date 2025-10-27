import React from 'react';
import { DRESS_STYLES, BACKGROUND_SETTINGS, GAZE_OPTIONS, LIGHTING_PRESETS, BACKGROUND_ELEMENTS_PRESETS, SHOT_POSES, ASPECT_RATIOS, CAMERA_MODELS, LENS_TYPES, CLOTHING_DETAILS_MAP, HAIR_STYLES, HAIR_ACCESSORIES, SKIN_DETAILS, FASHION_AESTHETICS } from '../utils/constants';
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


    return (
        <div className="space-y-4">
            <p className="text-xs text-gray-400">This tool helps construct a detailed prompt for Chinese and Vietnamese cultural styles. For best results, upload a clear 'Subject Reference' image first. The prompt will update in real-time in the generation box.</p>
            
            {renderFormControl("Clothing Style", <select name="dressStyle" value={settings.dressStyle} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {DRESS_STYLES.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Clothing Color", <input type="text" name="dressColor" value={settings.dressColor} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"/>)}
            {renderFormControl("Clothing Details", <select name="dressDetails" value={settings.dressDetails} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600">{dressDetailOptions.map(s => <option key={s} value={s}>{s}</option>)}</select>)}
            {renderFormControl("Hair Style", <select name="hairStyle" value={settings.hairStyle} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600">{hairStyleOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Hair Accessory", <select name="hairAccessory" value={settings.hairAccessory} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600">{hairAccessoryOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Background Setting", <select name="background" value={settings.background} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {BACKGROUND_SETTINGS.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Background Elements", <select name="backgroundElements" value={settings.backgroundElements} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {BACKGROUND_ELEMENTS_PRESETS.map(s => <option key={s}>{s}</option>)} </select>)}
            
            {renderFormControl("Shot Pose", <select name="shotPose" value={settings.shotPose} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {SHOT_POSES.map(s => <option key={s.name} value={s.value}>{s.name}</option>)} </select>)}
            
            {settings.shotPose === 'Custom Pose' && (
                <>
                    {renderFormControl("Action / Pose", <textarea name="action" value={settings.action} onChange={handleChange} className="w-full h-20 p-2 bg-gray-800 border border-gray-600"/>)}
                    {renderFormControl("Gaze", <select name="gaze" value={settings.gaze} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {GAZE_OPTIONS.map(s => <option key={s}>{s}</option>)} </select>)}
                </>
            )}

            {renderFormControl("Camera Model", <select name="cameraModel" value={settings.cameraModel} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {CAMERA_MODELS.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Lens Style", <select name="lensType" value={settings.lensType} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {LENS_TYPES.map(s => <option key={s}>{s}</option>)} </select>)}

            {renderFormControl("Lighting", <select name="lighting" value={settings.lighting} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {LIGHTING_PRESETS.map(s => <option key={s}>{s}</option>)} </select>)}
            {renderFormControl("Skin Details", <select name="skin" value={settings.skin} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600">{skinDetailOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Fashion Aesthetics", <select name="fashionAesthetics" value={settings.fashionAesthetics} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600">{fashionAestheticOptions.map(s => <option key={s}>{s}</option>)}</select>)}
            {renderFormControl("Aspect Ratio", <select name="aspectRatio" value={settings.aspectRatio} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600"> {ASPECT_RATIOS.map(s => <option key={s}>{s}</option>)} </select>)}
        </div>
    );
};
