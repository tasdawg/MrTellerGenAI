import React from 'react';

export const renderFormControl = (label: string, children: React.ReactNode) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-theme-text-secondary">{label}</label>
    {children}
  </div>
);