'use client';

import { AdType, AD_TYPE_LABELS } from '@/domain/verification/model';

interface AdTypeSelectorProps {
  value: AdType;
  onChange: (value: AdType) => void;
  disabled?: boolean;
}

const AD_TYPES: AdType[] = ['blog', 'instagram', 'youtube', 'other'];

const AD_TYPE_ICONS: Record<AdType, string> = {
  blog: 'B',
  instagram: 'I',
  youtube: 'Y',
  other: '+',
};

export default function AdTypeSelector({
  value,
  onChange,
  disabled = false,
}: AdTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <label className="text-xs sm:text-sm font-medium text-gray-700">광고 유형</label>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {AD_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            disabled={disabled}
            aria-label={`광고 유형: ${AD_TYPE_LABELS[type]}`}
            aria-pressed={value === type}
            className={`
              py-2 sm:py-3 px-2 sm:px-4 rounded-lg border-2 transition-colors
              flex flex-col items-center gap-0.5 sm:gap-1
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
              ${
                value === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span className="text-sm sm:text-lg font-bold" aria-hidden="true">{AD_TYPE_ICONS[type]}</span>
            <span className="text-[10px] sm:text-xs">{AD_TYPE_LABELS[type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
