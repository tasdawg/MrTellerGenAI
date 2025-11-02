import React from 'react';

export const renderFormControl = (label: string, children: React.ReactNode) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-theme-text-secondary">{label}</label>
    {children}
  </div>
);