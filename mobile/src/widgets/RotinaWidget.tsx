import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

export interface RotinaWidgetProps {
  userName: string;
  streakDays: number;
  completionRate: number;
  reminders: Array<{ time: string; title: string; done: boolean }>;
}

const BG = "#0F1117";
const PRIMARY = "#6366F1";
const TEXT = "#E5E7EB";
const MUTED = "#6B7280";
const DONE_COLOR = "#4B5563";
const STREAK_COLOR = "#F59E0B";
const RATE_COLOR = "#10B981";
const DIVIDER = "#1F2937";

export function RotinaWidget({ userName, streakDays, completionRate, reminders }: RotinaWidgetProps) {
  const rate = Math.round(completionRate * 100);
  const pending = reminders.filter((r) => !r.done).slice(0, 3);

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        backgroundColor: BG,
        borderRadius: 20,
        padding: 14,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <TextWidget
          text="Rotina AI"
          style={{ color: PRIMARY, fontSize: 11, fontFamily: "sans-serif-medium" }}
        />
        <FlexWidget
          clickAction="OPEN_APP"
          style={{
            backgroundColor: PRIMARY,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <TextWidget
            text="Abrir"
            style={{ color: "#FFFFFF", fontSize: 11, fontFamily: "sans-serif-medium" }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Greeting */}
      <TextWidget
        text={`Ola, ${userName}!`}
        style={{
          color: TEXT,
          fontSize: 15,
          fontFamily: "sans-serif-medium",
          marginBottom: 4,
        }}
        maxLines={1}
      />

      {/* Stats */}
      <FlexWidget style={{ flexDirection: "row", marginBottom: 10 }}>
        <TextWidget
          text={`${streakDays}d sequencia`}
          style={{ color: STREAK_COLOR, fontSize: 11, fontFamily: "sans-serif", marginRight: 14 }}
        />
        <TextWidget
          text={`${rate}% concluido`}
          style={{ color: RATE_COLOR, fontSize: 11, fontFamily: "sans-serif" }}
        />
      </FlexWidget>

      {/* Divider */}
      <FlexWidget style={{ height: 1, backgroundColor: DIVIDER, marginBottom: 8 }} />

      {/* Reminders */}
      {pending.length === 0 ? (
        <TextWidget
          text="Tudo concluido hoje!"
          style={{ color: RATE_COLOR, fontSize: 12, fontFamily: "sans-serif" }}
        />
      ) : (
        pending.map((r, i) => (
          <FlexWidget
            key={i}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: i < pending.length - 1 ? 5 : 0 }}
          >
            <TextWidget
              text={r.time}
              style={{
                color: MUTED,
                fontSize: 11,
                fontFamily: "sans-serif-light",
                marginRight: 8,
                width: 44,
              }}
            />
            <TextWidget
              text={r.title}
              style={{
                color: r.done ? DONE_COLOR : TEXT,
                fontSize: 12,
                fontFamily: "sans-serif",
              }}
              maxLines={1}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
