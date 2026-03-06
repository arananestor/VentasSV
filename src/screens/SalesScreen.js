import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function SalesScreen({ navigation }) {
  const { getTodaySales } = useApp();
  const { theme } = useTheme();
  const sales = getTodaySales().reverse();
  const total = sales.reduce((s, v) => s + v.total, 0);
  const cashSales = sales.filter(s => s.paymentMethod === 'cash');
  const cardSales = sales.filter(s => s.paymentMethod === 'card');
  const cashTotal = cashSales.reduce((s, v) => s + v.total, 0);
  const cardTotal = cardSales.reduce((s, v) => s + v.total, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>VENTAS HOY</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryMain, { backgroundColor: theme.accent }]}>
          <Text style={[styles.summaryLabel, { color: theme.mode === 'dark' ? '#999' : '#666' }]}>TOTAL</Text>
          <Text style={[styles.summaryAmount, { color: theme.accentText }]}>${total.toFixed(2)}</Text>
          <Text style={[styles.summaryCount, { color: theme.mode === 'dark' ? '#999' : '#666' }]}>{sales.length} ventas</Text>
        </View>
        <View style={styles.summaryCol}>
          <View style={[styles.summaryMini, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={styles.miniEmoji}>💵</Text>
            <View>
              <Text style={[styles.miniAmount, { color: theme.text }]}>${cashTotal.toFixed(2)}</Text>
              <Text style={[styles.miniCount, { color: theme.textMuted }]}>{cashSales.length}</Text>
            </View>
          </View>
          <View style={[styles.summaryMini, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={styles.miniEmoji}>💳</Text>
            <View>
              <Text style={[styles.miniAmount, { color: theme.text }]}>${cardTotal.toFixed(2)}</Text>
              <Text style={[styles.miniCount, { color: theme.textMuted }]}>{cardSales.length}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sales.map((sale, i) => (
          <TouchableOpacity key={sale.id} style={[styles.saleRow, { borderColor: theme.cardBorder }]}
            activeOpacity={0.7} onPress={() => navigation.navigate('SaleDetail', { sale })}>
            <View style={styles.saleLeft}>
              <View style={[styles.saleNumber, { backgroundColor: theme.card }]}>
                <Text style={[styles.saleNumberText, { color: theme.textMuted }]}>#{sales.length - i}</Text>
              </View>
              <View>
                <Text style={[styles.saleName, { color: theme.text }]}>{sale.productName}</Text>
                <Text style={[styles.saleDetail, { color: theme.textMuted }]}>
                  {sale.size} · {sale.quantity}x · {sale.paymentMethod === 'cash' ? '💵' : '💳'}
                </Text>
              </View>
            </View>
            <View style={styles.saleRight}>
              <Text style={[styles.saleAmount, { color: theme.text }]}>${sale.total.toFixed(2)}</Text>
              <Text style={[styles.saleChevron, { color: theme.textMuted }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
        {sales.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Sin ventas aún</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backText: { fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 8, marginBottom: 20 },
  summaryMain: { flex: 1, borderRadius: 18, padding: 20 },
  summaryLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  summaryAmount: { fontSize: 34, fontWeight: '900', marginTop: 4 },
  summaryCount: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  summaryCol: { gap: 10 },
  summaryMini: {
    flex: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, minWidth: 120,
  },
  miniEmoji: { fontSize: 18 },
  miniAmount: { fontSize: 15, fontWeight: '800' },
  miniCount: { fontSize: 10, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  saleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  saleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saleNumber: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saleNumberText: { fontSize: 11, fontWeight: '800' },
  saleName: { fontSize: 15, fontWeight: '700' },
  saleDetail: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  saleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saleAmount: { fontSize: 18, fontWeight: '900' },
  saleChevron: { fontSize: 20, fontWeight: '300' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '800' },
});