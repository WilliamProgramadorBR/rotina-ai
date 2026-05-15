import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../src/components/ui";
import { IconSymbol } from "../src/components/IconSymbol";
import { fonts, spacing, scaledFont } from "../src/theme";
import { useResponsive } from "../src/hooks/useResponsive";
import { useThemeMode } from "../src/context/ThemeContext";

const sections = [
  {
    title: "1. Dados que coletamos",
    body:
      "Coletamos os dados necessarios para operar o Rotina AI: nome, e-mail, senha protegida por hash, rotinas, tarefas, lembretes, logs de conclusao, convites de colaboracao, preferencias e dados tecnicos basicos de uso da API."
  },
  {
    title: "2. Como usamos os dados",
    body:
      "Usamos esses dados para autenticar sua conta, sincronizar suas rotinas, agendar lembretes, mostrar metricas, permitir colaboracao com outros usuarios e gerar sugestoes de organizacao com IA quando voce solicita."
  },
  {
    title: "3. Privacidade do conteudo",
    body:
      "A equipe do Rotina AI nao acessa manualmente, vende ou compartilha o conteudo das suas rotinas. O processamento pelo backend e pela IA acontece de forma automatizada para entregar as funcionalidades do app."
  },
  {
    title: "4. Criptografia e seguranca",
    body:
      "Campos privados de rotinas, tarefas, observacoes, links e mensagens colaborativas sao criptografados em repouso no banco de dados. A comunicacao com a API deve usar HTTPS em producao. Senhas nao sao armazenadas em texto puro."
  },
  {
    title: "5. IA local e provedores",
    body:
      "Quando configurado para Ollama, o app usa um modelo local conectado ao backend. Se houver provedores externos habilitados como fallback, o pedido enviado a IA pode ser processado por esses provedores conforme a configuracao do servidor."
  },
  {
    title: "6. Colaboracao",
    body:
      "Ao aceitar um convite, membros do grupo podem ver rotinas e tarefas compartilhadas daquele grupo, registrar conclusoes e colaborar no plano. Rotinas pessoais fora do grupo continuam privadas para a sua conta."
  },
  {
    title: "7. Retencao e exclusao",
    body:
      "Mantemos os dados enquanto sua conta estiver ativa ou enquanto forem necessarios para prestar o servico. Voce pode solicitar acesso, correcao ou exclusao dos seus dados pelo contato informado no app."
  },
  {
    title: "8. Responsabilidade de uso",
    body:
      "A IA ajuda a organizar tarefas, mas as sugestoes devem ser revisadas por voce. Para temas de saude, remedios ou tratamentos, siga orientacao profissional e confira dose, horario e contexto antes de salvar."
  },
  {
    title: "9. Contato",
    body:
      "Responsavel pelo app: William Oliveira Dos Santos. Contato: william100william@gmail.com."
  }
];

export default function PrivacyScreen() {
  const { width } = useResponsive();
  const { theme } = useThemeMode();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.iconShell, { backgroundColor: theme.primarySoft }]}>
            <IconSymbol name="shield-lock-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text, fontSize: scaledFont(28, width) }]}>
            Politica de Privacidade e Termos de Uso
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted, fontSize: scaledFont(14, width) }]}>
            Atualizado em 15/05/2026. Texto de transparencia do Rotina AI para uso do app e publicacao futura.
          </Text>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumo direto</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            O Rotina AI foi desenhado para organizar sua rotina sem expor seus dados. Conteudos sensiveis sao criptografados em repouso, sua senha fica protegida por hash e seus dados colaborativos so aparecem para membros dos grupos que voce cria ou aceita participar.
          </Text>
        </Card>

        {sections.map((section) => (
          <Card key={section.title} style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.paragraph, { color: theme.textMuted }]}>{section.body}</Text>
          </Card>
        ))}

        <Button title="Voltar" icon="arrow-left" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md
  },
  header: {
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  iconShell: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontFamily: fonts.title,
    lineHeight: 34
  },
  subtitle: {
    fontFamily: fonts.regular,
    lineHeight: 20
  },
  summaryCard: {
    gap: spacing.sm
  },
  summaryTitle: {
    fontFamily: fonts.title,
    fontSize: 18
  },
  sectionCard: {
    gap: spacing.sm
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21
  }
});
