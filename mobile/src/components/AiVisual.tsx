import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { aiColors, colors, fonts, radius, shadow, spacing } from "../theme";
import { IconFrame, IconSymbolName } from "./IconSymbol";

type AiPanelProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: IconSymbolName | string;
  metric?: string;
  metricLabel?: string;
  tone?: "blue" | "violet" | "cyan" | "green" | "amber";
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const toneMap = {
  blue: { color: aiColors.cobalt, soft: "rgba(37,99,235,0.14)", border: "rgba(37,99,235,0.28)" },
  violet: { color: aiColors.violet, soft: "rgba(124,58,237,0.14)", border: "rgba(124,58,237,0.28)" },
  cyan: { color: aiColors.cyan, soft: "rgba(6,182,212,0.14)", border: "rgba(6,182,212,0.28)" },
  green: { color: aiColors.mint, soft: "rgba(16,185,129,0.14)", border: "rgba(16,185,129,0.28)" },
  amber: { color: aiColors.amber, soft: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.28)" }
};

export function AiPanel({
  eyebrow = "ROTINA AI",
  title,
  description,
  icon = "auto-fix",
  metric,
  metricLabel,
  tone = "blue",
  compact,
  style,
  children
}: AiPanelProps) {
  const current = toneMap[tone];

  return (
    <View style={[styles.panel, compact && styles.panelCompact, style]}>
      <View style={styles.visualLayer} pointerEvents="none">
        <View style={[styles.traceLine, styles.traceLineOne]} />
        <View style={[styles.traceLine, styles.traceLineTwo]} />
        <View style={[styles.traceLine, styles.traceLineThree]} />
        <View style={[styles.node, styles.nodeOne, { backgroundColor: current.color }]} />
        <View style={[styles.node, styles.nodeTwo, { backgroundColor: aiColors.cyan }]} />
        <View style={[styles.node, styles.nodeThree, { backgroundColor: aiColors.mint }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.eyebrowRow}>
            <IconFrame
              name={icon}
              size={compact ? 18 : 22}
              color={current.color}
              backgroundColor={current.soft}
              borderColor={current.border}
              frameStyle={compact ? styles.iconFrameCompact : styles.iconFrame}
            />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>

          {metric ? (
            <View style={styles.metricBox}>
              <Text style={styles.metric}>{metric}</Text>
              {metricLabel ? <Text style={styles.metricLabel}>{metricLabel}</Text> : null}
            </View>
          ) : null}
        </View>

        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </View>
  );
}

export function AiBadge({ label, tone = "blue" }: { label: string; tone?: keyof typeof toneMap }) {
  const current = toneMap[tone];

  return (
    <View style={[styles.badge, { backgroundColor: current.soft, borderColor: current.border }]}>
      <View style={[styles.badgeMark, { backgroundColor: current.color }]} />
      <Text style={[styles.badgeText, { color: current.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 148,
    borderRadius: radius.xl,
    backgroundColor: aiColors.panel,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    padding: spacing.xl,
    overflow: "hidden",
    ...shadow.medium
  },
  panelCompact: {
    minHeight: 126,
    borderRadius: radius.lg,
    padding: spacing.lg
  },
  visualLayer: {
    ...StyleSheet.absoluteFillObject
  },
  traceLine: {
    position: "absolute",
    height: 1,
    backgroundColor: aiColors.line
  },
  traceLineOne: {
    width: "62%",
    right: -24,
    top: 34,
    transform: [{ rotate: "-10deg" }]
  },
  traceLineTwo: {
    width: "54%",
    right: -8,
    top: 86,
    backgroundColor: aiColors.lineStrong,
    transform: [{ rotate: "7deg" }]
  },
  traceLineThree: {
    width: "44%",
    right: 28,
    bottom: 28,
    transform: [{ rotate: "-5deg" }]
  },
  node: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 3,
    opacity: 0.85
  },
  nodeOne: {
    right: 42,
    top: 30
  },
  nodeTwo: {
    right: 118,
    top: 82
  },
  nodeThree: {
    right: 72,
    bottom: 25
  },
  content: {
    position: "relative",
    zIndex: 1
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
    minWidth: 0
  },
  iconFrame: {
    width: 48,
    height: 48,
    borderRadius: 14
  },
  iconFrameCompact: {
    width: 40,
    height: 40,
    borderRadius: 12
  },
  eyebrow: {
    color: "#AAB4C8",
    fontFamily: fonts.bold,
    fontSize: 11
  },
  metricBox: {
    alignItems: "flex-end",
    minWidth: 68
  },
  metric: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 20
  },
  metricLabel: {
    color: "#AAB4C8",
    fontFamily: fonts.medium,
    fontSize: 11
  },
  title: {
    color: colors.white,
    fontFamily: fonts.title,
    fontSize: 24,
    lineHeight: 30,
    marginTop: spacing.lg,
    maxWidth: 620
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 26,
    marginTop: spacing.md
  },
  description: {
    color: "#CBD5E1",
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 620
  },
  children: {
    marginTop: spacing.lg
  },
  badge: {
    minHeight: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start"
  },
  badgeMark: {
    width: 6,
    height: 6,
    borderRadius: 2
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11
  }
});
