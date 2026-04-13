import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { printTicket, shareTicket } from '../utils/ticketPrinter';
import {
  loadWhatsAppNumber, loadBankConfig,
  buildTicketMessage, buildTransferMessage,
} from '../utils/businessConfig';
import { formatDate, formatTime, methodLabel } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import InfoCard from '../components/InfoCard';
import ScreenHeader from '../components/ScreenHeader';
import Divider from '../components/Divider';

const SHARE_COLOR = '#0A84FF';
const WA_COLOR = '#25D366';
const MAPS_KEY = Constants.expoConfig?.extra?.googleMapsKey;

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params;
  const { theme } = useTheme();

  const [activeBtn, setActiveBtn] = useState(null);
  const [waNumber, setWaNumber] = useState(null);
  const [bankConfig, setBankConfig] = useState(null);

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

  const handleOpenMap = () => {
    if (!sale.geo?.latitude) return;
    const { latitude, longitude } = sale.geo;
    const label = encodeURIComponent(`Pedido ${sale.orderNumber || sale.id.slice(-4)}`);
    const uri = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    Linking.openURL(uri).catch(() => {
      Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
    });
  };

  const payMethodLabel = methodLabel(sale.paymentMethod);

  const orderDisplay = sale.orderNumber ? `#${sale.orderNumber}` : `#${sale.id.slice(-4)}`;
  const hasGeo = sale.geo?.latitude != null;

  const mapPreviewUrl = hasGeo
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${sale.geo.latitude},${sale.geo.longitude}&zoom=15&size=600x300&scale=2&markers=color:red%7C${sale.geo.latitude},${sale.geo.longitude}&key=${MAPS_KEY}`
    : null;

  const btnStyle = (key, color) => ({
    backgroundColor: activeBtn === key ? color : 'transparent',
    borderColor: color,
  });
  const btnTextColor = (key, color) => activeBtn === key ? '#fff' : color;
  const btnIconColor = (key, color) => activeBtn === key ? '#fff' : color;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="DETALLE" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.amountSection}>
          <Text style={[styles.orderNumber, { color: theme.textMuted }]}>{orderDisplay}</Text>
          <Text style={[styles.amount, { color: theme.text }]}>${sale.total.toFixed(2)}</Text>
          <View style={{ marginTop: 12 }}>
            <StatusBadge label="COMPLETADA" color={theme.success} />
          </View>
        </View>

        <View style={styles.infoGrid}>
          {[
            { label: 'FECHA', value: formatDate(sale.timestamp) },
            { label: 'HORA', value: formatTime(sale.timestamp) },
            { label: 'MÉTODO', value: payMethodLabel },
            { label: 'CAJERO', value: sale.workerName || '—' },
          ].map((item, i) => (
            <InfoCard key={i} label={item.label} value={item.value} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PRODUCTO</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.productName, { color: theme.text }]}>{sale.productName}</Text>
          <Divider />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Tamaño</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{sale.size}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Cantidad</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{sale.quantity}x</Text>
          </View>

          {/* Nota general del pedido */}
          {sale.note ? (
            <View style={[styles.noteBox, { backgroundColor: '#FFF9C4', borderColor: '#F9A825', marginTop: 12 }]}>
              <Text style={styles.noteBoxText}>📝 {sale.note}</Text>
            </View>
          ) : null}

          {/* Unidades con detalle completo */}
          {sale.units?.length > 0 && (
            <>
              <Divider spacing={12} />
              <Text style={[styles.unitsLabel, { color: theme.textMuted }]}>UNIDADES</Text>
              {sale.units.map((unit, i) => {
                const unitIngredients = unit.ingredients || unit.flavors || [];
                const unitExtras = unit.extras || unit.toppings || [];
                return (
                  <View key={i} style={[styles.unitCard, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    {/* Header de unidad */}
                    <View style={styles.unitCardHeader}>
                      <View style={[styles.unitBadge, { backgroundColor: theme.accent }]}>
                        <Text style={styles.unitBadgeText}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.unitTitle, { color: theme.text }]}>Unidad {i + 1}</Text>
                      {unit.sizeName ? (
                        <View style={[styles.unitSizeTag, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                          <Text style={[styles.unitSizeText, { color: theme.textMuted }]}>{unit.sizeName}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Ingredientes con colores e íconos */}
                    {unitIngredients.length > 0 && (
                      <View style={styles.unitSection}>
                        <Text style={[styles.unitSectionLabel, { color: theme.textMuted }]}>INGREDIENTES</Text>
                        <View style={styles.chipRow}>
                          {unitIngredients.map((f, fi) => (
                            <View key={fi} style={[styles.ingredientChip, { backgroundColor: f.color || '#888' }]}>
                              {f.icon ? (
                                <MaterialCommunityIcons name={f.icon} size={11} color="#fff" />
                              ) : null}
                              <Text style={styles.ingredientChipText}>{f.name || f}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Extras con colores */}
                    {unitExtras.length > 0 && (
                      <View style={styles.unitSection}>
                        <Text style={[styles.unitSectionLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                        <View style={styles.chipRow}>
                          {unitExtras.map((t, ti) => (
                            <View key={ti} style={[styles.extraChip, {
                              backgroundColor: (t.color || theme.accent) + '22',
                              borderColor: t.color || theme.cardBorder,
                            }]}>
                              <Text style={[styles.extraChipText, { color: theme.text }]}>{t.name || t}</Text>
                              {t.price > 0 ? (
                                <Text style={[styles.extraChipPrice, { color: theme.textMuted }]}>+${t.price.toFixed(2)}</Text>
                              ) : null}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Nota de la unidad */}
                    {unit.note ? (
                      <View style={[styles.unitNoteBox, { backgroundColor: '#FFF9C4', borderColor: '#F9A825' }]}>
                        <Text style={styles.unitNoteText}>📝 {unit.note}</Text>
                      </View>
                    ) : null}

                    {/* Sin personalización */}
                    {!unitIngredients.length && !unitExtras.length && !unit.note && (
                      <Text style={[styles.unitEmpty, { color: theme.textMuted }]}>Sin personalización</Text>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

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

        {sale.voucherImage && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>COMPROBANTE</Text>
            <Image source={{ uri: sale.voucherImage }} style={styles.voucherImg} />
          </>
        )}

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

        {hasGeo && (
          <TouchableOpacity style={styles.mapCard} onPress={handleOpenMap} activeOpacity={0.92}>
            <Image source={{ uri: mapPreviewUrl }} style={styles.mapImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        <View style={[styles.idSection, { borderColor: theme.cardBorder }]}>
          <Text style={[styles.idValue, { color: theme.textMuted }]}>{sale.id}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  amountSection: { alignItems: 'center', paddingVertical: 30 },
  orderNumber: { fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  amount: { fontSize: 52, fontWeight: '900' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 24, marginBottom: 10 },
  card: { borderRadius: 16, padding: 18, borderWidth: 1 },
  productName: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 13, fontWeight: '700' },
  noteBox: { borderRadius: 10, padding: 10, borderWidth: 1 },
  noteBoxText: { fontSize: 13, fontWeight: '600', color: '#5D4037' },
  unitsLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 12, marginBottom: 8 },
  unitCard: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 8 },
  unitCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  unitBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unitBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  unitTitle: { fontSize: 13, fontWeight: '800', flex: 1 },
  unitSizeTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  unitSizeText: { fontSize: 10, fontWeight: '700' },
  unitSection: { marginBottom: 8 },
  unitSectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingredientChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  ingredientChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  extraChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  extraChipText: { fontSize: 12, fontWeight: '600' },
  extraChipPrice: { fontSize: 10, fontWeight: '600' },
  unitNoteBox: { borderRadius: 8, padding: 8, borderWidth: 1, marginTop: 4 },
  unitNoteText: { fontSize: 12, fontWeight: '600', color: '#5D4037' },
  unitEmpty: { fontSize: 12, fontWeight: '500', fontStyle: 'italic', paddingVertical: 4 },
  voucherImg: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, gap: 6,
  },
  actionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  mapCard: { marginTop: 28, borderRadius: 18, overflow: 'hidden', height: 200 },
  mapImage: { width: '100%', height: '100%' },
  idSection: { alignItems: 'center', marginTop: 24, paddingVertical: 16, borderTopWidth: 1 },
  idValue: { fontSize: 10, fontWeight: '500', color: '#999' },
});