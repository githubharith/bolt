import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username or email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const result = await login(formData.username, formData.password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
              <Ionicons name="flash" size={32} color={colors.secondary} style={styles.flashIcon} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>GuardShare</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Secure file sharing reimagined
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="Username or Email"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="Enter your username or email"
              leftIcon="person-outline"
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <Button
              title="Don't have an account? Sign Up"
              onPress={navigateToRegister}
              variant="ghost"
              style={styles.registerButton}
            />
          </View>

          {/* Demo Credentials */}
          <View style={[styles.demoContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.demoTitle, { color: colors.text }]}>Demo Credentials</Text>
            <View style={styles.demoRow}>
              <View style={styles.demoItem}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Regular User</Text>
                <Text style={[styles.demoCredentials, { color: colors.text }]}>demo / demo123</Text>
              </View>
              <View style={styles.demoItem}>
                <Text style={[styles.demoLabel, { color: colors.textSecondary }]}>Super User</Text>
                <Text style={[styles.demoCredentials, { color: colors.text }]}>admin / admin123</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flashIcon: {
    marginLeft: -8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 8,
  },
  demoContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  demoItem: {
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  demoCredentials: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;