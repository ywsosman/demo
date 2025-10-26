import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  start = 0, 
  suffix = '', 
  prefix = '',
  className = ''
}) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const numericEnd = parseFloat(end.toString().replace(/[^\d.]/g, ''));
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = start + (numericEnd - start) * easeOutQuart;
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(numericEnd);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  const formatCount = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else if (num % 1 !== 0) {
      return num.toFixed(1);
    } else {
      return Math.floor(num);
    }
  };

  return (
    <span 
      ref={counterRef} 
      className={`inline-block transition-all duration-1000 ease-out ${className} ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
    >
      {prefix}{formatCount(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;
