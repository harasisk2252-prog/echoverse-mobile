import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View, Image } from "react-native";
import { router } from "expo-router";
import { Space, Title, Sub, Glass } from "../src/ui";
import { C, moods } from "../src/theme";
import { useMemories } from "../src/store";
export default function Timeline() {
  const { memories } = useMemories();
  const grouped = useMemo(() => {
    const g: Record<string, typeof memories> = {};
    for (const m of [...memories].sort((a, b) =>
      b.date.localeCompare(a.date),
    )) {
      const y = m.date.slice(0, 4);
      (g[y] ??= []).push(m);
    }
    return g;
  }, [memories]);
  return (
    <Space>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingTop: 65,
          paddingBottom: 50,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: C.lavender }}>‹ Back to galaxy</Text>
        </Pressable>
        <Text
          style={{
            color: C.pink,
            letterSpacing: 3,
            marginTop: 30,
            fontSize: 11,
          }}
        >
          ☾ TIME TRAVEL
        </Text>
        <Title style={{ marginTop: 8 }}>Chapters of your life</Title>
        <Sub style={{ marginTop: 8, marginBottom: 25 }}>
          Travel through the moments that made you.
        </Sub>
        {Object.keys(grouped)
          .sort()
          .reverse()
          .map((y) => (
            <View key={y}>
              <Text
                style={{
                  color: C.lavender,
                  fontSize: 25,
                  fontWeight: "700",
                  marginVertical: 16,
                }}
              >
                {y} ✦
              </Text>
              {grouped[y].map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() =>
                    router.push({
                      pathname: "/memory/[id]",
                      params: { id: m.id },
                    })
                  }
                >
                  <Glass
                    style={{
                      marginBottom: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    {m.photo ? (
                      <Image
                        source={{ uri: m.photo }}
                        style={{ width: 64, height: 64, borderRadius: 14 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 14,
                          backgroundColor: moods[m.mood].color + "25",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{ color: moods[m.mood].color, fontSize: 32 }}
                        >
                          ✦
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: C.white,
                          fontSize: 16,
                          fontWeight: "700",
                        }}
                      >
                        {m.title}
                      </Text>
                      <Sub>
                        {m.date} · {moods[m.mood].label}
                      </Sub>
                    </View>
                    <Text style={{ color: C.muted }}>›</Text>
                  </Glass>
                </Pressable>
              ))}
            </View>
          ))}
        {memories.length === 0 && (
          <Sub>No memories yet. Create your first star!</Sub>
        )}
      </ScrollView>
    </Space>
  );
}
