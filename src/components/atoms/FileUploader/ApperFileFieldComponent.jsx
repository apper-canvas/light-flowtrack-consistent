import React, { useState, useEffect, useRef, useMemo } from 'react';

const ApperFileFieldComponent = ({ config, elementId }) => {
  // State for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementIdRef when elementId changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoize existingFiles to prevent re-renders and detect actual changes
  const memoizedExistingFiles = useMemo(() => {
    if (!config.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }
    
    // Return empty array if no files
    if (config.existingFiles.length === 0) {
      return [];
    }
    
    // Return the files array for processing
    return config.existingFiles;
  }, [config.existingFiles?.length, config.existingFiles?.[0]?.Id || config.existingFiles?.[0]?.id]);

  // Initial Mount Effect
  useEffect(() => {
    let attemptCount = 0;
    const maxAttempts = 50;
    
    const initializeSDK = async () => {
      const checkSDK = () => {
        return new Promise((resolve) => {
          const check = () => {
            attemptCount++;
            if (window.ApperSDK?.ApperFileUploader) {
              resolve(true);
            } else if (attemptCount >= maxAttempts) {
              resolve(false);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      };

      try {
        const sdkReady = await checkSDK();
        if (!sdkReady) {
          throw new Error('ApperSDK not loaded after 5 seconds. Please ensure the SDK script is included.');
        }

        if (!mountedRef.current) {
          const { ApperFileUploader } = window.ApperSDK;
          elementIdRef.current = `file-uploader-${elementId}`;
          
          await ApperFileUploader.FileField.mount(elementIdRef.current, {
            ...config,
            existingFiles: memoizedExistingFiles
          });
          
          mountedRef.current = true;
          setIsReady(true);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to initialize ApperFileFieldComponent:', err);
        setError(err.message);
        setIsReady(false);
      }
    };

    initializeSDK();

    // Cleanup on component destruction
    return () => {
      try {
        if (mountedRef.current && window.ApperSDK?.ApperFileUploader) {
          const { ApperFileUploader } = window.ApperSDK;
          ApperFileUploader.FileField.unmount(elementIdRef.current);
        }
      } catch (err) {
        console.error('Error during unmount:', err);
      }
      
      mountedRef.current = false;
      existingFilesRef.current = [];
    };
  }, [elementId, memoizedExistingFiles]);

  // File Update Effect
  useEffect(() => {
    if (!isReady || !window.ApperSDK?.ApperFileUploader || !config.fieldKey) {
      return;
    }

    // Deep equality check with existing files
    const currentFilesStr = JSON.stringify(memoizedExistingFiles);
    const existingFilesStr = JSON.stringify(existingFilesRef.current);
    
    if (currentFilesStr === existingFilesStr) {
      return;
    }

    try {
      const { ApperFileUploader } = window.ApperSDK;
      let filesToUpdate = memoizedExistingFiles;

      // Format detection and conversion if needed
      if (filesToUpdate.length > 0) {
        // Check if files need API to UI format conversion
        const hasAPIFormat = filesToUpdate[0]?.Id !== undefined;
        if (hasAPIFormat) {
          filesToUpdate = ApperFileUploader.toUIFormat(filesToUpdate);
        }
      }

      // Update files or clear field
      if (filesToUpdate.length > 0) {
        ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
      } else {
        ApperFileUploader.FileField.clearField(config.fieldKey);
      }

      // Update reference
      existingFilesRef.current = memoizedExistingFiles;
    } catch (err) {
      console.error('Error updating files:', err);
      setError(err.message);
    }
  }, [memoizedExistingFiles, isReady, config.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <div className="flex items-center space-x-2 text-red-700">
          <span>⚠️</span>
          <span className="font-medium">File Upload Error</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        id={`file-uploader-${elementId}`}
        className="border border-slate-300 rounded-lg min-h-[100px] transition-all duration-200"
      >
        {!isReady && (
          <div className="flex items-center justify-center h-24 text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading file uploader...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;