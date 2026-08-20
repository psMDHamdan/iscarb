'use client';

import { useApp } from '@/lib/store';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface CategoryItem {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
}

interface CategoryPageViewProps {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  breadcrumbs: { label: string; href: string }[];
  items: CategoryItem[];
}

export function CategoryPageView({
  title,
  titleAr,
  description,
  descriptionAr,
  breadcrumbs,
  items,
}: CategoryPageViewProps) {
  const { lang } = useApp();
  const ar = lang === 'ar';

  return (
    <>
      <PageHeader
        title={ar ? titleAr : title}
        description={ar ? descriptionAr : description}
        breadcrumbs={breadcrumbs}
      />
      <div className="mx-auto max-w-7xl space-y-6 pb-12 px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#0E6C3C]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0E6C3C]/20 transition-colors">
                      <Icon className="h-5 w-5 text-[#0E6C3C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{ar ? item.titleAr : item.title}</h3>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ar ? item.descriptionAr : item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
