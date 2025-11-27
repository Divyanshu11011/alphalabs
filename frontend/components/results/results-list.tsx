"use client";

import { BarChart3, Search, FileText, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useResultsStore } from "@/lib/stores";
import type { TestResult } from "@/types";

interface ResultCardProps {
  result: TestResult;
}

function ResultCard({ result }: ResultCardProps) {
  const isProfitable = result.pnl >= 0;

  return (
    <Card className="group border-border/50 bg-card/30 transition-colors hover:bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Indicator */}
          <div
            className={cn(
              "mt-1 h-2 w-2 shrink-0 rounded-full",
              isProfitable ? "bg-[hsl(var(--accent-green))]" : "bg-[hsl(var(--accent-red))]"
            )}
          />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={result.type === "forward" ? "default" : "secondary"} className="text-xs">
                {result.type === "forward" ? "FORWARD TEST" : "BACKTEST"} #{result.id}
              </Badge>
              <span
                className={cn(
                  "ml-auto font-mono text-lg font-bold",
                  isProfitable ? "text-[hsl(var(--accent-green))]" : "text-[hsl(var(--accent-red))]"
                )}
              >
                {isProfitable ? "+" : ""}
                {result.pnl}%
              </span>
            </div>

            <div className="mt-2">
              <p className="text-sm">
                <span className="font-mono font-medium">{result.agentName}</span>
                <span className="text-muted-foreground"> • {result.asset} • </span>
                <span className="capitalize text-muted-foreground">{result.mode} Mode</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {result.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {" • "}
                {result.duration}
                {" • "}
                {result.trades} trades
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Win Rate: {result.winRate}% • Max DD: {result.maxDrawdown}%
              </p>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/results/${result.id}`}>
                  View Details
                </Link>
              </Button>
              {isProfitable && (
                <>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <FileText className="h-3 w-3" />
                    Certificate
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Share2 className="h-3 w-3" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultsList() {
  const {
    stats,
    filters,
    setSearchQuery,
    setTypeFilter,
    setResultFilter,
    page,
    setPage,
    totalPages,
    paginatedResults,
    filteredResults,
  } = useResultsStore();

  const displayResults = paginatedResults();
  const totalFiltered = filteredResults().length;
  const pages = totalPages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold">Results & Certificates</h1>
            <p className="text-sm text-muted-foreground">
              View your test history and download verified certificates
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tests</p>
            <p className="mt-1 font-mono text-2xl font-bold">{stats.totalTests}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Profitable</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[hsl(var(--accent-green))]">
              {stats.profitable} ({stats.profitablePercent}%)
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Best Result</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[hsl(var(--accent-green))]">
              +{stats.bestResult}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Avg PnL</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[hsl(var(--accent-green))]">
              +{stats.avgPnL}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by agent..."
            value={filters.search}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filters.type} onValueChange={(value) => setTypeFilter(value as "all" | "backtest" | "forward")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="backtest">Backtest</SelectItem>
            <SelectItem value="forward">Forward Test</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.result} onValueChange={(value) => setResultFilter(value as "all" | "profitable" | "loss")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="profitable">Profitable</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {displayResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-mono text-lg font-medium">No results found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or run some tests
            </p>
          </div>
        ) : (
          displayResults.map((result) => (
            <ResultCard key={result.id} result={result} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalFiltered)} of {totalFiltered} results
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="px-2">
              Page {page} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pages}
              onClick={() => setPage(page + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
