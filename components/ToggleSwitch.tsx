import React from 'react';

export const ToggleSwitch = ({ id, checked, onChange, label }: { id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string }) => (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer w-full">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <div className="relative">
            <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className="block bg-gray-700 w-14 h-8"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 transition-transform duration-300 ease-in-out ${checked ? 'transform translate-x-6 bg-gray-400' : ''}`}></div>
        </div>
    </label>
);
