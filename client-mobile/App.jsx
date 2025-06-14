import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

// Context Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { DataProvider } from './src/contexts/DataContext';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import FilesScreen from './src/screens/main/FilesScreen';
import LinksScreen from './src/screens/main/LinksScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import UsersScreen from './src/screens/main/UsersScreen';
import LinkAccessScreen from './src/screens/public/LinkAccessScreen';

// Components
import { useAuth } from './src/contexts/AuthContext';
import { useTheme } from './src/contexts/ThemeContext';
import LoadingScreen from './src/components/common/LoadingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Files') {
            iconName = focused ? 'document' : 'document-outline';
          } else if (route.name === 'Links') {
            iconName = focused ? 'link' : 'link-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Files" 
        component={FilesScreen}
        options={{ title: 'Files' }}
      />
      <Tab.Screen 
        name="Links" 
        component={LinksScreen}
        options={{ title: 'Links' }}
      />
      {user?.role === 'superuser' && (
        <Tab.Screen 
          name="Users" 
          component={UsersScreen}
          options={{ title: 'Users' }}
        />
      )}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LinkAccess" component={LinkAccessScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
        <Stack.Screen 
          name="Public" 
          component={PublicStack}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <AppNavigator />
            <StatusBar style="auto" />
            <Toast />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}