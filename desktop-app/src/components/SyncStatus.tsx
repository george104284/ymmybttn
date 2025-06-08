import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { RefreshCcw, Lock, Unlock } from 'lucide-react';

interface ProductSyncState {
  status: 'Synced' | 'Syncing' | { Error: string };
  last_synced: string | null;
  products_count: number;
  error_message: string | null;
}

interface AuthState {
  is_authenticated: boolean;
  last_auth_check: string | null;
  auth_error: string | null;
}

export function SyncStatus() {
  const [syncState, setSyncState] = useState<ProductSyncState | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isForceSync, setIsForceSync] = useState(false);

  const fetchSyncStatus = async () => {
    try {
      const status = await invoke<ProductSyncState>('get_sync_status');
      setSyncState(status);
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  const fetchAuthStatus = async () => {
    try {
      const status = await invoke<AuthState>('get_auth_status');
      setAuthState(status);
    } catch (err) {
      console.error('Failed to fetch auth status:', err);
    }
  };

  const handleForceSync = async () => {
    try {
      setIsForceSync(true);
      await invoke('force_sync');
    } catch (err) {
      console.error('Force sync failed:', err);
    } finally {
      setIsForceSync(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSyncStatus();
    fetchAuthStatus();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchSyncStatus();
      fetchAuthStatus();
    }, 5000);

    // Listen for sync status changes
    const unlistenSync = listen<ProductSyncState>('sync-status-changed', (event) => {
      setSyncState(event.payload);
    });

    // Listen for auth status changes
    const unlistenAuth = listen<AuthState>('auth-status-changed', (event) => {
      setAuthState(event.payload);
    });

    return () => {
      clearInterval(interval);
      unlistenSync.then(fn => fn());
      unlistenAuth.then(fn => fn());
    };
  }, []);

  if (!syncState) return null;

  const getStatusIcon = () => {
    if (typeof syncState.status === 'string') {
      switch (syncState.status) {
        case 'Synced':
          return '🟢';
        case 'Syncing':
          return '🔄';
      }
    } else if ('Error' in syncState.status) {
      return '🔴';
    }
    return '❓';
  };

  const getStatusText = () => {
    if (typeof syncState.status === 'string') {
      return syncState.status;
    } else if ('Error' in syncState.status) {
      // Use error_message if available, otherwise use the Error object
      return syncState.error_message || `Error: ${syncState.status.Error}`;
    }
    return 'Unknown';
  };

  const formatLastSynced = () => {
    if (!syncState.last_synced) return 'Never';
    
    const date = new Date(syncState.last_synced);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  const isSynced = typeof syncState.status === 'string' && syncState.status === 'Synced';
  const isSyncing = typeof syncState.status === 'string' && syncState.status === 'Syncing';

  const isAuthenticated = authState?.is_authenticated ?? false;
  const hasAuthError = authState?.auth_error != null;

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Authentication status */}
      <span className="flex items-center space-x-1">
        {isAuthenticated ? (
          <Unlock className="w-4 h-4 text-green-600" />
        ) : (
          <Lock className="w-4 h-4 text-red-600" />
        )}
        <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
          {isAuthenticated ? 'Authenticated' : hasAuthError ? 'Auth Error' : 'Not Authenticated'}
        </span>
      </span>
      
      <span className="text-gray-400">•</span>
      
      {/* Sync status */}
      <span className="font-medium">{getStatusIcon()}</span>
      <span className={isSynced ? 'text-green-600' : isSyncing ? 'text-blue-600' : 'text-red-600'}>
        {getStatusText()}
      </span>
      {isSynced && syncState.last_synced && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            {formatLastSynced()}
          </span>
        </>
      )}
      {syncState.products_count > 0 && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">
            {syncState.products_count} products
          </span>
        </>
      )}
      
      {/* Force sync button - disabled if not authenticated */}
      <button
        onClick={handleForceSync}
        disabled={!isAuthenticated || isSyncing || isForceSync}
        className="ml-2 p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={!isAuthenticated ? "Authentication required" : "Force sync"}
      >
        <RefreshCcw className={`w-4 h-4 ${(isSyncing || isForceSync) ? 'animate-spin' : ''}`} />
      </button>
      
      {/* Show auth error tooltip if present */}
      {hasAuthError && (
        <span className="text-xs text-red-600" title={authState.auth_error || ''}>
          ⚠️
        </span>
      )}
    </div>
  );
}