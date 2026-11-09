import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { keepFile, removeFile } from "../src/media";
import { localDate, isValidDate } from "../src/date";
import { notify } from "../src/feedback";
import { Space, Title, Sub, Glass, Button } from "../src/ui";
import { C, Mood, moods } from "../src/theme";
import { useMemories, Universe } from "../src/store";
const field = {
  backgroundColor: "#ffffff0c",
  borderWidth: 1,
  borderColor: "#ffffff2c",
  borderRadius: 14,
  padding: 14,
  color: C.white,
  fontSize: 15,
  marginTop: 8,
} as const;
export default function Create() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { add } = useMemories();
  const [title, setTitle] = useState(""),
    [story, setStory] = useState(""),
    [date, setDate] = useState(localDate),
    [mood, setMood] = useState<Mood>("joy"),
    [universe, setUniverse] = useState<Universe>(
      params.mode === "shared" ? "shared" : "private",
    ),
    [photo, setPhoto] = useState<string | undefined>(),
    [audio, setAudio] = useState<string | undefined>(),
    [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const recordingBusy = useRef(false);
  const [recordingPending, setRecordingPending] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  useEffect(
    () => () => {
      if (recorder.isRecording) void recorder.stop().catch(() => {});
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    },
    [recorder],
  );

  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled) setPhoto(result.assets[0].uri);
    } catch (e) {
      notify("Photo error", String(e));
    }
  }
  async function record() {
    if (recordingBusy.current || savingRef.current) return;
    recordingBusy.current = true;
    setRecordingPending(true);
    try {
      if (recorder.isRecording) {
        await recorder.stop();
        if (recorder.uri) setAudio(recorder.uri);
        await setAudioModeAsync({ allowsRecording: false });
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          notify("Microphone permission needed");
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
    } catch (e) {
      notify("Recording error", String(e));
    } finally {
      recordingBusy.current = false;
      setRecordingPending(false);
    }
  }
  async function save() {
    if (savingRef.current || recordingBusy.current || recorder.isRecording)
      return;
    if (!title.trim() || !story.trim()) {
      notify("Missing details", "Add a title and a story to create your star.");
      return;
    }
    if (!isValidDate(date)) {
      notify("Invalid date", "Please use YYYY-MM-DD.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    let savedPhoto: string | undefined;
    let savedAudio: string | undefined;
    try {
      savedPhoto = await keepFile(photo, "photo");
      savedAudio = await keepFile(audio, "voice");
      await add({
        title: title.trim(),
        story: story.trim(),
        date,
        mood,
        universe,
        photo: savedPhoto,
        audio: savedAudio,
      });
      router.replace({ pathname: "/universe", params: { mode: universe } });
    } catch (e) {
      await Promise.allSettled([
        removeFile(savedPhoto),
        removeFile(savedAudio),
      ]);
      notify("Could not save", String(e));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <Space>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            paddingTop: 65,
            paddingBottom: 60,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: C.lavender, fontSize: 14 }}>
              ‹ Back to universe
            </Text>
          </Pressable>
          <Text
            style={{
              color: C.pink,
              letterSpacing: 3,
              fontSize: 11,
              marginTop: 26,
            }}
          >
            ✦ CREATE A NEW STAR
          </Text>
          <Title style={{ marginTop: 8 }}>Capture a moment</Title>
          <Sub style={{ marginTop: 9, marginBottom: 22 }}>
            Give your story a place among the stars.
          </Sub>
          <Glass>
            <Text style={{ color: C.white, fontWeight: "700" }}>
              Memory title
            </Text>
            <TextInput
              style={field}
              value={title}
              onChangeText={setTitle}
              maxLength={75}
              placeholder="A day I'll never forget"
              placeholderTextColor="#8d829f"
            />
            <Text style={{ color: C.white, fontWeight: "700", marginTop: 20 }}>
              Your story
            </Text>
            <TextInput
              multiline
              textAlignVertical="top"
              style={[field, { height: 125 }]}
              value={story}
              onChangeText={setStory}
              placeholder="What made this moment special?"
              placeholderTextColor="#8d829f"
            />
            <Text style={{ color: C.white, fontWeight: "700", marginTop: 20 }}>
              Date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={field}
              value={date}
              onChangeText={setDate}
              placeholder="2026-11-08"
              placeholderTextColor="#8d829f"
            />
          </Glass>
          <Text
            style={{
              color: C.white,
              fontWeight: "700",
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            How did it feel?
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
            {(Object.keys(moods) as Mood[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMood(m)}
                style={{
                  padding: 12,
                  borderRadius: 20,
                  backgroundColor:
                    mood === m ? moods[m].color + "33" : "#ffffff0b",
                  borderWidth: 1,
                  borderColor: mood === m ? moods[m].color : "#ffffff22",
                }}
              >
                <Text style={{ color: mood === m ? moods[m].color : C.muted }}>
                  {moods[m].icon} {moods[m].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={{
              color: C.white,
              fontWeight: "700",
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            Add your keepsakes
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={pickPhoto}
              style={{
                flex: 1,
                backgroundColor: "#241b41",
                borderWidth: 1,
                borderColor: "#ffffff25",
                borderRadius: 18,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>▧</Text>
              <Text style={{ color: C.white, fontSize: 12, marginTop: 7 }}>
                {photo ? "Change photo" : "Choose photo"}
              </Text>
            </Pressable>
            <Pressable
              onPress={record}
              style={{
                flex: 1,
                backgroundColor: recorderState.isRecording
                  ? "#5e234b"
                  : "#241b41",
                borderWidth: 1,
                borderColor: "#ffffff25",
                borderRadius: 18,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>
                {recorderState.isRecording ? "⏹" : "◉"}
              </Text>
              <Text style={{ color: C.white, fontSize: 12, marginTop: 7 }}>
                {recorderState.isRecording
                  ? "Stop recording"
                  : audio
                    ? "Re-record voice"
                    : "Record voice"}
              </Text>
            </Pressable>
          </View>
          {photo && (
            <Image
              source={{ uri: photo }}
              style={{
                width: "100%",
                height: 180,
                borderRadius: 18,
                marginTop: 12,
              }}
            />
          )}
          {audio && (
            <Text style={{ color: C.mint, marginTop: 9, fontSize: 12 }}>
              ✓ Voice recording attached
            </Text>
          )}
          <Text
            style={{
              color: C.white,
              fontWeight: "700",
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            Choose your universe
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
            {(["private", "shared"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setUniverse(m)}
                style={{
                  flex: 1,
                  backgroundColor: universe === m ? "#664593" : "#241b41",
                  borderRadius: 15,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: universe === m ? C.lavender : "#ffffff20",
                }}
              >
                <Text style={{ color: C.white, fontWeight: "700" }}>
                  {m === "private" ? "🔒 My Universe" : "♡ Our Universe"}
                </Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>
                  {m === "private"
                    ? "Only on this device"
                    : "Shared demo on this device"}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button
            disabled={saving || recordingPending || recorderState.isRecording}
            label={saving ? "Saving your memory…" : "✦ Give this memory a star"}
            onPress={save}
          />
          <Sub style={{ textAlign: "center", marginTop: 15, fontSize: 11 }}>
            Stored locally on your device. Shared mode is a demo, not online
            collaboration.
          </Sub>
        </ScrollView>
      </KeyboardAvoidingView>
    </Space>
  );
}
