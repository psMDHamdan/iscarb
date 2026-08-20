// Audit Log Viewer Component
// Displays compliance and security audit logs
// src/components/admin/AuditLogViewer.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Download, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

interface AuditLogViewerProps {
  onDownload?: () => void;
}

export function AuditLogViewer({ onDownload }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [daysBack, setDaysBack] = useState(7);
  const [searchUser, setSearchUser] = useState('');
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [page, daysBack, actionFilter, resourceTypeFilter, searchUser]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        daysBack: daysBack.toString(),
        ...(actionFilter && { action: actionFilter }),
        ...(resourceTypeFilter && { resourceType: resourceTypeFilter }),
        ...(searchUser && { userId: searchUser }),
      });

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setSecurityAlerts(data.securityAlerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'read':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {securityAlerts.length} security alert{securityAlerts.length > 1 ? 's' : ''} detected
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-2">
                Days Back
              </label>
              <select
                value={daysBack}
                onChange={(e) => {
                  setDaysBack(parseInt(e.target.value));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="score">Score</option>
                <option value="publish">Publish</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">
                Resource Type
              </label>
              <select
                value={resourceTypeFilter}
                onChange={(e) => {
                  setResourceTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">All Resources</option>
                <option value="assessment">Assessment</option>
                <option value="question">Question</option>
                <option value="submission">Submission</option>
                <option value="user">User</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2">
                User ID
              </label>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value);
                  setPage(1);
                }}
                placeholder="Search user..."
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => onDownload?.()}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit Logs ({total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                      <div>
                        <p className="font-semibold text-sm">
                          {log.resourceType}: {log.resourceId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {log.user} • {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {log.ipAddress}
                      </p>
                    </div>
                  </div>

                  {Object.keys(log.changes).length > 0 && (
                    <div className="bg-muted/30 rounded p-2 text-xs text-muted-foreground mt-2">
                      <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 50)}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={!hasMore}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          These logs capture all system activities for compliance and security monitoring. They are retained for 90 days.
        </AlertDescription>
      </Alert>
    </div>
  );
}
