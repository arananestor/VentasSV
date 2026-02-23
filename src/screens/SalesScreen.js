import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function SalesScreen({ navigation }) {
  const { getTodaySales } = useApp();
  const sales = getTodaySales().reverse();
  const total = sales.reduce((sum, s) => sum + s.total, 0);
  const cashSales = sales.filter(s => s.paymentMethod === 'cash');
  const cardSales = sales.filter(s => s.paymentMethod === 'card');
  const cashTotal = cashSales.reduce((sum, s) => sum + s.total, 0);
  const cardTotal = cardSales.reduce((sum, s) => sum + s.total, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VENTAS HOY</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.summaryRow}>
        <TouchableOpacity style={styles.summaryMain} activeOpacity={0.8}>
          <Text style={styles.summaryLabel}>TOTAL</Text>
          <Text style={styles.summaryAmount}>${total.toFixed(2)}</Text>
          <Text style={styles.summaryCount}>{sales.length} ventas</Text>
        </TouchableOpacity>
        <View style={styles.summaryCol}>
          <TouchableOpacity style={styles.summaryMini} activeOpacity={0.8}>
            <Text style={styles.miniEmoji}>💵</Text>
            <View>
              <Text style={styles.miniAmount}>${cashTotal.toFixed(2)}</Text>
              <Text style={styles.miniCount}>{cashSales.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryMini} activeOpacity={0.8}>
            <Text style={styles.miniEmoji}>💳</Text>
            <View>
              <Text style={styles.miniAmount}>${cardTotal.toFixed(2)}</Text>
              <Text style={styles.miniCount}>{cardSales.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sales.map((sale, index) => (
          <TouchableOpacity
            key={sale.id}
            style={styles.saleRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SaleDetail', { sale })}
          >
            <View style={styles.saleLeft}>
              <View style={styles.saleNumber}>
                <Text style={styles.saleNumberText}>#{sales.length - index}</Text>
              </View>
              <View>
                <Text style={styles.saleName}>{sale.productName}</Text>
                <Text style={styles.saleDetail}>
                  {sale.size} · {sale.quantity}x · {sale.paymentMethod === 'cash' ? '💵' : '💳'}
                </Text>
              </View>
            </View>
            <View style={styles.saleRight}>
              <Text style={styles.saleAmount}>${sale.total.toFixed(2)}</Text>
              <Text style={styles.saleChevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
        {sales.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Sin ventas aún</Text>
            <Text style={styles.emptySub}>Las ventas del día aparecerán aquí</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  backText: { color: '#FFF', fontSize: 24, fontWeight: '300', marginTop: -2 },
  headerTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  summaryRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 10, marginTop: 8, marginBottom: 20,
  },
  summaryMain: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 20,
  },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: '#999', letterSpacing: 2 },
  summaryAmount: { fontSize: 34, fontWeight: '900', color: '#000', marginTop: 4 },
  summaryCount: { fontSize: 12, fontWeight: '600', color: '#999', marginTop: 4 },
  summaryCol: { gap: 10 },
  summaryMini: {
    flex: 1, backgroundColor: '#111', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#222', minWidth: 120,
  },
  miniEmoji: { fontSize: 18 },
  miniAmount: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  miniCount: { fontSize: 10, fontWeight: '600', color: '#555' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  saleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderColor: '#151515',
  },
  saleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saleNumber: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
  },
  saleNumberText: { fontSize: 11, fontWeight: '800', color: '#444' },
  saleName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  saleDetail: { fontSize: 12, color: '#555', fontWeight: '600', marginTop: 2 },
  saleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saleAmount: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  saleChevron: { fontSize: 20, color: '#444', fontWeight: '300' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#333' },
  emptySub: { fontSize: 13, color: '#222', marginTop: 6, fontWeight: '600' },
});