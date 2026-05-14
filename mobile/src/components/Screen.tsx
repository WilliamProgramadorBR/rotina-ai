import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View, useWindowDimensions, Platform, StatusBar } from "react-native";
import { useThemeMode } from "../context/ThemeContext";

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: ScreenProps) {
  const { width } = useWindowDimensions();
  const { theme, isDark } = useThemeMode();
  
  // Padding horizontal responsivo baseado na largura da tela
  const horizontalPadding = width < 360 ? 12 : width < 400 ? 16 : 20;
  
  // Padding top considerando a status bar no Android
  const topPadding = Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 0;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingHorizontal: horizontalPadding,
              paddingTop: topPadding || 20
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <View style={[
        styles.content,
        { 
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding || 20
        }
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
});
