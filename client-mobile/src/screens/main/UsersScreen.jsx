import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { usersAPI } from '../../services/api';
import Input from '../../components/common/Input';
import LoadingScreen from '../../components/common/LoadingScreen';

const UsersScreen = () => {
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({
        search: searchQuery,
        limit: 50,
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Debounce search
    setTimeout(() => {
      loadUsers();
    }, 500);
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete user "${user.username}"? This will deactivate their account and all associated data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersAPI.delete(user._id);
              loadUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleUpdateRole = async (user, newRole) => {
    try {
      await usersAPI.updateRole(user._id, newRole);
      loadUsers();
      Alert.alert('Success', `User role updated to ${newRole}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderUserItem = ({ item: user }) => (
    <View style={[styles.userItem, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.userAvatarText}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.username}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>
            <View style={styles.userStats}>
              <View style={styles.userStat}>
                <Ionicons name="document" size={12} color={colors.primary} />
                <Text style={[styles.userStatText, { color: colors.textMuted }]}>
                  {user.stats?.fileCount || 0}
                </Text>
              </View>
              <View style={styles.userStat}>
                <Ionicons name="link" size={12} color={colors.success} />
                <Text style={[styles.userStatText, { color: colors.textMuted }]}>
                  {user.stats?.linkCount || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.userMeta}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              {
                backgroundColor: user.role === 'superuser' ? colors.warning : colors.primary,
              },
            ]}
            onPress={() => {
              const newRole = user.role === 'superuser' ? 'user' : 'superuser';
              Alert.alert(
                'Change Role',
                `Change ${user.username}'s role to ${newRole}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Change',
                    onPress: () => handleUpdateRole(user, newRole),
                  },
                ]
              );
            }}
          >
            <Ionicons
              name={user.role === 'superuser' ? 'shield-checkmark' : 'person'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.roleText}>{user.role}</Text>
          </TouchableOpacity>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: user.isActive ? colors.success : colors.error }
          ]}>
            <Text style={styles.statusText}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.userDate, { color: colors.textMuted }]}>
          Joined {formatDate(user.createdAt)}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={() => handleDeleteUser(user)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading && users.length === 0) {
    return <LoadingScreen message="Loading users..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.text }]}>Users</Text>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.warning} />
            <Text style={[styles.badgeText, { color: colors.warning }]}>Superuser Only</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search users by username or email..."
          leftIcon="search-outline"
          style={styles.searchInput}
        />
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery ? 'No users found' : 'No users in the system'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  userItem: {
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  userStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userStatText: {
    fontSize: 12,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
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
  userDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
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
    textAlign: 'center',
  },
});

export default UsersScreen;