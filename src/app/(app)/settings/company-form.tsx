
'use client';
import * as React from 'react';
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
import { Upload, Check, ChevronsUpDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const initialIndustries = [
    { value: 'construction', label: 'Construction' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'architecture', label: 'Architecture' },
];

const initialCompanySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501+', label: '501+ employees' },
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


export function CompanyForm() {
    const { toast } = useToast();
    const [isMounted, setIsMounted] = React.useState(false);

    const [companyName, setCompanyName] = React.useState('ConstructionFlow');
    const [logo, setLogo] = React.useState<string | null>(null);
    const [address, setAddress] = React.useState('123 Construction Avenue');
    const [city, setCity] = React.useState('New York');
    const [state, setState] = React.useState('NY');
    const [zipCode, setZipCode] = React.useState('10001');
    const [phone, setPhone] = React.useState('(555) 987-6543');
    const [website, setWebsite] = React.useState('https://www.constructionflow.com');

    const [industries, setIndustries] = React.useState(initialIndustries);
    const [selectedIndustry, setSelectedIndustry] = React.useState('construction');
    
    const [companySizes, setCompanySizes] = React.useState(initialCompanySizes);
    const [selectedCompanySize, setSelectedCompanySize] = React.useState('51-200');

    const [sidebarBgColor, setSidebarBgColor] = React.useState('#1e3a8a'); // Default blue
    const [sidebarBgImage, setSidebarBgImage] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            setCompanyName(localStorage.getItem('companyName') || 'ConstructionFlow');
            setLogo(localStorage.getItem('companyLogo'));
            setAddress(localStorage.getItem('companyAddress') || '123 Construction Avenue');
            setCity(localStorage.getItem('companyCity') || 'New York');
            setState(localStorage.getItem('companyState') || 'NY');
            setZipCode(localStorage.getItem('companyZipCode') || '10001');
            setPhone(localStorage.getItem('companyPhone') || '(555) 987-6543');
            setWebsite(localStorage.getItem('companyWebsite') || 'https://www.constructionflow.com');
            setIndustries(JSON.parse(localStorage.getItem('companyIndustries') || JSON.stringify(initialIndustries)));
            setSelectedIndustry(localStorage.getItem('companySelectedIndustry') || 'construction');
            setCompanySizes(JSON.parse(localStorage.getItem('companySizes') || JSON.stringify(initialCompanySizes)));
            setSelectedCompanySize(localStorage.getItem('companySelectedCompanySize') || '51-200');
            setSidebarBgColor(localStorage.getItem('sidebarBgColor') || '#1e3a8a');
            setSidebarBgImage(localStorage.getItem('sidebarBgImage'));
        }
    }, []);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSidebarImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSidebarBgImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateIndustry = (newIndustryLabel: string) => {
        const newIndustryValue = newIndustryLabel.toLowerCase().replace(/\s/g, '-');
        const newIndustry = { value: newIndustryValue, label: newIndustryLabel };
        if (!industries.some(d => d.value === newIndustryValue)) {
            setIndustries(prev => [...prev, newIndustry]);
        }
    };
    
    const handleCreateCompanySize = (newSizeLabel: string) => {
        const newSizeValue = newSizeLabel.toLowerCase().replace(/\s/g, '-');
        const newSize = { value: newSizeValue, label: newSizeLabel };
        if (!companySizes.some(d => d.value === newSizeValue)) {
            setCompanySizes(prev => [...prev, newSize]);
        }
    };

    const handleSave = () => {
        localStorage.setItem('companyName', companyName);
        if (logo) localStorage.setItem('companyLogo', logo); else localStorage.removeItem('companyLogo');
        localStorage.setItem('companyAddress', address);
        localStorage.setItem('companyCity', city);
        localStorage.setItem('companyState', state);
        localStorage.setItem('companyZipCode', zipCode);
        localStorage.setItem('companyPhone', phone);
        localStorage.setItem('companyWebsite', website);
        localStorage.setItem('companyIndustries', JSON.stringify(industries));
        localStorage.setItem('companySelectedIndustry', selectedIndustry);
        localStorage.setItem('companySizes', JSON.stringify(companySizes));
        localStorage.setItem('companySelectedCompanySize', selectedCompanySize);
        localStorage.setItem('sidebarBgColor', sidebarBgColor);
        if (sidebarBgImage) localStorage.setItem('sidebarBgImage', sidebarBgImage); else localStorage.removeItem('sidebarBgImage');

        window.dispatchEvent(new Event('storage')); // To trigger sidebar update
        toast({
            title: 'Company Information Saved',
            description: 'Your company details have been updated.',
        });
    };
    
    if (!isMounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Manage your company details and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
            <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted/50">
                    {logo ? <Image src={logo} alt="Company Logo" width={96} height={96} className="object-contain rounded-md" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                </div>
            </div>
            <div className="flex-1 space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div>
                    <Input id="logo-upload" type="file" onChange={handleLogoChange} className="hidden" accept="image/*" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <CreatableCombobox
                    options={industries}
                    value={selectedIndustry}
                    onValueChange={setSelectedIndustry}
                    onNewCreate={handleCreateIndustry}
                    placeholder="Select an industry"
                    searchPlaceholder="Search or create..."
                    emptyPlaceholder="No industry found."
                 />
            </div>
            <div className="space-y-2">
                <Label htmlFor="company-size">Company Size</Label>
                <CreatableCombobox
                    options={companySizes}
                    value={selectedCompanySize}
                    onValueChange={setSelectedCompanySize}
                    onNewCreate={handleCreateCompanySize}
                    placeholder="Select company size"
                    searchPlaceholder="Search or create..."
                    emptyPlaceholder="No size found."
                 />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={e => setState(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="zip-code">Zip Code</Label>
                <Input id="zip-code" value={zipCode} onChange={e => setZipCode(e.target.value)} />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
         <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
        <Separator />
        <div>
            <h3 className="text-lg font-medium">Sidebar Appearance</h3>
            <p className="text-sm text-muted-foreground">Customize the navigation sidebar background.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
                <Label htmlFor="sidebar-bg-color">Sidebar Background Color</Label>
                <div className="flex items-center gap-2">
                    <Input id="sidebar-bg-color" type="color" value={sidebarBgColor} onChange={e => setSidebarBgColor(e.target.value)} className="p-1 h-10 w-14" />
                    <Input type="text" value={sidebarBgColor} onChange={e => setSidebarBgColor(e.target.value)} placeholder="#1e3a8a" />
                </div>
            </div>
             <div className="space-y-2">
                <Label>Sidebar Background Image</Label>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-12 border rounded-md flex items-center justify-center bg-muted/50 overflow-hidden">
                        {sidebarBgImage ? (
                            <Image src={sidebarBgImage} alt="Sidebar preview" width={96} height={48} className="object-cover" />
                        ) : <Upload className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div>
                        <Input id="sidebar-image-upload" type="file" onChange={handleSidebarImageChange} className="hidden" accept="image/*"/>
                        <Button type="button" variant="outline" onClick={() => document.getElementById('sidebar-image-upload')?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                        </Button>
                        {sidebarBgImage && (
                             <Button type="button" variant="ghost" size="icon" className="ml-2" onClick={() => setSidebarBgImage(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                 <p className="text-xs text-muted-foreground">The image will be overlaid with a semi-transparent color.</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-6 justify-end">
        <Button onClick={handleSave}>Save Company Information</Button>
      </CardFooter>
    </Card>
  );
}
