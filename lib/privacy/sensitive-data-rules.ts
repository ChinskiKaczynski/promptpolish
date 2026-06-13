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
    pattern: /\b(?:OPENAI_API_KEY|OPENROUTER_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\s*=\s*[^\s]+/i,
    message: 'Wykryto przypisanie klucza API w formacie zmiennej środowiskowej (.env secret).'
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
    id: 'database-url',
    type: 'database_url',
    riskLevel: 'high',
    pattern: /\b(?:postgresql|postgres|mongodb|mysql|redis):\/\/[A-Za-z0-9_.-]+:[A-Za-z0-9_.~%+-]+@[A-Za-z0-9_.-]+(?::\d+)?\/[A-Za-z0-9_.-]*\b/i,
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
