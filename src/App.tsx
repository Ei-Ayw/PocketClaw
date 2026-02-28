import { useState, useEffect } from 'react';
import { Window } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from './store';
import Titlebar from './components/Titlebar';
import Dashboard from './components/Dashboard';
import ToastContainer from './components/ToastContainer';

const appWindow = new Window('main');

function App() {
  const hydrateFromBackend = useAppStore((state) => state.hydrateFromBackend);
  const [isMaximized, setIsMaximized] = useState(false);

  // CHAOS-11: Hydrate config from Rust backend on startup
  useEffect(() => {
    invoke<{ configured: boolean; provider_id?: string; model?: string }>('get_config')
      .then((config) => {
        hydrateFromBackend({
          isConfigured: config.configured,
          providerId: config.provider_id,
          model: config.model,
        });
      })
      .catch(() => {
        // Backend may not have get_config yet — silently continue with defaults
      });
  }, []);

  // D-03: Disable browser right-click context menu in production
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | undefined;
    let debounceTimer: ReturnType<typeof setTimeout>;

    appWindow.isMaximized().then((v) => { if (mounted) setIsMaximized(v); });

    appWindow.onResized(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (mounted) appWindow.isMaximized().then((v) => { if (mounted) setIsMaximized(v); });
      }, 100);
    }).then(fn => {
      if (mounted) {
        unlisten = fn;
      } else {
        fn();
      }
    });

    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <div className={`w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans border border-white/5 shadow-2xl relative ${isMaximized ? 'rounded-none' : 'rounded-xl'}`}>
      <Titlebar isMaximized={isMaximized} />
      <div className="flex-1 mt-10 overflow-hidden flex relative">
        <Dashboard />
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
