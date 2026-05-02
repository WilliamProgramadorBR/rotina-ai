import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { colors, fonts, radius, shadow, spacing } from "../src/theme";

export default function RegisterScreen() {
  const { signUp } = useAuth() as any;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    try {
      if (!name || !email || !password) {
        Alert.alert("Atenção", "Informe nome, e-mail e senha.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Atenção", "As senhas não conferem.");
        return;
      }

      setIsSubmitting(true);
      if (typeof signUp === "function") {
        await signUp(name.trim(), email.trim().toLowerCase(), password);
      }
      router.replace("/home");
    } catch (error: any) {
      console.log("[REGISTER ERROR]", error?.response?.data || error);
      Alert.alert("Erro ao cadastrar", error?.response?.data?.message || "Não foi possível criar a conta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <View style={styles.panel}>
        <View style={styles.leftSide}>
          <View style={styles.brandRow}><Text style={styles.spark}>✦</Text><Text style={styles.brand}>Rotina <Text style={styles.brandAccent}>AI</Text></Text></View>
          <Text style={styles.headline}>Organize sua rotina. Potencialize seus dias com IA.</Text>
          <Text style={styles.copy}>Crie cronogramas inteligentes, defina prioridades e receba sugestões personalizadas para focar no que realmente importa.</Text>

          <View style={styles.feature}><Text style={styles.featureIcon}>AI</Text><View><Text style={styles.featureTitle}>IA que entende você</Text><Text style={styles.featureText}>Sugestões inteligentes com base no contexto.</Text></View></View>
          <View style={styles.feature}><Text style={styles.featureIcon}>□</Text><View><Text style={styles.featureTitle}>Cronogramas inteligentes</Text><Text style={styles.featureText}>Rotinas personalizadas com lembretes no horário certo.</Text></View></View>
          <View style={styles.feature}><Text style={styles.featureIcon}>◇</Text><View><Text style={styles.featureTitle}>Privacidade em primeiro lugar</Text><Text style={styles.featureText}>Você mantém controle sobre seus dados.</Text></View></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Criar conta ✦</Text>
          <Text style={styles.subtitle}>Comece agora e transforme sua rotina com inteligência.</Text>

          <Field label="Nome" value={name} onChangeText={setName} placeholder="Seu nome completo" />
          <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" />
          <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Crie uma senha segura" secureTextEntry={!showPassword} right={<Pressable onPress={() => setShowPassword((v) => !v)}><Text style={styles.showText}>{showPassword ? "Ocultar" : "Mostrar"}</Text></Pressable>} />
          <Field label="Confirmar senha" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirme sua senha" secureTextEntry={!showPassword} />

          <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Cadastrar</Text>}
          </Pressable>

          <Text style={styles.trust}>◇ Seus dados estão protegidos. Nunca compartilhamos suas informações.</Text>
          <Pressable onPress={() => router.push("/login")}><Text style={styles.link}>Já tenho conta</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, right, ...props }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput {...props} placeholderTextColor="#8A97AD" autoCapitalize="none" style={styles.input} />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#070B16", justifyContent: "center", padding: spacing.xxl },
  panel: { flexDirection: "row", alignSelf: "center", maxWidth: 1320, width: "100%", minHeight: 720, borderRadius: 36, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", overflow: "hidden", backgroundColor: "rgba(17,26,46,0.62)", ...shadow.glow },
  leftSide: { flex: 1, padding: spacing.xxxl, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  spark: { color: "#22D3EE", fontSize: 28 },
  brand: { color: colors.white, fontFamily: fonts.title, fontSize: 28 },
  brandAccent: { color: "#8B5CF6" },
  headline: { color: colors.white, fontFamily: fonts.title, fontSize: 40, lineHeight: 48, maxWidth: 520 },
  copy: { color: "#C7D2E5", fontFamily: fonts.regular, lineHeight: 25, marginTop: spacing.lg, marginBottom: spacing.xxl, maxWidth: 520 },
  feature: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  featureIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: "rgba(79,124,255,0.18)", textAlign: "center", textAlignVertical: "center", color: "#A78BFA", fontFamily: fonts.title },
  featureTitle: { color: colors.white, fontFamily: fonts.bold },
  featureText: { color: "#AAB6CC", fontFamily: fonts.regular, marginTop: 3 },
  card: { flex: 1, margin: spacing.xl, borderRadius: 30, padding: spacing.xxxl, backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", justifyContent: "center" },
  title: { color: colors.white, fontFamily: fonts.title, fontSize: 34 },
  subtitle: { color: "#C7D2E5", fontFamily: fonts.regular, marginTop: spacing.sm, marginBottom: spacing.xl },
  field: { marginBottom: spacing.lg },
  label: { color: "#E5E7EB", fontFamily: fonts.bold, marginBottom: spacing.sm },
  inputShell: { height: 56, borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.06)", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md },
  input: { flex: 1, color: colors.white, fontFamily: fonts.regular, fontSize: 15, height: "100%" },
  showText: { color: "#A78BFA", fontFamily: fonts.bold },
  primaryButton: { height: 58, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.md, ...shadow.glow },
  primaryButtonText: { color: colors.white, fontFamily: fonts.title, fontSize: 17 },
  trust: { color: "#AAB6CC", fontFamily: fonts.regular, textAlign: "center", lineHeight: 21, marginTop: spacing.xl },
  link: { color: "#60A5FA", fontFamily: fonts.bold, textAlign: "center", marginTop: spacing.xl }
});
