"use client";

import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export default function AnimatedCounter({ value, duration = 1500 }: AnimatedCounterProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (nodeRef.current) {
      const startValue = parseInt(nodeRef.current.innerText.replace(/,/g, '') || '0', 10);
      
      const obj = { prop: startValue };
      anime({
        targets: obj,
        prop: value,
        round: 1,
        easing: 'easeOutExpo',
        duration: duration,
        update: function() {
          if (nodeRef.current) {
            nodeRef.current.innerHTML = obj.prop.toLocaleString();
          }
        }
      });
    }
  }, [value, duration]);

  return <span ref={nodeRef}>{(value ?? 0).toLocaleString()}</span>;
}
