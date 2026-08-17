import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Image
        src="/logos/option36.png"
        alt="BODIED BY ESH"
        width={280}
        height={280}
        className="h-16 sm:h-20 md:h-24 w-auto select-none transition-all duration-300 object-contain"
        priority
      />
    </div>
  );
}
