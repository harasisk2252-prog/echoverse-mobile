import React, { useState } from "react";
import { router } from "expo-router";
import { Page, Action } from "../src/feature-ui";
import { cloud, requireCloud, useSession } from "../src/cloud";
import { saveCloudRecord, resolveRecord } from "../src/cloud-records";
import { useMemories, Memory } from "../src/store";
import { useFeatures, Features } from "../src/features";
import { downloadMedia } from "../src/download-media";
import { removeFile } from "../src/media";
import { Sub, Button } from "../src/ui";
export default function Backup() {
  const { session } = useSession(),
    { memories, restore } = useMemories(),
    { data, change } = useFeatures();
  const [message, setMessage] = useState("");
  if (!cloud || !session)
    return (
      <Page title="Your cloud backup">
        <Sub>
          Cloud backup is optional. Connect your account to back up your
          personal memories.
        </Sub>
        <Button label="Open account" onPress={() => router.push("/account")} />
      </Page>
    );
  return (
    <Page title="Your cloud backup">
      <Sub>
        Back up personal memories and their reflections, constellations,
        chapters, snapshots, and rituals to your account. The original
        shared-demo category stays local. Existing backups are retained; each
        backup is a complete new snapshot.
      </Sub>
      <Button
        secondary
        label="Manage account"
        onPress={() => router.push("/account")}
      />
      <Action
        label="Back up my personal universe now"
        run={async () => {
          const batch = Date.now().toString(36),
            created: string[] = [];
          try {
            const personal = memories.filter((m) => m.universe === "private");
            for (const m of personal) {
              setMessage(`Backing up ${m.title}…`);
              created.push(
                await saveCloudRecord("memory", `${batch}:${m.id}`, {
                  ...m,
                  batch,
                }),
              );
            }
            for (const [kind, rows] of [
              ["reflection", data.reflections],
              ["constellation", data.constellations],
              ["chapter", data.chapters],
              ["snapshot", data.snapshots],
              ["ritual", data.rituals],
            ] as const) {
              for (const row of rows)
                created.push(
                  await saveCloudRecord(kind, `${batch}:${row.id}`, {
                    ...row,
                    batch,
                  }),
                );
            }
            await saveCloudRecord("snapshot", `manifest:${batch}`, {
              manifest: true,
              batch,
              recordIds: created,
              settings: data.settings,
              completedAt: Date.now(),
            });
            setMessage(
              "Backup complete. Your original memories remain on this device.",
            );
          } catch (e) {
            setMessage(
              "Backup incomplete. Previous completed backups are safe. Retry when connected.",
            );
            throw e;
          }
        }}
      />
      <Action
        secondary
        label="Restore missing items from latest complete backup"
        run={async () => {
          const db = requireCloud();
          const result = await db
            .from("cloud_records")
            .select("*")
            .is("universe_id", null)
            .eq("kind", "snapshot")
            .contains("payload", { manifest: true })
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (result.error)
            throw Error("No complete backup found in this account.");
          const manifest = result.data.payload;
          const rows = await db
            .from("cloud_records")
            .select("*")
            .in("id", manifest.recordIds);
          if (rows.error) throw rows.error;
          if (rows.data.length !== manifest.recordIds.length)
            throw Error("Backup is incomplete. Nothing was restored.");
          const downloaded: string[] = [];
          const restored: any[] = [];
          try {
            for (const row of rows.data) {
              const existing =
                row.kind === "memory"
                  ? memories.some((m) => m.id === row.payload.id)
                  : (
                      data[
                        (
                          {
                            reflection: "reflections",
                            constellation: "constellations",
                            chapter: "chapters",
                            snapshot: "snapshots",
                            ritual: "rituals",
                          } as const
                        )[row.kind as "reflection"]
                      ] as any[]
                    )?.some((r) => r.id === row.payload.id);
              if (existing) continue;
              const payload = await resolveRecord(row.payload);
              for (const field of ["photo", "audio", "narration"])
                if (payload[field]) {
                  payload[field] = await downloadMedia(payload[field]);
                  downloaded.push(payload[field]);
                }
              delete payload.batch;
              delete payload.photoPath;
              delete payload.audioPath;
              delete payload.narrationPath;
              restored.push({ ...row, payload });
            }
            await restore(
              restored
                .filter((r) => r.kind === "memory")
                .map((r) => r.payload as Memory),
            );
            // Memories commit first. Keep downloaded media if feature restore subsequently fails; retry is idempotent.
            downloaded.length = 0;
            await change((d) => {
              const next = { ...d };
              for (const [kind, key] of [
                ["reflection", "reflections"],
                ["constellation", "constellations"],
                ["chapter", "chapters"],
                ["snapshot", "snapshots"],
                ["ritual", "rituals"],
              ] as const)
                (next[key] as any[]) = [
                  ...d[key],
                  ...restored
                    .filter(
                      (r) =>
                        r.kind === kind &&
                        !d[key].some((old) => old.id === r.payload.id),
                    )
                    .map((r) => r.payload),
                ];
              return next;
            });
            setMessage(
              "Missing items restored. Existing memories and settings were not overwritten.",
            );
          } catch (e) {
            await Promise.allSettled(downloaded.map(removeFile));
            throw e;
          }
        }}
      />
      {message && <Sub>{message}</Sub>}
    </Page>
  );
}
