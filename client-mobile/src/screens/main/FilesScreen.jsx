import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingScreen from '../../components/common/LoadingScreen';

const FilesScreen = () => {
  const { colors } = useTheme();
  const { 
    files, 
    loading, 
    refreshing, 
    loadFiles, 
    refreshData, 
    uploadFile, 
    deleteFile, 
    toggleFileFavorite 
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.customFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.originalFilename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = !showFavoritesOnly || file.favorite;
    return matchesSearch && matchesFavorite;
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        setCustomFilename(file.name);
        setUploadModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !customFilename.trim()) {
      Alert.alert('Error', 'Please select a file and provide a custom filename');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      type: selectedFile.mimeType,
      name: selectedFile.name,
    });
    formData.append('customFilename', customFilename.trim());

    const result = await uploadFile(formData, (progress) => {
      setUploadProgress(progress);
    });

    setUploading(false);

    if (result.success) {
      setUploadModalVisible(false);
      setSelectedFile(null);
      setCustomFilename('');
      Alert.alert('Success', 'File uploaded successfully');
    } else {
      Alert.alert('Upload Failed', result.message);
    }
  };

  const handleDeleteFile = (file) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.customFilename}"? This will also delete all associated links.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteFile(file._id);
            if (!result.success) {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (file) => {
    const result = await toggleFileFavorite(file._id);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFileItem = ({ item: file }) => (
    <View style={[styles.fileItem, { backgroundColor: colors.surface }]}>
      <View style={styles.fileInfo}>
        <View style={styles.fileHeader}>
          <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
            {file.customFilename}
          </Text>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(file)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={file.favorite ? 'star' : 'star-outline'}
              size={20}
              color={file.favorite ? colors.warning : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.fileDetails, { color: colors.textSecondary }]} numberOfLines={1}>
          {file.originalFilename}
        </Text>
        <Text style={[styles.fileMetadata, { color: colors.textMuted }]}>
          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteFile(file)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading && files.length === 0) {
    return <LoadingScreen message="Loading files..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search files..."
          leftIcon="search-outline"
          style={styles.searchInput}
        />
        <TouchableOpacity
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={[
            styles.filterButton,
            {
              backgroundColor: showFavoritesOnly ? colors.warning : colors.surface,
            },
          ]}
        >
          <Ionicons
            name="star"
            size={20}
            color={showFavoritesOnly ? '#FFFFFF' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Files List */}
      <FlatList
        data={filteredFiles}
        renderItem={renderFileItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery || showFavoritesOnly ? 'No files found' : 'No files uploaded yet'}
            </Text>
            {!searchQuery && !showFavoritesOnly && (
              <Button
                title="Upload Your First File"
                onPress={handlePickFile}
                style={styles.emptyButton}
              />
            )}
          </View>
        }
      />

      {/* Upload FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handlePickFile}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Upload File</Text>
            <TouchableOpacity
              onPress={() => setUploadModalVisible(false)}
              disabled={uploading}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedFile && (
              <View style={[styles.filePreview, { backgroundColor: colors.surface }]}>
                <Ionicons name="document" size={32} color={colors.primary} />
                <View style={styles.filePreviewInfo}>
                  <Text style={[styles.filePreviewName, { color: colors.text }]}>
                    {selectedFile.name}
                  </Text>
                  <Text style={[styles.filePreviewSize, { color: colors.textSecondary }]}>
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </View>
              </View>
            )}

            <Input
              label="Custom Filename"
              value={customFilename}
              onChangeText={setCustomFilename}
              placeholder="Enter a custom name for your file"
              editable={!uploading}
            />

            {uploading && (
              <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  Uploading... {uploadProgress}%
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.primary, width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            <Button
              title={uploading ? 'Uploading...' : 'Upload File'}
              onPress={handleUpload}
              loading={uploading}
              disabled={!selectedFile || !customFilename.trim()}
              style={styles.uploadButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fileInfo: {
    flex: 1,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  fileDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  fileMetadata: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  filePreviewInfo: {
    marginLeft: 12,
    flex: 1,
  },
  filePreviewName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  filePreviewSize: {
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  uploadButton: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});

export default FilesScreen;