import { KeyboardAvoidingView, type ViewProps } from "react-native";

type Props = ViewProps & {
  children: React.ReactNode;
};

export function KeyboardAvoider({ children, ...props }: Props) {
  return (
    <KeyboardAvoidingView behavior="padding" {...props}>
      {children}
    </KeyboardAvoidingView>
  );
}
