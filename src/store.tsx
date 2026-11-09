import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Text, View } from "react-native";
import { Mood, moods } from "./theme";
import { isValidDate } from "./date";
import { removeFile } from "./media";
export type Universe = "private" | "shared";
export type Memory = {
  id: string;
  title: string;
  story: string;
  date: string;
  mood: Mood;
  universe: Universe;
  photo?: string;
  audio?: string;
  x: number;
  y: number;
  createdAt: number;
};
const seeds: Memory[] = [
  {
    id: "s1",
    title: "A beautiful beginning",
    story: "Some beginnings turn into the most wonderful chapters.",
    date: "2025-08-12",
    mood: "joy",
    universe: "private",
    x: 20,
    y: 25,
    createdAt: 1,
  },
  {
    id: "s2",
    title: "Golden hour",
    story: "A sunset I wish I could keep forever.",
    date: "2025-10-21",
    mood: "peace",
    universe: "private",
    x: 69,
    y: 21,
    createdAt: 2,
  },
  {
    id: "s3",
    title: "A little victory",
    story: "Every little step deserves to be celebrated.",
    date: "2026-02-17",
    mood: "pride",
    universe: "private",
    x: 73,
    y: 70,
    createdAt: 3,
  },
  {
    id: "s4",
    title: "Midnight laughter",
    story: "A night filled with stories and endless laughter.",
    date: "2026-06-06",
    mood: "love",
    universe: "private",
    x: 29,
    y: 69,
    createdAt: 4,
  },
  {
    id: "s5",
    title: "Our favorite day",
    story: "An unforgettable moment made together.",
    date: "2026-07-18",
    mood: "love",
    universe: "shared",
    x: 32,
    y: 37,
    createdAt: 5,
  },
  {
    id: "s6",
    title: "The adventure",
    story: "New places, familiar faces, and memories that last.",
    date: "2026-09-03",
    mood: "joy",
    universe: "shared",
    x: 71,
    y: 63,
    createdAt: 6,
  },
];

type Store = {
  memories: Memory[];
  loaded: boolean;
  add: (
    memory: Omit<Memory, "id" | "createdAt" | "x" | "y">,
  ) => Promise<string>;
  remove: (id: string) => Promise<void>;
  restore: (records: Memory[]) => Promise<void>;
};
const Context = createContext<Store | null>(null);
const KEY = "echoverse-v1";
function validMemory(m: any): m is Memory {
  return (
    m &&
    typeof m.id === "string" &&
    typeof m.title === "string" &&
    typeof m.story === "string" &&
    typeof m.date === "string" &&
    isValidDate(m.date) &&
    Object.hasOwn(moods, m.mood) &&
    ["private", "shared"].includes(m.universe) &&
    [m.x, m.y, m.createdAt].every(Number.isFinite) &&
    (m.photo === undefined || typeof m.photo === "string") &&
    (m.audio === undefined || typeof m.audio === "string")
  );
}
export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const current = useRef<Memory[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const data = raw === null ? seeds : JSON.parse(raw);
        if (!Array.isArray(data) || !data.every(validMemory))
          throw new Error(
            "Saved data is invalid. It has been preserved; do not clear app storage.",
          );
        if (active) {
          current.current = data;
          setMemories(data);
          setLoaded(true);
        }
      } catch (e) {
        if (active) setError(String(e));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  function commit(change: (previous: Memory[]) => Memory[]) {
    const next = queue.current
      .catch(() => {})
      .then(async () => {
        const data = change(current.current);
        await AsyncStorage.setItem(KEY, JSON.stringify(data));
        current.current = data;
        setMemories(data);
      });
    queue.current = next;
    return next;
  }
  const value: Store = {
    memories,
    loaded,
    add: async (m) => {
      const id =
        Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
      await commit((previous) => [
        ...previous,
        {
          ...m,
          id,
          createdAt: Date.now(),
          x: 17 + Math.random() * 65,
          y: 16 + Math.random() * 65,
        },
      ]);
      return id;
    },
    remove: async (id) => {
      const memory = current.current.find((m) => m.id === id);
      await commit((previous) => previous.filter((m) => m.id !== id));
      if (memory)
        await Promise.allSettled([
          removeFile(memory.photo),
          removeFile(memory.audio),
        ]);
    },
    restore: async (records) => {
      if (!records.every(validMemory))
        throw Error("Backup contains invalid memories. Nothing was imported.");
      await commit((previous) => [
        ...previous,
        ...records.filter(
          (m) => !previous.some((existing) => existing.id === m.id),
        ),
      ]);
    },
  };
  if (!loaded)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#090719",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {error ? (
          <Text style={{ color: "#faf4ff" }}>
            Could not load your memories. {error} Close and reopen the app to
            retry.
          </Text>
        ) : (
          <>
            <ActivityIndicator color="#d4aaff" />
            <Text style={{ color: "#faf4ff", marginTop: 12 }}>
              Opening your universe…
            </Text>
          </>
        )}
      </View>
    );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMemories() {
  const value = useContext(Context);
  if (!value) throw Error("Missing MemoryProvider");
  return value;
}
