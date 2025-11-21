"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  Layers2,
  Settings,
  Users2,
  CalendarClock,
  Image as ImageIcon,
  DollarSign,
  FileSpreadsheet,
  Briefcase,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const primaryNav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Home },
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Budget", href: "/budget", icon: DollarSign },
      { title: "Schedule", href: "/schedule", icon: CalendarClock },
      { title: "Tasks", href: "/tasks", icon: ClipboardList },
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Team", href: "/team", icon: Users2 },
      { title: "Photos", href: "/photos", icon: ImageIcon },
      { title: "Estimating", href: "/estimating", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Financial",
    items: [
      { title: "Profit & Loss", href: "/profit-loss", icon: BarChart3 },
      { title: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Contractors", href: "/contractors", icon: Briefcase },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const budgetChildren: NavItem[] = [
  {
    title: "Budget Categories",
    href: "/budget-categories",
    icon: Layers2,
  },
];

const contractorsChildren: NavItem[] = [
  {
    title: "Vendors",
    href: "/vendors",
    icon: Building2,
  },
];

function NavSection({
  group,
  path,
}: {
  group: NavGroup;
  path: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => {
            const isActive = path.startsWith(item.href);
            const children =
              item.href === "/budget"
                ? budgetChildren
                : item.href === "/contractors"
                ? contractorsChildren
                : [];

            return (
              <div key={item.href} className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {children.length > 0 && (
                  <div className="ml-8 space-y-1">
                    {children.map((child) => {
                      const childActive = path.startsWith(child.href);
                      return (
                        <SidebarMenuItem key={child.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={childActive}
                            size="sm"
                          >
                            <Link href={child.href}>
                              <child.icon className="h-3 w-3" />
                              <span className="text-xs">
                                {child.title}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        {primaryNav.map((group) => (
          <NavSection key={group.label} group={group} path={pathname} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
