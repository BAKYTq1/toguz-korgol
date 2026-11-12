import { Fragment } from 'react';
import ui from './ui.module.css';

/** Paragraphs separated by blank lines, with **bold** spans. Built as elements, never as HTML. */
export default function RichText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`${ui.rich} ${className}`}>
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i}>
          {paragraph.split(/\*\*(.+?)\*\*/g).map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : <Fragment key={j}>{part}</Fragment>,
          )}
        </p>
      ))}
    </div>
  );
}
