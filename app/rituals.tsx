import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import {
  Page,
  Field,
  Action,
  MemoryPicker,
  Recorder,
  Voice,
  Toggle,
  Magic,
} from "../src/feature-ui";
import { useFeatures, newId, Ritual } from "../src/features";
import { useMemories } from "../src/store";
import { Glass, Sub, Button } from "../src/ui";
import { C } from "../src/theme";
import { keepFile, removeFile } from "../src/media";
function Playback({ ritual, onExit }: { ritual: Ritual; onExit: () => void }) {
  const { memories } = useMemories(),
    { data } = useFeatures();
  const [step, setStep] = useState(0),
    [paused, setPaused] = useState(false);
  const ambient = useAudioPlayer(require("../assets/ambient.wav"));
  const items = ritual.memoryIds
    .map((id) => memories.find((m) => m.id === id))
    .filter((m) => !!m);
  const m = items[step];
  useEffect(() => {
    ambient.loop = true;
    ambient.volume = 0.15;
    if (ritual.ambient && data.settings.sound && !paused) ambient.play();
    else ambient.pause();
    return () => ambient.pause();
  }, [paused, ritual.ambient, data.settings.sound]);
  useEffect(() => {
    if (paused || !m) return;
    const timer = setTimeout(() => {
      if (step < items.length - 1) setStep((s) => s + 1);
      else setPaused(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [step, paused, items.length]);
  return (
    <Page title={ritual.name} kicker="☾ YOUR MEMORY RITUAL">
      <Sub>
        {paused
          ? "Paused — take your time."
          : "A moment to breathe. Each chapter lasts twelve seconds."}{" "}
        {step + 1}/{items.length}
      </Sub>
      {m ? (
        <Magic key={m.id}>
          <Glass>
            {m.photo && (
              <Image
                source={{ uri: m.photo }}
                style={{ height: 220, borderRadius: 18, width: "100%" }}
              />
            )}
            <Text style={{ color: C.white, fontSize: 26, marginVertical: 14 }}>
              {m.title}
            </Text>
            <Sub>{ritual.captions[m.id] || m.story}</Sub>
            {m.audio && (
              <View style={{ marginTop: 12 }}>
                <Sub>Playing voice pauses the slideshow.</Sub>
                <Button
                  secondary
                  label="Pause to listen"
                  onPress={() => setPaused(true)}
                />
                {paused && <Voice uri={m.audio} />}
              </View>
            )}
          </Glass>
        </Magic>
      ) : (
        <Sub>The memories in this ritual are no longer available.</Sub>
      )}
      <Button
        label={paused ? "Resume ritual" : "Pause ritual"}
        onPress={() => setPaused(!paused)}
      />
      <Button
        secondary
        label="Next memory"
        onPress={() => {
          setStep((s) => Math.min(items.length - 1, s + 1));
          setPaused(false);
        }}
      />
      {ritual.narration && (
        <>
          <Button
            secondary
            label="Pause for narration"
            onPress={() => setPaused(true)}
          />
          {paused && <Voice uri={ritual.narration} />}
        </>
      )}
      <Button secondary label="Exit ritual" onPress={onExit} />
    </Page>
  );
}
export default function Rituals() {
  const { data, change } = useFeatures(),
    { memories } = useMemories();
  const [name, setName] = useState(""),
    [ids, setIds] = useState<string[]>([]),
    [captions, setCaptions] = useState<Record<string, string>>({}),
    [narration, setNarration] = useState<string>(),
    [ambient, setAmbient] = useState(false),
    [recording, setRecording] = useState(false),
    [playing, setPlaying] = useState<Ritual>();
  if (playing)
    return <Playback ritual={playing} onExit={() => setPlaying(undefined)} />;
  return (
    <Page title="Memory rituals">
      <Sub>
        Choose the order, add a few words, and make space for your memories.
      </Sub>
      <Field label="Ritual name" value={name} onChange={setName} />
      <MemoryPicker selected={ids} onChange={setIds} ordered />
      {ids.map((id) => (
        <Field
          key={id}
          label={`Caption · ${memories.find((m) => m.id === id)?.title}`}
          value={captions[id] || ""}
          onChange={(value) => setCaptions((c) => ({ ...c, [id]: value }))}
        />
      ))}
      <Recorder onChange={setNarration} onBusy={setRecording} />
      {narration && <Voice uri={narration} />}
      <Toggle
        label="Include gentle ambient sound"
        value={ambient}
        onChange={setAmbient}
      />
      <Sub>
        Ambient sound also requires “Allow ambient sound” in Discover. Voice
        always waits for you to press Play.
      </Sub>
      <Action
        label="Create ritual"
        disabled={recording}
        run={async () => {
          if (!name.trim() || !ids.length)
            throw Error("Name your ritual and select at least one memory.");
          const saved = await keepFile(narration, "ritual");
          try {
            await change((d) => ({
              ...d,
              rituals: [
                ...d.rituals,
                {
                  id: newId(),
                  name: name.trim(),
                  memoryIds: ids,
                  captions,
                  narration: saved,
                  ambient,
                },
              ],
            }));
            setName("");
            setIds([]);
            setCaptions({});
            setNarration(undefined);
          } catch (e) {
            await removeFile(saved);
            throw e;
          }
        }}
      />
      {data.rituals.map((r) => (
        <Glass key={r.id}>
          <Text style={{ color: C.lavender, fontSize: 22, marginBottom: 12 }}>
            ☾ {r.name}
          </Text>
          <Sub>{r.memoryIds.length} moments</Sub>
          <Button label="Begin ritual" onPress={() => setPlaying(r)} />
        </Glass>
      ))}
    </Page>
  );
}
