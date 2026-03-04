'use client';

interface VerifyButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function VerifyButton({
  onClick,
  disabled = false,
  loading = false,
}: VerifyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full py-4 px-6 rounded-lg font-semibold text-white
        transition-colors duration-200
        flex items-center justify-center gap-2
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${
          loading
            ? 'bg-[#1E40AF]/70 cursor-wait'
            : disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-[#1E40AF] hover:bg-[#1E3A8A] active:bg-[#1E3A8A]'
        }
      `}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          검증 중…
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          검증하기
        </>
      )}
    </button>
  );
}
