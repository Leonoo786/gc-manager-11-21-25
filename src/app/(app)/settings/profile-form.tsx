
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


const initialDepartments = [
    { value: 'construction', label: 'Construction' },
    { value: 'design', label: 'Design' },
    { value: 'management', label: 'Management' },
];

function CreatableCombobox({
    options,
    value,
    onValueChange,
    onNewCreate,
    placeholder,
    searchPlaceholder,
    emptyPlaceholder,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (value: string) => void;
    onNewCreate: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    emptyPlaceholder: string;
  }) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
  
    const handleSelect = (currentValue: string) => {
      const option = options.find(opt => opt.label.toLowerCase() === currentValue.toLowerCase());
      onValueChange(option ? option.value : currentValue);
      setOpen(false);
    };

    const handleCreate = () => {
        if (inputValue && !options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase())) {
            onNewCreate(inputValue);
            onValueChange(inputValue.toLowerCase().replace(/\s/g, '-'));
        }
        setOpen(false);
    }

    const currentLabel = options.find((option) => option.value === value)?.label || value;
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {currentLabel || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput 
                placeholder={searchPlaceholder} 
                value={inputValue}
                onValueChange={setInputValue}
            />
            <CommandList>
                <CommandEmpty>
                    {inputValue ? (
                        <Button variant="outline" className="w-full" onClick={handleCreate}>
                            Create "{inputValue}"
                        </Button>
                    ) : emptyPlaceholder}
                </CommandEmpty>
                <CommandGroup>
                {options.map((option) => (
                    <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.label)}
                    value={option.label}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {option.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }


export function ProfileForm() {
    const [isMounted, setIsMounted] = React.useState(false);
    const [avatar, setAvatar] = React.useState("https://picsum.photos/seed/form-avatar/128");
    const [departments, setDepartments] = React.useState(initialDepartments);
    const [selectedDepartment, setSelectedDepartment] = React.useState('construction');
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setIsMounted(true);
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            setAvatar(savedAvatar);
        }
        const savedDepartments = localStorage.getItem('userDepartments');
        if (savedDepartments) {
            setDepartments(JSON.parse(savedDepartments));
        }
    }, []);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatar(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        localStorage.setItem('userAvatar', avatar);
        localStorage.setItem('userDepartments', JSON.stringify(departments));
        localStorage.setItem('userSelectedDepartment', selectedDepartment);
        toast({
            title: "Profile Saved",
            description: "Your profile information has been updated.",
        });
    };

    const handleCreateDepartment = (newDepartmentLabel: string) => {
        const newDepartmentValue = newDepartmentLabel.toLowerCase().replace(/\s/g, '-');
        const newDepartment = { value: newDepartmentValue, label: newDepartmentLabel };
        if (!departments.some(d => d.value === newDepartmentValue)) {
            setDepartments(prev => [...prev, newDepartment]);
        }
    };

    if (!isMounted) {
        return null; // Or a loading skeleton
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your personal and contact information.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={avatar} data-ai-hint="person face" />
            <AvatarFallback>GU</AvatarFallback>
          </Avatar>
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/*"
            />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Change Photo
          </Button>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" defaultValue="Guest" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" defaultValue="User" />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex.rodriguez@example.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <Input id="job-title" defaultValue="Admin" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                 <CreatableCombobox
                    options={departments}
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                    onNewCreate={handleCreateDepartment}
                    placeholder="Select a department"
                    searchPlaceholder="Search or create..."
                    emptyPlaceholder="No department found."
                 />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" defaultValue="A brief description about yourself" />
            </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button className="ml-auto" onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
