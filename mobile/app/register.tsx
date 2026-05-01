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

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [name, setName] = useState("Will");
  const [email, setEmail] = useState("william100william@gmail.com");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    try {
      if (!name || !email || !password) {
        Alert.alert("Atenção", "Preencha nome, e-mail e senha.");
        return;
      }

      setIsSubmitting(true);

      await signUp(name.trim(), email.trim().toLowerCase(), password);

      router.replace("/home");
    } catch (error: any) {
      console.log("[REGISTER ERROR]", error?.response?.data || error);

      Alert.alert(
        "Erro ao cadastrar",
        error?.response?.data?.message || "Não foi possível criar sua conta."
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
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Comece a organizar sua rotina.</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.button} onPress={handleRegister} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace("/login")}>
          <Text style={styles.link}>Já tenho conta</Text>
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
    borderRadius: 22,
    padding: 22
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#101828",
    marginBottom: 6
  },
  subtitle: {
    fontSize: 15,
    color: "#667085",
    marginBottom: 22
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff"
  },
  button: {
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16
  },
  link: {
    color: "#2563EB",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18
  }
});