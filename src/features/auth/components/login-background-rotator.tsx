"use client";

import { useEffect, useState } from "react";

const LOGIN_BACKGROUND_IMAGES = [
  "https://picsum.photos/id/1018/1920/1080",
  "https://picsum.photos/id/1015/1920/1080",
  "https://picsum.photos/id/1005/1920/1080",
  "https://picsum.photos/id/1024/1920/1080"
];

const ROTATION_INTERVAL_MS = 12000;
const TRANSITION_DURATION_MS = 8000;

export function LoginBackgroundRotator() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % LOGIN_BACKGROUND_IMAGES.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      {LOGIN_BACKGROUND_IMAGES.map((imageUrl, index) => (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity"
          key={imageUrl}
          style={{
            backgroundImage: `url(${imageUrl})`,
            opacity: index === activeIndex ? 1 : 0,
            transitionDuration: `${TRANSITION_DURATION_MS}ms`
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(15,23,42,0.52)_0%,rgba(15,118,110,0.35)_55%,rgba(30,41,59,0.62)_100%)]" />
    </div>
  );
}
