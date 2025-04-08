import React, { createContext, useContext, useState } from 'react';

// Create context
,
  tooltipContent: {},
  registerTooltip: () => {},
  updateTooltip: () => {},
});

/**
 * InfoIconProvider - Context provider for global info icon settings
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.initialSettings - Initial settings for info icons
 * @returns {JSX.Element}
 */
export const InfoIconProvider = ({ children, initialSettings = {} }) => {
  // Default settings merged with any initialSettings
  const [globalSettings, setGlobalSettings] = useState({
    iconColor: 'text-blue-500',
    tooltipColor: 'bg-neutral-800',
    textColor: 'text-white',
    defaultPosition: 'top',
    defaultSize: 16,
    defaultWidth: 200,
    defaultIsClickable: false,
    ...initialSettings,
  });

  // Store for tooltip content by ID
  const [tooltipContent, setTooltipContent] = useState({});

  // Update global settings
  const updateGlobalSettings = (newSettings) => {
    setGlobalSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Register a tooltip with an ID and content
  const registerTooltip = (id, content) => {
    setTooltipContent(prev => ({
      ...prev,
      [id]: content,
    }));
  };

  // Update a tooltip's content
  const updateTooltip = (id, content) => {
    setTooltipContent(prev => ({
      ...prev,
      [id]: content,
    }));
  };

  return (
    <InfoIconContext.Provider
      value={{
        globalSettings,
        updateGlobalSettings,
        tooltipContent,
        registerTooltip,
        updateTooltip,
      }}
    >
      {children}
    </InfoIconContext.Provider>
  );
};

/**
 * useInfoIconContext - Hook to access the info icon context
 * 
 * @returns {Object} The info icon context
 */
export const useInfoIconContext = () => useContext(InfoIconContext);

/**
 * WithInfoIconSettings - HOC to wrap a component with custom info icon settings
 * 
 * @param {React.ComponentType} Component - The component to wrap
 * @param {Object} settings - Custom settings to apply
 * @returns {React.ComponentType} The wrapped component
 */
export const WithInfoIconSettings = (Component, settings) => {
  return (props) => {
    const { globalSettings } = useInfoIconContext();
    const mergedSettings = { ...globalSettings, ...settings };
    
    return <Component {...props} infoIconSettings={mergedSettings} />;
  };
};

export default InfoIconContext;