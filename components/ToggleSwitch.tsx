import React from 'react';

export const ToggleSwitch = ({ id, checked, onChange, label }: { id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label:string }) => (
    <label htmlFor={id} className="flex items-center justify-between cursor-pointer w-full">
        <span className="text-sm font-medium text-theme-text">{label}</span>
        <div className="relative">
            <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-theme-primary' : 'bg-theme-surface-2'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
    </label>
);