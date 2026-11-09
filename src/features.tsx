import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Text, View } from "react-native";
import type { Mood } from "./theme";

export type Reflection = {
  id: string;
  memoryId: string;
  text: string;
  audio?: string;
  createdAt: number;
};
export type Constellation = { id: string; name: string; memoryIds: string[] };
export type Chapter = {
  id: string;
  title: string;
  description: string;
  targetDate?: string;
  memoryId?: string;
  completedAt?: number;
};
export type Snapshot = {
  id: string;
  memoryId: string;
  month: string;
  mood?: Mood;
  song: string;
  detail: string;
  dream: string;
};
export type Ritual = {
  id: string;
  name: string;
  memoryIds: string[];
  captions: Record<string, string>;
  narration?: string;
  ambient: boolean;
};
export type Features = {
  version: 2;
  reflections: Reflection[];
  constellations: Constellation[];
  chapters: Chapter[];
  snapshots: Snapshot[];
  rituals: Ritual[];
  settings: { haptics: boolean; sound: boolean; reduceMotion: boolean };
};
export const emptyFeatures = (): Features => ({
  version: 2,
  reflections: [],
  constellations: [],
  chapters: [],
  snapshots: [],
  rituals: [],
  settings: { haptics: true, sound: false, reduceMotion: false },
});
export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
export const FEATURE_KEY = "echoverse-features-v2";
export function validateFeatures(data: any): data is Features {
  const strings = (a: any) =>
    Array.isArray(a) && a.every((s: any) => typeof s === "string");
  return (
    data?.version === 2 &&
    Array.isArray(data.reflections) &&
    data.reflections.every(
      (r: any) =>
        typeof r.id === "string" &&
        typeof r.memoryId === "string" &&
        typeof r.text === "string" &&
        Number.isFinite(r.createdAt) &&
        (r.audio === undefined || typeof r.audio === "string"),
    ) &&
    Array.isArray(data.constellations) &&
    data.constellations.every(
      (r: any) =>
        typeof r.id === "string" &&
        typeof r.name === "string" &&
        strings(r.memoryIds),
    ) &&
    Array.isArray(data.chapters) &&
    data.chapters.every(
      (r: any) =>
        typeof r.id === "string" &&
        typeof r.title === "string" &&
        typeof r.description === "string" &&
        (r.memoryId === undefined || typeof r.memoryId === "string"),
    ) &&
    Array.isArray(data.snapshots) &&
    data.snapshots.every(
      (r: any) =>
        typeof r.id === "string" &&
        typeof r.memoryId === "string" &&
        typeof r.month === "string",
    ) &&
    Array.isArray(data.rituals) &&
    data.rituals.every(
      (r: any) =>
        typeof r.id === "string" &&
        typeof r.name === "string" &&
        strings(r.memoryIds) &&
        r.captions &&
        typeof r.captions === "object" &&
        typeof r.ambient === "boolean",
    ) &&
    ["haptics", "sound", "reduceMotion"].every(
      (k) => typeof data.settings?.[k] === "boolean",
    )
  );
}
type FeatureStore = {
  data: Features;
  change: (fn: (current: Features) => Features) => Promise<void>;
};
const Context = createContext<FeatureStore | null>(null);
export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Features | null>(null),
    [error, setError] = useState("");
  const current = useRef(emptyFeatures()),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FEATURE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!validateFeatures(parsed))
            throw Error(
              "Feature data is invalid; the original has been preserved.",
            );
          current.current = parsed;
        } else {
          const old = await AsyncStorage.getItem("echoverse-v1");
          if (
            old !== null &&
            (await AsyncStorage.getItem("echoverse-v1-backup")) === null
          )
            await AsyncStorage.setItem("echoverse-v1-backup", old);
          await AsyncStorage.setItem(
            FEATURE_KEY,
            JSON.stringify(current.current),
          );
        }
        if (live) setData(current.current);
      } catch (e) {
        if (live) setError(String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, []);
  function change(fn: (data: Features) => Features) {
    const task = queue.current
      .catch(() => {})
      .then(async () => {
        const next = fn(current.current);
        if (!validateFeatures(next)) throw Error("Invalid feature data");
        await AsyncStorage.setItem(FEATURE_KEY, JSON.stringify(next));
        current.current = next;
        setData(next);
      });
    queue.current = task;
    return task;
  }
  if (!data)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#090719",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {error ? (
          <Text style={{ color: "white" }}>
            {error} Close and reopen to retry.
          </Text>
        ) : (
          <ActivityIndicator color="#d4aaff" />
        )}
      </View>
    );
  return (
    <Context.Provider value={{ data, change }}>{children}</Context.Provider>
  );
}
export function useFeatures() {
  const value = useContext(Context);
  if (!value) throw Error("Missing FeatureProvider");
  return value;
}
