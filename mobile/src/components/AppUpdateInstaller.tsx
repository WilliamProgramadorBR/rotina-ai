import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import * as Updates from "expo-updates";

import { colors, fonts, radius, shadow, spacing, scaledFont } from "../theme";
import { useThemeMode } from "../context/ThemeContext";

type UpdateStep = "downloading" | "restarting";

const stepCopy: Record<UpdateStep, { title: string; detail: string; progress: `${number}%` }> = {
  downloading: {
    title: "Baixando atualizacao",
    detail: "Preparando a nova versao do app.",
    progress: "68%"
  },
  restarting: {
    title: "Aplicando atualizacao",
    detail: "Finalizando a instalacao.",
    progress: "100%"
  }
};

function canCheckForUpdates() {
  return !__DEV__ && Platform.OS !== "web" && Updates.isEnabled;
}

export function AppUpdateInstaller() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<UpdateStep>("downloading");
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const { theme } = useThemeMode();

  useEffect(() => {
    if (!canCheckForUpdates()) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (cancelled || !update.isAvailable) return;

        setStep("downloading");
        setVisible(true);

        await Updates.fetchUpdateAsync();

        if (cancelled) return;

        setStep("restarting");
        await new Promise((resolve) => setTimeout(resolve, 800));
        await Updates.reloadAsync();
      } catch (error) {
        console.log("[APP UPDATE ERROR]", error);

        if (!cancelled) {
          setVisible(false);
        }
      }
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    spin.setValue(0);
    pulse.setValue(0);

    const spinAnimation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 820,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 820,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    spinAnimation.start();
    pulseAnimation.start();

    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, [pulse, spin, visible]);

  const copy = stepCopy[step];
  const panelWidth = Math.min(width - spacing.xl * 2, 360);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08]
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1]
  });

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={[styles.panel, { width: panelWidth, backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.animationStage}>
            <Animated.View style={[styles.orbit, { transform: [{ rotate }] }]}>
              <View style={styles.orbitDot} />
            </Animated.View>
            <Animated.View
              style={[
                styles.badge,
                {
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }]
                }
              ]}
            >
              <Text style={[styles.badgeText, { fontSize: scaledFont(17, width) }]}>AI</Text>
            </Animated.View>
          </View>

          <Text style={[styles.heading, { color: theme.text, fontSize: scaledFont(20, width) }]}>
            Atualizando Rotina AI
          </Text>
          <Text style={[styles.title, { color: theme.primary, fontSize: scaledFont(15, width) }]}>
            {copy.title}
          </Text>
          <Text style={[styles.detail, { color: theme.textMuted, fontSize: scaledFont(13, width) }]}>
            {copy.detail}
          </Text>

          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: copy.progress }]} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 11, 22, 0.62)",
    padding: spacing.xl
  },
  panel: {
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    ...shadow.medium
  },
  animationStage: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  orbit: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    borderTopColor: colors.primary,
    borderRightColor: colors.accent
  },
  orbitDot: {
    position: "absolute",
    top: 5,
    right: 18,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    ...shadow.glow
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.title
  },
  heading: {
    color: colors.text,
    fontFamily: fonts.title,
    textAlign: "center"
  },
  title: {
    color: colors.primary,
    fontFamily: fonts.bold,
    marginTop: spacing.sm,
    textAlign: "center"
  },
  detail: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.lg,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary
  }
});
