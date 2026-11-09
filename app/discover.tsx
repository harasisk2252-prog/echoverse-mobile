import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Page, Toggle } from "../src/feature-ui";
import { Glass, Sub } from "../src/ui";
import { C } from "../src/theme";
import { useFeatures } from "../src/features";
import { notify } from "../src/feedback";
const doors = [
  ["◌", "Afterglow", "How does that moment feel today?", "/afterglow"],
  [
    "✧",
    "Life constellations",
    "Find the threads connecting your stars.",
    "/constellations",
  ],
  [
    "☆",
    "Unfinished chapters",
    "Give tomorrow’s hopes a place to grow.",
    "/chapters",
  ],
  [
    "⌛",
    "Messages through time",
    "A conversation with your future self.",
    "/capsules",
  ],
  [
    "☀",
    "Ordinary-day snapshots",
    "The little things become the big things.",
    "/snapshots",
  ],
  ["☾", "Memory rituals", "Slow down and revisit what matters.", "/rituals"],
  ["◎", "3D Explore", "Step inside the galaxy you have created.", "/explore"],
  [
    "♡",
    "Shared universes",
    "Invite your people into a world together.",
    "/shared",
  ],
];
export default function Discover() {
  const { data, change } = useFeatures();
  return (
    <Page title="There is more to your universe">
      <Sub>New ways to remember, dream, and feel connected.</Sub>
      {doors.map(([icon, title, description, path]) => (
        <Pressable
          key={path}
          accessibilityRole="button"
          onPress={() => router.push(path as any)}
        >
          <Glass
            style={{ flexDirection: "row", gap: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 30, color: C.pink }}>{icon}</Text>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ color: C.white, fontSize: 18, fontWeight: "700" }}>
                {title}
              </Text>
              <Sub>{description}</Sub>
            </View>
            <Text style={{ color: C.lavender }}>›</Text>
          </Glass>
        </Pressable>
      ))}
      <Glass>
        <Text style={{ color: C.white, fontWeight: "700", marginBottom: 16 }}>
          Make it feel like you
        </Text>
        {(["haptics", "sound", "reduceMotion"] as const).map((key) => (
          <Toggle
            key={key}
            label={
              {
                haptics: "Gentle haptics",
                sound: "Allow ambient sound",
                reduceMotion: "Reduce motion",
              }[key]
            }
            value={data.settings[key]}
            onChange={(value) => {
              void change((d) => ({
                ...d,
                settings: { ...d.settings, [key]: value },
              })).catch((e) => notify("Could not save preference", String(e)));
            }}
          />
        ))}
      </Glass>
    </Page>
  );
}
