import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TabProvider } from './src/context/TabContext';
import SetupScreen from './src/screens/SetupScreen';
import SelectWorkerScreen from './src/screens/SelectWorkerScreen';
import PinEntryScreen from './src/screens/PinEntryScreen';
import HomeScreen from './src/screens/HomeScreen';
import CustomizeScreen from './src/screens/CustomizeScreen';
import OrderBuilderScreen from './src/screens/OrderBuilderScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import SalesScreen from './src/screens/SalesScreen';
import SaleDetailScreen from './src/screens/SaleDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ManageTabsScreen from './src/screens/ManageTabsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isSetup, currentWorker } = useAuth();
  const { theme } = useTheme();

  if (isSetup === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.text} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      {!isSetup ? (
        <Stack.Screen name="Setup" component={SetupScreen} />
      ) : !currentWorker ? (
        <>
          <Stack.Screen name="SelectWorker" component={SelectWorkerScreen} />
          <Stack.Screen name="PinEntry" component={PinEntryScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Customize" component={CustomizeScreen} />
          <Stack.Screen name="OrderBuilder" component={OrderBuilderScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="Sales" component={SalesScreen} />
          <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ManageTabs" component={ManageTabsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <TabProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </TabProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}