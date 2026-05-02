import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { colors, fonts, spacing } from "../src/theme";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Background Effects */}
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>AI</Text>
          </View>
          <Text style={styles.brand}>
            Rotina <Text style={styles.brandAccent}>AI</Text>
          </Text>
        </View>
        
        {/* Loading */}
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>Sua rotina em modo inteligente</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070B16",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl
  },
  
  glowOne: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#1D4ED8",
    opacity: 0.12,
    top: "20%",
    right: -50
  },
  
  glowTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7C3AED",
    opacity: 0.1,
    bottom: "25%",
    left: -40
  },
  
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xxxl
  },
  
  logo: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "rgba(79, 124, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  
  logoText: {
    color: "#22D3EE",
    fontFamily: fonts.title,
    fontSize: 28
  },
  
  brand: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 32
  },
  
  brandAccent: {
    color: "#A78BFA"
  },
  
  loadingBox: {
    alignItems: "center",
    gap: spacing.md
  },
  
  loadingText: {
    color: "#94A3B8",
    fontFamily: fonts.medium,
    fontSize: 14
  },
  
  footer: {
    position: "absolute",
    bottom: 48,
    color: "#6B7A94",
    fontFamily: fonts.regular,
    fontSize: 13
  }
});
