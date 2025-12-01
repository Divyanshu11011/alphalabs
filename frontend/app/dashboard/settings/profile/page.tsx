"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserProfile } from "@/hooks/use-user";
import { useSettings } from "@/hooks/use-settings";
import { useApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const timezones = [
  { value: "UTC", label: "(UTC+00:00) UTC" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time" },
  { value: "Europe/London", label: "(UTC+00:00) London" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },
  { value: "Asia/Kolkata", label: "(UTC+05:30) India" },
];

export default function ProfileSettingsPage() {
  const { userProfile, isLoading, updateUserProfile, refetch } = useUserProfile();
  const { updateSettings, isSaving } = useSettings();
  const { user } = useUser();
  const { request } = useApi();
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(`${userProfile.first_name} ${userProfile.last_name}`.trim() || userProfile.username);
      if (userProfile.timezone) {
        setTimezone(userProfile.timezone);
      }
    }
  }, [userProfile]);

  const handleSaveChanges = async () => {
    try {
      setIsSavingProfile(true);

      // Parse display name into first and last name
      const nameParts = displayName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update Clerk user (name only)
      if (user) {
        await user.update({
          firstName: firstName,
          lastName: lastName,
        });
      }

      // Sync to database (updates name from Clerk)
      await request("/api/users/sync", { method: "POST" });

      // Update timezone via our API
      await updateUserProfile({ timezone });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center text-sm text-muted-foreground">Loading profile...</div>
          <Progress value={undefined} className="w-full" />
        </div>
      </div>
    );
  }

  const initials = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name[0]}${userProfile.last_name[0]}`
    : userProfile?.email.slice(0, 2).toUpperCase() || "U";

  const email = userProfile?.email || "";

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
          <CardDescription>Your avatar appears on certificates and across the platform</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={userProfile?.image_url} />
            <AvatarFallback className="bg-[hsl(var(--accent-purple))] text-xl text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Display Name</CardTitle>
          <CardDescription>This is how your name appears on certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Email</CardTitle>
          <CardDescription>Managed by Clerk authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input value={email} disabled className="max-w-md" />
            <Badge variant="outline" className="text-[hsl(var(--accent-green))]">
              Verified
            </Badge>
          </div>
          <Button variant="link" className="mt-2 h-auto p-0 text-xs">
            Change Email
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/30">
        <CardHeader>
          <CardTitle className="text-lg">Timezone</CardTitle>
          <CardDescription>Used for displaying timestamps</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveChanges}
          disabled={isSavingProfile}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSavingProfile ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
