import { validateIBAN } from './ibanValidation';
import { BarcodePaymentData } from '../types/types';


export enum ValidationResult {
  OK = 0,
  PriceMaxLengthExceeded = 1 << 0,
  PricePatternInvalid = 1 << 1,
  PayerNameMaxLengthExceeded = 1 << 2,
  PayerNameInvalid = 1 << 3,
  PayerAddressMaxLengthExceeded = 1 << 4,
  PayerAddressInvalid = 1 << 5,
  PayerHQMaxLengthExceeded = 1 << 6,
  PayerHQInvalid = 1 << 7,
  ReceiverNameMaxLengthExceeded = 1 << 8,
  ReceiverNameInvalid = 1 << 9,
  ReceiverAddressMaxLengthExceeded = 1 << 10,
  ReceiverAddressInvalid = 1 << 11,
  ReceiverHQMaxLengthExceeded = 1 << 12,
  ReceiverHQInvalid = 1 << 13,
  IBANInvalid = 1 << 14,
  PaymentModelInvalid = 1 << 15,
  CalloutNumberInvalid = 1 << 16,
  IntentCodeInvalid = 1 << 17,
  PaymentDescriptionMaxLengthExceeded = 1 << 18,
  PaymentDescriptionInvalid = 1 << 19,
}

const allowedSingleByteCharacters = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d",
  "e", "f", "g", "h", "i", "j", "k", "l", "m", "n",
  "o", "p", "q", "r", "s", "t", "u", "v", "w", "x",
  "y", "z", " ", ",", ".", ":", "-", "+", "?", "'",
  "/", "(", ")"
];

const allowedTwoByteCharacters = [
  "Š", "Đ", "Č", "Ć", "Ž",
  "š", "đ", "č", "ć", "ž"
];

const delimiter = String.fromCharCode(0x0A);
const header = "HRVHUB30";
const currency = "EUR";
const paymentModelPrefix = "HR";

const MaxLengths = {
  Price: 15,
  PayerName: 30,
  PayerAddress: 30,
  PayerHQ: 30,
  ReceiverName: 30,
  ReceiverAddress: 30,
  ReceiverHQ: 30,
  PaymentDescription: 35,
};

const Defaults = {
  ValidateIBAN: false,
  ValidateModelPozivNaBroj: false,
};

function getLength(str: string): number {
  let len = 0;
  if (str) {
    for (const c of str) {
      if (allowedTwoByteCharacters.includes(c)) {
        len += 2;
      } else if (allowedSingleByteCharacters.includes(c)) {
        len += 1;
      } else {
        return -1;
      }
    }
  }
  return len;
}

function isIBANValid(iban: string): boolean {
  return validateIBAN(iban);
}

function isPaymentModelValid(paymentModel: string): boolean {
  const validModels = ["00", "01", "02", "03", "04", "05"]; // Example models
  return validModels.includes(paymentModel);
}

function isCalloutNumberValid(): boolean {
  if (Defaults.ValidateModelPozivNaBroj) {
    // Implement validation logic based on paymentModel
  }
  return true;
}

export function validatePaymentParams(paymentParams: BarcodePaymentData): ValidationResult {
  let result = ValidationResult.OK;

  // Helper function to validate length and character set
  const validateField = (
    fieldValue: string,
    maxLength: number,
    maxLengthFlag: ValidationResult,
    invalidCharFlag: ValidationResult
  ): ValidationResult => {
    let fieldResult = ValidationResult.OK;
    const fieldLength = getLength(fieldValue);

    if (fieldLength > maxLength) {
      fieldResult |= maxLengthFlag;
    }
    if (fieldLength === -1) {
      fieldResult |= invalidCharFlag;
    }

    return fieldResult;
  };

  // Price (required) - amount is stored in cents
  const fieldLength = getLength(paymentParams.Iznos.toString());
  if (fieldLength > MaxLengths.Price) {
    result |= ValidationResult.PriceMaxLengthExceeded;
  }

  // Required fields validation
  result |= validateField(
    paymentParams.Primatelj,
    MaxLengths.ReceiverName,
    ValidationResult.ReceiverNameMaxLengthExceeded,
    ValidationResult.ReceiverNameInvalid
  );

  result |= validateField(
    paymentParams.OpisPlacanja,
    MaxLengths.PaymentDescription,
    ValidationResult.PaymentDescriptionMaxLengthExceeded,
    ValidationResult.PaymentDescriptionInvalid
  );

  // IBAN (required)
  if (!isIBANValid(paymentParams.IBAN)) {
    result |= ValidationResult.IBANInvalid;
  }

  // Payment Model (required)
  if (!isPaymentModelValid(paymentParams.ModelPlacanja)) {
    result |= ValidationResult.PaymentModelInvalid;
  }

  // Callout Number (required)
  if (!isCalloutNumberValid()) {
    result |= ValidationResult.CalloutNumberInvalid;
  }

  // Optional fields validation (only if provided)
  if (paymentParams.ImePlatitelja) {
    result |= validateField(
      paymentParams.ImePlatitelja,
      MaxLengths.PayerName,
      ValidationResult.PayerNameMaxLengthExceeded,
      ValidationResult.PayerNameInvalid
    );
  }

  if (paymentParams.AdresaPlatitelja) {
    result |= validateField(
      paymentParams.AdresaPlatitelja,
      MaxLengths.PayerAddress,
      ValidationResult.PayerAddressMaxLengthExceeded,
      ValidationResult.PayerAddressInvalid
    );
  }

  if (paymentParams.SjedistePlatitelja) {
    result |= validateField(
      paymentParams.SjedistePlatitelja,
      MaxLengths.PayerHQ,
      ValidationResult.PayerHQMaxLengthExceeded,
      ValidationResult.PayerHQInvalid
    );
  }

  if (paymentParams.AdresaPrimatelja) {
    result |= validateField(
      paymentParams.AdresaPrimatelja,
      MaxLengths.ReceiverAddress,
      ValidationResult.ReceiverAddressMaxLengthExceeded,
      ValidationResult.ReceiverAddressInvalid
    );
  }

  if (paymentParams.SjedistePrimatelja) {
    result |= validateField(
      paymentParams.SjedistePrimatelja,
      MaxLengths.ReceiverHQ,
      ValidationResult.ReceiverHQMaxLengthExceeded,
      ValidationResult.ReceiverHQInvalid
    );
  }

  return result;
}

export const IntentCodes = [
  { code: "ADMG", title: "Administracija" },
  { code: "GVEA", title: "Austrijski državni zaposlenici, Kategorija A" },
  { code: "GVEB", title: "Austrijski državni zaposlenici, Kategorija B" },
  { code: "GVEC", title: "Austrijski državni zaposlenici, Kategorija C" },
  { code: "GVED", title: "Austrijski državni zaposlenici, Kategorija D" },
  { code: "BUSB", title: "Autobusni" },
  { code: "CPYR", title: "Autorsko pravo" },
  { code: "HSPC", title: "Bolnička njega" },
  { code: "RDTX", title: "Cestarina" },
  { code: "DEPT", title: "Depozit" },
  { code: "DERI", title: "Derivati (izvedenice)" },
  { code: "FREX", title: "Devizno tržište" },
  { code: "CGDD", title: "Direktno terećenje nastalo kao rezultat kartične transakcije" },
  { code: "DIVD", title: "Dividenda" },
  { code: "BECH", title: "Dječji doplatak" },
  { code: "CHAR", title: "Dobrotvorno plaćanje" },
  { code: "ETUP", title: "Doplata e-novca" },
  { code: "MTUP", title: "Doplata mobilnog uređaja (bon)" },
  { code: "GOVI", title: "Državno osiguranje" },
  { code: "ENRG", title: "Energenti" },
  { code: "CDCD", title: "Gotovinska isplata" },
  { code: "CSDB", title: "Gotovinska isplata" },
  { code: "TCSC", title: "Gradske naknade" },
  { code: "CDCS", title: "Isplata gotovine s naknadom" },
  { code: "FAND", title: "Isplata naknade za elementarne nepogode" },
  { code: "CSLP", title: "Isplata socijalnih zajmova društava  banci" },
  { code: "RHBS", title: "Isplata za vrijeme profesionalne rehabilitacije" },
  { code: "GWLT", title: "Isplata žrtvama rata i invalidima" },
  { code: "ADCS", title: "Isplate za donacije, sponzorstva, savjetodavne, intelektualne i druge usluge" },
  { code: "PADD", title: "Izravno terećenje" },
  { code: "INTE", title: "Kamata" },
  { code: "CDDP", title: "Kartično plaćanje s odgodom" },
  { code: "CDCB", title: "Kartično plaćanje uz gotovinski povrat (Cashback)" },
  { code: "BOCE", title: "Knjiženje konverzije u Back Office-u" },
  { code: "POPE", title: "Knjiženje mjesta kupnje" },
  { code: "RCKE", title: "Knjiženje ponovne prezentacije čeka" },
  { code: "AREN", title: "Knjiženje računa potraživanja" },
  { code: "COMC", title: "Komercijalno plaćanje" },
  { code: "UBIL", title: "Komunalne usluge" },
  { code: "COMT", title: "Konsolidirano plaćanje treće strane za račun potrošača." },
  { code: "SEPI", title: "Kupnja vrijednosnica (interna)" },
  { code: "GDDS", title: "Kupovina-prodaja roba" },
  { code: "GSCB", title: "Kupovina-prodaja roba i usluga uz gotovinski povrat" },
  { code: "GDSV", title: "Kupovina/prodaja roba i usluga" },
  { code: "SCVE", title: "Kupovina/prodaja usluga" },
  { code: "HLTC", title: "Kućna njega bolesnika" },
  { code: "CBLK", title: "Masovni kliring kartica" },
  { code: "MDCS", title: "Medicinske usluge" },
  { code: "NWCM", title: "Mrežna komunikacija" },
  { code: "RENT", title: "Najam" },
  { code: "ALLW", title: "Naknada" },
  { code: "SSBE", title: "Naknada socijalnog osiguranja" },
  { code: "LICF", title: "Naknada za licencu" },
  { code: "GFRP", title: "Naknada za nezaposlene u toku stečaja" },
  { code: "BENE", title: "Naknada za nezaposlenost/invaliditet" },
  { code: "CFEE", title: "Naknada za poništenje" },
  { code: "AEMP", title: "Naknada za zapošljavanje" },
  { code: "COLL", title: "Naplata" },
  { code: "FCOL", title: "Naplata naknade po kartičnoj transakciji" },
  { code: "DBTC", title: "Naplata putem terećenja" },
  { code: "NOWS", title: "Nenavedeno" },
  { code: "IDCP", title: "Neopozivo plaćanje sa računa debitne kartice" },
  { code: "ICCP", title: "Neopozivo plaćanje sa računa kreditne kartice" },
  { code: "BONU", title: "Novčana nagrada (bonus)." },
  { code: "PAYR", title: "Obračun plaća" },
  { code: "BLDM", title: "Održavanje zgrada" },
  { code: "HEDG", title: "Omeđivanje rizika (Hedging)" },
  { code: "CDOC", title: "Originalno odobrenje" },
  { code: "PPTI", title: "Osiguranje imovine" },
  { code: "LBRI", title: "Osiguranje iz rada" },
  { code: "OTHR", title: "Ostalo" },
  { code: "CLPR", title: "Otplata glavnice kredita za automobil" },
  { code: "HLRP", title: "Otplata stambenog kredita" },
  { code: "LOAR", title: "Otplata zajma" },
  { code: "ALMY", title: "Plaćanje alimentacije" },
  { code: "RCPT", title: "Plaćanje blagajničke potvrde. (ReceiptPayment)" },
  { code: "PRCP", title: "Plaćanje cijene" },
  { code: "SUPP", title: "Plaćanje dobavljača" },
  { code: "CFDI", title: "Plaćanje dospjele glavnice" },
  { code: "GOVT", title: "Plaćanje države" },
  { code: "PENS", title: "Plaćanje mirovine" },
  { code: "DCRD", title: "Plaćanje na račun debitne kartice." },
  { code: "CCRD", title: "Plaćanje na račun kreditne kartice" },
  { code: "SALA", title: "Plaćanje plaće" },
  { code: "REBT", title: "Plaćanje popusta/rabata" },
  { code: "TAXS", title: "Plaćanje poreza" },
  { code: "VATX", title: "Plaćanje poreza na dodatnu vrijednost" },
  { code: "RINP", title: "Plaćanje rata koje se ponavljaju" },
  { code: "IHRP", title: "Plaćanje rate pri kupnji na otplatu" },
  { code: "IVPT", title: "Plaćanje računa" },
  { code: "CDBL", title: "Plaćanje računa za kreditnu karticu" },
  { code: "TREA", title: "Plaćanje riznice" },
  { code: "CMDT", title: "Plaćanje roba" },
  { code: "INTC", title: "Plaćanje unutar društva" },
  { code: "INVS", title: "Plaćanje za fondove i vrijednosnice" },
  { code: "PRME", title: "Plemeniti metali" },
  { code: "AGRT", title: "Poljoprivredni transfer" },
  { code: "INTX", title: "Porez na dohodak" },
  { code: "PTXP", title: "Porez na imovinu" },
  { code: "NITX", title: "Porez na neto dohodak" },
  { code: "ESTX", title: "Porez na ostavštinu" },
  { code: "GSTX", title: "Porez na robu i usluge" },
  { code: "HSTX", title: "Porez na stambeni prostor" },
  { code: "FWLV", title: "Porez na strane radnike" },
  { code: "WHLD", title: "Porez po odbitku" },
  { code: "BEXP", title: "Poslovni troškovi" },
  { code: "REFU", title: "Povrat" },
  { code: "TAXR", title: "Povrat poreza" },
  { code: "RIMB", title: "Povrat prethodne pogrešne transakcije" },
  { code: "OFEE", title: "Početna naknada (Opening Fee)" },
  { code: "ADVA", title: "Predujam" },
  { code: "INSU", title: "Premija osiguranja" },
  { code: "INPC", title: "Premija osiguranja za vozilo" },
  { code: "TRPT", title: "Prepaid cestarina (ENC)" },
  { code: "SUBS", title: "Pretplata" },
  { code: "CASH", title: "Prijenos gotovine" },
  { code: "PENO", title: "Prisilna naplata" },
  { code: "COMM", title: "Provizija" },
  { code: "INSM", title: "Rata" },
  { code: "ELEC", title: "Račun za električnu energiju" },
  { code: "CBTV", title: "Račun za kabelsku TV" },
  { code: "OTLC", title: "Račun za ostale telekom usluge" },
  { code: "GASB", title: "Račun za plin" },
  { code: "WTER", title: "Račun za vodu" },
  { code: "ANNI", title: "Renta" },
  { code: "BBSC", title: "Rodiljna naknada" },
  { code: "NETT", title: "Saldiranje (netiranje)" },
  { code: "CAFI", title: "Skrbničke naknade (interne)" },
  { code: "STDY", title: "Studiranje" },
  { code: "ROYA", title: "Tantijeme" },
  { code: "PHON", title: "Telefonski račun" },
  { code: "FERB", title: "Trajektni" },
  { code: "DMEQ", title: "Trajna medicinska pomagala" },
  { code: "WEBI", title: "Transakcija inicirana internetom" },
  { code: "TELI", title: "Transakcija inicirana telefonom" },
  { code: "HREC", title: "Transakcija se odnosi na doprinos poslodavca za troškove stanovanja" },
  { code: "CBFR", title: "Transakcija se odnosi na kapitalnu štednju za mirovinu" },
  { code: "CBFF", title: "Transakcija se odnosi na kapitalnu štednju, općenito" },
  { code: "TRAD", title: "Trgovinske usluge" },
  { code: "COST", title: "Troškovi" },
  { code: "CPKC", title: "Troškovi parkiranja" },
  { code: "TBIL", title: "Troškovi telekomunikacija" },
  { code: "NWCH", title: "Troškovi za mrežu" },
  { code: "EDUC", title: "Troškovi školovanja" },
  { code: "LIMA", title: "Upravljanje likvidnošću" },
  { code: "ACCT", title: "Upravljanje računom" },
  { code: "ANTS", title: "Usluge anestezije" },
  { code: "VIEW", title: "Usluge oftalmološke skrbi" },
  { code: "LTCF", title: "Ustanova dugoročne zdravstvene skrbi" },
  { code: "ICRF", title: "Ustanova socijalne skrbi" },
  { code: "CVCF", title: "Ustanova za usluge skrbi za rekonvalescente" },
  { code: "PTSP", title: "Uvjeti plaćanja" },
  { code: "MSVC", title: "Višestruke vrste usluga" },
  { code: "SECU", title: "Vrijednosni papiri" },
  { code: "LOAN", title: "Zajam" },
  { code: "FCPM", title: "Zakašnjele naknade" },
  { code: "TRFD", title: "Zaklada" },
  { code: "CDQC", title: "Zamjenska gotovina" },
  { code: "HLTI", title: "Zdravstveno osiguranje" },
  { code: "AIRB", title: "Zračni" },
  { code: "DNTS", title: "Zubarske usluge" },
  { code: "SAVG", title: "Štednja" },
  { code: "RLWY", title: "Željeznički" },
  { code: "LIFI", title: "Životno osiguranje" }
];

export const PaymentModels = [
  { model: "00" },
  { model: "01" },
  { model: "02" },
  { model: "03" },
  { model: "04" },
  { model: "05" },
  { model: "06" },
  { model: "07" },
  { model: "08" },
  { model: "09" },
  { model: "10" },
  { model: "11" },
  { model: "12" },
  { model: "13" },
  { model: "14" },
  { model: "15" },
  { model: "16" },
  { model: "17" },
  { model: "18" },
  { model: "23" },
  { model: "24" },
  { model: "26" },
  { model: "27" },
  { model: "28" },
  { model: "29" },
  { model: "30" },
  { model: "31" },
  { model: "33" },
  { model: "34" },
  { model: "40" },
  { model: "41" },
  { model: "42" },
  { model: "43" },
  { model: "55" },
  { model: "62" },
  { model: "63" },
  { model: "64" },
  { model: "65" },
  { model: "67" },
  { model: "68" },
  { model: "69" },
  { model: "99" },
  { model: "25" },
  { model: "83" },
  { model: "84" },
  { model: "50" }
];

export function generateBarcodeString(paymentParams: BarcodePaymentData): string {
  return GetEncodedText(paymentParams);
}

const EncodePrice = function (price: number): string {
  const fullLength = 15;
  // Convert price from cents to the format expected by the barcode
  // price is already in cents (e.g., 3900 for 39.00 EUR)
  return PadLeft(price.toString(), fullLength, '0');
};

// Ensure PadLeft function is defined
function PadLeft(value: string, length: number, char: string): string {
  while (value.length < length) {
    value = char + value;
  }
  return value;
}

const ConcatenateStrings = function (...args: (string | undefined)[]): string {
  let res = '';

  for (let i = 0; i < args.length; ++i) {
    if (typeof args[i] !== 'undefined') {
      res += args[i];
    }
  }

  return res;
};

const GetEncodedText = function (paymentParams: BarcodePaymentData) {

  return ConcatenateStrings(
    header,
    delimiter,
    currency,
    delimiter,
    EncodePrice(paymentParams.Iznos),
    delimiter,
    paymentParams.ImePlatitelja || "", // Use empty string if optional field is not provided
    delimiter,
    paymentParams.AdresaPlatitelja || "", // Use empty string if optional field is not provided
    delimiter,
    paymentParams.SjedistePlatitelja || "", // Use empty string if optional field is not provided
    delimiter,
    paymentParams.Primatelj,
    delimiter,
    paymentParams.AdresaPrimatelja || "", // Use empty string if optional field is not provided
    delimiter,
    paymentParams.SjedistePrimatelja || "", // Use empty string if optional field is not provided
    delimiter,
    paymentParams.IBAN,
    delimiter,
    paymentModelPrefix,
    paymentParams.ModelPlacanja,
    delimiter,
    paymentParams.PozivNaBroj,
    delimiter,
    paymentParams.SifraNamjene || "", // Use empty string if optional field is not provided
    delimiter,
    paymentParams.OpisPlacanja,
    delimiter
  );
};

// Convert numeric amount to display format (e.g., 3900 -> "39,00")
export const formatAmountForDisplay = (amount: number): string => {
  return (amount / 100).toFixed(2).replace('.', ',')
}

// Convert display format to numeric amount (e.g., "39,00" -> 3900, "3900" -> 390000)
export const parseAmountFromDisplay = (displayValue: string): number => {
  // Remove all non-digit characters except comma
  const cleaned = displayValue.replace(/[^\d,]/g, '')
  // Handle comma as decimal separator
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',')
    const wholePart = parts[0] || '0'
    const decimalPart = parts[1] || '00'
    // Ensure decimal part has exactly 2 digits
    const paddedDecimal = decimalPart.padEnd(2, '0').substring(0, 2)
    return parseInt(wholePart + paddedDecimal, 10)
  } else {
    // No comma found, treat as whole EUR amount
    // If user enters just digits, assume they're entering whole EUR
    // e.g., "3900" -> 3900 EUR = 390000 cents
    return parseInt(cleaned || '0', 10) * 100
  }
}