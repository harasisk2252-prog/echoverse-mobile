import React, { useState } from "react";
import { router } from "expo-router";
import {
  Page,
  Field,
  Action,
  Recorder,
  PhotoPicker,
  Voice,
} from "../src/feature-ui";
import { useFeatures, newId } from "../src/features";
import { useMemories } from "../src/store";
import { Sub } from "../src/ui";
import { Mood, moods } from "../src/theme";
import { Pressable, Text, View } from "react-native";
import { keepFile, removeFile } from "../src/media";
import { localDate } from "../src/date";
export default function Snapshots() {
  const { data, change } = useFeatures(),
    { add, remove } = useMemories();
  const [song, setSong] = useState(""),
    [detail, setDetail] = useState(""),
    [dream, setDream] = useState(""),
    [mood, setMood] = useState<Mood>(),
    [photo, setPhoto] = useState<string>(),
    [audio, setAudio] = useState<string>(),
    [recording, setRecording] = useState(false);
  const month = localDate().slice(0, 7);
  return (
    <Page title="An ordinary day">
      <Sub>
        {data.snapshots.some((s) => s.month === month)
          ? "You have captured this month. Another small moment is welcome."
          : "Your monthly invitation: keep a little piece of today."}{" "}
        Every field is optional.
      </Sub>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(moods) as Mood[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMood(mood === m ? undefined : m)}
            style={{
              padding: 12,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: moods[m].color,
              backgroundColor: mood === m ? "#65438b" : "transparent",
            }}
          >
            <Text style={{ color: moods[m].color }}>
              {moods[m].icon} {moods[m].label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field label="A song on repeat" value={song} onChange={setSong} />
      <Field
        label="A small detail from today"
        value={detail}
        onChange={setDetail}
        multiline
      />
      <Field
        label="Something I am dreaming of"
        value={dream}
        onChange={setDream}
      />
      <PhotoPicker uri={photo} onChange={setPhoto} />
      <Recorder onChange={setAudio} onBusy={setRecording} />
      {audio && <Voice uri={audio} />}
      <Action
        label="Keep a little piece of today"
        disabled={recording}
        run={async () => {
          let p: string | undefined,
            a: string | undefined,
            id: string | undefined;
          try {
            p = await keepFile(photo, "snapshot");
            a = await keepFile(audio, "snapshot-voice");
            id = await add({
              title: `An ordinary day · ${localDate()}`,
              story:
                [
                  song && `On repeat: ${song}`,
                  detail,
                  dream && `Dreaming of: ${dream}`,
                ]
                  .filter(Boolean)
                  .join("\n\n") ||
                "A little piece of today, saved for tomorrow.",
              date: localDate(),
              mood: mood || "peace",
              universe: "private",
              photo: p,
              audio: a,
            });
            await change((d) => ({
              ...d,
              snapshots: [
                ...d.snapshots,
                {
                  id: newId(),
                  memoryId: id!,
                  month,
                  mood,
                  song,
                  detail,
                  dream,
                },
              ],
            }));
            router.replace({ pathname: "/memory/[id]", params: { id } });
          } catch (e) {
            if (id) await remove(id);
            else await Promise.allSettled([removeFile(p), removeFile(a)]);
            throw e;
          }
        }}
      />
    </Page>
  );
}
