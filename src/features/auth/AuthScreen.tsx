import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../shared/providers/AuthProvider';
import { theme } from '../../shared/utils/theme';

type Mode = 'signin' | 'signup';

type Props = {
  onContinueWithoutAccount: () => void;
};

export function AuthScreen({ onContinueWithoutAccount }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    const { error: err } =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.switch}
        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        <Text style={styles.switchText}>
          {mode === 'signin'
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.skip}
        onPress={onContinueWithoutAccount}
      >
        <Text style={styles.skipText}>Continue without account</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  error: {
    color: '#b94e2c',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.accentStrong,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accentText,
  },
  switch: {
    alignItems: 'center',
    marginBottom: 24,
  },
  switchText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  skip: {
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
