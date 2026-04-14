import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface SyncHistory {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  status: string;
  wordpress_url: string;
  sync_mode: string;
  products_created: number;
  products_updated: number;
  products_skipped: number;
  categories_created: number;
  categories_updated: number;
  errors: any;
  triggered_by: string;
}

export const WordPressSyncHistory = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SyncHistory[]>([]);

  useEffect(() => {
    fetchHistory();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sync-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wordpress_sync_history'
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('wordpress_sync_history')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'partial':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Sync History
        </CardTitle>
        <CardDescription>
          View recent WordPress synchronization operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No sync history yet. Run your first sync to see results here.
          </p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{entry.triggered_by}</Badge>
                      <Badge variant="outline">{entry.sync_mode}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.sync_started_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold">{entry.products_created}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Updated</p>
                      <p className="font-semibold">{entry.products_updated}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Skipped</p>
                      <p className="font-semibold">{entry.products_skipped}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Categories</p>
                      <p className="font-semibold">
                        +{entry.categories_created} ~{entry.categories_updated}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-semibold">
                        {entry.sync_completed_at
                          ? `${Math.round(
                              (new Date(entry.sync_completed_at).getTime() -
                                new Date(entry.sync_started_at).getTime()) /
                                1000
                            )}s`
                          : 'Running...'}
                      </p>
                    </div>
                  </div>

                  {entry.errors && Array.isArray(entry.errors) && entry.errors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                      <p className="text-sm font-semibold text-destructive mb-1">Errors:</p>
                      <ul className="text-xs text-destructive/90 space-y-1">
                        {entry.errors.slice(0, 3).map((error: string, i: number) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {entry.errors.length > 3 && (
                          <li>... and {entry.errors.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
