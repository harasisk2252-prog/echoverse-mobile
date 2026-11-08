import { Alert, Platform } from "react-native";

export function notify(title: string, message = "") {
  if (Platform.OS === "web") window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
}

export function confirmRemoval(onConfirm: () => void) {
  const message = "This will permanently remove the memory from this device.";
  if (Platform.OS === "web") {
    if (window.confirm(`Remove this star?\n${message}`)) onConfirm();
  } else {
    Alert.alert("Remove this star?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onConfirm },
    ]);
  }
}
