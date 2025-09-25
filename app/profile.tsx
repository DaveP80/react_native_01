import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';

const ProfileScreen = () => {
  const [user, setUser] = useState({ name: '' });

  const handleLogin = () => {
    setUser({ name: 'John Doe' });
  };

  const handleSignup = () => {
    setUser({ name: 'Jane Doe' });
  };

  if (!user.name) {
    return (
      <View>
        <Text>Please log in or sign up to view your profile.</Text>
        <Button title="Log In" onPress={handleLogin} />
        <Button title="Sign Up" onPress={handleSignup} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://randomuser.me/api/portraits/men/1.jpg', // Stock user image
        }}
        style={styles.avatar}
        resizeMode="cover"
      />
    </View>
  );
};

export default ProfileScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
});