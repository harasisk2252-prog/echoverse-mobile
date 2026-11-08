import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Line } from "react-native-svg";
import {
  Plus,
  LockKeyhole,
  Users,
  Clock3,
  Info,
  Move,
} from "lucide-react-native";
import { Space, Title, Sub, Glass } from "../src/ui";
import { C, moods } from "../src/theme";
import { useMemories, Universe } from "../src/store";

export default function UniverseScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const GW = W * 1.35,
    GH = Math.max(H * 0.59, 420);
  const params = useLocalSearchParams<{ mode?: string }>();
  const { memories } = useMemories();
  const [mode, setMode] = useState<Universe>(
    params.mode === "shared" ? "shared" : "private",
  );
  const visible = useMemo(
    () => memories.filter((m) => m.universe === mode),
    [memories, mode],
  );
  const scale = useSharedValue(1),
    savedScale = useSharedValue(1),
    tx = useSharedValue(0),
    ty = useSharedValue(0),
    sx = useSharedValue(0),
    sy = useSharedValue(0);
  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      sx.value = tx.value;
      sy.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = sx.value + e.translationX;
      ty.value = sy.value + e.translationY;
    });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(2.5, Math.max(0.75, savedScale.value * e.scale));
    });
  const composed = Gesture.Simultaneous(pan, pinch);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));
  return (
    <Space>
      <View
        style={{ paddingTop: 60, paddingHorizontal: 23, paddingBottom: 13 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 13, color: C.lavender, letterSpacing: 2 }}>
              ✧ ECHOVERSE
            </Text>
            <Title style={{ fontSize: 30, marginTop: 4 }}>My Galaxy</Title>
          </View>
          <Pressable
            onPress={() => router.push("/about")}
            style={{
              backgroundColor: "#ffffff15",
              padding: 12,
              borderRadius: 30,
            }}
          >
            <Info color={C.white} size={19} />
          </Pressable>
        </View>
        <Sub style={{ marginTop: 8 }}>
          Every star is a moment worth remembering.
        </Sub>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#1f1739",
            borderRadius: 30,
            padding: 5,
            marginTop: 19,
            borderWidth: 1,
            borderColor: "#8b6ea944",
          }}
        >
          {(["private", "shared"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                setMode(m);
                scale.value = 1;
                tx.value = 0;
                ty.value = 0;
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                paddingVertical: 12,
                borderRadius: 25,
                backgroundColor: mode === m ? "#a57bd8" : "transparent",
              }}
            >
              {m === "private" ? (
                <LockKeyhole
                  size={16}
                  color={mode === m ? "#211333" : C.muted}
                />
              ) : (
                <Users size={16} color={mode === m ? "#211333" : C.muted} />
              )}
              <Text
                style={{
                  color: mode === m ? "#211333" : C.muted,
                  fontSize: 13,
                  fontWeight: "700",
                }}
              >
                {m === "private" ? "My Universe" : "Our Universe"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View
        style={{
          flex: 1,
          overflow: "hidden",
          borderTopWidth: 1,
          borderColor: "#e2c5ff15",
        }}
      >
        <GestureDetector gesture={composed}>
          <Animated.View
            style={[
              {
                position: "absolute",
                left: (W - GW) / 2,
                top: 10,
                width: GW,
                height: GH,
              },
              style,
            ]}
          >
            <Svg style={{ position: "absolute" }} width={GW} height={GH}>
              {visible.slice(1).map((m, i) => (
                <Line
                  key={m.id}
                  x1={(visible[i].x * GW) / 100}
                  y1={(visible[i].y * GH) / 100}
                  x2={(m.x * GW) / 100}
                  y2={(m.y * GH) / 100}
                  stroke="#b79de0"
                  strokeWidth={1}
                  strokeDasharray="4 9"
                  opacity={0.55}
                />
              ))}
            </Svg>
            {visible.map((m, i) => (
              <Pressable
                key={m.id}
                onPress={() =>
                  router.push({
                    pathname: "/memory/[id]",
                    params: { id: m.id },
                  })
                }
                style={{
                  position: "absolute",
                  left: (m.x * GW) / 100 - 36,
                  top: (m.y * GH) / 100 - 36,
                  width: 72,
                  height: 72,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 40,
                    backgroundColor: moods[m.mood].color + "19",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: moods[m.mood].color + "66",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 27,
                      color: moods[m.mood].color,
                      textShadowColor: moods[m.mood].color,
                      textShadowRadius: 20,
                    }}
                  >
                    ✦
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    position: "absolute",
                    top: 69,
                    color: C.white,
                    fontSize: 10,
                    textAlign: "center",
                    width: 112,
                  }}
                >
                  {m.title}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </GestureDetector>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            backgroundColor: "#201735bb",
            borderRadius: 20,
            padding: 10,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11 }}>
            {visible.length} ✦ memories
          </Text>
        </View>
        {!visible.length && (
          <View
            pointerEvents="none"
            style={{ position: "absolute", alignSelf: "center", top: "45%" }}
          >
            <Sub>Your first star is waiting ✧</Sub>
          </View>
        )}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 16,
            left: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Move size={13} color={C.muted} />
          <Text style={{ color: C.muted, fontSize: 10 }}>
            Drag to explore · Pinch to zoom
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/create", params: { mode } })}
          style={{
            position: "absolute",
            bottom: 26,
            right: 24,
            width: 64,
            height: 64,
            borderRadius: 40,
            backgroundColor: C.lavender,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: C.lavender,
            shadowRadius: 22,
            shadowOpacity: 0.8,
            elevation: 12,
          }}
        >
          <Plus size={30} color="#28163e" />
        </Pressable>
      </View>
      <View
        style={{
          height: 72,
          backgroundColor: "#17112b",
          borderTopWidth: 1,
          borderColor: "#ffffff1b",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: 8,
        }}
      >
        {[
          ["✦", "Universe", "/universe"],
          ["☾", "Time Travel", "/timeline"],
          ["♡", "Create", "/create"],
          ["✧", "About", "/about"],
        ].map(([icon, label, path]) => (
          <Pressable
            key={label}
            onPress={() =>
              path === "/universe"
                ? undefined
                : router.push({ pathname: path as any, params: { mode } })
            }
            style={{ alignItems: "center", gap: 4, minWidth: 65 }}
          >
            <Text
              style={{
                fontSize: 21,
                color: label === "Universe" ? C.pink : C.muted,
              }}
            >
              {icon}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: label === "Universe" ? C.white : C.muted,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Space>
  );
}
