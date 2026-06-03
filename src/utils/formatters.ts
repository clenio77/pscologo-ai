/**
 * Utilitários de formatação e manipulação de dados de pacientes
 */

/**
 * Formata uma string de telefone para o padrão brasileiro (DD) 99999-9999 ou (DD) 9999-9999
 * @param value String bruta contendo caracteres numéricos
 * @returns Telefone formatado
 */
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Calcula a idade de uma pessoa a partir de sua data de nascimento
 * @param birthDateString Data de nascimento em formato string (AAAA-MM-DD)
 * @returns Idade descritiva em anos
 */
export const calculateAge = (birthDateString?: string): string => {
  if (!birthDateString) return 'Idade não informada';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return `${age} anos`;
};
