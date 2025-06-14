import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { filesAPI, linksAPI } from '../services/api';
import { socketService } from '../services/socketService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      initializeData();
      socketService.connect();
      setupSocketListeners();
    } else {
      socketService.disconnect();
      setFiles([]);
      setLinks([]);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  const initializeData = async () => {
    setLoading(true);
    await Promise.all([
      loadFiles(),
      loadLinks(),
    ]);
    setLoading(false);
  };

  const setupSocketListeners = () => {
    socketService.on('fileUploaded', (newFile) => {
      setFiles(prev => [newFile, ...prev]);
    });

    socketService.on('fileDeleted', (fileId) => {
      setFiles(prev => prev.filter(file => file._id !== fileId));
    });

    socketService.on('linkCreated', (newLink) => {
      setLinks(prev => [newLink, ...prev]);
    });

    socketService.on('linkDeleted', (linkId) => {
      setLinks(prev => prev.filter(link => link._id !== linkId));
    });

    socketService.on('linkUpdated', (updatedLink) => {
      setLinks(prev => prev.map(link => 
        link._id === updatedLink._id ? updatedLink : link
      ));
    });
  };

  const loadFiles = async (params = {}) => {
    try {
      const response = await filesAPI.getAll(params);
      setFiles(response.data.files);
      return response.data;
    } catch (error) {
      console.error('Error loading files:', error);
      return { files: [], pagination: {} };
    }
  };

  const loadLinks = async (params = {}) => {
    try {
      const response = await linksAPI.getAll(params);
      setLinks(response.data.links);
      return response.data;
    } catch (error) {
      console.error('Error loading links:', error);
      return { links: [], pagination: {} };
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFiles(),
      loadLinks(),
    ]);
    setRefreshing(false);
  };

  const uploadFile = async (fileData, onProgress) => {
    try {
      const response = await filesAPI.upload(fileData, onProgress);
      const newFile = response.data.file;
      setFiles(prev => [newFile, ...prev]);
      return { success: true, file: newFile };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Upload failed' 
      };
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await filesAPI.delete(fileId);
      setFiles(prev => prev.filter(file => file._id !== fileId));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Delete failed' 
      };
    }
  };

  const toggleFileFavorite = async (fileId) => {
    try {
      const response = await filesAPI.toggleFavorite(fileId);
      const updatedFile = response.data.file;
      setFiles(prev => prev.map(file => 
        file._id === fileId ? updatedFile : file
      ));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const createLink = async (linkData) => {
    try {
      const response = await linksAPI.create(linkData);
      const newLink = response.data.link;
      setLinks(prev => [newLink, ...prev]);
      return { success: true, link: newLink };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Link creation failed' 
      };
    }
  };

  const deleteLink = async (linkId) => {
    try {
      await linksAPI.delete(linkId);
      setLinks(prev => prev.filter(link => link._id !== linkId));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Delete failed' 
      };
    }
  };

  const toggleLinkStatus = async (linkId) => {
    try {
      const response = await linksAPI.toggle(linkId);
      const updatedLink = response.data.link;
      setLinks(prev => prev.map(link => 
        link._id === linkId ? updatedLink : link
      ));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const value = {
    files,
    links,
    loading,
    refreshing,
    loadFiles,
    loadLinks,
    refreshData,
    uploadFile,
    deleteFile,
    toggleFileFavorite,
    createLink,
    deleteLink,
    toggleLinkStatus,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};