import { File, Paths } from "expo-file-system";
export async function downloadMedia(url: string) {
  const target = new File(
    Paths.document,
    `restored-${Date.now()}-${Math.random().toString(36).slice(2)}.dat`,
  );
  await File.downloadFileAsync(url, target);
  return target.uri;
}
