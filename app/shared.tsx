import React, { useEffect, useState } from "react";
import { Image, Share, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, Field, Action, MemoryPicker, Voice } from "../src/feature-ui";
import { cloud, requireCloud, rpc, useSession } from "../src/cloud";
import { saveCloudRecord, resolveRecord } from "../src/cloud-records";
import { useMemories } from "../src/store";
import { Glass, Sub, Button } from "../src/ui";
import { C } from "../src/theme";
import { confirmRemoval, notify } from "../src/feedback";
export default function Shared() {
  const params = useLocalSearchParams<{ memoryId?: string; token?: string }>(),
    { session, loading } = useSession(),
    { memories } = useMemories();
  const [groups, setGroups] = useState<any[]>([]),
    [group, setGroup] = useState<any>(),
    [name, setName] = useState(""),
    [token, setToken] = useState(params.token || ""),
    [invitation, setInvitation] = useState(""),
    [records, setRecords] = useState<any[]>([]),
    [members, setMembers] = useState<any[]>([]),
    [invites, setInvites] = useState<any[]>([]),
    [ids, setIds] = useState<string[]>(
      params.memoryId ? [params.memoryId] : [],
    ),
    [error, setError] = useState(""),
    [open, setOpen] = useState<any>(),
    [editText, setEditText] = useState("");
  async function refresh() {
    const db = requireCloud();
    const result = await db.from("universes").select("*").order("created_at");
    if (result.error) throw result.error;
    setGroups(result.data || []);
    if (group) {
      if (!result.data?.some((g) => g.id === group.id)) {
        setGroup(undefined);
        setRecords([]);
        setOpen(undefined);
        return;
      }
      const [r, m, i] = await Promise.all([
        db
          .from("cloud_records")
          .select("*")
          .eq("universe_id", group.id)
          .order("created_at"),
        db.from("universe_members").select("*").eq("universe_id", group.id),
        group.owner_id === session?.user.id
          ? db
              .from("universe_invites")
              .select("id,universe_id,expires_at,used_at,revoked")
              .eq("universe_id", group.id)
          : Promise.resolve({ data: [], error: null }),
      ]);
      for (const result of [r, m, i]) if (result.error) throw result.error;
      setRecords(r.data || []);
      setMembers(m.data || []);
      setInvites(i.data || []);
    }
    setError("");
  }
  useEffect(() => {
    setOpen(undefined);
    if (session) void refresh().catch((e) => setError(String(e)));
    else {
      setGroup(undefined);
      setRecords([]);
      setMembers([]);
      setInvites([]);
      setInvitation("");
    }
  }, [session?.user.id, group?.id]);
  if (!cloud || !session)
    return (
      <Page title="Shared universes">
        <Sub>
          {loading
            ? "Connecting…"
            : "A private world for your favourite people. Sign in to create or join a group."}
        </Sub>
        <Button label="Open account" onPress={() => router.push("/account")} />
      </Page>
    );
  return (
    <Page title={group ? group.name : "Shared universes"}>
      <Sub>
        Only invited members can read this group. Your personal originals stay
        on your device.
      </Sub>
      {error && <Sub>{error} Check your connection and retry.</Sub>}
      <Action secondary label="Refresh / retry" run={refresh} />
      <Button
        secondary
        label="Account and cloud backup"
        onPress={() => router.push("/backup")}
      />
      {!group ? (
        <>
          <Field label="New universe name" value={name} onChange={setName} />
          <Action
            label="Create invite-only universe"
            run={async () => {
              await rpc("create_universe", { group_name: name });
              setName("");
              await refresh();
            }}
          />
          <Field
            label="Invitation link or code"
            value={token}
            onChange={setToken}
          />
          <Action
            secondary
            label="Join universe"
            run={async () => {
              const value = token.includes("token=")
                ? decodeURIComponent(token.split("token=")[1].split("&")[0])
                : token.trim();
              await rpc("accept_invite", { token: value });
              setToken("");
              await refresh();
            }}
          />
          {groups.map((g) => (
            <Button
              key={g.id}
              label={`♡ ${g.name}`}
              onPress={() => {
                setGroup(g);
                setInvitation("");
              }}
            />
          ))}
        </>
      ) : (
        <>
          <Button
            secondary
            label="All shared universes"
            onPress={() => {
              setGroup(undefined);
              setOpen(undefined);
            }}
          />
          {group.owner_id === session.user.id && (
            <>
              <Action
                label="Create a seven-day invitation"
                run={async () => {
                  const t = await rpc("create_invite", { group_id: group.id });
                  setInvitation(`echoverse://shared?token=${t}`);
                }}
              />
              {invitation && (
                <Glass>
                  <Text selectable style={{ color: C.white }}>
                    {invitation}
                  </Text>
                  <Action
                    secondary
                    label="Share invitation"
                    run={async () => {
                      await Share.share({
                        message: `Join my EchoVerse universe: ${invitation}`,
                      });
                    }}
                  />
                </Glass>
              )}
              {invites
                .filter((i) => !i.revoked && !i.used_at)
                .map((i) => (
                  <Glass key={i.id}>
                    <Sub>
                      Invitation expires{" "}
                      {new Date(i.expires_at).toLocaleString()}
                    </Sub>
                    <Action
                      secondary
                      label="Revoke invitation"
                      run={async () => {
                        await rpc("revoke_invite", { invite_id: i.id });
                        setInvitation("");
                        await refresh();
                      }}
                    />
                  </Glass>
                ))}
            </>
          )}
          <Text style={{ color: C.white, fontWeight: "700" }}>
            Share a copy of a personal memory
          </Text>
          <MemoryPicker
            selected={ids}
            onChange={(v) => setIds(v.length ? [v[v.length - 1]] : [])}
          />
          <Action
            label="Share selected memory with this group"
            run={async () => {
              const memory = memories.find((m) => m.id === ids[0]);
              if (!memory) throw Error("Choose a memory.");
              await saveCloudRecord(
                "memory",
                memory.id,
                { ...memory },
                group.id,
              );
              setIds([]);
              await refresh();
            }}
          />
          {records
            .filter((r) => r.kind === "memory")
            .map((r) => (
              <Glass key={r.id}>
                <Text style={{ color: C.pink, fontSize: 20 }}>
                  {r.payload.title}
                </Text>
                <Sub>{r.payload.date}</Sub>
                <Action
                  secondary
                  label="Open shared memory"
                  run={async () => {
                    const current = await requireCloud()
                      .from("cloud_records")
                      .select("*")
                      .eq("id", r.id)
                      .single();
                    if (current.error) throw current.error;
                    const payload = await resolveRecord(current.data.payload);
                    setOpen({ ...current.data, payload });
                    setEditText(payload.story || "");
                  }}
                />
              </Glass>
            ))}
          {open && (
            <Glass>
              <Text style={{ color: C.white, fontSize: 24 }}>
                {open.payload.title}
              </Text>
              <Sub>{open.payload.story}</Sub>
              {open.payload.photo && (
                <Image
                  source={{ uri: open.payload.photo }}
                  style={{ height: 200, width: "100%", borderRadius: 16 }}
                />
              )}
              {open.payload.audio && <Voice uri={open.payload.audio} />}
              <Sub>
                Media access expires shortly. Reopen the memory to renew it.
              </Sub>
              {open.owner_id === session.user.id && (
                <>
                  <Field
                    label="Edit shared story"
                    value={editText}
                    onChange={setEditText}
                    multiline
                  />
                  <Action
                    secondary
                    label="Save shared story"
                    run={async () => {
                      const { photo, audio, narration, ...payload } =
                        open.payload;
                      const result = await requireCloud()
                        .from("cloud_records")
                        .update({ payload: { ...payload, story: editText } })
                        .eq("id", open.id)
                        .select()
                        .single();
                      if (result.error) throw result.error;
                      setOpen(undefined);
                      await refresh();
                    }}
                  />
                </>
              )}
              {(open.owner_id === session.user.id ||
                group.owner_id === session.user.id) && (
                <Button
                  secondary
                  label="Delete shared copy"
                  onPress={() =>
                    confirmRemoval(() => {
                      void (async () => {
                        const result = await requireCloud()
                          .from("cloud_records")
                          .delete()
                          .eq("id", open.id)
                          .select();
                        if (result.error) throw result.error;
                        if (!result.data?.length)
                          throw Error(
                            "Your access changed. Refresh this universe.",
                          );
                        setOpen(undefined);
                        await refresh();
                      })().catch((e) => notify("Could not delete", String(e)));
                    })
                  }
                />
              )}
            </Glass>
          )}
          <Text style={{ color: C.white }}>Members</Text>
          {members.map((m) => (
            <View key={m.user_id}>
              <Sub>
                {m.user_id === session.user.id ? "You" : m.user_id}
                {m.user_id === group.owner_id ? " · Owner" : ""}
              </Sub>
              {m.user_id !== group.owner_id &&
                (group.owner_id === session.user.id ||
                  m.user_id === session.user.id) && (
                  <Action
                    secondary
                    label={
                      m.user_id === session.user.id
                        ? "Leave group"
                        : "Remove member"
                    }
                    run={async () => {
                      const result = await requireCloud()
                        .from("universe_members")
                        .delete()
                        .eq("universe_id", group.id)
                        .eq("user_id", m.user_id);
                      if (result.error) throw result.error;
                      setOpen(undefined);
                      await refresh();
                    }}
                  />
                )}
            </View>
          ))}
        </>
      )}
    </Page>
  );
}
