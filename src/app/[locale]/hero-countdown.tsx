'use client';

import { useEffect, useState } from 'react';

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type HeroCountdownProps = {
  targetIso: string;
};

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function getCountdown(targetIso: string): Countdown {
  const targetMs = Date.parse(targetIso);
  const diffMs = Math.max(0, targetMs - Date.now());

  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((diffMs % MINUTE_MS) / SECOND_MS);

  return { days, hours, minutes, seconds };
}

export default function HeroCountdown({ targetIso }: HeroCountdownProps) {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const tick = () => setCountdown(getCountdown(targetIso));
    tick();
    const intervalId = window.setInterval(tick, SECOND_MS);
    return () => window.clearInterval(intervalId);
  }, [targetIso]);

  const days = countdown?.days ?? 0;
  const hours = countdown?.hours ?? 0;
  const minutes = countdown?.minutes ?? 0;
  const seconds = countdown?.seconds ?? 0;
  const text = `${days}d ${hours}h ${minutes}min ${seconds}s`;

  return (
    <p className="hero-countdown" aria-live="polite">
      {text}
    </p>
  );
}
