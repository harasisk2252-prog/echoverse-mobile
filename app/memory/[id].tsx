import React from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Space, Title, Sub, Glass, Button } from "../../src/ui";
import { confirmRemoval, notify } from "../../src/feedback";
import { C, moods } from "../../src/theme";
import { useMemories } from "../../src/store";
function VoicePlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  return (
    <Pressable
      onPress={async () => {
        if (status.playing) player.pause();
        else {
          if (player.currentTime >= player.duration && player.duration > 0)
            await player.seekTo(0);
          player.play();
        }
      }}
      style={{
        padding: 17,
        borderRadius: 17,
        backgroundColor: "#4b356d",
        marginTop: 12,
      }}
    >
      <Text style={{ color: C.white, fontWeight: "700" }}>
        {status.playing ? "Ⅱ Pause voice memory" : "▶ Play voice memory"}
      </Text>
    </Pressable>
  );
}
export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { memories, remove } = useMemories();
  const m = memories.find((x) => x.id === id);
  if (!m)
    return (
      <Space>
        <View style={{ padding: 28, paddingTop: 100 }}>
          <Title>Memory not found</Title>
          <Button
            label="Return to galaxy"
            onPress={() => router.replace("/universe")}
          />
        </View>
      </Space>
    );
  const mood = moods[m.mood];
  function confirmDelete() {
    confirmRemoval(() => {
      void remove(m!.id)
        .then(() =>
          router.replace({
            pathname: "/universe",
            params: { mode: m!.universe },
          }),
        )
        .catch((e) => notify("Could not delete", String(e)));
    });
  }
  return (
    <Space>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: 65,
          paddingBottom: 60,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: C.lavender }}>‹ Return to galaxy</Text>
        </Pressable>
        <View
          style={{
            height: 195,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: mood.color + "88",
              backgroundColor: mood.color + "19",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: mood.color,
              shadowOpacity: 0.8,
              shadowRadius: 45,
              elevation: 12,
            }}
          >
            <Text
              style={{
                fontSize: 76,
                color: mood.color,
                textShadowColor: mood.color,
                textShadowRadius: 30,
              }}
            >
              ✦
            </Text>
          </View>
        </View>
        <Text style={{ color: mood.color, letterSpacing: 3, fontSize: 11 }}>
          ✧ {m.universe === "private" ? "MY UNIVERSE" : "OUR UNIVERSE"}
        </Text>
        <Title style={{ marginTop: 10 }}>{m.title}</Title>
        <Sub style={{ marginTop: 9 }}>
          {m.date} · {mood.icon} {mood.label}
        </Sub>
        {m.photo && (
          <Image
            source={{ uri: m.photo }}
            style={{
              width: "100%",
              height: 270,
              borderRadius: 22,
              marginTop: 22,
            }}
            resizeMode="cover"
          />
        )}
        <Glass style={{ marginTop: 20 }}>
          <Text style={{ color: C.white, fontSize: 16, lineHeight: 27 }}>
            {m.story}
          </Text>
        </Glass>
        {m.audio && <VoicePlayer uri={m.audio} />}
        <View style={{ marginTop: 30 }}>
          <Button
            secondary
            label="Delete this memory"
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>
    </Space>
  );
}
