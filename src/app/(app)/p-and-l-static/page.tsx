import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function PandLStaticPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">P&L (Static)</h1>
        <p className="text-muted-foreground">
          This page is under construction.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>P&L (Static)</CardTitle>
          <CardDescription>This page is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This section will contain static P&L features.</p>
        </CardContent>
      </Card>
    </div>
  );
}
