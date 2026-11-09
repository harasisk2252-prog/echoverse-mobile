import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Page, Field, Action, MemoryPicker, Magic } from "../src/feature-ui";
import { useFeatures, newId } from "../src/features";
import { useMemories } from "../src/store";
import { Glass, Sub, Button } from "../src/ui";
import { C } from "../src/theme";
export default function Constellations() {
  const { data, change } = useFeatures(),
    { memories } = useMemories();
  const [name, setName] = useState(""),
    [ids, setIds] = useState<string[]>([]),
    [editing, setEditing] = useState<string>();
  return (
    <Page title="Life constellations">
      <Sub>
        “Our firsts.” “Small victories.” Your stars can tell more than one
        story.
      </Sub>
      <Field label="Constellation name" value={name} onChange={setName} />
      <MemoryPicker selected={ids} onChange={setIds} />
      <Action
        label={editing ? "Save constellation" : "Connect these stars"}
        run={async () => {
          if (!name.trim() || ids.length < 2)
            throw Error(
              "Name your constellation and choose at least two memories.",
            );
          const item = {
            id: editing || newId(),
            name: name.trim(),
            memoryIds: ids,
          };
          await change((d) => ({
            ...d,
            constellations: editing
              ? d.constellations.map((c) => (c.id === editing ? item : c))
              : [...d.constellations, item],
          }));
          setEditing(undefined);
          setName("");
          setIds([]);
        }}
      />
      {data.constellations.map((c) => (
        <Magic key={c.id}>
          <Glass>
            <Text style={{ color: C.lavender, fontSize: 22 }}>✧ {c.name}</Text>
            <Sub>
              {c.memoryIds
                .map((id) => memories.find((m) => m.id === id)?.title)
                .filter(Boolean)
                .join(" · ")}
            </Sub>
            <View style={{ gap: 8, marginTop: 12 }}>
              <Button
                label="See in my galaxy"
                onPress={() =>
                  router.push({
                    pathname: "/universe",
                    params: { constellation: c.id },
                  })
                }
              />
              <Button
                secondary
                label="Edit constellation"
                onPress={() => {
                  setName(c.name);
                  setIds(
                    c.memoryIds.filter((id) =>
                      memories.some((m) => m.id === id),
                    ),
                  );
                  setEditing(c.id);
                }}
              />
            </View>
          </Glass>
        </Magic>
      ))}
    </Page>
  );
}
