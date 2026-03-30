import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, PanResponder, Dimensions, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const STATUS = {
  new:        { label: 'NUEVOS',     color: '#F77F00' },
  processing: { label: 'EN PROCESO', color: '#4361EE' },
  done:       { label: 'LISTOS',     color: '#2B9348' },
};
const KEYS = ['new', 'processing', 'done'];
const MIN_SECTION = 80;

// ─── TARJETA ────────────────────────────────────────────
function OrderCard({ sale, theme, onMoveToSection, currentSection }) {
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const dragging = useRef(false);

  useEffect(() => {
    if (sale.orderStatus === 'processing' && sale.processingStartedAt) {
      const iv = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(sale.processingStartedAt)) / 1000);
        setElapsed(`${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`);
      }, 1000);
      return () => clearInterval(iv);
    }
    if (sale.orderStatus === 'done' && sale.processingStartedAt && sale.completedAt) {
      const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
      setElapsed(`${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`);
    }
  }, [sale.orderStatus]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 12 || Math.abs(gs.dy) > 12,
    onPanResponderGrant: () => {
      dragging.current = true;
      pan.setOffset({ x: pan.x._value, y: pan.y._value });
      pan.setValue({ x: 0, y: 0 });
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1.06, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start();
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gs) => {
      dragging.current = false;
      pan.flattenOffset();
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, tension: 80, friction: 10 }),
      ]).start();

      // Detectar dirección del swipe para cambiar sección
      const threshold = 60;
      const curIdx = KEYS.indexOf(currentSection);
      if (gs.dx > threshold && curIdx < KEYS.length - 1) {
        onMoveToSection(sale.id, KEYS[curIdx + 1]);
      } else if (gs.dx < -threshold && curIdx > 0) {
        onMoveToSection(sale.id, KEYS[curIdx - 1]);
      } else if (gs.dy < -threshold && curIdx > 0) {
        onMoveToSection(sale.id, KEYS[curIdx - 1]);
      } else if (gs.dy > threshold && curIdx < KEYS.length - 1) {
        onMoveToSection(sale.id, KEYS[curIdx + 1]);
      }
    },
  })).current;

  const status = STATUS[sale.orderStatus] || STATUS.new;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          transform: [...pan.getTranslateTransform(), { scale: cardScale }],
          opacity: cardOpacity,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
          zIndex: dragging.current ? 999 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Franja lateral de color */}
      <View style={[styles.cardStripe, { backgroundColor: status.color }]} />

      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.9}
      >
        {/* Cabecera */}
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardNum, { color: status.color }]}>
              #{sale.orderNumber || sale.id?.slice(-4)}
            </Text>
            <Text style={[styles.cardProduct, { color: theme.text }]} numberOfLines={expanded ? 4 : 1}>
              {sale.productName}
            </Text>
            <Text style={[styles.cardMeta, { color: theme.textMuted }]}>
              {sale.size} · {sale.quantity}x · {sale.workerName}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {elapsed ? (
              <Text style={[styles.cardTimer, { color: sale.orderStatus === 'processing' ? status.color : theme.textMuted }]}>
                ⏱ {elapsed}
              </Text>
            ) : null}
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={theme.textMuted} />
          </View>
        </View>

        {/* Extras resumidos */}
        {!expanded && sale.toppings?.length > 0 && (
          <Text style={[styles.cardExtras, { color: theme.textMuted }]} numberOfLines={1}>
            + {sale.toppings.join(', ')}
          </Text>
        )}

        {/* Detalle expandido */}
        {expanded && (
          <View style={[styles.cardExpanded, { borderTopColor: theme.cardBorder }]}>

            {sale.units?.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={[styles.expandLabel, { color: theme.textMuted }]}>UNIDADES</Text>
                {sale.units.map((unit, i) => (
                  <View key={i} style={[styles.unitRow, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                    <View style={[styles.unitBadge, { backgroundColor: status.color }]}>
                      <Text style={styles.unitBadgeText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      {unit.flavors?.length > 0 && (
                        <View style={styles.flavorsWrap}>
                          {unit.flavors.map((f, fi) => (
                            <View key={fi} style={[styles.flavorChip, { backgroundColor: f.color || '#888' }]}>
                              <Text style={styles.flavorChipText}>{f.name || f}</Text>
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

            {!sale.units?.length && sale.toppings?.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={[styles.expandLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                <View style={styles.toppingsWrap}>
                  {sale.toppings.map((t, i) => (
                    <View key={i} style={[styles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                      <Text style={[{ fontSize: 12, fontWeight: '600', color: theme.text }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {sale.note ? (
              <View style={[styles.noteBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                <Feather name="file-text" size={13} color={theme.textMuted} />
                <Text style={[styles.noteText, { color: theme.textSecondary }]}>{sale.note}</Text>
              </View>
            ) : null}

            {/* Botón de acción */}
            {STATUS[sale.orderStatus]?.next !== undefined && sale.orderStatus !== 'done' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: STATUS[KEYS[KEYS.indexOf(sale.orderStatus) + 1]]?.color }]}
                onPress={() => onMoveToSection(sale.id, KEYS[KEYS.indexOf(sale.orderStatus) + 1])}
              >
                <Text style={styles.actionBtnText}>
                  {sale.orderStatus === 'new' ? 'Iniciar preparación →' : 'Marcar como listo →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── TARJETA COMPRIMIDA (listos) ──────────────────────────
function CompactCard({ sale, theme }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      <View style={[styles.compactStripe, { backgroundColor: STATUS.done.color }]} />
      <View style={styles.compactBody}>
        <View style={styles.compactRow}>
          <Text style={[styles.compactNum, { color: STATUS.done.color }]}>
            #{sale.orderNumber || sale.id?.slice(-4)}
          </Text>
          <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>
            {sale.productName}
          </Text>
          <Text style={[styles.compactMeta, { color: theme.textMuted }]}>
            {sale.quantity}x
          </Text>
          {sale.processingStartedAt && sale.completedAt && (() => {
            const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
            return (
              <Text style={[styles.compactTimer, { color: STATUS.done.color }]}>
                {Math.floor(diff/60).toString().padStart(2,'0')}:{(diff%60).toString().padStart(2,'0')}
              </Text>
            );
          })()}
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={theme.textMuted} />
        </View>
        {expanded && sale.toppings?.length > 0 && (
          <Text style={[{ fontSize: 11, color: theme.textMuted, marginTop: 4, paddingLeft: 2 }]}>
            + {sale.toppings.join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── BARRA DIVISORA ARTICULADA ────────────────────────────
function DividerBar({ label, color, theme, isLandscape, onDrag }) {
  const pan = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { isDragging.current = true; },
    onPanResponderMove: (_, gs) => {
      const delta = isLandscape ? gs.dx : gs.dy;
      onDrag(delta);
    },
    onPanResponderRelease: () => { isDragging.current = false; },
  })).current;

  return (
    <View
      style={[
        styles.dividerBar,
        isLandscape ? styles.dividerBarVertical : styles.dividerBarHorizontal,
        { backgroundColor: color + '22', borderColor: color + '55' },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.dividerGrip, { backgroundColor: color }]}>
        <MaterialCommunityIcons
          name={isLandscape ? 'drag-vertical' : 'drag-horizontal'}
          size={16}
          color="#fff"
        />
      </View>
      <Text style={[styles.dividerLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ── SCREEN PRINCIPAL ─────────────────────────────────────
export default function OrdersScreen() {
  const { getTodaySales, updateSaleStatus } = useApp();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const sales = getTodaySales().reverse();
  const newOrders = sales.filter(s => (s.orderStatus || 'new') === 'new');
  const processingOrders = sales.filter(s => s.orderStatus === 'processing');
  const doneOrders = sales.filter(s => s.orderStatus === 'done');

  // Tamaños de sección ajustables
  const totalSpace = isLandscape ? width : height * 0.75;
  const defaultSize = Math.floor(totalSpace / 3);
  const [sizes, setSizes] = useState([defaultSize, defaultSize, defaultSize]);

  const adjustSize = (barIndex, delta) => {
    setSizes(prev => {
      const next = [...prev];
      const a = next[barIndex];
      const b = next[barIndex + 1];
      const newA = Math.max(MIN_SECTION, a + delta);
      const newB = Math.max(MIN_SECTION, b - delta);
      if (newA + newB === a + b) {
        next[barIndex] = newA;
        next[barIndex + 1] = newB;
      }
      return next;
    });
  };

  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollToSection = (idx) => {
    setActiveIdx(idx);
    sectionRefs.current[KEYS[idx]]?.measureLayout(
      scrollRef.current,
      (_, y) => scrollRef.current?.scrollTo({ y: y - 56, animated: true }),
      () => {}
    );
  };

  const handleMoveToSection = (saleId, newStatus) => {
    updateSaleStatus(saleId, newStatus);
  };

  const renderSection = (key, orders, sectionSize) => {
    const status = STATUS[key];
    const isDone = key === 'done';

    return (
      <View
        key={key}
        ref={ref => sectionRefs.current[key] = ref}
        style={[
          styles.section,
          isLandscape
            ? { width: sectionSize, minHeight: '100%' }
            : { minHeight: sectionSize },
        ]}
      >
        {orders.length === 0 ? (
          <View style={[styles.emptySection, { borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={28} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {key === 'new' ? 'Sin pedidos nuevos' : key === 'processing' ? 'Nada en proceso' : 'Ninguno listo'}
            </Text>
          </View>
        ) : isDone ? (
          orders.map(sale => (
            <CompactCard key={sale.id} sale={sale} theme={theme} />
          ))
        ) : (
          orders.map(sale => (
            <OrderCard
              key={sale.id}
              sale={sale}
              theme={theme}
              currentSection={key}
              onMoveToSection={handleMoveToSection}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>PEDIDOS</Text>
        <View style={styles.headerIndex}>
          {KEYS.map((key, i) => {
            const count = key === 'new' ? newOrders.length
              : key === 'processing' ? processingOrders.length
              : doneOrders.length;
            const isActive = activeIdx === i;
            return (
              <TouchableOpacity key={key} style={styles.indexBtn} onPress={() => scrollToSection(i)}>
                <Text style={[styles.indexText, { color: isActive ? theme.text : theme.textMuted }]}>
                  {STATUS[key].label}
                  {count > 0 ? ` · ${count}` : ''}
                </Text>
                {isActive && <View style={[styles.indexLine, { backgroundColor: STATUS[key].color }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* HINT */}
      {(newOrders.length > 0 || processingOrders.length > 0) && (
        <View style={[styles.hint, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
          <MaterialCommunityIcons name="gesture-swipe-horizontal" size={13} color={theme.textMuted} />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>
            Deslizá la tarjeta para cambiar estado · Arrastrá la barra para redimensionar
          </Text>
        </View>
      )}

      {/* CONTENIDO */}
      {isLandscape ? (
        // ── LANDSCAPE: columnas lado a lado ──
        <ScrollView
          horizontal={false}
          ref={scrollRef}
          contentContainerStyle={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.landscapeContainer}>
            {renderSection('new', newOrders, sizes[0])}
            <DividerBar
              label={STATUS.processing.label}
              color={STATUS.processing.color}
              theme={theme}
              isLandscape={true}
              onDrag={delta => adjustSize(0, delta)}
            />
            {renderSection('processing', processingOrders, sizes[1])}
            <DividerBar
              label={STATUS.done.label}
              color={STATUS.done.color}
              theme={theme}
              isLandscape={true}
              onDrag={delta => adjustSize(1, delta)}
            />
            {renderSection('done', doneOrders, sizes[2])}
          </View>
        </ScrollView>
      ) : (
        // ── PORTRAIT: secciones en fila vertical ──
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.portraitContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderSection('new', newOrders, sizes[0])}

          <DividerBar
            label={STATUS.processing.label}
            color={STATUS.processing.color}
            theme={theme}
            isLandscape={false}
            onDrag={delta => adjustSize(0, delta)}
          />

          {renderSection('processing', processingOrders, sizes[1])}

          <DividerBar
            label={STATUS.done.label}
            color={STATUS.done.color}
            theme={theme}
            isLandscape={false}
            onDrag={delta => adjustSize(1, delta)}
          />

          {renderSection('done', doneOrders, sizes[2])}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3, marginBottom: 10 },
  headerIndex: { flexDirection: 'row' },
  indexBtn: { paddingRight: 20, paddingBottom: 10, position: 'relative' },
  indexText: { fontSize: 12, fontWeight: '700' },
  indexLine: { position: 'absolute', bottom: 0, left: 0, right: 20, height: 2, borderRadius: 1 },

  // Hint
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1,
  },
  hintText: { fontSize: 11, fontWeight: '500', flex: 1 },

  // Layout
  portraitContainer: { paddingTop: 8 },
  landscapeContainer: { flex: 1, flexDirection: 'row' },

  // Sección
  section: { padding: 12, gap: 10 },

  // Barra divisora
  dividerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1,
  },
  dividerBarHorizontal: {
    height: 36, marginHorizontal: 0, borderRadius: 0,
    borderLeftWidth: 0, borderRightWidth: 0,
  },
  dividerBarVertical: {
    width: 36, flexDirection: 'column',
    borderTopWidth: 0, borderBottomWidth: 0,
  },
  dividerGrip: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  dividerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // Card
  card: {
    borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', overflow: 'hidden',
  },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNum: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  cardProduct: { fontSize: 15, fontWeight: '800' },
  cardMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  cardTimer: { fontSize: 11, fontWeight: '800' },
  cardExtras: { fontSize: 11, fontWeight: '500', marginTop: 6 },
  cardExpanded: { borderTopWidth: 1, marginTop: 10, paddingTop: 10, gap: 10 },

  // Detalle expandido
  expandLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  unitRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  unitBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  unitBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  flavorsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  flavorChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  flavorChipText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  unitToppings: { fontSize: 11, fontWeight: '500' },
  unitNote: { fontSize: 11, fontWeight: '500', fontStyle: 'italic' },
  toppingsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toppingChip: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  noteBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 10, borderWidth: 1,
  },
  noteText: { fontSize: 12, fontWeight: '500', flex: 1 },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Compact card (listos)
  compactCard: {
    flexDirection: 'row', borderRadius: 10,
    borderWidth: 1, overflow: 'hidden',
  },
  compactStripe: { width: 3 },
  compactBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactNum: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  compactName: { flex: 1, fontSize: 13, fontWeight: '700' },
  compactMeta: { fontSize: 11, fontWeight: '500' },
  compactTimer: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptySection: {
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    paddingVertical: 30, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 13, fontWeight: '500' },
});