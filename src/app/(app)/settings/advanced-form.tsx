
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, AlertTriangle } from 'lucide-react';

export function AdvancedForm() {
  const { toast } = useToast();

  const handleExportData = () => {
    try {
      const dataToExport: { [key: string]: any } = {};
      const keys = ['projects', 'budgetCategories', 'vendors'];
      
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          dataToExport[key] = JSON.parse(item);
        }
      });

      if (Object.keys(dataToExport).length === 0) {
        toast({
          variant: "destructive",
          title: "No Data Found",
          description: "There is no data to export.",
        });
        return;
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "app-data-backup.json";

      link.click();

      toast({
        title: "Export Successful",
        description: "Your data has been downloaded as app-data-backup.json.",
      });

    } catch (error) {
      console.error("Failed to export data:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while trying to export your data.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>
          System administration and data management options.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-medium">Data Management</h3>
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
            <AlertTriangle className="h-4 w-4 !text-red-500" />
            <AlertTitle className="font-bold">Reset Project Data</AlertTitle>
            <AlertDescription>
              <div className="flex justify-between items-center">
                <p>
                  This action will permanently delete all project data
                  including budgets, tasks, documents, and photos. User
                  accounts will be preserved.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Reset All Project Data</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all project data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </AlertDescription>
          </Alert>
        </div>
        <div className="space-y-4">
          <h3 className="font-medium">Data Export</h3>
          <Card className="bg-muted/50">
            <CardContent className="p-6 flex justify-between items-center">
                <div>
                    <p className="font-medium">Export all your project data for backup or transfer purposes.</p>
                </div>
                <Button variant="outline" className="bg-background" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
