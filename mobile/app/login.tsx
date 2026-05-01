import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

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

      const status = error?.response?.status;

      if (!status) {
        Alert.alert(
          "Erro de conexão",
          "Não foi possível conectar ao backend. Verifique se o túnel Cloudflare está ativo e se a URL do .env está correta."
        );
        return;
      }

      Alert.alert(
        "Erro ao entrar",
        error?.response?.data?.message || "Não foi possível fazer login."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({
        ios: "padding",
        android: undefined
      })}
    >
      <View style={styles.card}>
        <View style={styles.brandCircle}>
          <Text style={styles.brandIcon}>⏰</Text>
        </View>

        <Text style={styles.title}>Rotina AI</Text>
        <Text style={styles.subtitle}>
          Entre para acessar seus alarmes, cronogramas e lembretes inteligentes.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#98A2B3"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Senha</Text>

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Digite sua senha"
              placeholderTextColor="#98A2B3"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              style={styles.showPasswordButton}
              onPress={() => setShowPassword((current) => !current)}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? "Ocultar" : "Mostrar"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push("/register")}>
          <Text style={styles.link}>Criar uma conta</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101828",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 24
  },
  brandCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  brandIcon: {
    fontSize: 30
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#101828",
    marginBottom: 6
  },
  subtitle: {
    fontSize: 15,
    color: "#667085",
    marginBottom: 24,
    lineHeight: 22
  },
  field: {
    marginBottom: 14
  },
  label: {
    color: "#344054",
    fontWeight: "800",
    marginBottom: 8
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#101828"
  },
  passwordWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center"
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#101828"
  },
  showPasswordButton: {
    height: "100%",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  showPasswordText: {
    color: "#2563EB",
    fontWeight: "900"
  },
  button: {
    height: 54,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16
  },
  link: {
    color: "#2563EB",
    fontWeight: "800",
    textAlign: "center",
    marginTop: 20
  }
});