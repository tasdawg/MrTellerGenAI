export const base64ToBlob = (base64: string, contentType: string = ''): Blob => {
    // A more robust implementation that handles the data URL prefix
    const base64Data = base64.split(',')[1] ?? base64;
    
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
};

export const createThumbnail = (base64Image: string, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Image;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas to Blob conversion failed'));
                }
            }, 'image/jpeg', 0.9); // Use JPEG for smaller thumbnails
        };
        img.onerror = (error) => {
            reject(error);
        };
    });
};

export const imageUrlToBase64 = (url: string): Promise<string> => {
    // Using a CORS proxy to fetch images from different origins without CORS errors.
    // This allows the image to be loaded into a canvas for base64 conversion.
    // In a real-world application, a self-hosted proxy is recommended for stability and security.
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Crucial for loading cross-origin images into a canvas

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context. Your browser may not support it.'));
            }

            ctx.drawImage(img, 0, 0);

            try {
                // Infer mimeType from the URL extension for better accuracy, defaulting to jpeg.
                const extension = url.split('.').pop()?.toLowerCase();
                let mimeType = 'image/jpeg';
                if (extension === 'png') {
                    mimeType = 'image/png';
                } else if (extension === 'webp') {
                    mimeType = 'image/webp';
                }
                
                const dataURL = canvas.toDataURL(mimeType);
                resolve(dataURL);
            } catch (e: any) {
                // This error is thrown if the canvas becomes "tainted" by drawing a cross-origin image
                // without proper CORS headers, despite the image loading.
                reject(new Error(`CORS policy violation: The image from ${url} could not be processed.`));
            }
        };

        img.onerror = () => {
            // This error triggers if the image fails to load at all, often due to network issues
            // or the server rejecting the request because of CORS policies.
            reject(new Error('Failed to load the image via proxy. This might be due to a network error, a broken link, or the CORS proxy being down.'));
        };

        img.src = proxiedUrl;
    });
};
