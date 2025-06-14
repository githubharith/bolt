import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { filesAPI, linksAPI } from '../../services/api';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { refreshing, refreshData } = useData();
  const { user } = useAuth();
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentLinks, setRecentLinks] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalLinks: 0,
    favoriteFiles: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [filesResponse, linksResponse] = await Promise.all([
        filesAPI.getRecent(),
        linksAPI.getRecent(),
      ]);

      setRecentFiles(filesResponse.data.files || []);
      setRecentLinks(linksResponse.data.links || []);

      // Calculate stats
      const favoriteCount = filesResponse.data.files?.filter(file => file.favorite).length || 0;
      setStats({
        totalFiles: filesResponse.data.files?.length || 0,
        totalLinks: linksResponse.data.links?.length || 0,
        favoriteFiles: favoriteCount,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    await Promise.all([refreshData(), loadDashboardData()]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={32} color={color} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );

  const FileItem = ({ file }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Files')}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={1}>
            {file.customFilename}
          </Text>
          {file.favorite && (
            <Ionicons name="star" size={16} color={colors.warning} />
          )}
        </View>
        <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const LinkItem = ({ link }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Links')}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={1}>
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
        <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {link.file?.customFilename} • {link.currentAccessCount} views
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Welcome back, {user?.username}!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your files and links
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="document"
            title="Files"
            value={stats.totalFiles}
            color={colors.primary}
          />
          <StatCard
            icon="link"
            title="Links"
            value={stats.totalLinks}
            color={colors.success}
          />
          <StatCard
            icon="star"
            title="Favorites"
            value={stats.favoriteFiles}
            color={colors.warning}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Files')}
            >
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => navigation.navigate('Links')}
            >
              <Ionicons name="link" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Create Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Files */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Files</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Files')}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentFiles.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="document-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No files uploaded yet
              </Text>
            </View>
          ) : (
            recentFiles.slice(0, 5).map((file) => (
              <FileItem key={file._id} file={file} />
            ))
          )}
        </View>

        {/* Recent Links */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Links</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Links')}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentLinks.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="link-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No links created yet
              </Text>
            </View>
          ) : (
            recentLinks.slice(0, 5).map((link) => (
              <LinkItem key={link._id} link={link} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  listItemSubtitle: {
    fontSize: 14,
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
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default HomeScreen;