'use client';

import { useState, useCallback } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextInput({
  value,
  onChange,
  disabled = false,
  placeholder = '검증할 광고 텍스트를 붙여넣기 하거나 직접 입력하세요...',
}: TextInputProps) {
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setCharCount(newValue.length);
    },
    [onChange]
  );

  const handlePaste = useCallback(
    async () => {
      try {
        const text = await navigator.clipboard.readText();
        onChange(text);
        setCharCount(text.length);
      } catch (err) {
        console.error('클립보드 읽기 실패:', err);
      }
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 h-full">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium text-gray-700">
          광고 텍스트
        </label>
        <button
          type="button"
          onClick={handlePaste}
          disabled={disabled}
          className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          붙여넣기
        </button>
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 w-full min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm sm:text-base text-gray-900 placeholder:text-gray-400"
      />
      <div className="flex justify-between text-[10px] sm:text-xs text-gray-500">
        <span>최대 3,000자 권장</span>
        <span
          className={charCount > 3000 ? 'text-red-500 font-medium' : ''}
        >
          {charCount.toLocaleString()}자
        </span>
      </div>
    </div>
  );
}
