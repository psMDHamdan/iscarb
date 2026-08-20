'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Plus, X, Award, Calendar, Link as LinkIcon } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

export function PortfolioPortfolioCertificationsView() {
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: certificationsData, loading, error, refetch } = useApi('/api/v1/student/portfolio/certifications');
  const [certifications, setCertifications] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (certificationsData?.data?.certifications) {
      setCertifications(certificationsData.data.certifications);
    }
  }, [certificationsData]);

  const handleDelete = async (certificationId: string) => {
    try {
      setDeleting(certificationId);
      const res = await fetch(`/api/v1/student/portfolio/certifications?id=${certificationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCertifications((prev) => prev.filter((c) => c.id !== certificationId));
    } catch (err) {
      console.error('Error deleting certification:', err);
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (cert: any) => {
    if (!cert.expiryDate) return 'bg-green-100 text-green-800';
    const expiry = new Date(cert.expiryDate);
    const now = new Date();
    if (expiry < now) return 'bg-red-100 text-red-800';
    const months = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (months <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (cert: any) => {
    if (!cert.expiryDate) return 'Never Expires';
    const expiry = new Date(cert.expiryDate);
    const now = new Date();
    if (expiry < now) return 'Expired';
    const months = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (months <= 3) return `Expires in ${Math.round(months)} months`;
    return 'Valid';
  };

  if (portfolioLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="Certifications"
        description="Professional and technical certifications"
        action={
          <Link href="/student/portfolio/add?category=certification">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </Button>
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : certifications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No certifications added yet.</p>
              <Link href="/student/portfolio/add?category=certification">
                <Button>Add Your First Certificate</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {certificationsData?.data?.stats && (
                <>
                  <Card className="bg-green-50">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-green-600">{certificationsData.data.stats.valid}</div>
                      <div className="text-sm text-gray-600">Valid Certifications</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-yellow-600">{certificationsData.data.stats.expiring}</div>
                      <div className="text-sm text-gray-600">Expiring Soon</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-red-600">{certificationsData.data.stats.expired}</div>
                      <div className="text-sm text-gray-600">Expired</div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="grid gap-4">
              {certifications.map((cert: any) => (
                <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{cert.title}</h3>
                          {cert.verified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
                          <Badge className={getStatusColor(cert)}>{getStatusText(cert)}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{cert.issuer}</p>
                        {cert.issuedAt && (
                          <p className="text-sm text-gray-500 mb-1">
                            <Calendar className="inline w-3 h-3 mr-1" />
                            Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                          </p>
                        )}
                        {cert.expiryDate && (
                          <p className="text-sm text-gray-500">
                            <Calendar className="inline w-3 h-3 mr-1" />
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                        {cert.description && <p className="text-gray-600 text-sm mt-2">{cert.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        {cert.credentialUrl && (
                          <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cert.id)}
                          disabled={deleting === cert.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                          {deleting === cert.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
