const React = require('react');
const { Text } = require('react-native');

const createIconSet = () => {
  const Icon = ({ name, size, color, style }) =>
    React.createElement(Text, { style: [{ fontSize: size, color }, style] }, name);
  return Icon;
};

const Feather = createIconSet();
const MaterialCommunityIcons = createIconSet();
const Ionicons = createIconSet();
const AntDesign = createIconSet();
const FontAwesome = createIconSet();

module.exports = { Feather, MaterialCommunityIcons, Ionicons, AntDesign, FontAwesome };
