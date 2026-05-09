const crypto = require('crypto');

const generateEAN13 = () => {
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10);
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
};

const generateEAN8 = () => {
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += Math.floor(Math.random() * 10);
  }
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
};

const generateUPCA = () => {
  const manufacturer = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  const product = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  const code = manufacturer + product;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
};

const generateCode128 = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateCode39 = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
  let code = '*';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code + '*';
};

const generateQRCode = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

const generateBarcode = (type = 'code128') => {
  switch (type) {
    case 'ean13': return generateEAN13();
    case 'ean8': return generateEAN8();
    case 'upca': return generateUPCA();
    case 'upce': return generateEAN8();
    case 'code128': return generateCode128();
    case 'code39': return generateCode39();
    case 'qrcode': return generateQRCode();
    default: return generateCode128();
  }
};

module.exports = { generateBarcode };
