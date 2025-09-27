import { useLocalSearchParams } from 'expo-router';
import Login from './components/login';
import Signup from './components/signup';

export default function AuthScreen() {
  const { mode } = useLocalSearchParams();

  if (mode === 'login') {
    return <Login />;
  } else if (mode === 'signup') {
    return <Signup />;
  } else {
    return null;
  }
};