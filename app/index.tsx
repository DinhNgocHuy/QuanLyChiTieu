import { useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// This is the first screen that runs when the app starts
export default function Index() {
  const { user, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  // Watch for auth state and redirect
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to the main app layout
        router.replace('/(tabs)/add');
      } else {
        // User is not authenticated, redirect to the login screen
        router.replace('../login');
      }
      setChecked(true);
    }
  }, [user, loading]);

  return null;
}
