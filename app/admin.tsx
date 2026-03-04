
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, Linking, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { apiGet, apiPost, BACKEND_URL } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface LastUpdatedTimestamps {
  ngcbStats: string | null;
  jackpots: string | null;
  parSheets: string | null;
  ngcbUnlvTrends: string | null;
}

interface NGCBStatEntry {
  id: string;
  reportMonth: string;
  locationArea: string;
  denomination: string;
  avgRtpPercent: string | number;
  holdPercent: string | number;
  numMachines: string | number;
  notes?: string;
}

interface ParSheetEntry {
  id: string;
  gameTitle: string;
  brand: string;
  rtpRangeLow: number;
  rtpRangeHigh: number;
  volatility: string;
  typicalDenoms: string;
  notes: string;
  sourceLink: string;
}

interface JackpotEntry {
  id: string;
  jackpotName: string;
  currentAmount: number;
  location: string;
  lastUpdated: string;
  trackerLink: string;
  notes: string;
}

interface CasinoMachineEntry {
  id: string;
  casinoName: string;
  brand: string;
  gameTitle: string;
  denom: string;
  lastSeen: string;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
}

interface MustHitProgressive {
  id: string;
  gameTitle: string;
  casino: string;
  minorCap: number;
  majorCap: number;
  currentMinor: number;
  currentMajor: number;
  lastReported: string;
  notes?: string;
  minorPercentage?: number;
  majorPercentage?: number;
}

interface CommunityReport {
  id: string;
  imageUrl: string;
  manufacturer: string;
  gameTitle: string;
  casino: string;
  winAmount: number;
  jackpotType: string;
  notes: string;
  createdAt: string;
  userId?: string;
}

interface AnalyticsSummary {
  totalCommunityReports: number;
  totalCasinoMachines: number;
  activeCasinos: number;
  lastDataUpdate: string;
}

const ADMIN_PIN = '4242';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinLoading, setIsPinLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'analytics' | 'ngcb' | 'parsheets' | 'jackpots' | 'casino-directory' | 'community'>('analytics');
  const [stats, setStats] = useState<NGCBStatEntry[]>([]);
  const [parSheets, setParSheets] = useState<ParSheetEntry[]>([]);
  const [jackpots, setJackpots] = useState<JackpotEntry[]>([]);
  const [casinoMachines, setCasinoMachines] = useState<CasinoMachineEntry[]>([]);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Community moderation state
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [reportToDelete, setReportToDelete] = useState<CommunityReport | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert/confirmation modal state
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    confirmDestructive?: boolean;
  }>({ visible: false, title: '', message: '' });

  // Form state for add/edit NGCB
  const [formMonth, setFormMonth] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formDenom, setFormDenom] = useState('');
  const [formRtp, setFormRtp] = useState('');
  const [formHold, setFormHold] = useState('');
  const [formMachines, setFormMachines] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form state for add/edit Par Sheets
  const [formGameTitle, setFormGameTitle] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formRtpLow, setFormRtpLow] = useState('');
  const [formRtpHigh, setFormRtpHigh] = useState('');
  const [formVolatility, setFormVolatility] = useState('');
  const [formTypicalDenoms, setFormTypicalDenoms] = useState('');
  const [formParNotes, setFormParNotes] = useState('');
  const [formSourceLink, setFormSourceLink] = useState('');

  // Form state for add/edit Jackpots
  const [formJackpotName, setFormJackpotName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formLastUpdated, setFormLastUpdated] = useState('');
  const [formTrackerLink, setFormTrackerLink] = useState('');
  const [formJackpotNotes, setFormJackpotNotes] = useState('');

  // Form state for add/edit Casino Machines
  const [formCasinoName, setFormCasinoName] = useState('');
  const [formMachineBrand, setFormMachineBrand] = useState('');
  const [formMachineGameTitle, setFormMachineGameTitle] = useState('');
  const [formMachineDenom, setFormMachineDenom] = useState('');
  const [formMachinePhotoUrl, setFormMachinePhotoUrl] = useState('');
  const [formMachineNotes, setFormMachineNotes] = useState('');
  const [casinoMachineSearchQuery, setCasinoMachineSearchQuery] = useState('');
  const [bulkInsertAristocratLoading, setBulkInsertAristocratLoading] = useState(false);
  const [bulkInsertNonAristocratLoading, setBulkInsertNonAristocratLoading] = useState(false);

  // Automation state
  const [lastUpdatedTimestamps, setLastUpdatedTimestamps] = useState<LastUpdatedTimestamps>({ ngcbStats: null, jackpots: null, parSheets: null, ngcbUnlvTrends: null });
  const [isUpdatingNGCB, setIsUpdatingNGCB] = useState(false);
  const [isUpdatingJackpots, setIsUpdatingJackpots] = useState(false);
  const [isRunningAllUpdates, setIsRunningAllUpdates] = useState(false);
  const [isUpdatingNGCBUNLV, setIsUpdatingNGCBUNLV] = useState(false);
  
  // Error modal state for detailed error reporting
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    title: string;
    errorType: string;
    message: string;
    statusCode?: number;
    url?: string;
    onRetry?: () => void;
  }>({ visible: false, title: '', errorType: '', message: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalyticsSummary();
      loadStats();
      loadParSheets();
      loadJackpots();
      loadCasinoMachines();
      loadCommunityReports();
      loadLastUpdated();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loadLastUpdated, loadAnalyticsSummary]);

  // Admin API call helper that includes the admin token in headers
  const adminApiCall = useCallback(async <T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log('[Admin API] Calling:', url, options?.method || 'GET');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('[Admin API] Error response:', response.status, text);
      throw new Error(`API error: ${response.status} - ${text}`);
    }
    return response.json();
  }, [adminToken]);

  const adminGet = useCallback(<T = any>(endpoint: string): Promise<T> => {
    return adminApiCall<T>(endpoint, { method: 'GET' });
  }, [adminApiCall]);

  const adminPost = useCallback(<T = any>(endpoint: string, data: any): Promise<T> => {
    return adminApiCall<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }, [adminApiCall]);

  const showAlert = (title: string, message: string, onConfirm?: () => void, confirmText?: string, confirmDestructive?: boolean) => {
    setAlertModal({ visible: true, title, message, onConfirm, confirmText, confirmDestructive });
  };

  const dismissAlert = () => {
    setAlertModal({ visible: false, title: '', message: '' });
  };

  const loadAnalyticsSummary = useCallback(async () => {
    console.log('[API] Loading analytics summary from GET /api/analytics/summary');
    setLoading(true);
    try {
      const data = await adminGet<AnalyticsSummary>('/api/analytics/summary');
      setAnalyticsSummary(data);
      console.log('[API] Analytics summary loaded:', data);
    } catch (err: any) {
      console.error('[API] Error loading analytics summary:', err);
      // Try public endpoint as fallback
      try {
        console.log('[API] Retrying analytics summary without admin token (public endpoint)');
        const data = await apiGet<AnalyticsSummary>('/api/analytics/summary');
        setAnalyticsSummary(data);
        console.log('[API] Analytics summary loaded via public endpoint:', data);
      } catch (fallbackErr: any) {
        console.error('[API] Fallback also failed:', fallbackErr);
        showAlert('Error', err.message || 'Failed to load analytics summary');
      }
    } finally {
      setLoading(false);
    }
  }, [adminGet]);

  const loadLastUpdated = useCallback(async () => {
    console.log('[API] Loading last updated timestamps from GET /api/admin/last-updated');
    try {
      const data = await adminGet<LastUpdatedTimestamps & { disclaimer?: string }>('/api/admin/last-updated');
      setLastUpdatedTimestamps({
        ngcbStats: data.ngcbStats || null,
        jackpots: data.jackpots || null,
        parSheets: data.parSheets || null,
        ngcbUnlvTrends: data.ngcbUnlvTrends || null,
      });
      console.log('[API] Last updated timestamps loaded:', data);
    } catch (err: any) {
      console.error('[API] Error loading last updated timestamps:', err);
    }
  }, [adminGet]);

  const showErrorModal = (title: string, error: any, onRetry?: () => void) => {
    console.log('[Admin] Showing detailed error modal:', error);
    
    // Parse error object for detailed information
    let errorType = 'Unknown Error';
    let message = 'An unexpected error occurred. Please try again.';
    let statusCode: number | undefined;
    let url: string | undefined;

    if (error?.error) {
      // Structured error from backend
      errorType = error.error.type || 'Unknown Error';
      message = error.error.message || message;
      statusCode = error.error.statusCode;
      url = error.error.url;
    } else if (error?.message) {
      // Standard error object
      message = error.message;
      
      // Try to extract status code from message
      const statusMatch = error.message.match(/(\d{3})/);
      if (statusMatch) {
        statusCode = parseInt(statusMatch[1]);
        
        // Determine error type from status code
        if (statusCode === 404) {
          errorType = '404 - Route Not Found';
        } else if (statusCode === 401 || statusCode === 403) {
          errorType = '401 - Unauthorized';
        } else if (statusCode >= 500) {
          errorType = 'Server Error';
        }
      }
      
      // Check for network errors
      if (error.message.includes('timeout') || error.message.includes('network')) {
        errorType = 'Network Timeout';
      } else if (error.message.includes('parse') || error.message.includes('PDF')) {
        errorType = 'Failed to Parse PDF';
      } else if (error.message.includes('no new data') || error.message.includes('no data')) {
        errorType = 'No New Data Found';
      }
    }

    setErrorModal({
      visible: true,
      title,
      errorType,
      message,
      statusCode,
      url,
      onRetry,
    });
  };

  const dismissErrorModal = () => {
    setErrorModal({ visible: false, title: '', errorType: '', message: '' });
  };

  const formatLastUpdated = (timestamp: string | null): string => {
    if (!timestamp) return 'Never';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  const handleUpdateNGCBStats = async () => {
    console.log('[API] Triggering NGCB stats update via POST /api/admin/ngcb-stats/update');
    setIsUpdatingNGCB(true);
    try {
      const result = await adminPost<{ success: boolean; recordsUpdated: number; lastUpdated: string; message: string; disclaimer?: string }>(
        '/api/admin/ngcb-stats/update',
        {}
      );
      console.log('[API] NGCB stats update result:', result);
      
      if (result.success) {
        showAlert(
          '✅ NGCB Stats Updated',
          `${result.message || 'Update complete.'}\n\nRecords updated: ${result.recordsUpdated ?? 'N/A'}\n\n⚠️ Automated updates from official/public sources only. Data accuracy not guaranteed.`
        );
        loadLastUpdated();
        loadStats();
      } else {
        showErrorModal('Update Failed', result, handleUpdateNGCBStats);
      }
    } catch (err: any) {
      console.error('[API] Error updating NGCB stats:', err);
      showErrorModal('Update Failed', err, handleUpdateNGCBStats);
    } finally {
      setIsUpdatingNGCB(false);
    }
  };

  const handleUpdateJackpots = async () => {
    console.log('[API] Triggering jackpots update via POST /api/admin/jackpots/update');
    setIsUpdatingJackpots(true);
    try {
      const result = await adminPost<{ success: boolean; jackpotsUpdated: number; lastUpdated: string; message: string; disclaimer?: string }>(
        '/api/admin/jackpots/update',
        {}
      );
      console.log('[API] Jackpots update result:', result);
      
      if (result.success) {
        showAlert(
          '✅ Jackpots Updated',
          `${result.message || 'Update complete.'}\n\nJackpots updated: ${result.jackpotsUpdated ?? 'N/A'}\n\n⚠️ Automated updates from official/public sources only. Data accuracy not guaranteed.`
        );
        loadLastUpdated();
        loadJackpots();
      } else {
        showErrorModal('Update Failed', result, handleUpdateJackpots);
      }
    } catch (err: any) {
      console.error('[API] Error updating jackpots:', err);
      showErrorModal('Update Failed', err, handleUpdateJackpots);
    } finally {
      setIsUpdatingJackpots(false);
    }
  };

  const handleRunAllUpdates = async () => {
    console.log('[API] Triggering all updates via POST /api/admin/run-all-updates');
    setIsRunningAllUpdates(true);
    try {
      const result = await adminPost<{ success: boolean; ngcbUpdated: number; jackpotsUpdated: number; ngcbUnlvUpdated: number; lastUpdated: string; message: string; disclaimer?: string }>(
        '/api/admin/run-all-updates',
        {}
      );
      console.log('[API] Run all updates result:', result);
      
      if (result.success) {
        showAlert(
          '✅ All Updates Complete',
          `${result.message || 'All updates complete.'}\n\nNGCB Stats: ${result.ngcbUpdated ?? 'N/A'}\nJackpots: ${result.jackpotsUpdated ?? 'N/A'}\nNGCB/UNLV Trends: ${result.ngcbUnlvUpdated ?? 'N/A'}\n\n⚠️ Automated updates from official/public sources only. Data accuracy not guaranteed.`
        );
        loadLastUpdated();
        loadStats();
        loadJackpots();
      } else {
        showErrorModal('Update Failed', result, handleRunAllUpdates);
      }
    } catch (err: any) {
      console.error('[API] Error running all updates:', err);
      showErrorModal('Update Failed', err, handleRunAllUpdates);
    } finally {
      setIsRunningAllUpdates(false);
    }
  };

  const handleUpdateNGCBUNLV = async () => {
    console.log('[API] Triggering NGCB/UNLV trends update via POST /api/admin/ngcb-unlv/update');
    setIsUpdatingNGCBUNLV(true);
    try {
      const result = await adminPost<{ success: boolean; recordsUpdated: number; timestamp: string; message: string }>(
        '/api/admin/ngcb-unlv/update',
        {}
      );
      console.log('[API] NGCB/UNLV update result:', result);
      
      if (result.success) {
        showAlert(
          '✅ NGCB/UNLV Trends Updated',
          `${result.message || 'Update complete.'}\n\nRecords updated: ${result.recordsUpdated ?? 'N/A'}\nLast Updated: ${(() => {
            try {
              return new Date(result.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch {
              return result.timestamp;
            }
          })()}\n\n⚠️ Automated scraping from official NGCB and UNLV sources. Data accuracy not guaranteed.`
        );
        loadLastUpdated();
      } else {
        // Show detailed error modal
        showErrorModal('Update Failed', result, handleUpdateNGCBUNLV);
      }
    } catch (err: any) {
      console.error('[API] Error updating NGCB/UNLV:', err);
      showErrorModal('Update Failed', err, handleUpdateNGCBUNLV);
    } finally {
      setIsUpdatingNGCBUNLV(false);
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) return;
    console.log('[Admin] Submitting PIN to /api/admin/auth/login');
    setIsPinLoading(true);
    setPinError('');
    try {
      const result = await apiPost<{ success: boolean; adminToken: string; expiresIn: number; message: string }>(
        '/api/admin/auth/login',
        { pin: pinInput }
      );
      if (result.success && result.adminToken) {
        console.log('[Admin] PIN accepted, admin token received');
        setAdminToken(result.adminToken);
        setIsAuthenticated(true);
        setPinError('');
      } else {
        console.log('[Admin] PIN rejected by server');
        setPinError('Incorrect PIN');
        setPinInput('');
      }
    } catch (err: any) {
      console.error('[Admin] PIN login error:', err);
      // Check if it's a 401 (wrong PIN)
      if (err.message?.includes('401')) {
        setPinError('Incorrect PIN');
      } else {
        setPinError('Login failed. Please try again.');
      }
      setPinInput('');
    } finally {
      setIsPinLoading(false);
    }
  };

  const loadStats = async () => {
    console.log('[API] Loading all NGCB stats from GET /api/ngcb-stats');
    setLoading(true);

    try {
      const data = await apiGet<NGCBStatEntry[]>('/api/ngcb-stats');
      setStats(data);
      console.log(`[API] Loaded ${data.length} NGCB stats`);
    } catch (err: any) {
      console.error('[API] Error loading NGCB stats:', err);
      showAlert('Error', err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const loadParSheets = async () => {
    console.log('[API] Loading all par sheets from GET /api/par-sheets');
    setLoading(true);

    try {
      const data = await apiGet<ParSheetEntry[]>('/api/par-sheets');
      setParSheets(data);
      console.log(`[API] Loaded ${data.length} par sheets`);
    } catch (err: any) {
      console.error('[API] Error loading par sheets:', err);
      showAlert('Error', err.message || 'Failed to load par sheets');
    } finally {
      setLoading(false);
    }
  };

  const loadJackpots = async () => {
    console.log('[API] Loading all jackpots from GET /api/jackpot-feed');
    setLoading(true);

    try {
      const response = await apiGet<{ jackpots: JackpotEntry[] }>('/api/jackpot-feed');
      setJackpots(response.jackpots || []);
      console.log(`[API] Loaded ${response.jackpots?.length || 0} jackpots`);
    } catch (err: any) {
      console.error('[API] Error loading jackpots:', err);
      showAlert('Error', err.message || 'Failed to load jackpots');
    } finally {
      setLoading(false);
    }
  };

  const loadCasinoMachines = async () => {
    console.log('[API] Loading casino machines from GET /api/casino-directory/machines/search');
    setLoading(true);

    try {
      const query = casinoMachineSearchQuery.trim();
      const endpoint = query
        ? `/api/casino-directory/machines/search?query=${encodeURIComponent(query)}`
        : '/api/casino-directory/machines/search';
      const response = await apiGet<{ machines: CasinoMachineEntry[]; disclaimer: string }>(endpoint);
      setCasinoMachines(response.machines || []);
      console.log(`[API] Loaded ${response.machines?.length || 0} casino machines`);
    } catch (err: any) {
      console.error('[API] Error loading casino machines:', err);
      showAlert('Error', err.message || 'Failed to load casino machines');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityReports = async () => {
    console.log('[API] Loading community reports for moderation');
    setLoading(true);

    try {
      const endpoint = '/api/community-reports?limit=100';
      console.log('[API] Requesting', endpoint);
      const data = await apiGet<CommunityReport[]>(endpoint);
      setCommunityReports(data);
      console.log(`[API] Loaded ${data.length} community reports`);
    } catch (err: any) {
      console.error('[API] Error loading community reports:', err);
      showAlert('Error', err.message || 'Failed to load community reports');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInsertAristocrat = async () => {
    console.log('[API] Triggering bulk insert of Aristocrat games via POST /api/casino-directory/bulk-insert-aristocrat');
    setBulkInsertAristocratLoading(true);
    try {
      const result = await adminPost<{ success: boolean; inserted: number; casinos: number; message: string }>(
        '/api/casino-directory/bulk-insert-aristocrat',
        {}
      );
      console.log('[API] Bulk insert result:', result);
      showAlert(
        'Bulk Insert Complete',
        result.message || `Inserted ${result.inserted} machines across ${result.casinos} casinos.`
      );
      loadCasinoMachines();
    } catch (err: any) {
      console.error('[API] Error during bulk insert:', err);
      showAlert('Error', err.message || 'Failed to bulk insert Aristocrat games');
    } finally {
      setBulkInsertAristocratLoading(false);
    }
  };

  const handleBulkInsertNonAristocrat = async () => {
    console.log('[API] Triggering bulk insert of non-Aristocrat games via POST /api/casino-directory/bulk-insert-non-aristocrat');
    setBulkInsertNonAristocratLoading(true);
    try {
      const result = await adminPost<{ success: boolean; machinesAdded: number; casinosUpdated: number; message: string }>(
        '/api/casino-directory/bulk-insert-non-aristocrat',
        {}
      );
      console.log('[API] Bulk insert non-Aristocrat result:', result);
      showAlert(
        'Bulk Insert Complete',
        result.message || `Inserted ${result.machinesAdded} machines across ${result.casinosUpdated} casinos.`
      );
      loadCasinoMachines();
    } catch (err: any) {
      console.error('[API] Error during bulk insert non-Aristocrat:', err);
      showAlert('Error', err.message || 'Failed to bulk insert non-Aristocrat games');
    } finally {
      setBulkInsertNonAristocratLoading(false);
    }
  };

  const handleAdd = () => {
    console.log('User tapped Add New Entry');
    if (activeTab === 'ngcb') {
      setFormMonth('');
      setFormArea('');
      setFormDenom('');
      setFormRtp('');
      setFormHold('');
      setFormMachines('');
      setFormNotes('');
    } else if (activeTab === 'parsheets') {
      setFormGameTitle('');
      setFormBrand('');
      setFormRtpLow('');
      setFormRtpHigh('');
      setFormVolatility('');
      setFormTypicalDenoms('');
      setFormParNotes('');
      setFormSourceLink('');
    } else if (activeTab === 'casino-directory') {
      setFormCasinoName('');
      setFormMachineBrand('');
      setFormMachineGameTitle('');
      setFormMachineDenom('');
      setFormMachinePhotoUrl('');
      setFormMachineNotes('');
    } else {
      setFormJackpotName('');
      setFormAmount('');
      setFormLocation('');
      setFormLastUpdated('');
      setFormTrackerLink('');
      setFormJackpotNotes('');
    }
    setShowAddModal(true);
  };

  const handleSubmitAdd = async () => {
    if (activeTab === 'casino-directory') {
      if (!formCasinoName || !formMachineBrand || !formMachineGameTitle || !formMachineDenom) {
        showAlert('Missing Fields', 'Please fill in Casino Name, Brand, Game Title, and Denomination');
        return;
      }

      console.log('[API] Submitting new casino machine sighting to POST /api/casino-directory/machines');
      setLoading(true);

      try {
        const created = await adminPost('/api/casino-directory/machines', {
          casino_name: formCasinoName,
          brand: formMachineBrand,
          game_title: formMachineGameTitle,
          denom: formMachineDenom,
          photo_url: formMachinePhotoUrl || null,
          notes: formMachineNotes || null,
        });
        console.log('[API] Created casino machine entry:', created);
        setShowAddModal(false);
        loadCasinoMachines();
      } catch (err: any) {
        console.error('[API] Error adding casino machine:', err);
        showAlert('Error', err.message || 'Failed to add entry');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (activeTab === 'ngcb') {
      if (!formMonth || !formArea || !formDenom || !formRtp || !formHold || !formMachines) {
        showAlert('Missing Fields', 'Please fill in all required fields');
        return;
      }

      console.log('[API] Submitting new NGCB stat entry to POST /api/ngcb-stats');
      setLoading(true);

      try {
        const created = await adminPost('/api/ngcb-stats', {
          reportMonth: formMonth,
          locationArea: formArea,
          denomination: formDenom,
          avgRtpPercent: parseFloat(formRtp),
          holdPercent: parseFloat(formHold),
          numMachines: parseInt(formMachines, 10),
          notes: formNotes || undefined,
        });
        console.log('[API] Created NGCB stat entry:', created);
        setShowAddModal(false);
        loadStats();
      } catch (err: any) {
        console.error('[API] Error adding NGCB stat:', err);
        showAlert('Error', err.message || 'Failed to add entry');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'parsheets') {
      if (!formGameTitle || !formBrand || !formRtpLow || !formRtpHigh || !formVolatility || !formTypicalDenoms || !formParNotes) {
        showAlert('Missing Fields', 'Please fill in all required fields');
        return;
      }

      console.log('[API] Submitting new par sheet entry to POST /api/par-sheets');
      setLoading(true);

      try {
        const created = await adminPost('/api/par-sheets', {
          gameTitle: formGameTitle,
          brand: formBrand,
          rtpRangeLow: parseInt(formRtpLow, 10),
          rtpRangeHigh: parseInt(formRtpHigh, 10),
          volatility: formVolatility,
          typicalDenoms: formTypicalDenoms,
          notes: formParNotes,
          sourceLink: formSourceLink || '',
        });
        console.log('[API] Created par sheet entry:', created);
        setShowAddModal(false);
        loadParSheets();
      } catch (err: any) {
        console.error('[API] Error adding par sheet:', err);
        showAlert('Error', err.message || 'Failed to add entry');
      } finally {
        setLoading(false);
      }
    } else {
      if (!formJackpotName || !formAmount || !formLocation || !formLastUpdated || !formTrackerLink) {
        showAlert('Missing Fields', 'Please fill in all required fields');
        return;
      }

      console.log('[API] Submitting new jackpot entry to POST /api/jackpot-feed');
      setLoading(true);

      try {
        // Convert YYYY-MM-DD to ISO 8601 format for the API
        const lastUpdatedISO = formLastUpdated.includes('T')
          ? formLastUpdated
          : `${formLastUpdated}T00:00:00Z`;
        const created = await adminPost('/api/jackpot-feed', {
          jackpotName: formJackpotName,
          currentAmount: parseFloat(formAmount),
          location: formLocation,
          lastUpdated: lastUpdatedISO,
          trackerLink: formTrackerLink,
          notes: formJackpotNotes || '',
        });
        console.log('[API] Created jackpot entry:', created);
        setShowAddModal(false);
        loadJackpots();
      } catch (err: any) {
        console.error('[API] Error adding jackpot:', err);
        showAlert('Error', err.message || 'Failed to add entry');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (stat: NGCBStatEntry) => {
    console.log('User editing stat:', stat.id);
    setEditingId(stat.id);
    setFormMonth(stat.reportMonth);
    setFormArea(stat.locationArea);
    setFormDenom(stat.denomination);
    setFormRtp(String(stat.avgRtpPercent));
    setFormHold(String(stat.holdPercent));
    setFormMachines(String(stat.numMachines));
    setFormNotes(stat.notes || '');
  };

  const handleEditParSheet = (sheet: ParSheetEntry) => {
    console.log('User editing par sheet:', sheet.id);
    setEditingId(sheet.id);
    setFormGameTitle(sheet.gameTitle);
    setFormBrand(sheet.brand);
    setFormRtpLow(String(sheet.rtpRangeLow));
    setFormRtpHigh(String(sheet.rtpRangeHigh));
    setFormVolatility(sheet.volatility);
    setFormTypicalDenoms(sheet.typicalDenoms);
    setFormParNotes(sheet.notes);
    setFormSourceLink(sheet.sourceLink || '');
  };

  const handleEditJackpot = (jackpot: JackpotEntry) => {
    console.log('User editing jackpot:', jackpot.id);
    setEditingId(jackpot.id);
    setFormJackpotName(jackpot.jackpotName);
    setFormAmount(String(jackpot.currentAmount));
    setFormLocation(jackpot.location);
    // Strip time portion for display in YYYY-MM-DD input
    const dateOnly = jackpot.lastUpdated ? jackpot.lastUpdated.split('T')[0] : '';
    setFormLastUpdated(dateOnly);
    setFormTrackerLink(jackpot.trackerLink);
    setFormJackpotNotes(jackpot.notes || '');
  };

  const handleEditCasinoMachine = (machine: CasinoMachineEntry) => {
    console.log('User editing casino machine:', machine.id);
    setEditingId(machine.id);
    setFormCasinoName(machine.casinoName);
    setFormMachineBrand(machine.brand);
    setFormMachineGameTitle(machine.gameTitle);
    setFormMachineDenom(machine.denom);
    setFormMachinePhotoUrl(machine.photoUrl || '');
    setFormMachineNotes(machine.notes || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (activeTab === 'casino-directory') {
      console.log(`[API] Saving edit for casino machine ${id} via PUT /api/casino-directory/machines/${id}`);
      setLoading(true);

      try {
        const updated = await adminApiCall(`/api/casino-directory/machines/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            brand: formMachineBrand || null,
            game_title: formMachineGameTitle || null,
            denom: formMachineDenom || null,
            photo_url: formMachinePhotoUrl || null,
            notes: formMachineNotes || null,
          }),
        });
        console.log('[API] Updated casino machine entry:', updated);
        setEditingId(null);
        loadCasinoMachines();
      } catch (err: any) {
        console.error('[API] Error updating casino machine:', err);
        showAlert('Error', err.message || 'Failed to update entry');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (activeTab === 'ngcb') {
      console.log(`[API] Saving edit for stat ${id} via PUT /api/ngcb-stats/${id}`);
      setLoading(true);

      try {
        const updated = await adminApiCall(`/api/ngcb-stats/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            reportMonth: formMonth,
            locationArea: formArea,
            denomination: formDenom,
            avgRtpPercent: parseFloat(formRtp),
            holdPercent: parseFloat(formHold),
            numMachines: parseInt(formMachines, 10),
            notes: formNotes || undefined,
          }),
        });
        console.log('[API] Updated NGCB stat entry:', updated);
        setEditingId(null);
        loadStats();
      } catch (err: any) {
        console.error('[API] Error updating NGCB stat:', err);
        showAlert('Error', err.message || 'Failed to update entry');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'parsheets') {
      console.log(`[API] Saving edit for par sheet ${id} via PUT /api/par-sheets/${id}`);
      setLoading(true);

      try {
        const updated = await adminApiCall(`/api/par-sheets/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            gameTitle: formGameTitle,
            brand: formBrand,
            rtpRangeLow: parseInt(formRtpLow, 10),
            rtpRangeHigh: parseInt(formRtpHigh, 10),
            volatility: formVolatility,
            typicalDenoms: formTypicalDenoms,
            notes: formParNotes,
            sourceLink: formSourceLink || '',
          }),
        });
        console.log('[API] Updated par sheet entry:', updated);
        setEditingId(null);
        loadParSheets();
      } catch (err: any) {
        console.error('[API] Error updating par sheet:', err);
        showAlert('Error', err.message || 'Failed to update entry');
      } finally {
        setLoading(false);
      }
    } else {
      console.log(`[API] Saving edit for jackpot ${id} via PUT /api/jackpot-feed/${id}`);
      setLoading(true);

      try {
        // Convert YYYY-MM-DD to ISO 8601 format for the API
        const lastUpdatedISO = formLastUpdated.includes('T')
          ? formLastUpdated
          : `${formLastUpdated}T00:00:00Z`;
        const updated = await adminApiCall(`/api/jackpot-feed/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            jackpotName: formJackpotName,
            currentAmount: parseFloat(formAmount),
            location: formLocation,
            lastUpdated: lastUpdatedISO,
            trackerLink: formTrackerLink,
            notes: formJackpotNotes || '',
          }),
        });
        console.log('[API] Updated jackpot entry:', updated);
        setEditingId(null);
        loadJackpots();
      } catch (err: any) {
        console.error('[API] Error updating jackpot:', err);
        showAlert('Error', err.message || 'Failed to update entry');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    console.log('User tapped delete for entry:', id);
    showAlert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      async () => {
        dismissAlert();
        if (activeTab === 'casino-directory') {
          console.log(`[API] Deleting casino machine ${id} via DELETE /api/casino-directory/machines/${id}`);
          setLoading(true);
          try {
            const result = await adminApiCall(`/api/casino-directory/machines/${id}`, {
              method: 'DELETE',
              body: JSON.stringify({}),
            });
            console.log('[API] Deleted casino machine entry:', result);
            loadCasinoMachines();
          } catch (err: any) {
            console.error('[API] Error deleting casino machine:', err);
            showAlert('Error', err.message || 'Failed to delete entry');
          } finally {
            setLoading(false);
          }
        } else if (activeTab === 'ngcb') {
          console.log(`[API] Deleting stat ${id} via DELETE /api/ngcb-stats/${id}`);
          setLoading(true);
          try {
            const result = await adminApiCall(`/api/ngcb-stats/${id}`, {
              method: 'DELETE',
              body: JSON.stringify({}),
            });
            console.log('[API] Deleted NGCB stat entry:', result);
            loadStats();
          } catch (err: any) {
            console.error('[API] Error deleting NGCB stat:', err);
            showAlert('Error', err.message || 'Failed to delete entry');
          } finally {
            setLoading(false);
          }
        } else if (activeTab === 'parsheets') {
          console.log(`[API] Deleting par sheet ${id} via DELETE /api/par-sheets/${id}`);
          setLoading(true);
          try {
            const result = await adminApiCall(`/api/par-sheets/${id}`, {
              method: 'DELETE',
              body: JSON.stringify({}),
            });
            console.log('[API] Deleted par sheet entry:', result);
            loadParSheets();
          } catch (err: any) {
            console.error('[API] Error deleting par sheet:', err);
            showAlert('Error', err.message || 'Failed to delete entry');
          } finally {
            setLoading(false);
          }
        } else {
          console.log(`[API] Deleting jackpot ${id} via DELETE /api/jackpot-feed/${id}`);
          setLoading(true);
          try {
            const result = await adminApiCall(`/api/jackpot-feed/${id}`, {
              method: 'DELETE',
              body: JSON.stringify({}),
            });
            console.log('[API] Deleted jackpot entry:', result);
            loadJackpots();
          } catch (err: any) {
            console.error('[API] Error deleting jackpot:', err);
            showAlert('Error', err.message || 'Failed to delete entry');
          } finally {
            setLoading(false);
          }
        }
      },
      'Delete',
      true
    );
  };

  const handleDeleteCommunityReport = (report: CommunityReport) => {
    console.log('Admin tapped delete for community report:', report.id);
    setReportToDelete(report);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteCommunityReport = async () => {
    if (!reportToDelete) return;

    console.log('Admin confirmed delete for community report:', reportToDelete.id);
    setIsDeleting(true);

    try {
      console.log('[API] Deleting community report via DELETE /api/community-reports/' + reportToDelete.id);
      await adminApiCall(`/api/community-reports/${reportToDelete.id}`, {
        method: 'DELETE',
        body: JSON.stringify({}),
      });
      console.log('[API] Community report deleted successfully');
      
      setShowDeleteConfirmModal(false);
      setReportToDelete(null);
      showAlert('Success', 'Community report deleted successfully');
      
      // Refresh the list
      loadCommunityReports();
    } catch (err: any) {
      console.error('[API] Error deleting community report:', err);
      showAlert('Error', err.message || 'Failed to delete community report');
      setShowDeleteConfirmModal(false);
      setReportToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteCommunityReport = () => {
    console.log('Admin cancelled delete');
    setShowDeleteConfirmModal(false);
    setReportToDelete(null);
  };

  const handleOpenNGCBLink = (url: string) => {
    console.log('User tapped NGCB link:', url);
    Linking.openURL(url).catch(err => {
      console.error('Error opening NGCB link:', err);
      showAlert('Error', 'Could not open link. Please try again.');
    });
  };

  const filteredCommunityReports = communityReports.filter(report => {
    if (!communitySearchQuery.trim()) return true;
    
    const query = communitySearchQuery.toLowerCase();
    const casinoMatch = report.casino.toLowerCase().includes(query);
    const manufacturerMatch = report.manufacturer?.toLowerCase().includes(query);
    const gameTitleMatch = report.gameTitle?.toLowerCase().includes(query);
    
    return casinoMatch || manufacturerMatch || gameTitleMatch;
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Admin Access',
            headerShown: true,
            headerBackTitle: 'Back',
          }} 
        />
        
        <View style={styles.pinContainer}>
          <IconSymbol 
            ios_icon_name="lock.fill" 
            android_material_icon_name="lock" 
            size={64} 
            color={colors.primary} 
          />
          <Text style={styles.pinTitle}>Admin Access</Text>
          <Text style={styles.pinSubtitle}>Enter PIN to continue</Text>

          <TextInput
            style={styles.pinInput}
            placeholder="Enter PIN"
            placeholderTextColor={colors.textSecondary}
            value={pinInput}
            onChangeText={setPinInput}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />

          {pinError ? (
            <Text style={styles.pinError}>{pinError}</Text>
          ) : null}

          <TouchableOpacity style={styles.pinButton} onPress={handlePinSubmit} disabled={isPinLoading}>
            {isPinLoading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.pinButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getTabTitle = () => {
    if (activeTab === 'analytics') return 'Usage Analytics';
    if (activeTab === 'ngcb') return 'NGCB Stats';
    if (activeTab === 'parsheets') return 'Par Sheets';
    if (activeTab === 'casino-directory') return 'Casino Directory';
    if (activeTab === 'community') return 'Community Moderation';
    return 'Jackpot Feed';
  };

  const getDisclaimer = () => {
    if (activeTab === 'analytics') {
      return 'Usage analytics and revenue tracking for SlotScout. All data is aggregated and anonymized.';
    }
    if (activeTab === 'ngcb') {
      return 'Official public aggregates from Nevada Gaming Control Board. Not a guarantee. For entertainment only.';
    }
    if (activeTab === 'parsheets') {
      return 'RTP ranges are public analyzed estimates from Wizard of Odds/manufacturers — actual set by casino. Not guarantees.';
    }
    if (activeTab === 'casino-directory') {
      return 'Crowdsourced from players — floors change daily. Not official casino data.';
    }
    if (activeTab === 'community') {
      return 'Review and moderate user-submitted community sightings and win reports. Deleted reports cannot be recovered.';
    }
    return 'Amounts from public trackers like Wizard of Vegas — change constantly. Not guarantees. Entertainment only.';
  };

  const deletingText = isDeleting ? 'Deleting...' : '';

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Admin Panel',
          headerShown: true,
          headerBackTitle: 'Back',
        }} 
      />

      {/* Custom Alert/Confirmation Modal */}
      <Modal visible={alertModal.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertMessage}>{alertModal.message}</Text>
            <View style={styles.alertActions}>
              {alertModal.onConfirm ? (
                <>
                  <TouchableOpacity style={styles.alertCancelButton} onPress={dismissAlert}>
                    <Text style={styles.alertCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.alertConfirmButton,
                      alertModal.confirmDestructive && styles.alertConfirmDestructive,
                    ]}
                    onPress={alertModal.onConfirm}
                  >
                    <Text style={styles.alertConfirmText}>{alertModal.confirmText || 'OK'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.alertOkButton} onPress={dismissAlert}>
                  <Text style={styles.alertOkText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Detailed Error Modal */}
      <Modal visible={errorModal.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertCard, styles.errorModalCard]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.alertTitle, styles.errorModalTitle]}>{errorModal.title}</Text>
            
            <View style={styles.errorDetailContainer}>
              <View style={styles.errorDetailRow}>
                <Text style={styles.errorDetailLabel}>Error Type:</Text>
                <Text style={styles.errorDetailValue}>{errorModal.errorType}</Text>
              </View>
              
              {errorModal.statusCode && (
                <View style={styles.errorDetailRow}>
                  <Text style={styles.errorDetailLabel}>Status Code:</Text>
                  <Text style={styles.errorDetailValue}>{errorModal.statusCode}</Text>
                </View>
              )}
              
              {errorModal.url && (
                <View style={styles.errorDetailRow}>
                  <Text style={styles.errorDetailLabel}>URL:</Text>
                  <Text style={[styles.errorDetailValue, styles.errorDetailUrl]} numberOfLines={2}>
                    {errorModal.url}
                  </Text>
                </View>
              )}
              
              <View style={styles.errorMessageContainer}>
                <Text style={styles.errorMessageLabel}>Details:</Text>
                <Text style={styles.errorMessageText}>{errorModal.message}</Text>
              </View>
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertCancelButton} onPress={dismissErrorModal}>
                <Text style={styles.alertCancelText}>Dismiss</Text>
              </TouchableOpacity>
              {errorModal.onRetry && (
                <TouchableOpacity
                  style={[styles.alertConfirmButton, { backgroundColor: colors.gold }]}
                  onPress={() => {
                    dismissErrorModal();
                    if (errorModal.onRetry) {
                      errorModal.onRetry();
                    }
                  }}
                >
                  <IconSymbol
                    ios_icon_name="arrow.clockwise"
                    android_material_icon_name="refresh"
                    size={18}
                    color={colors.background}
                  />
                  <Text style={styles.alertConfirmText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Community Report Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirmModal} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <IconSymbol
              ios_icon_name="trash.fill"
              android_material_icon_name="delete"
              size={36}
              color={colors.secondary}
            />
            <Text style={styles.alertTitle}>Delete this community sighting/note?</Text>
            <Text style={styles.alertMessage}>This cannot be undone. The report will be permanently removed from the community feed.</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelButton}
                onPress={handleCancelDeleteCommunityReport}
                disabled={isDeleting}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertConfirmButton, styles.alertConfirmDestructive]}
                onPress={handleConfirmDeleteCommunityReport}
                disabled={isDeleting}
              >
                <Text style={styles.alertConfirmText}>{deletingText || 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="gear" 
            android_material_icon_name="settings" 
            size={32} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Manage NGCB Stats, Par Sheets, Jackpots & Community</Text>
        </View>

        {/* Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
              onPress={() => { setActiveTab('analytics'); loadAnalyticsSummary(); loadLastUpdated(); }}
            >
              <IconSymbol 
                ios_icon_name="chart.line.uptrend.xyaxis" 
                android_material_icon_name="show-chart" 
                size={18} 
                color={activeTab === 'analytics' ? colors.background : colors.text} 
              />
              <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
                Analytics
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'ngcb' && styles.tabActive]}
              onPress={() => setActiveTab('ngcb')}
            >
              <IconSymbol 
                ios_icon_name="chart.bar.fill" 
                android_material_icon_name="bar-chart" 
                size={18} 
                color={activeTab === 'ngcb' ? colors.background : colors.text} 
              />
              <Text style={[styles.tabText, activeTab === 'ngcb' && styles.tabTextActive]}>
                NGCB Stats
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'parsheets' && styles.tabActive]}
              onPress={() => setActiveTab('parsheets')}
            >
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description" 
                size={18} 
                color={activeTab === 'parsheets' ? colors.background : colors.text} 
              />
              <Text style={[styles.tabText, activeTab === 'parsheets' && styles.tabTextActive]}>
                Par Sheets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'jackpots' && styles.tabActive]}
              onPress={() => setActiveTab('jackpots')}
            >
              <IconSymbol 
                ios_icon_name="dollarsign.circle.fill" 
                android_material_icon_name="attach-money" 
                size={18} 
                color={activeTab === 'jackpots' ? colors.background : colors.text} 
              />
              <Text style={[styles.tabText, activeTab === 'jackpots' && styles.tabTextActive]}>
                Jackpots
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'casino-directory' && styles.tabActive]}
              onPress={() => { setActiveTab('casino-directory'); loadCasinoMachines(); }}
            >
              <IconSymbol 
                ios_icon_name="building.2.fill" 
                android_material_icon_name="location-city" 
                size={18} 
                color={activeTab === 'casino-directory' ? colors.background : colors.text} 
              />
              <Text style={[styles.tabText, activeTab === 'casino-directory' && styles.tabTextActive]}>
                Casino Dir
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'community' && styles.tabActive]}
              onPress={() => { setActiveTab('community'); loadCommunityReports(); }}
            >
              <IconSymbol 
                ios_icon_name="person.3.fill" 
                android_material_icon_name="group" 
                size={18} 
                color={activeTab === 'community' ? colors.background : colors.text} 
              />
              <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>
                Community
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* App Icon Generator Link */}
        <TouchableOpacity 
          style={styles.iconGeneratorCard}
          onPress={() => router.push('/generate-icon')}
        >
          <View style={styles.iconGeneratorHeader}>
            <IconSymbol 
              ios_icon_name="photo.fill" 
              android_material_icon_name="image" 
              size={28} 
              color="#FFD700" 
            />
            <View style={styles.iconGeneratorTextContainer}>
              <Text style={styles.iconGeneratorTitle}>Generate App Icon</Text>
              <Text style={styles.iconGeneratorSubtitle}>Create a professional SlotScout icon with AI</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
            />
          </View>
        </TouchableOpacity>

        {/* Automation Section */}
        <View style={styles.automationCard}>
          <View style={styles.automationHeader}>
            <IconSymbol
              ios_icon_name="bolt.fill"
              android_material_icon_name="flash-on"
              size={28}
              color="#FFD700"
            />
            <View style={styles.automationHeaderText}>
              <Text style={styles.automationTitle}>Automated Updates</Text>
              <Text style={styles.automationSubtitle}>⚠️ Official/public sources only. Data accuracy not guaranteed.</Text>
            </View>
          </View>

          {/* Last Updated Timestamps */}
          <View style={styles.lastUpdatedContainer}>
            <View style={styles.lastUpdatedRow}>
              <Text style={styles.lastUpdatedLabel}>NGCB Stats:</Text>
              <Text style={styles.lastUpdatedValue}>{formatLastUpdated(lastUpdatedTimestamps.ngcbStats)}</Text>
            </View>
            <View style={styles.lastUpdatedRow}>
              <Text style={styles.lastUpdatedLabel}>Jackpots:</Text>
              <Text style={styles.lastUpdatedValue}>{formatLastUpdated(lastUpdatedTimestamps.jackpots)}</Text>
            </View>
            <View style={styles.lastUpdatedRow}>
              <Text style={styles.lastUpdatedLabel}>Par Sheets:</Text>
              <Text style={styles.lastUpdatedValue}>{formatLastUpdated(lastUpdatedTimestamps.parSheets)}</Text>
            </View>
            <View style={styles.lastUpdatedRow}>
              <Text style={styles.lastUpdatedLabel}>NGCB/UNLV Trends:</Text>
              <Text style={styles.lastUpdatedValue}>{formatLastUpdated(lastUpdatedTimestamps.ngcbUnlvTrends)}</Text>
            </View>
          </View>

          {/* Update NGCB Stats Button */}
          <TouchableOpacity
            style={[styles.automationButton, styles.automationButtonNGCB]}
            onPress={handleUpdateNGCBStats}
            disabled={isUpdatingNGCB || isRunningAllUpdates}
          >
            {isUpdatingNGCB ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar-chart" size={20} color="#000" />
            )}
            <Text style={styles.automationButtonText}>
              {isUpdatingNGCB ? 'Updating NGCB Stats...' : 'Update NGCB Stats Automatically'}
            </Text>
          </TouchableOpacity>

          {/* Update Jackpots Button */}
          <TouchableOpacity
            style={[styles.automationButton, styles.automationButtonJackpots]}
            onPress={handleUpdateJackpots}
            disabled={isUpdatingJackpots || isRunningAllUpdates}
          >
            {isUpdatingJackpots ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach-money" size={20} color="#000" />
            )}
            <Text style={styles.automationButtonText}>
              {isUpdatingJackpots ? 'Updating Jackpots...' : 'Update Jackpots Automatically'}
            </Text>
          </TouchableOpacity>

          {/* Update NGCB/UNLV Trends Button */}
          <TouchableOpacity
            style={[styles.automationButton, styles.automationButtonTrends]}
            onPress={handleUpdateNGCBUNLV}
            disabled={isUpdatingNGCBUNLV || isRunningAllUpdates}
          >
            {isUpdatingNGCBUNLV ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <IconSymbol ios_icon_name="chart.line.uptrend.xyaxis" android_material_icon_name="show-chart" size={20} color="#000" />
            )}
            <Text style={styles.automationButtonText}>
              {isUpdatingNGCBUNLV ? 'Updating NGCB/UNLV Trends...' : 'Update NGCB/UNLV Trends Automatically'}
            </Text>
          </TouchableOpacity>

          {/* Run All Updates Button */}
          <TouchableOpacity
            style={[styles.automationButton, styles.automationButtonAll]}
            onPress={handleRunAllUpdates}
            disabled={isUpdatingNGCB || isUpdatingJackpots || isUpdatingNGCBUNLV || isRunningAllUpdates}
          >
            {isRunningAllUpdates ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <IconSymbol ios_icon_name="arrow.clockwise.circle.fill" android_material_icon_name="sync" size={20} color="#000" />
            )}
            <Text style={[styles.automationButtonText, styles.automationButtonAllText]}>
              {isRunningAllUpdates ? 'Running All Updates...' : '🚀 Run All Updates'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick NGCB Links Section - Only show on NGCB Stats tab */}
        {activeTab === 'ngcb' && (
          <View style={styles.quickLinksCard}>
            <View style={styles.quickLinksHeader}>
              <IconSymbol 
                ios_icon_name="link.circle.fill" 
                android_material_icon_name="link" 
                size={24} 
                color="#FFD700" 
              />
              <Text style={styles.quickLinksTitle}>Quick NGCB Links</Text>
            </View>

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => handleOpenNGCBLink('https://gaming.nv.gov/index.aspx?page=2')}
            >
              <IconSymbol 
                ios_icon_name="doc.text" 
                android_material_icon_name="description" 
                size={18} 
                color="#FFD700" 
              />
              <Text style={styles.linkText}>Latest Monthly Revenue Report (PDF)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => handleOpenNGCBLink('https://gaming.nv.gov/index.aspx?page=2')}
            >
              <IconSymbol 
                ios_icon_name="tablecells" 
                android_material_icon_name="grid-on" 
                size={18} 
                color="#FFD700" 
              />
              <Text style={styles.linkText}>Nonrestricted Count Report (Excel)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkRow}
              onPress={() => handleOpenNGCBLink('https://gaming.nv.gov/index.aspx?page=1000')}
            >
              <IconSymbol 
                ios_icon_name="chart.line.uptrend.xyaxis" 
                android_material_icon_name="show-chart" 
                size={18} 
                color="#FFD700" 
              />
              <Text style={styles.linkText}>Historical Revenue & Statistics</Text>
            </TouchableOpacity>

            <View style={styles.linkNoteContainer}>
              <Text style={styles.linkNote}>
                Click to open official Nevada Gaming Control Board reports in browser. Copy-paste the latest hold % and machine counts into the table below.
              </Text>
            </View>
          </View>
        )}

        {activeTab !== 'community' && activeTab !== 'analytics' && (
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <IconSymbol 
              ios_icon_name="plus.circle.fill" 
              android_material_icon_name="add-circle" 
              size={24} 
              color={colors.background} 
            />
            <Text style={styles.addButtonText}>Add New Entry</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && analyticsSummary && (
          <>
            {/* Community Stats */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <IconSymbol
                  ios_icon_name="person.3.fill"
                  android_material_icon_name="group"
                  size={32}
                  color="#4A90E2"
                />
                <Text style={styles.analyticsTitle}>Community Stats</Text>
              </View>
              
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Community Reports</Text>
                  <Text style={styles.analyticsValue}>{(analyticsSummary.totalCommunityReports ?? 0).toLocaleString()}</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Casino Machines</Text>
                  <Text style={styles.analyticsValue}>{(analyticsSummary.totalCasinoMachines ?? 0).toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.analyticsTotalRow}>
                <Text style={styles.analyticsTotalLabel}>Active Casinos</Text>
                <Text style={styles.analyticsTotalValue}>{(analyticsSummary.activeCasinos ?? 0).toLocaleString()}</Text>
              </View>
            </View>

            {/* Last Data Update */}
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsHeader}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="access-time"
                  size={32}
                  color="#FFD700"
                />
                <Text style={styles.analyticsTitle}>Data Freshness</Text>
              </View>
              
              <View style={styles.eventBreakdownContainer}>
                <View style={styles.eventRow}>
                  <Text style={styles.eventLabel}>Last Data Update</Text>
                  <Text style={styles.eventValue}>
                    {analyticsSummary.lastDataUpdate
                      ? (() => {
                          try {
                            return new Date(analyticsSummary.lastDataUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          } catch {
                            return analyticsSummary.lastDataUpdate;
                          }
                        })()
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Community Moderation Tab Content */}
        {activeTab === 'community' && (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by casino, game, or brand..."
                placeholderTextColor={colors.textSecondary}
                value={communitySearchQuery}
                onChangeText={setCommunitySearchQuery}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={loadCommunityReports}>
                <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>

            {filteredCommunityReports.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="tray"
                  android_material_icon_name="inbox"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyStateText}>No community sightings to review</Text>
              </View>
            ) : (
              filteredCommunityReports.map(report => {
                const reportDate = new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const winAmountText = report.winAmount ? `$${report.winAmount.toLocaleString()}` : '';
                const gameInfo = [report.manufacturer, report.gameTitle].filter(Boolean).join(' - ') || 'Unknown Slot';
                
                return (
                  <View key={report.id} style={styles.communityReportCard}>
                    <View style={styles.communityReportHeader}>
                      <View style={styles.communityReportInfo}>
                        <Text style={styles.communityReportCasino}>{report.casino}</Text>
                        <Text style={styles.communityReportGame}>{gameInfo}</Text>
                        <Text style={styles.communityReportDate}>{reportDate}</Text>
                      </View>
                      {report.imageUrl && (
                        <Image
                          source={{ uri: report.imageUrl }}
                          style={styles.communityReportThumbnail}
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    {winAmountText && (
                      <View style={styles.communityReportWinRow}>
                        <Text style={styles.communityReportWinAmount}>{winAmountText}</Text>
                        {report.jackpotType && (
                          <Text style={styles.communityReportJackpotType}>{report.jackpotType}</Text>
                        )}
                      </View>
                    )}

                    {report.notes && (
                      <Text style={styles.communityReportNotes} numberOfLines={2}>{report.notes}</Text>
                    )}

                    <TouchableOpacity
                      style={styles.communityReportDeleteButton}
                      onPress={() => handleDeleteCommunityReport(report)}
                    >
                      <IconSymbol
                        ios_icon_name="trash.fill"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.background}
                      />
                      <Text style={styles.communityReportDeleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === 'ngcb' && stats.map(stat => {
          const isEditing = editingId === stat.id;
          
          if (isEditing) {
            return (
              <View key={stat.id} style={styles.editCard}>
                <Text style={styles.editLabel}>Month (YYYY-MM)</Text>
                <TextInput
                  style={styles.editInput}
                  value={formMonth}
                  onChangeText={setFormMonth}
                  placeholder="2025-12"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Location Area</Text>
                <TextInput
                  style={styles.editInput}
                  value={formArea}
                  onChangeText={setFormArea}
                  placeholder="Las Vegas Strip"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Denomination</Text>
                <TextInput
                  style={styles.editInput}
                  value={formDenom}
                  onChangeText={setFormDenom}
                  placeholder="All"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Avg RTP %</Text>
                <TextInput
                  style={styles.editInput}
                  value={formRtp}
                  onChangeText={setFormRtp}
                  placeholder="92.78"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.editLabel}>Hold %</Text>
                <TextInput
                  style={styles.editInput}
                  value={formHold}
                  onChangeText={setFormHold}
                  placeholder="7.22"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.editLabel}>Number of Machines</Text>
                <TextInput
                  style={styles.editInput}
                  value={formMachines}
                  onChangeText={setFormMachines}
                  placeholder="35336"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />

                <Text style={styles.editLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="December 2025 NGCB report"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={() => handleSaveEdit(stat.id)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          const displayMonth = stat.reportMonth;
          const displayArea = stat.locationArea;
          const displayDenom = stat.denomination;
          const displayRtp = `${parseFloat(String(stat.avgRtpPercent)).toFixed(2)}%`;
          const displayHold = `${parseFloat(String(stat.holdPercent)).toFixed(2)}%`;
          const displayMachines = parseInt(String(stat.numMachines), 10).toLocaleString();

          return (
            <View key={stat.id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statInfo}>
                  <Text style={styles.statMonth}>{displayMonth}</Text>
                  <Text style={styles.statArea}>{displayArea}</Text>
                  <Text style={styles.statDenom}>{displayDenom}</Text>
                </View>
                <View style={styles.statActions}>
                  <TouchableOpacity onPress={() => handleEdit(stat)}>
                    <IconSymbol 
                      ios_icon_name="pencil.circle.fill" 
                      android_material_icon_name="edit" 
                      size={28} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(stat.id)}>
                    <IconSymbol 
                      ios_icon_name="trash.circle.fill" 
                      android_material_icon_name="delete" 
                      size={28} 
                      color={colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statDetails}>
                <View style={styles.statDetailItem}>
                  <Text style={styles.statDetailLabel}>RTP</Text>
                  <Text style={styles.statDetailValue}>{displayRtp}</Text>
                </View>
                <View style={styles.statDetailItem}>
                  <Text style={styles.statDetailLabel}>Hold</Text>
                  <Text style={styles.statDetailValue}>{displayHold}</Text>
                </View>
                <View style={styles.statDetailItem}>
                  <Text style={styles.statDetailLabel}>Machines</Text>
                  <Text style={styles.statDetailValue}>{displayMachines}</Text>
                </View>
              </View>

              {stat.notes && (
                <Text style={styles.statNotes}>{stat.notes}</Text>
              )}
            </View>
          );
        })}

        {activeTab === 'parsheets' && parSheets.map(sheet => {
          const isEditing = editingId === sheet.id;
          
          if (isEditing) {
            return (
              <View key={sheet.id} style={styles.editCard}>
                <Text style={styles.editLabel}>Game Title *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formGameTitle}
                  onChangeText={setFormGameTitle}
                  placeholder="Buffalo Gold"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Brand *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formBrand}
                  onChangeText={setFormBrand}
                  placeholder="Aristocrat"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>RTP Range Low (%) *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formRtpLow}
                  onChangeText={setFormRtpLow}
                  placeholder="85"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />

                <Text style={styles.editLabel}>RTP Range High (%) *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formRtpHigh}
                  onChangeText={setFormRtpHigh}
                  placeholder="96"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />

                <Text style={styles.editLabel}>Volatility *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formVolatility}
                  onChangeText={setFormVolatility}
                  placeholder="High"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Typical Denominations *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formTypicalDenoms}
                  onChangeText={setFormTypicalDenoms}
                  placeholder="1¢-5¢"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Notes *</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={formParNotes}
                  onChangeText={setFormParNotes}
                  placeholder="High volatility link game; casino config varies"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.editLabel}>Source Link (Optional)</Text>
                <TextInput
                  style={styles.editInput}
                  value={formSourceLink}
                  onChangeText={setFormSourceLink}
                  placeholder="https://wizardofodds.com/games/slots/"
                  placeholderTextColor={colors.textSecondary}
                />

                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={() => handleSaveEdit(sheet.id)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          const displayRtpRange = `${sheet.rtpRangeLow}% - ${sheet.rtpRangeHigh}%`;

          return (
            <View key={sheet.id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statInfo}>
                  <Text style={styles.statMonth}>{sheet.brand}</Text>
                  <Text style={styles.statArea}>{sheet.gameTitle}</Text>
                  <Text style={styles.statDenom}>{sheet.volatility} Volatility</Text>
                </View>
                <View style={styles.statActions}>
                  <TouchableOpacity onPress={() => handleEditParSheet(sheet)}>
                    <IconSymbol 
                      ios_icon_name="pencil.circle.fill" 
                      android_material_icon_name="edit" 
                      size={28} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(sheet.id)}>
                    <IconSymbol 
                      ios_icon_name="trash.circle.fill" 
                      android_material_icon_name="delete" 
                      size={28} 
                      color={colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statDetails}>
                <View style={styles.statDetailItem}>
                  <Text style={styles.statDetailLabel}>RTP Range</Text>
                  <Text style={styles.statDetailValue}>{displayRtpRange}</Text>
                </View>
                <View style={styles.statDetailItem}>
                  <Text style={styles.statDetailLabel}>Denoms</Text>
                  <Text style={styles.statDetailValue}>{sheet.typicalDenoms}</Text>
                </View>
              </View>

              <Text style={styles.statNotes}>{sheet.notes}</Text>
            </View>
          );
        })}

        {activeTab === 'jackpots' && jackpots.map(jackpot => {
          const isEditing = editingId === jackpot.id;
          
          if (isEditing) {
            return (
              <View key={jackpot.id} style={styles.editCard}>
                <Text style={styles.editLabel}>Jackpot Name *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formJackpotName}
                  onChangeText={setFormJackpotName}
                  placeholder="Megabucks $1 Nevada"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Current Amount ($) *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formAmount}
                  onChangeText={setFormAmount}
                  placeholder="10319410"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                />

                <Text style={styles.editLabel}>Location *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formLocation}
                  onChangeText={setFormLocation}
                  placeholder="Statewide Nevada (many Strip)"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Last Updated (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formLastUpdated}
                  onChangeText={setFormLastUpdated}
                  placeholder="2026-02-19"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Tracker Link *</Text>
                <TextInput
                  style={styles.editInput}
                  value={formTrackerLink}
                  onChangeText={setFormTrackerLink}
                  placeholder="https://wizardofvegas.com/jackpots/"
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={styles.editLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextArea]}
                  value={formJackpotNotes}
                  onChangeText={setFormJackpotNotes}
                  placeholder="Biggest statewide progressive"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={() => handleSaveEdit(jackpot.id)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          const displayAmount = `$${jackpot.currentAmount.toLocaleString('en-US')}`;
          const displayDate = new Date(jackpot.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return (
            <View key={jackpot.id} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={styles.statInfo}>
                  <Text style={styles.statMonth}>{jackpot.jackpotName}</Text>
                  <Text style={styles.statArea}>{displayAmount}</Text>
                  <Text style={styles.statDenom}>{jackpot.location}</Text>
                </View>
                <View style={styles.statActions}>
                  <TouchableOpacity onPress={() => handleEditJackpot(jackpot)}>
                    <IconSymbol 
                      ios_icon_name="pencil.circle.fill" 
                      android_material_icon_name="edit" 
                      size={28} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(jackpot.id)}>
                    <IconSymbol 
                      ios_icon_name="trash.circle.fill" 
                      android_material_icon_name="delete" 
                      size={28} 
                      color={colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statDetails}>
                <View style={styles.statDetailItem}>
                  <Text style={styles.statDetailLabel}>Updated</Text>
                  <Text style={styles.statDetailValue}>{displayDate}</Text>
                </View>
              </View>

              {jackpot.notes && (
                <Text style={styles.statNotes}>{jackpot.notes}</Text>
              )}
            </View>
          );
        })}

        {activeTab === 'casino-directory' && (
          <>
            <View style={styles.bulkInsertContainer}>
              <TouchableOpacity
                style={styles.bulkInsertButton}
                onPress={handleBulkInsertAristocrat}
                disabled={bulkInsertAristocratLoading}
              >
                {bulkInsertAristocratLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <IconSymbol ios_icon_name="arrow.down.circle.fill" android_material_icon_name="download" size={20} color={colors.background} />
                )}
                <Text style={styles.bulkInsertButtonText}>
                  {bulkInsertAristocratLoading ? 'Inserting...' : 'Bulk Insert Aristocrat'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bulkInsertButton, styles.bulkInsertButtonSecondary]}
                onPress={handleBulkInsertNonAristocrat}
                disabled={bulkInsertNonAristocratLoading}
              >
                {bulkInsertNonAristocratLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <IconSymbol ios_icon_name="arrow.down.circle.fill" android_material_icon_name="download" size={20} color={colors.background} />
                )}
                <Text style={styles.bulkInsertButtonText}>
                  {bulkInsertNonAristocratLoading ? 'Inserting...' : 'Bulk Insert Non-Aristocrat'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by game or brand..."
                placeholderTextColor={colors.textSecondary}
                value={casinoMachineSearchQuery}
                onChangeText={setCasinoMachineSearchQuery}
                onSubmitEditing={loadCasinoMachines}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchButton} onPress={loadCasinoMachines}>
                <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
            {casinoMachines.map(machine => {
              const isEditing = editingId === machine.id;

              if (isEditing) {
                return (
                  <View key={machine.id} style={styles.editCard}>
                    <Text style={styles.editLabel}>Casino Name *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={formCasinoName}
                      onChangeText={setFormCasinoName}
                      placeholder="MGM Grand"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.editLabel}>Brand *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={formMachineBrand}
                      onChangeText={setFormMachineBrand}
                      placeholder="Aristocrat"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.editLabel}>Game Title *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={formMachineGameTitle}
                      onChangeText={setFormMachineGameTitle}
                      placeholder="Buffalo Gold"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.editLabel}>Denomination *</Text>
                    <TextInput
                      style={styles.editInput}
                      value={formMachineDenom}
                      onChangeText={setFormMachineDenom}
                      placeholder="1¢"
                      placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.editLabel}>Photo URL (Optional)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={formMachinePhotoUrl}
                      onChangeText={setFormMachinePhotoUrl}
                      placeholder="https://..."
                      placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.editLabel}>Notes (Optional)</Text>
                    <TextInput
                      style={[styles.editInput, styles.editTextArea]}
                      value={formMachineNotes}
                      onChangeText={setFormMachineNotes}
                      placeholder="Additional notes..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                    />

                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingId(null)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveButton} onPress={() => handleSaveEdit(machine.id)}>
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              const lastSeenDate = new Date(machine.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <View key={machine.id} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <View style={styles.statInfo}>
                      <Text style={styles.statMonth}>{machine.casinoName}</Text>
                      <Text style={styles.statArea}>{machine.gameTitle}</Text>
                      <Text style={styles.statDenom}>{machine.brand} · {machine.denom}</Text>
                    </View>
                    <View style={styles.statActions}>
                      <TouchableOpacity onPress={() => handleEditCasinoMachine(machine)}>
                        <IconSymbol ios_icon_name="pencil.circle.fill" android_material_icon_name="edit" size={28} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(machine.id)}>
                        <IconSymbol ios_icon_name="trash.circle.fill" android_material_icon_name="delete" size={28} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.statDetails}>
                    <View style={styles.statDetailItem}>
                      <Text style={styles.statDetailLabel}>Last Seen</Text>
                      <Text style={styles.statDetailValue}>{lastSeenDate}</Text>
                    </View>
                  </View>

                  {machine.notes && (
                    <Text style={styles.statNotes}>{machine.notes}</Text>
                  )}
                </View>
              );
            })}
            {casinoMachines.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No machines found. Try searching or add a new entry.</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimer}>{getDisclaimer()}</Text>
        </View>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add New {getTabTitle()} Entry
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {activeTab === 'ngcb' && (
                <>
                  <Text style={styles.editLabel}>Month (YYYY-MM) *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formMonth}
                    onChangeText={setFormMonth}
                    placeholder="2025-12"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Location Area *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formArea}
                    onChangeText={setFormArea}
                    placeholder="Las Vegas Strip"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Denomination *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formDenom}
                    onChangeText={setFormDenom}
                    placeholder="All"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Avg RTP % *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formRtp}
                    onChangeText={setFormRtp}
                    placeholder="92.78"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.editLabel}>Hold % *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formHold}
                    onChangeText={setFormHold}
                    placeholder="7.22"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.editLabel}>Number of Machines *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formMachines}
                    onChangeText={setFormMachines}
                    placeholder="35336"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />

                  <Text style={styles.editLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.editInput, styles.editTextArea]}
                    value={formNotes}
                    onChangeText={setFormNotes}
                    placeholder="December 2025 NGCB report"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}

              {activeTab === 'parsheets' && (
                <>
                  <Text style={styles.editLabel}>Game Title *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formGameTitle}
                    onChangeText={setFormGameTitle}
                    placeholder="Buffalo Gold"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Brand *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formBrand}
                    onChangeText={setFormBrand}
                    placeholder="Aristocrat"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>RTP Range Low (%) *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formRtpLow}
                    onChangeText={setFormRtpLow}
                    placeholder="85"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />

                  <Text style={styles.editLabel}>RTP Range High (%) *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formRtpHigh}
                    onChangeText={setFormRtpHigh}
                    placeholder="96"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />

                  <Text style={styles.editLabel}>Volatility *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formVolatility}
                    onChangeText={setFormVolatility}
                    placeholder="High"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Typical Denominations *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formTypicalDenoms}
                    onChangeText={setFormTypicalDenoms}
                    placeholder="1¢-5¢"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Notes *</Text>
                  <TextInput
                    style={[styles.editInput, styles.editTextArea]}
                    value={formParNotes}
                    onChangeText={setFormParNotes}
                    placeholder="High volatility link game; casino config varies"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />

                  <Text style={styles.editLabel}>Source Link (Optional)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formSourceLink}
                    onChangeText={setFormSourceLink}
                    placeholder="https://wizardofodds.com/games/slots/"
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}

              {activeTab === 'casino-directory' && (
                <>
                  <Text style={styles.editLabel}>Casino Name *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formCasinoName}
                    onChangeText={setFormCasinoName}
                    placeholder="MGM Grand"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Brand *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formMachineBrand}
                    onChangeText={setFormMachineBrand}
                    placeholder="Aristocrat"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Game Title *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formMachineGameTitle}
                    onChangeText={setFormMachineGameTitle}
                    placeholder="Buffalo Gold"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Denomination *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formMachineDenom}
                    onChangeText={setFormMachineDenom}
                    placeholder="1¢"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Photo URL (Optional)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formMachinePhotoUrl}
                    onChangeText={setFormMachinePhotoUrl}
                    placeholder="https://..."
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.editInput, styles.editTextArea]}
                    value={formMachineNotes}
                    onChangeText={setFormMachineNotes}
                    placeholder="Additional notes..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}

              {activeTab === 'jackpots' && (
                <>
                  <Text style={styles.editLabel}>Jackpot Name *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formJackpotName}
                    onChangeText={setFormJackpotName}
                    placeholder="Megabucks $1 Nevada"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Current Amount ($) *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formAmount}
                    onChangeText={setFormAmount}
                    placeholder="10319410"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.editLabel}>Location *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formLocation}
                    onChangeText={setFormLocation}
                    placeholder="Statewide Nevada (many Strip)"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Last Updated (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formLastUpdated}
                    onChangeText={setFormLastUpdated}
                    placeholder="2026-02-19"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Tracker Link *</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formTrackerLink}
                    onChangeText={setFormTrackerLink}
                    placeholder="https://wizardofvegas.com/jackpots/"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={styles.editLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.editInput, styles.editTextArea]}
                    value={formJackpotNotes}
                    onChangeText={setFormJackpotNotes}
                    placeholder="Biggest statewide progressive"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
                onPress={handleSubmitAdd}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.saveButtonText}>Add Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  pinSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 32,
  },
  pinInput: {
    width: '100%',
    maxWidth: 200,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    letterSpacing: 8,
  },
  pinError: {
    fontSize: 14,
    color: colors.error,
    marginTop: 12,
  },
  pinButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 24,
  },
  pinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  tabScrollView: {
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  tabTextActive: {
    color: colors.background,
  },
  iconGeneratorCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  iconGeneratorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconGeneratorTextContainer: {
    flex: 1,
  },
  iconGeneratorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  iconGeneratorSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  quickLinksCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quickLinksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  quickLinksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#FFD700',
    textDecorationLine: 'underline',
    flex: 1,
  },
  linkNoteContainer: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linkNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  loadingOverlay: {
    padding: 20,
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statInfo: {
    flex: 1,
  },
  statMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statArea: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  statDenom: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
  },
  editCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  editInput: {
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.cardHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  disclaimerCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
  bulkInsertContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  bulkInsertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  bulkInsertButtonSecondary: {
    backgroundColor: '#2F4F4F',
    borderColor: '#4682B4',
  },
  bulkInsertButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  // Alert/Confirmation Modal styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  alertMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.cardHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  alertCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  alertConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  alertConfirmDestructive: {
    backgroundColor: colors.error,
  },
  alertConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  alertOkButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  alertOkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
  },
  // Detailed Error Modal styles
  errorModalCard: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  errorModalTitle: {
    color: colors.error,
  },
  errorDetailContainer: {
    width: '100%',
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  errorDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  errorDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 0,
    minWidth: 90,
  },
  errorDetailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.error,
    flex: 1,
    textAlign: 'right',
  },
  errorDetailUrl: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  errorMessageContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorMessageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  errorMessageText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
  },
  // Automation styles
  automationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  automationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  automationHeaderText: {
    flex: 1,
  },
  automationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  automationSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  lastUpdatedContainer: {
    backgroundColor: colors.cardHighlight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  lastUpdatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdatedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  lastUpdatedValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  automationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  automationButtonNGCB: {
    backgroundColor: '#4A90E2',
  },
  automationButtonJackpots: {
    backgroundColor: '#27AE60',
  },
  automationButtonTrends: {
    backgroundColor: '#9B59B6',
  },
  automationButtonAll: {
    backgroundColor: '#FFD700',
  },
  automationButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  automationButtonAllText: {
    fontSize: 16,
  },
  // Community Moderation styles
  communityReportCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  communityReportInfo: {
    flex: 1,
    marginRight: 12,
  },
  communityReportCasino: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  communityReportGame: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  communityReportDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  communityReportThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.cardHighlight,
  },
  communityReportWinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  communityReportWinAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  communityReportJackpotType: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  communityReportNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  communityReportDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  communityReportDeleteButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.background,
  },
  // Analytics styles
  analyticsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  analyticsItem: {
    flex: 1,
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  analyticsTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  analyticsTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  analyticsTotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  eventBreakdownContainer: {
    gap: 12,
  },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardHighlight,
    borderRadius: 10,
    padding: 14,
  },
  eventLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  eventValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
});
