import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isPhone = width <= 680;
  const isTablet = width > 680 && width <= 1024;
  const isDesktop = width > 1024;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop
  };
}