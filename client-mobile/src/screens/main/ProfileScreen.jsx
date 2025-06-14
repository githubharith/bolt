import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ProfileScreen = () => {
  const { user, logout, updateProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Username and email are required');
      return;
    }

    setLoading(true);
    const result = await updateProfile({
      username: formData.username.trim(),
      email: formData.email.trim(),
    });
    setLoading(false);

    if (result.success) {
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.username, { color: colors.text }]}>{user?.username}</Text>
          <View style={styles.roleContainer}>
            <Ionicons
              name={user?.role === 'superuser' ? 'shield-checkmark' : 'person'}
              size={16}
              color={user?.role === 'superuser' ? colors.warning : colors.primary}
            />
            <Text style={[
              styles.role,
              { color: user?.role === 'superuser' ? colors.warning : colors.primary }
            ]}>
              {user?.role === 'superuser' ? 'Super User' : 'User'}
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Information</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <Input
                label="Username"
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                leftIcon="person-outline"
                editable={!loading}
              />
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  style={styles.editButton}
                  disabled={loading}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  loading={loading}
                  style={styles.editButton}
                />
              </View>
            </View>
          ) : (
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Username</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.role === 'superuser' ? 'Super User' : 'User'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member Since</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
                style={styles.settingIcon}
              />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
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
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  role: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editForm: {
    gap: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    marginTop: 16,
  },
  logoutButton: {
    marginBottom: 32,
  },
});

export default ProfileScreen;