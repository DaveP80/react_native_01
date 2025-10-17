import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { User } from '../context/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { newSignup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    try {
      //Devolopment server address.
      const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username: "bob" }),
      });
      const res = await response.json();
      const storeData: User = {name: '', email: '', password: ''};
      if (response.ok) {
        storeData.email = JSON.parse(res.data).email;
        storeData.name = JSON.parse(res.data).username;
        newSignup(true);
        router.push("/profile");
      } else {
        Alert.alert('Signup failed');
      };
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
    Please sign up with a valid email and strong password!
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
      />
      <Button title={loading ? "Signing up..." : "Sign up"} onPress={handleSignup} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
});

export default Signup;