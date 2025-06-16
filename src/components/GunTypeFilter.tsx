import React from 'react';

interface GunTypeFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const gunTypes = [
  'All',
  'Pistol',
  'Rifle',
  'SMG',
  'Sniper Rifle',
  'Shotgun',
  'Knife',
  'Gloves'
];

export default function GunTypeFilter({ selectedType, onTypeChange }: GunTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {gunTypes.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            selectedType === type
              ? 'bg-blue-500 text-white'
              : 'bg-[#23262F] text-gray-300 hover:bg-[#2A2D3A] hover:text-white'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
} 