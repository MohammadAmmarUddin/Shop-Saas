import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStore = useCallback(async () => {
    if (!user) {
      setStore(null);
      setSettings(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/stores/current');
      const storeData = res.data.data || res.data;
      setStore(storeData);
      if (storeData.settings) {
        setSettings(storeData.settings);
      }
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get('/stores/settings');
      setSettings(res.data.data || res.data);
    } catch {
    }
  }, []);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const updateStore = async (data) => {
    try {
      const res = await api.put('/stores', data);
      const storeData = res.data.data || res.data;
      setStore(storeData);
      return storeData;
    } catch (err) {
      throw err;
    }
  };

  const updateSettings = async (data) => {
    try {
      const res = await api.put('/stores/settings', data);
      const settingsData = res.data.data || res.data;
      setSettings(settingsData);
      return settingsData;
    } catch (err) {
      throw err;
    }
  };

  return (
    <StoreContext.Provider value={{
      store, settings, loading,
      loadStore, loadSettings,
      updateStore, updateSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};
