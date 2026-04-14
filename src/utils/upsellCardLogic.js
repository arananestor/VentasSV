const validateUpsellProps = ({ title, description }) => {
  if (!title) return { valid: false, error: 'missing title' };
  if (!description) return { valid: false, error: 'missing description' };
  return { valid: true };
};

const getDefaultCtaLabel = (ctaLabel) => ctaLabel || 'Conectar Qentas';

module.exports = { validateUpsellProps, getDefaultCtaLabel };
