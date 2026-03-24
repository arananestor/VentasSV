import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Image, ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { printTicket, shareTicket } from '../utils/ticketPrinter';
import {
  loadWhatsAppNumber, loadBankConfig,
  buildTicketMessage, buildTransferMessage,
} from '../utils/businessConfig';

const SHARE_COLOR = '#0A84FF';
const WA_COLOR = '#25D366';

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params;
  const { theme } = useTheme();

  const [activeBtn, setActiveBtn] = useState(null);
  const [waNumber, setWaNumber] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);

  const date = new Date(sale.timestamp);

  const formatTime = (d) => {
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (d) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  useEffect(() => {
    (async () => {
      setWaNumber(await loadWhatsAppNumber());
      setBankConfig(await loadBankConfig());
    })();
  }, []);

  const runAction = async (key, fn) => {
    setActiveBtn(key);
    await fn();
    setActiveBtn(null);
  };

  const handlePrint = () => runAction('print', () => printTicket(sale));
  const handleShare = () => runAction('share', () => shareTicket(sale));
  const handleWhatsApp = () => runAction('wa', async () => {
    if (!waNumber) return;
    const message = sale.paymentMethod === 'transfer' && bankConfig
      ? buildTransferMessage(sale, bankConfig)
      : buildTicketMessage(sale);
    Linking.openURL(`https://wa.me/503${waNumber}?text=${message}`);
  });

  const methodLabel = {
    cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta',
  }[sale.paymentMethod] || sale.paymentMethod;

  const orderDisplay = sale.orderNumber ? `#${sale.orderNumber}` : `#${sale.id.slice(-4)}`;

  const btnStyle = (key, color) => ({
    backgroundColor: activeBtn === key ? color : 'transparent',
    borderColor: color,
  });
  const btnTextColor = (key, color) => activeBtn === key ? '#fff' : color;
  const btnIconColor = (key, color) => activeBtn === key ? '#fff' : color;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>DETALLE</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* NÚMERO Y MONTO */}
        <View style={styles.amountSection}>
          <Text style={[styles.orderNumber, { color: theme.textMuted }]}>{orderDisplay}</Text>
          <Text style={[styles.amount, { color: theme.text }]}>${sale.total.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.statusText, { color: theme.textMuted }]}>COMPLETADA</Text>
          </View>
        </View>

        {/* INFO GRID */}
        <View style={styles.infoGrid}>
          {[
            { label: 'FECHA', value: formatDate(date) },
            { label: 'HORA', value: formatTime(date) },
            { label: 'MÉTODO', value: methodLabel },
            { label: 'CAJERO', value: sale.workerName || '—' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* PRODUCTO */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PRODUCTO</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.productName, { color: theme.text }]}>{sale.productName}</Text>
          <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Tamaño</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{sale.size}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Cantidad</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{sale.quantity}x</Text>
          </View>

          {/* Extras/toppings */}
          {sale.toppings?.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Extras</Text>
              <Text style={[styles.detailValue, { color: theme.text, flex: 1, textAlign: 'right' }]}>
                {sale.toppings.join(', ')}
              </Text>
            </View>
          )}

          {/* Unidades con componentes — el detalle clave para cocina */}
          {sale.units?.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginTop: 12 }]} />
              <Text style={[styles.unitsLabel, { color: theme.textMuted }]}>UNIDADES</Text>
              {sale.units.map((unit, i) => (
                <View key={i} style={[styles.unitCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.unitTitle, { color: theme.text }]}>Unidad {i + 1}</Text>
                  {unit.flavors?.length > 0 && (
                    <View style={styles.unitFlavors}>
                      {unit.flavors.map((f, fi) => (
                        <View key={fi} style={[styles.flavorChip, { backgroundColor: f.color || theme.accent }]}>
                          <Text style={styles.flavorChipText}>{f.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {unit.toppings?.length > 0 && (
                    <Text style={[styles.unitToppings, { color: theme.textSecondary }]}>
                      + {unit.toppings.join(', ')}
                    </Text>
                  )}
                  {unit.note ? (
                    <Text style={[styles.unitNote, { color: theme.textMuted }]}>📝 {unit.note}</Text>
                  ) : null}
                </View>
              ))}
            </>
          )}

          {/* Nota general */}
          {sale.note ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.cardBorder, marginTop: 12 }]} />
              <Text style={[styles.noteText, { color: theme.textMuted }]}>📝 {sale.note}</Text>
            </>
          ) : null}
        </View>

        {/* PAGO */}
        {sale.paymentMethod === 'cash' && sale.cashGiven && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PAGO</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Recibido</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>${sale.cashGiven.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Vuelto</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>${(sale.change || 0).toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}

        {/* COMPROBANTE */}
        {sale.voucherImage && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>COMPROBANTE</Text>
            <Image source={{ uri: sale.voucherImage }} style={styles.voucherImg} />
          </>
        )}

        {/* ACCIONES */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>TICKET</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, btnStyle('print', theme.text)]}
            onPress={handlePrint}
            disabled={activeBtn !== null}
          >
            {activeBtn === 'print'
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="printer-outline" size={20} color={btnIconColor('print', theme.text)} />
            }
            <Text style={[styles.actionLabel, { color: btnTextColor('print', theme.text) }]}>Imprimir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, btnStyle('share', SHARE_COLOR)]}
            onPress={handleShare}
            disabled={activeBtn !== null}
          >
            {activeBtn === 'share'
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="share-variant-outline" size={20} color={btnIconColor('share', SHARE_COLOR)} />
            }
            <Text style={[styles.actionLabel, { color: btnTextColor('share', SHARE_COLOR) }]}>Compartir</Text>
          </TouchableOpacity>

          {waNumber && (
            <TouchableOpacity
              style={[styles.actionBtn, btnStyle('wa', WA_COLOR)]}
              onPress={handleWhatsApp}
              disabled={activeBtn !== null}
            >
              {activeBtn === 'wa'
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialCommunityIcons name="whatsapp" size={20} color={btnIconColor('wa', WA_COLOR)} />
              }
              <Text style={[styles.actionLabel, { color: btnTextColor('wa', WA_COLOR) }]}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.idSection, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.idValue, { color: theme.textMuted }]}>{sale.id}</Text>
        </View>

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
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  amountSection: { alignItems: 'center', paddingVertical: 30 },
  orderNumber: { fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  amount: { fontSize: 52, fontWeight: '900' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginTop: 12, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  infoCard: { width: '48%', borderRadius: 14, padding: 16, borderWidth: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  card: { borderRadius: 16, padding: 18, borderWidth: 1 },
  productName: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  divider: { height: 1, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700' },
  unitsLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 12, marginBottom: 8 },
  unitCard: {
    borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8,
  },
  unitTitle: { fontSize: 12, fontWeight: '800', marginBottom: 8 },
  unitFlavors: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  flavorChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  flavorChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  unitToppings: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  unitNote: { fontSize: 12, fontWeight: '500', marginTop: 6, fontStyle: 'italic' },
  noteText: { fontSize: 13, fontWeight: '500', marginTop: 8, fontStyle: 'italic' },
  voucherImg: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, gap: 6,
  },
  actionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  idSection: { alignItems: 'center', marginTop: 30, paddingVertical: 16, borderTopWidth: 1 },
  idValue: { fontSize: 10, fontWeight: '500', color: '#999' },
});