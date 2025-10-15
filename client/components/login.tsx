import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { styles } from '@/components/styles/login-styles';
import { loginApi } from '@/api/auth';

type LoginProps = {
  onSubmit?: (credentials: { username: string; password: string }) => Promise<void> | void;
  onRegisterPress?: () => void;
  onForgotPasswordPress?: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export default function Login({ onSubmit, onRegisterPress, onForgotPasswordPress, isSubmitting = false, errorMessage = null }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (onSubmit) {
      onSubmit({ username, password });
      return;
    }

    try {
      setLocalError(null);
      setLocalSubmitting(true);
      const { token, user } = await loginApi({ username, password });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed';
      setLocalError(msg);
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={!(isSubmitting || localSubmitting)}
          returnKeyType="next"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          style={styles.input}
          editable={!(isSubmitting || localSubmitting)}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {!errorMessage && localError ? <Text style={styles.error}>{localError}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        disabled={isSubmitting || localSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Login"
      >
        {isSubmitting || localSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </Pressable>

      <View style={styles.linksRow}>
        <Pressable
          onPress={onRegisterPress}
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Register"
        >
          <Text style={styles.linkText}>Register</Text>
        </Pressable>
        <Pressable
          onPress={onForgotPasswordPress}
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
        >
          <Text style={styles.linkText}>Forgot password</Text>
        </Pressable>
      </View>
    </View>
  );
}


