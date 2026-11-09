import { createClient, Session } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Chunk native sessions because JWT sessions can exceed SecureStore's per-value limit.
const secureStorage = {
  async getItem(k: string) {
    const count = Number(await SecureStore.getItemAsync(k + "-count"));
    if (!count) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${k}-${i}`),
      ),
    );
    return chunks.some((c) => c === null) ? null : chunks.join("");
  },
  async setItem(k: string, v: string) {
    const old = Number(await SecureStore.getItemAsync(k + "-count"));
    const count = Math.ceil(v.length / 1000);
    for (let i = 0; i < count; i++)
      await SecureStore.setItemAsync(
        `${k}-${i}`,
        v.slice(i * 1000, (i + 1) * 1000),
      );
    await SecureStore.setItemAsync(k + "-count", String(count));
    for (let i = count; i < old; i++)
      await SecureStore.deleteItemAsync(`${k}-${i}`);
  },
  async removeItem(k: string) {
    const count = Number(await SecureStore.getItemAsync(k + "-count"));
    for (let i = 0; i < count; i++)
      await SecureStore.deleteItemAsync(`${k}-${i}`);
    await SecureStore.deleteItemAsync(k + "-count");
  },
};
export const cloud =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: Platform.OS === "web" ? undefined : secureStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: Platform.OS === "web",
        },
      })
    : null;
export function requireCloud() {
  if (!cloud)
    throw Error(
      "Cloud connection is not configured yet. Personal features still work offline.",
    );
  return cloud;
}
export function useSession() {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(!!cloud);
  useEffect(() => {
    if (!cloud) return;
    let live = true;
    void cloud.auth.getSession().then(({ data }) => {
      if (live) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return { session, loading };
}
export async function rpc(name: string, args?: Record<string, unknown>) {
  const { data, error } = await requireCloud().rpc(name, args);
  if (error) throw error;
  return data;
}
export async function mediaURL(path?: string) {
  if (!path) return undefined;
  const { data, error } = await requireCloud()
    .storage.from("echoverse-private")
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
export async function uploadMedia(uri: string, path: string) {
  const { readMedia } = await import("./read-media");
  const { bytes, type } = await readMedia(uri);
  if (bytes.byteLength > 20 * 1024 * 1024)
    throw Error("Attachments must be smaller than 20 MB.");
  const { error } = await requireCloud()
    .storage.from("echoverse-private")
    .upload(path, bytes, { contentType: type, upsert: false });
  if (error) throw error;
  return path;
}
