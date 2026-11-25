import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  inverted?: boolean;
}

const OFFICIAL_LOGO_URL = '/assets/aistudio/IMG-20261024-WA0004_1__dd88a4ca.jpg';

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', inverted = false }) => {
  const [imgError, setImgError] = useState(false);

  const primaryColor = inverted ? '#FFFFFF' : '#1769AA';
  const secondaryColor = inverted ? '#EAF3FC' : '#2876C8';
  const textColor = inverted ? 'text-white' : 'text-[#0F2942]';
  const accentTextColor = inverted ? 'text-[#EAF3FC]' : 'text-[#1769AA]';

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      {!imgError ? (
        <img
          src={OFFICIAL_LOGO_URL}
          alt="Logo Caravane Pour Christ — MÉDITATION CPC"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-9 h-9 object-contain rounded-lg bg-white border border-[#DCE7F3] p-0.5 shrink-0"
        />
      ) : (
        <svg
          width="26"
          height="22"
          viewBox="0 0 28 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M2.5 4.75C2.5 3.7835 3.2835 3 4.25 3H10.5C12.433 3 14 4.567 14 6.5V20.25C14 19.1454 13.1046 18.25 12 18.25H4.25C3.2835 18.25 2.5 17.4665 2.5 16.5V4.75Z"
            stroke={primaryColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M25.5 4.75C25.5 3.7835 24.7165 3 23.75 3H17.5C15.567 3 14 4.567 14 6.5V20.25C14 19.1454 14.8954 18.25 16 18.25H23.75C24.7165 18.25 25.5 17.4665 25.5 16.5V4.75Z"
            stroke={secondaryColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 7.5H10.5M6 11H10.5M17.5 7.5H22M17.5 11H22"
            stroke={primaryColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className={`font-sans text-base sm:text-lg font-bold tracking-tight ${textColor}`}>
        MÉDITATION <span className={accentTextColor}>CPC</span>
      </span>
    </span>
  );
};
