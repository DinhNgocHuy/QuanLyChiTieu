import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';
import { auth, db } from '../firebaseConfig';

export default function SignUpScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !username) {
      setFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 0) {
      setFeedback({ type: 'error', message: 'Tên người dùng không được để trống.' });
      return;
    }

    if (trimmedUsername.length < 3) {
      setFeedback({ type: 'error', message: 'Tên người dùng phải có ít nhất 3 ký tự.' });
      return;
    }

    const usernameRegex = /^[\p{L}0-9 _]{3,20}$/u;
    if (!usernameRegex.test(trimmedUsername)) {
      setFeedback({ type: 'error', message: 'Tên người dùng chỉ được chứa chữ cái, số, dấu cách và gạch dưới.' });
      return;
    }

    if (!email.endsWith('@gmail.com')) {
      setFeedback({ type: 'error', message: 'Email phải kết thúc bằng @gmail.com' });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      setFeedback({ type: 'error', message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường và số' });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Mật khẩu không khớp' });
      return;
    }

    if (password.length < 6) {
      setFeedback({ type: 'error', message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    setFeedback({ type: 'success', message: 'Đăng ký thành công!🎉 Vui lòng đăng nhập!' });

    setLoading(true);
    try {
      await signUp(email, password, trimmedUsername);

      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
        username: trimmedUsername,
        email: user.email,
        createdAt: new Date(),
      });
      }
      
      setFeedback({ type: 'success', message: 'Tài khoản đã được tạo! Vui lòng đăng nhập.' });

      // Redirect to login after a short delay
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (error: any) {
      console.error('Sign up error:', error);
      let message = 'Đăng ký thất bại. Vui lòng thử lại.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email này đã được sử dụng. Vui lòng thử email khác.';
      }
      setFeedback({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên người dùng"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        maxLength={20}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Xác nhận mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang đăng ký...' : 'Đăng ký'}</Text>
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
        onPress={() => router.push('/login')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  link: {
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
});