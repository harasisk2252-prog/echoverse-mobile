import React, { useState } from "react";
import { Page, Field, Action } from "../src/feature-ui";
import { cloud, requireCloud, useSession } from "../src/cloud";
import { Sub, Glass } from "../src/ui";
import { Text } from "react-native";
export default function Account() {
  const { session } = useSession();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [flow, setFlow] = useState<"signup" | "recovery">("signup"),
    [message, setMessage] = useState("");
  return (
    <Page title="Your cloud connection">
      <Sub>
        Personal memories stay on this device unless you explicitly back them up
        or share a copy.
      </Sub>
      {!cloud ? (
        <Glass>
          <Text style={{ color: "white" }}>Cloud setup is pending.</Text>
          <Sub>
            The owner needs to connect a Supabase project. All local personal
            features are available now.
          </Sub>
        </Glass>
      ) : (
        <>
          {session && (
            <>
              <Sub>Signed in as {session.user.email}</Sub>
              <Action
                secondary
                label="Sign out"
                run={async () => {
                  const { error } = await requireCloud().auth.signOut();
                  if (error) throw error;
                }}
              />
            </>
          )}
          <Field label="Email address" value={email} onChange={setEmail} />
          <Field
            label={
              flow === "recovery"
                ? "New password (at least 8 characters)"
                : "Password (at least 8 characters)"
            }
            value={password}
            onChange={setPassword}
            secure
          />
          {!session && (
            <>
              <Action
                label="Sign in"
                run={async () => {
                  const { error } =
                    await requireCloud().auth.signInWithPassword({
                      email: email.trim(),
                      password,
                    });
                  if (error) throw error;
                  setMessage("You are connected.");
                }}
              />
              <Action
                secondary
                label="Create account"
                run={async () => {
                  if (password.length < 8)
                    throw Error("Use at least 8 characters.");
                  const { error } = await requireCloud().auth.signUp({
                    email: email.trim(),
                    password,
                  });
                  if (error) throw error;
                  setFlow("signup");
                  setMessage(
                    "Check your email to confirm your account. You can enter its confirmation code below.",
                  );
                }}
              />
            </>
          )}
          <Action
            secondary
            label="Send password recovery email"
            run={async () => {
              const { error } = await requireCloud().auth.resetPasswordForEmail(
                email.trim(),
              );
              if (error) throw error;
              setFlow("recovery");
              setMessage(
                "Check your email for a recovery code. Enter it below with your new password.",
              );
            }}
          />
          <Field
            label="Email confirmation or recovery code"
            value={code}
            onChange={setCode}
          />
          <Action
            label={
              flow === "recovery"
                ? "Verify code and set password"
                : "Verify email code"
            }
            run={async () => {
              if (flow === "recovery" && password.length < 8)
                throw Error("Use at least 8 characters.");
              const { error } = await requireCloud().auth.verifyOtp({
                email: email.trim(),
                token: code.trim(),
                type: flow,
              });
              if (error) throw error;
              if (flow === "recovery") {
                const result = await requireCloud().auth.updateUser({
                  password,
                });
                if (result.error) throw result.error;
              }
              setMessage("Verified. You can return to your universe.");
              setCode("");
              setPassword("");
            }}
          />
          {message && <Sub>{message}</Sub>}
        </>
      )}
    </Page>
  );
}
