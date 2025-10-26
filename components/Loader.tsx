import React from 'react';

export const Loader = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-black/50">
        <div className="spinner"></div>
        <p className="text-lg font-semibold text-gray-300">{message}</p>
    </div>
);
