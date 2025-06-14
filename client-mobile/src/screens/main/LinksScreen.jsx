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
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingScreen from '../../components/common/LoadingScreen';

const LinksScreen = () => {
  const { colors } = useTheme();
  const { 
    files,
    links, 
    loading, 
    refreshing, 
    loadLinks, 
    refreshData, 
    createLink, 
    deleteLink, 
    toggleLinkStatus 
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [linkForm, setLinkForm] = useState({
    fileId: '',
    customName: '',
    expirationType: 'none',
    expirationValue: '',
    accessLimit: '',
    verificationType: 'none',
    verificationValue: '',
    accessScope: 'public',
    downloadAllowed: false,
    description: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = !showActiveOnly || link.isActive;
    return matchesSearch && matchesActive;
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const resetForm = () => {
    setLinkForm({
      fileId: '',
      customName: '',
      expirationType: 'none',
      expirationValue: '',
      accessLimit: '',
      verificationType: 'none',
      verificationValue: '',
      accessScope: 'public',
      downloadAllowed: false,
      description: '',
    });
  };

  const handleCreateLink = async () => {
    if (!linkForm.fileId || !linkForm.customName.trim()) {
      Alert.alert('Error', 'Please select a file and provide a custom name');
      return;
    }

    setCreating(true);

    const linkData = {
      fileId: linkForm.fileId,
      customName: linkForm.customName.trim(),
      expirationType: linkForm.expirationType,
      expirationValue: linkForm.expirationType === 'none' ? null : 
                      linkForm.expirationType === 'date' ? linkForm.expirationValue :
                      parseInt(linkForm.expirationValue),
      accessLimit: linkForm.accessLimit ? parseInt(linkForm.accessLimit) : null,
      verificationType: linkForm.verificationType,
      verificationValue: linkForm.verificationType === 'none' ? null : linkForm.verificationValue.trim(),
      accessScope: linkForm.accessScope,
      allowedUsers: [], // TODO: Implement user selection
      downloadAllowed: linkForm.downloadAllowed,
      description: linkForm.description.trim(),
    };

    const result = await createLink(linkData);
    setCreating(false);

    if (result.success) {
      setCreateModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Link created successfully');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleDeleteLink = (link) => {
    Alert.alert(
      'Delete Link',
      `Are you sure you want to delete the link "${link.customName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteLink(link._id);
            if (!result.success) {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (link) => {
    const result = await toggleLinkStatus(link._id);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  const handleCopyLink = (linkId) => {
    const url = `${process.env.EXPO_PUBLIC_APP_URL || 'https://guardshare.app'}/link/${linkId}`;
    // Note: React Native doesn't have navigator.clipboard, you'd need to use expo-clipboard
    Alert.alert('Link Copied', url);
  };

  const handleOpenLink = (linkId) => {
    const url = `${process.env.EXPO_PUBLIC_APP_URL || 'https://guardshare.app'}/link/${linkId}`;
    Linking.openURL(url);
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

  const getAccessScopeIcon = (scope) => {
    switch (scope) {
      case 'public':
        return { name: 'globe-outline', color: colors.success };
      case 'users':
        return { name: 'people-outline', color: colors.warning };
      case 'selected':
        return { name: 'lock-closed-outline', color: colors.error };
      default:
        return { name: 'help-outline', color: colors.textMuted };
    }
  };

  const renderLinkItem = ({ item: link }) => {
    const scopeIcon = getAccessScopeIcon(link.accessScope);
    
    return (
      <View style={[styles.linkItem, { backgroundColor: colors.surface }]}>
        <View style={styles.linkInfo}>
          <View style={styles.linkHeader}>
            <Text style={[styles.linkName, { color: colors.text }]} numberOfLines={1}>
              {link.customName}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: link.isActive ? colors.success : colors.textMuted }
            ]}>
              <Text style={styles.statusText}>
                {link.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text style={[styles.linkFile, { color: colors.textSecondary }]} numberOfLines={1}>
            {link.file?.customFilename || 'Unknown file'}
          </Text>
          <View style={styles.linkMetadata}>
            <View style={styles.linkStat}>
              <Ionicons name={scopeIcon.name} size={14} color={scopeIcon.color} />
              <Text style={[styles.linkStatText, { color: colors.textMuted }]}>
                {link.currentAccessCount}
                {link.accessLimit && `/${link.accessLimit}`}
              </Text>
            </View>
            {link.verificationType !== 'none' && (
              <View style={styles.linkStat}>
                <Ionicons name="lock-closed" size={14} color={colors.primary} />
                <Text style={[styles.linkStatText, { color: colors.textMuted }]}>
                  {link.verificationType}
                </Text>
              </View>
            )}
            {link.downloadAllowed && (
              <View style={styles.linkStat}>
                <Ionicons name="download" size={14} color={colors.success} />
              </View>
            )}
          </View>
          <Text style={[styles.linkDate, { color: colors.textMuted }]}>
            Created {formatDate(link.createdAt)}
          </Text>
        </View>
        <View style={styles.linkActions}>
          <TouchableOpacity
            onPress={() => handleToggleStatus(link)}
            style={styles.actionButton}
          >
            <Ionicons
              name={link.isActive ? 'pause' : 'play'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCopyLink(link.linkId)}
            style={styles.actionButton}
          >
            <Ionicons name="copy-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteLink(link)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && links.length === 0) {
    return <LoadingScreen message="Loading links..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search links..."
          leftIcon="search-outline"
          style={styles.searchInput}
        />
        <TouchableOpacity
          onPress={() => setShowActiveOnly(!showActiveOnly)}
          style={[
            styles.filterButton,
            {
              backgroundColor: showActiveOnly ? colors.success : colors.surface,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={showActiveOnly ? '#FFFFFF' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Links List */}
      <FlatList
        data={filteredLinks}
        renderItem={renderLinkItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery || showActiveOnly ? 'No links found' : 'No links created yet'}
            </Text>
            {!searchQuery && !showActiveOnly && (
              <Button
                title="Create Your First Link"
                onPress={() => setCreateModalVisible(true)}
                style={styles.emptyButton}
              />
            )}
          </View>
        }
      />

      {/* Create FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Link Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Link</Text>
            <TouchableOpacity
              onPress={() => {
                setCreateModalVisible(false);
                resetForm();
              }}
              disabled={creating}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* File Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select File</Text>
            <View style={styles.fileSelector}>
              {files.map((file) => (
                <TouchableOpacity
                  key={file._id}
                  style={[
                    styles.fileOption,
                    {
                      backgroundColor: linkForm.fileId === file._id ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setLinkForm(prev => ({ ...prev, fileId: file._id }))}
                >
                  <Text
                    style={[
                      styles.fileOptionText,
                      { color: linkForm.fileId === file._id ? '#FFFFFF' : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {file.customFilename}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Custom Link Name"
              value={linkForm.customName}
              onChangeText={(value) => setLinkForm(prev => ({ ...prev, customName: value }))}
              placeholder="Enter a unique name for this link"
              editable={!creating}
            />

            <Input
              label="Description (Optional)"
              value={linkForm.description}
              onChangeText={(value) => setLinkForm(prev => ({ ...prev, description: value }))}
              placeholder="Add a description for this link"
              multiline
              numberOfLines={3}
              editable={!creating}
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Allow Download</Text>
              <Switch
                value={linkForm.downloadAllowed}
                onValueChange={(value) => setLinkForm(prev => ({ ...prev, downloadAllowed: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={creating}
              />
            </View>

            <Button
              title={creating ? 'Creating...' : 'Create Link'}
              onPress={handleCreateLink}
              loading={creating}
              disabled={!linkForm.fileId || !linkForm.customName.trim()}
              style={styles.createButton}
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
  linkItem: {
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
  linkInfo: {
    flex: 1,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  linkFile: {
    fontSize: 14,
    marginBottom: 4,
  },
  linkMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 12,
  },
  linkStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkStatText: {
    fontSize: 12,
  },
  linkDate: {
    fontSize: 12,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  fileSelector: {
    marginBottom: 16,
  },
  fileOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  fileOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});

export default LinksScreen;