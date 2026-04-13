const isValidProductName = (name) => typeof name === 'string' && name.trim().length > 0;

const isValidPrice = (price) => typeof price === 'number' && price > 0;

const isValidWhatsAppNumber = (number) => {
  const cleaned = String(number).replace(/\D/g, '');
  return cleaned.length >= 8;
};

const isBankConfigComplete = (bank, holder, account) =>
  !!(bank?.trim() && holder?.trim() && account?.trim());

module.exports = { isValidProductName, isValidPrice, isValidWhatsAppNumber, isBankConfigComplete };
