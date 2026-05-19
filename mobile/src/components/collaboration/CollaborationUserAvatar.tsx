import { memo, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme";

type AvatarUser = {
  name?: string | null;
  avatarUrl?: string | null;
} | null | undefined;

export function getUserInitials(name?: string | null) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "?";
}

type CollaborationUserAvatarProps = {
  user: AvatarUser;
  size: number;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  statusColor?: string;
  statusBorderColor?: string;
};

export const CollaborationUserAvatar = memo(function CollaborationUserAvatar({
  user,
  size,
  backgroundColor,
  borderColor,
  textColor,
  statusColor,
  statusBorderColor
}: CollaborationUserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = user?.avatarUrl || "";
  const radius = size / 2;
  const showImage = Boolean(avatarUrl && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor,
          borderColor
        }
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: avatarUrl }}
          onError={() => setImageFailed(true)}
          style={[
            styles.image,
            {
              borderRadius: radius
            }
          ]}
        />
      ) : (
        <Text style={[styles.initials, { color: textColor, fontSize: Math.max(10, Math.round(size * 0.34)) }]}>
          {getUserInitials(user?.name)}
        </Text>
      )}

      {statusColor ? (
        <View
          style={[
            styles.status,
            {
              backgroundColor: statusColor,
              borderColor: statusBorderColor || backgroundColor
            }
          ]}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  initials: {
    fontFamily: fonts.title
  },
  status: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2
  }
});
