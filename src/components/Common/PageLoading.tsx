import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 backdrop-blur-sm z-50">
      <LoadingSpinner size="large" className="text-blue-600" />
    </div>
  );
};

export default PageLoading;