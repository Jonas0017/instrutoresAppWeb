// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Validação de email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de telefone (formato brasileiro)
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

// Validação de senha
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('A senha deve ter pelo menos 6 caracteres');
  }
  
  if (password.length > 50) {
    errors.push('A senha deve ter no máximo 50 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validação de nome
export const validateName = (name: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (name.trim().length < 2) {
    errors.push('O nome deve ter pelo menos 2 caracteres');
  }
  
  if (name.trim().length > 100) {
    errors.push('O nome deve ter no máximo 100 caracteres');
  }
  
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
    errors.push('O nome deve conter apenas letras e espaços');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validação de data
export const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

// Validação de horário
export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Formatação de CPF
export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return cleanPhone;
};

// Formatação de data
export const formatDate = (date: string): string => {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

// Validação de campos obrigatórios
export const validateRequired = (value: any, fieldName: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      error: `${fieldName} é obrigatório`
    };
  }
  return { isValid: true };
}; 