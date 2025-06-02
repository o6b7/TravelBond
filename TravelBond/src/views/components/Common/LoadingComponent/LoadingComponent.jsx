import React from 'react';
import { COLORS } from '../../../../utils/config';
import './LoadingComponent.css';

const LoadingComponent = ({ size = 'medium', variant = 'identity', fullPage = false }) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  };

  const getColorStyle = () => {
    switch(variant) {
      case 'hover':
        return { borderTopColor: COLORS.hover };
      case 'active':
        return { borderTopColor: COLORS.active };
      case 'success':
        return { borderTopColor: COLORS.success };
      case 'danger':
        return { borderTopColor: COLORS.danger };
      default: // 'identity'
        return { borderTopColor: COLORS.identity };
    }
  };

  return (
    <div className={`loading-container ${fullPage ? 'full-page' : ''}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div style={getColorStyle()}></div>
        <div style={getColorStyle()}></div>
        <div style={getColorStyle()}></div>
        <div style={getColorStyle()}></div>
      </div>
      {fullPage && <div className="loading-overlay"></div>}
    </div>
  );
};

export default LoadingComponent;