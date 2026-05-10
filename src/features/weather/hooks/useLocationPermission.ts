import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";

export type LocationPermissionStatus =
  | "loading"
  | "granted"
  | "undetermined"
  | "denied";

export type UseLocationPermissionResult = {
  status: LocationPermissionStatus;
  request: () => Promise<LocationPermissionStatus>;
};

export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<LocationPermissionStatus>("loading");

  const refresh = useCallback(async () => {
    const next = await readStatus();
    setStatus(next);
    return next;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = useCallback(async (): Promise<LocationPermissionStatus> => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) {
      setStatus("granted");
      return "granted";
    }
    if (!current.canAskAgain) {
      setStatus("denied");
      return "denied";
    }
    const next = await Location.requestForegroundPermissionsAsync();
    const resolved = resolveStatus(next.granted, next.canAskAgain);
    setStatus(resolved);
    return resolved;
  }, []);

  return { status, request };
}

const readStatus = async (): Promise<LocationPermissionStatus> => {
  const current = await Location.getForegroundPermissionsAsync();
  return resolveStatus(current.granted, current.canAskAgain);
};

const resolveStatus = (
  granted: boolean,
  canAskAgain: boolean,
): LocationPermissionStatus => {
  if (granted) return "granted";
  if (canAskAgain) return "undetermined";
  return "denied";
};
