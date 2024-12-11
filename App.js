import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from './utils/axiosConfig';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './components/ChatScreen';
import UserListScreen from './components/UserListScreen';

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [fcmToken, setFcmToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [errorMessage, setErrorMessage] = useState('');

  const sendTokenToServer = async (token) => {
    try {
      console.log('Sending FCM token to server:', token);
        const response = await axios.post('/api/notification/register', {
        userId: 'device-' + Date.now(),
        token: token
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Token registration response:', response.data);
    } catch (error) {
      console.error('Error registering token:', error);
      setErrorMessage('ERROR: ' + error.message);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setFcmToken(token);
      if (token) {
        sendTokenToServer(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification response:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  function HomeScreen({ navigation }) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>KwanghunWorld App</Text>
        </View>
        
        {notification && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationTitle}>마지막 알림:</Text>
            <Text style={styles.notificationContent}>{notification.request.content.title}</Text>
            <Text style={styles.notificationContent}>{notification.request.content.body}</Text>
          </View>
        )}
  
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
  
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Chat')}
          >
            <Text style={styles.buttonText}>채팅 참여하기</Text>
          </TouchableOpacity>
  
          <TouchableOpacity 
            style={[styles.button, styles.userListButton]}
            onPress={() => navigation.navigate('UserList')}
          >
            <Text style={styles.buttonText}>접속 유저</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ 
            title: 'KwanghunWorld 채팅',
            headerStyle: {
              backgroundColor: '#87CEEB',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="UserList" 
          component={UserListScreen}
          options={{ 
            title: '접속 유저 목록',
            headerStyle: {
              backgroundColor: '#87CEEB',
            },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert('실제 디바이스에서만 알림을 받을 수 있습니다');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('알림 권한이 필요합니다!');
      return;
    }

    // FCM 토큰 받기
    const token = await Notifications.getDevicePushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    console.log('FCM token:', token);
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: Constants.statusBarHeight,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  token: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    padding: 10,
  },
  notificationContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(135, 206, 235, 0.8)',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  notificationContent: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#f8d7da',
    borderRadius: 10,
    width: '100%',
  },
  errorText: {
    fontSize: 16,
    color: '#721c24',
  },
  chatButton: {
    backgroundColor: '#87CEEB',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
    gap: 15,
  },
  button: {
    backgroundColor: '#87CEEB',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userListButton: {
    backgroundColor: '#82C8B3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});