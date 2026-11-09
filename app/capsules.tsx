import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Page, Field, Action, Recorder, Voice, Magic } from "../src/feature-ui";
import {
  cloud,
  requireCloud,
  rpc,
  useSession,
  uploadMedia,
  mediaURL,
} from "../src/cloud";
import { Glass, Sub, Button } from "../src/ui";
import { C } from "../src/theme";
import { isValidDate, localDate } from "../src/date";
export default function Capsules() {
  const { session } = useSession();
  const [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [date, setDate] = useState(localDate()),
    [time, setTime] = useState("12:00"),
    [audio, setAudio] = useState<string>(),
    [recording, setRecording] = useState(false),
    [items, setItems] = useState<any[]>([]),
    [opened, setOpened] = useState<any>(),
    [reply, setReply] = useState(""),
    [replyAudio, setReplyAudio] = useState<string>(),
    [replies, setReplies] = useState<any[]>([]),
    [error, setError] = useState("");
  async function refresh() {
    setItems(await rpc("capsule_status"));
    setError("");
  }
  async function openCapsule(c: any) {
    const db = requireCloud();
    const result = await db
      .from("capsule_bodies")
      .select("*")
      .eq("capsule_id", c.id)
      .single();
    if (result.error)
      throw Error(
        "This message is still sealed or unavailable. Refresh when connected.",
      );
    const r = await db
      .from("capsule_replies")
      .select("*")
      .eq("capsule_id", c.id)
      .order("created_at");
    if (r.error) throw r.error;
    setOpened({
      ...c,
      ...result.data,
      audio: await mediaURL(result.data.audio_path),
    });
    setReplies(
      await Promise.all(
        (r.data || []).map(async (row) => ({
          ...row,
          audio: await mediaURL(row.audio_path),
        })),
      ),
    );
  }
  useEffect(() => {
    if (session) void refresh().catch((e) => setError(String(e)));
    else {
      setItems([]);
      setOpened(undefined);
      setReplies([]);
    }
  }, [session?.user.id]);
  if (!cloud || !session)
    return (
      <Page title="Messages through time">
        <Sub>
          Sign in to seal a message. Release is checked by the server, so
          changing your phone clock cannot open it early.
        </Sub>
        <Button
          label="Connect my account"
          onPress={() => router.push("/account")}
        />
      </Page>
    );
  return (
    <Page title="Messages through time">
      <Sub>
        Say something to the person you are becoming. The release time below
        uses this device’s timezone.
      </Sub>
      {error && <Sub>{error}</Sub>}
      <Field
        label="Envelope title (visible while sealed)"
        value={title}
        onChange={setTitle}
      />
      <Field label="Your message" value={body} onChange={setBody} multiline />
      <Recorder onChange={setAudio} onBusy={setRecording} />
      {audio && <Voice uri={audio} />}
      <Field
        label="Release date (YYYY-MM-DD)"
        value={date}
        onChange={setDate}
      />
      <Field label="Local time (HH:mm)" value={time} onChange={setTime} />
      <Action
        label="Seal for my future self"
        disabled={recording}
        run={async () => {
          if (!title.trim() || (!body.trim() && !audio))
            throw Error("Add a title and text or voice.");
          if (!isValidDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
            throw Error("Enter a valid date and 24-hour time.");
          const release = new Date(`${date}T${time}:00`).toISOString();
          const id = await rpc("create_capsule", {
            capsule_title: title,
            release_at: release,
          });
          let path: string | undefined;
          try {
            if (audio)
              path = await uploadMedia(
                audio,
                `${session.user.id}/capsules/${id}/original-${Date.now()}`,
              );
            await rpc("seal_capsule", {
              capsule_id: id,
              message: body,
              voice_path: path || null,
            });
          } catch (e) {
            if (path)
              await requireCloud()
                .storage.from("echoverse-private")
                .remove([path]);
            await requireCloud().from("capsules").delete().eq("id", id);
            throw e;
          }
          setTitle("");
          setBody("");
          setAudio(undefined);
          await refresh();
        }}
      />
      <Action secondary label="Check for messages / retry" run={refresh} />
      {items.map((c) => (
        <Glass key={c.id}>
          <Text style={{ color: C.lavender, fontSize: 22 }}>
            {c.available ? "✦" : "⌛"} {c.title}
          </Text>
          <Sub>
            {c.sealed
              ? c.available
                ? "Ready to open"
                : "Sealed"
              : "Unfinished upload"}{" "}
            · {new Date(c.unlock_at).toLocaleString()}
          </Sub>
          {c.available && (
            <Action label="Open my message" run={() => openCapsule(c)} />
          )}
        </Glass>
      ))}
      {opened && (
        <Magic celebrate>
          <Glass>
            <Text style={{ color: C.white, fontSize: 24 }}>{opened.title}</Text>
            <Sub>{opened.body}</Sub>
            {opened.audio && <Voice uri={opened.audio} />}
            <View style={{ gap: 12, marginTop: 16 }}>
              {replies.map((r) => (
                <Glass key={r.id}>
                  <Sub>{new Date(r.created_at).toLocaleString()}</Sub>
                  <Text style={{ color: C.white }}>{r.body}</Text>
                  {r.audio && <Voice uri={r.audio} />}
                </Glass>
              ))}
              <Field
                label="Reply to your past self"
                value={reply}
                onChange={setReply}
                multiline
              />
              <Recorder onChange={setReplyAudio} onBusy={setRecording} />
              <Action
                label="Keep this reply"
                disabled={recording}
                run={async () => {
                  if (!reply.trim() && !replyAudio)
                    throw Error("Add text or voice.");
                  let path: string | undefined;
                  if (replyAudio)
                    path = await uploadMedia(
                      replyAudio,
                      `${session.user.id}/capsules/${opened.id}/reply-${Date.now()}`,
                    );
                  const result = await requireCloud()
                    .from("capsule_replies")
                    .insert({
                      capsule_id: opened.id,
                      body: reply,
                      audio_path: path || null,
                    });
                  if (result.error) {
                    if (path)
                      await requireCloud()
                        .storage.from("echoverse-private")
                        .remove([path]);
                    throw result.error;
                  }
                  setReply("");
                  setReplyAudio(undefined);
                  await openCapsule(opened);
                }}
              />
            </View>
          </Glass>
        </Magic>
      )}
    </Page>
  );
}
