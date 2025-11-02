import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Crop {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DragInfo {
    active: boolean;
    handle: string | null;
    startX: number;
    startY: number;
    initialCrop: Crop;
}

interface ImageCropperProps {
    imageSrc: string;
    onConfirm: (croppedDataUrl: string) => void;
    onCancel: () => void;
}

const MIN_CROP_SIZE = 20; // Minimum width/height for the crop box in pixels

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0 });
    const [dragInfo, setDragInfo] = useState<DragInfo>({ active: false, handle: null, startX: 0, startY: 0, initialCrop: { x: 0, y: 0, width: 0, height: 0 } });
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    const resetCropToImageBounds = useCallback(() => {
        const image = imageRef.current;
        if (image && image.complete && image.naturalWidth > 0) {
            setCrop({
                x: 0,
                y: 0,
                width: image.clientWidth,
                height: image.clientHeight,
            });
        }
    }, []);

    useEffect(() => {
        const image = imageRef.current;
        const handleLoad = () => {
            setIsImageLoaded(true);
            resetCropToImageBounds();
        };

        if (image) {
            image.addEventListener('load', handleLoad);
            window.addEventListener('resize', resetCropToImageBounds);
            if (image.complete && image.naturalWidth > 0) {
                handleLoad();
            }
        }

        return () => {
            if (image) {
                image.removeEventListener('load', handleLoad);
            }
            window.removeEventListener('resize', resetCropToImageBounds);
        };
    }, [imageSrc, resetCropToImageBounds]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.style.cursor = getCursorStyle(handle);
        setDragInfo({
            active: true,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialCrop: { ...crop },
        });
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragInfo.active || !imageRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const image = imageRef.current;
        const { clientWidth: imageWidth, clientHeight: imageHeight } = image;
        const { startX, startY, initialCrop, handle } = dragInfo;
    
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
    
        const { x, y, width, height } = initialCrop;
    
        let left = x;
        let top = y;
        let right = x + width;
        let bottom = y + height;
    
        switch (handle) {
            case 'n': top += dy; break;
            case 's': bottom += dy; break;
            case 'w': left += dx; break;
            case 'e': right += dx; break;
            case 'nw': top += dy; left += dx; break;
            case 'ne': top += dy; right += dx; break;
            case 'sw': bottom += dy; left += dx; break;
            case 'se': bottom += dy; right += dx; break;
            default: // Move
                left += dx;
                right += dx;
                top += dy;
                bottom += dy;
                break;
        }

        // --- VALIDATION & CORRECTION ---
        // Prevent flipping horizontally
        if (left > right - MIN_CROP_SIZE) {
            if (handle && handle.includes('w')) {
                left = right - MIN_CROP_SIZE;
            } else {
                right = left + MIN_CROP_SIZE;
            }
        }
    
        // Prevent flipping vertically
        if (top > bottom - MIN_CROP_SIZE) {
            if (handle && handle.includes('n')) {
                top = bottom - MIN_CROP_SIZE;
            } else {
                bottom = top + MIN_CROP_SIZE;
            }
        }
    
        // Enforce boundaries
        if (handle === null) { // Move
            const currentWidth = right - left;
            const currentHeight = bottom - top;
            if (left < 0) { left = 0; right = currentWidth; }
            if (top < 0) { top = 0; bottom = currentHeight; }
            if (right > imageWidth) { right = imageWidth; left = imageWidth - currentWidth; }
            if (bottom > imageHeight) { bottom = imageHeight; top = imageHeight - currentHeight; }
        } else { // Resize
            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (right > imageWidth) right = imageWidth;
            if (bottom > imageHeight) bottom = imageHeight;
        }
    
        // Convert back to x, y, width, height and update state
        setCrop({
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
        });

    }, [dragInfo]);


    const handleMouseUp = useCallback(() => {
        document.body.style.cursor = 'default';
        setDragInfo(d => ({ ...d, active: false }));
    }, []);

    useEffect(() => {
        if (dragInfo.active) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo.active, handleMouseMove, handleMouseUp]);


    const handleConfirmCrop = () => {
        const image = imageRef.current;
        if (!image) return;

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );
        
        const croppedDataUrl = canvas.toDataURL('image/png');
        onConfirm(croppedDataUrl);
    };

    const getCursorStyle = (handle: string | null) => {
        if (!handle) return 'move';
        return `${handle}-resize`;
    };

    const cropBoxStyle: React.CSSProperties = {
        transform: `translate(${crop.x}px, ${crop.y}px)`,
        width: crop.width,
        height: crop.height,
        cursor: getCursorStyle(dragInfo.handle),
    };
    
    const handles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative flex-grow w-full max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <img 
                    ref={imageRef} 
                    src={imageSrc} 
                    alt="Image to crop" 
                    className="max-w-full max-h-full object-contain select-none"
                    style={{ opacity: isImageLoaded ? 1 : 0 }} // Hide image until it's loaded to prevent flicker
                />
                {isImageLoaded && (
                    <div
                        className="absolute border border-white/80 shadow-lg cursor-move"
                        style={cropBoxStyle}
                        onMouseDown={(e) => handleMouseDown(e, null)}
                    >
                         <div className="absolute inset-0 bg-black/20"></div>
                        {handles.map(handle => (
                            <div
                                key={handle}
                                className={`absolute bg-white rounded-full w-3 h-3 -m-1.5`}
                                style={{
                                    top: handle.includes('n') ? 0 : handle.includes('s') ? '100%' : '50%',
                                    left: handle.includes('w') ? 0 : handle.includes('e') ? '100%' : '50%',
                                    transform: `translate(-50%, -50%)`,
                                    cursor: `${handle}-resize`
                                }}
                                onMouseDown={(e) => handleMouseDown(e, handle)}
                            />
                        ))}
                    </div>
                )}
            </div>
             <div className="flex-shrink-0 mt-4 flex items-center gap-4" onClick={e => e.stopPropagation()}>
                <button onClick={onCancel} className="px-6 py-2 bg-theme-surface-2 text-white font-bold hover:bg-theme-border transition duration-300 rounded-md">Cancel</button>
                <button onClick={handleConfirmCrop} className="px-6 py-2 bg-theme-primary text-white font-bold hover:bg-theme-primary-hover transition duration-300 rounded-md">Confirm Crop</button>
            </div>
        </div>
    );
};
