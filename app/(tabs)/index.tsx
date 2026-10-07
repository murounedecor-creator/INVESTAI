import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Server, CheckCircle, AlertCircle } from 'lucide-react-native';
import { getApiClient, ApiError } from '@/src/client/api-client';
import { getConfig } from '@/src/config/app-config';

interface StatusState {
  loading: boolean;
  connected: boolean | null;
  error: string | null;
  runId: string | null;
  status: string | null;
}

export default function HomeScreen() {
  const [state, setState] = useState<StatusState>({
    loading: false,
    connected: null,
    error: null,
    runId: null,
    status: null,
  });

  const config = getConfig();

  const checkConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const client = getApiClient();
      const result = await client.postRun({});
      setState({
        loading: false,
        connected: true,
        error: null,
        runId: result.run_id,
        status: result.status,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      setState({
        loading: false,
        connected: false,
        error: message,
        runId: null,
        status: null,
      });
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={state.loading} onRefresh={checkConnection} />
      }
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Server size={24} color="#0ea5e9" />
          <Text style={styles.cardTitle}>InvestAI Backend</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Environment</Text>
          <Text style={styles.value}>{config.appEnv}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>API URL</Text>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
            {config.apiBaseUrl}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Connection</Text>
          {state.loading ? (
            <ActivityIndicator size="small" color="#0ea5e9" />
          ) : state.connected === true ? (
            <View style={styles.statusRow}>
              <CheckCircle size={18} color="#22c55e" />
              <Text style={[styles.value, { color: '#22c55e' }]}>Connected</Text>
            </View>
          ) : state.connected === false ? (
            <View style={styles.statusRow}>
              <AlertCircle size={18} color="#ef4444" />
              <Text style={[styles.value, { color: '#ef4444' }]}>Failed</Text>
            </View>
          ) : (
            <Text style={styles.value}>Unknown</Text>
          )}
        </View>

        {state.runId && (
          <View style={styles.row}>
            <Text style={styles.label}>Last Run</Text>
            <Text style={styles.value}>{state.runId}</Text>
          </View>
        )}

        {state.status && (
          <View style={styles.row}>
            <Text style={styles.label}>Run Status</Text>
            <Text
              style={[
                styles.value,
                {
                  color:
                    state.status === 'COMPLETED'
                      ? '#22c55e'
                      : state.status === 'PARTIAL'
                        ? '#f59e0b'
                        : '#ef4444',
                },
              ]}
            >
              {state.status}
            </Text>
          </View>
        )}

        {state.error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}
      </View>

      <Text style={styles.footer}>Phase 1 — Foundation</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
    color: '#64748b',
  },
  value: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    maxWidth: 200,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  footer: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    color: '#94a3b8',
  },
});
