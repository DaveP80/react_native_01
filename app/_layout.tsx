import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Navbar/>
    </>
  );
}

function Navbar() {
  const router = useRouter();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.navItem}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/profile')}>
        <Text style={styles.navItem}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
