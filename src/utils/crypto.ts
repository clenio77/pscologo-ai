/**
 * Utilitários de segurança e criptografia leve para dados sensíveis no LocalStorage
 */

// Chave estática de ofuscação/criptografia para o Modo Demo. 
// Em produção com o Supabase, as políticas de RLS e criptografia nativa no banco cuidam disso.
const ENCRYPTION_KEY = 'agenda_clinical_demo_secure_key_3129';

/**
 * Criptografa síncronamente uma string de texto usando uma cifra XOR dinâmica
 * com codificação Base64 para proteção de dados clínicos em localStorage.
 * @param text Texto plano
 * @returns Texto criptografado em Base64
 */
export const encrypt = (text: string): string => {
  try {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch (err) {
    console.error('[Crypto] Falha ao criptografar dados:', err);
    return text;
  }
};

/**
 * Descriptografa síncronamente uma string de texto codificada em Base64
 * @param cipherText Texto criptografado
 * @returns Texto plano original
 */
export const decrypt = (cipherText: string): string => {
  try {
    if (!cipherText) return '';
    const decoded = decodeURIComponent(escape(atob(cipherText)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (err) {
    // Caso o dado ainda não esteja criptografado (compatibilidade com dados antigos), retorna o próprio texto
    return cipherText;
  }
};

/**
 * Salva um dado no localStorage criptografado
 */
export const setSecureItem = (key: string, value: unknown): void => {
  const jsonString = JSON.stringify(value);
  const encryptedData = encrypt(jsonString);
  localStorage.setItem(key, encryptedData);
};

/**
 * Recupera um dado do localStorage descriptografando-o
 */
export const getSecureItem = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  
  // Tenta descriptografar
  const decryptedData = decrypt(data);
  try {
    return JSON.parse(decryptedData) as T;
  } catch (err) {
    // Fallback: se falhar o parse JSON, talvez o dado estivesse em formato plano original
    try {
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }
};
