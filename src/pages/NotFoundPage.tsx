import { common } from '../platform/common';
import { usePlatformLang } from '../platform/LangContext';
import { Link } from '../platform/router';
import Shell from '../platform/ui/Shell';
import ui from '../platform/ui/ui.module.css';

export default function NotFoundPage() {
  const [lang] = usePlatformLang();
  return (
    <Shell>
      <section className={ui.stack}>
        <h1 className={ui.h1}>{common(lang, 'notFound')}</h1>
        <Link to="/" className={`${ui.btn} ${ui.primary}`} style={{ width: 'fit-content' }}>{common(lang, 'toHome')}</Link>
      </section>
    </Shell>
  );
}
