import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useSyncStore } from '../../store/syncStore';

export const OfflineBanner: React.FC = () => {
  const isOnline = useSyncStore((state) => state.isOnline);
  const pendingSyncCount = useSyncStore((state) => state.pendingSyncCount);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? -100 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [isOnline, translateY]);

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        isOnline ? styles.syncing : styles.offline,
        { transform: [{ translateY }] },
      ]}
    >
      <Icon
        name={isOnline ? 'sync' : 'wifi-off'}
        size={18}
        color={Colors.textLight}
        style={styles.icon}
      />
      <Text style={styles.text}>
        {isOnline
          ? `Syncing ${pendingSyncCount} pending change${pendingSyncCount !== 1 ? 's' : ''}...`
          : 'You are offline. Changes will sync when connected.'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  offline: {
    backgroundColor: Colors.warning,
  },
  syncing: {
    backgroundColor: Colors.info,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    ...Typography.caption,
    color: Colors.textLight,
    flex: 1,
    textAlign: 'center',
  },
});
