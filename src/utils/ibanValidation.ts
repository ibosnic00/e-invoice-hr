// HR: IBAN koristi MOD97 provjeru za checksum, ova provjera samo
// validira strukturu IBAN-a, a ne njegovo postojanje u sustavu.
// Za provjeru postojanja u sustavu potrebno je koristiti
// jedan od bankarskih API-a.

// EN: IBAN uses MOD97 checksum; this check only validates
// the structure of the IBAN, not its existence in the system.
// To verify its existence, use one of the existing banking APIs.

// Source: https://www.alpha.gr/-/media/alphagr/files/files-archive/personalbanking/iban_check_digit_en.pdf

// Mapping letters to numbers as per IBAN specifications
const letterTable: { [key: string]: number } = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 18,
    J: 19, K: 20, L: 21, M: 22, N: 23, O: 24, P: 25, Q: 26, R: 27,
    S: 28, T: 29, U: 30, V: 31, W: 32, X: 33, Y: 34, Z: 35
  };
  
  /**
   * Validates the structure of an IBAN using the MOD97 algorithm.
   * @param inputIBAN - The IBAN string to validate.
   * @returns True if the IBAN is structurally valid; otherwise, false.
   */
  export function validateIBAN(inputIBAN: string): boolean {
    // Ensure the IBAN is in uppercase
    const iban = inputIBAN.toUpperCase();
  
    // Move the first four characters to the end of the string
    const rearrangedIBAN = iban.slice(4) + iban.slice(0, 4);
  
    // Replace each letter in the string with two digits
    const numericIBAN = rearrangedIBAN.split('').map(char => {
      if (/[A-Z]/.test(char)) {
        return letterTable[char];
      } else if (/\d/.test(char)) {
        return char;
      } else {
        // Invalid character found
        throw new Error(`Invalid character '${char}' in IBAN.`);
      }
    }).join('');
  
    // Convert the string to a BigInt
    const ibanInteger = BigInt(numericIBAN);
  
    // Validate the IBAN using MOD97; a valid IBAN will have a remainder of 1
    return ibanInteger % BigInt(97) === BigInt(1);
  }
  