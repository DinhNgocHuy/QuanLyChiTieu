import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Section, Separator } from '../../components/common';
import { useInvestments } from '../../contexts/InvestmentContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Investment } from '../../types/Investment';
import { seedInvestmentData } from '../../utils/seedData';

const screenWidth = Dimensions.get('window').width;

const investmentTypes = [
  // Income Types
  { label: '💰 Lương', value: 'salary', category: 'income' },
  { label: '🎯 Thưởng', value: 'bonus', category: 'income' },
  { label: '💼 Nhiệm vụ', value: 'commission', category: 'income' },
  { label: '🖥️ Freelance', value: 'freelance', category: 'income' },
  { label: '💳 Cổ tức', value: 'dividend', category: 'income' },
  { label: '🏦 Lãi ngân hàng', value: 'interest', category: 'income' },
  { label: '🏠 Thu nhập cho thuê', value: 'rental', category: 'income' },

  // Investment Types
  { label: '📈 Quỹ tương hỗ', value: 'mutual_fund', category: 'investment' },
  { label: '📊 Cổ phiếu', value: 'stocks', category: 'investment' },
  { label: '🏛️ Trái phiếu', value: 'bonds', category: 'investment' },
  { label: '�️ Bất động sản', value: 'real_estate', category: 'investment' },
  { label: '₿ Tiền điện tử', value: 'crypto', category: 'investment' },

  // Savings Types
  { label: '🏦 Tiền gửi cố định', value: 'fixed_deposit', category: 'savings' },
  { label: '🛡️ Bảo hiểm', value: 'insurance', category: 'savings' },
  { label: '💼 Khác', value: 'other', category: 'income' },
];

const frequencyOptions = [
  { label: 'Hàng Tháng', value: 'monthly' },
  { label: 'Hàng Quý', value: 'quarterly' },
  { label: 'Hàng Năm', value: 'yearly' },
];

// Helper function to get category color
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'income': return '#22C55E'; // Green
    case 'investment': return '#3B82F6'; // Blue  
    case 'savings': return '#F59E0B'; // Orange
    default: return '#6B7280'; // Gray
  }
};

// Helper function to get category from investment (handles legacy data)
const getInvestmentCategory = (investment: Investment) => {
  if (investment.category) return investment.category;

  // Fallback for legacy data
  const incomeTypes = ['salary', 'bonus', 'commission', 'freelance', 'dividend', 'interest', 'rental', 'other'];
  const investmentTypes = ['mutual_fund', 'stocks', 'bonds', 'real_estate', 'crypto'];
  const savingsTypes = ['fixed_deposit', 'ppf', 'nps', 'insurance'];

  if (incomeTypes.includes(investment.type)) return 'Thu nhập';
  if (investmentTypes.includes(investment.type)) return 'Đầu tư';
  if (savingsTypes.includes(investment.type)) return 'Tiết kiệm';
  return 'income'; // default fallback
};

const InvestmentsScreen = () => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [trendType, setTrendType] = useState<'monthly' | 'yearly'>('monthly');
  const { colors } = useTheme();
  const {
    investments,
    lastRefresh,
    refreshInvestments,
    addInvestment,
    deleteInvestment,
    getMonthlyIncome,
    getInvestmentsByType,
    getInvestmentsByCategory,
    getTaxableIncome,
    getNonTaxableIncome,
    getRecurringIncome
  } = useInvestments();

  // UI States
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValues] = useState({
    cardScale: new Animated.Value(1),
    headerOpacity: new Animated.Value(0),
  });

  // Form states
  const [formData, setFormData] = useState({
    type: 'salary',
    title: '',
    amount: '',
    description: '',
    source: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
    taxable: true,
    category: 'income',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);


  // State for investment detail modal
  const [investmentDetailModalVisible, setInvestmentDetailModalVisible] = useState(false);
  // Extended type for modal to support recurringDates
  type InvestmentWithDates = Investment & { recurringDates?: string[] };
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentWithDates | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Animated.timing(animatedValues.headerOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshInvestments(true);
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddInvestment = async () => {
  if (!formData.title || !formData.amount) {
    Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    return;
  }
  if (!userId) {
    Alert.alert('Lỗi', 'Người dùng chưa xác thực');
    return;
  }

  setLoading(true);
  try {
    // Get category from type
    const selectedInvestmentType = investmentTypes.find(t => t.value === formData.type);
    const category = (selectedInvestmentType?.category || 'income') as Investment['category'];

    const amount = parseFloat(formData.amount);
    const startDate = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    let dateArr: string[] = [];

    if (formData.isRecurring) {
      // Generate all dates from startDate to today
      const dates: Date[] = [];
      let current = new Date(startDate);

      while (current <= today) {
        dates.push(new Date(current));
        if (formData.recurringFrequency === 'monthly') {
          current.setMonth(current.getMonth() + 1);
        } else if (formData.recurringFrequency === 'quarterly') {
          current.setMonth(current.getMonth() + 3);
        } else if (formData.recurringFrequency === 'yearly') {
          current.setFullYear(current.getFullYear() + 1);
        } else {
          break;
        }
      }

      if (dates.length === 0) {
        Alert.alert('Thông báo', 'Không có ngày nào để thêm.');
        return;
      }

      // Prevent duplicate recurring investments
      const alreadyExists = investments.some(inv =>
        inv.isRecurring &&
        inv.title === formData.title &&
        inv.amount === amount &&
        inv.type === formData.type &&
        inv.recurringFrequency === formData.recurringFrequency
      );

      if (alreadyExists) {
        Alert.alert('Đã tồn tại', 'Khoản đầu tư định kỳ này đã được thêm.');
        return;
      }

      dateArr = dates.map(d => d.toISOString().split('T')[0]); // Format: YYYY-MM-DD
    } else {
      // Single investment
      dateArr = [selectedDate.toISOString().split('T')[0]];
    }

    // Investment object
    const investmentData = {
      type: formData.type as Investment['type'],
      title: formData.title,
      amount: parseFloat(formData.amount),
      date: dateArr,
      description: formData.description,
      source: formData.source,
      isRecurring: formData.isRecurring,
      taxable: formData.taxable,
      category: category as Investment['category'],
      ... (formData.isRecurring && { recurringFrequency: formData.recurringFrequency as 'monthly' | 'quarterly' | 'yearly' })
    };

    if (formData.isRecurring) {
      investmentData.recurringFrequency = formData.recurringFrequency as Investment['recurringFrequency'];
    }

    await addInvestment(investmentData);

    setModalVisible(false);
    resetForm();
    Alert.alert('Thành công', 'Thêm khoản đầu tư thành công!');
  } catch (error) {
    console.error('Error adding investment:', error);
    Alert.alert('Lỗi', 'Không thể thêm khoản đầu tư. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      type: 'salary',
      title: '',
      amount: '',
      description: '',
      source: '',
      isRecurring: false,
      recurringFrequency: 'monthly',
      taxable: true,
      category: 'income',
    });
    setSelectedDate(new Date());
  };

  const getChartData = () => {
    const summary = getInvestmentsByType();
    const chartData = Object.entries(summary).map(([type, amount], index) => ({
      name: investmentTypes.find(t => t.value === type)?.label || type,
      amount,
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
    return chartData;
  };

  // Returns chart data for monthly or yearly trend, sorted chronologically
  const getTrendData = () => {
    if (trendType === 'monthly') {
      // Group by year-month
      const monthlyData: Record<string, number> = {};
      investments.forEach(investment => {
        // Use first date for normal, all dates for recurring
        const dates = Array.isArray(investment.date) ? investment.date : [investment.date];
        dates.forEach(dateStr => {
          const date = new Date(dateStr);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // e.g. 2025-07
          monthlyData[key] = (monthlyData[key] || 0) + investment.amount;
        });
      });
      // Sort keys chronologically
      const sortedKeys = Object.keys(monthlyData).sort((a, b) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime());
      // Show last 6 months
      const lastKeys = sortedKeys.slice(-6);
      // Only show month name (e.g., Jan, Feb)
      const labels = lastKeys.map(k => {
        const [year, month] = k.split('-');
        return new Date(Number(year), Number(month) - 1).toLocaleString('vi-VN', { month: 'short' });
      });
      const data = lastKeys.map(k => monthlyData[k]);
      return {
        labels: labels.length ? labels : ['Jan'],
        datasets: [{
          data: data.length ? data : [0],
          strokeWidth: 2,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        }],
      };
    } else {
      // Group by year
      const yearlyData: Record<string, number> = {};
      investments.forEach(investment => {
        const dates = Array.isArray(investment.date) ? investment.date : [investment.date];
        dates.forEach(dateStr => {
          const date = new Date(dateStr);
          const key = `${date.getFullYear()}`;
          yearlyData[key] = (yearlyData[key] || 0) + investment.amount;
        });
      });
      // Sort years
      const sortedYears = Object.keys(yearlyData).sort((a, b) => Number(a) - Number(b));
      // Show last 6 years
      const lastYears = sortedYears.slice(-6);
      return {
        labels: lastYears.length ? lastYears : ['2025'],
        datasets: [{
          data: lastYears.length ? lastYears.map(y => yearlyData[y]) : [0],
          strokeWidth: 2,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        }],
      };
    }
  };

  // Dynamically recalculate summary when investments change
  const getFinancialSummary = React.useCallback(() => {
    const categoryData = getInvestmentsByCategory();
    const taxableIncome = getTaxableIncome();
    const nonTaxableIncome = getNonTaxableIncome();
    const recurringIncome = getRecurringIncome();
    return {
      ...categoryData,
      taxableIncome,
      nonTaxableIncome,
      recurringIncome,
      totalWealth: categoryData.income + categoryData.investment + categoryData.savings,
    };
  }, [getInvestmentsByCategory, getTaxableIncome, getNonTaxableIncome, getRecurringIncome]);

  // Memoize financial summary and monthly income, update when investments change
  const financialSummary = React.useMemo(() => getFinancialSummary(), [getFinancialSummary]);
  const monthlyIncome = React.useMemo(() => getMonthlyIncome(), [getMonthlyIncome]);
  // Memoize chart data so it updates when investments change
  const pieChartData = React.useMemo(() => getChartData(), [getChartData, investments]);
  const trendChartData = React.useMemo(() => getTrendData(), [getTrendData, investments, trendType]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.headerContent, { opacity: animatedValues.headerOpacity }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>💼 Danh mục thu nhập và đầu tư</Text>
            <Text style={styles.headerSubtitle}>• Theo dõi danh mục thu nhập và đầu tư của bạn</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Stats Bar */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Tổng tài sản</Text>
            <Text style={styles.quickStatValue}>
              {typeof financialSummary.totalWealth === 'number' ? financialSummary.totalWealth.toLocaleString() : '0'}Đ
            </Text>
          </View>
          {/* <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Thu nhập</Text>
            <Text style={[styles.quickStatValue, { color: 'white' }]}>{typeof monthlyIncome === 'number' ? monthlyIncome.toLocaleString() : '0'}Đ</Text>
          </View> */}
          <View style={styles.statDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Cập nhật lần cuối</Text>
            <Text style={styles.quickStatValue}>
              {(() => {
                const minutes = Math.floor((Date.now() - lastRefresh) / 60000);
                if (minutes < 1) return "Vừa xong";
                if (minutes === 1) return "1 phút trước";
                if (minutes < 60) return `${minutes} phút trước`;
                const hours = Math.floor(minutes / 60);
                return hours === 1 ? "1h trước" : `${hours}h trước`;
              })()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.accent]}
            tintColor={colors.primary}
            title="Pull to refresh your portfolio..."
            titleColor={colors.textSecondary}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* Enhanced Summary Cards */}
        <Section title="📊 Tổng quan tài chính" >
          {/* Primary Stats Row */}
          <View style={styles.summaryGrid}>
            

            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="bar-chart" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Đầu tư</Text>
                <Text style={styles.enhancedSummaryAmount}>{typeof financialSummary.investment === 'number' ? financialSummary.investment.toLocaleString() : '0'}Đ</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Tiết kiệm</Text>
                <Text style={styles.enhancedSummaryAmount}>{typeof financialSummary.savings === 'number' ? financialSummary.savings.toLocaleString() : '0'}Đ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Secondary Stats Row */}
          <View style={styles.summaryGrid}>
            

            <TouchableOpacity style={[styles.enhancedSummaryCard, { backgroundColor: colors.card }]}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <Text style={styles.enhancedSummaryLabel}>Thu nhập</Text>
                <Text style={styles.enhancedSummaryAmount}>{typeof financialSummary.income === 'number' ? financialSummary.income.toLocaleString() : '0'}Đ</Text>
              </LinearGradient>
            </TouchableOpacity>            
          </View>

          {/* Tax Information Cards */}
          <View style={styles.summaryGrid}>
            <View style={[styles.taxCard, { backgroundColor: colors.surface }]}>
              <View style={styles.taxHeader}>
                <Ionicons name="receipt" size={20} color={colors.error} />
                <Text style={[styles.taxLabel, { color: colors.textSecondary }]}>Thu nhập chịu thuế</Text>
              </View>
              <Text style={[styles.taxAmount, { color: colors.error }]}>{typeof financialSummary.taxableIncome === 'number' ? financialSummary.taxableIncome.toLocaleString('vi-VN') : '0'}Đ</Text>
            </View>

            <View style={[styles.taxCard, { backgroundColor: colors.surface }]}>
              <View style={styles.taxHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.taxLabel, { color: colors.textSecondary }]}>Thu nhập miễn thuế</Text>
              </View>
              <Text style={[styles.taxAmount, { color: colors.success }]}>{typeof financialSummary.nonTaxableIncome === 'number' ? financialSummary.nonTaxableIncome.toLocaleString('vi-VN') : '0'}Đ</Text>
            </View>
          </View>
        </Section>

        {/* Charts */}
        {investments.length > 0 && (
          <>
            <Section title="📈 Phân phối đầu tư" subtitle="Phân tích theo danh mục">
              <Card>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>
              </Card>
            </Section>

            <Section title={trendType === 'monthly' ? "📊 Xu hướng đầu tư theo tháng" : "📊 Xu hướng đầu tư theo năm"} subtitle="Tăng trưởng đầu tư theo thời gian">
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ marginRight: 8, color: colors.textSecondary }}>Loại xu hướng:</Text>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: trendType === 'monthly' ? colors.primary : colors.surface,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() => setTrendType('monthly')}
                  >
                    <Text style={{ color: trendType === 'monthly' ? 'white' : colors.text }}>Theo tháng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: trendType === 'yearly' ? colors.primary : colors.surface,
                      borderRadius: 8,
                    }}
                    onPress={() => setTrendType('yearly')}
                  >
                    <Text style={{ color: trendType === 'yearly' ? 'white' : colors.text }}>Theo năm</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={trendChartData}
                    width={screenWidth - 64}
                    height={200}
                    chartConfig={{
                      backgroundColor: colors.card,
                      backgroundGradientFrom: colors.card,
                      backgroundGradientTo: colors.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                      labelColor: (opacity = 1) => colors.text,
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </Card>
            </Section>
          </>
        )}

        {/* Investment List */}
        <Section title="💰 Đầu tư gần đây" subtitle="Các danh mục mới nhất của bạn">
          {investments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="trending-up-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Chưa có khoản đầu tư nào
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
                Bắt đầu theo dõi khoản đầu tư của bạn bằng cách thêm mục nhập đầu tiên!
              </Text>
              {__DEV__ && (
                <Button
                  title="Thêm dữ liệu mẫu"
                  onPress={async () => {
                    try {
                      await seedInvestmentData();
                      await refreshInvestments();
                      Alert.alert('Success', 'Thêm dữ liệu mẫu thành công!');
                    } catch (error) {
                      console.error('Error seeding data:', error);
                      Alert.alert('Error', 'Failed to add sample data');
                    }
                  }}
                  variant="outline"
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          ) : (
            <View style={styles.listContainer}>
              {/* Group recurring investments by title and show only one entry for each recurring investment */}
              {(() => {
                const grouped: { [key: string]: Investment[] } = {};
                investments.forEach(inv => {
                  if (inv.isRecurring) {
                    const key = `${inv.title}|${inv.type}|${inv.amount}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(inv);
                  }
                });
                const nonRecurring = investments.filter(inv => !inv.isRecurring);
                const rendered = nonRecurring.map((investment, idx) => (
                  <TouchableOpacity
                    key={investment.id + '-' + idx}
                    onPress={() => {
                      setSelectedInvestment(investment);
                      setInvestmentDetailModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Card
                      style={[styles.investmentItem, { borderLeftColor: colors.primary }]}
                    >
                      <View style={styles.investmentInfo}>
                        <View style={styles.investmentHeader}>
                          <Text style={[styles.investmentTitle, { color: colors.text }]}>{investment.title}</Text>
                          <View style={styles.badgeContainer}>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(getInvestmentCategory(investment)) }]}>
                              <Text style={[styles.categoryBadgeText, { color: 'white' }]}>
                                {getInvestmentCategory(investment).toUpperCase()}
                              </Text>
                            </View>
                            {investment.taxable && (
                              <View style={[styles.taxBadge, { backgroundColor: colors.error }]}>
                                <Text style={[styles.taxBadgeText, { color: 'white' }]}>TAX</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.investmentType, { color: colors.primary }]}>
                          {investmentTypes.find(t => t.value === investment.type)?.label}
                        </Text>
                        {investment.source && (
                          <Text style={[styles.investmentSource, { color: colors.textSecondary }]}>
                            📍 {investment.source}
                          </Text>
                        )}
                        <Text style={[styles.investmentDate, { color: colors.textSecondary }]}>
                          📅 {Array.isArray(investment.date) ? new Date(investment.date[0]).toLocaleDateString('vi-VN') : new Date(investment.date).toLocaleDateString()}
                        </Text>
                        {investment.isRecurring && (
                          <Text style={[styles.recurringBadge, { color: colors.success }]}>
                            🔄 {investment.recurringFrequency}
                          </Text>
                        )}
                        {investment.description && (
                          <Text style={[styles.investmentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                            {investment.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.amountContainer}>
                        <Text style={[styles.investmentAmount, { color: colors.primary }]}>
                          {typeof investment.amount === 'number' ? investment.amount.toLocaleString('vi-VN') : '0'}Đ
                        </Text>
                        {investment.taxable && (
                          <Text style={[styles.taxInfo, { color: colors.error }]}>
                            + Thuế
                          </Text>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                ));
                // Render grouped recurring investments
                Object.entries(grouped).forEach(([key, group], idx) => {
                  const first = group[0];
                  rendered.push(
                    <TouchableOpacity
                      key={key + '-' + idx}
                      onPress={() => {
                        setSelectedInvestment({ ...first, recurringDates: Array.isArray(first.date) ? first.date : [first.date] });
                        setInvestmentDetailModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Card
                        style={[styles.investmentItem, { borderLeftColor: colors.primary }]}
                      >
                        <View style={styles.investmentInfo}>
                          <View style={styles.investmentHeader}>
                            <Text style={[styles.investmentTitle, { color: colors.text }]}>{first.title}</Text>
                            <View style={styles.badgeContainer}>
                              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(getInvestmentCategory(first)) }]}>
                                <Text style={[styles.categoryBadgeText, { color: 'white' }]}>
                                  {getInvestmentCategory(first).toUpperCase()}
                                </Text>
                              </View>
                              {first.taxable && (
                                <View style={[styles.taxBadge, { backgroundColor: colors.error }]}>
                                  <Text style={[styles.taxBadgeText, { color: 'white' }]}>TAX</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text style={[styles.investmentType, { color: colors.primary }]}>
                            {investmentTypes.find(t => t.value === first.type)?.label}
                          </Text>
                          {first.source && (
                            <Text style={[styles.investmentSource, { color: colors.textSecondary }]}>
                              📍 {first.source}
                            </Text>
                          )}
                          {/* Show user selected date to present */}
                          <Text style={[styles.investmentDate, { color: colors.textSecondary }]}>
                            📅 {Array.isArray(first.date) ? new Date(first.date[0]).toLocaleDateString() : new Date(first.date).toLocaleDateString()} to {Array.isArray(first.date) ? new Date(first.date[first.date.length - 1]).toLocaleDateString() : new Date(first.date).toLocaleDateString()}
                          </Text>
                          <Text style={[styles.recurringBadge, { color: colors.success }]}>
                            🔄 {first.recurringFrequency}
                          </Text>
                          {first.description && (
                            <Text style={[styles.investmentDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                              {first.description}
                            </Text>
                          )}
                        </View>
                        <View style={styles.amountContainer}>
                          <Text style={[styles.investmentAmount, { color: colors.primary }]}>
                            {typeof first.amount === 'number' ? first.amount.toLocaleString('vi-VN') : '0'}Đ
                          </Text>
                          {first.taxable && (
                            <Text style={[styles.taxInfo, { color: colors.error }]}>
                              + Thuế
                            </Text>
                          )}
                        </View>
                      </Card>
                    </TouchableOpacity>
                  );
                });
                return rendered;
              })()}
            </View>
          )}
        </Section>

        <Separator height={32} />
      </ScrollView>

      {/* Add Investment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Thêm khoản đầu tư</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Loại</Text>
                <DropDownPicker
                  open={typeDropdownOpen}
                  value={formData.type}
                  items={investmentTypes}
                  setOpen={setTypeDropdownOpen}
                  setValue={(callback) => {
                    const value = callback(formData.type);
                    const selectedInvestmentType = investmentTypes.find(t => t.value === value);
                    const category = selectedInvestmentType?.category || 'income';
                    setFormData(prev => ({ ...prev, type: value, category: category }));
                  }}
                  style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  textStyle={{ color: colors.text }}
                  placeholderStyle={{ color: colors.placeholder }}
                  selectedItemLabelStyle={{ color: colors.text }}
                  listItemLabelStyle={{ color: colors.text }}
                  flatListProps={{
                    nestedScrollEnabled: true,
                    style: { backgroundColor: colors.surface },
                  }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="MODAL"
                  modalTitle="Chọn loại hình đầu tư"
                  modalAnimationType="slide"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Tiêu đề</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="Nhập tiêu đề đầu tư"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Số tiền</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="Nhập số tiền"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString('vi-VN')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Mô tả (tùy chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Nhập mô tả về khoản đầu tư (tùy chọn)"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Category Selection */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Danh mục</Text>
                <DropDownPicker
                  open={categoryDropdownOpen}
                  value={formData.category}
                  items={[
                    { label: 'Thu nhập', value: 'income' },
                    { label: 'Đầu tư', value: 'investment' },
                    { label: 'Tiết kiệm', value: 'savings' },
                  ]}
                  setOpen={setCategoryDropdownOpen}
                  setValue={(callback) => {
                    const value = callback(formData.category);
                    setFormData(prev => ({ ...prev, category: value }));
                  }}
                  style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  textStyle={{ color: colors.text }}
                  placeholderStyle={{ color: colors.placeholder }}
                  selectedItemLabelStyle={{ color: colors.text }}
                  listItemLabelStyle={{ color: colors.text }}
                  arrowIconStyle={{}}
                  tickIconStyle={{}}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="MODAL"
                  modalTitle="Chọn danh mục"
                  modalAnimationType="slide"
                  flatListProps={{
                    nestedScrollEnabled: true,
                  }}
                />
              </View>

              {/* Source Field */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nguồn</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.source}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, source: text }))}
                  placeholder="Ví dụ: Tên công ty, Nền tảng, v.v."
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              {/* Tax Information */}
              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setFormData(prev => ({ ...prev, taxable: !prev.taxable }))}
                >
                  <Ionicons
                    name={formData.taxable ? "checkbox" : "square-outline"}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>Thu nhập chịu thuế</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setFormData(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                >
                  <Ionicons
                    name={formData.isRecurring ? "checkbox" : "square-outline"}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>Đầu tư định kỳ</Text>
                </TouchableOpacity>
              </View>

              {formData.isRecurring && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Tần suất</Text>
                  <DropDownPicker
                    open={frequencyDropdownOpen}
                    value={formData.recurringFrequency}
                    items={frequencyOptions}
                    setOpen={setFrequencyDropdownOpen}
                    setValue={(callback) => {
                      const value = callback(formData.recurringFrequency);
                      setFormData(prev => ({ ...prev, recurringFrequency: value }));
                    }}
                    style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    textStyle={{ color: colors.text }}
                    placeholderStyle={{ color: colors.placeholder }}
                    selectedItemLabelStyle={{ color: colors.text }}
                    listItemLabelStyle={{ color: colors.text }}
                    arrowIconStyle={{}}
                    tickIconStyle={{}}
                    zIndex={2000}
                    zIndexInverse={2000}
                    listMode="MODAL"
                    modalTitle="Chọn tần suất"
                    modalAnimationType="slide"
                    flatListProps={{
                      nestedScrollEnabled: true,
                    }}
                  />
                </View>
              )}

              <Button
                title={loading ? "Đang thêm..." : "THÊM"}
                onPress={handleAddInvestment}
                disabled={loading}
                style={styles.submitButton}
              />

              <Separator height={32} />
            </ScrollView>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setSelectedDate(date);
            }}
          />
        )}
      </Modal>

      {/* Investment Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={investmentDetailModalVisible}
        onRequestClose={() => setInvestmentDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Chi tiết khoản đầu tư</Text>
              <TouchableOpacity onPress={() => setInvestmentDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selectedInvestment && (
              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                {selectedInvestment && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Tiêu đề</Text>
                      <Text style={[styles.input, { color: colors.text }]}>{selectedInvestment.title}</Text>
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Loại</Text>
                      <Text style={[styles.input, { color: colors.text }]}>{investmentTypes.find(t => t.value === selectedInvestment.type)?.label}</Text>
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Số tiền</Text>
                      <Text style={[styles.input, { color: colors.text }]}>
                        {typeof selectedInvestment.amount === 'number' ? selectedInvestment.amount.toLocaleString() : '0'}Đ
                      </Text>
                    </View>
                    {/* Show all dates for recurring investments */}
                    {selectedInvestment.isRecurring && Array.isArray(selectedInvestment.date) ? (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày tháng</Text>
                        <View>
                          {selectedInvestment.date.map((d: string, i: number) => (
                            <Text key={d + '-' + i} style={[styles.input, { color: colors.text }]}>
                              {new Date(d).toLocaleDateString('vi-VN')}
                            </Text>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Ngày</Text>
                        <Text style={[styles.input, { color: colors.text }]}>
                          {Array.isArray(selectedInvestment.date) ? new Date(selectedInvestment.date[0]).toLocaleDateString('vi-VN') : new Date(selectedInvestment.date).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                    )}
                    {selectedInvestment.source && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Nguồn</Text>
                        <Text style={[styles.input, { color: colors.text }]}>{selectedInvestment.source}</Text>
                      </View>
                    )}
                    {selectedInvestment.description && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Mô tả</Text>
                        <Text style={[styles.input, { color: colors.text }]}>{selectedInvestment.description}</Text>
                      </View>
                    )}
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Danh mục</Text>
                      <Text style={[styles.input, { color: colors.text }]}>{selectedInvestment.category}</Text>
                    </View>
                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Khoản Chịu thuế</Text>
                      <Text style={[styles.input, { color: colors.text }]}>{selectedInvestment.taxable ? 'Có' : 'Không'}</Text>
                    </View>
                    {selectedInvestment.isRecurring && (
                      <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Định kỳ</Text>
                        <Text style={[styles.input, { color: colors.text }]}>{selectedInvestment.recurringFrequency}</Text>
                      </View>
                    )}
                    <Button
                      title={deleting ? 'Đang xóa...' : 'Xóa khoản đầu tư'}
                      onPress={async () => {
                        if (!selectedInvestment || !selectedInvestment.id) return;
                        setDeleting(true);
                        try {
                          await deleteInvestment(selectedInvestment.id);
                          setInvestmentDetailModalVisible(false);
                          setSelectedInvestment(null);
                          await refreshInvestments(true);
                          Alert.alert('Đã xóa', 'Xóa khoản đầu tư thành công!');
                        } catch (error: any) {
                          Alert.alert('Lỗi', `Xóa khoản đầu tư thất bại: ${error?.message || String(error)}`);
                        } finally {
                          setDeleting(false);
                        }
                      }}
                      style={[styles.submitButton, { backgroundColor: colors.error }]
                      }
                      disabled={deleting}
                    />
                    <Separator height={32} />
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
  },
  listContainer: {
    gap: 12,
  },
  investmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  investmentType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  investmentDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  recurringBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  investmentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  taxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taxBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  investmentSource: {
    fontSize: 12,
    marginBottom: 4,
  },
  investmentDescription: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  taxInfo: {
    fontSize: 10,
    marginTop: 2,
  },
  emptyCard: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalForm: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 20,
  },

  // Enhanced UI Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },

  // Enhanced Summary Cards
  enhancedSummaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  enhancedSummaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  enhancedSummaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  summaryTrend: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Tax Cards
  taxCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  taxLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  taxAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taxNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Show More Card
  showMoreCard: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});

export default InvestmentsScreen;
