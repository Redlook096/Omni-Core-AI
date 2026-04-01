import React from 'react';

interface CreatorsMenuProps {
  onSelect: (type: string) => void;
}

export function CreatorsMenu({ onSelect }: CreatorsMenuProps) {
  // Keeps the callback in scope for future interactions.
  void onSelect;
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
    </div>
  );
}
