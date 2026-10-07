import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Shield, Info } from 'lucide-react-native';
import { getConfig } from '@/src/config/app-config';

export default function SettingsScreen() {
  const config = getConfig();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Info size={24} color="#0ea5e9" />
          <Text style={styles.cardTitle}>Configuration</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Environment</Text>
          <Text style={styles.value}>{config.appEnv}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>API Base URL</Text>
          <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
            {config.apiBaseUrl}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Shield size={24} color="#22c55e" />
          <Text style={styles.cardTitle}>Security</Text>
        </View>

        <Text style={styles.securityText}>
          This app communicates only with the InvestAI API over HTTPS. No database
          credentials, service keys, or private secrets are stored on the device.
        </Text>

        <View style={styles.securityItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.securityItemText}>No service role keys in app</Text>
        </View>
        <View style={styles.securityItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.securityItemText}>No direct database access</Text>
        </View>
        <View style={styles.securityItem}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.securityItemText}>All requests go through API</Text>
        </View>
      </View>

      <Text style={styles.footer}>InvestAI — Phase 1 Foundation</Text>
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
    marginBottom: 16,
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
    maxWidth: 220,
    textAlign: 'right',
  },
  securityText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
    marginBottom: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  checkmark: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '700',
  },
  securityItemText: {
    fontSize: 14,
    color: '#0f172a',
  },
  footer: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontSize: 13,
    color: '#94a3b8',
  },
});
