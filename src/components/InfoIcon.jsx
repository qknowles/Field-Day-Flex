import React, { useState, useRef, useEffect } from 'react';

/**
 * InfoIcon - A reusable information icon with popup
 * 
 * @param {Object} props
 * @param {string} props.text - The popup text to display
 * @param {string} props.position - Position of the popup: 'top', 'right', 'bottom', 'left' (default: 'top')
 * @param {string} props.className - Additional classes for the info icon
 * @param {string} props.iconColor - Color for the icon (default: 'text-blue-500')
 * @param {string} props.popupColor - Background color for the popup (default: 'bg-white')
 * @param {string} props.textColor - Text color for the popup (default: 'text-neutral-800')
 * @param {number} props.size - Size of the icon in pixels (default: 16)
 * @param {boolean} props.isClickable - Whether the popup shows on click instead of hover (default: false)
 * @param {number} props.width - Width of the popup in pixels (default: 250)
 * @returns {JSX.Element}
 */
const InfoIcon = ({
  text,
  position = 'top',
  className = '',
  iconColor = 'text-blue-500',
  popupColor = 'bg-white',
  textColor = 'text-neutral-800',
  size = 16,
  isClickable = false, // Back to hover as default
  width = 250,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const iconRef = useRef(null);
  const popupRef = useRef(null);
  const containerRef = useRef(null);
  
  // Calculate position for the popup
  const getPopupStyle = () => {
    const baseStyle = { 
      width: `${width}px`,
      zIndex: 1000
    };
    
    // We'll position it fixed instead of absolute to ensure it's always visible
    if (iconRef.current && showPopup) {
      const rect = iconRef.current.getBoundingClientRect();
      
      switch(position) {
        case 'top':
          return {
            ...baseStyle,
            position: 'fixed',
            bottom: `${window.innerHeight - rect.top + 10}px`,
            left: `${rect.left + (rect.width / 2) - (width / 2)}px`
          };
        case 'right':
          return {
            ...baseStyle,
            position: 'fixed',
            left: `${rect.right + 10}px`,
            top: `${rect.top + (rect.height / 2) - 20}px`
          };
        case 'bottom':
          return {
            ...baseStyle,
            position: 'fixed',
            top: `${rect.bottom + 10}px`,
            left: `${rect.left + (rect.width / 2) - (width / 2)}px`
          };
        case 'left':
          return {
            ...baseStyle,
            position: 'fixed',
            right: `${window.innerWidth - rect.left + 10}px`,
            top: `${rect.top + (rect.height / 2) - 20}px`
          };
        default:
          return {
            ...baseStyle,
            position: 'fixed',
            bottom: `${window.innerHeight - rect.top + 10}px`,
            left: `${rect.left + (rect.width / 2) - (width / 2)}px`
          };
      }
    }
    
    return baseStyle;
  };

  // Handle mouse enter/leave for both icon and popup
  const handleMouseEnter = () => {
    if (!isClickable) {
      setShowPopup(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isClickable) {
      setShowPopup(false);
    }
  };

  // For click behavior
  const handleClick = () => {
    if (isClickable) {
      setShowPopup(!showPopup);
    }
  };

  // Close popup on outside click (only for clickable mode)
  useEffect(() => {
    if (isClickable && showPopup) {
      const handleClickOutside = (event) => {
        if (
          containerRef.current && 
          !containerRef.current.contains(event.target)
        ) {
          setShowPopup(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isClickable, showPopup]);

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      ref={containerRef}
      onClick={handleClick}
    >
      {/* Info Icon */}
      <div
        ref={iconRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`cursor-pointer ${iconColor}`}
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>

      {/* Popup */}
      {showPopup && (
        <div 
          ref={popupRef}
          className={`${popupColor} ${textColor} px-4 py-3 text-sm rounded shadow-lg border border-neutral-300 dark:border-neutral-600`}
          style={getPopupStyle()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative">
            {/* Content */}
            <div>
              {text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoIcon;