import { NavigationContainer, useNavigation, useRoute } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { api } from "./api/client";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { HomeScreen } from "./screens/home/HomeScreen";
import { NewInspectionWizard } from "./screens/inspection/NewInspectionWizard";
import { SubmissionStatusScreen } from "./screens/inspection/SubmissionStatusScreen";
import { InspectionDetailScreen } from "./screens/inspection/InspectionDetailScreen";
import { HistoryScreen } from "./screens/history/HistoryScreen";
import { SettingsScreen } from "./screens/settings/SettingsScreen";
import { useAppStore } from "./store/appStore";
import { useOfflineQueue } from "./hooks/useOfflineQueue";
import { useSubmitInspection } from "./hooks/useSubmitInspection";

// ─── Navigation type definitions ────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  InspectionDetail: { inspectionId: string };
  SubmissionStatus: { inspectionId: string };
};

type MainTabParamList = {
  Home: undefined;
  Capture: undefined;
  History: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab screen components ───────────────────────────────────────────────────

function HomeTabScreen() {
  const navigation = useNavigation<import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>>();
  const { token, inspections, setInspections, setInspectionDetail } = useAppStore();
  const { pendingCount } = useOfflineQueue(token);

  useEffect(() => {
    if (!token) return;
    api.listInspections(token).then(setInspections).catch(() => {});
  }, [token]);

  const openInspection = async (id: string) => {
    if (!token) return;
    const detail = await api.getInspection(token, id);
    setInspectionDetail(detail);
    navigation.navigate("InspectionDetail", { inspectionId: id });
  };

  return (
    <HomeScreen
      inspections={inspections}
      pendingCount={pendingCount}
      onNewInspection={() => (navigation as never as import("@react-navigation/bottom-tabs").BottomTabNavigationProp<MainTabParamList>).navigate("Capture")}
      onOpenInspection={(id) => void openInspection(id)}
    />
  );
}

function CaptureTabScreen() {
  const navigation = useNavigation<import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>>();
  const { draft, updateDraft } = useAppStore();
  const { submit } = useSubmitInspection();

  const handleSubmit = async () => {
    const inspectionId = await submit();
    if (inspectionId) {
      navigation.navigate("SubmissionStatus", { inspectionId });
    }
  };

  return (
    <NewInspectionWizard
      draft={draft}
      onChange={updateDraft}
      onSubmit={() => void handleSubmit()}
    />
  );
}

function HistoryTabScreen() {
  const navigation = useNavigation<import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>>();
  const { token, inspections, setInspectionDetail } = useAppStore();

  const openInspection = async (id: string) => {
    if (!token) return;
    const detail = await api.getInspection(token, id);
    setInspectionDetail(detail);
    navigation.navigate("InspectionDetail", { inspectionId: id });
  };

  return (
    <HistoryScreen
      inspections={inspections}
      onOpenInspection={(id) => void openInspection(id)}
    />
  );
}

function SettingsTabScreen() {
  const { resetDraft, logout } = useAppStore();
  return <SettingsScreen onResetDraft={resetDraft} onLogout={logout} />;
}

// ─── Stack screens (push over tabs with back button) ────────────────────────

function InspectionDetailRoute() {
  const { inspectionDetail } = useAppStore();
  return <InspectionDetailScreen inspection={inspectionDetail} />;
}

function SubmissionStatusRoute() {
  const route = useRoute<RouteProp<RootStackParamList, "SubmissionStatus">>();
  const navigation = useNavigation<import("@react-navigation/native-stack").NativeStackNavigationProp<RootStackParamList>>();
  const { inspectionId } = route.params;
  const { token, setInspectionDetail } = useAppStore();
  const [status, setStatus] = useState("submitted");

  const refresh = async () => {
    if (!token) return;
    const response = await api.getStatus(token, inspectionId);
    setStatus(response.status);
    if (response.status === "complete") {
      const detail = await api.getInspection(token, inspectionId);
      setInspectionDetail(detail);
    }
  };

  return (
    <SubmissionStatusScreen
      status={status}
      onRefresh={() => void refresh()}
      onOpenInspection={() => navigation.navigate("InspectionDetail", { inspectionId })}
    />
  );
}

// ─── Tab navigator ───────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, string> = {
  Home: "🏠",
  Capture: "📷",
  History: "📋",
  Settings: "⚙️",
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#100d0b",
          borderTopColor: "rgba(248,242,230,0.12)",
        },
        tabBarActiveTintColor: "#f08700",
        tabBarInactiveTintColor: "#cdbfa5",
        tabBarLabel: route.name,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name] ?? "●"}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeTabScreen} />
      <Tab.Screen name="Capture" component={CaptureTabScreen} />
      <Tab.Screen name="History" component={HistoryTabScreen} />
      <Tab.Screen name="Settings" component={SettingsTabScreen} />
    </Tab.Navigator>
  );
}

// ─── Root app ────────────────────────────────────────────────────────────────

export function MobileApp() {
  const { token, setToken, setCurrentUser, logout } = useAppStore();

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    api.me(token).then(setCurrentUser).catch(() => {
      setCurrentUser(null);
      logout();
    });
  }, [logout, setCurrentUser, token]);

  const handleLogin = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    setToken(response.accessToken);
    setCurrentUser(response.user);
  };

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: "#14110f" },
          headerStyle: { backgroundColor: "#100d0b" },
          headerTintColor: "#f7f0df",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        {!token ? (
          <RootStack.Screen name="Login" options={{ headerShown: false }}>
            {() => <LoginScreen onSubmit={handleLogin} />}
          </RootStack.Screen>
        ) : (
          <>
            <RootStack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <RootStack.Screen
              name="InspectionDetail"
              component={InspectionDetailRoute}
              options={{ title: "Inspection Detail" }}
            />
            <RootStack.Screen
              name="SubmissionStatus"
              component={SubmissionStatusRoute}
              options={{ title: "Submission Status" }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
