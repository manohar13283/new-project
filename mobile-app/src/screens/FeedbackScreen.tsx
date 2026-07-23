import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { api } from '../lib/api';
import { colors } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

const CATEGORIES = [
  { key: 'FOOD_QUALITY', label: 'Food Quality' },
  { key: 'TEA_QUALITY', label: 'Tea Quality' },
  { key: 'BREAKFAST_QUALITY', label: 'Breakfast Quality' },
  { key: 'CLEANLINESS', label: 'Cleanliness' },
  { key: 'STAFF_BEHAVIOUR', label: 'Staff Behaviour' },
  { key: 'WAITING_TIME', label: 'Waiting Time' },
  { key: 'SUGGESTIONS', label: 'Suggestions' },
];

export function FeedbackScreen({ route, navigation }: Props) {
  const { transactionId } = route.params;
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleCategory(key: string) {
    setCategories((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  }

  async function submit() {
    if (rating === 0) {
      Alert.alert('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/feedback', { transactionId, rating, comment, categories });
      navigation.navigate('Home');
    } catch {
      Alert.alert('Could not submit feedback', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>{t('rateYourMeal')}</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Text style={styles.star}>{n <= rating ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.tag, categories.includes(c.key) && styles.tagSelected]}
              onPress={() => toggleCategory(c.key)}
            >
              <Text style={[styles.tagText, categories.includes(c.key) && styles.tagTextSelected]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Comment</Text>
        <TextInput
          style={styles.commentBox}
          multiline
          numberOfLines={4}
          placeholder="Tell us more..."
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity style={styles.submitButton} disabled={submitting} onPress={submit}>
          <Text style={styles.submitButtonText}>{t('submit')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  star: { fontSize: 36 },
  label: { fontWeight: '700', marginBottom: 8, marginTop: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tag: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  tagSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: '#444' },
  tagTextSelected: { color: '#fff' },
  commentBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 12, padding: 12, textAlignVertical: 'top', minHeight: 100 },
  submitButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
