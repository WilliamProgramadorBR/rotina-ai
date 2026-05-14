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
} from "react-native";
import { router } from "expo-router";
import { api } from "../src/services/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useResponsive } from "../src/hooks/useResponsive";
import { useThemeMode } from "../src/context/ThemeContext";
import { IconSymbol } from "../src/components/IconSymbol";

export default function ForgotPasswordScreen() {
  const { width, isPhone, isPhoneLarge } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const isMobile = isPhone || isPhoneLarge;

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert("Atenção", "Informe seu e-mail.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/auth/forgot-password", { email: trimmed });
      setSent(true);
    } catch (e: any) {
      // Mostra mensagem genérica mesmo em caso de erro de servidor
      Alert.alert("Erro", e?.response?.data?.message || "Não foi possível enviar o código. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? "#070B16" : theme.background }]}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={[styles.glowOne, isMobile && styles.glowOneMobile]} />
      <View style={[styles.glowTwo, isMobile && styles.glowTwoMobile]} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: isMobile ? spacing.lg : spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, {
          backgroundColor: isDark ? "rgba(17,26,46,0.92)" : theme.surface,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border,
          padding: isMobile ? spacing.xl : spacing.xxl
        }, isMobile && styles.cardMobile]}>

          {/* Botão voltar */}
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <IconSymbol name="arrow-left" size={18} color={isDark ? "#94A3B8" : theme.textMuted} />
            <Text style={[styles.backText, { color: isDark ? "#94A3B8" : theme.textMuted, fontSize: scaledFont(13, width) }]}>
              Voltar para o login
            </Text>
          </Pressable>

          {/* Ícone */}
          <View style={styles.iconBox}>
            <IconSymbol name="lock-reset" size={32} color="#A78BFA" />
          </View>

          <Text style={[styles.title, { color: isDark ? colors.white : theme.text, fontSize: scaledFont(isMobile ? 24 : 28, width) }]}>
            Esqueceu a senha?
          </Text>
          <Text style={[styles.subtitle, { fontSize: scaledFont(14, width) }]}>
            {sent
              ? "Verifique sua caixa de entrada e spam. O código chega em até 1 minuto."
              : "Informe seu e-mail e enviaremos um código de 6 dígitos para redefinir sua senha."}
          </Text>

          {!sent ? (
            <>
              {/* Input de e-mail */}
              <Text style={[styles.label, { color: isDark ? "#E5E7EB" : theme.text, fontSize: scaledFont(13, width) }]}>
                E-mail cadastrado
              </Text>
              <View style={[styles.inputShell, {
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted,
                borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border
              }, isMobile && styles.inputShellMobile]}>
                <View style={[styles.inputIcon, { backgroundColor: isDark ? "rgba(79,124,255,0.15)" : theme.primarySoft }]}>
                  <IconSymbol name="email-outline" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: isDark ? colors.white : theme.text, fontSize: scaledFont(15, width) }]}
                  placeholder="seu@email.com"
                  placeholderTextColor={isDark ? "#64748B" : theme.textSoft}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>

              <Pressable
                style={[styles.primaryBtn, isMobile && styles.primaryBtnMobile]}
                onPress={handleSend}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="send-outline" size={18} color="#fff" />
                    <Text style={[styles.primaryBtnText, { fontSize: scaledFont(15, width) }]}>
                      Enviar código
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {/* Estado de sucesso */}
              <View style={styles.successBox}>
                <View style={styles.successIconBox}>
                  <IconSymbol name="email-check-outline" size={28} color="#10B981" />
                </View>
                <Text style={[styles.successText, { fontSize: scaledFont(14, width) }]}>
                  Código enviado para{"\n"}
                  <Text style={styles.successEmail}>{email.trim().toLowerCase()}</Text>
                </Text>
              </View>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: "#10B981" }, isMobile && styles.primaryBtnMobile]}
                onPress={() => router.push({ pathname: "/reset-password", params: { email: email.trim().toLowerCase() } })}
              >
                <IconSymbol name="arrow-right" size={18} color="#fff" />
                <Text style={[styles.primaryBtnText, { fontSize: scaledFont(15, width) }]}>
                  Inserir código
                </Text>
              </Pressable>

              <Pressable style={styles.resendRow} onPress={() => setSent(false)}>
                <Text style={[styles.resendText, { fontSize: scaledFont(13, width) }]}>
                  Não recebeu?{" "}
                  <Text style={styles.resendLink}>Reenviar código</Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  glowOne: {
    position: "absolute", width: 320, height: 120, borderRadius: 24,
    backgroundColor: "#7C3AED", opacity: 0.07, right: 60, top: 60,
    transform: [{ rotate: "-8deg" }]
  },
  glowOneMobile: { width: 200, height: 80, right: -30, top: 30 },
  glowTwo: {
    position: "absolute", width: 280, height: 100, borderRadius: 20,
    backgroundColor: "#1D4ED8", opacity: 0.07, left: 40, bottom: 80,
    transform: [{ rotate: "10deg" }]
  },
  glowTwoMobile: { width: 180, height: 70, left: -30, bottom: 50 },

  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: spacing.xxl },

  card: {
    width: "100%", maxWidth: 480, alignSelf: "center",
    borderRadius: 28, borderWidth: 1, ...shadow.glow
  },
  cardMobile: { maxWidth: "100%", borderRadius: 24 },

  backRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    marginBottom: spacing.xl, alignSelf: "flex-start"
  },
  backText: { fontFamily: fonts.medium },

  iconBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.lg
  },

  title: { fontFamily: fonts.title, lineHeight: 36, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.regular, color: "#94A3B8", lineHeight: 22, marginBottom: spacing.xl },

  label: { fontFamily: fonts.bold, marginBottom: spacing.sm },

  inputShell: {
    height: 52, borderRadius: radius.lg, borderWidth: 1,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.sm, marginBottom: spacing.lg
  },
  inputShellMobile: { height: 50 },
  inputIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginRight: spacing.sm
  },
  input: { flex: 1, fontFamily: fonts.regular, height: "100%" },

  primaryBtn: {
    height: 54, borderRadius: radius.lg, backgroundColor: "#2563EB",
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, ...shadow.glow
  },
  primaryBtnMobile: { height: 50 },
  primaryBtnText: { fontFamily: fonts.bold, color: colors.white },

  successBox: {
    alignItems: "center", gap: spacing.md,
    backgroundColor: "rgba(16,185,129,0.1)", borderRadius: radius.xl,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
    padding: spacing.xl, marginBottom: spacing.xl
  },
  successIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: "rgba(16,185,129,0.15)",
    alignItems: "center", justifyContent: "center"
  },
  successText: { fontFamily: fonts.medium, color: "#94A3B8", textAlign: "center", lineHeight: 22 },
  successEmail: { fontFamily: fonts.bold, color: "#10B981" },

  resendRow: { marginTop: spacing.lg, alignItems: "center" },
  resendText: { fontFamily: fonts.medium, color: "#64748B" },
  resendLink: { fontFamily: fonts.bold, color: "#A78BFA" }
});
