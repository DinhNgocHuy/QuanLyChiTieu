import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, Separator } from '../components/common';
import { useTheme } from '../contexts/ThemeContext';

interface CalculatorInfoProps {
  onClose: () => void;
}

const CalculatorInfo: React.FC<CalculatorInfoProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const screenHeight = Dimensions.get('window').height;

  // Theme-aware color schemes for investment types
  const investmentColors = {
    lumpsum: { main: colors.primary, bg: colors.primary + '15' },
    sip: { main: colors.success, bg: colors.success + '15' },
    fd: { main: '#3B82F6', bg: '#3B82F615' },
    ppf: { main: '#059669', bg: '#05966915' },
    goal: { main: colors.warning, bg: colors.warning + '15' },
    emi: { main: '#EF4444', bg: '#EF444415' },
    formula1: { main: colors.primary, bg: colors.primary + '10' },
    formula2: { main: colors.success, bg: colors.success + '10' },
    formula3: { main: '#EF4444', bg: '#EF444410' },
    formula4: { main: '#3B82F6', bg: '#3B82F610' },
    formula5: { main: colors.warning, bg: colors.warning + '10' },
    formula6: { main: colors.accent, bg: colors.accent + '10' },
  };

  const InfoSection: React.FC<{ title: string; children: React.ReactNode }> = ({ 
    title, 
    children 
  }) => (
    <View style={styles.infoSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );

  const InvestmentCard: React.FC<{ 
    icon: string; 
    title: string; 
    description: string;
    features: string[];
    returns: string;
    risk: string;
    colorKey: keyof typeof investmentColors;
  }> = ({ 
    icon, 
    title, 
    description,
    features,
    returns,
    risk,
    colorKey
  }) => {
    const cardColors = investmentColors[colorKey];
    
    return (
      <Card style={[styles.investmentCard, { backgroundColor: cardColors.bg }]}>
        <View style={styles.investmentHeader}>
          <View style={[styles.investmentIconContainer, { backgroundColor: cardColors.main + '30' }]}>
            <Text style={[styles.investmentIcon, { color: cardColors.main }]}>{icon}</Text>
          </View>
          <View style={styles.investmentTitleContainer}>
            <Text style={[styles.investmentTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.investmentDescription, { color: colors.textSecondary }]}>
              {description}
            </Text>
          </View>
        </View>
        
        <Separator height={12} />
        
        <View style={styles.investmentStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lợi nhuận dự kiến</Text>
            <Text style={[styles.statValue, { color: cardColors.main }]}>{returns}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mức độ rủi ro</Text>
            <Text style={[styles.statValue, { color: cardColors.main }]}>{risk}</Text>
          </View>
        </View>
        
        <Separator height={12} />
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={cardColors.main} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const FormulaCard: React.FC<{ 
    title: string; 
    formula: string; 
    explanation: string[];
    colorKey: keyof typeof investmentColors;
  }> = ({ title, formula, explanation, colorKey }) => {
    const cardColors = investmentColors[colorKey];
    
    return (
      <Card style={[styles.formulaCard, { backgroundColor: cardColors.bg }]}>
        <Text style={[styles.formulaTitle, { color: colors.text }]}>{title}</Text>
        <View style={[styles.formulaBox, { 
          backgroundColor: cardColors.main + '20',
          borderColor: cardColors.main + '40'
        }]}>
          <Text style={[styles.formulaText, { color: cardColors.main }]}>{formula}</Text>
        </View>
        <Separator height={12} />
        <View style={styles.explanationContainer}>
          {explanation.map((item, index) => (
            <Text key={index} style={[styles.explanationText, { color: colors.textSecondary }]}>
              {item}
            </Text>
          ))}
        </View>
      </Card>
    );
  };

  const ConceptCard: React.FC<{ 
    icon: string; 
    title: string; 
    description: string;
    color: string;
  }> = ({ icon, title, description, color }) => (
    <View style={[styles.conceptCard, { 
      backgroundColor: colors.surface,
      borderColor: colors.primary + '20',
      borderWidth: 1,
    }]}>
      <View style={[styles.conceptIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.conceptTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.conceptDesc, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );

  const TipCard: React.FC<{ 
    tip: string; 
    category: string;
    color: string;
  }> = ({ tip, category, color }) => (
    <View style={[styles.tipCard, { 
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: color,
    }]}>
      <View style={styles.tipHeader}>
        <View style={[styles.tipBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.tipCategory, { color }]}>{category}</Text>
        </View>
      </View>
      <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
    </View>
  );

  return (
    <View style={styles.modalOverlay}>
      <View 
        style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.background,
            maxHeight: screenHeight * 0.95
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.modalHeader, { 
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary + '20'
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                📊 Hướng dẫn tính toán đầu tư đầy đủ
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Mọi thứ bạn cần biết về đầu tư
              </Text>
            </View>
            <Pressable 
              style={[styles.closeButton, { backgroundColor: colors.primary + '20' }]} 
              onPress={onClose}
            >
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Quick Overview */}
          <InfoSection title="🎯 Tổng quan về công cụ tính toán đầu tư">
            <Card>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Công cụ tính toán toàn diện của chúng tôi hỗ trợ 6 loại hình đầu tư, giúp bạn đưa ra quyết định tài chính sáng suốt. Dù bạn đang lên kế hoạch nghỉ hưu, mua nhà hay tích lũy tài sản, chúng tôi đều có những công cụ cần thiết.
                </Text>
                
                <Separator height={16} />
                
                <View style={styles.quickStats}>
                  <View style={[styles.quickStatItem, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.quickStatNumber, { color: colors.primary }]}>6</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.primary }]}>Công cụ tính toán</Text>
                  </View>
                  <View style={[styles.quickStatItem, { backgroundColor: colors.success + '15' }]}>
                    <Text style={[styles.quickStatNumber, { color: colors.success }]}>15+</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.success }]}>Công thức</Text>
                  </View>
                  <View style={[styles.quickStatItem, { backgroundColor: colors.warning + '15' }]}>
                    <Text style={[styles.quickStatNumber, { color: colors.warning }]}>100%</Text>
                    <Text style={[styles.quickStatLabel, { color: colors.warning }]}>Chính xác</Text>
                  </View>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Investment Types */}
          <InfoSection title="💰 Giải thích các loại hình đầu tư">
            <View style={styles.investmentTypesContainer}>
              <InvestmentCard
                icon="💰"
                title="Đầu tư trọn gói"
                description="Đầu tư một lần với tăng trưởng kép"
                features={[
                  "Đầu tư trả trước một lần",
                  "Tính toán lãi kép", 
                  "Tùy chọn kỳ hạn linh hoạt",
                  "Tốt nhất cho số tiền lớn"
                ]}
                returns="8-15%/năm"
                risk="Trung bình đến Cao"
                colorKey="lumpsum"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="📈"
                title="Đầu tư định kỳ"
                description="Đầu tư nhỏ hàng tháng để giảm rủi ro"
                features={[
                  "Đầu tư hàng tháng",
                  "Lợi ích của việc trung bình hóa chi phí",
                  "Tích lũy theo thời gian", 
                  "Bắt đầu với số tiền nhỏ"
                ]}
                returns="10-15%/năm"
                risk="Trung bình đến Cao"
                colorKey="sip"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🏦"
                title="Tiền gửi có kỳ hạn"
                description="Đầu tư an toàn với lãi suất cố định"
                features={[
                  "Bảo đảm vốn gốc",
                  "Lãi suất cố định",
                  "Lãi kép hàng quý",
                  "Phù hợp với các nhà đầu tư tránh rủi ro"
                ]}
                returns="5-7%/năm"
                risk="Rất Thấp"
                colorKey="fd"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🛡️"
                title="Quỹ hưu trí tự nguyện"
                description="Đầu tư dài hạn với lợi ích thuế"
                features={[
                  "Thời hạn khóa 15 năm",
                  "Khấu trừ thuế theo Mục 80C",
                  "Miễn thuế lai suất",
                  "Lãi suất do chính phủ xác định"
                ]}
                returns="7.1%/năm"
                risk="Rất Thấp"
                colorKey="ppf"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🎯"
                title="Kế hoạch dựa trên mục tiêu"
                description="Đầu tư theo mục tiêu tài chính cụ thể"
                features={[
                  "Lợi nhuận theo mục tiêu",  
                  "Tùy chỉnh theo thời gian và mục tiêu",
                  "Kế hoạch hóa tài chính",
                  "Biến ước mơ thành hiện thực"
                ]}
                returns="Có thể thay đổi"
                risk="Dựa trên mục tiêu"
                colorKey="goal"
              />
              
              <Separator height={16} />
              
              <InvestmentCard
                icon="🏠"
                title="Khoản trả hàng tháng"
                description="Tính toán các khoản trả góp hàng tháng và tổng lãi suất"
                features={[
                  "Tính toán EMI hàng tháng",
                  "Tổng số tiền lãi phải trả",
                  "Khấu hao khoản vay",
                  "Vay mua nhà, xe hơi, cá nhân"
                ]}
                returns="N/A"
                risk="Rui ro theo lãi suất"
                colorKey="emi"
              />
            </View>
          </InfoSection>

          <Separator height={24} />

          {/* Key Formulas */}
          <InfoSection title="🧮 Công thức tính toán các khoản đầu tư">
            <View style={styles.formulasContainer}>
              <FormulaCard
                title="Compound Interest"
                formula="A = P(1 + r/n)^(nt)"
                explanation={[
                  "A = Final amount",
                  "P = Principal (initial investment)", 
                  "r = Annual interest rate (decimal)",
                  "n = Compounding frequency per year",
                  "t = Time in years"
                ]}
                colorKey="formula1"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="SIP Future Value"
                formula="FV = PMT × [((1 + r)^n - 1) / r]"
                explanation={[
                  "FV = Future value of SIP",
                  "PMT = Monthly payment amount",
                  "r = Monthly interest rate",
                  "n = Total number of payments"
                ]}
                colorKey="formula2"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="EMI Calculation"
                formula="EMI = P × r × (1+r)^n / [(1+r)^n-1]"
                explanation={[
                  "EMI = Equated Monthly Installment",
                  "P = Principal loan amount",
                  "r = Monthly interest rate",
                  "n = Number of monthly installments"
                ]}
                colorKey="formula3"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="Simple Interest"
                formula="SI = P × r × t"
                explanation={[
                  "SI = Simple interest earned",
                  "P = Principal amount",
                  "r = Annual interest rate (decimal)",
                  "t = Time period in years"
                ]}
                colorKey="formula4"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="Real Rate of Return"
                formula="Real Rate = (1 + Nominal Rate) / (1 + Inflation) - 1"
                explanation={[
                  "Adjusts returns for inflation impact",
                  "Nominal Rate = Stated investment return",
                  "Inflation = Annual inflation rate",
                  "Real Rate = Actual purchasing power gain"
                ]}
                colorKey="formula5"
              />
              
              <Separator height={16} />
              
              <FormulaCard
                title="Rule of 72"
                formula="Years to Double = 72 / Interest Rate"
                explanation={[
                  "Quick way to estimate doubling time",
                  "Interest Rate = Annual return percentage",
                  "Example: At 12%, money doubles in 6 years",
                  "Useful for quick mental calculations"
                ]}
                colorKey="formula6"
              />
            </View>
          </InfoSection>

          <Separator height={24} />

          {/* Financial Concepts */}
          <InfoSection title="📚 Các khái niệm tài chính quan trọng">
            <Card>
              <View style={styles.sectionContent}>
                <View style={styles.conceptsGrid}>
                  <ConceptCard
                    icon="trending-up"
                    title="Lãi kép"
                    description="Lãi suất được tính trên lãi suất đã tích lũy, làm tăng giá trị đầu tư theo thời gian."
                    color={colors.success}
                  />
                  
                  <ConceptCard
                    icon="repeat"
                    title="Chi phi trung bình dựa trên thời gian"
                    description="Đầu tư định kỳ giúp giảm rủi ro thị trường bằng cách mua nhiều hơn khi giá thấp và ít hơn khi giá cao."
                    color={colors.primary}
                  />
                  
                  <ConceptCard
                    icon="shield-checkmark"
                    title="Rủi ro so với Lợi nhuận"
                    description="Lợi nhuận cao hơn thường đi kèm với rủi ro cao hơn. Đánh giá rủi ro trước khi đầu tư."
                    color={colors.warning}
                  />
                  
                  <ConceptCard
                    icon="time"
                    title="Giá trị thời gian của tiền"
                    description="Tiền ngày nay có giá trị hơn số tiền tương tự trong tương lai do tiềm năng sinh lời."
                    color={colors.accent}
                  />
                  
                  <ConceptCard
                    icon="pie-chart"
                    title="Đa dạng hóa"
                    description="Phân bổ đầu tư giữa các loại tài sản khác nhau để giảm rủi ro tổng thể."
                    color={colors.primary}
                  />
                  
                  <ConceptCard
                    icon="calculator"
                    title="Phân bổ tài sản"
                    description="Chia tài sản đầu tư giữa cổ phiếu, trái phiếu, tiền mặt và các loại tài sản khác để cân bằng rủi ro và lợi nhuận."
                    color={colors.success}
                  />
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Investment Strategies */}
          <InfoSection title="🎯 Chiến lược đầu tư thông minh">
            <View style={styles.strategiesContainer}>
              <TipCard
                category="Người mới bắt đầu"
                tip="Bắt đầu với số tiền nhỏ trong SIP để xây dựng kỷ luật đầu tư. Bắt đầu với quỹ tương hỗ cổ phiếu để tăng trưởng dài hạn."
                color={colors.success}
              />
              
              <TipCard
                category="Quỹ khẩn cấp"
                tip="Giữ 6-12 tháng chi phí trong các khoản đầu tư thanh khoản như tài khoản tiết kiệm hoặc quỹ thanh khoản trước khi đầu tư vào nơi khác."
                color={colors.warning}
              />
              
              <TipCard
                category="Dựa trên mục tiêu"
                tip="Xác định mục tiêu tài chính rõ ràng (như mua nhà, nghỉ hưu) và chọn công cụ đầu tư phù hợp với thời gian và rủi ro."
                color={colors.primary}
              />
              
              <TipCard
                category="Lập kế hoạch thuế"
                tip="Tận dụng các khoản đầu tư miễn thuế như PPF, ELSS và các khoản khấu trừ thuế theo Mục 80C để giảm gánh nặng thuế."
                color={colors.accent}
              />
              
              <TipCard
                category="Quản lý rủi ro"
                tip="Đa dạng hóa danh mục đầu tư vào nhiều loại tài sản và lĩnh vực. Đừng bỏ tất cả trứng vào một giỏ - hãy phân tán đầu tư."
                color={colors.primary}
              />
              
              <TipCard
                category="Dài hạn"
                tip="Hãy đầu tư dài hạn. Việc xác định thời điểm thị trường rất khó - thời gian ở trên thị trường quan trọng hơn việc xác định thời điểm thị trường."
                color={colors.success}
              />
            </View>
          </InfoSection>

          <Separator height={24} />

          {/* Expected Returns Guide */}
          <InfoSection title="📊 Hướng dẫn về lợi nhuận đầu tư">
            <Card>
              <View style={styles.sectionContent}>
                <View style={[styles.returnsTable, { 
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.primary + '20'
                }]}>
                  <View style={[styles.returnsHeader, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Đầu tư</Text>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Lợi nhuận</Text>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Rủi ro</Text>
                    <Text style={[styles.returnsHeaderText, { color: colors.text }]}>Thanh khoản</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Tài khoản tiết kiệm</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>3-4%</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Rất thấp</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Cao</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Tiền gửi cố định</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>5-7%</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Thấp</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Trung bình</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>PPF</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>7.1%</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Rất thấp</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Thấp</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Quỹ tương hỗ</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>6-9%</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Thấp-Trung bình</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Cao</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Quỹ cổ phiếu</Text>
                    <Text style={[styles.returnsCell, { color: colors.primary }]}>10-15%</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Cao</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Cao</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Cổ phiếu trực tiếp</Text>
                    <Text style={[styles.returnsCell, { color: colors.primary }]}>12-18%</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Rất cao</Text>
                    <Text style={[styles.returnsCell, { color: colors.success }]}>Cao</Text>
                  </View>
                  
                  <View style={[styles.returnsRow, { borderBottomColor: colors.primary + '10' }]}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Bất động sản</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>8-12%</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Trung bình</Text>
                    <Text style={[styles.returnsCell, { color: colors.error || '#EF4444' }]}>Rất thấp</Text>
                  </View>
                  
                  <View style={styles.returnsRow}>
                    <Text style={[styles.returnsCell, { color: colors.textSecondary }]}>Vàng</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>6-10%</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Trung bình</Text>
                    <Text style={[styles.returnsCell, { color: colors.warning }]}>Trung bình</Text>
                  </View>
                </View>
                
                <Separator height={16} />
                
                <View style={[styles.disclaimerBox, { backgroundColor: colors.warning + '10' }]}>
                  <Ionicons name="information-circle" size={16} color={colors.warning} />
                  <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                    Lợi nhuận là mức trung bình lịch sử và không được đảm bảo. Hiệu suất trong quá khứ không chỉ ra kết quả trong tương lai.
                  </Text>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Tax Implications */}
          <InfoSection title="💸 Ý nghĩa và kế hoạch về thuế">
            <Card>
              <View style={styles.sectionContent}>
                <View style={styles.taxContainer}>
                  <View style={[styles.taxCard, { 
                    backgroundColor: colors.success + '10',
                    borderColor: colors.success + '30',
                    borderWidth: 1,
                  }]}>
                    <Text style={[styles.taxTitle, { color: colors.success }]}>Đầu tư miễn thuế</Text>
                    <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>
                      PPF, EPF, Life Insurance, ELSS (after 3 years), NSC
                    </Text>
                  </View>
                  
                  <View style={[styles.taxCard, { 
                    backgroundColor: colors.warning + '10',
                    borderColor: colors.warning + '30',
                    borderWidth: 1,
                  }]}>
                    <Text style={[styles.taxTitle, { color: colors.warning }]}>Có thể khấu trừ thuế (80C)</Text>
                    <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>
                      PPF, ELSS, Life Insurance, NSC, FD (5-year), Home Loan Principal
                    </Text>
                  </View>
                  
                  <View style={[styles.taxCard, { 
                    backgroundColor: (colors.error || '#EF4444') + '10',
                    borderColor: (colors.error || '#EF4444') + '30',
                    borderWidth: 1,
                  }]}>
                    <Text style={[styles.taxTitle, { color: colors.error || '#EF4444' }]}>Đầu tư chịu thuế</Text>
                    <Text style={[styles.taxDesc, { color: colors.textSecondary }]}>
                      FD Interest, Mutual Fund Gains, Stock Trading, Real Estate
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={24} />

          {/* Important Disclaimers */}
          <InfoSection title="⚠️ Tuyên bố miễn trừ trách nhiệm quan trọng">
            <Card>
              <View style={[styles.warningBox, { 
                backgroundColor: (colors.error || '#EF4444') + '10',
                borderColor: (colors.error || '#EF4444') + '30'
              }]}>
                <Ionicons name="warning" size={20} color={colors.error || '#EF4444'} style={styles.warningIcon} />
                <View style={styles.warningContent}>
                  <Text style={[styles.warningTitle, { color: colors.error || '#EF4444' }]}>
                    Thông báo rủi ro đầu tư
                  </Text>
                  <Text style={[styles.warningText, { color: colors.text }]}>
                    • Tất cả các tính toán đều là ước tính dựa trên thông tin đầu vào của bạn{'\n'}
                    • Đầu tư thị trường phải chịu rủi ro thị trường{'\n'}
                    • Hiệu suất trong quá khứ không đảm bảo kết quả trong tương lai{'\n'}
                    • Hãy cân nhắc việc tham khảo ý kiến cố vấn tài chính để được tư vấn cá nhân{'\n'}
                    • Lạm phát có thể ảnh hưởng đến lợi nhuận thực tế theo thời gian{'\n'}
                    • Sự đa dạng hóa có ích nhưng không loại bỏ được rủi ro{'\n'}
                    • Bắt đầu sớm và đầu tư thường xuyên để có kết quả tốt nhất
                  </Text>
                </View>
              </View>
            </Card>
          </InfoSection>

          <Separator height={40} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  sectionContent: {
    padding: 16,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Investment Cards
  investmentTypesContainer: {
    gap: 0,
  },
  investmentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  investmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investmentIcon: {
    fontSize: 20,
  },
  investmentTitleContainer: {
    flex: 1,
  },
  investmentTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  investmentDescription: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  investmentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  featuresContainer: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },

  // Formula Cards
  formulasContainer: {
    gap: 0,
  },
  formulaCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  formulaTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  formulaBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  formulaText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  explanationContainer: {
    gap: 4,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: 'monospace',
  },

  // Concept Cards
  conceptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conceptCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  conceptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  conceptTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  conceptDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },

  // Strategy Tips
  strategiesContainer: {
    gap: 12,
  },
  tipCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipHeader: {
    marginBottom: 8,
  },
  tipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tipCategory: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Returns Table
  returnsTable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  returnsHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  returnsHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  returnsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  returnsCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Tax Section
  taxContainer: {
    gap: 12,
  },
  taxCard: {
    padding: 14,
    borderRadius: 12,
  },
  taxTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  taxDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Disclaimers
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
  },
  disclaimerText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default CalculatorInfo;