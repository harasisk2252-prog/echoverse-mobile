import { keepFile } from "./media.web";
export async function downloadMedia(url: string) {
  return (await keepFile(url, "restored"))!;
}
