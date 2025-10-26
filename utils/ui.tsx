import React from 'react';

export const renderFormControl = (label: string, children: React.ReactNode) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-400">{label}</label>
    {children}
  </div>
);
