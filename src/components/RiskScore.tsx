'use client';

interface RiskScoreProps {
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#EF4444'; // 빨강
  if (score >= 40) return '#F59E0B'; // 노랑
  return '#10B981'; // 초록
}

function getScoreLabel(score: number): string {
  if (score >= 70) return '위험';
  if (score >= 40) return '주의';
  return '양호';
}

export default function RiskScore({ score }: RiskScoreProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <h3 className="text-sm sm:text-base font-semibold text-gray-800">위험도</h3>
      <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          {/* 배경 원 */}
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* 진행 원 */}
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* 점수 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-xl sm:text-2xl lg:text-3xl font-bold transition-colors duration-300"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <div
        className="px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300"
        style={{
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}
