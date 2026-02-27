import React from 'react';

interface CreatorsMenuProps {
  onSelect: (type: string) => void;
}

export function CreatorsMenu({ onSelect }: CreatorsMenuProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      {/* Empty as requested */}
    </div>
  );
}
