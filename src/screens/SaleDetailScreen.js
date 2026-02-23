import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params;
  const date = new Date(sale.timestamp);

  const formatTime = (d) => {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const formatDate = (d) => {
    const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETALLE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amount}>${sale.total.toFixed(2)}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>COMPLETADA</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>FECHA</Text>
            <Text style={styles.infoValue}>{formatDate(date)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>HORA</Text>
            <Text style={styles.infoValue}>{formatTime(date)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>MÉTODO</Text>
            <Text style={styles.infoValue}>
              {sale.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Tarjeta'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>CAJERO</Text>
            <Text style={styles.infoValue}>{sale.workerName || 'Sin asignar'}</Text>
          </View>
        </View>

        {/* Product Detail */}
        <Text style={styles.sectionLabel}>PRODUCTO</Text>
        <View style={styles.productCard}>
          <Text style={styles.productName}>{sale.productName}</Text>
          <View style={styles.productDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tamaño</Text>
              <Text style={styles.detailValue}>{sale.size}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad</Text>
              <Text style={styles.detailValue}>{sale.quantity}x</Text>
            </View>
            {sale.toppings && sale.toppings.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Extras</Text>
                <Text style={styles.detailValue}>{sale.toppings.join(', ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cash details */}
        {sale.paymentMethod === 'cash' && sale.cashGiven && (
          <View>
            <Text style={styles.sectionLabel}>PAGO EN EFECTIVO</Text>
            <View style={styles.cashCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recibido</Text>
                <Text style={styles.detailValue}>${sale.cashGiven.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vuelto</Text>
                <Text style={styles.detailValue}>${(sale.change || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Voucher */}
        {sale.voucherImage && (
          <View>
            <Text style={styles.sectionLabel}>VOUCHER</Text>
            <Image source={{ uri: sale.voucherImage }} style={styles.voucherImg} />
          </View>
        )}

        {/* Sale ID */}
        <View style={styles.idSection}>
          <Text style={styles.idLabel}>ID</Text>
          <Text style={styles.idValue}>#{sale.id}</Text>
        </View>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  amountSection: { alignItems: 'center', paddingVertical: 30 },
  amount: { fontSize: 52, fontWeight: '900', color: '#FFF' },
  statusBadge: {
    backgroundColor: '#111', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 10,
    borderWidth: 1, borderColor: '#222',
  },
  statusText: { fontSize: 10, fontWeight: '800', color: '#555', letterSpacing: 2 },
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  infoCard: {
    width: '48%', backgroundColor: '#111', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#222',
  },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#555', letterSpacing: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#FFF', marginTop: 6 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#555',
    letterSpacing: 3, marginTop: 24, marginBottom: 10,
  },
  productCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#222',
  },
  productName: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 14 },
  productDetails: { gap: 10 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  cashCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#222', gap: 10,
  },
  voucherImg: {
    width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover',
  },
  idSection: {
    alignItems: 'center', marginTop: 30, paddingVertical: 16,
    borderTopWidth: 1, borderColor: '#151515',
  },
  idLabel: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 2 },
  idValue: { fontSize: 12, fontWeight: '700', color: '#333', marginTop: 4 },
});