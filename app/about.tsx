import React from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Space, Title, Sub, Glass, Button } from "../src/ui";
import { C } from "../src/theme";
const steps = [
  [
    "✦",
    "A star is born",
    "Save a story, a photo or a voice note and watch it become a glowing star.",
  ],
  [
    "✧",
    "Explore your galaxy",
    "Move around the universe and tap stars to revisit moments.",
  ],
  [
    "♡",
    "Together, always",
    "Keep memories private or place them in a shared-universe demo.",
  ],
  [
    "☾",
    "Travel through time",
    "Explore your memories by year, date and emotion.",
  ],
];
export default function About() {
  return (
    <Space>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: 70,
          paddingBottom: 50,
        }}
      >
        <Text style={{ color: C.lavender, letterSpacing: 3, fontSize: 12 }}>
          THE MAGIC OF ECHOVERSE
        </Text>
        <Title style={{ marginTop: 16 }}>
          Memories deserve{"\n"}a universe.
        </Title>
        <Sub style={{ marginTop: 14, marginBottom: 26 }}>
          More than a journal. A place to relive the moments that make you, you.
        </Sub>
        {steps.map(([icon, title, desc]) => (
          <Glass key={title} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 28, color: C.pink }}>{icon}</Text>
            <Text
              style={{
                color: C.white,
                fontSize: 19,
                fontWeight: "700",
                marginTop: 9,
              }}
            >
              {title}
            </Text>
            <Sub style={{ marginTop: 7 }}>{desc}</Sub>
          </Glass>
        ))}
        <Button
          label="Enter my universe ✦"
          onPress={() => router.replace("/universe")}
        />
      </ScrollView>
    </Space>
  );
}
