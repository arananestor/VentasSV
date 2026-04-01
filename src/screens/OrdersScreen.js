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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [elapsed, setElapsed] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [completedUnits, setCompletedUnits] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Animaciones de transición entre páginas
  const slideAnim = useRef(new Animated.Value(0)).current;
  // Animación del fondo verde (última unidad)
  const greenAnim = useRef(new Animated.Value(0)).current;
  // Animación del check (última unidad)
  const checkAnim = useRef(new Animated.Value(0)).current;
  // Animación burbuja scroll-to-button
  const scrollBtnAnim = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef(null);

  // Reset al abrir
  useEffect(() => {
    if (!visible || !sale) return;
    setCurrentPage(0);
    setCompletedUnits([]);
    setUnlocked(false);
    setShowScrollBtn(false);
    slideAnim.setValue(0);
    greenAnim.setValue(0);
    checkAnim.setValue(0);
    scrollBtnAnim.setValue(0);
  }, [visible, sale?.id]);

  // Timer
  useEffect(() => {
    if (!visible || !sale?.processingStartedAt) return;
    const iv = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(sale.processingStartedAt)) / 1000);
      setElapsed(
        `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(iv);
  }, [visible, sale?.processingStartedAt]);

  // Burbuja scroll cuando se desbloquea
  useEffect(() => {
    if (unlocked) {
      setShowScrollBtn(true);
      Animated.spring(scrollBtnAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 140,
        friction: 7,
      }).start();
    }
  }, [unlocked]);

  // Hooks siempre antes del guard
  if (!sale) return null;

  const pages = sale.units?.length > 0
    ? sale.units
    : [{ flavors: [], toppings: sale.toppings || [], note: sale.note }];
  const totalPages = pages.length;
  const isLastPage = currentPage === totalPages - 1;
  const currentUnit = pages[currentPage];

  // Altura explícita para que el swipeZone no colapse en el Modal
  // handle(20) + numSection(~118) + infoBar(~72) + pageIndicator(~32) + footer(~100) + gaps/margins(~40)
  const CHROME_HEIGHT = 382;
  const swipeZoneHeight = Math.min(windowHeight * 0.95, windowHeight) - CHROME_HEIGHT;

  // ── Animación de la última página: verde + check ────────
  const runLastPageAnimation = (callback) => {
    Animated.timing(greenAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: false,
    }).start(() => {
      Animated.spring(checkAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 130,
        friction: 6,
      }).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(greenAnim, { toValue: 0, duration: 260, useNativeDriver: false }),
            Animated.timing(checkAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false }),
          ]).start(() => callback());
        }, 550);
      });
    });
  };

  // ── Animación unidades intermedias: slide fluido ────────
  const runPageTransition = (nextPage) => {
    // Sale por la izquierda
    Animated.timing(slideAnim, {
      toValue: -windowWidth,
      duration: 210,
      useNativeDriver: false,
    }).start(() => {
      // Entra desde la derecha
      slideAnim.setValue(windowWidth * 0.18);
      setCurrentPage(nextPage);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 160,
        friction: 14,
      }).start();
    });
  };

  // ── PanResponder de swipe ───────────────────────────────
  const swipePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8 && gs.dx < 0,
    onPanResponderMove: (_, gs) => {
      if (gs.dx < 0) {
        slideAnim.setValue(gs.dx);
        // En la última unidad, fondo verde progresivo al arrastrar
        if (isLastPage) {
          const progress = Math.min(Math.abs(gs.dx) / (windowWidth * 0.35), 1);
          greenAnim.setValue(progress);
        }
      }
    },
    onPanResponderRelease: (_, gs) => {
      const threshold = -(windowWidth * 0.28);
      if (gs.dx < threshold) {
        if (isLastPage) {
          Animated.timing(slideAnim, {
            toValue: -windowWidth,
            duration: 190,
            useNativeDriver: false,
          }).start(() => {
            runLastPageAnimation(() => {
              setCompletedUnits(prev => [...prev, currentPage]);
              setUnlocked(true);
            });
          });
        } else {
          setCompletedUnits(prev => [...prev, currentPage]);
          runPageTransition(currentPage + 1);
        }
      } else {
        // Rebote suave de regreso
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
            tension: 180,
            friction: 12,
          }),
          ...(isLastPage
            ? [Animated.timing(greenAnim, { toValue: 0, duration: 200, useNativeDriver: false })]
            : []),
        ]).start();
      }
    },
  });

  const greenBg = greenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.card, STATUS.done.color],
  });

  const checkScale = checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const checkOpacity = checkAnim;

  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
    Animated.timing(scrollBtnAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setShowScrollBtn(false));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={cookStyles.overlay}>
        <View style={[cookStyles.sheet, { backgroundColor: theme.bg }]}>

          {/* Handle */}
          <View style={[cookStyles.handle, { backgroundColor: theme.cardBorder }]} />

          {/* Número + timer — siempre visible */}
          <View style={[cookStyles.numSection, { borderBottomColor: STATUS.processing.color + '30' }]}>
            <View style={cookStyles.numRow}>
              <View>
                <Text style={[cookStyles.numLabel, { color: theme.textMuted }]}>PEDIDO EN PREPARACIÓN</Text>
                <Text style={[cookStyles.numBig, { color: theme.text }]}>
                  #{sale.orderNumber || sale.id?.slice(-4)}
                </Text>
              </View>
              {elapsed ? (
                <View style={[cookStyles.timerPill, { backgroundColor: STATUS.processing.color + '18', borderColor: STATUS.processing.color + '40' }]}>
                  <Feather name="clock" size={13} color={STATUS.processing.color} />
                  <Text style={[cookStyles.timerText, { color: STATUS.processing.color }]}>{elapsed}</Text>
                </View>
              ) : null}
            </View>

            {/* Info rápida: producto, tamaño, cantidad */}
            <View style={[cookStyles.infoBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={cookStyles.infoItem}>
                <Text style={[cookStyles.infoLabel, { color: theme.textMuted }]}>PRODUCTO</Text>
                <Text style={[cookStyles.infoValue, { color: theme.text }]} numberOfLines={1}>
                  {sale.productName}
                </Text>
              </View>
              <View style={[cookStyles.infoDivider, { backgroundColor: theme.cardBorder }]} />
              <View style={cookStyles.infoItem}>
                <Text style={[cookStyles.infoLabel, { color: theme.textMuted }]}>TAMAÑO</Text>
                <Text style={[cookStyles.infoValue, { color: theme.text }]}>{sale.size}</Text>
              </View>
              <View style={[cookStyles.infoDivider, { backgroundColor: theme.cardBorder }]} />
              <View style={cookStyles.infoItem}>
                <Text style={[cookStyles.infoLabel, { color: theme.textMuted }]}>CANT.</Text>
                <Text style={[cookStyles.infoValueAccent, { color: STATUS.processing.color }]}>
                  {sale.quantity}x
                </Text>
              </View>
            </View>
          </View>

          {/* Indicador de páginas */}
          {totalPages > 1 && (
            <View style={cookStyles.pageIndicator}>
              {pages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    cookStyles.pageDot,
                    {
                      backgroundColor: completedUnits.includes(i)
                        ? STATUS.done.color
                        : i === currentPage
                          ? STATUS.processing.color
                          : theme.cardBorder,
                      width: i === currentPage ? 22 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* ── ZONA SWIPE: altura explícita para que no colapse ── */}
          <Animated.View
            style={[
              cookStyles.swipeZone,
              {
                height: swipeZoneHeight,
                backgroundColor: greenBg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            {/* Check overlay — solo última unidad */}
            <Animated.View
              style={[
                cookStyles.checkOverlay,
                { opacity: checkOpacity, transform: [{ scale: checkScale }] },
              ]}
              pointerEvents="none"
            >
              <View style={[cookStyles.checkCircle, { borderColor: 'rgba(255,255,255,0.6)' }]}>
                <Feather name="check" size={52} color="#fff" />
              </View>
              <Text style={cookStyles.checkLabel}>UNIDAD COMPLETADA</Text>
            </Animated.View>

            {/* Slide del contenido */}
            <Animated.View
              style={[cookStyles.unitSlide, { transform: [{ translateX: slideAnim }] }]}
              {...swipePanResponder.panHandlers}
            >
              {/* Header de unidad */}
              <View style={[cookStyles.unitHeader, { backgroundColor: STATUS.processing.color }]}>
                <View style={cookStyles.unitHeaderLeft}>
                  <View style={cookStyles.unitBadge}>
                    <Text style={cookStyles.unitBadgeText}>{currentPage + 1}</Text>
                  </View>
                  <Text style={cookStyles.unitHeaderText}>
                    {totalPages > 1
                      ? `UNIDAD ${currentPage + 1} DE ${totalPages}`
                      : 'PREPARAR'}
                  </Text>
                </View>
                <View style={cookStyles.swipeHintRow}>
                  <Feather name="chevrons-left" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={cookStyles.swipeHintText}>confirmar</Text>
                </View>
              </View>

              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                contentContainerStyle={cookStyles.unitScroll}
              >
                {/* ── COMPONENTES / SABORES ── */}
                {currentUnit.flavors?.length > 0 ? (
                  <View style={cookStyles.section}>
                    <View style={cookStyles.sectionHeader}>
                      <MaterialCommunityIcons name="blender-outline" size={13} color={theme.textMuted} />
                      <Text style={[cookStyles.sectionLabel, { color: theme.textMuted }]}>COMPONENTES</Text>
                    </View>
                    <View style={cookStyles.flavorsGrid}>
                      {currentUnit.flavors.map((f, fi) => (
                        <View
                          key={fi}
                          style={[cookStyles.flavorBlock, { backgroundColor: f.color || '#888' }]}
                        >
                          <Text style={cookStyles.flavorBlockText}>{f.name || f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={[cookStyles.emptyBox, { borderColor: theme.cardBorder }]}>
                    <Text style={[cookStyles.emptyBoxText, { color: theme.textMuted }]}>
                      Sin componentes
                    </Text>
                  </View>
                )}

                {/* ── EXTRAS / TOPPINGS ── */}
                {currentUnit.toppings?.length > 0 && (
                  <View style={[cookStyles.section, cookStyles.sectionBorder, { borderTopColor: theme.cardBorder }]}>
                    <View style={cookStyles.sectionHeader}>
                      <MaterialCommunityIcons name="plus-circle-outline" size={13} color={theme.textMuted} />
                      <Text style={[cookStyles.sectionLabel, { color: theme.textMuted }]}>EXTRAS</Text>
                    </View>
                    <View style={cookStyles.toppingsGrid}>
                      {currentUnit.toppings.map((t, ti) => (
                        <View
                          key={ti}
                          style={[
                            cookStyles.toppingBlock,
                            { backgroundColor: theme.bg, borderColor: theme.cardBorder },
                          ]}
                        >
                          <Text style={[cookStyles.toppingBlockText, { color: theme.text }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* ── NOTA ── */}
                {(currentUnit.note || currentUnit.notes) ? (
                  <View style={[cookStyles.noteBox, { backgroundColor: theme.card, borderColor: '#F9A825' }]}>
                    <Text style={cookStyles.noteIcon}>📝</Text>
                    <Text style={cookStyles.noteText}>
                      {currentUnit.note || currentUnit.notes}
                    </Text>
                  </View>
                ) : null}

                {/* Sin nada */}
                {!currentUnit.flavors?.length &&
                  !currentUnit.toppings?.length &&
                  !currentUnit.note &&
                  !currentUnit.notes && (
                    <View style={[cookStyles.emptyBox, { borderColor: theme.cardBorder, marginTop: 0 }]}>
                      <Text style={[cookStyles.emptyBoxText, { color: theme.textMuted }]}>
                        Sin detalles adicionales
                      </Text>
                    </View>
                  )}

                <View style={{ height: 32 }} />
              </ScrollView>
            </Animated.View>
          </Animated.View>

          {/* ── Burbuja scroll-to-button ── */}
          {showScrollBtn && (
            <Animated.View
              style={[
                cookStyles.scrollBtn,
                {
                  opacity: scrollBtnAnim,
                  transform: [{ scale: scrollBtnAnim }],
                },
              ]}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                style={[cookStyles.scrollBtnInner, { backgroundColor: STATUS.done.color }]}
                onPress={scrollToBottom}
                activeOpacity={0.85}
              >
                <Feather name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── FOOTER: botón LISTO ── */}
          <View style={[cookStyles.footer, { borderTopColor: theme.cardBorder, backgroundColor: theme.bg }]}>
            <TouchableOpacity
              style={[
                cookStyles.doneBtn,
                {
                  backgroundColor: unlocked ? STATUS.done.color : theme.card,
                  borderColor: unlocked ? STATUS.done.color : theme.cardBorder,
                },
              ]}
              onPress={() => {
                if (unlocked) { onDone(sale.id); onClose(); }
              }}
              disabled={!unlocked}
              activeOpacity={0.85}
            >
              {unlocked ? (
                <View style={cookStyles.doneBtnContent}>
                  <Feather name="check-circle" size={20} color="#fff" />
                  <Text style={cookStyles.doneBtnText}>PEDIDO LISTO</Text>
                </View>
              ) : (
                <View style={cookStyles.doneBtnContent}>
                  <Feather name="lock" size={15} color={theme.textMuted} />
                  <Text style={[cookStyles.doneBtnLocked, { color: theme.textMuted }]}>
                    Confirmá todas las unidades ({completedUnits.length}/{totalPages})
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={cookStyles.closeLink} onPress={onClose}>
              <Text style={[cookStyles.closeLinkText, { color: theme.textMuted }]}>
                Cerrar sin marcar como listo
              </Text>
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
                        <Text style={[detailStyles.subLabel, { color: theme.textMuted }]}>COMPONENTES</Text>
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
                `¿Regresar #${sale.orderNumber || sale.id?.slice(-4)} a "En proceso"?`,
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
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '95%', overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },

  // Sección número + timer
  numSection: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  numRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  numLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  numBig: { fontSize: 52, fontWeight: '900', letterSpacing: -3, lineHeight: 56 },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  timerText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Info bar horizontal
  infoBar: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoItem: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  infoDivider: { width: 1 },
  infoLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 2, marginBottom: 3 },
  infoValue: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  infoValueAccent: { fontSize: 20, fontWeight: '900' },

  // Puntos indicadores de página
  pageIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10 },
  pageDot: { height: 8, borderRadius: 4 },

  // Zona de swipe — altura explícita evita el colapso en Modal
  swipeZone: { marginHorizontal: 16, marginBottom: 8, borderRadius: 18, overflow: 'hidden', borderWidth: 1, position: 'relative' },

  // Check overlay (última unidad)
  checkOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  checkCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, marginBottom: 10 },
  checkLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 3, opacity: 0.9 },

  // Slide del contenido de unidad
  unitSlide: { flex: 1 },
  unitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, margin: 6, marginBottom: 0, borderRadius: 12 },
  unitHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  unitBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  unitHeaderText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  swipeHintRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  swipeHintText: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '600' },

  unitScroll: { paddingBottom: 16 },

  // Secciones de contenido
  section: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  sectionBorder: { borderTopWidth: 1, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },

  flavorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flavorBlock: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, minWidth: 70, alignItems: 'center' },
  flavorBlockText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  toppingsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toppingBlock: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  toppingBlockText: { fontSize: 13, fontWeight: '700' },

  noteBox: { marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, borderWidth: 1 },
  noteIcon: { fontSize: 15 },
  noteText: { fontSize: 13, fontWeight: '600', flex: 1, color: '#5D4037' },

  emptyBox: { marginHorizontal: 16, marginTop: 14, borderRadius: 12, padding: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  emptyBoxText: { fontSize: 13, fontWeight: '500' },

  // Burbuja scroll-to-button
  scrollBtn: { position: 'absolute', bottom: 104, right: 24, zIndex: 100 },
  scrollBtnInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },

  // Footer
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, gap: 8 },
  doneBtn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center', borderWidth: 1 },
  doneBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  doneBtnLocked: { fontSize: 13, fontWeight: '600' },
  closeLink: { paddingVertical: 4, alignItems: 'center' },
  closeLinkText: { fontSize: 12, fontWeight: '500' },
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