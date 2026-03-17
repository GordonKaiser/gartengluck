/**
 * LocaBuy – Karten-Ansicht
 * Zeigt alle Suchergebnisse als Pins auf einer interaktiven Karte.
 * Wird als Modal über die Suche geöffnet.
 */

import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type HofSucheErgebnis } from "@/lib/hofmarkt-api";

// react-native-maps ist nicht auf Web verfügbar
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function KarteScreen() {
  const colors = useColors();
  const { daten, plz, ort } = useLocalSearchParams<{
    daten: string;
    plz: string;
    ort: string;
  }>();

  const [hoefen, setHoefen] = useState<HofSucheErgebnis[]>([]);
  const [ausgewaehlt, setAusgewaehlt] = useState<HofSucheErgebnis | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (daten) {
      try {
        const parsed = JSON.parse(daten) as HofSucheErgebnis[];
        setHoefen(parsed);
      } catch {
        setHoefen([]);
      }
    }
  }, [daten]);

  // Mittelpunkt aus allen Hof-Koordinaten berechnen
  const region = (() => {
    const mitKoords = hoefen.filter((h) => h.lat && h.lon);
    if (mitKoords.length === 0) {
      return {
        latitude: 51.1657,
        longitude: 10.4515,
        latitudeDelta: 3,
        longitudeDelta: 3,
      };
    }
    const lats = mitKoords.map((h) => parseFloat(h.lat!));
    const lons = mitKoords.map((h) => parseFloat(h.lon!));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const padding = 0.3;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(maxLat - minLat + padding, 0.1),
      longitudeDelta: Math.max(maxLon - minLon + padding, 0.1),
    };
  })();

  const s = styles(colors);

  if (Platform.OS === "web") {
    return (
      <ScreenContainer className="flex-1">
        <View style={s.webHinweis}>
          <Text style={s.webHinweisText}>
            Die Karten-Ansicht ist nur auf iOS und Android verfügbar.
          </Text>
          <Pressable style={s.zurueckButton} onPress={() => router.back()}>
            <Text style={s.zurueckText}>← Zurück</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.zurueckButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={s.zurueckText}>← Zurück</Text>
        </Pressable>
        <Text style={s.titel} numberOfLines={1}>
          {hoefen.length} {hoefen.length === 1 ? "Hof" : "Höfe"} bei {ort || plz}
        </Text>
      </View>

      {/* Karte */}
      {MapView && (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        >
          {hoefen
            .filter((h) => h.lat && h.lon)
            .map((hof) => (
              <Marker
                key={hof.userId}
                coordinate={{
                  latitude: parseFloat(hof.lat!),
                  longitude: parseFloat(hof.lon!),
                }}
                title={hof.hofName}
                description={`${hof.ort} · ${hof.distanzKm.toFixed(1)} km`}
                pinColor={hof.hobbyAnbau ? "#22C55E" : colors.primary}
                onPress={() => setAusgewaehlt(hof)}
              />
            ))}
        </MapView>
      )}

      {/* Info-Karte für ausgewählten Hof */}
      {ausgewaehlt && (
        <View style={s.infoKarte}>
          <View style={s.infoKarteInhalt}>
            <View style={{ flex: 1 }}>
              <Text style={s.infoName} numberOfLines={1}>
                {ausgewaehlt.hofName}
              </Text>
              <Text style={s.infoOrt}>
                📍 {ausgewaehlt.ort} · {ausgewaehlt.distanzKm.toFixed(1)} km
                {ausgewaehlt.hobbyAnbau !== undefined && (
                  <Text style={{ color: ausgewaehlt.hobbyAnbau ? "#22C55E" : colors.primary }}>
                    {ausgewaehlt.hobbyAnbau ? "  🌿 Hobby" : "  🏪 Gewerbe"}
                  </Text>
                )}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                style={({ pressed }) => [s.infoButton, s.infoButtonPrimary, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  router.push({
                    pathname: "/hof/[id]" as any,
                    params: {
                      id: String(ausgewaehlt.userId),
                      userId: String(ausgewaehlt.userId),
                      hofName: ausgewaehlt.hofName,
                    },
                  });
                }}
              >
                <Text style={s.infoButtonTextPrimary}>Zum Hof</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.infoButton, pressed && { opacity: 0.6 }]}
                onPress={() => setAusgewaehlt(null)}
              >
                <Text style={s.infoButtonText}>✕</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Legende */}
      <View style={s.legende}>
        <View style={s.legendeItem}>
          <View style={[s.legendePunkt, { backgroundColor: "#22C55E" }]} />
          <Text style={s.legendeText}>Hobby-Anbieter</Text>
        </View>
        <View style={s.legendeItem}>
          <View style={[s.legendePunkt, { backgroundColor: colors.primary }]} />
          <Text style={s.legendeText}>Gewerblich</Text>
        </View>
      </View>
    </View>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "ios" ? 56 : 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      gap: 12,
    },
    zurueckButton: {
      paddingVertical: 4,
    },
    zurueckText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "500",
    },
    titel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
    },
    webHinweis: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 16,
    },
    webHinweisText: {
      fontSize: 16,
      color: colors.muted,
      textAlign: "center",
    },
    infoKarte: {
      position: "absolute",
      bottom: 40,
      left: 16,
      right: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    infoKarteInhalt: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    infoName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    infoOrt: {
      fontSize: 13,
      color: colors.muted,
    },
    infoButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    infoButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    infoButtonText: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: "600",
    },
    infoButtonTextPrimary: {
      fontSize: 14,
      color: "#fff",
      fontWeight: "600",
    },
    legende: {
      position: "absolute",
      top: Platform.OS === "ios" ? 110 : 70,
      right: 12,
      backgroundColor: colors.surface + "ee",
      borderRadius: 10,
      padding: 8,
      gap: 6,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    legendeItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendePunkt: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendeText: {
      fontSize: 11,
      color: colors.foreground,
      fontWeight: "500",
    },
  });
