const KNOWN_MESSAGES: Record<string, string> = {
  "E-mail ou senha invalidos.": "E-mail ou senha inválidos.",
  "Este e-mail ja esta cadastrado.": "Este e-mail já está cadastrado.",
  "Senha deve ter no minimo 8 caracteres.": "A senha deve ter no mínimo 8 caracteres.",
  "Voce precisa aceitar os termos de privacidade para criar a conta.": "Você precisa aceitar os termos de privacidade para criar a conta.",
  "Codigo invalido ou expirado.": "Código inválido ou expirado.",
  "Código inválido ou expirado.": "Código inválido ou expirado."
};

function polishMessage(message: string) {
  return KNOWN_MESSAGES[message] || message;
}

function isNetworkError(error: any) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    message.includes("network error") ||
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("timeout")
  );
}

export function getApiErrorMessage(error: any, fallback: string) {
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return polishMessage(responseMessage.trim());
  }

  if (isNetworkError(error)) {
    return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
  }

  return fallback;
}
