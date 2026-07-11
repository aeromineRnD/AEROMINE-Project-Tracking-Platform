"use client";

import { useEffect, useRef } from "react";

export function TourViewer({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Forward device motion into the tour iframe so mobile gyroscope / VR works.
  useEffect(() => {
    function onMotion(e: DeviceMotionEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        {
          type: "devicemotion",
          deviceMotionEvent: {
            acceleration: {
              x: e.acceleration?.x, y: e.acceleration?.y, z: e.acceleration?.z,
            },
            accelerationIncludingGravity: {
              x: e.accelerationIncludingGravity?.x,
              y: e.accelerationIncludingGravity?.y,
              z: e.accelerationIncludingGravity?.z,
            },
            rotationRate: {
              alpha: e.rotationRate?.alpha,
              beta: e.rotationRate?.beta,
              gamma: e.rotationRate?.gamma,
            },
            interval: e.interval,
            timeStamp: e.timeStamp,
          },
        },
        "*"
      );
    }
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="360° Walkthrough"
      src={url}
      className="w-full h-[280px] md:h-[420px] border-0 block"
      loading="lazy"
      scrolling="no"
      allow="vr; xr; accelerometer; gyroscope; autoplay; fullscreen"
      allowFullScreen
    />
  );
}
