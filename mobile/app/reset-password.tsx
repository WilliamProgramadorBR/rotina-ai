import { useRef, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../src/services/api";
import { colors, fonts, radius, shadow, spacing, scaledFont } from "../src/theme";
import { useResponsive } from "../src/hooks/useResponsive";
import { useThemeMode } from "../src/context/ThemeContext";
import { IconSymbol } from "../src/components/IconSymbol";

const CODE_LENGTH = 6;

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { width, isPhone, isPhoneLarge } = useResponsive();
  const { theme, isDark } = useThemeMode();
  const isMobile = isPhone || isPhoneLarge;

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const code = digits.join("");

  function handleDigitChange(value: string, index: number) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);

    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyPress(key: string, index: number) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyCode() {
    if (code.length < CODE_LENGTH) {
      Alert.alert("Atenção", "Digite os 6 dígitos do código.");
      return;
    }
    try {
      setIsVerifying(true);
      await api.post("/auth/verify-reset-code", { email, code });
      setCodeVerified(true);
    } catch (e: any) {
      Alert.alert("Código inválido", e?.response?.data?.message || "Código inválido ou expirado. Verifique e tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) {
      Alert.alert("Atenção", "A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post("/auth/reset-password", { email, code, newPassword });
      setDone(true);
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.message || "Não foi possível redefinir a senha. Tente novamente.");
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

          {/* Back button */}
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <IconSymbol name="arrow-left" size={18} color={isDark ? "#94A3B8" : theme.textMuted} />
            <Text style={[styles.backText, { color: isDark ? "#94A3B8" : theme.textMuted, fontSize: scaledFont(13, width) }]}>
              Voltar
            </Text>
          </Pressable>

          {/* Icon */}
          <View style={styles.iconBox}>
            <IconSymbol name={done ? "check-circle-outline" : "lock-reset"} size={32} color={done ? "#10B981" : "#A78BFA"} />
          </View>

          <Text style={[styles.title, { color: isDark ? colors.white : theme.text, fontSize: scaledFont(isMobile ? 22 : 26, width) }]}>
            {done ? "Senha redefinida!" : codeVerified ? "Nova senha" : "Insira o código"}
          </Text>
          <Text style={[styles.subtitle, { fontSize: scaledFont(14, width) }]}>
            {done
              ? "Sua senha foi alterada com sucesso. Faça login com a nova senha."
              : codeVerified
              ? "Crie uma nova senha com no mínimo 8 caracteres."
              : `Enviamos um código de 6 dígitos para\n${email}`}
          </Text>

          {done ? (
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: "#10B981" }, isMobile && styles.primaryBtnMobile]}
              onPress={() => router.replace("/login")}
            >
              <IconSymbol name="login" size={18} color="#fff" />
              <Text style={[styles.primaryBtnText, { fontSize: scaledFont(15, width) }]}>Ir para o login</Text>
            </Pressable>

          ) : !codeVerified ? (
            <>
              {/* 6-digit code inputs */}
              <View style={styles.codeRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { inputRefs.current[i] = r; }}
                    style={[
                      styles.digitBox,
                      {
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted,
                        borderColor: d
                          ? (isDark ? "#A78BFA" : theme.primary)
                          : (isDark ? "rgba(255,255,255,0.15)" : theme.border),
                        color: isDark ? colors.white : theme.text,
                        fontSize: scaledFont(22, width),
                      }
                    ]}
                    value={d}
                    onChangeText={(v) => handleDigitChange(v, i)}
                    onKeyPress={({ nativeEvent }) => handleDigitKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    autoFocus={i === 0}
                  />
                ))}
              </View>

              <Pressable
                style={[styles.primaryBtn, isMobile && styles.primaryBtnMobile]}
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="check-outline" size={18} color="#fff" />
                    <Text style={[styles.primaryBtnText, { fontSize: scaledFont(15, width) }]}>
                      Verificar código
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable style={styles.resendRow} onPress={() => router.back()}>
                <Text style={[styles.resendText, { fontSize: scaledFont(13, width) }]}>
                  Não recebeu?{" "}
                  <Text style={styles.resendLink}>Reenviar código</Text>
                </Text>
              </Pressable>
            </>

          ) : (
            <>
              {/* New password */}
              <Text style={[styles.label, { color: isDark ? "#E5E7EB" : theme.text, fontSize: scaledFont(13, width) }]}>
                Nova senha
              </Text>
              <View style={[styles.inputShell, {
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted,
                borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border
              }, isMobile && styles.inputShellMobile]}>
                <View style={[styles.inputIcon, { backgroundColor: isDark ? "rgba(79,124,255,0.15)" : theme.primarySoft }]}>
                  <IconSymbol name="lock-outline" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: isDark ? colors.white : theme.text, fontSize: scaledFont(15, width) }]}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={isDark ? "#64748B" : theme.textSoft}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoFocus
                />
                <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
                  <IconSymbol name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={isDark ? "#64748B" : theme.textSoft} />
                </Pressable>
              </View>

              {/* Confirm password */}
              <Text style={[styles.label, { color: isDark ? "#E5E7EB" : theme.text, fontSize: scaledFont(13, width) }]}>
                Confirmar senha
              </Text>
              <View style={[styles.inputShell, {
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.surfaceMuted,
                borderColor: isDark ? "rgba(255,255,255,0.12)" : theme.border
              }, isMobile && styles.inputShellMobile]}>
                <View style={[styles.inputIcon, { backgroundColor: isDark ? "rgba(79,124,255,0.15)" : theme.primarySoft }]}>
                  <IconSymbol name="lock-check-outline" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: isDark ? colors.white : theme.text, fontSize: scaledFont(15, width) }]}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={isDark ? "#64748B" : theme.textSoft}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              </View>

              <Pressable
                style={[styles.primaryBtn, isMobile && styles.primaryBtnMobile]}
                onPress={handleResetPassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="lock-reset" size={18} color="#fff" />
                    <Text style={[styles.primaryBtnText, { fontSize: scaledFont(15, width) }]}>
                      Redefinir senha
                    </Text>
                  </>
                )}
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

  title: { fontFamily: fonts.title, lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.regular, color: "#94A3B8", lineHeight: 22, marginBottom: spacing.xl },

  codeRow: {
    flexDirection: "row", justifyContent: "center", gap: spacing.sm,
    marginBottom: spacing.xl
  },
  digitBox: {
    width: 46, height: 56, borderRadius: radius.md, borderWidth: 2,
    fontFamily: fonts.title, textAlign: "center"
  },

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
  eyeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },

  primaryBtn: {
    height: 54, borderRadius: radius.lg, backgroundColor: "#2563EB",
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.sm, ...shadow.glow
  },
  primaryBtnMobile: { height: 50 },
  primaryBtnText: { fontFamily: fonts.bold, color: colors.white },

  resendRow: { marginTop: spacing.lg, alignItems: "center" },
  resendText: { fontFamily: fonts.medium, color: "#64748B" },
  resendLink: { fontFamily: fonts.bold, color: "#A78BFA" }
});
