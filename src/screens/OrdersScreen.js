import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, PanResponder, Dimensions, useWindowDimensions,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUS = {
  new:        { label: 'NUEVOS',     color: '#F77F00' },
  processing: { label: 'EN PROCESO', color: '#4361EE' },
  done:       { label: 'LISTOS',     color: '#2B9348' },
};
const KEYS = ['new', 'processing', 'done'];
const MIN_SECTION = 120;
const LONG_PRESS_DELAY = 600;

// ─── MODAL COCINERO ──────────────────────────────────────
function CookModal({ sale, visible, onClose, onDone, theme }) {
  const [elapsed, setElapsed] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [completedUnits, setCompletedUnits] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const swipeBg = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !sale) return;
    setCurrentPage(0);
    setCompletedUnits([]);
    setUnlocked(false);
    swipeAnim.setValue(0);
    swipeBg.setValue(0);
  }, [visible, sale?.id]);

  useEffect(() => {
    if (!visible || !sale?.processingStartedAt) return;
    const iv = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(sale.processingStartedAt)) / 1000);
      setElapsed(`${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [visible, sale?.processingStartedAt]);

  if (!sale) return null;

  const pages = sale.units?.length > 0
    ? sale.units
    : [{ flavors: [], toppings: sale.toppings || [], note: sale.note }];
  const totalPages = pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const currentUnit = pages[currentPage];

  const bgColor = swipeBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', STATUS.done.color],
  });

  const swipePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && gs.dx < 0,
    onPanResponderMove: (_, gs) => {
      if (gs.dx < 0) {
        swipeAnim.setValue(gs.dx);
        swipeBg.setValue(Math.min(1, Math.abs(gs.dx) / (SCREEN_WIDTH * 0.35)));
      }
    },
    onPanResponderRelease: (_, gs) => {
      const threshold = -(SCREEN_WIDTH * 0.32);
      if (gs.dx < threshold) {
        if (isLastPage) {
          Animated.sequence([
            Animated.timing(swipeAnim, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: false }),
            Animated.timing(swipeAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
          ]).start(() => {
            swipeBg.setValue(0);
            setUnlocked(true);
            setCompletedUnits(prev => [...prev, currentPage]);
          });
        } else {
          Animated.timing(swipeAnim, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: false }).start(() => {
            swipeAnim.setValue(0);
            swipeBg.setValue(0);
            setCompletedUnits(prev => [...prev, currentPage]);
            setCurrentPage(p => p + 1);
          });
        }
      } else {
        Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: false }).start();
        Animated.timing(swipeBg, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      }
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cookStyles.overlay}>
        <View style={[cookStyles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[cookStyles.handle, { backgroundColor: theme.cardBorder }]} />

          {/* Número ENORME */}
          <View style={[cookStyles.numSection, { borderBottomColor: STATUS.processing.color + '40' }]}>
            <Text style={[cookStyles.numLabel, { color: STATUS.processing.color }]}>PEDIDO EN PREPARACIÓN</Text>
            <Text style={[cookStyles.numBig, { color: theme.text }]}>#{sale.orderNumber || sale.id?.slice(-4)}</Text>
            {elapsed ? <Text style={[cookStyles.timer, { color: STATUS.processing.color }]}>⏱ {elapsed}</Text> : null}
          </View>

          {/* Info rápida */}
          <View style={[cookStyles.infoBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={cookStyles.infoItem}>
              <Text style={[cookStyles.infoLabel, { color: theme.textMuted }]}>PRODUCTO</Text>
              <Text style={[cookStyles.infoValue, { color: theme.text }]} numberOfLines={2}>{sale.productName}</Text>
            </View>
            <View style={[cookStyles.infoDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={cookStyles.infoItem}>
              <Text style={[cookStyles.infoLabel, { color: theme.textMuted }]}>TAMAÑO</Text>
              <Text style={[cookStyles.infoValue, { color: theme.text }]}>{sale.size}</Text>
            </View>
            <View style={[cookStyles.infoDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={cookStyles.infoItem}>
              <Text style={[cookStyles.infoLabel, { color: theme.textMuted }]}>CANT.</Text>
              <Text style={[cookStyles.infoValueBig, { color: STATUS.processing.color }]}>{sale.quantity}x</Text>
            </View>
          </View>

          {/* Indicador de páginas */}
          {totalPages > 1 && (
            <View style={cookStyles.pageIndicator}>
              {pages.map((_, i) => (
                <View key={i} style={[
                  cookStyles.pageDot,
                  {
                    backgroundColor: completedUnits.includes(i)
                      ? STATUS.done.color
                      : i === currentPage
                        ? STATUS.processing.color
                        : theme.cardBorder,
                    width: i === currentPage ? 20 : 8,
                  },
                ]} />
              ))}
            </View>
          )}

          {/* Contenido de la unidad — scroll libre */}
          <ScrollView
            style={cookStyles.unitPage}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={[cookStyles.unitHeader, { backgroundColor: STATUS.processing.color }]}>
              <Text style={cookStyles.unitHeaderText}>
                {totalPages > 1 ? `UNIDAD ${currentPage + 1} DE ${totalPages}` : 'DETALLE DEL PEDIDO'}
              </Text>
              {completedUnits.includes(currentPage) && (
                <Text style={cookStyles.unitDoneCheck}>✓</Text>
              )}
            </View>

            {currentUnit.flavors?.length > 0 && (
              <View style={cookStyles.flavorsSection}>
                <Text style={[cookStyles.sectionLabel, { color: theme.textMuted }]}>SABORES / COMPONENTES</Text>
                <View style={cookStyles.flavorsGrid}>
                  {currentUnit.flavors.map((f, fi) => (
                    <View key={fi} style={[cookStyles.flavorBlock, { backgroundColor: f.color || '#888' }]}>
                      <Text style={cookStyles.flavorBlockText}>{f.name || f}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {currentUnit.toppings?.length > 0 && (
              <View style={[cookStyles.toppingsSection, {
                borderTopWidth: currentUnit.flavors?.length > 0 ? 1 : 0,
                borderTopColor: theme.cardBorder,
              }]}>
                <Text style={[cookStyles.sectionLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                <View style={cookStyles.toppingsGrid}>
                  {currentUnit.toppings.map((t, ti) => (
                    <View key={ti} style={[cookStyles.toppingBlock, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                      <Text style={[cookStyles.toppingBlockText, { color: theme.text }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(currentUnit.note || currentUnit.notes) ? (
              <View style={cookStyles.noteBox}>
                <Text style={cookStyles.noteIcon}>📝</Text>
                <Text style={cookStyles.noteText}>{currentUnit.note || currentUnit.notes}</Text>
              </View>
            ) : null}

            {!currentUnit.flavors?.length && !currentUnit.toppings?.length && !currentUnit.note && !currentUnit.notes && (
              <View style={[cookStyles.emptyUnit, { borderColor: theme.cardBorder }]}>
                <Text style={[cookStyles.emptyUnitText, { color: theme.textMuted }]}>Sin detalles adicionales</Text>
              </View>
            )}

            {completedUnits.includes(currentPage) && !isLastPage && (
              <View style={[cookStyles.unitDoneBanner, { backgroundColor: STATUS.done.color + '20' }]}>
                <Text style={[cookStyles.unitDoneBannerText, { color: STATUS.done.color }]}>✓ Unidad completada</Text>
                <TouchableOpacity onPress={() => setCurrentPage(p => p + 1)}>
                  <Text style={[cookStyles.nextUnitText, { color: STATUS.processing.color }]}>Siguiente →</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Área de swipe — separada del scroll */}
          {!completedUnits.includes(currentPage) && (
            <Animated.View
              style={[cookStyles.swipeArea, { borderColor: theme.cardBorder, backgroundColor: bgColor }]}
              {...swipePanResponder.panHandlers}
            >
              <Animated.View style={{ transform: [{ translateX: swipeAnim }] }}>
                <Text style={[cookStyles.swipeHintText, { color: theme.textMuted }]}>
                  {isLastPage ? '← Deslizá para confirmar todo listo' : '← Deslizá cuando esta unidad esté lista'}
                </Text>
              </Animated.View>
            </Animated.View>
          )}

          {/* Footer — botón LISTO */}
          <View style={[cookStyles.footer, { borderTopColor: theme.cardBorder, backgroundColor: theme.bg }]}>
            <TouchableOpacity
              style={[cookStyles.doneBtn, {
                backgroundColor: unlocked ? STATUS.done.color : theme.cardBorder,
                opacity: unlocked ? 1 : 0.55,
              }]}
              onPress={() => { if (unlocked) { onDone(sale.id); onClose(); } }}
              disabled={!unlocked}
            >
              {unlocked
                ? <Text style={cookStyles.doneBtnText}>✓  PEDIDO LISTO</Text>
                : <Text style={cookStyles.doneBtnLocked}>
                    🔒  Completá todas las unidades ({completedUnits.length}/{totalPages})
                  </Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={cookStyles.closeLink} onPress={onClose}>
              <Text style={[cookStyles.closeLinkText, { color: theme.textMuted }]}>Cerrar sin marcar como listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── MODAL DETALLE NORMAL ────────────────────────────────
function OrderDetailModal({ sale, visible, onClose, onMove, theme }) {
  const status = sale ? (STATUS[sale.orderStatus] || STATUS.new) : STATUS.new;
  const curIdx = sale ? KEYS.indexOf(sale.orderStatus || 'new') : 0;
  if (!sale) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[detailStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[detailStyles.sheet, { backgroundColor: theme.bg }]}>
          <View style={[detailStyles.handle, { backgroundColor: theme.cardBorder }]} />

          <View style={[detailStyles.header, { borderBottomColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[detailStyles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[detailStyles.orderNum, { color: theme.text }]}>
                #{sale.orderNumber || sale.id?.slice(-4)}
              </Text>
            </View>
            <TouchableOpacity
              style={[detailStyles.closeBtn, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              onPress={onClose}
            >
              <Feather name="x" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={detailStyles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[detailStyles.statusBadge, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
              <Text style={[detailStyles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
            </View>

            <View style={[detailStyles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Text style={[detailStyles.productName, { color: theme.text }]}>{sale.productName}</Text>
              <View style={[detailStyles.divider, { backgroundColor: theme.cardBorder }]} />
              {[
                { l: 'Tamaño', v: sale.size },
                { l: 'Cantidad', v: `${sale.quantity}x` },
                { l: 'Cajero', v: sale.workerName || '—' },
                { l: 'Total', v: `$${sale.total?.toFixed(2) || '0.00'}` },
              ].map((r, i) => (
                <View key={i} style={detailStyles.row}>
                  <Text style={[detailStyles.rowLabel, { color: theme.textMuted }]}>{r.l}</Text>
                  <Text style={[detailStyles.rowValue, { color: theme.text }]}>{r.v}</Text>
                </View>
              ))}
            </View>

            {sale.units?.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[detailStyles.blockTitle, { color: theme.textMuted }]}>UNIDADES</Text>
                {sale.units.map((unit, i) => (
                  <View key={i} style={[detailStyles.unitCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={[detailStyles.unitHeader, { borderBottomColor: theme.cardBorder }]}>
                      <View style={[detailStyles.unitBadge, { backgroundColor: status.color }]}>
                        <Text style={detailStyles.unitBadgeText}>{i + 1}</Text>
                      </View>
                      <Text style={[detailStyles.unitTitle, { color: theme.text }]}>Unidad {i + 1}</Text>
                    </View>
                    {unit.flavors?.length > 0 && (
                      <View style={{ padding: 12, gap: 8 }}>
                        <Text style={[detailStyles.subLabel, { color: theme.textMuted }]}>SABORES</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {unit.flavors.map((f, fi) => (
                            <View key={fi} style={[detailStyles.flavorChip, { backgroundColor: f.color || '#888' }]}>
                              <Text style={detailStyles.flavorChipText}>{f.name || f}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {unit.toppings?.length > 0 && (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 6 }}>
                        <Text style={[detailStyles.subLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {unit.toppings.map((t, ti) => (
                            <View key={ti} style={[detailStyles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{t}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {(unit.note || unit.notes) ? (
                      <View style={[detailStyles.noteBox, { backgroundColor: '#FFF9C4', borderColor: '#F9A825', margin: 12 }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#5D4037' }}>📝 {unit.note || unit.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {!sale.units?.length && sale.toppings?.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[detailStyles.blockTitle, { color: theme.textMuted }]}>EXTRAS</Text>
                <View style={[detailStyles.section, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {sale.toppings.map((t, i) => (
                      <View key={i} style={[detailStyles.toppingChip, { backgroundColor: theme.bg, borderColor: theme.cardBorder }]}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.text }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {sale.note && (
              <View style={[detailStyles.section, { backgroundColor: '#FFF9C4', borderColor: '#F9A825', marginBottom: 16 }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#5D4037' }}>📝 {sale.note}</Text>
              </View>
            )}

            {sale.orderStatus !== 'done' && curIdx < KEYS.length - 1 && (
              <TouchableOpacity
                style={[detailStyles.actionBtn, { backgroundColor: STATUS[KEYS[curIdx + 1]].color }]}
                onPress={() => { onMove(sale.id, KEYS[curIdx + 1]); onClose(); }}
              >
                <Text style={detailStyles.actionBtnText}>
                  {sale.orderStatus === 'new' ? 'Iniciar preparación →' : 'Marcar como listo →'}
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── TARJETA PRINCIPAL ───────────────────────────────────
function OrderCard({ sale, theme, onTap, onDragStart, onDragMove, onDragEnd }) {
  const [elapsed, setElapsed] = useState('');
  const scale = useRef(new Animated.Value(1)).current;
  const cardRef = useRef(null);
  const longPressTimer = useRef(null);
  const isDragging = useRef(false);
  const dragStarted = useRef(false);

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

  const liftCard = () => Animated.spring(scale, { toValue: 1.05, useNativeDriver: false, tension: 200, friction: 8 }).start();
  const dropCard = () => Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => isDragging.current,
    onPanResponderGrant: () => {
      dragStarted.current = false;
      isDragging.current = false;
      longPressTimer.current = setTimeout(() => {
        isDragging.current = true;
        dragStarted.current = true;
        liftCard();
        cardRef.current?.measure((x, y, w, h, px, py) => {
          onDragStart(sale, { x: px, y: py, width: w, height: h });
        });
      }, LONG_PRESS_DELAY);
    },
    onPanResponderMove: (e) => {
      if (isDragging.current && dragStarted.current) {
        onDragMove(e.nativeEvent.pageX, e.nativeEvent.pageY);
      }
    },
    onPanResponderRelease: (e) => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (isDragging.current && dragStarted.current) {
        dropCard();
        onDragEnd(sale, e.nativeEvent.pageX, e.nativeEvent.pageY);
      } else {
        onTap(sale);
      }
      isDragging.current = false;
      dragStarted.current = false;
    },
    onPanResponderTerminate: () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      dropCard();
      onDragEnd(null, 0, 0);
      isDragging.current = false;
      dragStarted.current = false;
    },
  })).current;

  const status = STATUS[sale.orderStatus] || STATUS.new;

  return (
    <Animated.View
      ref={cardRef}
      style={[styles.card, {
        backgroundColor: theme.card,
        borderColor: theme.cardBorder,
        transform: [{ scale }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.cardStripe, { backgroundColor: status.color }]} />
      <View style={styles.cardBody}>
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
            <MaterialCommunityIcons name="dots-grid" size={18} color={theme.textMuted} />
          </View>
        </View>
        {sale.toppings?.length > 0 && (
          <Text style={[styles.cardExtras, { color: theme.textMuted }]} numberOfLines={1}>
            + {sale.toppings.join(', ')}
          </Text>
        )}
        {sale.units?.length > 0 && (
          <View style={styles.cardFlavors}>
            {sale.units.flatMap(u => u.flavors || []).slice(0, 6).map((f, i) => (
              <View key={i} style={[styles.cardFlavorDot, { backgroundColor: f.color || '#888' }]} />
            ))}
            {sale.units.length > 1 && (
              <Text style={[styles.cardFlavorMore, { color: theme.textMuted }]}>{sale.units.length} uds</Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── TARJETA COMPRIMIDA (Listos) ─────────────────────────
function CompactCard({ sale, theme, onTap, onReturn }) {
  const [expanded, setExpanded] = useState(false);

  const getDuration = () => {
    if (!sale.processingStartedAt || !sale.completedAt) return null;
    const diff = Math.floor((new Date(sale.completedAt) - new Date(sale.processingStartedAt)) / 1000);
    return `${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`;
  };

  return (
    <View style={[styles.compactCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={[styles.compactStripe, { backgroundColor: STATUS.done.color }]} />
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.compactBody} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
          <View style={styles.compactRow}>
            <Text style={[styles.compactNum, { color: STATUS.done.color }]}>
              #{sale.orderNumber || sale.id?.slice(-4)}
            </Text>
            <Text style={[styles.compactName, { color: theme.text }]} numberOfLines={1}>{sale.productName}</Text>
            <Text style={[styles.compactMeta, { color: theme.textMuted }]}>{sale.quantity}x</Text>
            {getDuration() && <Text style={[styles.compactTimer, { color: STATUS.done.color }]}>{getDuration()}</Text>}
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textMuted} />
          </View>
        </TouchableOpacity>
        {expanded && (
          <View style={[styles.compactExpanded, { borderTopColor: theme.cardBorder }]}>
            {sale.toppings?.length > 0 && (
              <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>
                + {sale.toppings.join(', ')}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.returnBtn, { borderColor: STATUS.processing.color }]}
              onPress={() => Alert.alert(
                'Regresar pedido',
                `¿Regresar el pedido #${sale.orderNumber || sale.id?.slice(-4)} a "En proceso"?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sí, regresar', style: 'destructive', onPress: () => onReturn(sale.id) },
                ]
              )}
            >
              <Feather name="rotate-ccw" size={13} color={STATUS.processing.color} />
              <Text style={[styles.returnBtnText, { color: STATUS.processing.color }]}>Regresar a En proceso</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── BARRA DIVISORA ───────────────────────────────────────
function DividerBar({ label, color, theme, isLandscape, onDrag, onLayout }) {
  const lastPos = useRef(0);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gs) => { lastPos.current = isLandscape ? gs.x0 : gs.y0; },
    onPanResponderMove: (_, gs) => {
      const current = isLandscape ? gs.moveX : gs.moveY;
      onDrag(current - lastPos.current);
      lastPos.current = current;
    },
    onPanResponderRelease: () => { lastPos.current = 0; },
  })).current;

  return (
    <View
      style={[styles.dividerBar, isLandscape ? styles.dividerV : styles.dividerH, { backgroundColor: color + '18', borderColor: color + '40' }]}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      <View style={[styles.dividerGrip, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={isLandscape ? 'drag-vertical' : 'drag-horizontal'} size={14} color="#fff" />
      </View>
      <Text style={[styles.dividerLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── SCREEN ───────────────────────────────────────────────
export default function OrdersScreen() {
  const { getTodaySales, updateSaleStatus } = useApp();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const sales = getTodaySales().reverse();
  const newOrders = sales.filter(s => (s.orderStatus || 'new') === 'new');
  const processingOrders = sales.filter(s => s.orderStatus === 'processing');
  const doneOrders = sales.filter(s => s.orderStatus === 'done');

  const defaultSize = Math.floor((isLandscape ? width : height * 0.75) / 3);
  const [sec0, setSec0] = useState(defaultSize);
  const [sec1, setSec1] = useState(defaultSize);

  const [dragSale, setDragSale] = useState(null);
  const [ghostPos, setGhostPos] = useState(null);
  const bar0Y = useRef(0);
  const bar1Y = useRef(0);
  const bar0X = useRef(0);
  const bar1X = useRef(0);

  const [cookSale, setCookSale] = useState(null);
  const [showCook, setShowCook] = useState(false);
  const [detailSale, setDetailSale] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeIdx, setActiveIdx] = useState(0);

  const handleTap = (sale) => {
    if (sale.orderStatus === 'processing') { setCookSale(sale); setShowCook(true); }
    else { setDetailSale(sale); setShowDetail(true); }
  };

  const handleDragStart = (sale, layout) => {
    setDragSale(sale);
    setGhostPos({ x: layout.x, y: layout.y, width: layout.width, height: layout.height });
  };

  const handleDragMove = (pageX, pageY) => {
    setGhostPos(prev => prev ? { ...prev, x: pageX - prev.width / 2, y: pageY - prev.height / 2 } : prev);
  };

  const handleDragEnd = (sale, pageX, pageY) => {
    setDragSale(null);
    setGhostPos(null);
    if (!sale) return;
    const curIdx = KEYS.indexOf(sale.orderStatus || 'new');
    let targetIdx = curIdx;
    if (isLandscape) {
      if (pageX > bar1X.current) targetIdx = 2;
      else if (pageX > bar0X.current) targetIdx = 1;
      else targetIdx = 0;
    } else {
      if (pageY > bar1Y.current) targetIdx = 2;
      else if (pageY > bar0Y.current) targetIdx = 1;
      else targetIdx = 0;
    }
    if (targetIdx !== curIdx) updateSaleStatus(sale.id, KEYS[targetIdx]);
  };

  const scrollToSection = (idx) => {
    setActiveIdx(idx);
    sectionRefs.current[KEYS[idx]]?.measureLayout(
      scrollRef.current,
      (_, y) => scrollRef.current?.scrollTo({ y: y - 56, animated: true }),
      () => {}
    );
  };

  const renderSection = (key, orders) => {
    const sizeStyle = isLandscape
      ? { width: key === 'new' ? sec0 : key === 'processing' ? sec1 : undefined, flex: key === 'done' ? 1 : undefined }
      : { minHeight: key === 'new' ? sec0 : key === 'processing' ? sec1 : MIN_SECTION };

    return (
      <View key={key} ref={ref => sectionRefs.current[key] = ref} style={[styles.section, sizeStyle]}>
        {orders.length === 0 ? (
          <View style={[styles.emptySection, { borderColor: theme.cardBorder }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {key === 'new' ? 'Sin pedidos nuevos' : key === 'processing' ? 'Nada en proceso' : 'Ninguno listo aún'}
            </Text>
          </View>
        ) : key === 'done' ? (
          orders.map(s => (
            <CompactCard key={s.id} sale={s} theme={theme} onTap={handleTap} onReturn={(id) => updateSaleStatus(id, 'processing')} />
          ))
        ) : (
          orders.map(s => (
            <OrderCard key={s.id} sale={s} theme={theme} onTap={handleTap} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} />
          ))
        )}
      </View>
    );
  };

  const ghostStatus = dragSale ? (STATUS[dragSale.orderStatus] || STATUS.new) : STATUS.new;

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>PEDIDOS</Text>
          <View style={styles.headerIndex}>
            {KEYS.map((key, i) => {
              const count = key === 'new' ? newOrders.length : key === 'processing' ? processingOrders.length : doneOrders.length;
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

        <View style={[styles.hint, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}>
          <MaterialCommunityIcons name="dots-grid" size={13} color={theme.textMuted} />
          <Text style={[styles.hintText, { color: theme.textMuted }]}>Presioná 1 seg para arrastrar · Tocá para ver detalle</Text>
        </View>

        {isLandscape ? (
          <View style={styles.landscapeContainer}>
            {renderSection('new', newOrders)}
            <DividerBar label={STATUS.processing.label} color={STATUS.processing.color} theme={theme} isLandscape onDrag={d => setSec0(p => Math.max(MIN_SECTION, p + d))} onLayout={e => { bar0X.current = e.nativeEvent.layout.x; }} />
            {renderSection('processing', processingOrders)}
            <DividerBar label={STATUS.done.label} color={STATUS.done.color} theme={theme} isLandscape onDrag={d => setSec1(p => Math.max(MIN_SECTION, p + d))} onLayout={e => { bar1X.current = e.nativeEvent.layout.x; }} />
            {renderSection('done', doneOrders)}
          </View>
        ) : (
          <ScrollView ref={scrollRef} contentContainerStyle={styles.portraitContainer} showsVerticalScrollIndicator={false}>
            {renderSection('new', newOrders)}
            <DividerBar label={STATUS.processing.label} color={STATUS.processing.color} theme={theme} isLandscape={false} onDrag={d => setSec0(p => Math.max(MIN_SECTION, p + d))} onLayout={e => { bar0Y.current = e.nativeEvent.layout.y; }} />
            {renderSection('processing', processingOrders)}
            <DividerBar label={STATUS.done.label} color={STATUS.done.color} theme={theme} isLandscape={false} onDrag={d => setSec1(p => Math.max(MIN_SECTION, p + d))} onLayout={e => { bar1Y.current = e.nativeEvent.layout.y; }} />
            {renderSection('done', doneOrders)}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {dragSale && ghostPos && (
          <View pointerEvents="none" style={[styles.ghost, { top: ghostPos.y, left: ghostPos.x, width: ghostPos.width, backgroundColor: theme.card, borderColor: ghostStatus.color }]}>
            <View style={[styles.cardStripe, { backgroundColor: ghostStatus.color }]} />
            <View style={styles.cardBody}>
              <Text style={[styles.cardNum, { color: ghostStatus.color }]}>#{dragSale.orderNumber || dragSale.id?.slice(-4)}</Text>
              <Text style={[styles.cardProduct, { color: theme.text }]} numberOfLines={1}>{dragSale.productName}</Text>
              <Text style={[styles.cardMeta, { color: theme.textMuted }]}>{dragSale.size} · {dragSale.quantity}x</Text>
            </View>
          </View>
        )}
      </SafeAreaView>

      <CookModal sale={cookSale} visible={showCook} onClose={() => setShowCook(false)} onDone={(id) => updateSaleStatus(id, 'done')} theme={theme} />
      <OrderDetailModal sale={detailSale} visible={showDetail} onClose={() => setShowDetail(false)} onMove={updateSaleStatus} theme={theme} />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
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
  cardNum: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 3 },
  cardProduct: { fontSize: 15, fontWeight: '800' },
  cardMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  cardTimer: { fontSize: 11, fontWeight: '800' },
  cardExtras: { fontSize: 11, fontWeight: '500', marginTop: 6 },
  cardFlavors: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  cardFlavorDot: { width: 10, height: 10, borderRadius: 5 },
  cardFlavorMore: { fontSize: 10, fontWeight: '600' },
  ghost: { position: 'absolute', zIndex: 9999, borderRadius: 14, borderWidth: 2, flexDirection: 'row', overflow: 'hidden', transform: [{ rotate: '2deg' }, { scale: 1.05 }], shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 20 },
  compactCard: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  compactStripe: { width: 3, alignSelf: 'stretch' },
  compactBody: { paddingHorizontal: 10, paddingVertical: 10 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compactNum: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  compactName: { flex: 1, fontSize: 13, fontWeight: '700' },
  compactMeta: { fontSize: 11, fontWeight: '500' },
  compactTimer: { fontSize: 11, fontWeight: '700', marginRight: 4 },
  compactExpanded: { paddingHorizontal: 10, paddingBottom: 10, borderTopWidth: 1, paddingTop: 8, gap: 8 },
  returnBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  returnBtnText: { fontSize: 12, fontWeight: '700' },
});

const cookStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '95%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  numSection: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 2, marginHorizontal: 20 },
  numLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 4, marginBottom: 4 },
  numBig: { fontSize: 72, fontWeight: '900', letterSpacing: -4 },
  timer: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  infoBar: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoItem: { flex: 1, padding: 12, alignItems: 'center' },
  infoDivider: { width: 1 },
  infoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  infoValueBig: { fontSize: 24, fontWeight: '900' },
  pageIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  pageDot: { height: 8, borderRadius: 4 },
  unitPage: { flex: 1, marginHorizontal: 16, marginTop: 8 },
  unitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 4 },
  unitHeaderText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  unitDoneCheck: { color: '#fff', fontSize: 16, fontWeight: '900' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  flavorsSection: { padding: 16 },
  flavorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flavorBlock: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, minWidth: 90, alignItems: 'center' },
  flavorBlockText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  toppingsSection: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12 },
  toppingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toppingBlock: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  toppingBlockText: { fontSize: 13, fontWeight: '700' },
  noteBox: { margin: 16, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, backgroundColor: '#FFF9C4', borderColor: '#F9A825', borderWidth: 1 },
  noteIcon: { fontSize: 16 },
  noteText: { fontSize: 13, fontWeight: '600', flex: 1, color: '#5D4037' },
  emptyUnit: { margin: 16, borderRadius: 10, padding: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  emptyUnitText: { fontSize: 13, fontWeight: '500' },
  unitDoneBanner: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitDoneBannerText: { fontSize: 13, fontWeight: '700' },
  nextUnitText: { fontSize: 13, fontWeight: '700' },
  swipeArea: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  swipeHintText: { fontSize: 13, fontWeight: '600' },
  footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, gap: 8 },
  doneBtn: { borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  doneBtnLocked: { color: '#fff', fontSize: 14, fontWeight: '700' },
  closeLink: { paddingVertical: 8, alignItems: 'center' },
  closeLinkText: { fontSize: 13, fontWeight: '500' },
});

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  orderNum: { fontSize: 16, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, marginBottom: 16 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  productName: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  divider: { height: 1, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, fontWeight: '600' },
  rowValue: { fontSize: 13, fontWeight: '700' },
  blockTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  unitCard: { borderRadius: 14, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  unitBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unitBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  unitTitle: { fontSize: 14, fontWeight: '700' },
  subLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  flavorChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  flavorChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  toppingChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  noteBox: { borderRadius: 10, padding: 10, borderWidth: 1 },
  actionBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});