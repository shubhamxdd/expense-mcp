import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { Button } from '../../components/ui/button'
import { api, type McpCredentialsResponse } from '../../services/api'
import { getUserInfo } from '../../services/auth'

export function SettingsScreen() {
  const [userInfo, setUserInfoState] = useState<{ id: string; email: string } | null>(null)
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const [mcpCreds, setMcpCreds] = useState<McpCredentialsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [mcpClients, setMcpClients] = useState<any[]>([])

  const loadData = async () => {
    const user = await getUserInfo()
    setUserInfoState(user)
    try {
      const [keys, clients] = await Promise.all([
        api.listApiKeys(),
        api.listMcpClients(),
      ])
      setApiKeys(keys)
      setMcpClients(clients)
    } catch {}
  }

  useEffect(() => { loadData() }, [])

  const createKey = async () => {
    if (!newLabel.trim()) return
    setLoading(true)
    try {
      const key = await api.createApiKey(newLabel)
      setApiKeys(prev => [{
        id: key.id,
        label: key.label,
        created_at: key.created_at,
        last_used_at: null,
        revoked_at: null,
        key_preview: key.raw_key.slice(0, 5) + '••••' + key.raw_key.slice(-4),
      }, ...prev])
      setJustCreated(key.raw_key)
      setNewLabel('')
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
    setLoading(false)
  }

  const revokeKey = async (id: string) => {
    try {
      await api.revokeApiKey(id)
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k))
    } catch {}
  }

  const registerMcp = async (assistant: 'claude' | 'chatgpt') => {
    setLoading(true)
    try {
      const creds = await api.registerMcpClient(assistant)
      setMcpCreds(creds)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
    setLoading(false)
  }

  const revokeMcpClient = async (clientId: string) => {
    try {
      await api.revokeMcpClient(clientId)
      setMcpClients(prev => prev.filter(c => c.client_id !== clientId))
    } catch {}
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Account</Text>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(userInfo?.email || '?')[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.accountEmail}>{userInfo?.email || 'Loading...'}</Text>
            <Text style={styles.accountSubtext}>Signed in via Google</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Keys</Text>
        <View style={styles.createRow}>
          <TextInput
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="Key label (e.g. Claude Desktop)"
            style={styles.keyInput}
            placeholderTextColor="#8E8E93"
          />
          <TouchableOpacity onPress={createKey} disabled={loading || !newLabel.trim()} style={[styles.createButton, (loading || !newLabel.trim()) && styles.createButtonDisabled]} activeOpacity={0.7}>
            <Text style={styles.createButtonText}>{loading ? '...' : 'Generate'}</Text>
          </TouchableOpacity>
        </View>
        {justCreated && (
          <View style={styles.keyReveal}>
            <Text style={styles.keyRevealLabel}>Key created — copy it now</Text>
            <Text style={styles.keyRevealValue} selectable>{justCreated}</Text>
            <TouchableOpacity onPress={() => setJustCreated(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}
        {apiKeys.length === 0 ? (
          <Text style={styles.emptyText}>No API keys yet.</Text>
        ) : (
          apiKeys.map((key: any) => (
            <View key={key.id} style={[styles.keyRow, key.revoked_at && styles.keyRowRevoked]}>
              <View style={styles.keyInfo}>
                <Text style={styles.keyLabel}>{key.label}</Text>
                <Text style={styles.keyPreview}>{key.key_preview}</Text>
              </View>
              <View style={styles.keyMeta}>
                <Text style={styles.keyDate}>{new Date(key.created_at).toLocaleDateString('en-IN')}</Text>
                {key.revoked_at ? (
                  <Text style={styles.revokedBadge}>Revoked</Text>
                ) : (
                  <TouchableOpacity onPress={() => revokeKey(key.id)}>
                    <Text style={styles.revokeText}>Revoke</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {mcpClients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Assistants</Text>
          {mcpClients.map(c => (
            <View key={c.client_id} style={styles.clientRow}>
              <View>
                <Text style={styles.clientName}>{c.client_name}</Text>
                <Text style={styles.clientUri} numberOfLines={1}>{c.redirect_uri}</Text>
              </View>
              <Text style={[styles.clientStatus, c.active && styles.clientStatusActive]}>
                {c.active ? 'Active' : 'Inactive'}
              </Text>
              <TouchableOpacity onPress={() => revokeMcpClient(c.client_id)}>
                <Text style={styles.revokeText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Assistant Access</Text>
        <Text style={styles.sectionDesc}>Generate credentials to connect Claude.ai or ChatGPT to your expenses via MCP.</Text>
        <View style={styles.assistantRow}>
          <TouchableOpacity onPress={() => registerMcp('claude')} disabled={loading} style={styles.assistantButton} activeOpacity={0.7}>
            <Text style={styles.assistantButtonText}>{loading ? '...' : 'Claude.ai'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => registerMcp('chatgpt')} disabled={loading} style={styles.assistantButton} activeOpacity={0.7}>
            <Text style={styles.assistantButtonText}>{loading ? '...' : 'ChatGPT'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {mcpCreds && (
        <View style={styles.credsOverlay}>
          <View style={styles.credsCard}>
            <Text style={styles.credsTitle}>MCP Credentials — {mcpCreds.client_name}</Text>
            <Text style={styles.credsNote}>Copy these into your assistant's MCP settings</Text>
            {([
              ['Authorization URL', mcpCreds.authorization_url],
              ['Token URL', mcpCreds.token_url],
              ['MCP Server URL', mcpCreds.mcp_url],
              ['Client ID', mcpCreds.client_id],
              ['Client Secret', mcpCreds.client_secret],
            ] as const).map(([label, value]) => (
              <View key={label} style={styles.credsField}>
                <Text style={styles.credsLabel}>{label}</Text>
                <Text style={styles.credsValue} selectable>{value}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => setMcpCreds(null)} style={styles.credsClose} activeOpacity={0.7}>
              <Text style={styles.credsCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heading: { fontSize: 28, fontWeight: '700', color: '#000000' },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionDesc: { fontSize: 14, color: '#8E8E93' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  accountEmail: { fontSize: 16, fontWeight: '500', color: '#000000' },
  accountSubtext: { fontSize: 13, color: '#8E8E93' },
  createRow: { flexDirection: 'row', gap: 8 },
  keyInput: {
    flex: 1, borderWidth: 1, borderColor: '#E8E8ED', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#000000', backgroundColor: '#F9F9F9',
  },
  createButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  keyReveal: {
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, gap: 8,
    borderWidth: 1, borderColor: '#34C759',
  },
  keyRevealLabel: { fontSize: 12, fontWeight: '600', color: '#34C759', letterSpacing: 0.5 },
  keyRevealValue: { fontSize: 13, fontFamily: 'Menlo', color: '#1C1C1E' },
  dismissText: { fontSize: 14, color: '#007AFF' },
  emptyText: { fontSize: 14, color: '#8E8E93' },
  keyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E8E8ED' },
  keyRowRevoked: { opacity: 0.5 },
  keyInfo: { flex: 1, gap: 2 },
  keyLabel: { fontSize: 15, color: '#000000', fontWeight: '500' },
  keyPreview: { fontSize: 12, color: '#8E8E93', fontFamily: 'Menlo' },
  keyMeta: { alignItems: 'flex-end', gap: 4 },
  keyDate: { fontSize: 12, color: '#8E8E93' },
  revokedBadge: { fontSize: 12, color: '#FF3B30', fontWeight: '600' },
  revokeText: { fontSize: 14, color: '#FF3B30', fontWeight: '500' },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E8E8ED' },
  clientName: { fontSize: 15, color: '#000000', fontWeight: '500' },
  clientUri: { fontSize: 12, color: '#8E8E93' },
  clientStatus: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  clientStatusActive: { color: '#34C759' },
  assistantRow: { flexDirection: 'row', gap: 8 },
  assistantButton: {
    flex: 1, backgroundColor: '#000000', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  assistantButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  credsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24, zIndex: 100,
  },
  credsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 12 },
  credsTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  credsNote: { fontSize: 12, color: '#34C759', fontWeight: '600', letterSpacing: 0.5 },
  credsField: { gap: 4 },
  credsLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 },
  credsValue: { fontSize: 12, fontFamily: 'Menlo', color: '#1C1C1E', backgroundColor: '#F2F2F7', padding: 8, borderRadius: 6 },
  credsClose: { backgroundColor: '#F2F2F7', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  credsCloseText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
})
