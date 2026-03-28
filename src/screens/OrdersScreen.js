import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'new', label: 'Nuevos' },
  { key: 'processing', label: 'En proceso' },
  { key: 'done', label: 'Listos' },
];

const STATUS = {
  new: { label: 'NUEVO', color: '#F77F00', next: 'processing', nextLabel: 'Iniciar' },
  processing: { label: 'EN PROCESO', color: '#4361EE', next: 'done', nextLabel: 'Listo' },
  done: { label: 'LISTO', color: '#2B9348', next: null, nextLabel: null },
};

function OrderCard({ sale, theme, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (sale.orderStatus === 'processing' && sale.processingStartedAt) {
      const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(sale.processingStartedAt)) / 1000);
        const m = Math.floor(diff / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        setElapsed(`${m}:${s}`);
      }, 1000);
      return () => clearInterval(interval);
    }
    if (sale.orderStatus === 'done' && sale.processingStartedAt && sale.completedAt) {
      const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }
  }, [sale.orderStatus, sale.processingStartedAt]);

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.spring(anim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      tension: 80, friction: 12,
    }).start();
  };

  const status = STATUS[sale.orderStatus] || STATUS.new;

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

      {/* Status bar top */}
      <View style={[styles.cardStatusBar, { backgroundColor: status.color }]} />

      <TouchableOpacity
        style={styles.cardMain}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        {/* Header de la card */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardOrder, { color: theme.textMuted }]}>
              #{sale.orderNumber || sale.id?.slice(-4)}
            </Text>
            <Text style={[styles.cardProduct, { color: theme.text }]} numberOfLines={1}>
              {sale.productName}
            </Text>
            <Text style={[styles.cardSub, { color: theme.textMuted }]}>
              {sale.size} · {sale.quantity}x · {sale.workerName}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusPill, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
              <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
            </View>
            {elapsed ? (
              <Text style={[styles.elapsed, { color: sale.orderStatus === 'processing' ? status.color : theme.textMuted }]}>
                ⏱ {elapsed}
              </Text>
            ) : null}
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.textMuted}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        {/* Extras resumidos siempre visibles */}
        {sale.toppings?.length > 0 && !expanded && (
          <Text style={[styles.cardToppings, { color: theme.textMuted }]} numberOfLines={1}>
            + {sale.toppings.join(', ')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Detalle expandible */}
      {expanded && (
        <View style={[styles.cardDetail, { borderTopColor: theme.cardBorder }]}>

          {/* Unidades con componentes */}
          {sale.units?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>UNIDADES</Text>
              {sale.units.map((unit, i) => (
                <View key={i} style={[styles.unitRow, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.unitNum, { color: theme.textMuted }]}>{i + 1}</Text>
                  <View style={styles.unitInfo}>
                    {unit.flavors?.length > 0 && (
                      <View style={styles.flavorsRow}>
                        {unit.flavors.map((f, fi) => (
                          <View key={fi} style={[styles.flavorDot, { backgroundColor: f.color || '#888' }]}>
                            <Text style={styles.flavorDotText}>{f.name}</Text>
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
                </View>
              ))}
            </View>
          )}

          {/* Extras sin unidades */}
          {(!sale.units?.length) && sale.toppings?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>EXTRAS</Text>
              <View style={styles.toppingsWrap}>
                {sale.toppings.map((t, i) => (
                  <View key={i} style={[styles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.toppingChipText, { color: theme.text }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Nota */}
          {sale.note && (
            <View style={[styles.noteBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
              <Feather name="file-text" size={13} color={theme.textMuted} />
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>{sale.note}</Text>
            </View>
          )}

          {/* Tiempo completado */}
          {sale.orderStatus === 'done' && elapsed && (
            <View style={styles.doneTime}>
              <MaterialCommunityIcons name="clock-check-outline" size={14} color={STATUS.done.color} />
              <Text style={[styles.doneTimeText, { color: STATUS.done.color }]}>
                Completado en {elapsed}
              </Text>
            </View>
          )}

          {/* Botón de acción */}
          {status.next && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: STATUS[status.next].color }]}
              onPress={() => onStatusChange(sale.id, status.next)}
            >
              <Text style={styles.actionBtnText}>
                {status.nextLabel} →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botón rápido si está cerrado */}
      {!expanded && status.next && (
        <TouchableOpacity
          style={[styles.quickAction, { borderTopColor: theme.cardBorder, backgroundColor: theme.bg }]}
          onPress={() => onStatusChange(sale.id, status.next)}
        >
          <Text style={[styles.quickActionText, { color: status.color }]}>
            {status.nextLabel} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { getTodaySales, updateSaleStatus } = useApp();
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');

  const sales = getTodaySales().reverse();
  const filtered = filter === 'all' ? sales : sales.filter(s => (s.orderStatus || 'new') === filter);

  const counts = {
    all: sales.length,
    new: sales.filter(s => (s.orderStatus || 'new') === 'new').length,
    processing: sales.filter(s => s.orderStatus === 'processing').length,
    done: sales.filter(s => s.orderStatus === 'done').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>COMANDAS</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.countText, { color: theme.textMuted }]}>{sales.length} hoy</Text>
        </View>
      </View>

      {/* FILTROS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
              filter === f.key && { backgroundColor: theme.accent, borderColor: theme.accent },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[
              styles.filterText,
              { color: theme.textSecondary },
              filter === f.key && { color: theme.accentText },
            ]}>
              {f.label}
            </Text>
            {counts[f.key] > 0 && (
              <View style={[
                styles.filterCount,
                { backgroundColor: filter === f.key ? 'rgba(255,255,255,0.2)' : theme.bg },
              ]}>
                <Text style={[
                  styles.filterCountText,
                  { color: filter === f.key ? theme.accentText : theme.textMuted },
                ]}>
                  {counts[f.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* LISTA */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {filter === 'all' ? 'Sin pedidos hoy' : 'Sin pedidos en este estado'}
            </Text>
          </View>
        ) : (
          filtered.map(sale => (
            <OrderCard
              key={sale.id}
              sale={sale}
              theme={theme}
              onStatusChange={updateSaleStatus}
            />
          ))
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
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3 },
  countBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  countText: { fontSize: 12, fontWeight: '600' },
  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: '700' },
  filterCount: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  filterCountText: { fontSize: 11, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardStatusBar: { height: 4 },
  cardMain: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
  cardOrder: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cardProduct: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusPill: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1,
  },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  elapsed: { fontSize: 12, fontWeight: '700' },
  cardToppings: { fontSize: 12, fontWeight: '500', marginTop: 8 },
  cardDetail: { borderTopWidth: 1, padding: 16, gap: 12 },
  detailSection: { gap: 8 },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  unitRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  unitNum: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  unitInfo: { flex: 1, gap: 4 },
  flavorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flavorDot: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  flavorDotText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  unitToppings: { fontSize: 12, fontWeight: '500' },
  unitNote: { fontSize: 12, fontWeight: '500', fontStyle: 'italic' },
  toppingsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toppingChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  toppingChipText: { fontSize: 12, fontWeight: '600' },
  noteBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  noteText: { fontSize: 13, fontWeight: '500', flex: 1 },
  doneTime: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneTimeText: { fontSize: 12, fontWeight: '700' },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  quickAction: { borderTopWidth: 1, paddingVertical: 12, alignItems: 'center' },
  quickActionText: { fontSize: 13, fontWeight: '700' },
});