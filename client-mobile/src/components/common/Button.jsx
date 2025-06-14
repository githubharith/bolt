import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props 
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: size === 'large' ? 16 : size === 'small' ? 8 : 12,
      paddingHorizontal: size === 'large' ? 24 : size === 'small' ? 12 : 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    if (variant === 'outline') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = colors.primary;
    } else if (variant === 'ghost') {
      baseStyle.backgroundColor = 'transparent';
    } else if (variant === 'danger') {
      baseStyle.backgroundColor = colors.error;
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = {
      color: variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF',
      fontSize: size === 'large' ? 18 : size === 'small' ? 14 : 16,
      fontWeight: '600',
    };

    if (variant === 'danger' && variant !== 'outline') {
      baseStyle.color = '#FFFFFF';
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'} 
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;