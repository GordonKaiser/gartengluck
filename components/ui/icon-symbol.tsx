// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping for Hofmarkt App
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "magnifyingglass": "search",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "gearshape.fill": "settings",
  "gearshape": "settings",
  // Actions
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  // Location
  "location.fill": "location-on",
  "location": "location-on",
  "map.fill": "map",
  "map.circle.fill": "map",
  "list.bullet.rectangle": "view-list",
  // Shop / Markt
  "cart.fill": "shopping-cart",
  "cart": "shopping-cart",
  "bag.fill": "shopping-bag",
  "storefront.fill": "storefront",
  "storefront": "storefront",
  // Hof / Natur
  "leaf.fill": "eco",
  "leaf": "eco",
  "sun.max.fill": "wb-sunny",
  // Info
  "info.circle.fill": "info",
  "info.circle": "info-outline",
  "exclamationmark.circle.fill": "error",
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  // Misc
  "star.fill": "star",
  "star": "star-border",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "link": "link",
  "square.and.arrow.up": "share",
  "arrow.clockwise": "refresh",
  // Bestellungen
  "list.bullet": "receipt-long",
  "clock.fill": "schedule",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
