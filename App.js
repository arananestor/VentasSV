import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import CustomizeScreen from './src/screens/CustomizeScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import SalesScreen from './src/screens/SalesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#000' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Customize" component={CustomizeScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="Sales" component={SalesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}