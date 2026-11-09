import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Space, Title, Sub, Glass, Button } from "./ui";
import { C } from "./theme";
import { notify } from "./feedback";
import { useFeatures } from "./features";
import { useMemories } from "./store";

export function Page({
  title,
  kicker = "✧ DISCOVER",
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <Space>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 24,
          paddingTop: 28,
          paddingBottom: 60,
          gap: 18,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/universe")
          }
        >
          <Text style={{ color: C.lavender }}>‹ Back to my universe</Text>
        </Pressable>
        <Text style={{ color: C.pink, letterSpacing: 3, fontSize: 11 }}>
          {kicker}
        </Text>
        <Title>{title}</Title>
        {children}
      </ScrollView>
    </Space>
  );
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  secure?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: C.white, fontWeight: "600" }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        secureTextEntry={secure}
        autoCapitalize={secure ? "none" : "sentences"}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        style={{
          color: C.white,
          backgroundColor: "#ffffff0c",
          borderColor: "#ffffff30",
          borderWidth: 1,
          borderRadius: 14,
          padding: 14,
          minHeight: multiline ? 100 : 48,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
export function Action({
  label,
  run,
  secondary = false,
  disabled = false,
}: {
  label: string;
  run: () => Promise<unknown>;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  return (
    <Button
      label={busy ? "Please wait…" : label}
      disabled={busy || disabled}
      secondary={secondary}
      onPress={() => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        void run()
          .catch((e) =>
            notify(
              "Could not complete",
              e instanceof Error ? e.message : String(e),
            ),
          )
          .finally(() => {
            lock.current = false;
            setBusy(false);
          });
      }}
    />
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text style={{ color: C.white, flex: 1 }}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#9870cb" }}
      />
    </View>
  );
}
export function MemoryPicker({
  selected,
  onChange,
  ordered = false,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  ordered?: boolean;
}) {
  const { memories } = useMemories();
  const personal = memories.filter((m) => m.universe === "private");
  return (
    <View style={{ gap: 8 }}>
      <Sub>
        {ordered
          ? "Tap in playback order. Tap again to remove."
          : "Choose memories. Originals stay untouched."}
      </Sub>
      {personal.map((m) => (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected.includes(m.id) }}
          key={m.id}
          onPress={() =>
            onChange(
              selected.includes(m.id)
                ? selected.filter((id) => id !== m.id)
                : [...selected, m.id],
            )
          }
        >
          <Glass
            style={{
              borderColor: selected.includes(m.id) ? C.lavender : "#ffffff25",
              padding: 14,
            }}
          >
            <Text style={{ color: C.white }}>
              {selected.includes(m.id)
                ? `${ordered ? selected.indexOf(m.id) + 1 : "✓"}  `
                : "○  "}
              {m.title}
            </Text>
          </Glass>
        </Pressable>
      ))}
      {!personal.length && <Sub>Create a personal memory first.</Sub>}
    </View>
  );
}
export function Voice({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri),
    status = useAudioPlayerStatus(player);
  return (
    <Action
      secondary
      label={status.playing ? "Pause voice" : "Play voice"}
      run={async () => {
        if (status.playing) player.pause();
        else {
          if (status.didJustFinish || player.currentTime >= player.duration)
            await player.seekTo(0);
          player.play();
        }
      }}
    />
  );
}
export function Recorder({
  onChange,
  onBusy,
}: {
  onChange: (uri: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY),
    state = useAudioRecorderState(recorder),
    busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.isRecording) void recorder.stop().catch(() => {});
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);
  return (
    <Action
      secondary
      label={
        state.isRecording
          ? `Stop recording · ${Math.round(state.durationMillis / 1000)}s`
          : "Record voice"
      }
      run={async () => {
        if (busy.current) return;
        busy.current = true;
        onBusy?.(true);
        try {
          if (recorder.isRecording) {
            await recorder.stop();
            if (recorder.uri && mounted.current) onChange(recorder.uri);
            await setAudioModeAsync({ allowsRecording: false });
          } else {
            const permission =
              await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted)
              throw Error(
                "Microphone permission was denied. You can continue using text.",
              );
            if (!mounted.current) return;
            await setAudioModeAsync({
              allowsRecording: true,
              playsInSilentMode: true,
            });
            await recorder.prepareToRecordAsync();
            if (!mounted.current) {
              await recorder.stop();
              return;
            }
            recorder.record();
          }
        } finally {
          busy.current = false;
          onBusy?.(recorder.isRecording);
        }
      }}
    />
  );
}
export function PhotoPicker({
  uri,
  onChange,
}: {
  uri?: string;
  onChange: (uri: string) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      <Action
        secondary
        label={uri ? "Change photo" : "Add a photo"}
        run={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          });
          if (!result.canceled) onChange(result.assets[0].uri);
        }}
      />
      {uri && (
        <Image
          source={{ uri }}
          style={{ height: 180, borderRadius: 16, width: "100%" }}
        />
      )}
    </View>
  );
}
export function useReducedMotion() {
  const { data } = useFeatures();
  const [system, setSystem] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setSystem);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystem,
    );
    return () => sub.remove();
  }, []);
  return system || data.settings.reduceMotion;
}
export function Magic({
  children,
  celebrate = false,
}: {
  children: React.ReactNode;
  celebrate?: boolean;
}) {
  const reduced = useReducedMotion(),
    v = useRef(new Animated.Value(0)).current;
  const { data } = useFeatures();
  useEffect(() => {
    v.setValue(reduced ? 1 : 0);
    if (!reduced)
      Animated.timing(v, {
        toValue: 1,
        duration: celebrate ? 1100 : 600,
        useNativeDriver: true,
      }).start();
    if (celebrate && data.settings.haptics)
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    return () => v.stopAnimation();
  }, [reduced, celebrate]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          {
            scale: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0.86, 1],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
