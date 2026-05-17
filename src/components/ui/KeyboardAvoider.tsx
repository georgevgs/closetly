import { KeyboardAvoidingView, Platform, type ViewProps } from "react-native";

type Props = ViewProps & {
  children: React.ReactNode;
};

// iOS gets padding-based avoidance (the standard pattern); Android handles
// keyboard avoidance at the system level via android:windowSoftInputMode in
// the manifest, so we pass `undefined` to opt out of the JS-side handling
// that would otherwise fight it.
export function KeyboardAvoider({ children, ...props }: Props) {
  return (
    <KeyboardAvoidingView behavior={keyboardBehavior()} {...props}>
      {children}
    </KeyboardAvoidingView>
  );
}

const keyboardBehavior = (): "padding" | undefined => {
  if (Platform.OS === "ios") return "padding";
  return undefined;
};
