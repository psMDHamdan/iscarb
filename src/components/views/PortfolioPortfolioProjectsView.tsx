'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/iscarb/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Trash2, Edit2, Eye, Plus } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

export function PortfolioPortfolioProjectsView() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: portfolio, isLoading: portfolioLoading } = useApi('/api/v1/portfolios/me');
  const { data: projectsData, loading, error, refetch } = useApi('/api/v1/student/portfolio/projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (projectsData?.data?.projects) {
      setProjects(projectsData.data.projects);
    }
  }, [projectsData]);

  const handleDelete = async (projectId: string) => {
    try {
      setDeleting(projectId);
      const res = await fetch(`/api/v1/student/portfolio/projects?id=${projectId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({
        title: 'Project deleted',
        description: 'The project has been successfully removed',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
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
        title="My Projects"
        description="Showcase your best projects and work samples"
        action={
          <Link href="/student/portfolio/add?category=project">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
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
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <p className="text-gray-600 mb-4">No projects yet. Start by adding your first project!</p>
              <Link href="/student/portfolio/add?category=project">
                <Button>Add Your First Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {projects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    {project.imageUrl && (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                        </div>
                        <Badge variant={project.isPublished ? 'default' : 'secondary'}>
                          {project.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>

                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {project.url && (
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </a>
                        )}
                        <Link href={`/student/portfolio/add?id=${project.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          disabled={deleting === project.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deleting === project.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
