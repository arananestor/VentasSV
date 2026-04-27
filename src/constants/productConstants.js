export const FOOD_ICONS = [
  'food', 'food-outline', 'food-variant', 'food-fork-drink',
  'food-apple', 'food-apple-outline', 'food-croissant',
  'food-drumstick', 'food-drumstick-outline',
  'food-steak', 'food-hot-dog', 'food-turkey',
  'food-takeout-box', 'food-takeout-box-outline',
  'hamburger', 'hamburger-check', 'french-fries', 'pizza', 'taco',
  'noodles', 'pasta', 'rice',
  'fruit-watermelon', 'fruit-cherries', 'fruit-citrus',
  'fruit-grapes', 'fruit-pineapple', 'fruit-pear',
  'cake', 'cake-layered', 'cake-variant', 'cookie', 'cupcake', 'muffin',
  'candy', 'candycane', 'bread-slice', 'pretzel',
  'ice-cream', 'ice-pop',
  'coffee', 'coffee-to-go', 'tea', 'cup', 'cup-water',
  'beer', 'beer-outline', 'bottle-wine', 'glass-wine',
  'pot-steam', 'grill', 'egg', 'egg-fried', 'fish',
  'mushroom', 'carrot', 'popcorn', 'peanut',
  'shaker', 'blender', 'silverware', 'silverware-fork-knife',
  'store', 'store-outline', 'shopping', 'shopping-outline',
  'hanger', 'tshirt-crew', 'tshirt-crew-outline',
  'shoe-heel', 'bag-personal', 'bag-personal-outline',
  'tag', 'tag-outline', 'tag-multiple', 'tag-multiple-outline',
  'bottle-soda', 'bottle-soda-outline', 'bottle-soda-classic',
  'cup-outline', 'kettle', 'blender-outline',
  'star', 'star-outline', 'heart', 'heart-outline',
  'flower', 'flower-outline', 'leaf', 'leaf-maple',
  'fire', 'lightning-bolt', 'emoticon-happy', 'emoticon-cool',
];

export const CARD_COLORS = [
  '#000000', '#1C1C1E', '#2C2C2E',
  '#D62828', '#F77F00', '#FCBF49',
  '#2B9348', '#007F5F', '#06D6A0',
  '#4361EE', '#4CC9F0', '#118AB2',
  '#7209B7', '#B5179E', '#F72585',
  '#533483', '#3A0CA3', '#E94560',
];

export const INGREDIENT_COLORS = [
  '#FF6B6B', '#A855F7', '#34D399', '#FBBF24', '#7C3AED',
  '#D97706', '#F59E0B', '#FB923C', '#F97316', '#DC2626',
  '#F472B6', '#86EFAC', '#FDE047', '#92400E', '#60A5FA',
  '#818CF8', '#F87171', '#2DD4BF', '#E879F9', '#FCD34D',
  '#6EE7B7', '#93C5FD', '#C084FC', '#FCA5A5', '#FDBA74',
];

export const ICON_COLS = 6;
export const MAX_ICON_BTN = 56;
export const getIconBtnSize = (screenWidth) =>
  Math.min(MAX_ICON_BTN, Math.floor((screenWidth - 32 - (ICON_COLS - 1) * 8) / ICON_COLS));
