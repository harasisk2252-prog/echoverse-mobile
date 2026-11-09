import React, { useState } from "react";
import { Text, View } from "react-native";
import { Page, Field, Action, MemoryPicker, Magic } from "../src/feature-ui";
import { useFeatures, newId } from "../src/features";
import { useMemories } from "../src/store";
import { Glass, Sub, Button } from "../src/ui";
import { C } from "../src/theme";
import { isValidDate } from "../src/date";
export default function Chapters() {
  const { data, change } = useFeatures(),
    { memories } = useMemories();
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [date, setDate] = useState(""),
    [linking, setLinking] = useState<string>(),
    [ids, setIds] = useState<string[]>([]);
  return (
    <Page title="Unfinished chapters">
      <Sub>Some stars are still becoming. What are you hoping for?</Sub>
      <Field label="A hope for tomorrow" value={title} onChange={setTitle} />
      <Field
        label="Why it matters to me"
        value={description}
        onChange={setDescription}
        multiline
      />
      <Field
        label="Optional target date (YYYY-MM-DD)"
        value={date}
        onChange={setDate}
      />
      <Action
        label="Plant a hopeful star"
        run={async () => {
          if (!title.trim()) throw Error("Give your hope a title.");
          if (date && !isValidDate(date))
            throw Error("Enter a real date in YYYY-MM-DD format.");
          await change((d) => ({
            ...d,
            chapters: [
              ...d.chapters,
              {
                id: newId(),
                title: title.trim(),
                description: description.trim(),
                targetDate: date || undefined,
              },
            ],
          }));
          setTitle("");
          setDescription("");
          setDate("");
        }}
      />
      {data.chapters.map((c) => (
        <Magic key={`${c.id}-${!!c.completedAt}`} celebrate={!!c.completedAt}>
          <Glass>
            <Text
              style={{
                color: c.completedAt ? C.gold : C.lavender,
                fontSize: 22,
              }}
            >
              {c.completedAt ? "✦" : "☆"} {c.title}
            </Text>
            <Sub>{c.description}</Sub>
            {c.targetDate && <Sub>Aiming for {c.targetDate}</Sub>}
            {c.completedAt ? (
              <Sub>
                It happened!{" "}
                {memories.find((m) => m.id === c.memoryId)?.title ||
                  "Linked memory is no longer on this device."}
              </Sub>
            ) : (
              <Button
                secondary
                label="This chapter came true"
                onPress={() => {
                  setLinking(c.id);
                  setIds([]);
                }}
              />
            )}
            {linking === c.id && !c.completedAt && (
              <View style={{ gap: 12, marginTop: 12 }}>
                <MemoryPicker
                  selected={ids}
                  onChange={(v) => setIds(v.length ? [v[v.length - 1]] : [])}
                />
                <Action
                  label="Light up this star"
                  run={async () => {
                    if (!ids[0])
                      throw Error(
                        "Choose the memory that brought this hope to life.",
                      );
                    await change((d) => ({
                      ...d,
                      chapters: d.chapters.map((ch) =>
                        ch.id === c.id
                          ? { ...ch, memoryId: ids[0], completedAt: Date.now() }
                          : ch,
                      ),
                    }));
                    setLinking(undefined);
                  }}
                />
              </View>
            )}
          </Glass>
        </Magic>
      ))}
    </Page>
  );
}
