import React, { useState, useRef } from 'react';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder = "Write your content here...", required = false }) => {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  const insertAtCursor = (before, after = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange({ target: { value: newText } });
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatBold = () => insertAtCursor('**', '**');
  const formatItalic = () => insertAtCursor('*', '*');
  const formatUnderline = () => insertAtCursor('<u>', '</u>');
  const formatStrikethrough = () => insertAtCursor('~~', '~~');
  
  const insertHeading = (level) => {
    const prefix = '#'.repeat(level) + ' ';
    insertAtCursor(prefix);
  };

  const insertList = (type) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    
    let prefix;
    if (type === 'bullet') {
      prefix = '- ';
    } else if (type === 'number') {
      prefix = '1. ';
    }
    
    if (currentLine.trim() === '') {
      insertAtCursor(prefix);
    } else {
      // Insert at beginning of line
      const beforeLine = value.substring(0, lineStart);
      const afterLine = value.substring(lineEnd === -1 ? value.length : lineEnd);
      const newValue = beforeLine + prefix + currentLine + afterLine;
      onChange({ target: { value: newValue } });
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text:') || url;
      insertAtCursor(`[${text}](${url})`);
    }
  };

  const insertCode = () => insertAtCursor('`', '`');
  const insertCodeBlock = () => insertAtCursor('```\n', '\n```');

  const insertQuote = () => insertAtCursor('> ');

  const insertHorizontalRule = () => insertAtCursor('\n---\n');

  const formatPreview = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^1\. (.*$)/gim, '<li>$1</li>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={formatBold} title="Bold (Ctrl+B)" className="toolbar-btn">
            <i className="fas fa-bold"></i>
          </button>
          <button type="button" onClick={formatItalic} title="Italic (Ctrl+I)" className="toolbar-btn">
            <i className="fas fa-italic"></i>
          </button>
          <button type="button" onClick={formatUnderline} title="Underline (Ctrl+U)" className="toolbar-btn">
            <i className="fas fa-underline"></i>
          </button>
          <button type="button" onClick={formatStrikethrough} title="Strikethrough" className="toolbar-btn">
            <i className="fas fa-strikethrough"></i>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button type="button" onClick={() => insertHeading(1)} title="Heading 1" className="toolbar-btn">
            H1
          </button>
          <button type="button" onClick={() => insertHeading(2)} title="Heading 2" className="toolbar-btn">
            H2
          </button>
          <button type="button" onClick={() => insertHeading(3)} title="Heading 3" className="toolbar-btn">
            H3
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button type="button" onClick={() => insertList('bullet')} title="Bullet List" className="toolbar-btn">
            <i className="fas fa-list-ul"></i>
          </button>
          <button type="button" onClick={() => insertList('number')} title="Numbered List" className="toolbar-btn">
            <i className="fas fa-list-ol"></i>
          </button>
          <button type="button" onClick={insertQuote} title="Quote" className="toolbar-btn">
            <i className="fas fa-quote-right"></i>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button type="button" onClick={insertLink} title="Insert Link" className="toolbar-btn">
            <i className="fas fa-link"></i>
          </button>
          <button type="button" onClick={insertCode} title="Inline Code" className="toolbar-btn">
            <i className="fas fa-code"></i>
          </button>
          <button type="button" onClick={insertCodeBlock} title="Code Block" className="toolbar-btn">
            <i className="fas fa-file-code"></i>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button type="button" onClick={insertHorizontalRule} title="Horizontal Rule" className="toolbar-btn">
            <i className="fas fa-minus"></i>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button 
            type="button" 
            onClick={() => setIsPreview(!isPreview)} 
            title={isPreview ? "Edit" : "Preview"} 
            className={`toolbar-btn ${isPreview ? 'active' : ''}`}
          >
            <i className={`fas ${isPreview ? 'fa-edit' : 'fa-eye'}`}></i>
          </button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="editor-content">
        {isPreview ? (
          <div 
            className="editor-preview"
            dangerouslySetInnerHTML={{ __html: formatPreview(value) }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="editor-textarea"
            rows="15"
            required={required}
            onKeyDown={(e) => {
              // Handle keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                  case 'b':
                    e.preventDefault();
                    formatBold();
                    break;
                  case 'i':
                    e.preventDefault();
                    formatItalic();
                    break;
                  case 'u':
                    e.preventDefault();
                    formatUnderline();
                    break;
                  default:
                    break;
                }
              }
            }}
          />
        )}
      </div>

      {/* Format Helper */}
      <div className="editor-footer">
        <small className="text-muted">
          <i className="fas fa-info-circle"></i> Use the toolbar above or keyboard shortcuts: 
          <strong>Ctrl+B</strong> (Bold), <strong>Ctrl+I</strong> (Italic), <strong>Ctrl+U</strong> (Underline)
        </small>
      </div>
    </div>
  );
};

export default RichTextEditor;
