import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function exportProject(
  projectId: string,
  userId: string,
  projectName: string,
  format: string = "react-native"
): Promise<boolean> {
  try {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, userId, format }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.files) return false;

    const zip = new JSZip();
    const folder = zip.folder(data.projectName || projectName) as JSZip;

    for (const [path, content] of Object.entries(data.files)) {
      folder.file(path, content as string);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const safeName = (data.projectName || projectName)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    saveAs(blob, `${safeName}.zip`);

    return true;
  } catch {
    return false;
  }
}
