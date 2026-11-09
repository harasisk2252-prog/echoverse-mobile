import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Page,
  Field,
  Action,
  MemoryPicker,
  Recorder,
  Voice,
  Magic,
} from "../src/feature-ui";
import { useFeatures, newId } from "../src/features";
import { useMemories } from "../src/store";
import { keepFile, removeFile } from "../src/media";
import { Glass, Sub } from "../src/ui";
import { C } from "../src/theme";
export default function Afterglow() {
  const params = useLocalSearchParams<{ memoryId?: string }>(),
    { memories } = useMemories(),
    { data, change } = useFeatures();
  const [ids, setIds] = useState<string[]>(
      params.memoryId ? [params.memoryId] : [],
    ),
    [text, setText] = useState(""),
    [audio, setAudio] = useState<string>(),
    [recording, setRecording] = useState(false);
  const selected = memories.find((m) => m.id === ids[0]);
  return (
    <Page title="Memory afterglow">
      <Sub>A new feeling, around the same beautiful moment.</Sub>
      <MemoryPicker
        selected={ids}
        onChange={(v) => setIds(v.length ? [v[v.length - 1]] : [])}
      />
      {selected && (
        <>
          <Magic>
            <Glass>
              <Text style={{ fontSize: 34, color: C.gold }}>◌ ✦ ◌</Text>
              <Text style={{ color: C.white, fontSize: 20 }}>
                {selected.title}
              </Text>
              <Sub>{selected.story}</Sub>
            </Glass>
          </Magic>
          <Field
            label="How do you feel about it today?"
            value={text}
            onChange={setText}
            multiline
          />
          <Recorder onChange={setAudio} onBusy={setRecording} />
          {audio && <Voice uri={audio} />}
          <Action
            label="Add an afterglow"
            disabled={recording}
            run={async () => {
              if (!text.trim() && !audio)
                throw Error("Write a reflection or record your voice.");
              const saved = await keepFile(audio, "reflection");
              try {
                await change((d) => ({
                  ...d,
                  reflections: [
                    ...d.reflections,
                    {
                      id: newId(),
                      memoryId: selected.id,
                      text: text.trim(),
                      audio: saved,
                      createdAt: Date.now(),
                    },
                  ],
                }));
                setText("");
                setAudio(undefined);
              } catch (e) {
                await removeFile(saved);
                throw e;
              }
            }}
          />
          {data.reflections
            .filter((r) => r.memoryId === selected.id)
            .slice()
            .reverse()
            .map((r) => (
              <Magic key={r.id}>
                <Glass>
                  <Sub>{new Date(r.createdAt).toLocaleString()}</Sub>
                  <Text style={{ color: C.white, lineHeight: 24 }}>
                    {r.text}
                  </Text>
                  {r.audio && <Voice uri={r.audio} />}
                </Glass>
              </Magic>
            ))}
        </>
      )}
    </Page>
  );
}
