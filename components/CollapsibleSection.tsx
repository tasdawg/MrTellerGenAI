import React, { useState } from 'react';

export const CollapsibleSection = ({ title, defaultOpen = false, children }: { title: string, defaultOpen?: boolean, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-gray-600 pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-sm font-medium text-gray-400 hover:text-white"
            >
                <span>{title}</span>
                <svg
                    className={`w-5 h-5 transition-transform transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] mt-4' : 'max-h-0'}`}
            >
                <div className="space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
