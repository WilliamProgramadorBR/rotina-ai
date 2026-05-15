// Padrões conhecidos de prompt injection contra LLMs
const INJECTION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "ignore-instructions", pattern: /ignore\s+(all\s+)?(previous|prior|above|earlier|system)/gi },
  { label: "forget-instructions",  pattern: /forget\s+(all\s+)?(previous|prior|above|your\s+instructions)/gi },
  { label: "you-are-now",          pattern: /you\s+are\s+now\s+(a\s+)?(different|new|another|unrestricted|jailbroken)/gi },
  { label: "act-as",               pattern: /act\s+as\s+(a\s+)?(different|new|another|unrestricted|evil|unfiltered)/gi },
  { label: "override",             pattern: /override\s+(your\s+)?(instructions|rules|system|constraints)/gi },
  { label: "disregard",            pattern: /disregard\s+(your\s+)?(instructions|rules|constraints|previous|everything)/gi },
  { label: "pretend",              pattern: /pretend\s+(you\s+are|to\s+be)\s+(un|not|no\s+longer)/gi },
  { label: "jailbreak",            pattern: /jailbreak|DAN\s*mode|do\s+anything\s+now/gi },
  { label: "system-prompt-leak",   pattern: /repeat\s+(your\s+)?(system\s+prompt|instructions|prompt)/gi },
  { label: "llm-format-inst",      pattern: /\[INST\]|<\|im_start\|>|<\|system\|>|<\|endoftext\|>|\[\/INST\]/gi },
  { label: "new-role",             pattern: /(novo|new)\s+(papel|role|persona|character):\s*/gi },
];

/**
 * Remove null bytes, caracteres de controle perigosos e normaliza whitespace.
 * NÃO filtra keywords (evita falsos positivos) — só limpa a superfície.
 */
export function sanitizeAiPrompt(input: string): string {
  return input
    // Remove null bytes
    .replace(/\x00/g, "")
    // Remove caracteres de controle (exceto \n e \t)
    .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    // Normaliza quebras de linha
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Colapsa sequências excessivas de newlines (máx 3 seguidas)
    .replace(/\n{4,}/g, "\n\n\n")
    // Colapsa espaços múltiplos dentro de uma linha
    .replace(/[^\S\n]{3,}/g, "  ")
    .trim();
}

/**
 * Detecta padrões de prompt injection.
 * Retorna os labels dos padrões encontrados (vazio = limpo).
 * Use apenas para logging/monitoramento — NÃO bloqueie por aqui,
 * pois falsos positivos fariam o app rejeitar inputs legítimos.
 */
export function detectInjectionPatterns(input: string): string[] {
  return INJECTION_PATTERNS
    .filter(({ pattern }) => {
      pattern.lastIndex = 0;
      return pattern.test(input);
    })
    .map(({ label }) => label);
}
