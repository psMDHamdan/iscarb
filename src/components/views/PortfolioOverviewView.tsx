'use client';

import { useApiQuery } from '@/hooks/use-api-query';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Eye, FileText, Award, Zap, Share2 } from 'lucide-react';

interface Portfolio {
  id: string;
  headline?: string;
  bio?: string;
  visibility: string;
  isPublished: boolean;
  viewCount: number;
  createdAt?: string;
}

interface Stats {
  entries: number;
  achievements: number;
  skills: number;
  endorsements: number;
}

interface PortfolioData {
  portfolio: Portfolio;
  stats: Stats;
  recentEntries: {
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }[];
  completenessPercentage: number;
}

export function PortfolioOverviewView() {
  const ar = false; // For now, default to English
  const { data: rawRes, isLoading: loading, error: queryError } = useApiQuery<any>(
    ['student', 'portfolio', 'overview'],
    '/api/v1/student/portfolio/overview',
  );
  const data = rawRes?.data ?? null;
  const error = queryError ? queryError.message : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title={ar ? "نظرة عامة على المحفظة" : "Portfolio Overview"}
          description={ar ? "إدارة وعرض محفظتك المهنية" : "Manage and showcase your professional portfolio"}
        />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error || (ar ? 'فشل تحميل المحفظة' : 'Failed to load portfolio')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getVisiblityLabel = (visibility: string) => {
    if (ar) {
      if (visibility === 'public') return 'عام';
      if (visibility === 'private') return 'خاص';
      if (visibility === 'link') return 'بالرابط';
    }
    return visibility.charAt(0).toUpperCase() + visibility.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title={ar ? "نظرة عامة على المحفظة" : "Portfolio Overview"}
        description={ar ? "مرحباً بكم في لوحة تحكم محفظتكم المهنية" : "Welcome to your professional portfolio dashboard"}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Status Card */}
        <Card className="mb-8 bg-white border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {ar ? "حالة المحفظة" : "Portfolio Status"}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {data.portfolio.headline || (ar ? 'أضف عنواناً مهنياً للبدء' : 'Add a professional headline to get started')}
                </p>
              </div>
              <Badge className={data.portfolio.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {data.portfolio.isPublished
                  ? (ar ? 'منشور' : 'Published')
                  : (ar ? 'مسودة' : 'Draft')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{data.portfolio.bio || (ar ? 'لم تضف سيرة ذاتية بعد' : 'No bio added yet')}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{data.portfolio.viewCount} {ar ? 'عرض' : 'views'}</span>
              </div>
              <Badge variant="outline" className="capitalize">
                {getVisiblityLabel(data.portfolio.visibility)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: FileText, label: ar ? 'مشاريع' : 'Projects', value: data.stats.entries, href: '/student/portfolio/projects' },
            { icon: Award, label: ar ? 'إنجازات' : 'Achievements', value: data.stats.achievements, href: '/student/portfolio/achievements' },
            { icon: Zap, label: ar ? 'مهارات' : 'Skills', value: data.stats.skills, href: '/student/portfolio/skills' },
            { icon: Share2, label: ar ? 'تشجيعات' : 'Endorsements', value: data.stats.endorsements, href: '/student/portfolio/share' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link key={idx} href={stat.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{ar ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: ar ? 'إضافة مدخل' : 'Add Entry', desc: ar ? 'أضف مشاريع أو منشورات أو إنجازات' : 'Add projects, publications, or achievements', href: '/student/portfolio/add', icon: '➕' },
                { label: ar ? 'منشئ الذكاء الاصطناعي' : 'AI Generator', desc: ar ? 'توليد محتوى احترافي تلقائي' : 'Auto-generate professional content', href: '/student/portfolio/ai-generator', icon: '✨' },
                { label: ar ? 'تصدير' : 'Export', desc: ar ? 'تنزيل كملف PDF أو مستند' : 'Download as PDF or document', href: '/student/portfolio/export', icon: '📥' },
              ].map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                    <div className="text-3xl mb-2">{action.icon}</div>
                    <div className="font-semibold text-gray-900">{action.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        {data.recentEntries.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{ar ? 'المدخلات الحديثة' : 'Recent Entries'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{entry.title}</p>
                      <p className="text-xs text-gray-600">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {entry.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completeness Score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{ar ? 'استكمال المحفظة' : 'Portfolio Completeness'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${data.completenessPercentage}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-900">
                  {data.completenessPercentage}%
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 mb-2">
                  {data.completenessPercentage === 100
                    ? (ar ? 'ممتاز! محفظتك كاملة' : 'Great! Your portfolio is complete')
                    : (ar ? 'أكمل المزيد من الأقسام لتحسين محفظتك' : 'Complete more sections to enhance your portfolio')}
                </p>
                <div className="flex gap-2">
                  {data.completenessPercentage < 25 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {ar ? 'مهم' : 'High Priority'}
                    </Badge>
                  )}
                  {data.completenessPercentage >= 25 && data.completenessPercentage < 50 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {ar ? 'متوسط' : 'Medium Priority'}
                    </Badge>
                  )}
                  {data.completenessPercentage >= 50 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {ar ? 'جيد' : 'Good'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: ar ? 'إدارة المحتوى' : 'Manage Content', items: [
                { label: ar ? 'مشاريع' : 'Projects', href: '/student/portfolio/projects' },
                { label: ar ? 'إنجازات' : 'Achievements', href: '/student/portfolio/achievements' },
                { label: ar ? 'مهارات' : 'Skills', href: '/student/portfolio/skills' },
                { label: ar ? 'شهادات' : 'Certifications', href: '/student/portfolio/certifications' },
              ]
            },
            {
              title: ar ? 'ميزات المحفظة' : 'Portfolio Features', items: [
                { label: ar ? 'الرحلة المهنية' : 'Career Journey', href: '/student/portfolio/journey' },
                { label: ar ? 'الخبرة العملية' : 'Work Experience', href: '/student/portfolio/experience' },
                { label: ar ? 'المنشورات' : 'Publications', href: '/student/portfolio/publications' },
                { label: ar ? 'تعزيز الذكاء الاصطناعي' : 'AI Enhancement', href: '/student/portfolio/ai-portfolio' },
              ]
            },
          ].map((section, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <Link key={itemIdx} href={item.href}>
                      <div className="p-3 rounded-lg hover:bg-gray-100 transition flex items-center justify-between cursor-pointer">
                        <span className="text-gray-900">{item.label}</span>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
