import React from 'react';
import { ActivityIndicator, View, Image, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { getTabsForWorker } from './src/utils/roleConfig';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TabProvider } from './src/context/TabContext';
import SetupScreen from './src/screens/SetupScreen';
import SelectWorkerScreen from './src/screens/SelectWorkerScreen';
import PinEntryScreen from './src/screens/PinEntryScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrderBuilderScreen from './src/screens/OrderBuilderScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import SalesScreen from './src/screens/SalesScreen';
import SaleDetailScreen from './src/screens/SaleDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ManageTabsScreen from './src/screens/ManageTabsScreen';
import BusinessConfigScreen from './src/screens/BusinessConfigScreen';
import ManageModesScreen from './src/screens/ManageModesScreen';
import ModeEditorScreen from './src/screens/ModeEditorScreen';
import OrdersScreen from './src/screens/OrdersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack para Home (incluye flujo de pedido)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="OrderBuilder" component={OrderBuilderScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="ManageTabs" component={ManageTabsScreen} />
    </Stack.Navigator>
  );
}

// Stack para Ventas
function SalesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SalesMain" component={SalesScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  );
}

// Stack para Perfil
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="BusinessConfig" component={BusinessConfigScreen} />
      <Stack.Screen name="ManageModes" component={ManageModesScreen} />
      <Stack.Screen name="ModeEditor" component={ModeEditorScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { currentWorker } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const allowedTabs = getTabsForWorker(currentWorker);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.cardBorder,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      {allowedTabs.includes('Venta') && (
        <Tab.Screen
          name="Venta"
          component={HomeStack}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="storefront-outline" size={24} color={color} />
            ),
          }}
        />
      )}
      {allowedTabs.includes('Comandas') && (
        <Tab.Screen
          name="Comandas"
          component={OrdersScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={color} />
            ),
          }}
        />
      )}
      {allowedTabs.includes('Ventas') && (
        <Tab.Screen
          name="Ventas"
          component={SalesStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Feather name="bar-chart-2" size={22} color={color} />
            ),
          }}
        />
      )}
      {allowedTabs.includes('Perfil') && (
        <Tab.Screen
          name="Perfil"
          component={ProfileStack}
          options={{
            tabBarIcon: () => (
              currentWorker?.photo ? (
                <Image
                  source={{ uri: currentWorker.photo }}
                  style={{ width: 28, height: 28, borderRadius: 14 }}
                />
              ) : (
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: theme.mode === 'dark' ? '#fff' : '#000',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    color: theme.mode === 'dark' ? '#000' : '#fff',
                    fontSize: 12, fontWeight: '900',
                  }}>
                    {currentWorker?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ fontSize: 10, fontWeight: '700', color, marginTop: -2 }}>
                {currentWorker?.name?.split(' ')[0] || 'Perfil'}
              </Text>
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isSetup, currentWorker, deviceType } = useAuth();
  const { theme } = useTheme();

  if (isSetup === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.text} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isSetup ? (
        <Stack.Screen name="Setup" component={SetupScreen} />
      ) : !currentWorker ? (
        <>
          <Stack.Screen name="SelectWorker" component={SelectWorkerScreen} />
          <Stack.Screen name="PinEntry" component={PinEntryScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}