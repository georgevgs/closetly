import { useState } from "react";
import { View, TextInput } from "react-native";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { KeyboardAvoider } from "~/components/ui/KeyboardAvoider";
import { ConsentLine } from "~/features/legal/components/ConsentLine";
import { supabase } from "~/lib/supabase";

type Mode = "email" | "code";

const OTP_LENGTH = 6;

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmedEmail = email.trim();
  const trimmedCode = code.trim();
  const emailHint = emailHintFor(trimmedEmail);
  const codeHint = codeHintFor(trimmedCode);

  async function sendCode() {
    if (emailHint !== null) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Code sent — check your inbox");
    setMode("code");
  }

  async function verifyCode() {
    if (codeHint !== null) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedCode,
      type: "email",
    });
    setLoading(false);
    if (error) toast.error(error.message);
  }

  return (
    <Screen className="px-6">
      <KeyboardAvoider className="flex-1 justify-between py-12">
        <View>
          <Text variant="display" className="mb-2">
            Closetly
          </Text>
          <Text variant="caption">
            Smart outfit pairings, picked from your closet.
          </Text>
        </View>

        {mode === "email" && (
          <EmailStep
            email={email}
            onChangeEmail={setEmail}
            onSubmit={sendCode}
            loading={loading}
            hint={emailHint}
          />
        )}
        {mode === "code" && (
          <CodeStep
            code={code}
            onChangeCode={setCode}
            onSubmit={verifyCode}
            onUseDifferentEmail={() => {
              setMode("email");
              setCode("");
            }}
            loading={loading}
            hint={codeHint}
          />
        )}

        <ConsentLine />
      </KeyboardAvoider>
    </Screen>
  );
}

function EmailStep({
  email,
  onChangeEmail,
  onSubmit,
  loading,
  hint,
}: {
  email: string;
  onChangeEmail: (next: string) => void;
  onSubmit: () => void;
  loading: boolean;
  hint: string | null;
}) {
  return (
    <View className="gap-4">
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
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          value={email}
          onChangeText={onChangeEmail}
        />
        <HintLine hint={hint} />
      </View>
      <Button
        label="Continue with email"
        onPress={onSubmit}
        loading={loading}
        disabled={hint !== null}
      />
    </View>
  );
}

function CodeStep({
  code,
  onChangeCode,
  onSubmit,
  onUseDifferentEmail,
  loading,
  hint,
}: {
  code: string;
  onChangeCode: (next: string) => void;
  onSubmit: () => void;
  onUseDifferentEmail: () => void;
  loading: boolean;
  hint: string | null;
}) {
  return (
    <View className="gap-4">
      <View>
        <Text variant="label" className="mb-2">
          6-digit code
        </Text>
        <TextInput
          className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark text-center text-2xl tracking-[0.5em]"
          placeholder="------"
          placeholderTextColor="#d6d3d1"
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          value={code}
          onChangeText={onChangeCode}
        />
        <HintLine hint={hint} />
      </View>
      <Button
        label="Verify"
        onPress={onSubmit}
        loading={loading}
        disabled={hint !== null}
      />
      <Button
        label="Use a different email"
        variant="ghost"
        onPress={onUseDifferentEmail}
      />
    </View>
  );
}

function HintLine({ hint }: { hint: string | null }) {
  if (hint === null) return null;
  return (
    <Text variant="caption" className="mt-2">
      {hint}
    </Text>
  );
}

const emailHintFor = (trimmed: string): string | null => {
  if (trimmed.length === 0) return "Enter your email to continue";
  if (!isPlausibleEmail(trimmed)) return "That doesn't look like a valid email";
  return null;
};

const isPlausibleEmail = (value: string): boolean => {
  if (!value.includes("@")) return false;
  const [local, domain] = value.split("@");
  if (local.length === 0) return false;
  if (!domain || !domain.includes(".")) return false;
  return true;
};

const codeHintFor = (trimmed: string): string | null => {
  if (trimmed.length === 0) return "Enter the 6-digit code";
  if (trimmed.length < OTP_LENGTH) return `${OTP_LENGTH - trimmed.length} more to go`;
  if (!/^\d{6}$/.test(trimmed)) return "Code should be 6 digits";
  return null;
};

