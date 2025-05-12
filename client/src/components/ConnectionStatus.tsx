import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, DatabaseBackup, Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkApiConnection, checkDatabaseConnection } from '@/utils/api-fetch';

interface ConnectionStatusProps {
  className?: string;
  showRefresh?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showRefresh = true 
}) => {
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);
  const [dbStatus, setDbStatus] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnections = async () => {
    setIsChecking(true);
    
    // Check API connection
    const apiConnected = await checkApiConnection();
    setApiStatus(apiConnected);
    
    // Only check DB if API is connected
    if (apiConnected) {
      const dbConnected = await checkDatabaseConnection();
      setDbStatus(dbConnected);
    } else {
      setDbStatus(false);
    }
    
    setIsChecking(false);
  };

  useEffect(() => {
    checkConnections();
  }, []);

  return (
    <div className={`flex flex-col gap-2 p-3 text-sm rounded-md bg-gray-50 border ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">System Status</h3>
        {showRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
            onClick={checkConnections}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh'}
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        <span>API Server:</span>
        {apiStatus === null ? (
          <span className="text-gray-500">Checking...</span>
        ) : apiStatus ? (
          <span className="text-green-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Connected
          </span>
        ) : (
          <span className="text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            Disconnected
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <DatabaseBackup className="h-4 w-4" />
        <span>Database:</span>
        {dbStatus === null ? (
          <span className="text-gray-500">Checking...</span>
        ) : dbStatus ? (
          <span className="text-green-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Connected
          </span>
        ) : (
          <span className="text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {apiStatus ? 'Disconnected' : 'Check API connection first'}
          </span>
        )}
      </div>
      
      {(!apiStatus || !dbStatus) && (
        <div className="mt-1 text-xs text-gray-600">
          {!apiStatus && (
            <p>
              API connection issue. Please check that the server is running at the correct URL.
            </p>
          )}
          {apiStatus && !dbStatus && (
            <p>
              Database connection issue. The server is running but cannot connect to MongoDB.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 