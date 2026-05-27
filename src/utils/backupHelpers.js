export const buildBackupData = ({ habits, tasks, pantry, taskHistory, ghostHabits, prefs, weekStats }) => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  habits,
  tasks,
  pantry,
  taskHistory,
  ghostHabits,
  prefs,
  weekStats,
});

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const exportBackupData = async (data) => {
  const json = JSON.stringify(data, null, 2);
  const fileName = `taskomon-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (Capacitor.isNativePlatform()) {
    // Write to cache then open the share sheet — this lets the user save to
    // Google Drive, Files, email, etc., all of which are reachable by the
    // import file picker. Saving directly to app storage would hide the file
    // from the picker on Android 11+ (scoped storage restriction).
    await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: "utf8",
    });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({
      title: "Taskomon Backup",
      text: "Your Taskomon backup file",
      url: uri,
      dialogTitle: "Save your backup",
    });
  } else {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

export const validateBackup = (data) => {
  if (!data || typeof data !== "object") throw new Error("Invalid format");
  if (!data.version) throw new Error("Missing version field");
  if (!Array.isArray(data.habits)) throw new Error("Missing habits");
  if (!Array.isArray(data.tasks)) throw new Error("Missing tasks");
  if (!data.prefs || typeof data.prefs !== "object") throw new Error("Missing prefs");
  return true;
};

export const readJSONFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch {
        reject(new Error("File is not valid JSON"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
