export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateOIB = (oib: string): ValidationResult => {
  // OIB mora biti točno 11 znamenki
  if (!oib || oib.length !== 11) {
    return {
      isValid: false,
      error: 'OIB mora sadržavati točno 11 znamenki'
    };
  }

  // Provjeri da su svi znakovi brojevi
  if (!/^\d{11}$/.test(oib)) {
    return {
      isValid: false,
      error: 'OIB može sadržavati samo brojeve'
    };
  }

  // Hrvatska validacija OIB-a (modulo 10 algoritam)
  let sum = 10;
  for (let i = 0; i < 10; i++) {
    sum = (sum + parseInt(oib[i])) % 10;
    if (sum === 0) sum = 10;
    sum = (sum * 2) % 11;
  }
  
  const checksum = (11 - sum) % 10;
  const lastDigit = parseInt(oib[10]);
  
  if (checksum !== lastDigit) {
    return {
      isValid: false,
      error: 'OIB nije ispravan (pogrešna kontrolna znamenka)'
    };
  }

  return {
    isValid: true
  };
};

export const formatOIB = (value: string): string => {
  // Ukloni sve osim brojeva
  const numbers = value.replace(/\D/g, '');
  
  // Ograniči na 11 znamenki
  return numbers.slice(0, 11);
}; 