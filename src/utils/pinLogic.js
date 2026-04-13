const PIN_LENGTH = 4;

const KEYPAD_LAYOUT = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

const appendDigit = (pin, digit) => {
  if (pin.length >= PIN_LENGTH) return pin;
  return pin + digit;
};

const deleteLastDigit = (pin) => {
  if (pin.length === 0) return pin;
  return pin.slice(0, -1);
};

const isPinComplete = (pin) => pin.length === PIN_LENGTH;

const isDotFilled = (index, pinLength) => index < pinLength;

const buildDotsState = (pinLength) =>
  Array.from({ length: PIN_LENGTH }).map((_, i) => isDotFilled(i, pinLength));

module.exports = { PIN_LENGTH, KEYPAD_LAYOUT, appendDigit, deleteLastDigit, isPinComplete, isDotFilled, buildDotsState };
