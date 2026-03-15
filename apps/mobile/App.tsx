import { StatusBar } from "expo-status-bar";
import { MobileApp } from "./src/app";
import { theme } from "./src/theme";

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <MobileApp />
    </>
  );
}
