import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, PanResponder, Dimensions, useWindowDimensions,
  Modal, Image,
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
const MIN_SECTION = 120;

// ─── MODAL DE DETALLE COMPLETO ──────────────────────────
function OrderDetailModal({ sale, visible, onClose, onMove, theme }) {
  if (!sale) return null;
  const status = STATUS[sale.orderStatus] || STATUS.new;
  const curIdx = KEYS.indexOf(sale.orderStatus || 'new');

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  };

  const getDuration = () => {
    if (!sale.processingStartedAt || !sale.completedAt) return null;
    const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
    return `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[modalStyles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[modalStyles.sheet, { backgroundColor: theme.bg }]}>

          {/* Handle */}
          <View style={[modalStyles.handle, { backgroundColor: theme.cardBorder }]} />

          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: theme.cardBorder }]}>
            <View style={modalStyles.headerLeft}>
              <View style={[modalStyles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[modalStyles.orderNum, { color: theme.text }]}>
                Pedido #{sale.orderNumber || sale.id?.slice(-4)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[modalStyles.closeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Feather name="x" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={modalStyles.scroll} showsVerticalScrollIndicator={false}>

            {/* Estado badge */}
            <View style={[modalStyles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
              <Text style={[modalStyles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
            </View>

            {/* Info básica */}
            <View style={[modalStyles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[modalStyles.productName, { color: theme.text }]}>{sale.productName}</Text>
              <View style={[modalStyles.divider, { backgroundColor: theme.cardBorder }]} />
              {[
                { l: 'Tamaño', v: sale.size },
                { l: 'Cantidad', v: `${sale.quantity}x` },
                { l: 'Cajero', v: sale.workerName || '—' },
                { l: 'Hora', v: formatTime(sale.timestamp) },
              ].map((r, i) => (
                <View key={i} style={modalStyles.infoRow}>
                  <Text style={[modalStyles.infoLabel, { color: theme.textMuted }]}>{r.l}</Text>
                  <Text style={[modalStyles.infoValue, { color: theme.text }]}>{r.v}</Text>
                </View>
              ))}
              {getDuration() && (
                <View style={modalStyles.infoRow}>
                  <Text style={[modalStyles.infoLabel, { color: theme.textMuted }]}>Duración</Text>
                  <Text style={[modalStyles.infoValue, { color: STATUS.done.color }]}>⏱ {getDuration()}</Text>
                </View>
              )}
            </View>

            {/* Unidades con componentes */}
            {sale.units?.length > 0 && (
              <View style={modalStyles.block}>
                <Text style={[modalStyles.blockTitle, { color: theme.textMuted }]}>UNIDADES</Text>
                {sale.units.map((unit, i) => (
                  <View key={i} style={[modalStyles.unitCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={[modalStyles.unitHeader, { borderBottomColor: theme.cardBorder }]}>
                      <View style={[modalStyles.unitBadge, { backgroundColor: status.color }]}>
                        <Text style={modalStyles.unitBadgeText}>{i + 1}</Text>
                      </View>
                      <Text style={[modalStyles.unitTitle, { color: theme.text }]}>Unidad {i + 1}</Text>
                    </View>

                    {unit.flavors?.length > 0 && (
                      <View style={modalStyles.flavorsSection}>
                        <Text style={[modalStyles.subLabel, { color: theme.textMuted }]}>SABORES</Text>
                        <View style={modalStyles.flavorsWrap}>
                          {unit.flavors.map((f, fi) => (
                            <View key={fi} style={[modalStyles.flavorChip, { backgroundColor: f.color || '#888' }]}>
                              <View style={[modalStyles.flavorDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                              <Text style={modalStyles.flavorChipText}>{f.name || f}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {unit.toppings?.length > 0 && (
                      <View style={modalStyles.toppingsSection}>
                        <Text style={[modalStyles.subLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                        <View style={modalStyles.toppingsWrap}>
                          {unit.toppings.map((t, ti) => (
                            <View key={ti} style={[modalStyles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                              <Text style={[modalStyles.toppingText, { color: theme.text }]}>{t}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {unit.note ? (
                      <View style={[modalStyles.noteBox, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                        <Feather name="file-text" size={13} color={theme.textMuted} />
                        <Text style={[modalStyles.noteText, { color: theme.textSecondary }]}>{unit.note}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* Extras sin unidades */}
            {!sale.units?.length && sale.toppings?.length > 0 && (
              <View style={modalStyles.block}>
                <Text style={[modalStyles.blockTitle, { color: theme.textMuted }]}>EXTRAS</Text>
                <View style={[modalStyles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={modalStyles.toppingsWrap}>
                    {sale.toppings.map((t, i) => (
                      <View key={i} style={[modalStyles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                        <Text style={[modalStyles.toppingText, { color: theme.text }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Nota general */}
            {sale.note && (
              <View style={modalStyles.block}>
                <Text style={[modalStyles.blockTitle, { color: theme.textMuted }]}>NOTA</Text>
                <View style={[modalStyles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[modalStyles.noteText, { color: theme.text }]}>{sale.note}</Text>
                </View>
              </View>
            )}

            {/* Comprobante */}
            {sale.voucherImage && (
              <View style={modalStyles.block}>
                <Text style={[modalStyles.blockTitle, { color: theme.textMuted }]}>COMPROBANTE</Text>
                <Image source={{ uri: sale.voucherImage }} style={modalStyles.voucherImg} />
              </View>
            )}

            {/* Acciones de estado */}
            {sale.orderStatus !== 'done' && (
              <View style={modalStyles.actions}>
                {curIdx < KEYS.length - 1 && (
                  <TouchableOpacity
                    style={[modalStyles.actionBtn, { backgroundColor: STATUS[KEYS[curIdx + 1]].color }]}
                    onPress={() => { onMove(sale.id, KEYS[curIdx + 1]); onClose(); }}
                  >
                    <Text style={modalStyles.actionBtnText}>
                      {sale.orderStatus === 'new' ? 'Iniciar preparación →' : 'Marcar como listo →'}
                    </Text>
                  </TouchableOpacity>
                )}
                {curIdx > 0 && (
                  <TouchableOpacity
                    style={[modalStyles.actionBtnSecondary, { borderColor: theme.cardBorder }]}
                    onPress={() => { onMove(sale.id, KEYS[curIdx - 1]); onClose(); }}
                  >
                    <Text style={[modalStyles.actionBtnSecondaryText, { color: theme.textSecondary }]}>
                      ← Regresar a {STATUS[KEYS[curIdx - 1]].label.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── TARJETA ────────────────────────────────────────────
function OrderCard({ sale, theme, onMoveToSection, currentSection, onOpenDetail }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (sale.orderStatus === 'processing' && sale.processingStartedAt) {
      const iv = setInterval(() => {
        const diff = Math.floor((Date.now() - new Date(sale.processingStartedAt)) / 1000);
        setElapsed(`${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(iv);
    }
    if (sale.orderStatus === 'done' && sale.processingStartedAt && sale.completedAt) {
      const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
      setElapsed(`${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`);
    }
  }, [sale.orderStatus]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy) * 0.8,
    onPanResponderGrant: () => {
      isDragging.current = true;
      pan.setOffset({ x: pan.x._value, y: 0 });
      pan.setValue({ x: 0, y: 0 });
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1.03, useNativeDriver: false }),
        Animated.timing(cardOpacity, { toValue: 0.9, duration: 120, useNativeDriver: false }),
      ]).start();
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gs) => {
      isDragging.current = false;
      pan.flattenOffset();
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: false }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 120,
          friction: 8,
        }),
      ]).start();

      const threshold = 70;
      const curIdx = KEYS.indexOf(currentSection);
      if (gs.dx > threshold && curIdx < KEYS.length - 1) {
        onMoveToSection(sale.id, KEYS[curIdx + 1]);
      } else if (gs.dx < -threshold && curIdx > 0) {
        onMoveToSection(sale.id, KEYS[curIdx - 1]);
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
          transform: [{ translateX: pan.x }, { scale: cardScale }],
          opacity: cardOpacity,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.cardStripe, { backgroundColor: status.color }]} />

      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => onOpenDetail(sale)}
        activeOpacity={0.88}
      >
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardNum, { color: status.color }]}>
              #{sale.orderNumber || sale.id?.slice(-4)}
            </Text>
            <Text style={[styles.cardProduct, { color: theme.text }]} numberOfLines={1}>
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
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textMuted} />
          </View>
        </View>

        {sale.toppings?.length > 0 && (
          <Text style={[styles.cardExtras, { color: theme.textMuted }]} numberOfLines={1}>
            + {sale.toppings.join(', ')}
          </Text>
        )}

        {/* Chips de sabores */}
        {sale.units?.length > 0 && sale.units[0].flavors?.length > 0 && (
          <View style={styles.cardFlavors}>
            {sale.units[0].flavors.slice(0, 3).map((f, i) => (
              <View key={i} style={[styles.cardFlavorDot, { backgroundColor: f.color || '#888' }]} />
            ))}
            {sale.units.length > 1 && (
              <Text style={[styles.cardFlavorMore, { color: theme.textMuted }]}>
                +{sale.units.length - 1} más
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── TARJETA COMPRIMIDA ──────────────────────────────────
function CompactCard({ sale, theme, onOpenDetail }) {
  return (
    <TouchableOpacity
      style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
      onPress={() => onOpenDetail(sale)}
      activeOpacity={0.85}
    >
      <View style={[styles.compactStripe, { backgroundColor: STATUS.done.color }]} />
      <View style={styles.compactBody}>
        <Text style={[styles.compactNum, { color: STATUS.done.color }]}>
          #{sale.orderNumber || sale.id?.slice(-4)}
        </Text>
        <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>{sale.productName}</Text>
        <Text style={[styles.compactMeta, { color: theme.textMuted }]}>{sale.quantity}x · {sale.size}</Text>
      </View>
      {sale.processingStartedAt && sale.completedAt && (() => {
        const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
        return (
          <Text style={[styles.compactTimer, { color: STATUS.done.color }]}>
            {Math.floor(diff / 60).toString().padStart(2, '0')}:{(diff % 60).toString().padStart(2, '0')}
          </Text>
        );
      })()}
      <MaterialCommunityIcons name="chevron-right" size={16} color={theme.textMuted} style={{ marginRight: 10 }} />
    </TouchableOpacity>
  );
}

// ─── BARRA DIVISORA ──────────────────────────────────────
function DividerBar({ label, color, theme, isLandscape, onDrag }) {
  const lastPos = useRef(0);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gs) => {
      lastPos.current = isLandscape ? gs.x0 : gs.y0;
    },
    onPanResponderMove: (_, gs) => {
      const current = isLandscape ? gs.moveX : gs.moveY;
      const delta = current - lastPos.current;
      lastPos.current = current;
      onDrag(delta);
    },
    onPanResponderRelease: () => {
      lastPos.current = 0;
    },
  })).current;

  return (
    <View
      style={[
        styles.dividerBar,
        isLandscape ? styles.dividerV : styles.dividerH,
        { backgroundColor: color + '18', borderColor: color + '40' },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.dividerGrip, { backgroundColor: color }]}>
        <MaterialCommunityIcons
          name={isLandscape ? 'drag-vertical' : 'drag-horizontal'}
          size={14}
          color="#fff"
        />
      </View>
      <Text style={[styles.dividerLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── SCREEN ──────────────────────────────────────────────
export default function OrdersScreen() {
  const { getTodaySales, updateSaleStatus } = useApp();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const sales = getTodaySales().reverse();
  const newOrders = sales.filter(s => (s.orderStatus || 'new') === 'new');
  const processingOrders = sales.filter(s => s.orderStatus === 'processing');
  const doneOrders = sales.filter(s => s.orderStatus === 'done');

  const defaultSize = Math.floor((isLandscape ? width : height * 0.8) / 3);
  const [sec0, setSec0] = useState(defaultSize);
  const [sec1, setSec1] = useState(defaultSize);
  const [sec2, setSec2] = useState(defaultSize);

  const [detailSale, setDetailSale] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeIdx, setActiveIdx] = useState(0);

  const openDetail = (sale) => { setDetailSale(sale); setShowDetail(true); };
  const closeDetail = () => setShowDetail(false);

  const handleMove = (saleId, newStatus) => updateSaleStatus(saleId, newStatus);

  const scrollToSection = (idx) => {
    setActiveIdx(idx);
    sectionRefs.current[KEYS[idx]]?.measureLayout(
      scrollRef.current,
      (_, y) => scrollRef.current?.scrollTo({ y: y - 56, animated: true }),
      () => {}
    );
  };

  const adjustSec0 = (delta) => {
    setSec0(prev => Math.max(MIN_SECTION, prev + delta));
  };
  const adjustSec1 = (delta) => {
    setSec1(prev => Math.max(MIN_SECTION, prev + delta));
  };

  const renderSection = (key, orders) => {
    const sizeStyle = isLandscape
      ? { width: key === 'new' ? sec0 : key === 'processing' ? sec1 : sec2 }
      : { minHeight: key === 'new' ? sec0 : key === 'processing' ? sec1 : sec2 };

    return (
      <View
        key={key}
        ref={ref => sectionRefs.current[key] = ref}
        style={[styles.section, sizeStyle]}
      >
        {orders.length === 0 ? (
          <View style={[styles.emptySection, { borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {key === 'new' ? 'Sin pedidos nuevos'
                : key === 'processing' ? 'Nada en proceso'
                : 'Ninguno listo aún'}
            </Text>
          </View>
        ) : key === 'done' ? (
          orders.map(s => (
            <CompactCard key={s.id} sale={s} theme={theme} onOpenDetail={openDetail} />
          ))
        ) : (
          orders.map(s => (
            <OrderCard
              key={s.id}
              sale={s}
              theme={theme}
              currentSection={key}
              onMoveToSection={handleMove}
              onOpenDetail={openDetail}
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
                  {STATUS[key].label}{count > 0 ? ` · ${count}` : ''}
                </Text>
                {isActive && <View style={[styles.indexLine, { backgroundColor: STATUS[key].color }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {(newOrders.length > 0 || processingOrders.length > 0) && (
        <View style={[styles.hint, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
          <MaterialCommunityIcons name="gesture-swipe-horizontal" size={13} color={theme.textMuted} />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>
            Deslizá para cambiar estado · Tocá para ver detalle
          </Text>
        </View>
      )}

      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          {renderSection('new', newOrders)}
          <DividerBar label={STATUS.processing.label} color={STATUS.processing.color} theme={theme} isLandscape onDrag={adjustSec0} />
          {renderSection('processing', processingOrders)}
          <DividerBar label={STATUS.done.label} color={STATUS.done.color} theme={theme} isLandscape onDrag={adjustSec1} />
          {renderSection('done', doneOrders)}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.portraitContainer} showsVerticalScrollIndicator={false}>
          {renderSection('new', newOrders)}
          <DividerBar label={STATUS.processing.label} color={STATUS.processing.color} theme={theme} isLandscape={false} onDrag={adjustSec0} />
          {renderSection('processing', processingOrders)}
          <DividerBar label={STATUS.done.label} color={STATUS.done.color} theme={theme} isLandscape={false} onDrag={adjustSec1} />
          {renderSection('done', doneOrders)}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <OrderDetailModal
        sale={detailSale}
        visible={showDetail}
        onClose={closeDetail}
        onMove={handleMove}
        theme={theme}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 3, marginBottom: 10 },
  headerIndex: { flexDirection: 'row' },
  indexBtn: { paddingRight: 20, paddingBottom: 10, position: 'relative' },
  indexText: { fontSize: 12, fontWeight: '700' },
  indexLine: { position: 'absolute', bottom: 0, left: 0, right: 20, height: 2, borderRadius: 1 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderBottomWidth: 1 },
  hintText: { fontSize: 11, fontWeight: '500', flex: 1 },
  portraitContainer: { paddingTop: 8 },
  landscapeContainer: { flex: 1, flexDirection: 'row' },
  section: { padding: 12, gap: 10 },
  emptySection: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 30, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 13, fontWeight: '500' },
  dividerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  dividerH: { height: 40, borderLeftWidth: 0, borderRightWidth: 0 },
  dividerV: { width: 40, flexDirection: 'column', borderTopWidth: 0, borderBottomWidth: 0 },
  dividerGrip: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dividerLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  card: { borderRadius: 14, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNum: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  cardProduct: { fontSize: 15, fontWeight: '800' },
  cardMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  cardTimer: { fontSize: 11, fontWeight: '800' },
  cardExtras: { fontSize: 11, fontWeight: '500', marginTop: 6 },
  cardFlavors: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  cardFlavorDot: { width: 12, height: 12, borderRadius: 6 },
  cardFlavorMore: { fontSize: 10, fontWeight: '600' },
  compactCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  compactStripe: { width: 3, alignSelf: 'stretch' },
  compactBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  compactNum: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  compactName: { fontSize: 13, fontWeight: '700' },
  compactMeta: { fontSize: 11, fontWeight: '500' },
  compactTimer: { fontSize: 11, fontWeight: '700', marginRight: 8 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  orderNum: { fontSize: 16, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, marginBottom: 16 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  productName: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  divider: { height: 1, marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700' },
  block: { marginBottom: 16 },
  blockTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  unitCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  unitBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unitBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  unitTitle: { fontSize: 14, fontWeight: '700' },
  flavorsSection: { padding: 12, gap: 8 },
  toppingsSection: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  subLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  flavorsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flavorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  flavorDot: { width: 8, height: 8, borderRadius: 4 },
  flavorChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  toppingsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toppingChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  toppingText: { fontSize: 12, fontWeight: '600' },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, borderRadius: 10, padding: 10, borderWidth: 1 },
  noteText: { fontSize: 13, fontWeight: '500', flex: 1 },
  voucherImg: { width: '100%', height: 200, borderRadius: 14, resizeMode: 'cover' },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  actionBtnSecondary: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  actionBtnSecondaryText: { fontSize: 14, fontWeight: '600' },
});