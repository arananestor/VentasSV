const React = require('react');
const { View } = require('react-native');

const SafeAreaView = ({ children, style }) =>
  React.createElement(View, { style }, children);

const SafeAreaProvider = ({ children }) =>
  React.createElement(View, null, children);

const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });

module.exports = { SafeAreaView, SafeAreaProvider, useSafeAreaInsets };
