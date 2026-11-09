import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Path,
} from "react-native-svg";
import { C } from "./theme";
const { width: W } = Dimensions.get("window");
const stars = Array.from({ length: 88 }, (_, i) => ({
  x: (i * 73.37 + 17) % 100,
  y: (i * 39.71 + 23) % 100,
  r: i % 9 === 0 ? 1.6 : 0.6,
  opacity: 0.25 + (i % 6) * 0.11,
}));
export function Space({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[{ flex: 1, backgroundColor: C.bg }, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["#130d31", "#0c0a24", "#1b1234", "#090719"]}
          style={StyleSheet.absoluteFill}
        />
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <RadialGradient id="nebula">
              <Stop offset="0" stopColor="#6e3ca6" stopOpacity=".35" />
              <Stop offset="1" stopColor="#6e3ca6" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="68" cy="38" r="58" fill="url(#nebula)" />
          {stars.map((s, i) => (
            <Circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r * 0.13}
              fill="#f7e9ff"
              opacity={s.opacity}
            />
          ))}
        </Svg>
      </View>
      {children}
    </View>
  );
}
export function Title({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text
      style={[
        {
          fontSize: 34,
          fontWeight: "600",
          color: C.white,
          letterSpacing: -1.4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Sub({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text style={[{ fontSize: 13, color: C.muted, lineHeight: 21 }, style]}>
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: 32,
          overflow: "hidden",
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          borderWidth: secondary ? 1 : 0,
          borderColor: "#b994e177",
        },
      ]}
    >
      {secondary ? (
        <View
          style={{
            padding: 17,
            alignItems: "center",
            backgroundColor: "#ffffff0b",
          }}
        >
          <Text style={{ color: C.white, fontWeight: "700" }}>{label}</Text>
        </View>
      ) : (
        <LinearGradient
          colors={["#e8b3f7", "#ad85f5", "#e9a7cb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 17, alignItems: "center" }}
        >
          <Text style={{ color: "#211333", fontWeight: "800" }}>{label}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}
export function Glass({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: "#201934d9",
          borderWidth: 1,
          borderColor: "#d8b7ff30",
          borderRadius: 24,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Orb({ size = 140 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, []);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [
          {
            translateY: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10],
            }),
          },
        ],
      }}
    >
      <LinearGradient
        colors={["#f6c4ff", "#9564dc", "#402775", "#15122d"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: "#e9c9ff88",
          shadowColor: "#ba81ff",
          shadowOpacity: 0.9,
          shadowRadius: 45,
          elevation: 18,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 1.35,
          height: size * 0.4,
          borderWidth: 1.5,
          borderColor: "#eac1ff99",
          borderRadius: size,
          top: size * 0.3,
          left: -size * 0.17,
          transform: [{ rotate: "-25deg" }],
        }}
      />
    </Animated.View>
  );
}
