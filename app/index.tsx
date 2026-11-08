import React from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { router } from "expo-router";
import { Space, Title, Sub, Button, Orb, Glass } from "../src/ui";
import { C } from "../src/theme";
export default function Welcome() {
  return (
    <Space>
      <ScrollView
        contentContainerStyle={{
          minHeight: Dimensions.get("window").height - 30,
          paddingHorizontal: 27,
          paddingTop: 65,
          paddingBottom: 45,
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: C.lavender, letterSpacing: 4, fontSize: 11 }}>
            ✦ A UNIVERSE MADE OF MOMENTS
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "600",
              color: C.white,
              marginTop: 20,
            }}
          >
            ✧ EchoVerse
          </Text>
        </View>
        <View style={{ alignItems: "center", marginVertical: 48 }}>
          <Orb size={205} />
          <Text
            style={{
              fontSize: 12,
              color: C.pink,
              letterSpacing: 3,
              marginTop: 48,
            }}
          >
            EVERY STAR HAS A STORY
          </Text>
        </View>
        <View>
          <Title style={{ fontSize: 49, lineHeight: 54 }}>
            Your life.{"\n"}Your memories.{"\n"}
            <Text style={{ color: C.lavender }}>Your universe.</Text>
          </Title>
          <Sub
            style={{
              fontSize: 15,
              lineHeight: 25,
              marginTop: 18,
              marginBottom: 28,
            }}
          >
            Turn your precious moments into glowing stars. Explore your own
            galaxy or make memories together.
          </Sub>
          <Button
            label="✧ Begin your journey"
            onPress={() => router.replace("/universe")}
          />
          <View style={{ marginTop: 12 }}>
            <Button
              secondary
              label="Discover how it works"
              onPress={() => router.push("/about")}
            />
          </View>
        </View>
      </ScrollView>
    </Space>
  );
}
