import React from 'react';

interface CreatorsMenuProps {
  onSelect: (type: string) => void;
}

export function CreatorsMenu({ onSelect }: CreatorsMenuProps) {
  // Empty as requested
  // Using onSelect to satisfy linter if needed, though it's empty
  React.useEffect(() => {
    const noop = () => {};
    noop(onSelect);
  }, [onSelect]);
  return (
    <div className="w-full h-full flex items-center justify-center p-6">
    </div>
  );
}
