"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">

      {/* Header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="h-7 w-36 bg-gray-200 dark:bg-dark-card rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-dark-raised rounded animate-pulse mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-gray-200 dark:bg-dark-card rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 dark:bg-dark-card rounded animate-pulse" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="relative overflow-hidden dark:bg-dark-card dark:border-white/[0.07]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
                  <div className="h-7 w-32 bg-gray-200 dark:bg-dark-raised rounded animate-pulse mt-2" />
                  <div className="h-3 w-24 bg-gray-100 dark:bg-dark-raised/60 rounded animate-pulse mt-2" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-dark-raised animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 dark:bg-dark-card dark:border-white/[0.07]">
          <CardHeader className="pb-2">
            <div className="h-5 w-44 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-72 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          </CardContent>
        </Card>

        <Card className="dark:bg-dark-card dark:border-white/[0.07]">
          <CardHeader className="pb-2">
            <div className="h-5 w-32 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-44 h-44 rounded-full bg-gray-200 dark:bg-dark-raised animate-pulse" />
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-dark-card dark:border-white/[0.07]">
          <CardHeader className="pb-2">
            <div className="h-5 w-40 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-56 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-dark-card dark:border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-5 w-36 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-raised"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-dark-card animate-pulse" />
                    <div>
                      <div className="h-4 w-36 bg-gray-200 dark:bg-dark-card rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 dark:bg-dark-card rounded animate-pulse mt-1" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-dark-card rounded animate-pulse" />
                    <div className="h-5 w-16 bg-gray-100 dark:bg-dark-card rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-dark-card dark:border-white/[0.07]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="h-5 w-44 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-raised animate-pulse" />
                    <div>
                      <div className="h-4 w-40 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-100 dark:bg-dark-raised rounded animate-pulse mt-1" />
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-dark-raised rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}