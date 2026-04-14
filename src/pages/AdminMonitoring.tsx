import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Activity, AlertTriangle, CheckCircle, Clock, Search, Trash2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface FunctionLog {
  id: string;
  function_name: string;
  execution_time_ms: number | null;
  status: string;
  error_message: string | null;
  user_id: string | null;
  request_method: string | null;
  request_path: string | null;
  response_status: number | null;
  metadata: any;
  created_at: string;
}

interface LogMetrics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_execution_time: number;
  error_rate: number;
}

export default function AdminMonitoring() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [logs, setLogs] = useState<FunctionLog[]>([]);
  const [metrics, setMetrics] = useState<LogMetrics>({
    total_calls: 0,
    successful_calls: 0,
    failed_calls: 0,
    avg_execution_time: 0,
    error_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [functionFilter, setFunctionFilter] = useState("all");
  const [availableFunctions, setAvailableFunctions] = useState<string[]>([]);

  useEffect(() => {
    if (isAdmin === false) {
      navigate("/");
    } else if (isAdmin === true) {
      loadLogs();
      loadMetrics();
      setupRealtimeSubscription();
    }
  }, [isAdmin, navigate]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('function-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'function_logs'
        },
        (payload) => {
          console.log('New log entry:', payload);
          setLogs(prev => [payload.new as FunctionLog, ...prev]);
          loadMetrics(); // Refresh metrics
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("function_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);
      
      // Extract unique function names
      const functions = [...new Set(data?.map(log => log.function_name) || [])];
      setAvailableFunctions(functions);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading logs",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data: allLogs, error } = await supabase
        .from("function_logs")
        .select("*")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) throw error;

      if (allLogs && allLogs.length > 0) {
        const totalCalls = allLogs.length;
        const successfulCalls = allLogs.filter(log => log.status === 'success').length;
        const failedCalls = allLogs.filter(log => log.status === 'error').length;
        
        const avgExecutionTime = allLogs
          .filter(log => log.execution_time_ms !== null)
          .reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / totalCalls;

        const errorRate = (failedCalls / totalCalls) * 100;

        setMetrics({
          total_calls: totalCalls,
          successful_calls: successfulCalls,
          failed_calls: failedCalls,
          avg_execution_time: Math.round(avgExecutionTime),
          error_rate: Math.round(errorRate * 10) / 10,
        });
      }
    } catch (error: any) {
      console.error("Error loading metrics:", error);
    }
  };

  const deleteOldLogs = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { error } = await supabase
        .from("function_logs")
        .delete()
        .lt("created_at", sevenDaysAgo.toISOString());

      if (error) throw error;

      toast({
        title: "Success",
        description: "Old logs deleted successfully",
      });

      loadLogs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting logs",
        description: error.message,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      error: "destructive",
      timeout: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.function_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.error_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesFunction = functionFilter === "all" || log.function_name === functionFilter;

    return matchesSearch && matchesStatus && matchesFunction;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading monitoring data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edge Function Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and logging of all edge function executions
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Calls (24h)</CardDescription>
              <CardTitle className="text-3xl">{metrics.total_calls}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Successful</CardDescription>
              <CardTitle className="text-3xl text-green-600">{metrics.successful_calls}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-3xl text-red-600">{metrics.failed_calls}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Response Time</CardDescription>
              <CardTitle className="text-3xl">{metrics.avg_execution_time}ms</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Error Rate</CardDescription>
              <CardTitle className="text-3xl">{metrics.error_rate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>

              <Select value={functionFilter} onValueChange={setFunctionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Function" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Functions</SelectItem>
                  {availableFunctions.map(func => (
                    <SelectItem key={func} value={func}>{func}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={deleteOldLogs} variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Old Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Function Execution Logs</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} logs (auto-refreshing)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="font-mono text-sm font-semibold">{log.function_name}</span>
                        {getStatusBadge(log.status)}
                        <Badge variant="outline">{log.request_method || 'N/A'}</Badge>
                        {log.response_status && (
                          <Badge variant={log.response_status >= 400 ? "destructive" : "secondary"}>
                            {log.response_status}
                          </Badge>
                        )}
                      </div>

                      {log.error_message && (
                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>{log.error_message}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold">Time:</span> {log.execution_time_ms ? `${log.execution_time_ms}ms` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-semibold">User ID:</span> {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                        </div>
                        <div className="col-span-2">
                          <span className="font-semibold">Timestamp:</span> {format(new Date(log.created_at), 'PPpp')}
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No logs found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
