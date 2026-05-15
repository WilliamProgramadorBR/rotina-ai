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
import { IconSymbol } from "../src/components/IconSymbol";
import { useThemeMode } from "../src/context/ThemeContext";

export default function RegisterScreen() {
  const { signUp } = useAuth() as any;
  const { width, isPhone, isPhoneLarge, paddingHorizontal } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobileLayout = isPhone || isPhoneLarge;

  async function handleRegister() {
    try {
      if (!name || !email || !password) {
        Alert.alert("Atencao", "Informe nome, e-mail e senha.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Atencao", "As senhas nao conferem.");
        return;
      }
      if (!acceptedPrivacy) {
        Alert.alert("Privacidade", "Leia e aceite os termos de privacidade para criar sua conta.");
        return;
      }

      setIsSubmitting(true);
      if (typeof signUp === "function") {
        await signUp(name.trim(), email.trim().toLowerCase(), password, acceptedPrivacy);
      }
      router.replace("/onboarding");
    } catch (error: any) {
      console.log("[REGISTER ERROR]", error?.response?.data || error);
      Alert.alert("Erro ao cadastrar", error?.response?.data?.message || "Nao foi possivel criar a conta.");
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
          {/* Features Side - Only on Desktop */}
          {!isMobileLayout && (
            <View style={styles.leftSide}>
              <View style={styles.brandRow}>
                <View style={styles.brandIcon}>
                  <IconSymbol name="brain" size={22} color="#60A5FA" />
                </View>
                <Text style={styles.brand}>
                  Rotina <Text style={styles.brandAccent}>AI</Text>
                </Text>
              </View>

              <Text style={styles.headline}>
                Organize sua rotina. Potencialize seus dias com IA.
              </Text>
              <Text style={styles.copy}>
                Crie cronogramas inteligentes, defina prioridades e receba sugestoes personalizadas para focar no que realmente importa.
              </Text>

              <View style={styles.featureList}>
                <View style={styles.feature}>
                  <View style={styles.featureIcon}>
                    <IconSymbol name="auto-fix" size={18} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>IA que entende voce</Text>
                    <Text style={styles.featureText}>Sugestoes inteligentes com base no contexto.</Text>
                  </View>
                </View>

                <View style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <IconSymbol name="format-list-checks" size={18} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>Cronogramas inteligentes</Text>
                    <Text style={styles.featureText}>Rotinas personalizadas com lembretes no horario certo.</Text>
                  </View>
                </View>

                <View style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                    <IconSymbol name="shield-check-outline" size={18} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>Privacidade em primeiro lugar</Text>
                    <Text style={styles.featureText}>Voce mantem controle sobre seus dados.</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Register Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: isDark ? "rgba(17,26,46,0.92)" : theme.surface,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border
            },
            isMobileLayout && styles.cardMobile,
            { padding: isMobileLayout ? spacing.xl : spacing.xxl }
          ]}>
            {/* Mobile Brand */}
            {isMobileLayout && (
              <View style={styles.brandRowMobile}>
                <View style={styles.brandIconMobile}>
                  <IconSymbol name="brain" size={20} color="#60A5FA" />
                </View>
                <Text style={[styles.brandMobile, { color: theme.text, fontSize: scaledFont(22, width) }]}>
                  Rotina <Text style={styles.brandAccent}>AI</Text>
                </Text>
              </View>
            )}

            <Text style={[styles.title, { color: theme.text, fontSize: scaledFont(isMobileLayout ? 22 : 28, width) }]}>
              Criar conta
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
              Comece agora e transforme sua rotina com inteligencia.
            </Text>

            {/* Name Input */}
            <Field
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              icon="account-outline"
              width={width}
              isMobile={isMobileLayout}
              theme={theme}
              isDark={isDark}
            />

            {/* Email Input */}
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              icon="email-outline"
              width={width}
              isMobile={isMobileLayout}
              theme={theme}
              isDark={isDark}
            />

            {/* Password Input */}
            <Field
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Crie uma senha segura"
              secureTextEntry={!showPassword}
              icon="lock-outline"
              width={width}
              isMobile={isMobileLayout}
              theme={theme}
              isDark={isDark}
              right={
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.showButton}>
                  <IconSymbol
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.accent}
                  />
                </Pressable>
              }
            />

            {/* Confirm Password Input */}
            <Field
              label="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirme sua senha"
              secureTextEntry={!showPassword}
              icon="lock-check-outline"
              width={width}
              isMobile={isMobileLayout}
              theme={theme}
              isDark={isDark}
            />

            <Pressable
              style={styles.termsRow}
              onPress={() => setAcceptedPrivacy((value) => !value)}
            >
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: acceptedPrivacy ? theme.primary : "transparent",
                  borderColor: acceptedPrivacy ? theme.primary : theme.borderStrong
                }
              ]}>
                {acceptedPrivacy ? <IconSymbol name="check" size={15} color="#fff" /> : null}
              </View>
              <Text style={[styles.termsText, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                Li e aceito a Politica de Privacidade e os Termos de Uso.{" "}
                <Text
                  style={{ color: theme.primary, fontFamily: fonts.bold }}
                  onPress={() => router.push("/privacy")}
                >
                  Ver termos
                </Text>
              </Text>
            </Pressable>

            {/* Submit Button */}
            <Pressable
              style={[
                styles.primaryButton,
                isMobileLayout && styles.primaryButtonMobile,
                (!acceptedPrivacy || isSubmitting) && { opacity: 0.62 }
              ]}
              onPress={handleRegister}
              disabled={isSubmitting || !acceptedPrivacy}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol name="account-plus-outline" size={18} color="#fff" />
                  <Text style={[styles.primaryButtonText, { fontSize: scaledFont(15, width) }]}>Cadastrar</Text>
                </>
              )}
            </Pressable>

            {/* Security Note */}
            <View style={styles.trustRow}>
              <View style={styles.trustIcon}>
                <IconSymbol name="shield-check-outline" size={14} color="#10B981" />
              </View>
              <Text style={[styles.trust, { color: theme.textMuted, fontSize: scaledFont(12, width) }]}>
                Seus dados estao protegidos. Nunca compartilhamos suas informacoes.
              </Text>
            </View>

            {/* Login Link */}
            <Pressable onPress={() => router.push("/login")} style={styles.linkButton}>
              <Text style={[styles.link, { color: theme.primary, fontSize: scaledFont(14, width) }]}>Ja tenho conta</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, right, icon, width, isMobile, ...props }: any) {
  const theme = props.theme;
  const isDark = props.isDark;
  delete props.theme;
  delete props.isDark;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text, fontSize: scaledFont(13, width) }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted,
            borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border
          },
          isMobile && styles.inputShellMobile
        ]}
      >
        <View style={[styles.inputIconBox, { backgroundColor: theme.primarySoft }]}>
          <IconSymbol name={icon} size={18} color={theme.primary} />
        </View>
        <TextInput
          {...props}
          placeholderTextColor={theme.textSoft}
          autoCapitalize="none"
          style={[styles.input, { color: theme.text, fontSize: scaledFont(15, width) }]}
        />
        {right}
      </View>
    </View>
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
    backgroundColor: "#7C3AED",
    opacity: 0.08,
    right: 100,
    top: 80,
    transform: [{ rotate: "-8deg" }]
  },
  glowOneMobile: {
    width: 210,
    height: 88,
    right: -50,
    top: 40
  },

  glowTwo: {
    position: "absolute",
    width: 360,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#1D4ED8",
    opacity: 0.08,
    left: 60,
    bottom: 80,
    transform: [{ rotate: "10deg" }]
  },
  glowTwoMobile: {
    width: 210,
    height: 88,
    left: -40,
    bottom: 80
  },

  content: {
    flexDirection: "row",
    alignSelf: "center",
    maxWidth: 1200,
    width: "100%",
    gap: spacing.xxxl
  },
  contentMobile: {
    flexDirection: "column",
    gap: spacing.xl
  },

  leftSide: {
    flex: 1,
    paddingVertical: spacing.xxxl,
    justifyContent: "center"
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl
  },

  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(79,124,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(79,124,255,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },

  brandIconText: {
    color: "#60A5FA",
    fontFamily: fonts.title,
    fontSize: 22
  },

  brand: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 26
  },

  brandAccent: {
    color: "#A78BFA"
  },

  headline: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 36,
    lineHeight: 44,
    maxWidth: 480
  },

  copy: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    lineHeight: 24,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    maxWidth: 460,
    fontSize: 15
  },

  featureList: {
    gap: spacing.lg
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },

  featureIconText: {
    color: "#A78BFA",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  featureTitle: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14
  },

  featureText: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    marginTop: 3,
    fontSize: 13
  },

  card: {
    flex: 1,
    maxWidth: 480,
    borderRadius: 28,
    backgroundColor: "rgba(17,26,46,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    ...shadow.glow
  },
  cardMobile: {
    maxWidth: "100%",
    borderRadius: 24
  },

  brandRowMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl
  },

  brandIconMobile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(79,124,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(79,124,255,0.3)",
    alignItems: "center",
    justifyContent: "center"
  },

  brandMobile: {
    color: colors.white,
    fontFamily: fonts.title
  },

  title: {
    color: colors.white,
    fontFamily: fonts.title
  },

  subtitle: {
    color: "#94A3B8",
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
    marginBottom: spacing.xl
  },

  field: {
    marginBottom: spacing.lg
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
    paddingHorizontal: spacing.sm
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

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },

  termsText: {
    flex: 1,
    fontFamily: fonts.regular,
    lineHeight: 18
  },

  showText: {
    color: "#A78BFA",
    fontFamily: fonts.bold
  },

  primaryButton: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadow.glow
  },
  primaryButtonMobile: {
    height: 50
  },

  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bold
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl
  },

  trustIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center"
  },

  trustIconText: {
    color: "#10B981",
    fontSize: 10,
    fontFamily: fonts.bold
  },

  trust: {
    color: "#6B7A94",
    fontFamily: fonts.regular,
    flex: 1,
    lineHeight: 18
  },

  linkButton: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingVertical: spacing.sm
  },

  link: {
    color: "#60A5FA",
    fontFamily: fonts.bold
  }
});
