export async function readMedia(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) throw Error("Unable to read the media");
  const blob = await response.blob();
  return {
    bytes: await blob.arrayBuffer(),
    type: blob.type.split(";")[0] || "application/octet-stream",
  };
}
