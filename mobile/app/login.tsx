import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useResponsive } from "../src/hooks/useResponsive";
import { AiBadge, AiPanel } from "../src/components/AiVisual";
import { IconSymbol } from "../src/components/IconSymbol";
import { useThemeMode } from "../src/context/ThemeContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { width, isPhone, isPhoneLarge, paddingHorizontal } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobileLayout = isPhone || isPhoneLarge;

  async function handleLogin() {
    try {
      if (!email || !password) {
        Alert.alert("Atencao", "Informe e-mail e senha.");
        return;
      }
      setIsSubmitting(true);
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/home");
    } catch (error: any) {
      console.log("[LOGIN ERROR]", error?.response?.data || error);
      Alert.alert("Erro ao entrar", error?.response?.data?.message || "Nao foi possivel fazer login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? "#070B16" : theme.background }]}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      {/* Background Effects */}
      <View style={[styles.glowOne, isMobileLayout && styles.glowOneMobile]} />
      <View style={[styles.glowTwo, isMobileLayout && styles.glowTwoMobile]} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isMobileLayout ? spacing.lg : spacing.xxl }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, isMobileLayout && styles.contentMobile]}>
          {/* Login Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: isDark ? "rgba(17,26,46,0.92)" : theme.surface,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border
            },
            isMobileLayout && styles.cardMobile,
            { padding: isMobileLayout ? spacing.xl : spacing.xxl }
          ]}>
            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={[styles.logo, isMobileLayout && styles.logoMobile]}>
                <IconSymbol name="brain" size={isMobileLayout ? 19 : 22} color={theme.primary} />
              </View>
              <Text style={[styles.brand, { color: theme.text, fontSize: scaledFont(isMobileLayout ? 22 : 26, width) }]}>
                Rotina <Text style={styles.brandAccent}>AI</Text>
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text, fontSize: scaledFont(isMobileLayout ? 24 : 32, width) }]}>
              Entre na sua rotina inteligente
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              Centralize suas tarefas, automatize seu dia e acompanhe seus lembretes com foco.
            </Text>

            {/* Email Input */}
            <Text style={[styles.label, { color: theme.text, fontSize: scaledFont(13, width) }]}>E-mail</Text>
            <View style={[styles.inputShell, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted, borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border }, isMobileLayout && styles.inputShellMobile]}>
              <View style={[styles.inputIconBox, { backgroundColor: theme.primarySoft }]}>
                <IconSymbol name="email-outline" size={18} color={theme.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaledFont(15, width) }]}
                placeholder="seu@email.com"
                placeholderTextColor={theme.textSoft}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input */}
            <Text style={[styles.label, { color: theme.text, fontSize: scaledFont(13, width) }]}>Senha</Text>
            <View style={[styles.inputShell, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted, borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border }, isMobileLayout && styles.inputShellMobile]}>
              <View style={[styles.inputIconBox, { backgroundColor: theme.primarySoft }]}>
                <IconSymbol name="lock-outline" size={18} color={theme.primary} />
              </View>
              <TextInput
                style={[styles.input, { color: theme.text, fontSize: scaledFont(15, width) }]}
                placeholder="Digite sua senha"
                placeholderTextColor={theme.textSoft}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.showButton}>
                <IconSymbol
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.accent}
                />
              </Pressable>
            </View>

            {/* Options */}
            <View style={[styles.loginOptions, isMobileLayout && styles.loginOptionsMobile]}>
              <View style={styles.rememberRow}>
                <View style={styles.checkbox} />
                <Text style={[styles.remember, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>Lembrar de mim</Text>
              </View>
              <Pressable onPress={() => router.push("/forgot-password")}>
                <Text style={[styles.forgot, { color: theme.accent, fontSize: scaledFont(13, width) }]}>Esqueci minha senha</Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.primaryButton, isMobileLayout && styles.primaryButtonMobile]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol name="login" size={18} color="#fff" />
                  <Text style={[styles.primaryButtonText, { fontSize: scaledFont(15, width) }]}>Entrar</Text>
                </>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={[styles.dividerText, { fontSize: scaledFont(12, width) }]}>ou</Text>
              <View style={styles.divider} />
            </View>

            {/* Register Button */}
            <Pressable
              style={[
                styles.secondaryButton,
                { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : theme.surfaceMuted, borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border },
                isMobileLayout && styles.secondaryButtonMobile
              ]}
              onPress={() => router.push("/register")}
            >
              <IconSymbol name="account-plus-outline" size={18} color={theme.text} />
              <Text style={[styles.secondaryButtonText, { color: theme.text, fontSize: scaledFont(14, width) }]}>Criar uma conta</Text>
            </Pressable>

            {/* Security Note */}
            <View style={styles.secureRow}>
              <View style={styles.secureIcon}>
                <IconSymbol name="shield-check-outline" size={14} color="#10B981" />
              </View>
              <Text style={[styles.secureText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                Seus dados estao protegidos com criptografia de ponta.
              </Text>
            </View>
          </View>

          {/* Hero Side - Only on Desktop */}
          {!isMobileLayout && (
            <View style={styles.heroSide}>
              <AiPanel
                eyebrow="ASSISTENTE DE ROTINA"
                title="Inteligencia que organiza. Voce que realiza."
                description="A Rotina AI transforma planos em alarmes, prioridades e passos claros para o dia."
                icon="robot-outline"
                metric="AI"
                metricLabel="online"
                tone="cyan"
                style={styles.loginAiPanel}
              >
                <View style={styles.heroBadgeRow}>
                  <AiBadge label="contexto diario" tone="cyan" />
                  <AiBadge label="foco e execucao" tone="green" />
                </View>
              </AiPanel>

              <View style={[styles.floatTask, styles.floatTaskOne]}>
                <View style={styles.floatTaskIcon}>
                  <IconSymbol name="school-outline" size={18} color="#A78BFA" />
                </View>
                <View>
                  <Text style={styles.floatTitle}>Estudar ingles</Text>
                  <Text style={styles.floatText}>20:00 - 30 min</Text>
                </View>
              </View>

              <View style={[styles.floatTask, styles.floatTaskTwo]}>
                <View style={[styles.floatTaskIcon, { backgroundColor: "rgba(16, 185, 129, 0.2)" }]}>
                  <IconSymbol name="run" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.floatTitle}>Exercicio leve</Text>
                  <Text style={styles.floatText}>21:00 - 45 min</Text>
                </View>
              </View>

            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B16"
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl
  },

  glowOne: {
    position: "absolute",
    width: 420,
    height: 140,
    borderRadius: 28,
    backgroundColor: "#1D4ED8",
    opacity: 0.08,
    right: 80,
    top: 70,
    transform: [{ rotate: "-8deg" }]
  },
  glowOneMobile: {
    width: 220,
    height: 96,
    right: -40,
    top: 40
  },

  glowTwo: {
    position: "absolute",
    width: 360,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    opacity: 0.08,
    left: 40,
    bottom: 70,
    transform: [{ rotate: "10deg" }]
  },
  glowTwoMobile: {
    width: 210,
    height: 88,
    left: -40,
    bottom: 60
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxxl
  },
  contentMobile: {
    flexDirection: "column",
    gap: spacing.xl
  },

  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "rgba(17,26,46,0.92)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...shadow.glow
  },
  cardMobile: {
    maxWidth: "100%",
    borderRadius: 24
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(79,124,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(79,124,255,0.3)"
  },
  logoMobile: {
    width: 40,
    height: 40,
    borderRadius: 12
  },

  logoText: {
    color: "#60A5FA",
    fontFamily: fonts.title
  },

  brand: {
    color: colors.white,
    fontFamily: fonts.title
  },

  brandAccent: {
    color: "#A78BFA"
  },

  title: {
    color: colors.white,
    fontFamily: fonts.title,
    lineHeight: 40,
    maxWidth: 380
  },

  subtitle: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    lineHeight: 22,
    marginTop: spacing.md,
    marginBottom: spacing.xl
  },

  label: {
    color: "#E5E7EB",
    fontFamily: fonts.bold,
    marginBottom: spacing.sm
  },

  inputShell: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg
  },
  inputShellMobile: {
    height: 50
  },

  inputIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(79,124,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm
  },

  inputIcon: {
    color: "#60A5FA",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  input: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.regular,
    height: "100%"
  },

  showButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },

  showText: {
    color: "#A78BFA",
    fontFamily: fonts.bold
  },

  loginOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md
  },
  loginOptionsMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: spacing.sm
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)"
  },

  remember: {
    color: "#94A3B8",
    fontFamily: fonts.medium
  },

  forgot: {
    color: "#A78BFA",
    fontFamily: fonts.bold
  },

  primaryButton: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    ...shadow.glow
  },
  primaryButtonMobile: {
    height: 50
  },

  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bold
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xl
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)"
  },

  dividerText: {
    color: "#6B7A94",
    fontFamily: fonts.medium
  },

  secondaryButton: {
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  secondaryButtonMobile: {
    height: 48
  },

  secondaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bold
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl
  },

  secureIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },

  secureIconText: {
    color: "#10B981",
    fontSize: 10,
    fontFamily: fonts.bold
  },

  secureText: {
    color: "#6B7A94",
    fontFamily: fonts.regular,
    flex: 1
  },

  heroSide: {
    width: 500,
    minHeight: 480,
    alignItems: "stretch",
    justifyContent: "center",
    position: "relative"
  },
  loginAiPanel: {
    marginHorizontal: spacing.lg
  },
  heroBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },

  botOrb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(79,124,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.glow
  },

  botText: {
    color: "#22D3EE",
    fontFamily: fonts.title,
    fontSize: 36
  },

  floatTask: {
    position: "absolute",
    width: 200,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  floatTaskOne: {
    right: 20,
    top: 80
  },
  floatTaskTwo: {
    right: 40,
    top: 180
  },

  floatTaskIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center"
  },

  floatTaskIconText: {
    color: "#A78BFA",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  floatTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13
  },

  floatText: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    marginTop: 2,
    fontSize: 11
  },

  heroTitle: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 24,
    textAlign: "center",
    marginTop: spacing.xxxl,
    lineHeight: 32
  },

  heroText: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 400,
    fontSize: 14
  }
});
