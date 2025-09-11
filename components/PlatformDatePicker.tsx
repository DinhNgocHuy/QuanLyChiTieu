import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PlatformDatePickerProps {
  value: Date;
  onChange: (event: any, date?: Date) => void;
  maximumDate?: Date;
}

const PlatformDatePicker = ({ value, onChange, maximumDate }: PlatformDatePickerProps) => {
  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value.toISOString().split('T')[0]}
        onChange={(e) => {
          const date = new Date(e.target.value);
          onChange(e, date);
        }}
        max={maximumDate?.toISOString().split('T')[0]}
        style={styles.webDatePicker}
      />
    );
  }

  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChange}
      maximumDate={maximumDate}
    />
  );
};

const styles = StyleSheet.create({
  webDatePicker: {
    padding: 8,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    width: '99%',
    marginTop: 12,
  }
});

export default PlatformDatePicker;