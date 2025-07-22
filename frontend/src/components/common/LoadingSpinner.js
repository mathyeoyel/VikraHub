import React from 'react';
import './LoadingSpinner.css';

export const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p className="loading-message">{message}</p>
  </div>
);

export const SkeletonLoader = ({ rows = 3 }) => (
  <div className="skeleton-container">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="skeleton-row">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-content">
          <div className="skeleton-line skeleton-line-title"></div>
          <div className="skeleton-line skeleton-line-text"></div>
        </div>
      </div>
    ))}
  </div>
);

export const ButtonLoader = () => (
  <div className="button-loader">
    <div className="spinner-small"></div>
  </div>
);

export default LoadingSpinner;
