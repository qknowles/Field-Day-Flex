import React from 'react';
import InfoIcon from './InfoIcon';

/**
 * InfoProvider - A wrapper component for placing info icons next to content
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to display next to the info icon
 * @param {string} props.text - The tooltip text to display
 * @param {string} props.position - Position of the tooltip: 'top', 'right', 'bottom', 'left'
 * @param {string} props.className - Additional classes for the wrapper container
 * @param {string} props.iconPosition - Position of the icon: 'left', 'right' (default: 'right')
 * @param {Object} props.iconProps - Additional props to pass to the InfoIcon component
 * @returns {JSX.Element}
 */
const InfoProvider = ({
  children,
  text,
  position = 'top',
  className = '',
  iconPosition = 'right',
  iconProps = {},
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {iconPosition === 'left' && (
        <InfoIcon 
          text={text} 
          position={position}
          className="mr-2"
          {...iconProps}
        />
      )}
      
      {children}
      
      {iconPosition === 'right' && (
        <InfoIcon 
          text={text} 
          position={position}
          className="ml-2"
          {...iconProps}
        />
      )}
    </div>
  );
};

export default InfoProvider;