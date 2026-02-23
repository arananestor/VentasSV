import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const PRODUCT_EMOJIS = {
  minuta: '🍧',
  fresas: '🍓',
  chocobanano: '🍌',
  sorbete: '🍦',
};

export default function ProductSticker({ type, customImage, size = 80 }) {
  if (customImage) {
    return (
      <Image
        source={{ uri: customImage }}
        style={[styles.image, { width: size, height: size, borderRadius: size * 0.18 }]}
      />
    );
  }

  const emoji = PRODUCT_EMOJIS[type];
  if (emoji) {
    return (
      <View style={[styles.emojiContainer, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size * 0.18 }]}>
      <Text style={styles.placeholderText}>+</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#555',
    fontSize: 28,
    fontWeight: '300',
  },
});