import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { colors, fonts, radius, shadow, spacing } from "../src/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("william100william@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    try {
      if (!email || !password) {
        Alert.alert("Atenção", "Informe e-mail e senha.");
        return;
      }
      setIsSubmitting(true);
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/home");
    } catch (error: any) {
      console.log("[LOGIN ERROR]", error?.response?.data || error);
      Alert.alert("Erro ao entrar", error?.response?.data?.message || "Não foi possível fazer login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.logo}><Text style={styles.logoText}>✦</Text></View>
            <Text style={styles.brand}>Rotina <Text style={styles.brandAccent}>AI</Text></Text>
          </View>

          <Text style={styles.title}>Entre na sua rotina inteligente</Text>
          <Text style={styles.subtitle}>Centralize suas tarefas, automatize seu dia e acompanhe seus lembretes com foco.</Text>

          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputShell}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#8A97AD"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputShell}>
            <Text style={styles.inputIcon}>▣</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#8A97AD"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((current) => !current)}>
              <Text style={styles.showText}>{showPassword ? "Ocultar" : "Mostrar"}</Text>
            </Pressable>
          </View>

          <View style={styles.loginOptions}>
            <Text style={styles.remember}>✓ Lembrar de mim</Text>
            <Text style={styles.forgot}>Esqueci minha senha</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </Pressable>

          <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} /></View>

          <Pressable style={styles.secondaryButton} onPress={() => router.push("/register")}>
            <Text style={styles.secondaryButtonText}>Criar uma conta</Text>
          </Pressable>

          <Text style={styles.secureText}>◇ Seus dados estão protegidos com criptografia de ponta.</Text>
        </View>

        <View style={styles.heroSide}>
          <View style={styles.botOrb}><Text style={styles.botText}>AI</Text></View>
          <View style={[styles.floatTask, styles.floatTaskOne]}><Text style={styles.floatTitle}>Estudar inglês</Text><Text style={styles.floatText}>20:00 • 30 min</Text></View>
          <View style={[styles.floatTask, styles.floatTaskTwo]}><Text style={styles.floatTitle}>Exercício leve</Text><Text style={styles.floatText}>21:00 • 45 min</Text></View>
          <Text style={styles.heroTitle}>Inteligência que organiza. Você que realiza.</Text>
          <Text style={styles.heroText}>A Rotina AI transforma seus planos em ação com foco, clareza e consistência.</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#070B16", justifyContent: "center", padding: spacing.xxl, overflow: "hidden" },
  glowOne: { position: "absolute", width: 420, height: 420, borderRadius: 210, backgroundColor: "#1D4ED8", opacity: 0.18, right: 120, top: 100 },
  glowTwo: { position: "absolute", width: 360, height: 360, borderRadius: 180, backgroundColor: "#7C3AED", opacity: 0.16, left: 70, bottom: 40 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xxxl },
  card: { width: 560, backgroundColor: "rgba(17,26,46,0.88)", borderRadius: 34, padding: spacing.xxl, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", ...shadow.glow },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  logo: { width: 44, height: 44, borderRadius: 16, backgroundColor: "rgba(79,124,255,0.17)", alignItems: "center", justifyContent: "center" },
  logoText: { color: "#22D3EE", fontSize: 24 },
  brand: { color: colors.white, fontFamily: fonts.title, fontSize: 28 },
  brandAccent: { color: "#8B5CF6" },
  title: { color: colors.white, fontFamily: fonts.title, fontSize: 40, lineHeight: 48, maxWidth: 440 },
  subtitle: { color: "#C7D2E5", fontFamily: fonts.regular, lineHeight: 24, marginTop: spacing.md, marginBottom: spacing.xl },
  label: { color: "#E5E7EB", fontFamily: fonts.bold, marginBottom: spacing.sm },
  inputShell: { height: 56, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(255,255,255,0.06)", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  inputIcon: { color: "#AAB6CC", fontSize: 18, width: 28 },
  input: { flex: 1, color: colors.white, fontFamily: fonts.regular, fontSize: 15, height: "100%" },
  showText: { color: "#9D6BFF", fontFamily: fonts.bold },
  loginOptions: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  remember: { color: "#C7D2E5", fontFamily: fonts.medium },
  forgot: { color: "#A78BFA", fontFamily: fonts.bold },
  primaryButton: { height: 58, borderRadius: radius.lg, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", ...shadow.glow },
  primaryButtonText: { color: colors.white, fontFamily: fonts.title, fontSize: 17 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.xl },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  dividerText: { color: "#8A97AD", fontFamily: fonts.medium },
  secondaryButton: { height: 56, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: colors.white, fontFamily: fonts.bold },
  secureText: { color: "#8A97AD", fontFamily: fonts.regular, textAlign: "center", marginTop: spacing.xl },
  heroSide: { width: 620, minHeight: 560, alignItems: "center", justifyContent: "center" },
  botOrb: { width: 170, height: 170, borderRadius: 85, backgroundColor: "rgba(79,124,255,0.20)", borderWidth: 1, borderColor: "rgba(34,211,238,0.34)", alignItems: "center", justifyContent: "center", ...shadow.glow },
  botText: { color: "#22D3EE", fontFamily: fonts.title, fontSize: 42 },
  floatTask: { position: "absolute", width: 230, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", padding: spacing.lg },
  floatTaskOne: { right: 30, top: 120 },
  floatTaskTwo: { right: 60, top: 230 },
  floatTitle: { color: colors.white, fontFamily: fonts.bold },
  floatText: { color: "#AAB6CC", fontFamily: fonts.regular, marginTop: 4 },
  heroTitle: { color: colors.white, fontFamily: fonts.title, fontSize: 28, textAlign: "center", marginTop: spacing.xxxl },
  heroText: { color: "#C7D2E5", fontFamily: fonts.regular, lineHeight: 23, textAlign: "center", marginTop: spacing.sm, maxWidth: 560 }
});
