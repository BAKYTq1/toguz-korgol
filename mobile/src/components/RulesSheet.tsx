import { StyleSheet, Text } from 'react-native';
import Sheet, { sheetStyles } from './Sheet';
import { t, type Lang } from '../shared';
import { colors, fonts } from '../theme';

/** Renders the shared rules text, where **bold** marks each section name. */
export default function RulesSheet({ visible, lang, onClose }: { visible: boolean; lang: Lang; onClose: () => void }) {
  const paragraphs = t(lang, 'rulesText').split('\n\n').filter(Boolean);
  return (
    <Sheet visible={visible} title={t(lang, 'rulesTitle')} onClose={onClose} closeLabel={t(lang, 'rulesClose')}>
      {paragraphs.map((paragraph, i) => (
        <Text key={i} style={[sheetStyles.text, styles.paragraph]}>
          {paragraph.split(/(\*\*.+?\*\*)/g).filter(Boolean).map((part, j) =>
            part.startsWith('**')
              ? <Text key={j} style={styles.bold}>{part.slice(2, -2)}</Text>
              : <Text key={j}>{part}</Text>,
          )}
        </Text>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  paragraph: { marginTop: 12 },
  bold: { fontFamily: fonts.bold, color: colors.gold },
});
