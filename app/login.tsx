import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to tabs on success
      router.replace('/(tabs)/add');
    } catch (error: any) {

      switch (error.code) {
        case 'auth/user-not-found':
          setFeedback({ type: 'error', message: 'Người dùng không tồn tại.' });
          break;
        case 'auth/wrong-password':
          setFeedback({ type: 'error', message: 'Mật khẩu không đúng.' });
          break;
        case 'auth/invalid-email':
          setFeedback({ type: 'error', message: 'Email không hợp lệ.' });
          break;
        case 'auth/invalid-credential':
          setFeedback({ type: 'error', message: 'Thông tin đăng nhập không hợp lệ.' });
          break;
        default:
          setFeedback({ type: 'error', message: 'Đăng nhập thất bại. Vui lòng thử lại.' });
          break;
      }

      setFeedback({ type: 'error', message: 'Đăng nhập thất bại. Vui lòng thử lại.' });

      // Log the actual error for debugging
      console.log('Login error:', error.code, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
        {loading ? (
    <>
      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.buttonText}>Đang đăng nhập...</Text>
    </>
  ) : (
    <Text style={styles.buttonText}>Đăng nhập</Text>
  )}
        {/* <Text style={styles.buttonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text> */}
      </TouchableOpacity>

      {/* Feedback */}
        {feedback && (
          <Card style={[
            styles.feedback,
            {
              backgroundColor: feedback.type === 'success' ? colors.success : colors.error,
              borderColor: feedback.type === 'success' ? colors.success : colors.error,
            }
          ]}>
            <View style={styles.feedbackContent}>
              <Ionicons
                name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color={colors.white}
              />
              <Text style={[styles.feedbackText, { color: colors.white }]}>
                {feedback.message}
              </Text>
            </View>
          </Card>
        )}

      <TouchableOpacity
        onPress={() => router.push('/signup')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
  feedback: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  feedbackText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
});