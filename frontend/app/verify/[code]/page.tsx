"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  TrendingUp, 
  Target, 
  Calendar, 
  Clock, 
  Download,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import Image from "next/image";

interface CertificateData {
  verification_code: string;
  agent_name: string;
  model: string;
  mode: string;
  test_type: string;
  asset: string;
  pnl_pct: number;
  win_rate: number;
  total_trades: number;
  max_drawdown_pct?: number | null;
  sharpe_ratio?: number | null;
  duration_display: string;
  test_period: string;
  issued_at: string;
  view_count: number;
  pdf_url?: string | null;
  image_url?: string | null;
  qr_code_url?: string | null;
}

interface VerifyResponse {
  verified: boolean;
  certificate: CertificateData;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params.code as string;
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!code) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiRequest<VerifyResponse>(
          `/api/certificates/verify/${code}`,
          null, // No auth token needed for public verification
          { method: "GET" }
        );
        
        if (response.verified && response.certificate) {
          setCertificate(response.certificate);
        } else {
          setError("Certificate not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify certificate");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCertificate();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying certificate...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <CardTitle className="text-center">Certificate Not Found</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                {error || "The verification code is invalid or the certificate does not exist."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfitable = certificate.pnl_pct >= 0;
  const pnlColor = isProfitable ? "text-green-500" : "text-red-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <h1 className="text-3xl font-bold">Certificate Verified</h1>
          </div>
          <p className="text-muted-foreground">
            Verification Code: <span className="font-mono font-semibold">{certificate.verification_code}</span>
          </p>
        </div>

        {/* Certificate Image */}
        {certificate.image_url && (
          <Card className="overflow-hidden w-full">
            <CardContent className="p-0">
              <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden max-w-full">
                <Image
                  src={certificate.image_url}
                  alt="Certificate"
                  fill
                  className="object-contain"
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificate Details */}
        <div className="grid gap-6 md:grid-cols-2 w-full">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Agent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Agent Name</p>
                <p className="text-lg font-semibold">{certificate.agent_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-lg">{certificate.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mode</p>
                <Badge variant="outline">{certificate.mode}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-semibold">{certificate.asset}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Test Type</p>
                <Badge>{certificate.test_type}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${pnlColor}`}>
                  {isProfitable ? "+" : ""}{certificate.pnl_pct.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-semibold">{certificate.win_rate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-xl font-semibold">{certificate.total_trades}</p>
              </div>
              {certificate.max_drawdown_pct !== null && certificate.max_drawdown_pct !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-xl font-semibold text-red-500">
                    {certificate.max_drawdown_pct.toFixed(2)}%
                  </p>
                </div>
              )}
              {certificate.sharpe_ratio !== null && certificate.sharpe_ratio !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-xl font-semibold">{certificate.sharpe_ratio.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Test Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-lg">{certificate.test_period}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg">{certificate.duration_display}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issued</p>
                <p className="text-lg">
                  {new Date(certificate.issued_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Verification Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Verification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Verification Code</p>
                <p className="text-lg font-mono font-semibold">{certificate.verification_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-lg">{certificate.view_count}</p>
              </div>
              {certificate.pdf_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(certificate.pdf_url!, "_blank")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>This certificate has been verified and authenticated by AlphaLab</p>
          <p className="mt-2">
            Visit{" "}
            <a href="https://alphalab.io" className="text-primary hover:underline">
              alphalab.io
            </a>{" "}
            to create your own trading agent certificates
          </p>
        </div>
      </div>
    </div>
  );
}

