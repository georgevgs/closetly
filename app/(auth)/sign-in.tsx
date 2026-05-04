import { useState } from "react";
import { View, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { supabase } from "~/lib/supabase";

type Mode = "email" | "code";

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Code sent — check your inbox");
    setMode("code");
  }

  async function verifyCode() {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
  }

  return (
    <Screen className="px-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-between py-12"
      >
        <View>
          <Text variant="display" className="mb-2">
            Closetly
          </Text>
          <Text variant="caption">
            Smart outfit pairings, picked from your closet.
          </Text>
        </View>

        <View className="gap-4">
          {mode === "email" ? (
            <>
              <View>
                <Text variant="label" className="mb-2">
                  Email
                </Text>
                <TextInput
                  className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark bg-canvas dark:bg-canvas-dark"
                  placeholder="you@example.com"
                  placeholderTextColor="#a8a29e"
                  autoCapitalize="none"
                  autoCorrect={false}
                  inputMode="email"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <Button label="Continue with email" onPress={sendCode} loading={loading} />
            </>
          ) : (
            <>
              <View>
                <Text variant="label" className="mb-2">
                  6-digit code
                </Text>
                <TextInput
                  className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark text-center text-2xl tracking-[0.5em]"
                  placeholder="------"
                  placeholderTextColor="#d6d3d1"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
              <Button label="Verify" onPress={verifyCode} loading={loading} />
              <Button
                label="Use a different email"
                variant="ghost"
                onPress={() => {
                  setMode("email");
                  setCode("");
                }}
              />
            </>
          )}
        </View>

        <Text variant="caption" className="text-center">
          By continuing you agree to our terms
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}
