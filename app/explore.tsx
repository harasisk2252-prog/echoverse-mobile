import React, { Suspense, lazy, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useMemories } from "../src/store";
import { useFeatures } from "../src/features";
import { useReducedMotion } from "../src/feature-ui";
import { Space, Sub, Button } from "../src/ui";
import { C } from "../src/theme";
import type { CameraPosition } from "../src/galaxy-scene";
const Galaxy = lazy(() => import("../src/Galaxy3D"));
const initial: CameraPosition = {
  yaw: 0,
  pitch: 0.3,
  distance: 23,
  x: 0,
  y: 0,
};
class Boundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function Explore() {
  const { memories } = useMemories(),
    { data } = useFeatures(),
    reduced = useReducedMotion(),
    { width, height } = useWindowDimensions();
  const h = Math.max(240, height - 270);
  const [camera, setCamera] = useState(initial),
    [panMode, setPanMode] = useState(false),
    [error, setError] = useState("");
  const saved = useRef(camera),
    picker = useRef<(x: number, y: number) => string | undefined>(
      () => undefined,
    );
  const pan = Gesture.Pan()
    .minDistance(8)
    .runOnJS(true)
    .onStart(() => {
      saved.current = camera;
    })
    .onUpdate((e) => {
      const old = saved.current;
      setCamera(
        panMode
          ? {
              ...old,
              x: old.x - e.translationX * 0.025,
              y: old.y + e.translationY * 0.025,
            }
          : {
              ...old,
              yaw: old.yaw + e.translationX * 0.008,
              pitch: Math.max(
                -1.2,
                Math.min(1.2, old.pitch + e.translationY * 0.006),
              ),
            },
      );
    });
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      saved.current = camera;
    })
    .onUpdate((e) =>
      setCamera((c) => ({
        ...c,
        distance: Math.max(5, Math.min(60, saved.current.distance / e.scale)),
      })),
    );
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      const id = picker.current(e.x, e.y);
      if (id) router.push({ pathname: "/memory/[id]", params: { id } });
    });
  const fallback = (
    <View style={{ padding: 30, gap: 16 }}>
      <Sub>
        3D graphics are unavailable on this device. Your memories are safe in
        the classic galaxy.
      </Sub>
      <Button
        label="Open classic galaxy"
        onPress={() => router.replace("/universe")}
      />
    </View>
  );
  return (
    <Space>
      <View style={{ padding: 20, gap: 12 }}>
        <Pressable onPress={() => router.replace("/universe")}>
          <Text style={{ color: C.lavender }}>‹ Classic galaxy</Text>
        </Pressable>
        <Text style={{ color: C.white, fontSize: 26 }}>
          Inside your universe
        </Text>
        <Sub>
          Drag to {panMode ? "pan" : "orbit"} · Pinch to zoom · Tap a star
        </Sub>
      </View>
      {error ? (
        fallback
      ) : (
        <Boundary fallback={fallback}>
          <GestureDetector
            gesture={Gesture.Race(tap, Gesture.Simultaneous(pan, pinch))}
          >
            <View style={{ width, height: h }}>
              <Suspense fallback={<ActivityIndicator color={C.lavender} />}>
                <Galaxy
                  key={`${width}-${h}`}
                  memories={memories.filter((m) => m.universe === "private")}
                  features={data}
                  camera={camera}
                  reduced={reduced}
                  width={width}
                  height={h}
                  onReady={(pick) => {
                    picker.current = pick;
                  }}
                  onError={setError}
                />
              </Suspense>
            </View>
          </GestureDetector>
        </Boundary>
      )}
      <View
        style={{ padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 }}
      >
        {[
          [panMode ? "Orbit" : "Pan", () => setPanMode(!panMode)],
          [
            "Zoom +",
            () =>
              setCamera((c) => ({
                ...c,
                distance: Math.max(5, c.distance - 3),
              })),
          ],
          [
            "Zoom −",
            () =>
              setCamera((c) => ({
                ...c,
                distance: Math.min(60, c.distance + 3),
              })),
          ],
          ["Reset", () => setCamera(initial)],
        ].map(([label, action]) => (
          <Pressable
            key={label as string}
            accessibilityRole="button"
            onPress={action as () => void}
            style={{
              padding: 12,
              borderRadius: 20,
              backgroundColor: "#33214f",
            }}
          >
            <Text style={{ color: C.white }}>{label as string}</Text>
          </Pressable>
        ))}
      </View>
    </Space>
  );
}
