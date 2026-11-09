import { requireCloud, uploadMedia, mediaURL } from "./cloud";
export async function saveCloudRecord(
  kind: string,
  sourceId: string,
  payload: Record<string, any>,
  groupId?: string,
) {
  const db = requireCloud(),
    { data: auth, error: authError } = await db.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw Error("Sign in first.");
  const clean = { ...payload };
  for (const field of ["photo", "audio", "narration"]) delete clean[field];
  const { data: record, error } = await db
    .from("cloud_records")
    .insert({
      kind,
      source_id: sourceId,
      universe_id: groupId || null,
      payload: clean,
    })
    .select()
    .single();
  if (error) throw error;
  const uploaded: string[] = [];
  try {
    for (const field of ["photo", "audio", "narration"])
      if (payload[field]) {
        const path = `${auth.user.id}/records/${record.id}/${field}-${Date.now()}`;
        await uploadMedia(payload[field], path);
        uploaded.push(path);
        clean[field + "Path"] = path;
      }
    const result = await db
      .from("cloud_records")
      .update({ payload: clean })
      .eq("id", record.id);
    if (result.error) throw result.error;
    return record.id;
  } catch (error) {
    await db.storage.from("echoverse-private").remove(uploaded);
    await db.from("cloud_records").delete().eq("id", record.id);
    throw error;
  }
}
export async function resolveRecord(
  payload: Record<string, any>,
): Promise<Record<string, any>> {
  return {
    ...payload,
    photo: await mediaURL(payload.photoPath),
    audio: await mediaURL(payload.audioPath),
    narration: await mediaURL(payload.narrationPath),
  };
}
