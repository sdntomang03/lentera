import React, { useEffect, useRef, useState } from 'react';
import { uploadContentImage } from '../../services/contentService';
import { plainTextFromRichText, sanitizeRichText } from '../../utils/richText';

interface RichTextEditorProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (html: string, plainText: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
  accent?: 'teal' | 'indigo';
  minHeight?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  placeholder,
  onChange,
  onUploadingChange,
  accent = 'teal',
  minHeight = 120,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const toolbarClass = accent === 'indigo'
    ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
    : 'border-teal-200 bg-teal-50 text-teal-900';

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeValue = sanitizeRichText(value);
    if (document.activeElement !== editor && editor.innerHTML !== safeValue) {
      editor.innerHTML = safeValue;
    }
    editor.dataset.empty = String(!plainTextFromRichText(safeValue) && !editor.querySelector('img'));
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || !editor) return;
    if (!savedRangeRef.current || !editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      savedRangeRef.current = range.cloneRange();
      editor.focus();
      return;
    }
    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
    editorRef.current?.focus();
  };

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    saveSelection();
    const html = sanitizeRichText(editor.innerHTML);
    const plainText = plainTextFromRichText(html);
    editor.dataset.empty = String(!plainText && !editor.querySelector('img'));
    onChange(html, plainText);
  };

  const runCommand = (command: string) => {
    restoreSelection();
    document.execCommand(command, false);
    saveSelection();
    emitChange();
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Gunakan gambar JPG, PNG, WebP, atau GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 2 MB.');
      return;
    }

    setError('');
    setIsUploading(true);
    onUploadingChange(true);
    try {
      const imageUrl = await uploadContentImage(file);
      restoreSelection();
      const selection = window.getSelection();
      if (!selection?.rangeCount || !editorRef.current) {
        throw new Error('Pilih posisi sisip gambar pada teks terlebih dahulu.');
      }
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = file.name.replace(/\.[^.]+$/, '') || 'Gambar soal';
      image.className = 'my-3 max-h-96 max-w-full rounded-xl object-contain';
      range.insertNode(image);
      range.setStartAfter(image);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      savedRangeRef.current = range.cloneRange();
      emitChange();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
      onUploadingChange(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700">{label}:</label>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className={`flex flex-wrap items-center gap-1 border-b px-2 py-1.5 ${toolbarClass}`}>
          {[
            { label: 'Tebal', command: 'bold', text: 'B', className: 'font-black' },
            { label: 'Miring', command: 'italic', text: 'I', className: 'italic' },
            { label: 'Garis bawah', command: 'underline', text: 'U', className: 'underline' },
            { label: 'Daftar poin', command: 'insertUnorderedList', text: '• Daftar', className: '' },
          ].map((item) => (
            <button
              key={item.command}
              type="button"
              title={item.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => runCommand(item.command)}
              className={`rounded-lg px-2.5 py-1 text-xs hover:bg-white ${item.className}`}
            >
              {item.text}
            </button>
          ))}
          <button
            type="button"
            disabled={isUploading}
            onMouseDown={(event) => {
              event.preventDefault();
              saveSelection();
            }}
            onClick={() => imageInputRef.current?.click()}
            className="rounded-lg px-2.5 py-1 text-xs font-bold hover:bg-white disabled:opacity-50"
          >
            {isUploading ? 'Mengunggah…' : 'Sisipkan gambar'}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelected}
            className="hidden"
          />
          <span className="ml-auto text-[10px] opacity-70">Maks. 2 MB</span>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          data-placeholder={placeholder}
          onInput={emitChange}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onBlur={saveSelection}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            emitChange();
          }}
          className="rich-text-editor p-3 text-xs leading-relaxed text-slate-900 focus:outline-none"
          style={{ minHeight }}
        />
      </div>
      {error && <p role="alert" className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  );
};
