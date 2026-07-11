"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { PhoneLinkCard } from "@/features/push/components/phone-link-card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { useFinancialStore } from "@/store/financial-store";
import { useMounted } from "@/hooks/use-financial-report";
import { initials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SettingsView() {
  const mounted = useMounted();
  const profile = useFinancialStore((s) => s.snapshot.profile);
  const updateProfileLocal = useFinancialStore((s) => s.updateProfileLocal);

  const [name, setName] = React.useState(profile.fullName);
  const [email, setEmail] = React.useState(profile.email);
  const [password, setPassword] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [savingName, setSavingName] = React.useState(false);
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [savingPass, setSavingPass] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(profile.fullName);
    setEmail(profile.email);
  }, [profile.fullName, profile.email]);

  if (!mounted) return <Skeleton className="h-96 w-full rounded-xl" />;

  async function saveName() {
    if (!name.trim()) return;
    setSavingName(true);
    updateProfileLocal({ fullName: name.trim() });
    if (isSupabaseConfigured) {
      try {
        await createClient().auth.updateUser({ data: { full_name: name.trim() } });
      } catch {
        /* metadata é secundário */
      }
    }
    toast.success("Nome atualizado");
    setSavingName(false);
  }

  async function saveEmail() {
    if (!email.trim() || !isSupabaseConfigured) return;
    setSavingEmail(true);
    try {
      const { error } = await createClient().auth.updateUser({ email: email.trim() });
      if (error) throw error;
      toast.success("Email em atualização", {
        description: "Confirme através do link enviado para o novo email.",
      });
    } catch (err) {
      toast.error("Não foi possível alterar o email", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingEmail(false);
    }
  }

  async function savePassword() {
    if (password.length < 6 || !isSupabaseConfigured) return;
    setSavingPass(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      toast.success("Palavra-passe alterada");
      setPassword("");
    } catch (err) {
      toast.error("Não foi possível alterar a palavra-passe", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingPass(false);
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !isSupabaseConfigured) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um ficheiro de imagem");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      updateProfileLocal({ avatarUrl: data.publicUrl });
      toast.success("Foto de perfil atualizada");
    } catch (err) {
      toast.error("Falha no upload da foto", {
        description:
          err instanceof Error ? err.message : "Verifique se o bucket 'avatars' existe.",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Definições" description="Gira a sua conta." />

      <div className="space-y-4">
        {/* Foto de perfil */}
        <Card className="gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Foto de perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4 pt-2">
            <Avatar className="size-16">
              {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />}
              <AvatarFallback className="bg-primary/15 text-lg text-primary">
                {initials(profile.fullName || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickAvatar}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Carregar foto
              </Button>
              <p className="mt-1.5 text-xs text-muted-foreground">PNG ou JPG.</p>
            </div>
          </CardContent>
        </Card>

        {/* Nome */}
        <Card className="gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nome</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3 pt-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button onClick={saveName} disabled={savingName || name === profile.fullName}>
              Guardar
            </Button>
          </CardContent>
        </Card>

        {/* Email */}
        <Card className="gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Email</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3 pt-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="email">Endereço de email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={saveEmail}
              disabled={savingEmail || email === profile.email || !email.trim()}
            >
              {savingEmail && <Loader2 className="size-4 animate-spin" />}
              Alterar
            </Button>
          </CardContent>
        </Card>

        {/* Palavra-passe */}
        <Card className="gap-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Palavra-passe</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3 pt-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="pass">Nova palavra-passe</Label>
              <Input
                id="pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <Button onClick={savePassword} disabled={savingPass || password.length < 6}>
              {savingPass && <Loader2 className="size-4 animate-spin" />}
              Alterar
            </Button>
          </CardContent>
        </Card>

        {/* Notificações no telemóvel (Web Push) */}
        <PhoneLinkCard />
      </div>
    </div>
  );
}
