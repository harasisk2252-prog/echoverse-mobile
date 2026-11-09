import { File } from "expo-file-system";
export async function readMedia(uri: string) {
  const file = new File(uri);
  return {
    bytes: await file.arrayBuffer(),
    type: file.type || "application/octet-stream",
  };
}
