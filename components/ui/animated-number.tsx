"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 500,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = displayValue.toFixed(decimals);
  
  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Simpler version for prices
export function AnimatedPrice({
  value,
  duration = 400,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      prefix="$"
      decimals={2}
      className={className}
    />
  );
}

// For percentages
export function AnimatedPercent({
  value,
  duration = 400,
  showSign = true,
  className,
}: {
  value: number;
  duration?: number;
  showSign?: boolean;
  className?: string;
}) {
  const sign = showSign && value > 0 ? "+" : "";
  return (
    <AnimatedNumber
      value={value}
      duration={duration}
      prefix={sign}
      suffix="%"
      decimals={1}
      className={className}
    />
  );
}
