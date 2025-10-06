import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Image } from 'react-native';
import { useAuth } from './context/AuthContext';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout, newUser } = useAuth();

  const handleLogin = () => {
    router.push("/auth?mode=login");
  };

  const handleSignup = () => {
    router.push("/auth?mode=signup");
  };

  if (!user.name) {
    return (
      <View>
        {!newUser && <Text>Please log in or sign up to view your profile.</Text>}
        {newUser && <Text>You have successfully signed up. Please check your email for a login code.</Text>}
        <Text>New Logins and signups will require you to check your email for a login code.</Text>
        <Button title="Log In" onPress={handleLogin} />
        <Button title="Sign Up" onPress={handleSignup} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://randomuser.me/api/portraits/men/1.jpg', 
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