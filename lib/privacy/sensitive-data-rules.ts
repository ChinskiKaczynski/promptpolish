export type SensitiveRiskLevel = 'none' | 'low' | 'medium' | 'high'

export type SensitiveDataRule = {
  id: string
  type: string
  riskLevel: Exclude<SensitiveRiskLevel, 'none'>
  pattern: RegExp
  message: string
}

export const sensitiveDataRules: SensitiveDataRule[] = [
  {
    id: 'private-key-block',
    type: 'private_key_block',
    riskLevel: 'high',
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/i,
    message: 'Wykryto prywatny klucz szyfrujący (Private Key Block). Nigdy nie udostępniaj kluczy prywatnych.'
  },
  {
    id: 'env-secret-key',
    type: 'env_secret_key',
    riskLevel: 'high',
    pattern: /\b(?:OPENAI_API_KEY|OPENROUTER_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\s*=\s*[^\s]+/i,
    message: 'Wykryto przypisanie klucza API w formacie zmiennej środowiskowej (.env secret).'
  },
  {
    id: 'google-api-key',
    type: 'provider_api_key',
    riskLevel: 'high',
    pattern: /\bAIzaSy[A-Za-z0-9_-]{33}\b/,
    message: 'Wykryto klucz Google API (AIzaSy...). Nigdy nie udostępniaj kluczy API.'
  },
  {
    id: 'bearer-token',
    type: 'bearer_token',
    riskLevel: 'high',
    pattern: /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}/i,
    message: 'Wykryto token autoryzacyjny typu Bearer (Bearer Token).'
  },
  {
    id: 'jwt-like',
    type: 'jwt_like_token',
    riskLevel: 'high',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    message: 'Wykryto token strukturalny przypominający format JWT (JWT-like Token).'
  },
  {
    id: 'provider-key-sk',
    type: 'provider_api_key',
    riskLevel: 'high',
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
    message: 'Wykryto poufny klucz API powiązany z dostawcą AI (AI Provider API Key).'
  },
  {
    id: 'github-pat',
    type: 'github_pat',
    riskLevel: 'high',
    pattern: /\b(?:ghp_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{82,255})\b/,
    message: 'Wykryto osobisty token dostępu GitHub (GitHub Personal Access Token).'
  },
  {
    id: 'huggingface-token',
    type: 'huggingface_token',
    riskLevel: 'high',
    pattern: /\bhf_[A-Za-z0-9]{34,255}\b/,
    message: 'Wykryto token dostępu Hugging Face.'
  },
  {
    id: 'stripe-webhook-secret',
    type: 'stripe_webhook_secret',
    riskLevel: 'high',
    pattern: /\bwhsec_[A-Za-z0-9_]{32,255}\b/,
    message: 'Wykryto klucz Stripe Webhook Secret (whsec_...).'
  },
  {
    id: 'npm-token',
    type: 'npm_token',
    riskLevel: 'high',
    pattern: /\bnpm_[A-Za-z0-9_]{36,255}\b/,
    message: 'Wykryto token pakietów npm (npm_...).'
  },
  {
    id: 'slack-token',
    type: 'slack_token',
    riskLevel: 'high',
    pattern: /\bxox[bprs]-[A-Za-z0-9-]{10,255}\b/,
    message: 'Wykryto token autoryzacyjny Slack.'
  },
  {
    id: 'database-url',
    type: 'database_url',
    riskLevel: 'high',
    pattern: /\b(?:postgresql|postgres|mongodb|mysql|redis):\/\/[^\s@:]+:[^\s]+@[A-Za-z0-9_.-]+(?::\d+)?\/[A-Za-z0-9_.-]*\b/i,
    message: 'Wykryto dane uwierzytelniające bazy danych w formacie URL (Database URL).'
  },
  {
    id: 'password-assignment',
    type: 'password_assignment',
    riskLevel: 'medium',
    pattern: /\b[A-Za-z0-9_-]*(?:password|passwd|pwd)\s*[:=]\s*[^\s]{6,}/i,
    message: 'Wykryto przypisanie hasła lub frazy dostępowej (Password assignment).'
  },
  {
    id: 'stripe-api-key',
    type: 'stripe_api_key',
    riskLevel: 'high',
    pattern: /\b(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{24,255}\b/,
    message: 'Wykryto klucz Stripe API (sk_test_... lub pk_test_...).'
  },
  {
    id: 'credit-card',
    type: 'credit_card',
    riskLevel: 'high',
    pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{1,4}\b/,
    message: 'Zidentyfikowano potencjalny numer karty płatniczej.'
  },
  {
    id: 'email-address',
    type: 'email_address',
    riskLevel: 'low',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    message: 'Zidentyfikowano adres e-mail (Email address).'
  },
  {
    id: 'phone-number',
    type: 'phone_number',
    riskLevel: 'low',
    pattern: /(?:\+?\d[\d .-]{7,}\d)/,
    message: 'Zidentyfikowano numer telefonu (Phone number).'
  }
]

export const riskRank: Record<SensitiveRiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
}
