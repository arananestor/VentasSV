export const ICON_CATALOG = [
  {
    category: 'Comida',
    icons: [
      'food', 'food-variant', 'food-drumstick', 'food-steak', 'food-hot-dog',
      'food-turkey', 'hamburger', 'french-fries', 'pizza', 'taco',
      'noodles', 'pasta', 'rice', 'egg', 'egg-fried',
      'fish', 'pot-steam', 'grill', 'silverware', 'silverware-fork-knife',
      'food-outline', 'food-fork-drink', 'food-takeout-box', 'food-takeout-box-outline',
    ],
  },
  {
    category: 'Bebidas',
    icons: [
      'coffee', 'coffee-to-go', 'tea', 'cup', 'cup-water',
      'cup-outline', 'beer', 'beer-outline', 'bottle-wine', 'glass-wine',
      'bottle-soda', 'bottle-soda-outline', 'bottle-soda-classic', 'kettle', 'blender',
      'blender-outline', 'glass-mug', 'glass-mug-variant', 'water', 'water-outline',
    ],
  },
  {
    category: 'Panadería y Postres',
    icons: [
      'bread-slice', 'cake', 'cake-layered', 'cake-variant', 'cookie',
      'cupcake', 'muffin', 'candy', 'candycane', 'pretzel',
      'ice-cream', 'ice-pop', 'food-croissant', 'cookie-outline', 'cookie-edit',
      'candy-outline', 'cake-variant-outline', 'ice-cream-off', 'food-drumstick-outline', 'baguette',
    ],
  },
  {
    category: 'Frutas y Verduras',
    icons: [
      'fruit-watermelon', 'fruit-cherries', 'fruit-citrus', 'fruit-grapes', 'fruit-pineapple',
      'fruit-pear', 'food-apple', 'food-apple-outline', 'mushroom', 'carrot',
      'corn', 'chili-mild', 'chili-hot', 'leaf', 'sprout',
      'tree', 'flower-tulip', 'seed', 'seed-outline', 'grain',
    ],
  },
  {
    category: 'Ropa y Accesorios',
    icons: [
      'tshirt-crew', 'tshirt-crew-outline', 'hanger', 'shoe-heel', 'shoe-sneaker',
      'hat-fedora', 'glasses', 'watch', 'ring', 'necklace',
      'bag-personal', 'bag-personal-outline', 'shopping', 'shopping-outline', 'purse',
      'wallet', 'bow-tie', 'sunglasses', 'crown', 'diamond-stone',
    ],
  },
  {
    category: 'Hogar y Ferretería',
    icons: [
      'hammer', 'wrench', 'screwdriver', 'saw-blade', 'tape-measure',
      'format-paint', 'lightbulb', 'lightbulb-outline', 'lamp', 'fan',
      'toilet', 'shower', 'faucet', 'door', 'window-closed',
      'chair-rolling', 'table-furniture', 'sofa', 'bed', 'toolbox',
    ],
  },
  {
    category: 'Salud y Belleza',
    icons: [
      'pill', 'medical-bag', 'stethoscope', 'bandage', 'thermometer',
      'scissors-cutting', 'hair-dryer', 'spray', 'mirror', 'lotion',
      'lipstick', 'nail', 'eye', 'hand-wash', 'tooth',
      'face-woman', 'face-man', 'heart-pulse', 'spa', 'scale-bathroom',
    ],
  },
  {
    category: 'Tecnología',
    icons: [
      'cellphone', 'laptop', 'tablet', 'monitor', 'keyboard',
      'mouse', 'headphones', 'speaker', 'camera', 'printer',
      'usb', 'wifi', 'bluetooth', 'battery', 'chip',
      'memory', 'router', 'television', 'gamepad-variant', 'phone-classic',
    ],
  },
  {
    category: 'Papelería y Oficina',
    icons: [
      'pencil', 'pen', 'notebook', 'book-open-variant', 'clipboard',
      'file-document', 'folder', 'paperclip', 'ruler', 'calculator',
      'briefcase', 'calendar', 'clock', 'desk-lamp', 'eraser',
      'magnify', 'pin', 'content-paste', 'note-text', 'chart-bar',
    ],
  },
  {
    category: 'Autos y Transporte',
    icons: [
      'car', 'car-outline', 'motorbike', 'bicycle', 'bus',
      'truck', 'gas-station', 'engine', 'tire', 'oil',
      'car-battery', 'car-wash', 'steering', 'speedometer', 'traffic-light',
      'road', 'parking', 'garage', 'tow-truck', 'car-wrench',
    ],
  },
  {
    category: 'Varios',
    icons: [
      'star', 'star-outline', 'heart', 'heart-outline', 'flower',
      'flower-outline', 'leaf-maple', 'fire', 'lightning-bolt', 'emoticon-happy',
      'emoticon-cool', 'gift', 'trophy', 'flag', 'puzzle',
      'music', 'paw', 'earth', 'rocket', 'shield',
    ],
  },
];

// Compatibility alias — flat array of all icons
export const FOOD_ICONS = ICON_CATALOG.flatMap(c => c.icons);

export function searchIcons(query) {
  if (!query || !query.trim()) return ICON_CATALOG;
  const q = query.trim().toLowerCase();
  return ICON_CATALOG
    .map(c => ({ category: c.category, icons: c.icons.filter(i => i.toLowerCase().includes(q)) }))
    .filter(c => c.icons.length > 0);
}

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

// deprecated: use getIconCols(screenWidth) for dynamic column count
export const ICON_COLS = 6;
export const MAX_ICON_BTN = 56;
const ICON_MARGIN = 4; // margin per side on each button
const GRID_PAD = 8; // paddingHorizontal of the icon grid container

export const getIconCols = (screenWidth) =>
  Math.max(4, Math.floor((screenWidth - GRID_PAD * 2) / (MAX_ICON_BTN + ICON_MARGIN * 2)));

export const getIconBtnSize = (screenWidth) => {
  const cols = getIconCols(screenWidth);
  return Math.min(MAX_ICON_BTN, Math.floor((screenWidth - GRID_PAD * 2 - cols * ICON_MARGIN * 2) / cols));
};
