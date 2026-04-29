import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  Pressable, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CartSheet({
  visible, onClose, cart, cartTotal, onRemoveItem, onClearCart, onCheckout, theme,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>PEDIDO ACTUAL</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {cart.map((item) => (
              <View key={item.cartId} style={[styles.item, { borderColor: theme.cardBorder }]}>
                <View style={styles.itemLeft}>
                  {item.product.iconName ? (
                    <View style={[styles.itemIcon, { backgroundColor: item.product.iconBgColor || '#000' }]}>
                      <MaterialCommunityIcons name={item.product.iconName} size={18} color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.itemIcon, { backgroundColor: theme.card }]}>
                      <Feather name="package" size={16} color={theme.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.product.name}</Text>
                    <Text style={[styles.itemDetail, { color: theme.textMuted }]}>
                      {item.size?.name} · {item.quantity}x
                      {item.units?.length > 0 ? ` · ${item.units.length} uds` : ''}
                    </Text>
                    {item.note ? (
                      <Text style={[styles.itemNote, { color: theme.textMuted }]}>📝 {item.note}</Text>
                    ) : null}
                    {item.units?.length > 0 && item.units[0]?.ingredients?.length > 0 && (
                      <View style={styles.ingredientDots}>
                        {item.units.flatMap(u => u.ingredients || []).slice(0, 8).map((ing, i) => (
                          <View key={i} style={[styles.ingDot, { backgroundColor: ing.color || '#888' }]} />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>${item.total.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => onRemoveItem(item.cartId)}>
                    <Feather name="trash-2" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textMuted }]}>TOTAL</Text>
              <Text style={[styles.totalAmount, { color: theme.text }]}>${cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: theme.cardBorder }]}
                onPress={onClearCart}
              >
                <Text style={[styles.clearText, { color: theme.textMuted }]}>Vaciar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkoutBtn, { backgroundColor: theme.accent, flex: 1 }]}
                onPress={onCheckout}
              >
                <Text style={[styles.checkoutText, { color: theme.accentText }]}>COBRAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 14, fontWeight: '900', letterSpacing: 3 },
  list: { paddingHorizontal: 20, maxHeight: 400 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  itemLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  itemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemDetail: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  itemNote: { fontSize: 11, fontWeight: '500', marginTop: 4, fontStyle: 'italic' },
  ingredientDots: { flexDirection: 'row', gap: 4, marginTop: 6 },
  ingDot: { width: 10, height: 10, borderRadius: 5 },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemPrice: { fontSize: 15, fontWeight: '900' },
  footer: { padding: 20, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  totalAmount: { fontSize: 32, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 10 },
  clearBtn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1 },
  clearText: { fontSize: 14, fontWeight: '700' },
  checkoutBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  checkoutText: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
