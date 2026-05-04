import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function AppLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="closet">
        <NativeTabs.Trigger.Label>Closet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="suitcase" md="luggage" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
