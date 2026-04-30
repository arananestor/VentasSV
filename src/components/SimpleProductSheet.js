import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  Pressable, StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveProductPrice } from '../utils/modeResolution';

export default function SimpleProductSheet({
  visible, onClose, product, currentMode, onAddToCart, theme,
}) {
  const [sizeQuantities, setSizeQuantities] = useState({});

  useEffect(() => {
    if (product) {
      const init = {};
      product.sizes.forEach((_, i) => { init[i] = 0; });
      setSizeQuantities(init);
    }
  }, [product]);

  const adjustSize = (sizeIdx, delta) => {
    setSizeQuantities(prev => ({
      ...prev,
      [sizeIdx]: Math.max(0, (prev[sizeIdx] || 0) + delta),
    }));
  };

  const simpleTotal = product
    ? product.sizes.reduce((sum, s, i) => sum + resolveProductPrice(product, i, currentMode) * (sizeQuantities[i] || 0), 0)
    : 0;
  const simpleHasItems = Object.values(sizeQuantities).some(q => q > 0);

  const handleConfirm = () => {
    if (!product) return;
    product.sizes.forEach((size, i) => {
      const qty = sizeQuantities[i] || 0;
      if (qty > 0) {
        const resolvedPrice = resolveProductPrice(product, i, currentMode);
        onAddToCart({
          product,
          size,
          quantity: qty,
          units: [],
          extras: [],
          note: '',
          total: resolvedPrice * qty,
        });
      }
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          {product && (
            <>
              <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
              <View style={styles.header}>
                {product.iconName ? (
                  <View style={[styles.iconWrap, { backgroundColor: product.iconBgColor || '#000' }]}>
                    <MaterialCommunityIcons name={product.iconName} size={26} color="#fff" />
                  </View>
                ) : null}
                <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
              </View>
              <View style={styles.sizeRows}>
                {product.sizes.map((s, i) => {
                  const qty = sizeQuantities[i] || 0;
                  const active = qty > 0;
                  return (
                    <View key={i} style={[styles.sizeRow, {
                      backgroundColor: active ? theme.card : theme.bg,
                      borderColor: active ? theme.accent : theme.cardBorder,
                    }]}>
                      <View style={styles.sizeRowInfo}>
                        <Text style={[styles.sizeRowName, { color: theme.text }]}>{s.name || 'Normal'}</Text>
                        <Text style={[styles.sizeRowPrice, { color: theme.textMuted }]}>${resolveProductPrice(product, i, currentMode).toFixed(2)}</Text>
                      </View>
                      <View style={styles.sizeRowCounter}>
                        <TouchableOpacity
                          style={[styles.counterBtn, {
                            backgroundColor: active ? theme.accent : theme.card,
                            borderColor: active ? theme.accent : theme.cardBorder,
                          }]}
                          onPress={() => adjustSize(i, -1)}
                        >
                          <Text style={[styles.counterBtnText, { color: active ? theme.accentText : theme.textMuted }]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.counterNum, { color: active ? theme.text : theme.textMuted }]}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.counterBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                          onPress={() => adjustSize(i, 1)}
                        >
                          <Text style={[styles.counterBtnText, { color: theme.accentText }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: theme.accent },
                  !simpleHasItems && { opacity: 0.3 }]}
                onPress={simpleHasItems ? handleConfirm : undefined}
                activeOpacity={simpleHasItems ? 0.8 : 1}
              >
                <Text style={[styles.confirmText, { color: theme.accentText }]}>Agregar al pedido</Text>
                <Text style={[styles.confirmTotal, { color: theme.accentText }]}>
                  {simpleHasItems ? `$${simpleTotal.toFixed(2)}` : '--'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 20, fontWeight: '900', flex: 1 },
  sizeRows: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  sizeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5,
  },
  sizeRowInfo: { flex: 1 },
  sizeRowName: { fontSize: 16, fontWeight: '700' },
  sizeRowPrice: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  sizeRowCounter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  counterBtnText: { fontSize: 20, fontWeight: '300', lineHeight: 24 },
  counterNum: { fontSize: 20, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  confirmBtn: {
    marginHorizontal: 16, borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24,
    alignItems: 'center',
  },
  confirmText: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  confirmTotal: { fontSize: 20, fontWeight: '900' },
});
