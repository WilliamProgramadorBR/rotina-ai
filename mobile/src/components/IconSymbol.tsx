import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

export type IconSymbolName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type IconSymbolProps = {
  name: IconSymbolName | string;
  size?: number;
  color?: string;
  style?: ComponentProps<typeof MaterialCommunityIcons>["style"];
};

export function IconSymbol({ name, size = 20, color = "#111827", style }: IconSymbolProps) {
  return (
    <MaterialCommunityIcons
      name={name as IconSymbolName}
      size={size}
      color={color}
      style={style}
    />
  );
}

type IconFrameProps = IconSymbolProps & {
  backgroundColor?: string;
  borderColor?: string;
  frameStyle?: StyleProp<ViewStyle>;
};

export function IconFrame({
  name,
  size = 20,
  color = "#111827",
  backgroundColor = "transparent",
  borderColor = "transparent",
  frameStyle
}: IconFrameProps) {
  return (
    <View
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          borderColor,
          borderWidth: 1
        },
        frameStyle
      ]}
    >
      <IconSymbol name={name} size={size} color={color} />
    </View>
  );
}
