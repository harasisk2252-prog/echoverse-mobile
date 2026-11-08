import { File, Paths } from "expo-file-system";

export async function keepFile(uri: string | undefined, prefix: string) {
  if (!uri) return undefined;
  const extension = uri.split("?")[0].split(".").pop();
  const ext =
    extension && /^[a-z0-9]{1,8}$/i.test(extension) ? extension : "dat";
  const target = new File(
    Paths.document,
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
  );
  new File(uri).copy(target);
  return target.uri;
}

export async function removeFile(uri?: string) {
  if (!uri || !uri.startsWith(Paths.document.uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
