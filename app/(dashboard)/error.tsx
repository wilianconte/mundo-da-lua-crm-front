"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-xl">
      <CardHeader>
        <CardTitle>Falha ao carregar o painel</CardTitle>
        <CardDescription>
          O erro foi capturado pela boundary da area administrativa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>Tentar novamente</Button>
      </CardContent>
    </Card>
  );
}
