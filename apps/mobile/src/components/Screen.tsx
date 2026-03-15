import type { ReactNode } from "react";
import type { ScrollViewProps, StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
}: {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
}) {
  const { width } = useWindowDimensions();
  const horizontalPadding =
    width >= 420 ? theme.layout.horizontalPadding : theme.layout.compactHorizontalPadding;

  const content = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            maxWidth: theme.layout.maxContentWidth,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.background}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.glowTop} />
          <View style={styles.glowSide} />
        </View>
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    paddingVertical: theme.spacing.xl,
  },
  inner: {
    alignSelf: "center",
    width: "100%",
    flexGrow: 1,
    gap: theme.spacing.lg,
  },
  glowTop: {
    position: "absolute",
    top: -160,
    right: -40,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(243, 163, 60, 0.11)",
  },
  glowSide: {
    position: "absolute",
    bottom: 80,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255, 154, 128, 0.08)",
  },
});
