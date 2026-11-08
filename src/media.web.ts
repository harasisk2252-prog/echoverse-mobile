// Persist browser blobs as data URLs; object URLs expire when the page reloads.
export async function keepFile(
  uri: string | undefined,
  _prefix: string,
): Promise<string | undefined> {
  if (!uri || uri.startsWith("data:")) return uri;
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Unable to read attached media.");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to save attached media."));
    reader.readAsDataURL(blob);
  });
}

export async function removeFile(_uri?: string) {
  // Data URLs are removed with their memory record.
}
