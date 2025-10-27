export const REFERENCE_USAGE_OPTIONS = ["Use as Subject", "Use as Style", "Edit with Prompt"];
export const ASPECT_RATIOS = ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"];

// --- NEW CONSTANTS FOR PHOTOREALISM ---
export const CAMERA_MODELS = [
    "Canon EOS R5",
    "Sony Alpha a7R IV",
    "Nikon Z7 II",
    "Fujifilm GFX 100S",
    "Hasselblad X1D II 50C",
    "Leica M11",
    "Phase One XF IQ4",
    "Pentax 67 (Film)",
    "Contax T2 (Film)",
    "RED V-Raptor (Cinema)",
    "Arri Alexa LF (Cinema)",
    "Olympus OM-D E-M1 Mark III",
    "Panasonic Lumix S1H",
    "DJI Ronin 4D (Cinema)",
    "GoPro HERO12"
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
    "Sigma 85mm f/1.4 DG HSM Art",
    "Petzval 85mm f/2.2 (Art lens with swirly bokeh)",
    "Anamorphic 50mm f/1.8 (Cinematic wide-screen look)",
    "Lensbaby Trio 28 (Creative effects)",
    "Tilt-Shift 24mm f/3.5 (For architectural or miniature effects)",
    "Laowa 24mm f/14 Probe Lens (Unique perspectives)",
    "Zeiss Otus 55mm f/1.4 (Extremely sharp)",
    "Helios 44-2 58mm f/2 (Vintage, swirly bokeh)"
];

export const DRESS_STYLES = [
    'Ancient Chinese Dress', 
    'Vietnamese Ao Dai', 
    'Hanfu', 
    'Qipao',
    'Modern Minimalist Gown',
    'Bohemian Beach Sundress',
    'Cyberpunk Techwear Jacket',
    'Japanese Kimono',
    'Korean Hanbok',
    'Indian Saree',
    'Gothic Victorian Ballgown',
    'Avant-Garde Sculptural Piece',
    'Casual Streetwear (Hoodie and Jeans)',
    'Business Chic Blazer and Trousers',
    'Mermaid Tail Skirt'
];

export const CLOTHING_DETAILS_MAP = {
    'Ancient Chinese Dress': ["Intricate silk embroidery of phoenixes and peonies", "Wide, flowing sleeves that brush the floor", "Delicate jade buttons and a high collar", "Layers of translucent silk in gradient colors", "A sash tied with an ornate, traditional knot", "Hem adorned with fine gold thread patterns", "Features a Tang dynasty-style chest-high ruqun", "Song dynasty-style with narrow sleeves and a long skirt", "Made from heavy brocade with dragon motifs", "Lightweight gauze fabric, ethereal and semi-transparent"],
    'Vietnamese Ao Dai': ["Sheer, fitted tunic over wide satin trousers", "Hand-painted lotus flowers on the silk fabric", "High collar with delicate pearl closures", "Side slits reaching up to the waist", "Made of vibrant, shimmering silk", "Contrasting colors between tunic and trousers", "Traditional wooden bead buttons", "Long sleeves fitted to the wrist", "A modern take with intricate lace patterns", "Flowing, double-layered fabric for a soft silhouette"],
    'Hanfu': ["Crossed collar with the right side over the left", "Floor-length skirt with a high waistband", "Extremely wide sleeves, typical of the Tang Dynasty", "Delicate floral embroidery along the collar and cuffs", "A decorative silk sash known as a 'dà dài'", "Layered robes creating a voluminous look", "Made from breathable linen for a casual feel", "Brocade fabric with auspicious cloud patterns", "A trailing 'pèi' (streamer) attached to the waist", "Pleated skirt giving a graceful swing"],
    'Qipao': ["High, mandarin collar", "Asymmetrical, diagonal opening fastened with frog buttons", "Body-hugging silhouette that accentuates curves", "Made from luxurious silk brocade with floral patterns", "Short, cap sleeves", "Thigh-high side slits for ease of movement", "Edged with contrasting piping", "A modern, sleeveless version", "Traditional pattern of dragons and phoenixes", "Velvet fabric for a winter version"],
    'Modern Minimalist Gown': ["Clean, architectural lines and a simple silhouette", "Made from a single piece of heavy crepe fabric", "Asymmetrical, single-shoulder design", "A dramatic, floor-sweeping cape attached at the shoulders", "No embellishments, focusing on pure form", "A sharp, geometric neckline", "Subtle, hidden pockets", "A thigh-high slit for a modern edge", "A muted, monochromatic color palette", "Constructed with precise, sharp tailoring"],
    'Bohemian Beach Sundress': ["Lightweight, breathable cotton with crochet lace inserts", "Tiered, ruffled skirt that moves with the breeze", "Smocked bodice for a comfortable, stretchy fit", "Spaghetti straps that tie at the shoulders", "Faded floral or paisley print", "A tasseled drawstring waist", "Ankle-length maxi style", "Off-the-shoulder neckline with a flounce overlay", "Made from semi-sheer, crinkled gauze", "Raw, frayed hem for a relaxed vibe"],
    'Cyberpunk Techwear Jacket': ["Integrated LED light strips along the seams", "Asymmetrical zippers and multiple utility straps", "Water-resistant, matte black technical fabric", "A high, protective collar that can be worn up", "Transparent vinyl panels on the sleeves", "Multiple cargo pockets with magnetic closures", "Reflective, holographic patches", "Detachable hood with a built-in visor", "Quick-release magnetic buckles", "Thumbholes in the cuffs"],
    'Japanese Kimono': ["Traditional T-shape with long, rectangular sleeves", "An 'obi' (sash) tied in an elaborate bow at the back", "Made from silk with hand-painted nature motifs", "A furisode style with sleeves sweeping the floor", "A subtle, woven pattern visible in the light", "The collar is worn pulled back to reveal the nape", "Lined with a contrasting red silk", "A formal 'kurotomesode' with crests", "A casual 'yukata' made from cotton", "Features a family crest ('kamon') on the back"],
    'Korean Hanbok': ["A short, jacket-like 'jeogori' top", "A full, high-waisted 'chima' skirt", "Vibrant, contrasting colors like pink and light green", "Delicate floral embroidery on the jeogori's cuffs", "A long, flowing ribbon ('goreum') that ties at the chest", "Made from glossy, stiff silk that holds its shape", "A modern see-through jeogori made of organza", "Gold leaf print ('geumbak') on the chima", "Layered undergarments create the iconic bell shape", "A winter version with a fur-lined vest"],
    'Indian Saree': ["A six-yard-long drape of luxurious silk", "An intricately embroidered border ('zari')", "A heavily embellished 'pallu' (the end piece)", "Worn with a short, fitted blouse ('choli')", "Banarasi silk with woven gold patterns", "Lightweight chiffon with a modern, digital print", "Kanjeevaram style with temple borders", "Adorned with tiny mirrors ('shisha' work)", "A pre-draped, modern cocktail saree", "Rich, jewel-toned colors like emerald and ruby"],
    'Gothic Victorian Ballgown': ["Constructed with black velvet and deep crimson satin", "A tight, boned corset that cinches the waist", "A voluminous bustle and a floor-sweeping train", "High, lace-trimmed collar", "Long, fitted sleeves with puffed shoulders", "Adorned with jet-black beading and mourning jewelry", "Layers of ruffled black lace", "A cameo brooch at the throat", "Gloomy, romantic and slightly decaying aesthetic", "Paired with long, black leather gloves"],
    'Avant-Garde Sculptural Piece': ["Made from unconventional materials like molded plastic or metal", "A dramatic, exaggerated silhouette that defies gravity", "Three-dimensional, origami-like folds", "Asymmetrical and deconstructed design", "Integrated lighting elements", "A single, bold color to emphasize form", "Looks like a wearable piece of modern art", "Challenges traditional notions of clothing", "Minimalist yet structurally complex", "Features sharp, unexpected angles"],
    'Casual Streetwear (Hoodie and Jeans)': ["An oversized, soft fleece hoodie", "Distressed, light-wash denim jeans with rips", "The hoodie has a bold graphic print on the back", "Jeans are a relaxed, boyfriend fit", "Layered with a simple white t-shirt underneath", "High-top sneakers complete the look", "A beanie or baseball cap as an accessory", "Drawstrings on the hoodie are extra long", "Jeans have a raw, frayed hem", "The outfit has a comfortable, lived-in feel"],
    'Business Chic Blazer and Trousers': ["A sharply tailored, double-breasted blazer", "High-waisted, wide-leg trousers that pool at the floor", "A monochromatic look in a power color like cream or navy", "The blazer is worn without a shirt for a daring look", "A delicate silk camisole peeks out from under the blazer", "The fabric is a high-quality wool blend", "Gold, statement buttons on the blazer", "Perfectly pressed, sharp creases on the trousers", "A structured, minimalist silhouette", "Paired with pointed-toe stiletto heels"],
    'Mermaid Tail Skirt': ["A dramatic, floor-length skirt that is tight to the knees and flares out", "Covered in shimmering, iridescent sequins", "The flare is made of layers of tulle, like seafoam", "A high-waisted design", "Paired with a simple, elegant crop top", "The sequins are in shades of blue and green", "Creates a stunning, hourglass silhouette", "The fabric has a slight stretch for fit", "A train that trails beautifully", "Perfect for a formal, fantasy-themed event"]
};

export const HAIR_STYLES = [
    'Long, silky, perfectly straight hair cascading down her back',
    'Voluminous, glossy waves framing her face and shoulders',
    'A graceful half-up, half-down style with soft tendrils',
    'A single, thick, intricate braid woven with silk ribbons',
    'Loose, romantic curls piled high in an elegant updo',
    'Sleek, high ponytail that flows like a waterfall',
    'Long hair styled in classic old Hollywood waves',
    'Effortlessly tousled, long beachy waves with sun-kissed highlights',
    'Glass hair effect, extremely shiny, smooth and sharp',
    'A complex, traditional braided bun held with ornate pins',
    'Long hair with gentle, face-framing layers and curtain bangs',
    'Flowing hair that seems to defy gravity, as if caught in a gentle breeze',
    'A low, loose bun at the nape of the neck with escaping strands'
];

export const HAIR_ACCESSORIES = [
    'None',
    'A single, perfect pearl pin holding back a section of hair',
    'An ornate, antique silver hairpin with dangling jade charms',
    'A delicate gold chain woven through a braid',
    'A crown of fresh, dewy cherry blossoms',
    'A long, flowing red silk ribbon tied in a loose bow',
    'An intricate jade hair comb with phoenix carvings',
    'A string of small, twinkling diamonds scattered through an updo',
    'A minimalist gold barrette clip',
    'A traditional Phoenix coronet (Fengguan) with elaborate details',
    'Delicate, shimmering butterfly-shaped hairpins',
    'A simple, elegant velvet headband',
    'A bohemian-style headpiece with delicate chains and a central gem'
];

export const SKIN_DETAILS = [
    'Glowing porcelain skin with a few faint, natural freckles across the nose',
    'Soft, dewy skin with visible, realistic pores and a subtle beauty mark above the lip',
    'Perfectly smooth, matte skin with delicate, almost invisible vellus hair on the cheeks',
    'Sun-kissed skin with a healthy, natural sheen and light, believable tan lines',
    'Clear, hydrated skin with subtle texture and natural rosy cheeks',
    'Skin with a slight flush, as if just coming in from the cold or feeling shy',
    'Realistic skin with tiny imperfections, like a small, healed scar on the chin or slight under-eye creases',
    'A light sheen of perspiration on the temples and upper lip, suggesting a warm, humid day',
    'Ethereal, almost translucent skin that seems to glow from within, with visible, faint blue veins',
    'Matte, powdered skin with a perfectly applied, subtle contour that looks natural',
    'Skin showing the subtle impression from leaning on fabric or a hand'
];

export const FASHION_AESTHETICS = [
    'Meticulously detailed fashion aesthetics',
    'Dark Academia, with tweed, vintage elements, and a scholarly feel',
    'Cottagecore, focusing on rustic, romantic, and pastoral styles',
    'Light Academia, with soft colors, classic silhouettes, and an intellectual vibe',
    'Cyberpunk Goth, blending futuristic techwear with dark, edgy fashion',
    'Royalcore, inspired by the opulent, lavish style of historical European royalty',
    'Minimalist chic, with clean lines, neutral tones, and a focus on form',
    'Ethereal and dreamy, using flowing, translucent fabrics and iridescent colors',
    'High-fashion avant-garde with sculptural, artistic, and unconventional elements',
    'Vintage Hollywood glamour from the 1940s, with tailored suits and elegant gowns',
    'Bohemian wanderlust with layers, earthy tones, and natural textures',
    'Streetwear luxe, combining casual comfort with high-end designer pieces',
    'Grungy and edgy with leather, plaid, and distressed details'
];

export const BACKGROUND_SETTINGS = [
    'City Wall', 
    'Ancient Temple', 
    'Bamboo Forest', 
    'Royal Palace', 
    'Modern City Street',
    'Sun-drenched Beach at Golden Hour',
    'Neon-soaked Tokyo Alleyway',
    'Opulent Baroque Library',
    'Minimalist Concrete Studio',
    'Misty Scottish Highlands',
    'Futuristic Spaceship Bridge',
    'Abandoned Greenhouse Overgrown with Ivy',
    'Bustling Moroccan Souk',
    'Serene Japanese Zen Garden',
    'Infinity Pool Overlooking a Volcano',
    'Dusty Wild West Saloon'
];
export const GAZE_OPTIONS = [
    'Looking at camera', 
    'Looking away', 
    'Eyes closed',
    'Looking over the shoulder',
    'A shy glance downwards',
    'A direct, intense stare',
    'A dreamy, unfocused look into the distance',
    'Peeking through fingers',
    'A joyful look upwards',
    'A melancholic look out a window',
    'Winking at the camera',
    'Reflected in a mirror',
    'Eyes half-closed in pleasure'
];
export const LIGHTING_PRESETS = [
    'Very soft and realistic', 
    'Dramatic Rembrandt lighting', 
    'Backlit silhouette with rim lighting', 
    'Flat, even studio lighting', 
    'Dappled sunlight through leaves', 
    'Blue hour twilight', 
    'Cinematic split lighting',
    'Caustic light reflections from water',
    'Harsh, direct flash (paparazzi style)',
    'Volumetric light rays in a dusty room',
    'Soft glow from a paper lantern',
    'Flickering candlelight',
    'Sleek, colorful gel lighting',
    'Underwater dappled light',
    'Projector-cast patterns on subject',
    'God rays breaking through clouds',
    'Ominous under-lighting',
    'Warm, cozy fireplace glow'
];
export const BACKGROUND_ELEMENTS_PRESETS = [
    'Soldiers and swirling black smoke', 
    'Floating lanterns in a night sky', 
    'Intricate palace architecture', 
    'Misty mountains and a serene lake', 
    'Neon-lit cyberpunk alleyway', 
    'Blossoming cherry trees', 
    'Minimalist studio backdrop',
    'Holographic data streams',
    'Swirling autumn leaves',
    'Gentle falling snow',
    'A flock of birds taking flight',
    'Distant, erupting volcano',
    'Low-hanging fog over water',
    'Floating celestial bodies and nebulae',
    'Crumbling ancient ruins',
    'A classic muscle car parked nearby',
    'A cascade of flower petals',
    'Laser grids and sci-fi panels'
];
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
    { name: "9. Profile with Water Droplet", value: "intense close-up of profile with single tear-like water droplet, cinematic light slice across (85mm, f/ 1.9)" },
    { name: "10. Leaning Against Wall", value: "full body shot leaning casually against a graffiti-covered brick wall, one leg crossed (35mm, f/4.0, urban editorial)" },
    { name: "11. Mid-air Jump", value: "dynamic full-body shot captured mid-air during a joyful jump at the beach (24mm, f/5.6, high shutter speed)" },
    { name: "12. Lying in Flowers", value: "overhead shot lying down in a field of wildflowers, eyes closed (50mm, f/2.8, dreamy)" },
    { name: "13. Power Stance", value: "low-angle full body shot, standing with legs apart in a powerful stance, looking down at camera (24mm, f/8.0, heroic)" },
    { name: "14. Candid Laughing", value: "candid half-body shot, laughing genuinely while turning away from the camera (50mm, f/2.0, natural light)" },
    { name: "15. Running Towards Camera", value: "action shot, running towards the camera on an empty road, motion blur in background (35mm, f/5.6, tracking shot feel)" },
    { name: "16. Silhouette at Sunset", value: "profile silhouette against a vibrant sunset over the ocean (100mm, f/11, dramatic)" },
    { name: "17. Peeking From Behind Object", value: "playful shot peeking from behind a large tropical leaf (85mm, f/2.2, selective focus)" },
    { name: "18. Studio Box Pose", value: "seated inside a large white cube, contorted and artistic pose (35mm, f/8.0, high-fashion studio)" },
    { name: "19. Rain-soaked Window", value: "moody shot looking out a rain-streaked window, face partially obscured by reflections (50mm, f/2.5, melancholic)" },
    { name: "20. Dancing with Fabric", value: "full body shot, dynamically interacting with a large piece of flowing silk fabric (24-70mm, f/4.0, expressive)" },
    { name: "21. Elegant Three-Quarter Turn", value: "elegant three-quarter turn, looking over shoulder at camera (85mm, f/2.2, soft light)"},
    { name: "22. Leaning Casually", value: "casually leaning against a vintage car, one hand in pocket (35mm, f/4.0, golden hour)"},
    { name: "23. Balcony Contemplation", value: "sitting on the edge of a balcony, looking out at the city lights (50mm, f/1.8, bokeh background)"},
    { name: "24. Candid Detail Shot", value: "a candid shot, captured while adjusting a single earring (100mm, f/2.8, macro detail)"},
    { name: "25. Misty Alley Glance", value: "walking away down a misty alley, turning head back for a final glance (50mm, f/2.0, atmospheric)"},
    { name: "26. Silk Sheet Repose", value: "lying on a silk sheet, body forming a gentle S-curve, shot from above (35mm, f/3.5)"},
    { name: "27. Confident Power Pose", value: "power pose, standing with hands on hips, looking directly into the camera (35mm, f/5.6)"},
    { name: "28. Water Reflection", value: "delicately touching the surface of water in a pond, creating ripples (85mm, f/1.8, reflection focus)"},
    { name: "29. Quiet Contemplation", value: "captured in a moment of quiet contemplation, reading a book by a window (50mm, f/2.2, natural light)"},
    { name: "30. Rooftop Dynamic", value: "a dynamic shot, her dress caught in the wind on a rooftop (24mm, f/8.0, wide-angle)"}
];
