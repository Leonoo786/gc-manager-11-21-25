"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Upload,
  Globe2,
  Settings2,
  Palette,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

const STORAGE_KEY = "app-settings";

type Currency = "USD" | "CAD" | "EUR" | "GBP" | "AUD";
type DateFormat = "MM/dd/yyyy" | "dd/MM/yyyy" | "yyyy-MM-dd";

type AppSettings = {
  companyName: string;
  companyTagline: string;
  contactEmail: string;
  contactPhone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  logoUrl: string | null;
  currency: Currency;
  dateFormat: DateFormat;
  showBudgetInK: boolean;
  enableEmailNotifications: boolean;
  enableTaskReminders: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Fancy Brothers Constructions",
  companyTagline: "Building better spaces, one project at a time.",
  contactEmail: "manager@example.com",
  contactPhone: "(555) 123-4567",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  website: "",
  logoUrl: null,
  currency: "USD",
  dateFormat: "MM/dd/yyyy",
  showBudgetInK: false,
  enableEmailNotifications: true,
  enableTaskReminders: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isMounted, setIsMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults so new fields don't break old data
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
    setIsMounted(true);
  }, []);

  // Persist to localStorage whenever settings change (after mount)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      console.warn("Could not save settings to localStorage");
    }
  }, [settings, isMounted]);

  const handleLogoUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setSettings((prev) => ({ ...prev, logoUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleFakeSaveClick = () => {
    // You’re already auto-saving via useEffect; this is just a “Saved” feel
    setSaving(true);
    setTimeout(() => setSaving(false), 800);
  };

  if (!isMounted) {
    return (
      <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your company profile, branding, and app preferences.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFakeSaveClick}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Settings2 className="h-4 w-4 mr-2" />
              Settings saved
            </>
          )}
        </Button>
      </div>

      {/* Layout: 2 columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
        {/* Left column – company & branding */}
        <div className="space-y-6">
          {/* Company info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-sky-500" />
                Company Profile
              </CardTitle>
              <CardDescription>
                This information appears throughout the app and on reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings((p) => ({ ...p, companyName: e.target.value }))
                  }
                  placeholder="e.g., Fancy Brothers Constructions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyTagline">Tagline</Label>
                <Input
                  id="companyTagline"
                  value={settings.companyTagline}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      companyTagline: e.target.value,
                    }))
                  }
                  placeholder="e.g., Building better spaces, one project at a time."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        contactEmail: e.target.value,
                      }))
                    }
                    placeholder="e.g., manager@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.contactPhone}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        contactPhone: e.target.value,
                      }))
                    }
                    placeholder="e.g., (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={settings.streetAddress}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      streetAddress: e.target.value,
                    }))
                  }
                  placeholder="e.g., 123 Main St"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, city: e.target.value }))
                    }
                    placeholder="e.g., Houston"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    value={settings.state}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, state: e.target.value }))
                    }
                    placeholder="e.g., TX"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr,2fr]">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={settings.zipCode}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, zipCode: e.target.value }))
                    }
                    placeholder="e.g., 77002"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, website: e.target.value }))
                    }
                    placeholder="e.g., https://fancybrothers.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Palette className="h-4 w-4 text-violet-500" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize your logo and how your company appears in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? (
                    <Image
                      src={settings.logoUrl}
                      alt="Company logo"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground text-center px-2">
                      No logo
                      <br />
                      uploaded
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleLogoUpload(e.target.files?.[0] || null)
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    {settings.logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSettings((p) => ({ ...p, logoUrl: null }))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: square PNG or SVG, at least 256×256px.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branding-preview">Preview Text</Label>
                <Textarea
                  id="branding-preview"
                  readOnly
                  value={`${settings.companyName} — ${settings.companyTagline}`}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  This is how your name and tagline might appear in headers,
                  emails, and reports.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column – preferences */}
        <div className="space-y-6">
          {/* Regional / currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe2 className="h-4 w-4 text-emerald-500" />
                Regional & Currency
              </CardTitle>
              <CardDescription>
                Control how money and dates appear across the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value: Currency) =>
                    setSettings((p) => ({ ...p, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value: DateFormat) =>
                    setSettings((p) => ({ ...p, dateFormat: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">
                      MM/dd/yyyy (US) — 04/15/2025
                    </SelectItem>
                    <SelectItem value="dd/MM/yyyy">
                      dd/MM/yyyy (EU) — 15/04/2025
                    </SelectItem>
                    <SelectItem value="yyyy-MM-dd">
                      yyyy-MM-dd — 2025-04-15
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Show budgets in “k”</p>
                  <p className="text-xs text-muted-foreground">
                    Example: $250,000 → $250k in certain summaries.
                  </p>
                </div>
                <Switch
                  checked={settings.showBudgetInK}
                  onCheckedChange={(checked) =>
                    setSettings((p) => ({ ...p, showBudgetInK: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications / reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings2 className="h-4 w-4 text-orange-500" />
                Notifications & Reminders
              </CardTitle>
              <CardDescription>
                These preferences control how the app surfaces important changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Used when future email features are enabled (e.g., sending reports).
                  </p>
                </div>
                <Switch
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings((p) => ({
                      ...p,
                      enableEmailNotifications: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Task reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Controls whether the app highlights overdue / upcoming tasks more aggressively.
                  </p>
                </div>
                <Switch
                  checked={settings.enableTaskReminders}
                  onCheckedChange={(checked) =>
                    setSettings((p) => ({
                      ...p,
                      enableTaskReminders: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
