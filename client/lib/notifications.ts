export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function sendPipelineNotification(
  title: string,
  body: string,
  projectId?: string
) {
  if (!("serviceWorker" in navigator)) return;
  if (Notification.permission !== "granted") return;
  if (document.hasFocus()) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
      url: projectId ? `/project/${projectId}` : "/dashboard",
    });
  } catch {
    // Notification delivery is best-effort
  }
}
