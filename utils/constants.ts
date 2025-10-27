export const REFERENCE_USAGE_OPTIONS = ["Use as Subject", "Use as Style", "Edit with Prompt"];
export const ASPECT_RATIOS = ["16:9", "9:16", "4:3", "3:4"];

// --- NEW CONSTANTS FOR PHOTOREALISM ---
export const CAMERA_MODELS = [
    "Canon EOS R5",
    "Sony Alpha a7R IV",
    "Nikon Z7 II",
    "Fujifilm GFX 100S",
    "Hasselblad X1D II 50C"
];

export const LENS_TYPES = [
    "50mm f/1.8 (Standard Prime)",
    "85mm f/1.4 (Portrait Prime)",
    "35mm f/1.4 (Wide Prime)",
    "100mm f/2.8 (Macro)",
    "24-70mm f/2.8 (Standard Zoom)",
    "70-200mm f/2.8 (Telephoto Zoom)",
    "16-35mm f/4 (Wide-Angle Zoom)",
    "135mm f/2.0 (Telephoto Prime)",
    "Canon 50mm f/1.2L USM",
    "Sigma 85mm f/1.4 DG HSM Art"
];

export const DRESS_STYLES = ['Ancient Chinese Dress', 'Vietnamese Ao Dai', 'Hanfu', 'Qipao'];
export const BACKGROUND_SETTINGS = ['City Wall', 'Ancient Temple', 'Bamboo Forest', 'Royal Palace', 'Modern City Street'];
export const GAZE_OPTIONS = ['Looking at camera', 'Looking away', 'Eyes closed'];
export const LIGHTING_PRESETS = ['Very soft and realistic', 'Dramatic Rembrandt lighting', 'Backlit silhouette with rim lighting', 'Flat, even studio lighting', 'Dappled sunlight through leaves', 'Blue hour twilight', 'Cinematic split lighting'];
export const BACKGROUND_ELEMENTS_PRESETS = ['Soldiers and swirling black smoke', 'Floating lanterns in a night sky', 'Intricate palace architecture', 'Misty mountains and a serene lake', 'Neon-lit cyberpunk alleyway', 'Blossoming cherry trees', 'Minimalist studio backdrop'];
export const SHOT_POSES = [
    { name: "Custom Pose", value: "Custom Pose" },
    { name: "1. Extreme Close-up Lips/Cheek", value: "extreme close-up of lips + cheekbone with blurred hand partially covering (85mm, f/1.8, razor-thin DOF)" },
    { name: "2. Tight Crop on Eyes", value: "tight crop on eyes looking into lens with reflection of light strip visible (85mm, f/2.0)" },
    { name: "3. B&W Close Portrait", value: "black & white close portrait resting chin on fist, face filling frame (50mm, f/2.2)" },
    { name: "4. Over-Shoulder Shot", value: "over-shoulder shot, blurred foreground fabric curtain framing half face (85mm, f/2.0)" },
    { name: "5. Hands Overlapping Face", value: "very close frontal with hands overlapping face, light streak across eyes (50mm, f/2.5)" },
    { name: "6. Tight Angled Portrait", value: "tight angled portrait showing hair falling into eyes, soft-focus background (85mm, t/2.2)" },
    { name: "7. Hands Touching Jawline", value: "crop of hands touching jawline, eyes cropped out (50mm, f/3.2, detail-focused)" },
    { name: "8. Seated Sideways", value: "half-body seated sideways on low cube, head turned sharply away, blurred foreground (35mm, f/ 4.5)" },
    { name: "9. Profile with Water Droplet", value: "intense close-up of profile with single tear-like water droplet, cinematic light slice across (85mm, f/ 1.9)" }
];
